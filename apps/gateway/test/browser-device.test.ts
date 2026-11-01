import { describe, expect, it, vi } from 'vitest'

import { browserDeviceCookie, deviceProvider, newBrowserDevice, readBrowserDevice, VoiceDeviceError } from '../src/browser-device'
import type { GatewayEnv } from '../src/index'
import { credentials } from './voice-fixture'

const env: GatewayEnv = { ...credentials, VOICE_MAX_SESSION_SECONDS: '600', ASSETS: { fetch: vi.fn() } as unknown as Fetcher }
const request = new Request('https://game.example/api/voice/status')

async function signedRequest(now = Date.now()) {
  const device = newBrowserDevice(request, env, now)
  const cookie = (await browserDeviceCookie(request, env, device, now)).split(';')[0]
  return { device, cookie, request: new Request(request.url, { headers: { Cookie: cookie } }) }
}

describe('server-signed browser identity', () => {
  it('retains one device across renewal without storing provider credentials', async () => {
    const now = 1700000000000
    const one = await signedRequest(now)
    expect(await readBrowserDevice(one.request, env, now)).toEqual(one.device)
    const renewed = await browserDeviceCookie(request, env, one.device, now + 10000)
    const value = await readBrowserDevice(new Request(request.url, { headers: { Cookie: renewed.split(';')[0] } }), env, now + 10000)
    expect(value).toMatchObject({ deviceId: one.device.deviceId, clientId: one.device.clientId, expiresAt: one.device.expiresAt + 10 })
    expect(renewed).toContain('; Secure')
    expect(renewed).toContain('HttpOnly')
    expect(renewed).not.toContain(credentials.LINX_API_KEY)
    expect(one.device.deviceId).not.toBe((await signedRequest(now)).device.deviceId)
  })
  it('rejects tampering, expiration, environment and signing-key changes', async () => {
    const one = await signedRequest(1700000000000)
    expect(await readBrowserDevice(one.request, env, 1700000000000 + 181 * 86400000)).toBeNull()
    expect(await readBrowserDevice(one.request, { ...env, VOICE_DEVICE_ENVIRONMENT: 'other' }, 1700000000000)).toBeNull()
    expect(await readBrowserDevice(one.request, { ...env, VOICE_DEVICE_COOKIE_SECRET: 'another-signing-key-at-least-32-bytes' }, 1700000000000)).toBeNull()
    const [name, value] = one.cookie.split('=')
    const tampered = new Request(request.url, { headers: { Cookie: `${name}=x${value.slice(1)}` } })
    expect(await readBrowserDevice(tampered, env, 1700000000000)).toBeNull()
  })
  it('isolates loopback cookie names and environment from HTTPS identities', async () => {
    const local = new Request('http://127.0.0.1/api/voice/status')
    const device = newBrowserDevice(local, env)
    const cookie = await browserDeviceCookie(local, env, device)
    expect(cookie.startsWith('lie-device-dev=')).toBe(true)
    expect(cookie).not.toContain('; Secure')
    expect(await readBrowserDevice(new Request(request.url, { headers: { Cookie: cookie.split(';')[0] } }), env)).toBeNull()
  })
})

it('bounds provider response bodies and identifies stalled body cancellation as timeout', async () => {
  const { device } = await signedRequest()
  const previous = globalThis.fetch
  try {
    globalThis.fetch = vi.fn(async () => new Response(new Uint8Array(65537)))
    await expect(deviceProvider(env, device, new AbortController().signal).token()).rejects.toMatchObject({ status: 502, code: 'provider-response-size' })
    const abort = new AbortController()
    globalThis.fetch = vi.fn(async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')) } })))
    const result = deviceProvider(env, device, abort.signal).token()
    await Promise.resolve(); await Promise.resolve()
    abort.abort()
    await expect(result).rejects.toBeInstanceOf(VoiceDeviceError)
    await expect(result).rejects.toMatchObject({ status: 504 })
  } finally { globalThis.fetch = previous }
})

it('closes only its owned upstream when an aborted upgrade resolves late', async () => {
  const { default: gateway } = await import('../src/index')
  const one = await signedRequest()
  const abort = new AbortController()
  let finishUpgrade!: (response: Response) => void
  const upstream = { accept: vi.fn(), close: vi.fn() }
  const browserRelay = vi.fn(() => { throw new Error('Cancelled upgrade must not create a browser relay') })
  const previous = globalThis.fetch
  try {
    vi.stubGlobal('WebSocketPair', browserRelay)
    globalThis.fetch = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { finishUpgrade = resolve }))
    const response = gateway.fetch(new Request('https://game.example/api/voice', { headers: { Cookie: one.cookie, Origin: 'https://game.example', Upgrade: 'websocket' }, signal: abort.signal }), env)
    await vi.waitFor(() => expect(finishUpgrade).toBeTypeOf('function'))
    abort.abort()
    finishUpgrade({ webSocket: upstream } as unknown as Response)
    const result = await response
    expect(result.status).toBe(504)
    expect(result.webSocket).toBeUndefined()
    expect(browserRelay).not.toHaveBeenCalled()
    expect(globalThis.fetch).toHaveBeenCalledOnce()
    expect(upstream.accept).toHaveBeenCalledOnce()
    expect(upstream.close).toHaveBeenCalledExactlyOnceWith(1000, 'Connection cancelled')
  } finally { globalThis.fetch = previous; vi.unstubAllGlobals() }
})

it('rejects an erroring request stream without reaching the provider', async () => {
  const { default: gateway } = await import('../src/index')
  const one = await signedRequest()
  const previous = globalThis.fetch
  const fetch = vi.fn(async () => { throw new Error('Unexpected provider request') })
  globalThis.fetch = fetch
  try {
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.error(new Error('Synthetic invalid body')) } })
    const request = new Request('https://game.example/api/voice/prepare', { method: 'POST', headers: { Origin: 'https://game.example', Cookie: one.cookie }, body, duplex: 'half' } as RequestInit & { duplex: 'half' })
    expect((await gateway.fetch(request, env)).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  } finally { globalThis.fetch = previous }
})
