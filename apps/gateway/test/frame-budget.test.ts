import { expect, it } from 'vitest'

import { relaySockets } from '../src/index'
import { VOICE_TEXT_FRAME_BYTES_LIMIT } from '../../../packages/voice/src/protocol'

it.each([0, 1])('enforces the same inclusive text budget as the browser guard (offset %i)', (offset) => {
  function peer() {
    const listeners = new Map<string, (event: { data?: string; code?: number; reason?: string }) => void>()
    const sent: unknown[] = [], codes: number[] = []
    return { listeners, sent, codes, accept() {}, addEventListener(type: string, listener: (event: { data?: string; code?: number; reason?: string }) => void) { listeners.set(type, listener) }, send(data: unknown) { sent.push(data) }, close(code: number) { codes.push(code) } }
  }
  const browser = peer(), upstream = peer()
  relaySockets(browser as unknown as WebSocket, upstream as unknown as WebSocket)
  browser.listeners.get('message')!({ data: 'x'.repeat(VOICE_TEXT_FRAME_BYTES_LIMIT + offset) })
  expect(upstream.sent.length).toBe(offset === 0 ? 1 : 0)
  expect(browser.codes).toEqual(offset === 0 ? [] : [1009])
  browser.listeners.get('close')!({ code: 1000, reason: 'test complete' })
})
