import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

import { staticAssets } from './build/static-assets.mjs'

export default defineConfig({ plugins: [staticAssets(), vue()], test: { environment: 'jsdom', setupFiles: ['test/setup.ts'], include: ['test/**/*.test.ts'] } })
