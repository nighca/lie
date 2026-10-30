import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  worker: () => ({
    name: 'lie-game',
    entrypoint: './src/index.ts',
    compatibilityDate: '2026-10-23',
    assets: { notFoundHandling: 'single-page-application', runWorkerFirst: ['/api/*', '/games/*', '/static/*', '/assets/*'] },
    env: {
      ASSETS: bindings.assets(),
      VOICE_MAX_SESSION_SECONDS: bindings.text(process.env.VOICE_MAX_SESSION_SECONDS ?? '600'),
      LINX_WS_TOKEN: bindings.secret(),
      LINX_DEVICE_ID: bindings.secret(),
      LINX_AGENT_ID: bindings.secret()
    },
    observability: {
      enabled: true,
      redactQueryString: true,
      logs: { enabled: true, headSamplingRate: 1 },
      traces: { enabled: true, headSamplingRate: 0.01 }
    }
  })
})
