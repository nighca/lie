import { lstat, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'

const approvedDevelopmentSource = '/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars'
const stateDirectory = fileURLToPath(new URL('../../tmp/pr-preview-ops/private/', import.meta.url))
const adapterDirectory = resolve(stateDirectory, '../voice-adapter')

export function previewTarget(origin, number) {
  if (!/^[1-9][0-9]*$/.test(String(number)) || !Number.isSafeInteger(Number(number))) throw Error('Explicit PR number required')
  const url = new URL(origin)
  if (url.protocol !== 'https:' || url.hostname.split('.').length !== 4 || !url.hostname.startsWith(`pr-${number}-lie-pr-preview.`) ||
    !url.hostname.endsWith('.workers.dev') || url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Explicit stable PR preview origin required')
  return { origin: url.origin, environment: `pr-${number}:https` }
}

/** Invoke once only after the provider turn and this adapter have been reviewed. */
export async function verifyPreview(origin, number) {
  const target = previewTarget(origin, number)
  const stat = await lstat(approvedDevelopmentSource)
  if (!stat.isFile() || (stat.mode & 0o077)) throw Error('Approved development source is not private')
  const content = await readFile(approvedDevelopmentSource, 'utf8')
  if (content.split(/\r?\n/).filter(line => /^\s*(?:export\s+)?LINX_API_KEY\s*=/.test(line)).length !== 1) throw Error('Approved management key has ambiguous assignments')
  const key = parseEnv(content).LINX_API_KEY
  if (!key || /[\s\u0000-\u001f\u007f]/.test(key)) throw Error('Approved management key is invalid')
  const { createApiRunner } = await import(pathToFileURL(join(adapterDirectory, 'release-api-v2.mjs')))
  const { relativeGuard } = await import(pathToFileURL(join(adapterDirectory, 'release-api-simple.mjs')))
  const io = {
    ...(await import('node:fs/promises')),
    readFile(path, ...args) { return path === '@approved-development-api-key' ? Promise.resolve(key) : readFile(path, ...args) }
  }
  const runner = createApiRunner({ window: relativeGuard(), io, approvedPreviewOrigin: target.origin, deviceEnvironment: target.environment,
    paths: { ledger: join(stateDirectory, 'voice-api-ledger.json'), key: '@approved-development-api-key', signing: join(stateDirectory, 'cookie-signing.key') } })
  let verification = null, cleanup = null
  try { verification = await runner.run('candidate', target.origin) } catch { /* The same only-owned ledger must still be cleaned. */ }
  try { cleanup = await runner.run('cleanup', '-') } catch { /* Unknown identities remain protected in the private ledger. */ }
  return { phase: 'preview-voice', passed: verification?.passed === true && cleanup?.allOwnedBindingsRemoved === true, verification, cleanup }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length !== 3 || args[2] !== '--approved-preview-20261101') throw Error('Explicit approved preview invocation required')
  verifyPreview(args[0], args[1]).then(value => { console.log(JSON.stringify(value)); if (!value.passed) process.exitCode = 1 }).catch(() => {
    console.error('Preview voice acceptance stopped; private owned ledger preserved')
    process.exitCode = 1
  })
}
