import { afterEach, expect, it, vi } from 'vitest'

import preview, { type DirectPreviewEnv } from '../src/direct-preview'
import gateway from '../src/index'
import { credentials } from './voice-fixture'

const env: DirectPreviewEnv = { ...credentials, VOICE_TRANSPORT: 'direct', VOICE_MAX_SESSION_SECONDS: '600', PRIVATE_PREVIEW_EXPIRES_AT: '2026-11-04T00:00:00.000Z', ASSETS: { fetch: async () => new Response('asset'), connect() { throw new Error('Unexpected asset connection') } } }
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

it('delegates the formal handler and its exact environment before expiry', async () => {
  vi.useFakeTimers().setSystemTime(new Date('2026-11-03T00:00:00Z'))
  const delegate = vi.spyOn(gateway, 'fetch').mockResolvedValue(new Response('formal'))
  const request = new Request('https://preview.example/api/health')
  expect(await (await preview.fetch(request, env)).text()).toBe('formal')
  expect(delegate).toHaveBeenCalledExactlyOnceWith(request, env)
})

it.each(['', 'not-a-date', '2026-11-03T00:00:00Z', '2026-11-02T23:59:59Z'])('rejects every dynamic API when expiry is invalid or elapsed: %s', async expiry => {
  vi.useFakeTimers().setSystemTime(new Date('2026-11-03T00:00:00Z'))
  const delegate = vi.spyOn(gateway, 'fetch')
  for (const path of ['/api/voice/prepare', '/api/voice', '/api/shared-games/v1', '/api/health']) {
    const response = await preview.fetch(new Request(`https://preview.example${path}`), { ...env, PRIVATE_PREVIEW_EXPIRES_AT: expiry })
    expect(response.status).toBe(410)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  }
  expect(delegate).not.toHaveBeenCalled()
})

it('keeps static assets available after expiry without extending the API window', async () => {
  vi.useFakeTimers().setSystemTime(new Date('2026-11-05T00:00:00Z'))
  const delegate = vi.spyOn(gateway, 'fetch').mockResolvedValue(new Response('static'))
  const request = new Request('https://preview.example/editor')
  expect(await (await preview.fetch(request, env)).text()).toBe('static')
  expect(delegate).toHaveBeenCalledExactlyOnceWith(request, env)
})


it.each(['/api/voice/prepare', '/api/health', '/api/shared-games/v1'])('discards a late %s response when the original preview deadline passes', async path => {
  vi.useFakeTimers().setSystemTime(new Date('2026-11-03T23:59:59Z'))
  let complete!: (response: Response) => void
  const delegate = vi.spyOn(gateway, 'fetch').mockImplementation(() => new Promise(resolve => { complete = resolve }))
  const cancelled = vi.fn()
  const late = new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('{"token":"private-late-token"}')) },
    cancel: cancelled
  }), { headers: { 'Set-Cookie': 'late-cookie', 'Content-Type': 'application/json' } })
  const request = new Request(`https://preview.example${path}`)
  const pending = preview.fetch(request, env)
  expect(delegate).toHaveBeenCalledExactlyOnceWith(request, env)
  vi.setSystemTime(new Date(env.PRIVATE_PREVIEW_EXPIRES_AT))
  complete(late)
  const response = await pending
  expect(response.status).toBe(410)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(response.headers.get('Set-Cookie')).toBeNull()
  expect(await response.json()).toEqual({ error: 'preview-expired' })
  expect(cancelled).toHaveBeenCalledOnce()
})
