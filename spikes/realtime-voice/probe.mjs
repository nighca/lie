import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import WebSocket from 'ws'

const dir = new URL('./tmp/', import.meta.url)
const state = JSON.parse(await readFile(new URL('realtime-state.json', dir), 'utf8'))
assert.ok(state.name.startsWith('LIE-realtime-test-') && state.devices.length === 3)
const clips = await Promise.all(['question-one.pcm', 'question-two.pcm'].map(name => readFile(new URL(name, dir))))
const started = Date.now()
const events = []
const stats = { hello: false, initialize: 0, toolsList: 0, toolsCall: 0, stt: 0, starts: 0, stops: 0, aborted: 0, audioFrames: 0, audioBytes: 0, lateFramesAfterAbort: 0 }
let stage = 'handshake'
let failure = null
let clip = null
let offset = 0
let streaming = null
let afterAbort = false
let interruptQueued = false
const device = state.devices[0]
const socket = new WebSocket('wss://xrobo-io.qiniuapi.com/v1/ws/', {
  handshakeTimeout: 10000,
  headers: { Authorization: `Bearer ${device.token}`, 'Device-Id': device.mac,
    'Client-Id': randomUUID(), 'Protocol-Version': '1', 'X-Agent-ID': state.agentId }
})
function event(name, extra = {}) { events.push({ event: name, ms: Date.now() - started, ...extra }) }
function send(value) { socket.send(JSON.stringify(value)) }
function play(index) { clip = clips[index]; offset = 0; event('input-start', { index }) }
async function wait(predicate, label, timeout = 35000) {
  const until = Date.now() + timeout
  while (!predicate()) {
    if (failure != null) throw failure
    if (Date.now() > until) throw new Error(label)
    await delay(20)
  }
}
const limit = setTimeout(() => { failure = new Error('overall-timeout'); socket.terminate() }, 150000)
socket.on('error', () => { failure = new Error('socket-error') })
socket.on('close', () => { if (stage !== 'complete') failure ??= new Error('unexpected-close') })
socket.on('open', () => { event('ws-open'); send({ type: 'hello', version: 1, transport: 'websocket', features: { mcp: true }, audio_params: {
  format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16, endianness: 'little', frame_duration: 20, frame_size: 320, sample_format: 'signed_int16'
} }) })
socket.on('message', (data, binary) => {
  if (binary) { stats.audioFrames++; stats.audioBytes += data.length; if (afterAbort) stats.lateFramesAfterAbort++; return }
  let message
  try { message = JSON.parse(data.toString()) } catch { failure = new Error('invalid-json'); return }
  if (message.type === 'hello') { stats.hello = true; event('hello'); return }
  if (message.type === 'stt') {
    stats.stt++; event('stt')
    if (String(message.text).includes('额度不足')) failure = new Error('provider-quota')
  }
  if (message.type === 'tts') {
    if (String(message.text).includes('额度不足')) failure = new Error('provider-quota')
    if (message.state === 'start') {
      stats.starts++; if (stats.starts >= 6) { failure = new Error('answer-budget-reached'); socket.terminate(); return }
      afterAbort = false; event('tts-start')
      if (stage === 'interrupt' && !interruptQueued) { interruptQueued = true; setTimeout(() => { if (socket.readyState === 1) play(1) }, 250) }
    }
    if (message.state === 'stop') {
      stats.stops++; if (message.is_aborted === true) { stats.aborted++; afterAbort = true }
      event('tts-stop', { aborted: message.is_aborted === true })
    }
  }
  if (message.type !== 'mcp' || message.payload?.id == null) return
  const request = message.payload
  let result
  if (request.method === 'initialize') { stats.initialize++; result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'lie-realtime-probe', version: '0.1' } } }
  else if (request.method === 'tools/list') { stats.toolsList++; result = { tools: [{ name: 'self.lie_character_context', description: '回答前必须读取角色身份和本人历史。', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }], nextCursor: null } }
  else if (request.method === 'tools/call' && request.params?.name === 'self.lie_character_context') {
    stats.toolsCall++; event('context-tool')
    result = { content: [{ type: 'text', text: JSON.stringify({ background: '合成语音协议测试。', profile: '你叫阿蓝，口令蓝鲸七号。可以告诉玩家。', systemPrompt: '每次回答先读取工具。介绍名字口令，并解释这是无敏感信息的语音测试，用四十字左右的一句话回答。', history: [] }) }], isError: false }
  } else { send({ type: 'mcp', payload: { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Unknown test method' } } }); return }
  send({ type: 'mcp', payload: { jsonrpc: '2.0', id: request.id, result } })
})
try {
  await wait(() => stats.hello && stats.toolsList > 0, 'handshake-timeout')
  send({ type: 'listen', state: 'start', mode: 'realtime', agent_params: { voice: { id: '29ddb9582ae8481ebf11562f99aeaf95' } } })
  event('listen-realtime-start')
  streaming = setInterval(() => {
    if (socket.readyState !== 1) return
    const frame = Buffer.alloc(640)
    if (clip != null) {
      clip.copy(frame, 0, offset, Math.min(offset + 640, clip.length)); offset += 640
      if (offset >= clip.length) { clip = null; event('input-end') }
    }
    socket.send(frame)
  }, 20)
  stage = 'round-one'; play(0)
  await wait(() => stats.stops >= 1, 'first-round-no-auto-answer')
  assert.ok(stats.stt >= 1 && stats.toolsCall >= 1 && stats.audioBytes > 0)
  event('round-one-passed')
  stage = 'round-two'; play(1)
  await wait(() => stats.stops >= 2, 'second-round-no-auto-answer')
  assert.ok(stats.stt >= 2 && stats.toolsCall >= 2 && stats.aborted === 0)
  event('round-two-passed')
  stage = 'interrupt'; play(0)
  await wait(() => stats.aborted >= 1, 'no-aborted-stop-on-injected-speech')
  await wait(() => stats.stops >= 4 && stats.starts >= 4, 'no-recovery-after-interrupt')
  assert.ok(stats.toolsCall >= 4)
  stage = 'complete'; event('complete')
} catch (error) { failure ??= error; event('failure', { stage, reason: failure.message }); process.exitCode = 1 }
finally {
  clearTimeout(limit); if (streaming != null) clearInterval(streaming)
  socket.close(1000, 'Probe finished')
  const summary = { passed: failure == null, stage, stats, events }
  await writeFile(new URL('results.json', dir), JSON.stringify(summary, null, 2), { mode: 0o600 })
  console.log(JSON.stringify(summary))
}
