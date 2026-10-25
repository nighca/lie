import { glob, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { staticAssets } from '../../apps/web/build/static-assets.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const builtAssets = process.env.LIE_RESULT_QA_BUILT_ASSETS === '1'
const publicDir = `${root}apps/web/${builtAssets ? 'dist' : 'public'}`
const manifests = builtAssets ? await Array.fromAsync(glob('static/*/appearances/manifest.json', { cwd: publicDir })) : []
if (builtAssets && manifests.length !== 1) throw new Error('Build exactly one preset manifest before result QA')
const manifestUrl = builtAssets ? `/${manifests[0]}` : '/appearances/manifest.json'
const appRoutes = new Set(['/', '/editor', '/editor/preview', '/play'])

export default defineConfig({
  root,
  publicDir,
  plugins: [{
    name: 'lie-result-qa-manifest',
    enforce: 'pre',
    resolveId(id) { if (id === 'virtual:lie-preset-manifest') return '\0lie-result-qa-manifest' },
    load(id) { if (id === '\0lie-result-qa-manifest') return `export default ${JSON.stringify(manifestUrl)}` },
  }, staticAssets(), vue(), {
    name: 'lie-result-game-qa',
    async configureServer(server) {
      const html = (await readFile(`${root}apps/web/index.html`, 'utf8')).replace('src="/src/main.ts"', 'src="/apps/web/src/main.ts"')
      server.middlewares.use(async (request, response, next) => {
        const url = request.url ?? '/'
        if (!['GET', 'HEAD'].includes(request.method ?? '') || !appRoutes.has(url.split('?')[0])) return next()
        try {
          const output = await server.transformIndexHtml(url, html)
          response.statusCode = 200
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(request.method === 'HEAD' ? '' : output)
        } catch (error) { next(error) }
      })
    },
  }],
  server: {
    host: '127.0.0.1',
    port: 5355,
    strictPort: true,
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**',
        '.dev.vars', '.dev.vars.*', '.linx-api-key', '**/.cloudflare/**', '**/.wrangler/**',
      ],
    },
  },
})
