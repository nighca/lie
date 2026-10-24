import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  worker: ({ mode }) => ({
    name: 'lie-game',
    entrypoint: './src/index.ts',
    compatibilityDate: '2026-10-23',
    assets: { notFoundHandling: 'single-page-application', runWorkerFirst: ['/api/*', '/games/*'] },
    env: {
      ASSETS: bindings.assets(),
      ...(mode === 'development' ? {
        LINX_WS_TOKEN: bindings.secret(),
        LINX_DEVICE_ID: bindings.secret(),
        LINX_AGENT_ID: bindings.secret()
      } : {})
    },
    observability: {
      enabled: true,
      redactQueryString: true,
      logs: { enabled: true, headSamplingRate: 1 },
      traces: { enabled: true, headSamplingRate: 0.01 }
    }
  })
})
