import { test } from 'node:test'
import assert from 'node:assert/strict'

import { relativeGuard, verify } from './release-api-simple.mjs'

test('relative guard is a single 240s active plus 60s cleanup budget without external window IO', () => {
  let now = 1000
  const guard = relativeGuard(() => now)
  assert.equal(guard.remaining(), 240000)
  assert.equal(guard.remaining(true), 300000)
  assert.equal(guard.timeout(10000, { phaseRemaining: 123 }), 123)
  now += 240000
  assert.throws(() => guard.assertActive(), /exhausted/)
  assert.equal(guard.remaining(true), 60000)
  assert.equal(guard.timeout(8000, { cleanup: true, cleanupRemaining: 500 }), 500)
  now += 60000
  assert.throws(() => guard.assertActive(true), /exhausted/)
})

test('verify rejects any unapproved origin before IO', async () => {
  let touched = false
  await assert.rejects(verify('https://other.invalid', { io: { readFile() { touched = true } } }), /production origin/)
  assert.equal(touched, false)
})
