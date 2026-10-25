import { describe, expect, it, vi } from 'vitest'

import gateway, { type GatewayEnv } from '../src/index'

const path = `/static/${'a'.repeat(64)}/appearances/guide/default.png`
const invoke = (request: Request, fetcher: (request: Request) => Promise<Response>) => gateway.fetch(request, { ASSETS: { fetch: fetcher } } as unknown as GatewayEnv)

describe('static asset cache transport', () => {
  it('preserves a partial asset response, range bytes, encoding and validators', async () => {
    const request = new Request(`https://local.example${path}`, { headers: { Range: 'bytes=0-2' } })
    const response = await invoke(request, async (received) => {
      expect(received.headers.get('range')).toBe('bytes=0-2')
      return new Response('abc', { status: 206, headers: { 'Content-Type': 'image/png', 'Content-Range': 'bytes 0-2/12', ETag: '"asset"', 'Content-Encoding': 'identity', Vary: 'Accept-Encoding' } })
    })
    expect(response.status).toBe(206)
    expect(await response.text()).toBe('abc')
    expect(response.headers.get('content-range')).toBe('bytes 0-2/12')
    expect(response.headers.get('etag')).toBe('"asset"')
    expect(response.headers.get('content-encoding')).toBe('identity')
    expect(response.headers.get('vary')).toBe('Accept-Encoding')
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
  })
  it('checks headerless 304 metadata without downloading a body', async () => {
    const fetcher = vi.fn(async (received: Request) => received.method === 'HEAD'
      ? new Response(null, { headers: { 'Content-Type': 'image/png' } })
      : new Response(null, { status: 304, headers: { ETag: '"asset"', Vary: 'Accept-Encoding' } }))
    const response = await invoke(new Request(`https://local.example${path}`, {headers:{'If-None-Match':'"asset"'}}), fetcher)
    expect(response.status).toBe(304)
    expect(await response.text()).toBe('')
    expect(response.headers.get('etag')).toBe('"asset"')
    expect(response.headers.get('vary')).toBe('Accept-Encoding')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls[1][0].method).toBe('HEAD')
    expect(fetcher.mock.calls[1][0].headers.get('if-none-match')).toBeNull()
  })
  it('rejects a missing asset even when SPA fallback produces a headerless 304', async () => {
    const response = await invoke(new Request(`https://local.example${path}`), async received => received.method === 'HEAD'
      ? new Response(null, { headers: { 'Content-Type': 'text/html' } })
      : new Response(null, { status: 304 }))
    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
