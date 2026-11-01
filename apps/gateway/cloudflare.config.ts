import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  worker: () => ({
    name: 'lie-game',
    entrypoint: './src/index.ts',
    compatibilityDate: '2026-10-23',
    compatibilityFlags: ['enable_request_signal'],
    limits: { cpuMs: 30000 },
    assets: { notFoundHandling: 'single-page-application', runWorkerFirst: ['/api/*', '/games/*', '/static/*', '/assets/*'] },
    env: {
      ASSETS: bindings.assets(),
      SHARED_GAMES: bindings.r2({ name: process.env.LIE_SHARE_BUCKET_NAME ?? 'lie-shared-games', dev: { remote: false } }),
      VOICE_MAX_SESSION_SECONDS: bindings.text(process.env.VOICE_MAX_SESSION_SECONDS ?? '600'),
      LINX_API_KEY: bindings.secret(),
      VOICE_DEVICE_COOKIE_SECRET: bindings.secret(),
      VOICE_DEVICE_ENVIRONMENT: bindings.text(process.env.LIE_VOICE_ENVIRONMENT ?? 'production'),
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
