import { afterEach, expect, it, vi } from 'vitest'

import config from '../cloudflare.config'

afterEach(() => vi.unstubAllEnvs())

it('declares the default as an actual non-secret text binding', () => {
  vi.stubEnv('VOICE_MAX_SESSION_SECONDS', undefined)
  expect(config.worker().env.VOICE_MAX_SESSION_SECONDS).toEqual({ type: 'text', value: '600' })
})

it('applies only the configuration-process override to the Worker binding', () => {
  vi.stubEnv('VOICE_MAX_SESSION_SECONDS', '17')
  expect(config.worker().env.VOICE_MAX_SESSION_SECONDS).toEqual({ type: 'text', value: '17' })
})
