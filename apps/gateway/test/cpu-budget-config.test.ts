import { convertToWranglerConfig, resolveAndParseConfig } from '@cloudflare/config'
import { expect, it } from 'vitest'

import config from '../cloudflare.config'

it('serializes the explicit CPU budget through the production config schema', async () => {
  const parsed = await resolveAndParseConfig(config, { isPreview: false, mode: 'production' })
  if (!parsed.success) throw parsed.error
  expect(parsed.data.worker?.limits).toEqual({ cpuMs: 30000 })
  expect(convertToWranglerConfig(parsed.data).limits).toEqual({ cpu_ms: 30000 })
})
