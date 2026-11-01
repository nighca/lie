import { afterEach, expect, it, vi } from 'vitest'

import gateway from '../src/index'
import type { GatewayEnv } from '../src/index'
import { browserDeviceCookie, newBrowserDevice } from '../src/browser-device'
import { credentials } from './voice-fixture'

const env: GatewayEnv = { ...credentials, VOICE_MAX_SESSION_SECONDS: '600', ASSETS: { fetch: vi.fn() } as unknown as Fetcher }
async function request(signal?: AbortSignal) {
  const plain = new Request('https://game.example/api/voice')
  const device = newBrowserDevice(plain, env)
  const cookie = (await browserDeviceCookie(plain, env, device)).split(';')[0]
  return { device, request: new Request(plain.url, { headers: { Cookie: cookie, Origin: 'https://game.example', Upgrade: 'websocket' }, signal }) }
}
function unauthorized() {
  const cancelled = vi.fn()
  return { response: new Response(new ReadableStream({ cancel: cancelled }), { status: 401 }), cancelled }
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

it.each([403, 500, 'network'])('does not refresh or retry a non-401 failure (%s)', async failure => {
  const one = await request()
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    if (failure === 'network') throw new Error('private network detail')
    return new Response('private rejection', { status: failure as number })
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const response = await gateway.fetch(one.request, env)
  expect(response.status).toBe(502)
  expect(await response.text()).toBe('Voice upstream unavailable')
  expect(fetch).toHaveBeenCalledOnce()
})

it('cancels the first 401 body and retries once with the same identity, without persisting refreshed token', async () => {
  const one = await request(), first = unauthorized()
  const fetch = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(first.response)
    .mockResolvedValueOnce(Response.json({ websocket: { token: 'fresh-device-token' } }))
    .mockResolvedValueOnce(new Response('still rejected', { status: 401 }))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  expect((await gateway.fetch(one.request, env)).status).toBe(502)
  expect(first.cancelled).toHaveBeenCalledOnce()
  expect(fetch).toHaveBeenCalledTimes(3)
  const calls = fetch.mock.calls
  expect(calls.map(([url]) => url)).toEqual(['https://xrobo-io.qiniuapi.com/v1/ws/', 'https://xrobo.qiniuapi.com/v1/ota/', 'https://xrobo-io.qiniuapi.com/v1/ws/'])
  for (const index of [0, 2]) {
    const headers = new Headers(calls[index][1]?.headers)
    expect(headers.get('Device-Id')).toBe(one.device.deviceId)
    expect(headers.get('Client-Id')).toBe(one.device.clientId)
    expect(headers.get('X-Agent-ID')).toBe(credentials.LINX_AGENT_ID)
    expect(headers.get('Authorization')).toBe(`Bearer ${index === 0 ? credentials.LINX_WS_TOKEN : 'fresh-device-token'}`)
  }
  expect(calls[0][1]?.signal).toBe(calls[2][1]?.signal)
  fetch.mockResolvedValueOnce(new Response('forbidden', { status: 403 }))
  await gateway.fetch(one.request, env)
  expect(new Headers(fetch.mock.calls[3][1]?.headers).get('Authorization')).toBe(`Bearer ${credentials.LINX_WS_TOKEN}`)
  expect(fetch).toHaveBeenCalledTimes(4)
})

it('shares nine seconds across initial handshake and refresh rather than restarting its budget', async () => {
  const one = await request(), first = unauthorized()
  vi.useFakeTimers()
  let resolveFirst!: (value: Response) => void
  let startedAt = 0
  const fetch = vi.spyOn(globalThis, 'fetch')
    .mockImplementationOnce(() => new Promise(resolve => { startedAt = Date.now(); resolveFirst = resolve }))
    .mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('cancelled')), { once: true })))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const result = gateway.fetch(one.request, env)
  await vi.waitFor(() => expect(resolveFirst).toBeTypeOf('function'))
  await vi.advanceTimersByTimeAsync(5000 - (Date.now() - startedAt))
  resolveFirst(first.response)
  await vi.advanceTimersByTimeAsync(0)
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(first.cancelled).toHaveBeenCalledOnce()
  await vi.advanceTimersByTimeAsync(3999)
  expect(fetch.mock.calls[1][1]?.signal?.aborted).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  expect((await result).status).toBe(504)
  expect(fetch).toHaveBeenCalledTimes(2)
})

it.each([false, true])('never creates a relay for late successful upgrade after cancellation (refresh=%s)', async refresh => {
  const abort = new AbortController(), one = await request(abort.signal), first = unauthorized()
  const upstream = { accept: vi.fn(), close: vi.fn() }
  const relay = vi.fn(() => { throw new Error('Cancelled upgrade must not create relay') })
  vi.stubGlobal('WebSocketPair', relay)
  let finish!: (value: Response) => void
  const fetch = vi.spyOn(globalThis, 'fetch')
  if (refresh) fetch.mockResolvedValueOnce(first.response).mockResolvedValueOnce(Response.json({ websocket: { token: 'fresh' } }))
  fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const result = gateway.fetch(one.request, env)
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
  abort.abort()
  finish({ webSocket: upstream } as unknown as Response)
  expect((await result).status).toBe(504)
  expect(upstream.accept).toHaveBeenCalledOnce()
  expect(upstream.close).toHaveBeenCalledExactlyOnceWith(1000, 'Connection cancelled')
  expect(relay).not.toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledTimes(refresh ? 3 : 1)
  if (refresh) expect(first.cancelled).toHaveBeenCalledOnce()
})

it('does not OTA after an already cancelled first handshake returns 401 late', async () => {
  const abort = new AbortController(), one = await request(abort.signal), first = unauthorized()
  let finish!: (value: Response) => void
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const result = gateway.fetch(one.request, env)
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
  abort.abort(); finish(first.response)
  expect((await result).status).toBe(504)
  expect(first.cancelled).toHaveBeenCalledOnce()
  expect(fetch).toHaveBeenCalledOnce()
})
