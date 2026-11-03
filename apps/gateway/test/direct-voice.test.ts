import type { Miniflare } from 'miniflare'
import { afterAll, expect, it, vi } from 'vitest'

import config from '../cloudflare.config'
import { cookieFrom, credentials, fakeLinx, signedCookie, testOrigin, voiceRuntime } from './voice-fixture'

const directBindings: Record<string, string> = { ...credentials, VOICE_TRANSPORT: 'direct', VOICE_MAX_SESSION_SECONDS: '600' }
delete directBindings.LINX_WS_TOKEN
const runtimes: Miniflare[] = []
async function runtime(bindings: Record<string, string> = directBindings, secondGateway = false) {
  const instance = await voiceRuntime(bindings, fakeLinx, secondGateway)
  runtimes.push(instance)
  return instance
}
function prepare(instance: Miniflare, cookie = '') {
  return instance.dispatchFetch(`${testOrigin}/api/voice/prepare`, { method: 'POST', headers: { Origin: testOrigin, Cookie: cookie } })
}
function payload(cookie: string) { return JSON.parse(Buffer.from(cookie.split('=')[1].split('.')[0], 'base64url').toString()) }
async function control(instance: Miniflare, value: object) {
  await (await instance.getWorker('upstream')).fetch('https://upstream.test/control', { method: 'POST', body: JSON.stringify(value) })
}
async function snapshot(instance: Miniflare) {
  return (await (await instance.getWorker('upstream')).fetch('https://upstream.test/snapshot')).json() as Promise<{calls: {ota:number;bind:number;list:number;ws:number};devices: {mac:string;client:string;agent:string|null}[]}>
}
afterAll(async () => { await Promise.all(runtimes.map(instance => instance.dispose())) })

it('configures direct by default and permits only an explicit server configuration override', () => {
  vi.stubEnv('LIE_VOICE_TRANSPORT', undefined)
  expect(config.worker().env.VOICE_TRANSPORT).toEqual({ type: 'text', value: 'direct' })
  vi.stubEnv('LIE_VOICE_TRANSPORT', 'relay')
  expect(config.worker().env.VOICE_TRANSPORT).toEqual({ type: 'text', value: 'relay' })
  vi.unstubAllEnvs()
})

it('reports readiness without creating a Cookie identity or calling the provider', async () => {
  const instance = await runtime()
  const response = await instance.dispatchFetch(`${testOrigin}/api/health`)
  expect(await response.json()).toEqual({ status: 'ok', storage: 'none', voice: { status: 'ready', transport: 'direct' } })
  expect(response.headers.get('Set-Cookie')).toBeNull()
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
}, 20000)

it('prepares and signs one matching identity, then renews it without an extra token OTA', async () => {
  const instance = await runtime()
  const response = await prepare(instance)
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; SameSite=Lax; Secure')
  const cookie = cookieFrom(response)
  const first = await response.json() as { transport: string; url: string; deviceId: string; clientId: string; token: string; maxSessionSeconds: number }
  expect(first).toEqual({ transport: 'direct', url: 'wss://xrobo-io.qiniuapi.com/v1/ws/', deviceId: payload(cookie).deviceId,
    clientId: payload(cookie).clientId, token: `device-token-${payload(cookie).deviceId}`, maxSessionSeconds: 600 })
  expect((await snapshot(instance)).calls).toEqual({ ota: 2, bind: 1, list: 0, ws: 0 })
  const renewed = await prepare(instance, cookie)
  expect(renewed.status).toBe(200)
  expect(await renewed.json()).toEqual(first)
  expect(payload(cookieFrom(renewed))).toMatchObject({ deviceId: first.deviceId, clientId: first.clientId, environment: payload(cookie).environment })
  expect((await snapshot(instance)).calls).toEqual({ ota: 3, bind: 1, list: 1, ws: 0 })
  expect(JSON.stringify(first)).not.toContain(credentials.LINX_API_KEY)
}, 20000)

it('keeps each simultaneous first response paired with its own Cookie and descriptor', async () => {
  const instance = await runtime()
  const [a, b] = await Promise.all([prepare(instance), prepare(instance)])
  const cookieA = cookieFrom(a), cookieB = cookieFrom(b)
  const [bodyA, bodyB] = await Promise.all([a.json(), b.json()]) as { deviceId: string; clientId: string }[]
  expect(bodyA).toMatchObject({ deviceId: payload(cookieA).deviceId, clientId: payload(cookieA).clientId })
  expect(bodyB).toMatchObject({ deviceId: payload(cookieB).deviceId, clientId: payload(cookieB).clientId })
  expect(bodyA.deviceId).not.toBe(bodyB.deviceId)
  expect(bodyA.clientId).not.toBe(bodyB.clientId)
  const next = await prepare(instance, cookieB)
  expect(await next.json()).toMatchObject(bodyB)
  expect((await snapshot(instance)).devices).toHaveLength(2)
}, 20000)

it('replaces an invalid or old namespace Cookie in the same prepare request', async () => {
  const instance = await runtime()
  const oldCookie = await signedCookie({ ...directBindings, VOICE_DEVICE_ENVIRONMENT: 'old-fixed-preview' })
  for (const cookie of [oldCookie, '__Host-lie-device=invalid']) {
    const response = await prepare(instance, cookie)
    expect(response.status).toBe(200)
    const nextCookie = cookieFrom(response)
    const body = await response.json()
    expect(nextCookie).not.toBe(cookie)
    expect(payload(nextCookie).environment).toBe('test:https')
    expect(body).toMatchObject({ deviceId: payload(nextCookie).deviceId, clientId: payload(nextCookie).clientId })
  }
  expect((await snapshot(instance)).devices).toHaveLength(2)
}, 20000)

it('retains the new identity on provider failure so an explicit retry recovers the same binding', async () => {
  const instance = await runtime()
  await control(instance, { failConfirmedOta: true })
  const failed = await prepare(instance)
  expect(failed.status).toBe(502)
  expect(await failed.json()).toEqual({ error: 'provider-unavailable' })
  expect(failed.headers.get('Cache-Control')).toBe('no-store')
  const cookie = cookieFrom(failed)
  const before = await snapshot(instance)
  expect(before.devices).toHaveLength(1)
  expect(before.devices[0]).toMatchObject({ mac: payload(cookie).deviceId, client: payload(cookie).clientId, agent: credentials.LINX_AGENT_ID })
  expect(before.calls).toEqual({ ota: 2, bind: 1, list: 0, ws: 0 })
  await control(instance, { failConfirmedOta: false })
  const retried = await prepare(instance, cookie)
  expect(retried.status).toBe(200)
  expect(await retried.json()).toMatchObject({ deviceId: payload(cookie).deviceId, clientId: payload(cookie).clientId })
  expect(payload(cookieFrom(retried)).deviceId).toBe(payload(cookie).deviceId)
  expect((await snapshot(instance)).calls).toEqual({ ota: 3, bind: 1, list: 1, ws: 0 })
}, 20000)

it.each(['conflictAfterBind', 'malformedAfterBind'])('returns the confirmed token only after uncertain %s ownership is checked', async mode => {
  const instance = await runtime()
  await control(instance, { [mode]: true })
  const response = await prepare(instance)
  expect(response.status).toBe(200)
  expect(await response.json()).toHaveProperty('token')
  expect((await snapshot(instance)).calls).toEqual({ ota: 2, bind: 1, list: 1, ws: 0 })
}, 20000)

it('rejects another Agent token without changing the Cookie identity', async () => {
  const instance = await runtime()
  const cookie = cookieFrom(await prepare(instance))
  await control(instance, { foreignAgent: true })
  const response = await prepare(instance, cookie)
  expect(response.status).toBe(502)
  expect(await response.json()).toEqual({ error: 'provider-unavailable' })
  expect(payload(cookieFrom(response)).deviceId).toBe(payload(cookie).deviceId)
  expect((await snapshot(instance)).calls).toEqual({ ota: 3, bind: 1, list: 1, ws: 0 })
}, 20000)

it('reconciles concurrent first direct preparations for the same signed Cookie', async () => {
  const instance = await runtime(directBindings, true)
  const cookie = await signedCookie(directBindings)
  const responses = await Promise.all([
    prepare(instance, cookie),
    instance.dispatchFetch('https://game-two.example/api/voice/prepare', { method: 'POST', headers: { Origin: 'https://game-two.example', Cookie: cookie } })
  ])
  expect(responses.map(response => response.status)).toEqual([200, 200])
  const bodies = await Promise.all(responses.map(response => response.json()))
  expect(bodies[0]).toEqual(bodies[1])
  expect((await snapshot(instance)).devices).toHaveLength(1)
}, 20000)

it.each(['1', '17', '2147483'])('returns the configured valid deadline %s rather than a fixed preview value', async value => {
  const instance = await runtime({ ...directBindings, VOICE_MAX_SESSION_SECONDS: value })
  expect(await (await prepare(instance)).json()).toHaveProperty('maxSessionSeconds', Number(value))
}, 20000)

it.each(['missing', '', 'DIRECT', 'ws2'])('fails closed for invalid or missing server transport %s', async mode => {
  const bindings: Record<string, string> = { ...directBindings, VOICE_TRANSPORT: mode }
  if (mode === 'missing') delete bindings.VOICE_TRANSPORT
  const instance = await runtime(bindings)
  expect(await (await instance.dispatchFetch(`${testOrigin}/api/health`)).json()).toHaveProperty('voice', { status: 'unavailable' })
  const response = await prepare(instance)
  expect(response.status).toBe(503)
  expect(response.headers.get('Set-Cookie')).toBeNull()
  expect((await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: { Origin: testOrigin, Upgrade: 'websocket' } })).status).toBe(404)
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
}, 20000)

it.each(['LINX_API_KEY', 'LINX_AGENT_ID', 'VOICE_DEVICE_COOKIE_SECRET', 'VOICE_DEVICE_ENVIRONMENT', 'VOICE_MAX_SESSION_SECONDS'])('requires valid direct configuration %s without requiring the relay WS token', async key => {
  const instance = await runtime({ ...directBindings, [key]: '' })
  expect(await (await instance.dispatchFetch(`${testOrigin}/api/health`)).json()).toHaveProperty('voice', { status: 'unavailable' })
  const response = await prepare(instance)
  expect(response.status).toBe(503)
  expect(response.headers.get('Set-Cookie')).toBeNull()
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
}, 20000)

it('rejects direct relay entry, query overrides and nonempty/cross-origin preparation before creating identity', async () => {
  const instance = await runtime()
  expect((await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: { Origin: testOrigin, Upgrade: 'websocket' } })).status).toBe(404)
  for (const [suffix, headers, body, expected] of [
    ['', { Origin: 'https://other.example' }, null, 403],
    ['?device-id=other', { Origin: testOrigin }, null, 403],
    ['', { Origin: testOrigin }, '{}', 400],
    ['', { Origin: testOrigin, 'Sec-Fetch-Site': 'cross-site' }, null, 403]
  ] as const) {
    const response = await instance.dispatchFetch(`${testOrigin}/api/voice/prepare${suffix}`, { method: 'POST', headers, body })
    expect(response.status).toBe(expected)
    expect(response.headers.get('Set-Cookie')).toBeNull()
  }
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
}, 20000)
