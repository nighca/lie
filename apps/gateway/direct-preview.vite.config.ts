import { fileURLToPath } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [cloudflare({
    inspectorPort: false,
    remoteBindings: false,
    config(worker) {
      worker.name = 'lie-pr-preview'
      worker.entrypoint = fileURLToPath(new URL('./src/direct-preview.ts', import.meta.url).href)
      // Replace in place: partial config results deep-merge production bindings.
      worker.env = {
        ASSETS: { type: 'assets' },
        LINX_API_KEY: { type: 'secret' },
        LINX_AGENT_ID: { type: 'secret' },
        VOICE_DEVICE_COOKIE_SECRET: { type: 'secret' },
        VOICE_DEVICE_ENVIRONMENT: { type: 'text', value: 'direct-formal-20261103-v1' },
        VOICE_MAX_SESSION_SECONDS: { type: 'text', value: '600' },
        VOICE_TRANSPORT: { type: 'text', value: 'direct' },
        PRIVATE_PREVIEW_EXPIRES_AT: { type: 'text', value: '0' }
      }
    }
  })],
  publicDir: fileURLToPath(new URL('../web/dist', import.meta.url).href),
  build: { emptyOutDir: true }
})
