import { limits } from './settings.mjs'
export async function collectAnswer({ createSocket, device, agentId, question, readContext, signal, timeoutMs = limits.durationMs, closeMs = limits.closeMs }) {
  const socket = createSocket('wss://xrobo-io.qiniuapi.com/v1/ws/', { handshakeTimeout: limits.handshakeMs, maxPayload: limits.messageBytes, headers: { Authorization: `Bearer ${device.token}`, 'Device-Id': device.mac, 'Client-Id': device.client, 'Protocol-Version': '1', 'X-Agent-ID': agentId } })
  const stats = { hello: false, toolsList: false, contextCalls: 0, stt: 0, ttsStarts: 0, ttsStop: false, audioFrames: 0, audioBytes: 0 }
  const start = Date.now()
  let output = '', sent = false, failed = null, resolveAnswer, rejectAnswer
  const answer = new Promise((resolve, reject) => { resolveAnswer = resolve; rejectAnswer = reject })
  function fail(reason) { if (failed == null) { failed = reason; const error = new Error(reason); error.protocol = { ...stats, durationMs: Date.now() - start }; rejectAnswer(error) } }
  const onAbort = () => fail('execution-aborted')
  signal?.addEventListener('abort', onAbort, { once: true })
  if (signal?.aborted) onAbort()
  const deadline = setTimeout(() => fail('answer-timeout'), timeoutMs)
  const send = value => socket.send(JSON.stringify(value))
  function ask() {
    if (stats.hello && stats.toolsList && !sent) { sent = true; send({ type: 'listen', state: 'detect', text: question }) }
  }
  socket.on('error', () => fail('transport'))
  socket.on('close', () => { if (!stats.ttsStop) fail('early-close') })
  socket.on('open', () => {
    if (failed != null) return
    try { send({ type: 'hello', version: 1, transport: 'websocket', features: { mcp: true }, audio_params: { format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16, endianness: 'little', frame_duration: 20, frame_size: 320, sample_format: 'signed_int16' } }) } catch { fail('send-failed') }
  })
  socket.on('message', (data, binary) => {
    if (failed != null) return
    try {
      if (binary) {
        stats.audioFrames++; stats.audioBytes += data.length
        if (stats.audioFrames > limits.frames || stats.audioBytes > limits.audioBytes) fail('audio-flood')
        return
      }
      if (data.length > limits.messageBytes) { fail('message-flood'); return }
      const event = JSON.parse(data.toString())
      if (String(event.text ?? '').includes('额度不足')) { fail('quota'); return }
      if (event.type === 'hello') {
        if (stats.hello || event.audio_params?.format !== 'pcm' || event.audio_params.sample_rate !== 16000 || event.audio_params.channels !== 1) { fail('hello-invalid'); return }
        stats.hello = true
      }
      if (event.type === 'stt') {
        if (++stats.stt > 1 || event.text !== question || !sent) { fail('stt-mismatch'); return }
      }
      if (event.type === 'tts') {
        if (event.state === 'start' && ++stats.ttsStarts > 1) { fail('multiple-answers'); return }
        if (event.state === 'sentence_start') {
          output += event.text ?? ''
          if (Buffer.byteLength(output) > limits.outputBytes) { fail('output-flood'); return }
        }
        if (event.state === 'stop') {
          stats.ttsStop = true
          if (stats.stt !== 1 || stats.contextCalls < 1 || stats.ttsStarts !== 1 || stats.audioBytes === 0 || output.trim().length === 0) fail('answer-incomplete')
          else resolveAnswer({ output, ...stats, durationMs: Date.now() - start })
        }
      }
      if (event.type === 'mcp' && event.payload?.id != null) {
        const request = event.payload
        let result
        if (request.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'lie-bounded-case-check', version: '0.1' } }
        else if (request.method === 'tools/list') {
          if (stats.toolsList) { fail('repeated-tools-list'); return }
          stats.toolsList = true
          result = { tools: [{ name: 'self.lie_character_context', description: '读取当前人物的公共背景、本人设定和本人历史，回答玩家前先读取。', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }], nextCursor: null }
        } else if (request.method === 'tools/call' && request.params?.name === 'self.lie_character_context') {
          if (!sent || stats.stt !== 1 || ++stats.contextCalls > 3) { fail('context-order-or-flood'); return }
          result = { content: [{ type: 'text', text: JSON.stringify(readContext()) }], isError: false }
        } else { fail('unexpected-tool'); return }
        const reply = { type: 'mcp', payload: { jsonrpc: '2.0', id: request.id, result } }
        if (Buffer.byteLength(JSON.stringify(reply)) > limits.messageBytes) { fail('context-too-large'); return }
        send(reply)
      }
      ask()
    } catch { fail('protocol') }
  })
  try { return await answer } finally {
    clearTimeout(deadline)
    signal?.removeEventListener('abort', onAbort)
    await new Promise(resolve => {
      const timer = setTimeout(() => { socket.terminate(); resolve() }, closeMs)
      socket.once('close', () => { clearTimeout(timer); resolve() })
      try { socket.close(1000, 'Case check complete') } catch { socket.terminate(); clearTimeout(timer); resolve() }
    })
  }
}
