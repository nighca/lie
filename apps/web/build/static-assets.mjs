import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const virtualId = 'virtual:lie-preset-manifest'
const resolvedId = `\0${virtualId}`
const digest = bytes => createHash('sha256').update(bytes).digest('hex')

async function files(directory, prefix = '') {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`
    if (entry.isDirectory()) result.push(...await files(join(directory, entry.name), `${path}/`))
    else if (entry.isFile()) result.push(path)
  }
  return result.sort()
}

/** Preserves canonical public files while deriving an immutable copy for this build. */
export async function fingerprintAssets(publicDirectory) {
  const urls = new Map(), outputs = new Map(), animations = new Map()
  const paths = [...await files(join(publicDirectory, 'appearances'), 'appearances/'), ...await files(join(publicDirectory, 'brand'), 'brand/')]
  const inputs = new Map(await Promise.all(paths.map(async path => [path, await readFile(join(publicDirectory, path))])))
  for (const [path, bytes] of inputs) {
    const match = /^(appearances\/[a-z0-9-]+\/animation)\//.exec(path)
    if (match == null) continue
    if (!animations.has(match[1])) animations.set(match[1], createHash('sha256'))
    animations.get(match[1]).update(`${path}\0${bytes.length}\0`).update(bytes)
  }
  for (const [path, hash] of animations) animations.set(path, hash.digest('hex'))
  for (const [path, bytes] of inputs) {
    if (path === 'appearances/manifest.json') continue
    const animation = /^(appearances\/[a-z0-9-]+\/animation)\//.exec(path)
    const hash = animation == null ? digest(bytes) : animations.get(animation[1])
    const url = `/static/${hash}/${path}`
    urls.set(`/${path}`, url)
    outputs.set(url.slice(1), bytes)
  }
  const manifest = JSON.parse(inputs.get('appearances/manifest.json').toString())
  for (const preset of manifest) {
    for (const key of ['avatar', 'portrait', 'animation']) if (preset[key] != null) preset[key] = urls.get(preset[key])
    for (const state of Object.keys(preset.portraits)) preset.portraits[state] = urls.get(preset.portraits[state])
  }
  const bytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)
  const manifestUrl = `/static/${digest(bytes)}/appearances/manifest.json`
  outputs.set(manifestUrl.slice(1), bytes)
  return { urls, outputs, manifestUrl }
}

/** Resolves the production manifest URL and rewrites references before Vite hashes chunks. */
export function staticAssets() {
  let plan = null
  function replace(code) {
    return code.replace(/([\"'`(])(\/(?:appearances|brand)\/[a-zA-Z0-9/._-]+)/g, (match, prefix, url) => `${prefix}${plan.urls.get(url) ?? url}`)
  }
  return {
    name: 'lie-static-assets',
    enforce: 'pre',
    async configResolved(config) {
      if (config.command === 'build') plan = await fingerprintAssets(config.publicDir)
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId
      if (plan?.outputs.has(id.slice(1))) return `\0lie-public:${id}`
    },
    load(id) {
      if (id.startsWith('\0lie-public:')) return `export default ${JSON.stringify(id.slice('\0lie-public:'.length))}`
      if (id === resolvedId) return `export default ${JSON.stringify(plan?.manifestUrl ?? '/appearances/manifest.json')}`
    },
    transform(code, id) {
      if (plan != null && /\.(vue|css|ts|js)(\?|$)/.test(id) && !id.includes('/node_modules/')) return replace(code)
    },
    transformIndexHtml: { order: 'pre', handler(html) { return plan == null ? html : replace(html) } },
    generateBundle() {
      if (plan == null) return
      for (const [fileName, source] of plan.outputs) this.emitFile({ type: 'asset', fileName, source })
    }
  }
}
