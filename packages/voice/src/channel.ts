import { observeStartup } from './startup'
import type { PcmFormat, VoiceChannel, VoiceChannelOptions, VoiceSocket } from './types'

const inputFormat = {
  format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16,
  endianness: 'little', frame_duration: 20, frame_size: 320, sample_format: 'signed_int16'
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value)
}

function browserSocket(): VoiceSocket {
  const url = new URL('/api/voice', globalThis.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const native = new WebSocket(url)
  const socket: VoiceSocket = {
    get binaryType() { return native.binaryType },
    set binaryType(value) { native.binaryType = value },
    get readyState() { return native.readyState },
    onopen: null, onmessage: null, onerror: null, onclose: null,
    send(data) { native.send(typeof data === 'string' ? data : data.slice().buffer) },
    close(code, reason) { native.close(code, reason) }
  }
  native.onopen = () => socket.onopen?.()
  native.onmessage = (event) => socket.onmessage?.({ data: event.data })
  native.onerror = () => socket.onerror?.()
  native.onclose = (event) => socket.onclose?.({ code: event.code, reason: event.reason })
  return socket
}

export function createVoiceChannel(options: VoiceChannelOptions): VoiceChannel {
  const tools = new Map(options.tools.map((tool) => [tool.name, tool]))
  if (tools.size !== options.tools.length) throw new Error('Duplicate voice tool name')
  let socket: VoiceSocket | null = null
  let state: 'new' | 'opening' | 'ready' | 'closed' = 'new'
  let openingFailed = false
  let sessionId: string | null = null
  let negotiatedFormat: PcmFormat | null = null
  let toolsRegistered = options.tools.length === 0
  let speaking = false
  let inputActive = false
  let interrupted = false
  let settleOpen: ((error: Error | null) => void) | null = null
  let handshakeTimer: ReturnType<typeof setTimeout> | null = null
  let removeAbortListener: (() => void) | null = null
  const calls = new Map<string | number, AbortController>()
  const completedCalls = new Set<string | number>()

  function emit(event: Parameters<typeof options.onEvent>[0]) {
    options.onEvent(event)
  }

  function send(value: object) {
    if (socket?.readyState === 1 && state !== 'closed') socket.send(JSON.stringify(value))
  }

  function finishOpen(error: Error | null) {
    if (handshakeTimer != null) clearTimeout(handshakeTimer)
    handshakeTimer = null
    const settle = settleOpen
    settleOpen = null
    settle?.(error)
  }

  function becomeReady() {
    if (state !== 'opening' || negotiatedFormat == null || !toolsRegistered) return
    state = 'ready'
    observeStartup(options.onStartup, 'channelReady', 'completed')
    finishOpen(null)
    emit({ type: 'ready', format: negotiatedFormat })
  }

  function close(code = 1000, reason = 'Closed by caller') {
    if (state === 'closed') return
    if (state === 'opening') observeStartup(options.onStartup, 'channelReady', openingFailed ? 'failed' : 'cancelled')
    state = 'closed'
    speaking = false
    inputActive = false
    removeAbortListener?.()
    removeAbortListener = null
    for (const controller of calls.values()) controller.abort()
    calls.clear()
    completedCalls.clear()
    finishOpen(new Error(reason))
    const oldSocket = socket
    socket = null
    if (oldSocket != null) {
      oldSocket.onopen = null
      oldSocket.onmessage = null
      oldSocket.onerror = null
      oldSocket.onclose = null
      oldSocket.close(code === 1000 ? 1000 : 4000, reason.slice(0, 100))
    }
    emit({ type: 'closed', code, reason })
  }

  function fail(code: 'connection' | 'protocol' | 'timeout', message: string) {
    if (state === 'closed') return
    openingFailed = state === 'opening'
    emit({ type: 'error', code, message })
    close(4000, message)
  }

  function requireReady() {
    if (state !== 'ready') throw new Error('Voice channel is not ready')
  }

  function rpc(id: string | number, result: object, error = false) {
    send({ type: 'mcp', payload: { jsonrpc: '2.0', id, [error ? 'error' : 'result']: result } })
  }

  async function handleMcp(payload: Record<string, unknown>) {
    const id = payload.id
    if (typeof id !== 'string' && typeof id !== 'number') return
    if (calls.has(id) || completedCalls.has(id)) return
    completedCalls.add(id)
    if (payload.method === 'initialize') {
      rpc(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'lie-browser', version: '0.1' } })
      return
    }
    if (payload.method === 'tools/list') {
      rpc(id, { tools: options.tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })), nextCursor: null })
      if (state === 'opening' && !toolsRegistered) observeStartup(options.onStartup, 'toolsList', 'completed')
      toolsRegistered = true
      becomeReady()
      return
    }
    const params = record(payload.params) ? payload.params : null
    const tool = typeof params?.name === 'string' ? tools.get(params.name) : null
    if (payload.method !== 'tools/call' || tool == null) {
      rpc(id, { code: -32601, message: 'Unknown method or tool' }, true)
      return
    }
    const controller = new AbortController()
    calls.set(id, controller)
    emit({ type: 'tool', state: 'start', name: tool.name })
    let timer: ReturnType<typeof setTimeout> | null = null
    let abort: (() => void) | null = null
    try {
      const text = await Promise.race([
        Promise.resolve().then(() => {
          if (controller.signal.aborted) throw new Error('Tool cancelled')
          return tool.execute(params?.arguments ?? {}, controller.signal)
        }),
        new Promise<never>((_, reject) => {
          abort = () => reject(new Error('Tool cancelled'))
          controller.signal.addEventListener('abort', abort, { once: true })
          timer = setTimeout(() => {
            reject(new Error('Tool timed out'))
            controller.abort()
          }, options.toolTimeoutMs ?? 10000)
        })
      ])
      if (state !== 'closed') rpc(id, { content: [{ type: 'text', text }], isError: false })
    } catch {
      if (state !== 'closed') {
        rpc(id, { content: [{ type: 'text', text: 'Tool unavailable' }], isError: true })
        emit({ type: 'error', code: 'tool', message: 'Voice tool failed or timed out' })
      }
    } finally {
      if (timer != null) clearTimeout(timer)
      if (abort != null) controller.signal.removeEventListener('abort', abort)
      calls.delete(id)
      if (state !== 'closed') emit({ type: 'tool', state: 'end', name: tool.name })
    }
  }

  function message(data: unknown) {
    if (state === 'closed') return
    if (data instanceof ArrayBuffer) {
      if (state !== 'ready' || !speaking || interrupted) return
      if (data.byteLength % 2 !== 0) return fail('protocol', 'Invalid PCM frame length')
      emit({ type: 'audio', data: new Uint8Array(data) })
      return
    }
    if (typeof data !== 'string') return fail('protocol', 'Unexpected WebSocket frame')
    let value: unknown
    try { value = JSON.parse(data) } catch { return fail('protocol', 'Invalid protocol JSON') }
    if (!record(value)) return fail('protocol', 'Invalid protocol message')
    if (value.type === 'hello') {
      if (state !== 'opening') return
      const audio = value.audio_params
      if (value.transport !== 'websocket' || !record(audio) || audio.format !== 'pcm' ||
          audio.channels !== 1 || audio.sample_rate !== 16000 ||
          (audio.bits_per_sample ?? audio.bit_depth ?? 16) !== 16) {
        return fail('protocol', 'Unsupported negotiated audio format; PCM16 mono 16kHz required')
      }
      observeStartup(options.onStartup, 'hello', 'completed')
      negotiatedFormat = { format: 'pcm', sampleRate: 16000, channels: 1, bitsPerSample: 16, frameDuration: 20 }
      sessionId = typeof value.session_id === 'string' ? value.session_id : null
      becomeReady()
      return
    }
    if (state === 'opening' && value.type === 'mcp' && record(value.payload) &&
        (value.payload.method === 'initialize' || value.payload.method === 'tools/list')) {
      void handleMcp(value.payload)
      return
    }
    if (state !== 'ready') return fail('protocol', 'Message received before ready')
    if (value.type === 'mcp' && record(value.payload)) void handleMcp(value.payload)
    if (value.type === 'stt' && typeof value.text === 'string') emit({ type: 'stt', text: value.text })
    if (value.type === 'tts') {
      if (value.state === 'start' && !speaking) {
        interrupted = false
        speaking = true
        emit({ type: 'tts', state: 'start', text: null })
      } else if (value.state === 'stop' && !interrupted && speaking) {
        speaking = false
        interrupted = value.is_aborted === true
        emit({ type: 'tts', state: 'stop', text: null, aborted: interrupted })
      } else if (value.state === 'sentence_start' && speaking && !interrupted && typeof value.text === 'string') {
        emit({ type: 'tts', state: 'sentence', text: value.text })
      }
    }
  }

  return {
    open({ signal } = {}) {
      if (state !== 'new') return Promise.reject(new Error('Voice channel can only be opened once'))
      if (signal?.aborted) {
        close()
        return Promise.reject(new DOMException('Aborted', 'AbortError'))
      }
      state = 'opening'
      observeStartup(options.onStartup, 'channelReady', 'started')
      return new Promise<void>((resolve, reject) => {
        settleOpen = (error) => error == null ? resolve() : reject(error)
        handshakeTimer = setTimeout(() => fail('timeout', 'Voice handshake timed out'), options.handshakeTimeoutMs ?? 10000)
        if (signal != null) {
          const abort = () => close(1000, 'Aborted')
          signal.addEventListener('abort', abort, { once: true })
          removeAbortListener = () => signal.removeEventListener('abort', abort)
        }
        try {
          observeStartup(options.onStartup, 'socket', 'started')
          socket = (options.createSocket ?? browserSocket)()
          socket.binaryType = 'arraybuffer'
          socket.onopen = () => {
            observeStartup(options.onStartup, 'socketOpen', 'completed')
            if (state === 'opening') send({ type: 'hello', version: 1, features: { mcp: true }, transport: 'websocket', audio_params: inputFormat })
          }
          socket.onmessage = (event) => message(event.data)
          socket.onerror = () => fail('connection', 'Voice connection failed')
          socket.onclose = (event) => {
            openingFailed = state === 'opening'
            close(event.code, event.reason)
          }
        } catch {
          fail('connection', 'Voice connection could not be opened')
        }
      })
    },
    startInput() {
      requireReady()
      if (inputActive) return
      inputActive = true
      interrupted = false
      send({ type: 'listen', session_id: sessionId, state: 'start', mode: options.listenMode ?? 'realtime',
        ...(options.voiceId == null ? {} : { agent_params: { voice: { id: options.voiceId } } }) })
    },
    input(data) {
      requireReady()
      if (!inputActive) throw new Error('Start input before sending PCM')
      if (data.byteLength !== 640) throw new Error('Input must be a 20ms PCM16 frame (640 bytes)')
      socket!.send(data)
    },
    stopInput() {
      requireReady()
      if (!inputActive) return
      inputActive = false
      send({ type: 'listen', session_id: sessionId, state: 'stop' })
    },
    interrupt() {
      requireReady()
      interrupted = true
      speaking = false
      send({ type: 'abort', session_id: sessionId, reason: 'wake_word_detected' })
      emit({ type: 'interrupted' })
    },
    close() { close() }
  }
}
