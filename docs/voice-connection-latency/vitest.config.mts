import { defineConfig } from 'vitest/config'

export default defineConfig({ test: { environment: 'node', include: ['docs/voice-connection-latency/*.test.ts'] } })
