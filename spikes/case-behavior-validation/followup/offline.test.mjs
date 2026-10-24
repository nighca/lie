import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { matrix as original } from '../matrix.mjs'
import { matrix } from './matrix.mjs'
import { limits } from './settings.mjs'
import { freshState, withOwnedResources } from './owned-resources.mjs'

test('exact twelve original questions are retained, excluding completed Ren/Qiao targets', () => {
  const expected = ['duck-05', 'duck-06', 'duck-07', 'duck-08', ...Array.from({ length: 8 }, (_, i) => 'salt-' + String(i + 1).padStart(2, '0'))]
  assert.deepEqual(matrix.map(row => row.id), expected)
  assert.deepEqual(matrix, original.filter(row => expected.includes(row.id)))
  assert.equal(limits.answers, 12)
  assert.equal(matrix.some(row => ['ren', 'qiao'].includes(row.characterId)), false)
})

test('six isolated device identities derive from the twelve target rows', () => {
  const state = freshState()
  assert.equal(state.devices.length, 6)
  assert.equal(new Set(state.devices.map(row => row.mac)).size, 6)
  assert.deepEqual(new Set(state.devices.map(row => row.identity)), new Set(matrix.map(row => row.gameId + '/' + row.characterId)))
  assert.ok(state.name.startsWith('LIE-case-followup-'))
})
function fixture(failedOperation = null, upstream = 'ws://xrobo-io.qiniuapi.com/v1/ws/') {
  const state = freshState(); const calls = []; let detail = {}; let removed = false
  const counts = new Map()
  const options = {
    config: { llmModelId: 'model', ttsVoiceId: 'voice', systemPrompt: 'prompt' },
    async save() {}, async remove() { removed = true },
    async api(operation, path, _method, body) {
      calls.push({ operation, path, body })
      if (operation === failedOperation) throw new Error('controlled-failure')
      if (operation === 'create-owned') { detail = { ...body }; return { data: 'new-followup-owned' } }
      if (operation === 'configure-owned') detail = { ...detail, ...body }
      return { data: { ...detail } }
    },
    async ota(device) { const count = (counts.get(device.mac) ?? 0) + 1; counts.set(device.mac, count); return count === 1 ? { activation: { code: 'new' } } : { websocket: { url: upstream, token: 'fake' } } },
  }
  return { state, options, calls, get removed() { return removed } }
}
test('success cleans exactly six new devices and one own agent', async () => {
  const f = fixture()
  await withOwnedResources(f.state, f.options, async () => {})
  assert.equal(f.calls.filter(row => row.operation === 'bind-owned').length, 6)
  assert.equal(f.calls.filter(row => row.operation === 'unbind-owned').length, 6)
  assert.deepEqual(f.calls.filter(row => row.operation === 'delete-owned').map(row => row.path), ['/xiaozhi/agent/new-followup-owned'])
  assert.equal(f.removed, true)
})
test('inference stop cleans once and never reruns the callback', async () => {
  const f = fixture(); let calls = 0
  await assert.rejects(withOwnedResources(f.state, f.options, async () => { calls++; throw new Error('semantic-stop') }), /semantic-stop/)
  assert.equal(calls, 1); assert.equal(f.removed, true)
  assert.equal(f.calls.filter(row => row.operation === 'unbind-owned').length, 6)
})
test('failed bind still cleans only the one attempted owned device', async () => {
  const f = fixture('bind-owned')
  await assert.rejects(withOwnedResources(f.state, f.options, () => assert.fail()), /controlled-failure/)
  assert.deepEqual(f.calls.filter(row => row.operation === 'unbind-owned').map(row => row.body.deviceId), [f.state.devices[0].mac])
  assert.equal(f.removed, true)
})
test('foreign upstream is rejected before any inference and still cleaned', async () => {
  const f = fixture(null, 'ws://evil.example/v1/ws/')
  await assert.rejects(withOwnedResources(f.state, f.options, () => assert.fail()), /ota-config-invalid/)
  assert.equal(f.removed, true)
})
test('prepared questions have fresh isolated history, including independent same-character phrasing', async () => {
  const contexts = JSON.parse(await readFile(new URL('./tmp/prepared-contexts.json', import.meta.url), 'utf8'))
  assert.equal(contexts.length, 12)
  for (const [index, row] of contexts.entries()) {
    assert.equal(row.id, matrix[index].id)
    assert.equal(row.context.history.length, 1)
    assert.equal(row.context.history[0].role, 'user')
    assert.equal(row.context.history[0].text, row.question)
    assert.equal('ending' in row.context, false)
  }
  assert.equal(contexts[0].characterId, contexts[1].characterId)
  assert.equal(contexts[0].context.history.some(row => row.role === 'assistant'), false)
  assert.equal(contexts[1].context.history.some(row => row.role === 'assistant'), false)
})
