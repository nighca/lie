import assert from 'node:assert/strict'
import test from 'node:test'
import { createOwnedAgent, ownedAgentPath } from './owned-agent.mjs'

test('unknown create receipts remain uncertain and never produce a delete request', async () => {
  for (const receipt of [{ id: 'not-a-contract' }, [], null, '', '../other', 12]) {
    const state = { name: 'owned-test', agentId: null }
    const saved = []
    const requests = []
    const request = async (path, method) => {
      requests.push({ path, method })
      assert.equal(saved[0].createAttempted, true)
      assert.equal(saved[0].createUncertain, true)
      return receipt
    }
    await assert.rejects(createOwnedAgent(state, async () => saved.push({ ...state }), request, {}), /invalid-create-response/)
    const path = ownedAgentPath(state)
    if (path != null) await request(path, 'DELETE')
    assert.equal(state.agentId, null)
    assert.equal(state.createUncertain, true)
    assert.deepEqual(requests, [{ path: '/xiaozhi/agent', method: 'POST' }])
  }
})

test('a validated receipt permits deletion of exactly the created owned agent', async () => {
  const id = '0123456789abcdef0123456789abcdef'
  const state = { name: 'owned-test', agentId: null }
  const requests = []
  const request = async (path, method) => { requests.push({ path, method }); return id }
  await createOwnedAgent(state, async () => {}, request, {})
  await request(ownedAgentPath(state), 'DELETE')
  assert.equal(state.createUncertain, false)
  assert.deepEqual(requests, [{ path: '/xiaozhi/agent', method: 'POST' }, { path: `/xiaozhi/agent/${id}`, method: 'DELETE' }])
})

test('a lost create response preserves the attempt without guessing an agent ID', async () => {
  const state = { name: 'owned-test', agentId: null }
  let saved
  await assert.rejects(createOwnedAgent(state, async () => { saved = { ...state } }, async () => { throw Error('lost-response') }, {}), /lost-response/)
  assert.equal(saved.createAttempted, true)
  assert.equal(saved.createUncertain, true)
  assert.equal(ownedAgentPath(state), null)
})
