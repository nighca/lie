import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readAnimationPackage } from '../../../packages/character-animation/src/package.ts'
import { readImageDimensions } from '../../../packages/character-animation/src/image-header.ts'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const dist = join(root, 'apps/web/dist')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
async function files(directory, prefix = '') {
  const result = []
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${item.name}`
    if (item.isDirectory()) result.push(...await files(join(directory, item.name), `${path}/`))
    else result.push(path)
  }
  return result.sort()
}
const paths = await files(dist)
const bytes = new Map(await Promise.all(paths.map(async path => [path, await readFile(join(dist, path))])))
const manifestPath = paths.find(path => /^static\/[a-f0-9]{64}\/appearances\/manifest\.json$/.test(path))
assert.ok(manifestPath)
assert.equal(sha(bytes.get(manifestPath)), manifestPath.split('/')[1])
const manifest = JSON.parse(bytes.get(manifestPath))
let parts = 0
for (const preset of manifest) {
  for (const url of [preset.avatar, preset.portrait, ...Object.values(preset.portraits)]) assert.ok(bytes.has(url.slice(1)), url)
  if (preset.animation == null) continue
  const packagePath = preset.animation.slice(1), data = readAnimationPackage(JSON.parse(bytes.get(packagePath)))
  const prefix = packagePath.slice(0, packagePath.indexOf('/appearances/')) + '/'
  const entries = paths.filter(path => path.startsWith(dirname(packagePath) + '/'))
  const digest = createHash('sha256')
  for (const path of entries) {
    const local = path.slice(prefix.length), value = bytes.get(path)
    digest.update(`${local}\0${value.length}\0`).update(value)
  }
  assert.equal(digest.digest('hex'), packagePath.split('/')[1])
  for (const asset of Object.values(data.assets)) {
    const path = join(dirname(packagePath), asset.src), value = bytes.get(path)
    assert.ok(value, path)
    assert.deepEqual(readImageDimensions(new DataView(value.buffer, value.byteOffset, value.byteLength)), { width: asset.width, height: asset.height })
    parts++
  }
}
const measurement = JSON.parse(await readFile(new URL('./measurement-q90.json', import.meta.url)))
const expected = new Map(measurement.rows.flatMap(row => row.aliases.map(alias => [alias, row.variants['webp-q90']])))
let preservedSources = 0, webpBytes = 0, webpCount = 0
for (const source of measurement.inventory) {
  const original = await readFile(join(root, 'design/character-presets/assets', source.path))
  assert.equal(sha(original), source.sha256)
  assert.equal(sha(bytes.get(`appearances/${source.path}`)), source.sha256)
  preservedSources++
}
for (const path of paths.filter(path => path.startsWith('static/') && path.endsWith('.webp'))) {
  const relative = path.slice(path.indexOf('/appearances/') + '/appearances/'.length).replace(/\.webp$/, '.png')
  assert.equal(sha(bytes.get(path)), expected.get(relative).sha256, path)
  if (!path.includes('/animation/')) assert.equal(sha(bytes.get(path)), path.split('/')[1])
  webpBytes += bytes.get(path).length; webpCount++
}
assert.equal(webpCount, measurement.inventory.length)
const report = { node: process.version, manifestUrl: `/${manifestPath}`, presets: manifest.length, animationParts: parts, webpCount, webpBytes, unchangedCanonicalAndFixedPng: preservedSources, totalDistBytes: [...bytes.values()].reduce((sum, value) => sum + value.length, 0), allFiles: Object.fromEntries([...bytes].map(([path, value]) => [path, sha(value)])) }
await writeFile(join(root, 'tmp/q90-built-identity.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log({ ...report, allFiles: `${paths.length} file hashes recorded` })
