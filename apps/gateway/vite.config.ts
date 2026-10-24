import { fileURLToPath } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [cloudflare({ inspectorPort: false, remoteBindings: false })],
  publicDir: fileURLToPath(new URL('../web/dist', import.meta.url).href),
  build: { emptyOutDir: true },
  server: { host: '127.0.0.1', port: Number(process.env.LIE_GATEWAY_PORT ?? 8787), strictPort: true }
})
