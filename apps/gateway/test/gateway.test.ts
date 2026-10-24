import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL as NodeURL } from 'node:url'

import { Miniflare } from 'miniflare'
import type { WebSocket as TestSocket } from 'miniflare'
import ts from 'typescript'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const testOrigin = 'https://game.example'
const source = await readFile(fileURLToPath(new NodeURL('../src/index.ts', import.meta.url)), 'utf8')
const script = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const runtimes: Miniflare[] = []
const credentials = { LINX_WS_TOKEN: 'upstream-test-token', LINX_DEVICE_ID: 'test-device', LINX_AGENT_ID: 'test-agent', VOICE_ACCESS_TOKEN: 'invited-test-token' }
const fakeUpstream = `
export default { fetch(request) {
  const url = new URL(request.url);
  if (url.origin !== 'https://xrobo-io.qiniuapi.com' || url.pathname !== '/v1/ws/' ||
      request.headers.get('Authorization') !== 'Bearer upstream-test-token' ||
      request.headers.get('Device-Id') !== 'test-device' ||
      request.headers.get('X-Agent-ID') !== 'test-agent' ||
      request.headers.get('Protocol-Version') !== '1' || !request.headers.get('Client-Id')) return new Response('bad headers', {status: 401});
  const [client, server] = Object.values(new WebSocketPair());
  server.binaryType = 'arraybuffer';
  server.accept();
  server.addEventListener('message', event => {
    if (event.data === 'server-close') server.close(1000, 'upstream complete');
    else server.send(event.data);
  });
  server.addEventListener('close', event => server.close(event.code === 1005 ? 1000 : event.code, event.reason));
  return new Response(null, {status: 101, webSocket: client});
} }`

async function runtime(bindings = credentials, upstreamScript = fakeUpstream) {
  const manifest = (contents: string) => ({ mainModule: 'index.js', modulesRoot: process.cwd(), modules: { 'index.js': { type: 'esm' as const, contents } } })
  const instance = new Miniflare({
    workers: [{
      config: {
        name: 'gateway', compatibilityDate: '2026-10-23', manifest: manifest(script),
        env: {
          ...Object.fromEntries(Object.entries(bindings).map(([key, value]) => [key, { type: 'text' as const, value }])),
          ASSETS: { type: 'assets' }
        },
        assets: { directory: fileURLToPath(new NodeURL('./fixtures/', import.meta.url)), hasUserWorker: true, notFoundHandling: 'single-page-application', runWorkerFirst: ['/api/*', '/games/*'] }
      },
      dev: { outboundService: { type: 'worker', worker: 'upstream' } }
    }, { config: { name: 'upstream', compatibilityDate: '2026-10-23', manifest: manifest(upstreamScript) } }]
  })
  await instance.ready
  runtimes.push(instance)
  return instance
}

let gateway: Miniflare
beforeAll(async () => { gateway = await runtime() }, 20000)
afterAll(async () => { await Promise.all(runtimes.map((instance) => instance.dispose())) })

function voiceHeaders(overrides: Record<string, string> = {}) {
  return { Upgrade: 'websocket', Origin: testOrigin, Cookie: 'lie_voice_access=invited-test-token', ...overrides }
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

  it('rejects cross-origin/missing access/query overrides and unconfigured voice', async () => {
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Origin: 'https://elsewhere.example' }) })).status).toBe(403)
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Cookie: '' }) })).status).toBe(403)
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders({ Cookie: 'lie_voice_access=wrong' }) })).status).toBe(403)
    expect((await gateway.dispatchFetch(`${testOrigin}/api/voice?upstream=https://elsewhere.example`, { headers: voiceHeaders() })).status).toBe(403)
    const unconfigured = await runtime({ ...credentials, LINX_WS_TOKEN: '' })
    expect((await unconfigured.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders() })).status).toBe(503)
  }, 20000)

  it('reports availability without opening upstream, exposing secrets or issuing access', async () => {
    const checked = await runtime(credentials, `let calls = 0; export default { fetch(request) {
      if (new URL(request.url).pathname === '/count') return Response.json({calls});
      calls++; return new Response('Unexpected upstream request', {status: 500});
    } }`)
    const upstream = await checked.getWorker('upstream')
    for (const cookie of ['', 'other=value', 'lie_voice_access=wrong', 'lie_voice_access=invited-test-token']) {
      const response = await checked.dispatchFetch(`${testOrigin}/api/voice/status`, { headers: { Cookie: cookie } })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: cookie === 'lie_voice_access=invited-test-token' ? 'ready' : 'access-required' })
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('Set-Cookie')).toBeNull()
      expect(response.headers.get('X-Lie-Local-Test-Entry')).toBeNull()
    }
    expect(await (await upstream.fetch('https://upstream.test/count')).json()).toEqual({ calls: 0 })
    for (const headers of [{ Origin: 'https://elsewhere.example' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
      expect((await checked.dispatchFetch(`${testOrigin}/api/voice/status`, { headers })).status).toBe(403)
    }
  }, 20000)

  it.each(Object.keys(credentials))('reports unavailable when %s is not configured', async (key) => {
    const unconfigured = await runtime({ ...credentials, [key]: '' })
    const response = await unconfigured.dispatchFetch(`${testOrigin}/api/voice/status`)
    expect(await response.json()).toEqual({ status: 'unavailable' })
    expect(response.headers.get('Set-Cookie')).toBeNull()
  }, 20000)

  it('uses only fixed upstream/header credentials and preserves text/binary and close', async () => {
    const response = await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders() })
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
    const response = await gateway.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders() })
    const socket = response.webSocket!
    socket.accept()
    const closeEvent = closed(socket)
    socket.send(new Uint8Array(65537))
    expect(await closeEvent).toEqual({ code: 1009, reason: 'Frame too large' })
    socket.close()
  })

  it('returns a sanitized failure when upstream refuses WebSocket upgrade', async () => {
    const rejected = await runtime(credentials, `export default {fetch() { return new Response('private provider details', {status:401}) }}`)
    const response = await rejected.dispatchFetch(`${testOrigin}/api/voice`, { headers: voiceHeaders() })
    expect(response.status).toBe(502)
    expect(await response.text()).toBe('Voice upstream unavailable')
  }, 20000)
})
