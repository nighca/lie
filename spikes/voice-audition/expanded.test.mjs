import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { freshState, withOwnedResources } from './expanded-resources.mjs'
import { sample, line } from './expanded-sample.mjs'

test('configuration failure cleans only newly created resource', async () => {
  const state = freshState(); const calls = []
  await assert.rejects(withOwnedResources(state, {
    save: async () => {}, remove: async () => {}, config: {},
    api: async (operation, path) => { calls.push([operation, path]); if (operation === 'create-owned') return { data: 'created-id' }; if (operation === 'configure-owned') throw new Error('failed'); return { code: 0 } },
  }, () => assert.fail('run must not start')))
  assert.deepEqual(calls.map(item => item[0]), ['create-owned', 'configure-owned', 'delete-owned'])
  assert.equal(calls[2][1], '/xiaozhi/agent/created-id')
})
test('ambiguous create preserves owner state and never guesses a deletion ID', async () => {
  const state = freshState(); let deletes = 0; let removed = false
  await assert.rejects(withOwnedResources(state, { config: {}, save: async () => {}, remove: async () => { removed = true }, api: async operation => { if (operation === 'delete-owned') deletes++; throw new Error('network') } }, () => {}), /cleanup-incomplete/)
  assert.equal(deletes, 0); assert.equal(removed, false)
})
class FakeSocket extends EventEmitter {
  static mode = 'pass'
  static voice = null
  constructor() { super(); this.readyState = 1; queueMicrotask(() => { this.emit('open'); this.event({ type: 'hello', audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } }); this.event({ type: 'mcp', payload: { id: 1, method: 'tools/list' } }) }) }
  event(value) { this.emit('message', Buffer.from(JSON.stringify(value)), false) }
  send(data) {
    if (Buffer.isBuffer(data)) return
    const event = JSON.parse(data)
    if (event.type !== 'listen') return
    FakeSocket.voice = event.agent_params.voice.id
    if (FakeSocket.mode === 'timeout') return
    this.event({ type: 'mcp', payload: { id: 2, method: 'tools/call', params: { name: 'self.lie_character_context' } } })
    this.event({ type: 'stt', text: '测试' }); this.event({ type: 'tts', state: 'start' })
    this.event({ type: 'tts', state: 'sentence_start', text: FakeSocket.mode === 'wrong-line' ? '不同句子' : line })
    this.emit('message', Buffer.alloc(FakeSocket.mode === 'flood' ? 4000001 : 640), true)
    this.event({ type: 'tts', state: 'stop' })
  }
  close() { this.readyState = 3; queueMicrotask(() => this.emit('close')) }
  terminate() { this.readyState = 3 }
}
for (const mode of ['pass', 'timeout', 'flood', 'wrong-line']) test(`fake websocket ${mode} enforces voice and answer bounds`, async () => {
  const path = await mkdtemp(`${tmpdir()}/lie-voice-test-`)
  FakeSocket.mode = mode
  const run = () => sample({ appearance: 'test', voiceId: 'selected', state: { agentId: 'own', devices: [{ token: 'fake', mac: '02:00:00:00:00:00' }] }, clip: Buffer.alloc(640), dir: pathToFileURL(`${path}/`), WebSocket: FakeSocket, timeoutMs: 100 })
  try { if (mode === 'pass') { const result = await run(); assert.equal(result.fixedLineMatched, true); assert.equal(FakeSocket.voice, 'selected') } else await assert.rejects(run()) } finally { await rm(path, { recursive: true }) }
})
for (const upstream of ['ws://xrobo-io.qiniuapi.com/v1/ws/', 'wss://xrobo-io.qiniuapi.com/v1/ws', 'ws://evil.example/v1/ws/', 'ws://xrobo-io.qiniuapi.com/v1/ws/?token=secret']) test(`setup validates returned upstream ${upstream.split('?')[0]}`, async () => {
  const state = freshState(); const operations = []; let otaCount = 0; let ran = false
  const config = { llmModelId: 'model', ttsVoiceId: 'default', systemPrompt: 'prompt' }
  const run = () => withOwnedResources(state, {
    config, save: async () => {}, remove: async () => {},
    api: async operation => {
      operations.push(operation)
      if (operation === 'create-owned') return { data: 'new-owned' }
      if (operation === 'verify-owned') return { data: { ...config, memModelId: 'Memory_nomem', chatHistoryConf: 0, extra: { disable_greeting: true, llm: { max_tokens: 160, enable_search: false } } } }
      return { code: 0 }
    },
    ota: async () => ++otaCount === 1 ? { activation: { code: 'fresh' } } : { websocket: { url: upstream, token: 'fake' } },
  }, () => { ran = true })
  if (upstream.includes('evil') || upstream.includes('?')) { await assert.rejects(run(), /ota-config-invalid/); assert.equal(ran, false) } else { await run(); assert.equal(ran, true) }
  assert.deepEqual(operations.slice(-2), ['unbind-owned', 'delete-owned'])
})
