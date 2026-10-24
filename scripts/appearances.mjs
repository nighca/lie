import { readFile, readdir, mkdir, writeFile, rm, realpath, lstat } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readAnimationPackage } from '../packages/appearance-animation/src/package.ts'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const states = ['listening', 'waiting', 'speaking']
const sourceFields = new Set(['id', 'name', 'avatar', 'portrait', 'accent', 'voiceId', 'portraits', 'animation'])
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function object(value, label) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}: expected object`)
  return value
}
function text(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${label}: expected nonempty text`)
  return value
}
function segment(value, label) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(value, label))) throw new Error(`${label}: expected a lowercase URL segment`)
  return value
}
function assetPath(value, id, filename, label) {
  if (value !== `assets/${id}/${filename}.png`) throw new Error(`${label}: expected assets/${id}/${filename}.png`)
  return value
}
async function files(directory, prefix = '') {
  let entries
  try { entries = await readdir(directory, { withFileTypes: true }) }
  catch (error) { if (error.code === 'ENOENT') return []; throw error }
  const result = []
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink()) throw new Error(`Generated appearance output must not contain symlinks: ${path}`)
    if (entry.isDirectory()) result.push(...await files(join(directory, entry.name), path))
    else result.push(path)
  }
  return result.sort()
}

/** Builds or checks generated public assets from the single authored appearance catalog. */
export async function syncAppearances({ sourceDirectory = join(projectRoot, 'design/appearances'), outputDirectory = join(projectRoot, 'apps/web/public/appearances'), check = false } = {}) {
  const source = resolve(sourceDirectory)
  const output = resolve(outputDirectory)
  if (source === output || source.startsWith(`${output}${sep}`) || output.startsWith(`${source}${sep}`)) throw new Error('Appearance source and output must be separate directory trees')
  const realSource = await realpath(source)
  const manifest = JSON.parse(await readFile(join(source, 'manifest.json'), 'utf8'))
  if (!Array.isArray(manifest) || manifest.length === 0) throw new Error('Appearance manifest must be a nonempty array')
  const ids = new Set()
  const outputs = new Map()
  const runtime = []
  const loaded = new Map()
  async function load(path) {
    if (!loaded.has(path)) {
      const input = join(source, path)
      if (!(await lstat(input)).isFile() || !((await realpath(input)).startsWith(`${realSource}${sep}`))) throw new Error(`${path}: expected a regular asset inside the source directory`)
      const bytes = await readFile(input)
      if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) throw new Error(`${path}: expected PNG asset`)
      loaded.set(path, bytes)
    }
    return loaded.get(path)
  }
  function add(path, bytes) {
    outputs.set(path, bytes)
    return `/appearances/${path}`
  }
  for (const raw of manifest) {
    const item = object(raw, 'Appearance')
    const id = segment(item.id, 'Appearance id')
    for (const field of Object.keys(item)) if (!sourceFields.has(field)) throw new Error(`${id}: unexpected field ${field}`)
    if (ids.has(id)) throw new Error(`Duplicate appearance id: ${id}`)
    ids.add(id)
    const name = text(item.name, `${id}.name`)
    const voiceId = text(item.voiceId, `${id}.voiceId`)
    if (!/^#[0-9a-fA-F]{6}$/.test(item.accent)) throw new Error(`${id}.accent: expected six-digit hex color`)
    const portrait = assetPath(item.portrait, id, 'default', `${id}.portrait`)
    const avatar = item.avatar === portrait ? portrait : assetPath(item.avatar, id, 'avatar', `${id}.avatar`)
    const portraits = object(item.portraits, `${id}.portraits`)
    const defaultBytes = await load(portrait)
    const generated = {
      id, name,
      avatar: add(`${id}/${avatar === portrait ? 'default' : 'avatar'}.png`, await load(avatar)),
      portrait: add(`${id}/default.png`, defaultBytes),
      accent: item.accent, voiceId, portraits: {},
    }
    for (const state of states) {
      const path = assetPath(portraits[state], id, state, `${id}.portraits.${state}`)
      const bytes = await load(path)
      if (!bytes.subarray(16, 24).equals(defaultBytes.subarray(16, 24))) throw new Error(`${path}: state canvas must match default`)
      generated.portraits[state] = add(`${id}/${state}.png`, bytes)
    }
    if (item.animation != null) {
      const expected = `assets/${id}/animation/package.json`
      if (item.animation !== expected) throw new Error(`${id}.animation: expected ${expected}`)
      const input = join(source, expected)
      if (!(await lstat(input)).isFile() || !((await realpath(input)).startsWith(`${realSource}${sep}`))) throw new Error(`${expected}: expected regular animation package`)
      const bytes = await readFile(input)
      const animation = readAnimationPackage(JSON.parse(bytes.toString('utf8')))
      generated.animation = add(`${id}/animation/package.json`, bytes)
      for (const asset of Object.values(animation.assets)) {
        const path = `assets/${id}/animation/${asset.src}`
        const image = await load(path)
        if (image.readUInt32BE(16) !== asset.width || image.readUInt32BE(20) !== asset.height) throw new Error(`${path}: dimensions differ from animation contract`)
        add(`${id}/animation/${asset.src}`, image)
      }
    }
    runtime.push(generated)
  }
  outputs.set('manifest.json', Buffer.from(`${JSON.stringify(runtime, null, 2)}\n`))
  const existing = await files(output)
  const differences = []
  for (const [path, bytes] of [...outputs].sort(([left], [right]) => left.localeCompare(right, 'en'))) {
    let current = null
    try { current = await readFile(join(output, path)) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    if (current?.equals(bytes)) continue
    differences.push(path)
    if (!check) { await mkdir(dirname(join(output, path)), { recursive: true }); await writeFile(join(output, path), bytes) }
  }
  for (const path of existing) {
    if (outputs.has(path)) continue
    differences.push(`${path} (obsolete)`)
    if (!check) await rm(join(output, path))
  }
  if (check && differences.length > 0) throw new Error(`Stale generated appearance output:\n${differences.join('\n')}`)
  return { count: runtime.length, assets: outputs.size - 1, differences }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    const check = args.includes('--check')
    const outputIndex = args.indexOf('--output')
    const allowed = new Set(check ? ['--check'] : [])
    if (outputIndex >= 0) {
      if (!check || args[outputIndex + 1] == null) throw new Error('--output is only available with --check and a directory')
      allowed.add('--output'); allowed.add(args[outputIndex + 1])
    }
    if (args.some((arg) => !allowed.has(arg))) throw new Error('Usage: appearances.mjs [--check [--output directory]]')
    const result = await syncAppearances({ check, ...(outputIndex < 0 ? {} : { outputDirectory: resolve(args[outputIndex + 1]) }) })
    console.log(`${check ? 'Checked' : 'Generated'} ${result.count} appearances (${result.assets} assets)`)
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
