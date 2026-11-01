import { convertToWranglerConfig, resolveAndParseConfig } from '@cloudflare/config'
import { expect, it } from 'vitest'

import config from '../cloudflare.config'

it('declares private R2 storage with remote development disabled', async () => {
  const parsed = await resolveAndParseConfig(config, { isPreview: false, mode: 'production' })
  if (!parsed.success) throw parsed.error
  expect(parsed.data.worker?.env?.SHARED_GAMES).toEqual({ type: 'r2', name: 'lie-shared-games', dev: { remote: false } })
  expect(convertToWranglerConfig(parsed.data).r2_buckets).toEqual([{ binding: 'SHARED_GAMES', bucket_name: 'lie-shared-games', remote: false }])
})
