import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { randomUUID, createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import WebSocket from 'ws'

const dir = new URL('./tmp/', import.meta.url)
const state = JSON.parse(await readFile(new URL('audition-state.json', dir), 'utf8'))
assert.ok(state.name.startsWith('LIE-voice-audition-') && state.devices.length === 1)
const clip = await readFile(new URL('input.pcm', dir))
const line = '今天阳光很好，我们准备开始调查。'
const candidates = [
  ['coral-bob', '535b81a1db504baa99fd726e01afee15'],
  ['sunny-moustache', '2e7965636b0d4472ae51e75f419dff41'],
  ['blue-glasses', '29ddb9582ae8481ebf11562f99aeaf95']
]
function wav(pcm) {
  const header = Buffer.alloc(44)
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
  header.writeUInt32LE(16000, 24); header.writeUInt32LE(32000, 28); header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}
const results = []
try {
  for (const [appearance, voiceId] of candidates) {
    const result = await sample(appearance, voiceId)
    results.push(result)
    await writeFile(new URL('results.json', dir), JSON.stringify(results, null, 2), { mode: 0o600 })
    console.log(JSON.stringify(result))
  }
} catch {
  console.error(JSON.stringify({ stopped: true, successfulSamples: results.length, retry: false }))
  process.exitCode = 1
}

async function sample(appearance, voiceId) {
  const device = state.devices[0]
  const socket = new WebSocket('wss://xrobo-io.qiniuapi.com/v1/ws/', { handshakeTimeout: 10000,
    headers: { Authorization: `Bearer ${device.token}`, 'Device-Id': device.mac,
      'Client-Id': randomUUID(), 'Protocol-Version': '1', 'X-Agent-ID': state.agentId } })
  const started = Date.now()
  const stats = { hello: false, toolsList: false, contextCalls: 0, stt: 0, ttsStarts: 0, ttsStop: false, audioFrames: 0, openMs: 0, helloMs: 0, durationMs: 0 }
  const chunks = []
  let output = ''
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
    if (binary) { stats.audioFrames++; chunks.push(Buffer.from(data)); return }
    try {
      const event = JSON.parse(data.toString())
      if (String(event.text ?? '').includes('额度不足')) { failure = new Error('quota'); return }
      if (event.type === 'hello') {
        assert.ok(event.audio_params?.format === 'pcm' && event.audio_params.sample_rate === 16000 && event.audio_params.channels === 1)
        stats.hello = true; stats.helloMs = Date.now() - started
      }
      if (event.type === 'stt') stats.stt++
      if (event.type === 'tts') {
        if (event.state === 'start') { stats.ttsStarts++; if (stats.ttsStarts > 1) failure = new Error('answer-budget') }
        if (event.state === 'sentence_start') output += event.text ?? ''
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
        stats.contextCalls++
        result = { content: [{ type: 'text', text: JSON.stringify({ background: '这是无敏感内容的声音试听。', profile: `你是试听员。请朗读固定句子：${line}`, systemPrompt: `只朗读这一句，不添加解释：${line}`, history: [] }) }], isError: false }
      } else { failure = new Error('unexpected-tool'); return }
      send({ type: 'mcp', payload: { jsonrpc: '2.0', id: request.id, result } })
    } catch { failure = new Error('protocol') }
  })
  async function wait(predicate) {
    while (!predicate()) {
      if (failure != null) throw failure
      if (Date.now() - started > 45000) throw new Error('timeout')
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
    const pcm = Buffer.concat(chunks)
    await writeFile(new URL(`${appearance}.wav`, dir), wav(pcm), { mode: 0o600 })
    stats.durationMs = Date.now() - started
    return { appearance, voiceId, ...stats, audioBytes: pcm.length, audioSeconds: pcm.length / 32000,
      sha256: createHash('sha256').update(pcm).digest('hex'), fixedLineMatched: output.replace(/[\s，。！？]/g, '') === line.replace(/[\s，。！？]/g, '') }
  } catch (error) {
    const reason = ['transport', 'closed', 'quota', 'answer-budget', 'unexpected-tool', 'protocol', 'timeout'].includes(error.message) ? error.message : 'validation'
    await writeFile(new URL('failure.json', dir), JSON.stringify({ appearance, ...stats, reason }, null, 2), { mode: 0o600 })
    throw error
  } finally { if (ticker != null) clearInterval(ticker); socket.close(1000, 'Audition complete') }
}
