import { defineConfig } from 'vitest/config'

export default defineConfig({ test: { environment: 'jsdom', include: ['spikes/safari-audio/*.test.ts'] } })
