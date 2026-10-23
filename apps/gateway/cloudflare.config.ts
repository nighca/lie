import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  worker: {
    name: 'lie-game',
    entrypoint: './src/index.ts',
    compatibilityDate: '2026-10-23',
    assets: { notFoundHandling: 'single-page-application', runWorkerFirst: ['/api/*', '/games/*'] },
    env: {
      ASSETS: bindings.assets()
    },
    observability: {
      enabled: true,
      redactQueryString: true,
      logs: { enabled: true, headSamplingRate: 1 },
      traces: { enabled: true, headSamplingRate: 0.01 }
    }
  }
})
