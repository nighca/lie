import { openMicrophone } from '../../../packages/voice/src/microphone'
import { createPcmPlayer } from '../../../packages/voice/src/player'

const button = document.querySelector<HTMLButtonElement>('#toggle')!
const status = document.querySelector<HTMLElement>('#status')!
const counts = document.querySelector<HTMLElement>('#counts')!
const transcript = document.querySelector<HTMLElement>('#transcript')!
let current: AbortController | null = null
let shutdown: () => void = () => {}

button.onclick = () => { if (current != null) shutdown(); else void start() }
document.addEventListener('visibilitychange', () => { if (document.hidden) shutdown() })
window.addEventListener('pagehide', () => shutdown())

async function start() {
  const abort = new AbortController()
  current = abort
  button.textContent = '结束实验'
  status.textContent = '准备语音，完成后再开口'
  transcript.textContent = ''
  const started = performance.now()
  const stats = { stt: 0, ttsStarts: 0, stops: 0, aborted: 0, contexts: 0, inputFrames: 0, outputFrames: 0, helloMs: 0, abortToPlayerStopMs: 0 }
  const history: { role: string; text: string }[] = []
  const context = new AudioContext()
  let answering = false
  let ready = false
  let toolsReady = false
  let uploading = false
  let playing = false
  let mic: Awaited<ReturnType<typeof openMicrophone>> | null = null
  const player = createPcmPlayer(context, () => { playing = false; if (!answering && !abort.signal.aborted) status.textContent = '正在聆听（麦克风开启）' })
  const socket = new WebSocket(`ws://${location.host}/voice`)
  socket.binaryType = 'arraybuffer'
  const display = () => { counts.textContent = JSON.stringify(stats, null, 2) }
  const append = (role: string, text: string) => {
    history.push({ role, text })
    const paragraph = document.createElement('p')
    paragraph.textContent = `${role === 'user' ? '你' : '测试员'}：${text}`
    transcript.append(paragraph)
  }
  const send = (message: object) => socket.send(JSON.stringify(message))
  const timer = setTimeout(() => stop('达到三分钟上限，麦克风已关闭'), 180000)
  function stop(message = '实验结束，麦克风已关闭') {
    if (abort.signal.aborted) return
    abort.abort(); clearTimeout(timer); socket.close(); void mic?.stop(); player.stop(); void context.close()
    if (current === abort) { current = null; button.textContent = '开始实验'; status.textContent = message }
  }
  shutdown = () => stop()
  socket.onopen = () => send({ type: 'hello', version: 1, transport: 'websocket', features: { mcp: true }, audio_params: {
    format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16, endianness: 'little', frame_duration: 20, frame_size: 320, sample_format: 'signed_int16'
  } })
  socket.onerror = () => stop('连接失败，麦克风已关闭')
  socket.onclose = () => stop('连接结束，麦克风已关闭')
  socket.onmessage = ({ data }) => {
    if (abort.signal.aborted) return
    try {
      if (data instanceof ArrayBuffer) {
        stats.outputFrames++
        if (answering) { playing = true; player.enqueue(new Uint8Array(data), { format: 'pcm', sampleRate: 16000, channels: 1, bitsPerSample: 16, frameDuration: 20 }) }
        display(); return
      }
      const event = JSON.parse(data)
      if (event.type === 'hello') {
        if (event.audio_params?.format !== 'pcm' || event.audio_params.sample_rate !== 16000 || event.audio_params.channels !== 1) throw new Error('Unsupported audio')
        stats.helloMs = Math.round(performance.now() - started); ready = true
      }
      if (event.type === 'stt') { stats.stt++; append('user', event.text); status.textContent = '已识别，等待回答（麦克风仍开）' }
      if (event.type === 'tts') {
        if (event.state === 'start') { stats.ttsStarts++; answering = true; status.textContent = '正在回答，可以直接说话打断' }
        if (event.state === 'sentence_start' && typeof event.text === 'string') append('assistant', event.text)
        if (event.state === 'stop') {
          stats.stops++; answering = false
          if (event.is_aborted !== true && !playing) status.textContent = '正在聆听（麦克风开启）'
          if (event.is_aborted === true) { stats.aborted++; const stoppedAt = performance.now(); player.stop(); stats.abortToPlayerStopMs = Math.round((performance.now() - stoppedAt) * 100) / 100; status.textContent = '已打断，正在聆听（麦克风仍开）' }
        }
      }
      if (event.type === 'mcp' && event.payload?.id != null) {
        const request = event.payload
        let result: object
        if (request.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'lie-browser-experiment', version: '0.1' } }
        else if (request.method === 'tools/list') {
          result = { tools: [{ name: 'self.lie_character_context', description: '每次回答前读取当前角色及本人历史。', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }], nextCursor: null }
          toolsReady = true
        } else if (request.method === 'tools/call' && request.params?.name === 'self.lie_character_context') {
          stats.contexts++
          result = { content: [{ type: 'text', text: JSON.stringify({ background: '这是无敏感信息的语音实验。', profile: '你叫阿蓝，口令蓝鲸七号，可以直接告诉玩家。', systemPrompt: '只扮演测试员，简短回答，依据本人历史。', history }) }], isError: false }
        } else { send({ type: 'mcp', payload: { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Unknown method' } } }); return }
        send({ type: 'mcp', payload: { jsonrpc: '2.0', id: request.id, result } })
      }
      display()
    } catch { stop('协议或播放失败，麦克风已关闭') }
  }
  try {
    await context.resume()
    mic = await openMicrophone({ signal: abort.signal, onFrame(data) { if (uploading && socket.readyState === 1) { socket.send(data.slice().buffer); stats.inputFrames++ } } })
    while ((!ready || !toolsReady) && !abort.signal.aborted) {
      if (performance.now() - started > 10000) throw new Error('Handshake timeout')
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    if (abort.signal.aborted) { await mic.stop(); return }
    send({ type: 'listen', state: 'start', mode: 'realtime' })
    uploading = true
    status.textContent = '正在聆听（麦克风开启），停顿自动答'
    display()
  } catch { stop('准备失败，麦克风已关闭') }
}
