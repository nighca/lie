import { afterEach, expect, it, vi } from 'vitest'

import preview, { type DirectPreviewEnv } from '../src/direct-preview'
import gateway from '../src/index'
import { credentials } from './voice-fixture'

const env: DirectPreviewEnv = { ...credentials, VOICE_TRANSPORT: 'direct', VOICE_MAX_SESSION_SECONDS: '600', PRIVATE_PREVIEW_EXPIRES_AT: '2026-11-04T00:00:00.000Z', ASSETS: { fetch: async () => new Response('asset'), connect() { throw new Error('Unexpected asset connection') } } }
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

it('delegates the formal handler and its exact environment before expiry', async () => {
  vi.useFakeTimers().setSystemTime(new Date('2026-11-03T00:00:00Z'))
  const delegate = vi.spyOn(gateway, 'fetch').mockResolvedValue(new Response('formal'))
  const request = new Request('https://preview.example/api/voice/status')
  expect(await (await preview.fetch(request, env)).text()).toBe('formal')
  expect(delegate).toHaveBeenCalledExactlyOnceWith(request, env)
})

it.each(['', 'not-a-date', '2026-11-03T00:00:00Z', '2026-11-02T23:59:59Z'])('rejects every dynamic API when expiry is invalid or elapsed: %s', async expiry => {
  vi.useFakeTimers().setSystemTime(new Date('2026-11-03T00:00:00Z'))
  const delegate = vi.spyOn(gateway, 'fetch')
  for (const path of ['/api/voice/status', '/api/voice/prepare', '/api/voice', '/api/shared-games/v1', '/api/health']) {
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
