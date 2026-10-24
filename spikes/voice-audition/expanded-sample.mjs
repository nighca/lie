import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { randomUUID, createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
export const line = '今天阳光很好，我们准备开始调查。'
function wav(pcm) {
  const header = Buffer.alloc(44)
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
  header.writeUInt32LE(16000, 24); header.writeUInt32LE(32000, 28); header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}
export async function sample({ appearance, voiceId, state, clip, dir, WebSocket, timeoutMs = 45000 }) {
  const device = state.devices[0]
  const socket = new WebSocket('wss://xrobo-io.qiniuapi.com/v1/ws/', { handshakeTimeout: 10000, maxPayload: 65536,
    headers: { Authorization: `Bearer ${device.token}`, 'Device-Id': device.mac,
      'Client-Id': randomUUID(), 'Protocol-Version': '1', 'X-Agent-ID': state.agentId } })
  const started = Date.now()
  const stats = { hello: false, toolsList: false, contextCalls: 0, stt: 0, ttsStarts: 0, ttsStop: false, audioFrames: 0, openMs: 0, helloMs: 0, durationMs: 0 }
  const chunks = []
  let output = ''; let messages = 0
  let failure = null
  let ticker = null
  let offset = 0
  const send = message => socket.send(JSON.stringify(message))
  socket.on('error', () => { failure = new Error('transport') })
  socket.on('close', () => { if (!stats.ttsStop) failure ??= new Error('closed') })
  socket.on('open', () => {
    stats.openMs = Date.now() - started
    send({ type: 'hello', version: 1, transport: 'websocket', features: { mcp: true },
      audio_params: { format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16, endianness: 'little', frame_duration: 20, frame_size: 320, sample_format: 'signed_int16' } })
  })
  socket.on('message', (data, binary) => {
    if (binary) { stats.audioFrames++; if (stats.audioFrames > 4000 || chunks.reduce((sum, chunk) => sum + chunk.length, 0) + data.length > 4000000) { failure = new Error('audio-flood'); return }; chunks.push(Buffer.from(data)); return }
    try {
      if (++messages > 300 || data.length > 65536) throw new Error('message-flood')
      const event = JSON.parse(data.toString())
      if (String(event.text ?? '').includes('额度不足')) { failure = new Error('quota'); return }
      if (event.type === 'hello') {
        assert.ok(event.audio_params?.format === 'pcm' && event.audio_params.sample_rate === 16000 && event.audio_params.channels === 1)
        stats.hello = true; stats.helloMs = Date.now() - started
      }
      if (event.type === 'stt') stats.stt++
      if (event.type === 'tts') {
        if (event.state === 'start') { stats.ttsStarts++; if (stats.ttsStarts > 1) failure = new Error('answer-budget') }
        if (event.state === 'sentence_start') output += event.text ?? ''; if (Buffer.byteLength(output) > 8192) failure = new Error('output-flood')
        if (event.state === 'stop') stats.ttsStop = true
      }
      if (event.type !== 'mcp' || event.payload?.id == null) return
      const request = event.payload
      let result
      if (request.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'lie-voice-audition', version: '0.1' } }
      else if (request.method === 'tools/list') {
        result = { tools: [{ name: 'self.lie_character_context', description: '回答前读取当前人物设定。', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }], nextCursor: null }
        stats.toolsList = true
      } else if (request.method === 'tools/call' && request.params?.name === 'self.lie_character_context') {
        stats.contextCalls++; if (stats.contextCalls > 3) { failure = new Error('context-flood'); return }
        result = { content: [{ type: 'text', text: JSON.stringify({ background: '这是无敏感内容的声音试听。', profile: `你是试听员。请朗读固定句子：${line}`, systemPrompt: `只朗读这一句，不添加解释：${line}`, history: [] }) }], isError: false }
      } else { failure = new Error('unexpected-tool'); return }
      send({ type: 'mcp', payload: { jsonrpc: '2.0', id: request.id, result } })
    } catch { failure = new Error('protocol') }
  })
  async function wait(predicate) {
    while (!predicate()) {
      if (failure != null) throw failure
      if (Date.now() - started > timeoutMs) throw new Error('timeout')
      await delay(20)
    }
    if (failure != null) throw failure
  }
  try {
    await wait(() => stats.hello && stats.toolsList)
    send({ type: 'listen', state: 'start', mode: 'realtime', agent_params: { voice: { id: voiceId } } })
    ticker = setInterval(() => {
      if (socket.readyState !== 1) return
      const frame = Buffer.alloc(640)
      if (offset < clip.length) { clip.copy(frame, 0, offset, Math.min(offset + 640, clip.length)); offset += 640 }
      socket.send(frame)
    }, 20)
    await wait(() => stats.ttsStop)
    assert.ok(stats.stt === 1 && stats.contextCalls >= 1 && stats.ttsStarts === 1 && chunks.length > 0)
    assert.equal(output.replace(/[\s，。！？]/g, ''), line.replace(/[\s，。！？]/g, ''))
    const pcm = Buffer.concat(chunks)
    await writeFile(new URL(`${appearance}.wav`, dir), wav(pcm), { mode: 0o600 })
    stats.durationMs = Date.now() - started
    return { appearance, voiceId, ...stats, audioBytes: pcm.length, audioSeconds: pcm.length / 32000,
      sha256: createHash('sha256').update(pcm).digest('hex'), fixedLineMatched: output.replace(/[\s，。！？]/g, '') === line.replace(/[\s，。！？]/g, '') }
  } catch (error) {
    const reason = ['transport', 'closed', 'quota', 'answer-budget', 'unexpected-tool', 'protocol', 'timeout'].includes(error.message) ? error.message : 'validation'
    await writeFile(new URL('failure.json', dir), JSON.stringify({ appearance, ...stats, reason }, null, 2), { mode: 0o600 })
    throw error
  } finally { if (ticker != null) clearInterval(ticker); socket.close(1000, 'Audition complete'); await Promise.race([new Promise(resolve => socket.once('close', resolve)), delay(1000)]); if (socket.readyState !== 3) socket.terminate() }
}
