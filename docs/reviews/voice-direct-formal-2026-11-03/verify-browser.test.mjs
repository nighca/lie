import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { cookieIdentity } from './verify-browser.mjs'

const now = 1700000000000
const identity = { deviceId: '02:00:00:00:00:01', clientId: '00000000-0000-4000-8000-000000000001', environment: 'direct-formal-20261103-v1:https' }
function cookie(payload = {}) {
  return { name: '__Host-lie-device', domain: 'direct-test-20261103.preview.lie.agency', path: '/', secure: true, httpOnly: true,
    value: `${Buffer.from(JSON.stringify({ v: 1, ...identity, issuedAt: now / 1000, expiresAt: now / 1000 + 60, ...payload })).toString('base64url')}.fake_signature` }
}

test('Cookie projection includes only identity fields and requires the formal namespace', () => {
  assert.deepEqual(cookieIdentity([cookie()], now), identity)
  assert.throws(() => cookieIdentity([cookie({ environment: 'direct-test-20261103:https' })], now))
  assert.throws(() => cookieIdentity([cookie({ deviceId: [identity.deviceId] })], now))
  assert.throws(() => cookieIdentity([cookie({ expiresAt: now / 1000 })], now))
  assert.throws(() => cookieIdentity([cookie({ issuedAt: now / 1000 + 1 })], now))
})

test('Cookie must be a unique secure HttpOnly host cookie', () => {
  for (const patch of [{ httpOnly: false }, { secure: false }, { path: '/api' }, { domain: 'other.example' }, { value: 'malformed' }]) {
    assert.throws(() => cookieIdentity([{ ...cookie(), ...patch }], now))
  }
  assert.throws(() => cookieIdentity([], now))
  assert.throws(() => cookieIdentity([cookie(), cookie()], now))
})

test('verifier refuses execution without the explicit authorization flag', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('./verify-browser.mjs', import.meta.url))], { encoding: 'utf8' })
  assert.equal(run.status, 1)
  assert.equal(run.stdout, '')
  assert.match(run.stderr, /Formal preview verification stopped/)
  assert.doesNotMatch(run.stderr, /ENOENT|ledger\.json|token|deviceId|clientId/)
})
