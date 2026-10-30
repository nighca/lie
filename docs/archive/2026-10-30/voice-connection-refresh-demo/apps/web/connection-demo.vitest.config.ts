import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'

import test from './vitest.config'
import demo from './connection-demo.vite.config'

export default defineConfig(mergeConfig(test, { resolve: demo.resolve, cacheDir: fileURLToPath(new URL('../../tmp/connection-demo/vitest', import.meta.url)) }))
