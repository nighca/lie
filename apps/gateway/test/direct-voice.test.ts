import type { Miniflare } from 'miniflare'
import { afterAll, expect, it, vi } from 'vitest'

import config from '../cloudflare.config'
import { cookieFrom, credentials, fakeLinx, testOrigin, voiceRuntime } from './voice-fixture'

const directBindings: Record<string, string> = { ...credentials, VOICE_TRANSPORT: 'direct', VOICE_MAX_SESSION_SECONDS: '600' }
delete directBindings.LINX_WS_TOKEN
const runtimes: Miniflare[] = []
async function runtime(bindings: Record<string, string> = directBindings, secondGateway = false) {
  const instance = await voiceRuntime(bindings, fakeLinx, secondGateway)
  runtimes.push(instance)
  return instance
}
async function identity(instance: Miniflare, cookie: string | null = null) {
  return instance.dispatchFetch(`${testOrigin}/api/voice/status`, { headers: cookie == null ? {} : { Cookie: cookie } })
}
function prepare(instance: Miniflare, cookie: string) {
  return instance.dispatchFetch(`${testOrigin}/api/voice/prepare`, { method: 'POST', headers: { Origin: testOrigin, Cookie: cookie } })
}
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

it('bootstraps independent cookies without OTA and returns the prepared token with no extra OTA', async () => {
  const instance = await runtime()
  const a = await identity(instance), b = await identity(instance)
  expect(await a.json()).toEqual({ status: 'ready', transport: 'direct' })
  expect(a.headers.get('Cache-Control')).toBe('no-store')
  expect(a.headers.get('Set-Cookie')).toContain('HttpOnly; SameSite=Lax; Secure')
  const cookieA = cookieFrom(a), cookieB = cookieFrom(b)
  expect(cookieA).not.toBe(cookieB)
  const renewedCookie = cookieFrom(await identity(instance, cookieA))
  const payload = (cookie: string) => JSON.parse(Buffer.from(cookie.split('=')[1].split('.')[0], 'base64url').toString())
  expect(payload(renewedCookie)).toMatchObject({
    deviceId: payload(cookieA).deviceId, clientId: payload(cookieA).clientId, environment: payload(cookieA).environment
  })
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
  const responseA = await prepare(instance, cookieA)
  expect(responseA.status).toBe(200)
  expect(responseA.headers.get('Cache-Control')).toBe('no-store')
  expect(responseA.headers.get('Set-Cookie')).toBeNull()
  const first = await responseA.json() as { url: string; deviceId: string; clientId: string; token: string; maxSessionSeconds: number }
  expect(first).toEqual({ url: 'wss://xrobo-io.qiniuapi.com/v1/ws/', deviceId: expect.any(String), clientId: expect.any(String), token: `device-token-${first.deviceId}`, maxSessionSeconds: 600 })
  expect((await snapshot(instance)).calls).toEqual({ ota: 2, bind: 1, list: 0, ws: 0 })
  const again = await prepare(instance, renewedCookie)
  expect(again.status).toBe(200)
  expect(await again.json()).toEqual(first)
  expect((await snapshot(instance)).calls).toEqual({ ota: 3, bind: 1, list: 1, ws: 0 })
  const second = await (await prepare(instance, cookieB)).json() as typeof first
  expect(second.deviceId).not.toBe(first.deviceId)
  expect(second.clientId).not.toBe(first.clientId)
  expect((await snapshot(instance)).devices).toHaveLength(2)
  expect(JSON.stringify(first)).not.toContain(credentials.LINX_API_KEY)
}, 20000)

it('replaces an old namespace cookie before allocating the new preview device', async () => {
  const old = await runtime({ ...directBindings, VOICE_DEVICE_ENVIRONMENT: 'old-fixed-preview' })
  const current = await runtime({ ...directBindings, VOICE_DEVICE_ENVIRONMENT: 'formal-preview' })
  const oldCookie = cookieFrom(await identity(old))
  const rejected = await prepare(current, oldCookie)
  expect(rejected.status).toBe(409)
  expect(await rejected.json()).toEqual({ error: 'identity-required' })
  const newCookie = cookieFrom(await identity(current, oldCookie))
  expect(newCookie).not.toBe(oldCookie)
  expect((await snapshot(current)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
  expect((await prepare(current, newCookie)).status).toBe(200)
}, 20000)

it.each(['conflictAfterBind', 'malformedAfterBind'])('returns the confirmed token only after uncertain %s ownership is checked', async mode => {
  const instance = await runtime()
  const cookie = cookieFrom(await identity(instance))
  await control(instance, { [mode]: true })
  const response = await prepare(instance, cookie)
  expect(response.status).toBe(200)
  expect(await response.json()).toHaveProperty('token')
  expect((await snapshot(instance)).calls).toEqual({ ota: 2, bind: 1, list: 1, ws: 0 })
}, 20000)

it('rejects a token for a device owned by another Agent instead of returning it', async () => {
  const instance = await runtime()
  const cookie = cookieFrom(await identity(instance))
  expect((await prepare(instance, cookie)).status).toBe(200)
  await control(instance, { foreignAgent: true })
  const response = await prepare(instance, cookie)
  expect(response.status).toBe(502)
  expect(await response.json()).toEqual({ error: 'provider-unavailable' })
  expect((await snapshot(instance)).calls).toEqual({ ota: 3, bind: 1, list: 1, ws: 0 })
}, 20000)

it('reconciles concurrent first direct preparations for the same cookie', async () => {
  const instance = await runtime(directBindings, true)
  const cookie = cookieFrom(await identity(instance))
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
  const cookie = cookieFrom(await identity(instance))
  expect(await (await prepare(instance, cookie)).json()).toHaveProperty('maxSessionSeconds', Number(value))
}, 20000)

it.each(['missing', '', 'DIRECT', 'ws2'])('fails closed for invalid or missing server transport %s', async mode => {
  const bindings: Record<string, string> = { ...directBindings, VOICE_TRANSPORT: mode }
  if (mode === 'missing') delete bindings.VOICE_TRANSPORT
  const instance = await runtime(bindings)
  const status = await identity(instance)
  expect(await status.json()).toEqual({ status: 'unavailable' })
  expect(status.headers.get('Set-Cookie')).toBeNull()
  expect((await prepare(instance, '')).status).toBe(503)
  expect((await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: { Origin: testOrigin, Upgrade: 'websocket' } })).status).toBe(404)
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
}, 20000)

it.each(['LINX_API_KEY', 'LINX_AGENT_ID', 'VOICE_DEVICE_COOKIE_SECRET', 'VOICE_DEVICE_ENVIRONMENT', 'VOICE_MAX_SESSION_SECONDS'])('requires valid direct configuration %s without requiring the relay WS token', async key => {
  const instance = await runtime({ ...directBindings, [key]: '' })
  const status = await identity(instance)
  expect(await status.json()).toEqual({ status: 'unavailable' })
  expect(status.headers.get('Set-Cookie')).toBeNull()
  expect((await prepare(instance, '')).status).toBe(503)
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
}, 20000)

it('rejects direct relay entry, query overrides and nonempty/cross-origin preparation without OTA', async () => {
  const instance = await runtime()
  const cookie = cookieFrom(await identity(instance))
  expect((await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: { Origin: testOrigin, Cookie: cookie, Upgrade: 'websocket' } })).status).toBe(404)
  for (const [suffix, headers, body, expected] of [
    ['', { Origin: 'https://other.example' }, null, 403],
    ['?device-id=other', { Origin: testOrigin }, null, 403],
    ['', { Origin: testOrigin }, '{}', 400],
  ] as const) {
    const response = await instance.dispatchFetch(`${testOrigin}/api/voice/prepare${suffix}`, { method: 'POST', headers: { ...headers, Cookie: cookie }, body })
    expect(response.status).toBe(expected)
  }
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
}, 20000)
