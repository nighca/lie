import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'
import { collectAnswer } from './answer.mjs'
import { freshState, withOwnedResources, cleanupOwned } from './owned-resources.mjs'
import { limits } from './settings.mjs'

class FakeSocket extends EventEmitter {
  sent = []; terminated = false
  constructor(events, cleanClose = true) { super(); this.cleanClose = cleanClose; queueMicrotask(() => { this.emit('open'); for (const [event, binary = false] of events) this.emit('message', binary ? event : Buffer.from(JSON.stringify(event)), binary) }) }
  send(value) { this.sent.push(JSON.parse(value)) }
  close() { if (this.cleanClose) queueMicrotask(() => this.emit('close')) }
  terminate() { this.terminated = true; this.emit('close') }
}
const hello = { type: 'hello', audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } }
const list = { type: 'mcp', payload: { id: 1, method: 'tools/list' } }
const call = { type: 'mcp', payload: { id: 2, method: 'tools/call', params: { name: 'self.lie_character_context' } } }
const start = [hello, list, { type: 'stt', text: '普通问题' }, call, { type: 'tts', state: 'start' }].map(item => [item])
const finish = [[{ type: 'tts', state: 'sentence_start', text: '本人回答。' }], [Buffer.alloc(640), true], [{ type: 'tts', state: 'stop' }]]
function answer(events, options = {}) {
  let socket
  const result = collectAnswer({ createSocket: () => (socket = new FakeSocket(events, options.cleanClose)), device: { token: 'fake-token', mac: 'fake-mac', client: 'fake-client' }, agentId: 'fake-agent', question: '普通问题', readContext: () => ({ background: '公共', profile: '本人', history: [{ role: 'user', text: '普通问题' }] }), timeoutMs: 20, closeMs: 5, ...options })
  return { result, get socket() { return socket } }
}
test('one text question and one safe context tool produce one answer, then close', async () => {
  const task = answer([...start, ...finish])
  const result = await task.result
  assert.equal(result.output, '本人回答。'); assert.equal(result.stt, 1); assert.equal(result.contextCalls, 1)
  assert.equal(task.socket.sent.filter(item => item.type === 'listen').length, 1)
  const tool = task.socket.sent.find(item => item.payload?.id === 2)
  assert.deepEqual(JSON.parse(tool.payload.result.content[0].text).profile, '本人')
})
test('a second model answer is rejected without sending another question', async () => {
  const task = answer([...start, [{ type: 'tts', state: 'start' }]])
  await assert.rejects(task.result, /multiple-answers/)
  assert.equal(task.socket.sent.filter(item => item.type === 'listen').length, 1)
})
test('an unknown tool stops instead of dispatching arbitrary work', async () => {
  const task = answer([[hello], [list], [{ type: 'stt', text: '普通问题' }], [{ type: 'mcp', payload: { id: 3, method: 'tools/call', params: { name: 'arbitrary-tool' } } }]])
  await assert.rejects(task.result, /unexpected-tool/)
  assert.equal(task.socket.sent.some(item => item.payload?.id === 3), false)
})
test('audio and output flood limits bound accumulation and close the socket', async () => {
  await assert.rejects(answer([...start, [Buffer.alloc(limits.audioBytes + 1), true]]).result, /audio-flood/)
  await assert.rejects(answer([...start, [{ type: 'tts', state: 'sentence_start', text: 'x'.repeat(limits.outputBytes + 1) }]]).result, /output-flood/)
})
test('mismatched text echo cannot silently change a matrix question', async () => {
  await assert.rejects(answer([[hello], [list], [{ type: 'stt', text: '不是原问题' }]]).result, /stt-mismatch/)
})
test('timeout forcibly terminates a transport which ignores graceful close', async () => {
  const task = answer([], { cleanClose: false })
  await assert.rejects(task.result, /answer-timeout/)
  assert.equal(task.socket.terminated, true)
})
test('PCM and context are required; incomplete stop is not semantic success', async () => {
  await assert.rejects(answer([...start, [{ type: 'tts', state: 'sentence_start', text: '一句话' }], [{ type: 'tts', state: 'stop' }]]).result, /answer-incomplete/)
})

function fixture(failOperation = null) {
  const state = freshState(), operations = [], snapshots = []
  let detail = {}, removed = false
  const otaCount = new Map()
  const options = {
    config: { llmModelId: 'model-test', ttsVoiceId: 'voice-test', systemPrompt: 'generic-test' },
    async save(value) { snapshots.push(structuredClone(value)) },
    async remove() { removed = true },
    async api(operation, path, method, body) {
      operations.push({ operation, path, method, body })
      if (operation === failOperation) throw new Error('controlled-failure')
      if (operation === 'create-owned') { detail = { ...body }; return { data: 'owned-created-agent' } }
      if (operation === 'configure-owned') detail = { ...detail, ...body }
      return { data: { ...detail } }
    },
    async ota(device) { const count = (otaCount.get(device.mac) ?? 0) + 1; otaCount.set(device.mac, count); return count === 1 ? { activation: { code: 'fake-activation' } } : { websocket: { url: 'wss://xrobo-io.qiniuapi.com/v1/ws/', token: 'fake-token' } } },
  }
  return { state, options, operations, snapshots, get removed() { return removed } }
}
test('owned success cleans eight isolated devices and exactly its own agent', async () => {
  const f = fixture()
  await withOwnedResources(f.state, f.options, async state => { assert.equal(state.devices.length, 8); assert.equal(state.devices.every(item => item.bound && item.token), true) })
  assert.equal(f.operations.filter(item => item.operation === 'unbind-owned').length, 8)
  assert.deepEqual(f.operations.filter(item => item.operation === 'delete-owned').map(item => item.path), ['/xiaozhi/agent/owned-created-agent'])
  assert.equal(f.removed, true)
})
test('configuration failure after creation still deletes the known owned agent', async () => {
  const f = fixture('configure-owned')
  await assert.rejects(withOwnedResources(f.state, f.options, async () => assert.fail('must not infer')), /controlled-failure/)
  assert.equal(f.operations.some(item => item.operation === 'delete-owned'), true)
  assert.equal(f.operations.some(item => item.operation === 'bind-owned'), false)
  assert.equal(f.removed, true)
})
test('ambiguous creation failure keeps ledger for reconciliation, never guesses an agent ID', async () => {
  const f = fixture('create-owned')
  await assert.rejects(withOwnedResources(f.state, f.options, async () => assert.fail('must not infer')), /cleanup-incomplete/)
  assert.equal(f.state.createAttempted, true)
  assert.equal(f.operations.some(item => item.operation === 'delete-owned'), false)
  assert.equal(f.removed, false)
})
test('failed bind response still attempts cleanup only for that generated device', async () => {
  const f = fixture('bind-owned')
  await assert.rejects(withOwnedResources(f.state, f.options, async () => assert.fail('must not infer')), /controlled-failure/)
  const unbinds = f.operations.filter(item => item.operation === 'unbind-owned')
  assert.deepEqual(unbinds.map(item => item.body.deviceId), [f.state.devices[0].mac])
  assert.equal(f.removed, true)
})
test('failed inference/manual stop always runs resource cleanup and does not restart', async () => {
  const f = fixture(); let invocations = 0
  await assert.rejects(withOwnedResources(f.state, f.options, async () => { invocations++; throw new Error('semantic-stop') }), /semantic-stop/)
  assert.equal(invocations, 1); assert.equal(f.removed, true)
  assert.equal(f.operations.filter(item => item.operation === 'create-owned').length, 1)
})
test('cleanup failure retains ledger for cleanup-only retry and rejects foreign ownership', async () => {
  const f = fixture('delete-owned')
  await assert.rejects(withOwnedResources(f.state, f.options, async () => {}), /cleanup-incomplete/)
  assert.equal(f.removed, false)
  const foreign = { ...f.state, name: 'production-agent' }
  const before = f.operations.length
  await assert.rejects(cleanupOwned(foreign, f.options), /owner-invalid/)
  assert.equal(f.operations.length, before)
})
test('aborting before resource creation makes no API call', async () => {
  const f = fixture(), controller = new AbortController()
  controller.abort()
  await assert.rejects(withOwnedResources(f.state, { ...f.options, signal: controller.signal }, async () => assert.fail()), /execution-aborted/)
  assert.equal(f.operations.length, 0)
  assert.equal(f.removed, true)
})
test('oversized JSON and excessive tool calls stop bounded protocol processing', async () => {
  await assert.rejects(answer([[hello], [list], [{ text: 'x'.repeat(limits.messageBytes + 1) }]]).result, /message-flood/)
  await assert.rejects(answer([...start, [call], [call], [call]]).result, /context-order-or-flood/)
})
test('model readback mismatch prevents all device binding and inference', async () => {
  const f = fixture(), api = f.options.api
  f.options.api = async (...args) => {
    const result = await api(...args)
    if (args[0] === 'verify-owned') result.data.llmModelId = 'different-model'
    return result
  }
  await assert.rejects(withOwnedResources(f.state, f.options, async () => assert.fail('must not infer')), /test-config-mismatch/)
  assert.equal(f.operations.some(item => item.operation === 'bind-owned'), false)
  assert.equal(f.removed, true)
})
