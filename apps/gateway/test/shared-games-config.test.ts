import { convertToWranglerConfig, resolveAndParseConfig } from '@cloudflare/config'
import { afterEach, expect, it, vi } from 'vitest'

import config from '../cloudflare.config'

afterEach(() => { vi.unstubAllEnvs() })

it.each([
  { name: 'default', value: undefined, expected: 'lie-shared-games' },
  { name: 'override', value: 'lie-shared-games-review-local', expected: 'lie-shared-games-review-local' }
])('declares private R2 storage with the $name bucket and remote development disabled', async ({ value, expected }) => {
  vi.stubEnv('LIE_SHARE_BUCKET_NAME', value)
  const parsed = await resolveAndParseConfig(config, { isPreview: false, mode: 'production' })
  if (!parsed.success) throw parsed.error
  expect(parsed.data.worker?.env?.SHARED_GAMES).toEqual({ type: 'r2', name: expected, dev: { remote: false } })
  expect(convertToWranglerConfig(parsed.data).r2_buckets).toEqual([{ binding: 'SHARED_GAMES', bucket_name: expected, remote: false }])
})
