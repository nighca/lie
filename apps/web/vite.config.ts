import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const gatewayUrl = process.env.LIE_VOICE_GATEWAY_URL ?? 'http://127.0.0.1:8787'

export default defineConfig({
  plugins: [vue(), {
    name: 'lie-main-preview-status',
    apply: 'serve',
    configureServer(server) {
      if (process.env.LIE_MAIN_SHA == null) return
      server.middlewares.use('/__lie/main-status', (_request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ branch: 'main', sha: process.env.LIE_MAIN_SHA }))
      })
    }
  }],
  server: {
    host: '127.0.0.1',
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**',
        '.dev.vars', '.dev.vars.*', '.linx-api-key', '**/.cloudflare/**', '**/.wrangler/**'
      ]
    },
    proxy: {
      '/api/voice': { target: gatewayUrl, ws: true },
    },
  },
})
