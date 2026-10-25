import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({ publicDir: 'apps/web/public', plugins: [vue()], test: { environment: 'jsdom', setupFiles: ['apps/web/test/setup.ts'], include: ['docs/builtin-case-json-implementation/single-file-probe.test.ts'] } })
