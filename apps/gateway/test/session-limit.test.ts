import { afterEach, describe, expect, it, vi } from 'vitest'

import gateway, { relaySockets } from '../src/index'
import type { GatewayEnv } from '../src/index'

function peer() {
  const listeners = new Map<string, (event: { data?: string; code?: number; reason?: string }) => void>()
  return {
    accept: vi.fn(), send: vi.fn(), close: vi.fn(),
    addEventListener(type: string, listener: (event: { data?: string; code?: number; reason?: string }) => void) { listeners.set(type, listener) },
    emit(type: string, event: { data?: string; code?: number; reason?: string } = {}) { listeners.get(type)?.(event) },
  }
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('server-owned voice session lifetime', () => {
  it('defaults to ten minutes without closing at the former three-minute deadline', () => {
    vi.useFakeTimers()
    const browser = peer(), upstream = peer()
    relaySockets(browser as unknown as WebSocket, upstream as unknown as WebSocket)
    vi.advanceTimersByTime(179999)
    expect(browser.close).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(browser.close).not.toHaveBeenCalled()
    vi.advanceTimersByTime(419999)
    expect(browser.close).not.toHaveBeenCalled()
    browser.emit('message', { data: 'active immediately before deadline' })
    expect(upstream.send).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1)
    expect(browser.close).toHaveBeenCalledExactlyOnceWith(1000, 'Conversation time limit')
    expect(upstream.close).toHaveBeenCalledExactlyOnceWith(1000, 'Conversation time limit')
    expect(vi.getTimerCount()).toBe(0)
    browser.emit('message', { data: 'late output' })
    upstream.emit('error')
    expect(upstream.send).toHaveBeenCalledOnce()
    expect(browser.close).toHaveBeenCalledOnce()
  })

  it('uses an independent override and clears early-closed timers', () => {
    vi.useFakeTimers()
    const short = peer(), shortUpstream = peer(), normal = peer(), normalUpstream = peer()
    relaySockets(short as unknown as WebSocket, shortUpstream as unknown as WebSocket, 2)
    relaySockets(normal as unknown as WebSocket, normalUpstream as unknown as WebSocket)
    vi.advanceTimersByTime(1999)
    expect(short.close).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(short.close).toHaveBeenCalledExactlyOnceWith(1000, 'Conversation time limit')
    expect(normal.close).not.toHaveBeenCalled()
    normalUpstream.emit('close', { code: 1000, reason: 'finished early' })
    expect(normal.close).toHaveBeenCalledExactlyOnceWith(1000, 'finished early')
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(600000)
    expect(normal.close).toHaveBeenCalledOnce()
  })

  it.each(['', '0', '-1', '1.5', 'NaN', 'Infinity', '2147484', '9007199254740991', '1e3', ' 600 '])('rejects invalid deployment setting %j before opening the provider', async value => {
    const upstream = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected upstream call'))
    const env: GatewayEnv = {
      VOICE_MAX_SESSION_SECONDS: value,
      LINX_WS_TOKEN: 'fake-token', LINX_DEVICE_ID: 'fake-device', LINX_AGENT_ID: 'fake-agent',
      ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
    }
    const response = await gateway.fetch(new Request('https://game.example/api/voice', { headers: { Upgrade: 'websocket', Origin: 'https://game.example' } }), env)
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('Invalid voice session limit configuration')
    expect(upstream).not.toHaveBeenCalled()
  })
})


it.each(['1', '2147483'])('accepts the timer-safe configuration boundary %s', async value => {
  const upstream = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fake upgrade rejection', { status: 401 }))
  const env: GatewayEnv = {
    VOICE_MAX_SESSION_SECONDS: value,
    LINX_WS_TOKEN: 'fake-token', LINX_DEVICE_ID: 'fake-device', LINX_AGENT_ID: 'fake-agent',
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
  }
  const response = await gateway.fetch(new Request('https://game.example/api/voice', { headers: { Upgrade: 'websocket', Origin: 'https://game.example' } }), env)
  expect(response.status).toBe(502)
  expect(upstream).toHaveBeenCalledOnce()
})
