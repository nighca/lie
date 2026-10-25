import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({ root: fileURLToPath(new URL('../../../', import.meta.url)), publicDir: 'apps/web/public', plugins: [vue()], test: { environment: 'jsdom', setupFiles: ['apps/web/test/setup.ts'], include: ['docs/reviews/content-boundary-2026-10-25/probe.test.ts'] } })
