import assert from 'node:assert/strict'
import test from 'node:test'
import { createSingleVoiceAttempt, createVoiceDiagnostics, methods } from './diagnostics.mjs'

const secret = 'DO_NOT_PERSIST_PRIVATE_SEED'
function created(id = 'raw-private-request-id', url = `wss://lie.agency/api/voice?token=${secret}`) {
  return { method: 'Network.webSocketCreated', params: { requestId: id, url, timestamp: 10 } }
}
function event(method, params = {}) {
  return { method: 'Network.' + method, params: { requestId: 'raw-private-request-id', timestamp: 10.125, ...params } }
}
function getterTrap(value) {
  return new Proxy(value, { get(target, key) {
    if (['headers', 'request', 'payloadData', 'cookies', 'Cookie'].includes(key)) throw new Error('Sensitive field accessed')
    return target[key]
  } })
}

test('only the exact same-origin voice path is correlated; raw URLs and IDs are not persisted', () => {
  const d = createVoiceDiagnostics()
  for (const url of ['wss://other.example/api/voice', 'wss://lie.agency/api/other', 'wss://name:pass@lie.agency/api/voice']) assert.equal(d.accept(created(url, url)), null)
  assert.equal(d.accept({ method: 'Network.webSocketFrameReceived', params: { payloadData: secret } }), null)
  assert.equal(d.accept(event('loadingFailed', { requestId: 'unrelated', errorText: secret })), null)
  assert.equal(d.accept(created()).connection, 1)
  assert.equal(d.accept(created()), null)
  const serialized = JSON.stringify(d.snapshot())
  for (const value of [secret, 'raw-private-request-id', '/api/voice', 'token=']) assert.ok(!serialized.includes(value))
  assert.equal(d.snapshot().connections, 1)
})

test('handshake classification reads no request or response headers', () => {
  const d = createVoiceDiagnostics(); d.accept(created())
  d.accept({ method: 'Network.webSocketWillSendHandshakeRequest', params: getterTrap(event('', {}).params) })
  d.accept(event('webSocketHandshakeResponseReceived', { response: getterTrap({ status: 101, headers: { Cookie: secret } }) }))
  d.accept(event('webSocketHandshakeResponseReceived', { response: { status: '101', body: secret } }))
  assert.deepEqual(d.snapshot().events.slice(1).map(x => [x.kind, x.sent ?? x.status]), [['handshake-sent', true], ['handshake-response', 101], ['handshake-response', null]])
  assert.equal(d.snapshot().events[1].elapsedMs, 125)
  assert.ok(!JSON.stringify(d.snapshot()).includes(secret))
})

test('frame errors preserve only finite categories and bounded status or net error codes', () => {
  const d = createVoiceDiagnostics(); d.accept(created())
  const inputs = ['', `Error during WebSocket handshake: Unexpected response code: 502 ${secret}`, `net::ERR_CONNECTION_RESET ${secret}`, `net::ERR_${secret}`, `private detail ${secret}`]
  for (const errorMessage of inputs) d.accept(event('webSocketFrameError', { errorMessage }))
  const rows = d.snapshot().events.slice(1)
  assert.deepEqual(rows.map(x => x.category), ['empty', 'http-rejection', 'network', 'network', 'other'])
  assert.equal(rows[1].status, 502); assert.equal(rows[2].netError, 'ERR_CONNECTION_RESET'); assert.equal(rows[3].netError, 'OTHER')
  assert.ok(!JSON.stringify(d.snapshot()).includes(secret))
})

test('loading failure carries only correlated network code, blocked reason and cancellation boolean', () => {
  const d = createVoiceDiagnostics(); d.accept(created())
  d.accept(event('loadingFailed', { errorText: `net::ERR_BLOCKED_BY_CLIENT ${secret}`, blockedReason: 'inspector', canceled: false }))
  d.accept(event('loadingFailed', { errorText: secret, blockedReason: secret, canceled: secret }))
  assert.deepEqual(d.snapshot().events.slice(1).map(x => [x.netError, x.blockedReason, x.canceled]), [['ERR_BLOCKED_BY_CLIENT', 'inspector', false], [null, 'other', null]])
  assert.ok(!JSON.stringify(d.snapshot()).includes(secret))
  assert.ok(!methods.some(method => /FrameReceived|FrameSent/.test(method)))
})

test('not-ready never asks a question; cleanup cannot replace the primary failure; reuse never starts again', async () => {
  let starts = 0, questions = 0, cleanups = 0
  const run = createSingleVoiceAttempt({ start: async () => starts++, waitReady: async () => false, question: async () => questions++, waitAnswer: async () => true, cleanup: async () => { cleanups++; throw new Error(secret) } })
  const result = await run()
  assert.deepEqual(result, { status: 'failed', failure: { stage: 'ready', kind: 'not-ready' }, cleanupFailed: true })
  await assert.rejects(run, /single-use/)
  assert.deepEqual([starts, questions, cleanups], [1, 0, 1])
  assert.ok(!JSON.stringify(result).includes(secret))
})

test('the first thrown cause is preserved locally even when cleanup also fails, with no raw error serialization', async () => {
  const first = new Error(secret)
  const run = createSingleVoiceAttempt({ start: async () => {}, waitReady: async () => { throw first }, question: async () => assert.fail('question must not run'), waitAnswer: async () => assert.fail(), cleanup: async () => { throw new Error('secondary') } })
  const result = await run()
  assert.equal(result.cause, first)
  assert.deepEqual(result.failure, { stage: 'ready', kind: 'exception' })
  assert.ok(!JSON.stringify(result).includes(secret))
})

test('success, incomplete answer and cleanup-only error are distinct; each path cleans once', async () => {
  for (const mode of ['complete', 'incomplete', 'cleanup-fails']) {
    const calls = []
    const run = createSingleVoiceAttempt({ start: async () => calls.push('start'), waitReady: async () => { calls.push('ready'); return true }, question: async () => calls.push('question'), waitAnswer: async () => { calls.push('answer'); return mode !== 'incomplete' }, cleanup: async () => { calls.push('cleanup'); if (mode === 'cleanup-fails') throw new Error(secret) } })
    const result = await run()
    assert.deepEqual(calls, ['start', 'ready', 'question', 'answer', 'cleanup'])
    assert.equal(result.status, mode === 'complete' ? 'complete' : 'failed')
    if (mode === 'incomplete') assert.deepEqual(result.failure, { stage: 'answer', kind: 'incomplete' })
    if (mode === 'cleanup-fails') assert.deepEqual(result.failure, { stage: 'cleanup', kind: 'exception' })
  }
})
