import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
const candidateRoot = process.env.ANIMATION_PREVIEW_CANDIDATE_ROOT
export default defineConfig({ root: fileURLToPath(new URL('./', import.meta.url)), publicDir: fileURLToPath(new URL('../../apps/web/public', import.meta.url)), plugins: [vue()], server: { host: '127.0.0.1', port: 5348, strictPort: true, fs: { allow: [fileURLToPath(new URL('../../', import.meta.url)), ...(candidateRoot == null ? [] : [candidateRoot])] } } })
