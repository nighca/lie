import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { build } from 'vite'

const output = new URL('../../tmp/safari-audio-probe/', import.meta.url)
await build({
  configFile: false,
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  build: { modulePreload: false, outDir: fileURLToPath(output), emptyOutDir: true },
})

// One portable artifact; no import requests are required when inspecting it locally.
const html = await readFile(new URL('index.html', output), 'utf8')
const scriptTag = /<script type="module" crossorigin src="\.\/([^"\s]+)"><\/script>/
const styleTag = /<link rel="stylesheet" crossorigin href="\.\/([^"\s]+)">/
const script = await readFile(new URL(scriptTag.exec(html)[1], output), 'utf8')
const style = await readFile(new URL(styleTag.exec(html)[1], output), 'utf8')
if (/<\/script/i.test(script) || /<\/style/i.test(style)) throw Error('Unsafe inline artifact delimiter')
const hash = text => createHash('sha256').update(text).digest('base64')
const standalone = html.replace(scriptTag, () => `<script type="module">${script}</script>`)
  .replace(styleTag, () => `<style>${style}</style>`)
  .replace("script-src 'self' blob:", `script-src 'sha256-${hash(script)}' blob:`)
  .replace("style-src 'self'", `style-src 'sha256-${hash(style)}'`)
await writeFile(new URL('safari-audio.html', output), standalone)

if (process.argv.includes('--publish')) {
  const web = new URL('../../apps/web/dist/', import.meta.url)
  await access(new URL('index.html', web))
  await mkdir(new URL('_diagnostics/', web), { recursive: true })
  await writeFile(new URL('_diagnostics/safari-audio.html', web), standalone)
}
