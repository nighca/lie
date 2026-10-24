import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'lie-local-test-session',
      configureServer(server) {
        server.middlewares.use('/api/voice/status', (request, response, next) => {
          if (request.method === 'GET') response.setHeader('X-Lie-Local-Test-Entry', '/__lie/dev-session')
          next()
        })
        server.middlewares.use('/__lie/dev-session', (request, response) => {
          response.setHeader('Cache-Control', 'no-store')
          if (request.method !== 'GET' || request.headers['sec-fetch-site'] === 'cross-site') {
            response.writeHead(403).end('Local test access only')
            return
          }
          const path = fileURLToPath(new URL('./.dev.vars', import.meta.url).href)
          const token = existsSync(path) ? parseEnv(readFileSync(path, 'utf8')).VOICE_ACCESS_TOKEN : null
          if (token == null || !/^[a-f0-9]{64}$/.test(token)) {
            response.writeHead(503).end('Run the dedicated local voice setup first')
            return
          }
          response.setHeader('Set-Cookie', `lie_voice_access=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7200`)
          response.writeHead(302, { Location: '/' }).end()
        })
      }
    },
    cloudflare({ inspectorPort: false, remoteBindings: false })
  ],
  publicDir: fileURLToPath(new URL('../web/dist', import.meta.url).href),
  build: { emptyOutDir: true },
  server: { host: '127.0.0.1', port: 8787, strictPort: true }
})
