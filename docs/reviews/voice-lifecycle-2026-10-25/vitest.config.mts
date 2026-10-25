import { defineConfig } from 'vitest/config'

export default defineConfig({ test: { environment: 'node', include: ['docs/reviews/voice-lifecycle-2026-10-25/probe.test.ts'] } })
