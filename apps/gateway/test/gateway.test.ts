import { Miniflare } from 'miniflare'
import type { WebSocket as TestSocket } from 'miniflare'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { cookieFrom, credentials, fakeLinx, testOrigin, voiceRuntime } from './voice-fixture'

const runtimes: Miniflare[] = []
async function runtime(bindings: Record<string, string> = credentials, upstream = fakeLinx, secondGateway = false) {
  const instance = await voiceRuntime(bindings, upstream, secondGateway)
  runtimes.push(instance)
  return instance
}
async function identity(instance: Miniflare) {
  const response = await instance.dispatchFetch(`${testOrigin}/api/voice/status`)
  return cookieFrom(response)
}
async function prepare(instance: Miniflare, cookie: string) {
  return instance.dispatchFetch(`${testOrigin}/api/voice/prepare`, { method: 'POST', headers: { Origin: testOrigin, Cookie: cookie } })
}
async function preparedHeaders(instance: Miniflare) {
  const cookie = await identity(instance)
  expect((await prepare(instance, cookie)).status).toBe(204)
  return voiceHeaders({ Cookie: cookie })
}
async function control(instance: Miniflare, value: object) {
  const upstream = await instance.getWorker('upstream')
  await upstream.fetch('https://upstream.test/control', { method: 'POST', body: JSON.stringify(value) })
}
async function snapshot(instance: Miniflare) {
  return (await (await instance.getWorker('upstream')).fetch('https://upstream.test/snapshot')).json() as Promise<{calls: {ota:number;bind:number;list:number;ws:number};devices: {mac:string;client:string;agent:string|null}[]}>
}

let gateway: Miniflare
beforeAll(async () => { gateway = await runtime() }, 20000)
afterAll(async () => { await Promise.all(runtimes.map((instance) => instance.dispose())) })

function voiceHeaders(overrides: Record<string, string> = {}) {
  return { Upgrade: 'websocket', Origin: testOrigin, ...overrides }
}
function message(socket: TestSocket): Promise<string | ArrayBuffer | Uint8Array> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Message timed out')), 2000)
    socket.addEventListener('message', (event) => { clearTimeout(timeout); resolve(event.data) }, { once: true })
  })
}
function closed(socket: TestSocket): Promise<{ code: number; reason: string }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Close timed out')), 2000)
    socket.addEventListener('close', (event) => { clearTimeout(timeout); resolve({ code: event.code, reason: event.reason }) }, { once: true })
  })
}

describe('gateway in workerd', () => {
  it('serves health/static bindings while missing game/API paths remain explicit failures', async () => {
    const health = await gateway.dispatchFetch(`${testOrigin}/api/health`)
    expect(await health.json()).toEqual({ status: 'ok', storage: 'none' })
    expect(health.headers.get('Cache-Control')).toBe('no-store')
    expect(await (await gateway.dispatchFetch(`${testOrigin}/`)).text()).toContain('static app')
    const javascript = await gateway.dispatchFetch(`${testOrigin}/app.js`)
    expect(javascript.headers.get('Content-Type')).toContain('javascript')
    expect(await javascript.text()).toContain('gateway fixture')
    expect(await (await gateway.dispatchFetch(`${testOrigin}/games/test.json`)).json()).toEqual({ id: 'test' })
    for (const path of ['/games/missing.json', '/api/missing']) expect((await gateway.dispatchFetch(testOrigin + path)).status).toBe(404)
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice`)).status).toBe(426)
  })

  it('preserves cached game revalidation across repeated loads', async () => {
    const url = `${testOrigin}/games/test.json`
    const initial = await gateway.dispatchFetch(url)
    expect(initial.status).toBe(200)
    expect(await initial.json()).toEqual({ id: 'test' })
    const etag = initial.headers.get('ETag')!
    expect(etag).toBeTruthy()
    for (let reload = 0; reload < 6; reload++) {
      const response = await gateway.dispatchFetch(url, { headers: { 'If-None-Match': etag } })
      expect(response.status).toBe(304)
      expect(response.headers.get('ETag')).toBe(etag)
      expect(await response.text()).toBe('')
    }
    const missing = await gateway.dispatchFetch(`${testOrigin}/games/missing.json`, { headers: { 'If-None-Match': etag } })
    expect(missing.status).toBe(404)
  })

  it('rejects missing/cross-origin, query overrides and unconfigured voice', async () => {
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Origin: 'https://elsewhere.example' }) })).status).toBe(403)
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Origin: '' }) })).status).toBe(403)
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice?upstream=https://elsewhere.example`, { headers: voiceHeaders() })).status).toBe(403)
    const unconfigured = await runtime({ ...credentials, LINX_API_KEY: '' })
    expect((await unconfigured.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders() })).status).toBe(503)
  }, 20000)

  it('bootstraps only a private browser identity without calling the provider', async () => {
    const checked = await runtime(credentials, `let calls = 0; export default { fetch(request) {
      if (new URL(request.url).pathname === '/count') return Response.json({calls});
      calls++; return new Response('Unexpected upstream request', {status: 500});
    } }`)
    const upstream = await checked.getWorker('upstream')
    const response = await checked.dispatchFetch(`${testOrigin}/api/voice/status`)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ready', transport: 'relay' })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly')
    expect(await (await upstream.fetch('https://upstream.test/count')).json()).toEqual({ calls: 0 })
    for (const headers of [{ Origin: 'https://elsewhere.example' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
      expect((await checked.dispatchFetch(`${testOrigin}/api/voice/status`, { headers })).status).toBe(403)
    }
  }, 20000)

  it.each(['LINX_API_KEY', 'LINX_WS_TOKEN', 'LINX_AGENT_ID', 'VOICE_DEVICE_COOKIE_SECRET'])('reports unavailable when %s is not configured', async (key) => {
    const unconfigured = await runtime({ ...credentials, [key]: '' })
    const response = await unconfigured.dispatchFetch(`${testOrigin}/api/voice/status`)
    expect(await response.json()).toEqual({ status: 'unavailable' })
    expect(response.headers.get('Set-Cookie')).toBeNull()
  }, 20000)

  it('opens a prepared browser identity and preserves fixed provider headers, text/binary and close', async () => {
    const response = await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: await preparedHeaders(gateway) })
    expect(response.status).toBe(101)
    expect(response.headers.get('Authorization')).toBe(null)
    expect(response.headers.get('Set-Cookie')).toBe(null)
    const socket = response.webSocket!
    socket.accept()
    try {
      const text = message(socket)
      socket.send('{"type":"hello","transport":"websocket"}')
      expect(await text).toBe('{"type":"hello","transport":"websocket"}')
      const binary = message(socket)
      socket.send(new Uint8Array([0, 255, 1, 128]))
      expect(new Uint8Array(await binary as ArrayBuffer)).toEqual(new Uint8Array([0, 255, 1, 128]))
      const closeEvent = closed(socket)
      socket.send('server-close')
      expect(await closeEvent).toEqual({ code: 1000, reason: 'upstream complete' })
    } finally { socket.close() }
  })

  it('closes the relay for oversized frames rather than forwarding unbounded content', async () => {
    const response = await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: await preparedHeaders(gateway) })
    const socket = response.webSocket!
    socket.accept()
    const closeEvent = closed(socket)
    socket.send(new Uint8Array(65537))
    expect(await closeEvent).toEqual({ code: 1009, reason: 'Frame too large' })
    socket.close()
  })

  it('returns a sanitized failure when upstream refuses WebSocket upgrade', async () => {
    const rejected = await runtime()
    const headers = await preparedHeaders(rejected)
    await control(rejected, { rejectWs: true })
    const response = await rejected.dispatchFetch(`${testOrigin}/api/voice`, { headers })
    expect(response.status).toBe(502)
    expect(await response.text()).toBe('Voice upstream unavailable')
  }, 20000)
})


it('propagates a configured one-second cap through the real workerd route', async () => {
  const instance = await runtime({ ...credentials, VOICE_MAX_SESSION_SECONDS: '1' })
  const response = await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: { ...await preparedHeaders(instance), 'X-Voice-Max-Session-Seconds': '600' } })
  expect(response.status).toBe(101)
  const socket = response.webSocket!
  socket.accept()
  expect(await closed(socket)).toEqual({ code: 1000, reason: 'Conversation time limit' })
}, 20000)

it('does not open the upstream in workerd when the deployment cap is invalid', async () => {
  const instance = await runtime({ ...credentials, VOICE_MAX_SESSION_SECONDS: '0' }, `let calls = 0; export default { fetch(request) {
    if (new URL(request.url).pathname === '/count') return Response.json({ calls });
    calls++; return new Response('unexpected call', { status: 500 });
  } }`)
  const response = await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders() })
  expect(response.status).toBe(500)
  const upstream = await instance.getWorker('upstream')
  expect(await (await upstream.fetch('https://upstream.test/count')).json()).toEqual({ calls: 0 })
}, 20000)

it('requires a valid bootstrap identity and an empty same-origin prepare request', async () => {
  const instance = await runtime()
  expect((await prepare(instance, '')).status).toBe(409)
  const cookie = await identity(instance)
  for (const request of [
    { headers: { Origin: 'https://elsewhere.example', Cookie: cookie } },
    { headers: { Origin: testOrigin, Cookie: cookie }, body: '{}' },
  ]) {
    const response = await instance.dispatchFetch(`${testOrigin}/api/voice/prepare`, { method: 'POST', ...request })
    expect(response.status).toBe(request.body == null ? 403 : 400)
  }
  expect((await snapshot(instance)).calls).toEqual({ ota: 0, bind: 0, list: 0, ws: 0 })
  expect((await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Cookie: cookie }) })).status).toBe(503)
  expect((await snapshot(instance)).calls.bind).toBe(0)
}, 20000)

it('prepares one stable identity without returning credentials or opening a socket', async () => {
  const instance = await runtime()
  const cookie = await identity(instance)
  const first = await prepare(instance, cookie)
  expect(first.status).toBe(204)
  expect(await first.text()).toBe('')
  expect(first.headers.get('Set-Cookie')).toBeNull()
  expect((await snapshot(instance)).calls).toEqual({ ota: 2, bind: 1, list: 0, ws: 0 })
  expect((await prepare(instance, cookie)).status).toBe(204)
  const inspected = await snapshot(instance)
  expect(inspected.devices).toHaveLength(1)
  expect(inspected.calls.bind).toBe(1)
  expect(inspected.calls.list).toBe(1)
}, 20000)

it.each(['conflictAfterBind', 'malformedAfterBind'])('reconciles an uncertain %s bind once without allocating another identity', async mode => {
  const instance = await runtime()
  const cookie = await identity(instance)
  await control(instance, { [mode]: true })
  expect((await prepare(instance, cookie)).status).toBe(204)
  const inspected = await snapshot(instance)
  expect(inspected.calls).toEqual({ ota: 2, bind: 1, list: 1, ws: 0 })
  expect(inspected.devices).toHaveLength(1)
}, 20000)

it('does not treat conflict without a matching bound identity as successful preparation', async () => {
  const instance = await runtime()
  const cookie = await identity(instance)
  await control(instance, { rejectBind: true })
  expect((await prepare(instance, cookie)).status).toBe(502)
  expect((await snapshot(instance)).calls).toEqual({ ota: 2, bind: 1, list: 0, ws: 0 })
  await control(instance, { rejectBind: false })
  expect((await prepare(instance, cookie)).status).toBe(204)
  await control(instance, { foreignAgent: true })
  expect((await prepare(instance, cookie)).status).toBe(502)
  expect((await snapshot(instance)).devices).toHaveLength(1)
}, 20000)

it('reconciles concurrent first preparation across two gateway instances using the same cookie', async () => {
  const instance = await runtime(credentials, fakeLinx, true)
  const cookie = await identity(instance)
  const results = await Promise.all([
    prepare(instance, cookie),
    instance.dispatchFetch('https://game-two.example/api/voice/prepare', { method: 'POST', headers: { Origin: 'https://game-two.example', Cookie: cookie } })
  ])
  expect(results.map(response => response.status)).toEqual([204, 204])
  const inspected = await snapshot(instance)
  expect(inspected.devices).toHaveLength(1)
  expect(inspected.calls.ws).toBe(0)
}, 20000)

it('keeps different cookie identities online while a newer same-device socket replaces its predecessor', async () => {
  const instance = await runtime()
  const headersA = await preparedHeaders(instance)
  const headersB = await preparedHeaders(instance)
  const a = (await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: headersA })).webSocket!
  const b = (await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: headersB })).webSocket!
  a.accept(); b.accept()
  const oldClosed = closed(a)
  const a2 = (await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: headersA })).webSocket!
  a2.accept()
  try {
    expect(await oldClosed).toEqual({ code: 1000, reason: 'Replaced by newer connection' })
    const next = message(a2), independent = message(b)
    a2.send('new same identity'); b.send('other identity')
    expect(await next).toBe('new same identity')
    expect(await independent).toBe('other identity')
    expect((await snapshot(instance)).devices).toHaveLength(2)
  } finally { a.close(); a2.close(); b.close() }
}, 20000)

it('uses only the current cookie after bootstrap candidates compete, without creating during WebSocket upgrade', async () => {
  const instance = await runtime()
  const cookieA = await identity(instance), cookieB = await identity(instance)
  expect((await prepare(instance, cookieA)).status).toBe(204)
  expect((await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Cookie: cookieB }) })).status).toBe(503)
  expect((await snapshot(instance)).calls.bind).toBe(1)
  expect((await prepare(instance, cookieB)).status).toBe(204)
  const b = (await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Cookie: cookieB }) })).webSocket!
  b.accept(); b.close()
  expect((await snapshot(instance)).calls.bind).toBe(2)
}, 20000)

it('accepts a zero-byte stream while rejecting actual prepare body bytes', async () => {
  const instance = await runtime()
  const cookie = await identity(instance)
  const empty = await instance.dispatchFetch(`${testOrigin}/api/voice/prepare`, { method: 'POST', headers: { Origin: testOrigin, Cookie: cookie }, body: '' })
  expect(empty.status).toBe(204)
  const filled = await instance.dispatchFetch(`${testOrigin}/api/voice/prepare`, { method: 'POST', headers: { Origin: testOrigin, Cookie: cookie }, body: 'x' })
  expect(filled.status).toBe(400)
  expect((await snapshot(instance)).calls.bind).toBe(1)
}, 20000)


it.each([false, true])('uses shared token first and refreshes only one rejected handshake (401=%s)', async rejectedShared => {
  const instance = await runtime()
  const headers = await preparedHeaders(instance)
  const before = (await snapshot(instance)).calls
  if (rejectedShared) await control(instance, { rejectSharedToken: true })
  const response = await instance.dispatchFetch(`${testOrigin}/api/voice`, { headers })
  expect(response.status).toBe(101)
  const socket = response.webSocket!
  socket.accept()
  const after = (await snapshot(instance)).calls
  expect(after.ota - before.ota).toBe(rejectedShared ? 1 : 0)
  expect(after.ws - before.ws).toBe(rejectedShared ? 2 : 1)
  expect(after.bind).toBe(before.bind)
  const closeEvent = closed(socket)
  socket.send('server-close')
  await closeEvent
  expect((await snapshot(instance)).calls).toEqual(after)
  socket.close()
}, 20000)
