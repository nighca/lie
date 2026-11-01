import { createHash } from 'node:crypto'
import { cp, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const prefix = 'v0/workers/default/'
const maximumFileBytes = 25 * 1024 * 1024
const maximumTotalBytes = 512 * 1024 * 1024
const maximumFiles = 10000
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const requireThat = (condition, message) => { if (!condition) throw Error(message) }
const decimal = value => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value))
const plain = value => value != null && typeof value === 'object' && !Array.isArray(value)
const safePath = value => typeof value === 'string' && value.length > 0 && !value.includes('\\') && !value.includes('\0') && value.split('/').every(part => part && part !== '.' && part !== '..' && part !== '.git' && part !== 'node_modules' && !part.startsWith('.env') && !part.startsWith('.dev.vars'))
const allowedPath = path => path === 'v0/config.json' || path === `${prefix}worker.config.json` || path.startsWith(`${prefix}bundle/`) || path.startsWith(`${prefix}assets/`)
const identityKeys = ['repository', 'prNumber', 'headSha', 'baseSha', 'mergeSha', 'runId', 'runAttempt']

export function validateIdentity(value) {
  requireThat(plain(value) && value.repository === 'nighca/lie', 'Unexpected preview repository')
  requireThat(decimal(value.prNumber) && decimal(value.runId) && decimal(value.runAttempt), 'Invalid preview run identity')
  for (const key of ['headSha', 'baseSha', 'mergeSha']) requireThat(/^[a-f0-9]{40}$/.test(value[key] ?? ''), 'Invalid preview commit identity')
  return Object.fromEntries(identityKeys.map(key => [key, key === 'prNumber' ? Number(value[key]) : String(value[key])]))
}

export function artifactName(value) {
  const id = validateIdentity(value)
  return `pr-preview-${id.prNumber}-${id.mergeSha}-${id.runId}-${id.runAttempt}`
}

export function identityFromEnv(env) {
  return validateIdentity({ repository: env.GITHUB_REPOSITORY, prNumber: env.PR_NUMBER, headSha: env.PR_HEAD_SHA, baseSha: env.PR_BASE_SHA, mergeSha: env.PR_MERGE_SHA, runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT })
}

async function inventory(root, { output = false } = {}) {
  requireThat((await lstat(root)).isDirectory(), 'Preview root must be a real directory')
  const files = []
  let total = 0
  async function walk(directory, relative = '') {
    for (const name of (await readdir(directory)).sort()) {
      const path = relative + name
      requireThat(safePath(path), 'Unsafe preview path')
      const absolute = join(directory, name), stat = await lstat(absolute)
      if (stat.isDirectory()) await walk(absolute, path + '/')
      else {
        requireThat(stat.isFile(), 'Preview contains a symlink or special file')
        requireThat(!output || allowedPath(path), 'Unexpected preview output file')
        total += stat.size
        requireThat(stat.size <= maximumFileBytes && total <= maximumTotalBytes && files.length < maximumFiles, 'Preview output exceeds size or file limits')
        files.push({ path, size: stat.size, sha256: hash(await readFile(absolute)) })
      }
    }
  }
  await walk(root)
  return files
}

async function readBuild(root, files) {
  const config = JSON.parse(await readFile(join(root, 'v0/config.json'), 'utf8'))
  requireThat(plain(config) && config.buildContext?.isPreview === true && config.buildContext.mode === 'preview', 'Expected preview Build Output in preview mode')
  const worker = JSON.parse(await readFile(join(root, `${prefix}worker.config.json`), 'utf8'))
  requireThat(plain(worker) && plain(worker.manifest), 'Missing preview Worker manifest')
  let manifest = worker.manifest
  requireThat(['complete', 'partial'].includes(manifest.type) && safePath(manifest.mainModule) && plain(manifest.modules), 'Invalid preview Worker manifest')
  const byPath = new Map(files.map(file => [file.path, file]))
  requireThat(byPath.has(`${prefix}assets/index.html`), 'Missing preview Web entry')
  if (manifest.type === 'partial') {
    const inferred = {}
    for (const file of files.filter(file => file.path.startsWith(`${prefix}bundle/`))) {
      const type = ['.js', '.mjs'].includes(extname(file.path)) ? 'esm' : extname(file.path) === '.map' ? 'sourcemap' : null
      if (type != null) inferred[file.path.slice(`${prefix}bundle/`.length)] = { type }
    }
    requireThat(inferred[manifest.mainModule]?.type === 'esm', 'Partial preview manifest has no ES module entry')
    manifest = { type: 'complete', mainModule: manifest.mainModule, modules: { ...inferred, ...manifest.modules } }
  }
  const moduleTypes = new Set(['esm', 'cjs', 'python', 'python-requirement', 'wasm', 'text', 'data', 'json', 'sourcemap'])
  let moduleBytes = 0
  for (const [path, module] of Object.entries(manifest.modules)) {
    requireThat(safePath(path) && plain(module) && moduleTypes.has(module.type) && Object.keys(module).every(key => key === 'type'), 'Invalid preview module declaration')
    const file = byPath.get(`${prefix}bundle/${path}`)
    requireThat(file != null, 'Missing declared preview module')
    moduleBytes += file.size
  }
  requireThat(['esm', 'cjs'].includes(manifest.modules[manifest.mainModule]?.type), 'Expected JavaScript Worker entry module')
  requireThat(moduleBytes <= 64 * 1024 * 1024, 'Preview Worker modules exceed platform limit')
  return { config, worker: { ...worker, manifest } }
}

export async function pack(source, destination, value) {
  const id = validateIdentity(value)
  const files = await inventory(source, { output: true })
  await readBuild(source, files)
  await mkdir(dirname(destination), { recursive: true })
  await mkdir(destination, { mode: 0o700 })
  await cp(source, join(destination, 'bundle'), { recursive: true, force: false, errorOnExist: true })
  const copied = await inventory(join(destination, 'bundle'), { output: true })
  requireThat(JSON.stringify(files) === JSON.stringify(copied), 'Preview output changed while packaging')
  const receipt = { version: 1, ...id, files }
  await writeFile(join(destination, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600, flag: 'wx' })
  return receipt
}

export async function restore(artifact, destination, value) {
  const id = validateIdentity(value)
  const outer = await inventory(artifact)
  requireThat(outer.every(file => file.path === 'receipt.json' || file.path.startsWith('bundle/')), 'Unexpected preview artifact file')
  const receipt = JSON.parse(await readFile(join(artifact, 'receipt.json'), 'utf8'))
  requireThat(receipt.version === 1 && identityKeys.every(key => receipt[key] === id[key]), 'Preview receipt identity mismatch')
  const bundle = join(artifact, 'bundle')
  const files = await inventory(bundle, { output: true })
  requireThat(JSON.stringify(receipt.files) === JSON.stringify(files), 'Preview inventory mismatch')
  const { worker } = await readBuild(bundle, files)
  // The manifest and module bytes are PR data; deployment configuration is rebuilt here.
  const trustedWorker = {
    name: 'lie-pr-preview',
    compatibilityDate: '2026-10-23',
    compatibilityFlags: ['enable_request_signal'],
    limits: { cpuMs: 30000 },
    assets: { notFoundHandling: 'single-page-application', runWorkerFirst: ['/api/*', '/games/*', '/static/*', '/assets/*'] },
    env: {
      ASSETS: { type: 'assets' },
      SHARED_GAMES: { type: 'r2', name: 'lie-shared-games-dev' },
      VOICE_MAX_SESSION_SECONDS: { type: 'text', value: '600' },
      VOICE_DEVICE_ENVIRONMENT: { type: 'text', value: `pr-${id.prNumber}` }
    },
    observability: { enabled: true, redactQueryString: true, logs: { enabled: true, headSamplingRate: 1 }, traces: { enabled: true, headSamplingRate: 0.01 } },
    manifest: { type: worker.manifest.type, mainModule: worker.manifest.mainModule, modules: worker.manifest.modules }
  }
  await mkdir(dirname(destination), { recursive: true })
  await mkdir(destination, { mode: 0o700 })
  const target = join(destination, prefix)
  await mkdir(target, { recursive: true, mode: 0o700 })
  for (const directory of ['bundle', 'assets']) await cp(join(bundle, prefix, directory), join(target, directory), { recursive: true, force: false, errorOnExist: true })
  await writeFile(join(destination, 'v0/config.json'), JSON.stringify({ buildContext: { mode: 'preview', isPreview: true } }) + '\n', { mode: 0o600, flag: 'wx' })
  await writeFile(join(target, 'worker.config.json'), JSON.stringify(trustedWorker) + '\n', { mode: 0o600, flag: 'wx' })
  return { files: files.length, worker: trustedWorker }
}

async function main() {
  requireThat(process.argv[2] === 'pack', 'Expected pack command')
  const receipt = await pack(process.env.PR_PREVIEW_SOURCE ?? 'apps/gateway/.cloudflare/output', process.env.PR_PREVIEW_ARTIFACT_DIR ?? 'tmp/pr-preview-build', identityFromEnv(process.env))
  console.log(`Packaged ${receipt.files.length} preview files`)
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error('Preview artifact operation failed'); process.exitCode = 1 })
