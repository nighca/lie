import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { staticAssets } from '../../../apps/web/build/static-assets.mjs'
export default defineConfig({
  root: fileURLToPath(new URL('../../../', import.meta.url)),
  publicDir: 'apps/web/public',
  plugins: [staticAssets(), vue()],
  server: { host: '127.0.0.1', port: 5176, strictPort: true,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**', '.dev.vars', '.dev.vars.*', '.linx-api-key', '**/.cloudflare/**', '**/.wrangler/**'] } },
})
