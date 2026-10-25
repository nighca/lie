import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join, posix } from 'node:path'

import { createImageOptimizer } from './image-optimize.mjs'

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
export async function fingerprintAssets(publicDirectory, { optimizeImage = null } = {}) {
  const urls = new Map(), outputs = new Map(), animations = new Map()
  const paths = [...await files(join(publicDirectory, 'appearances'), 'appearances/'), ...await files(join(publicDirectory, 'brand'), 'brand/')]
  const inputs = new Map(await Promise.all(paths.map(async path => [path, await readFile(join(publicDirectory, path))])))
  const optimizer = optimizeImage == null ? await createImageOptimizer() : { optimize: optimizeImage, stats: null }
  const images = new Map(), unique = new Map()
  for (const [path, bytes] of inputs) if (path.endsWith('.png')) unique.set(digest(bytes), bytes)
  const pending = [...unique], results = new Map()
  let next = 0
  async function worker() {
    while (next < pending.length) {
      const [hash, bytes] = pending[next++]
      results.set(hash, await optimizer.optimize(bytes))
    }
  }
  await Promise.all(Array.from({ length: Math.min(2, pending.length) }, worker))
  const finalInputs = new Map()
  for (const [path, bytes] of inputs) {
    const image = path.endsWith('.png') ? results.get(digest(bytes)) : null
    const outputPath = image == null ? path : path.slice(0, -4) + image.extension
    images.set(path, outputPath)
    finalInputs.set(outputPath, image?.bytes ?? bytes)
  }
  for (const [path, bytes] of finalInputs) {
    if (!path.endsWith('/animation/package.json')) continue
    const animation = JSON.parse(bytes.toString())
    for (const asset of Object.values(animation.assets)) {
      if (typeof asset.src !== 'string' || !/^parts\/[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(asset.src)) throw Error('Unsafe animation source path')
      const source = posix.join(posix.dirname(path), asset.src)
      const target = images.get(source)
      if (target == null) throw Error(`Animation build asset missing: ${source}`)
      asset.src = posix.relative(posix.dirname(path), target)
    }
    finalInputs.set(path, Buffer.from(`${JSON.stringify(animation)}\n`))
  }
  for (const [path, bytes] of [...finalInputs].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)) {
    const match = /^(appearances\/[a-z0-9-]+\/animation)\//.exec(path)
    if (match == null) continue
    if (!animations.has(match[1])) animations.set(match[1], createHash('sha256'))
    animations.get(match[1]).update(`${path}\0${bytes.length}\0`).update(bytes)
  }
  for (const [path, hash] of animations) animations.set(path, hash.digest('hex'))
  for (const [path, bytes] of finalInputs) {
    if (path === 'appearances/manifest.json') continue
    const animation = /^(appearances\/[a-z0-9-]+\/animation)\//.exec(path)
    const hash = animation == null ? digest(bytes) : animations.get(animation[1])
    const url = `/static/${hash}/${path}`
    for (const [source, target] of images) if (target === path) urls.set(`/${source}`, url)
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
  return { urls, outputs, manifestUrl, imageStats: optimizer.stats }
}

/** Resolves the production manifest URL and rewrites references before Vite hashes chunks. */
export function staticAssets(options = {}) {
  let plan = null
  function replace(code) {
    return code.replace(/([\"'`(])(\/(?:appearances|brand)\/[a-zA-Z0-9/._-]+)/g, (match, prefix, url) => `${prefix}${plan.urls.get(url) ?? url}`)
  }
  return {
    name: 'lie-static-assets',
    enforce: 'pre',
    async configResolved(config) {
      if (config.command === 'build') {
        plan = await fingerprintAssets(config.publicDir, options)
        if (plan.imageStats != null) {
          const { encoded, cached, preserved } = plan.imageStats
          config.logger.info(`[lie-images] ${encoded} encoded, ${cached} cache hits, ${preserved} PNGs preserved (unique source bytes)`)
        }
      }
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
