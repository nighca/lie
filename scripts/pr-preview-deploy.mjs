import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { restore, validateIdentity } from './pr-preview-artifact.mjs'

const runFile = promisify(execFile)
const secretNames = ['LINX_API_KEY', 'LINX_WS_TOKEN', 'LINX_AGENT_ID', 'VOICE_DEVICE_COOKIE_SECRET']
const requireThat = (condition, message) => { if (!condition) throw Error(message) }

export class PreviewOperationError extends Error {
  constructor(stage, error) {
    const httpStatus = error instanceof PreviewOperationError ? error.httpStatus : undefined
    const exitCode = Number.isInteger(error?.code) && error.code >= 0 && error.code <= 255 ? error.code : undefined
    super(`Preview operation failed: stage=${stage}${httpStatus == null ? '' : ` http=${httpStatus}`}${exitCode == null ? '' : ` exit=${exitCode}`}`)
    this.stage = stage
    this.httpStatus = httpStatus
    this.exitCode = exitCode
  }
}
function httpFailure(status) {
  const error = new PreviewOperationError('metadata-http')
  error.httpStatus = status
  return error
}

function credentials(options) {
  requireThat(isAbsolute(options.cliPath ?? '') && /^[a-f0-9]{32}$/.test(options.accountId ?? '') && typeof options.apiToken === 'string' && options.apiToken.length > 0, 'Missing trusted preview deployment credentials')
}

async function cliEnvironment(directory, options) {
  await mkdir(join(directory, 'config'), { mode: 0o700 })
  return {
    PATH: process.env.PATH ?? '',
    XDG_CONFIG_HOME: join(directory, 'config'),
    CF_SEND_TELEMETRY: 'false',
    WRANGLER_SEND_METRICS: 'false',
    CI: 'true',
    CLOUDFLARE_ACCOUNT_ID: options.accountId,
    CLOUDFLARE_API_TOKEN: options.apiToken
  }
}

function previewParent(value) {
  const parent = value?.result ?? value
  requireThat(value?.success !== false && parent?.name === 'lie-pr-preview' && (parent.previews_base_config == null || (typeof parent.previews_base_config === 'object' && !Array.isArray(parent.previews_base_config) && Object.keys(parent.previews_base_config).length === 0)), 'Expected dedicated preview parent with empty base configuration')
  return parent
}

async function readMetadata(url, options, request) {
  const response = await request(url, { headers: { Authorization: `Bearer ${options.apiToken}` }, redirect: 'error', signal: AbortSignal.timeout(10000) })
  try {
    if (response.status === 404) return null
    if (response.status !== 200) throw httpFailure(response.status)
    const text = await response.text()
    requireThat(Buffer.byteLength(text) <= 1024 * 1024, 'Preview metadata exceeds size limit')
    const value = JSON.parse(text)
    const result = value?.result ?? value
    requireThat(value?.success !== false && result != null && typeof result === 'object' && !Array.isArray(result), 'Could not verify preview metadata')
    return result
  } finally { if (!response.bodyUsed) await response.body?.cancel() }
}

function apiRoot(options) {
  return `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/workers/workers/lie-pr-preview`
}

export function previewResult(value, prNumber) {
  requireThat(value != null && value.type === 'preview' && value.version === 1 && value.preview_name === `pr-${prNumber}`, 'Unexpected preview deployment response')
  const urls = field => {
    requireThat(Array.isArray(value[field]) && value[field].length > 0 && value[field].length <= 10, 'Missing preview deployment URL')
    return value[field].map(raw => {
      requireThat(typeof raw === 'string', 'Invalid preview deployment URL')
      const url = new URL(raw)
      requireThat(url.protocol === 'https:' && url.hostname.endsWith('.workers.dev') && url.hostname.split('.').length === 4 && url.port === '' && url.username === '' && url.password === '' && url.pathname === '/' && url.search === '' && url.hash === '', 'Invalid preview deployment URL')
      return url.origin
    })
  }
  for (const key of ['preview_id', 'deployment_id']) requireThat(typeof value[key] === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value[key]), 'Invalid preview deployment identity')
  requireThat(typeof value.preview_slug === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value.preview_slug), 'Invalid preview slug')
  const previewUrls = urls('preview_urls'), deploymentUrls = urls('deployment_urls')
  requireThat(previewUrls.every(url => new URL(url).hostname.startsWith(`${value.preview_slug}-lie-pr-preview.`)), 'Preview URL does not match deployment target')
  const accountDomain = new URL(previewUrls[0]).hostname.split('.').slice(1).join('.')
  requireThat([...previewUrls, ...deploymentUrls].every(url => new URL(url).hostname.endsWith(`.${accountDomain}`)), 'Inconsistent preview URL account')
  requireThat(deploymentUrls.every(url => new URL(url).hostname === `${value.deployment_id.toLowerCase()}-lie-pr-preview.${accountDomain}`), 'Deployment URL does not match deployment identity')
  return { type: 'preview', version: 1, preview_id: value.preview_id, preview_name: value.preview_name, preview_slug: value.preview_slug, preview_urls: previewUrls, deployment_id: value.deployment_id, deployment_urls: deploymentUrls }
}

export function verifyRuntimeDeployment(value, expected) {
  const deployment = value?.result ?? value
  requireThat(value?.success !== false && deployment != null && deployment.id === expected.deployment_id && deployment.preview_id === expected.preview_id && deployment.env != null && typeof deployment.env === 'object' && !Array.isArray(deployment.env), 'Invalid preview deployment metadata')
  const names = ['ASSETS', 'SHARED_GAMES', 'VOICE_MAX_SESSION_SECONDS', 'VOICE_DEVICE_ENVIRONMENT', ...secretNames]
  requireThat(Object.keys(deployment.env).length === names.length && names.every(name => Object.hasOwn(deployment.env, name)), 'Unexpected preview runtime bindings')
  const env = deployment.env
  requireThat(env.ASSETS.type === 'assets' && env.SHARED_GAMES.type === 'r2_bucket' && env.SHARED_GAMES.bucket_name === 'lie-shared-games-dev', 'Unexpected preview storage bindings')
  requireThat(env.VOICE_MAX_SESSION_SECONDS.type === 'plain_text' && env.VOICE_MAX_SESSION_SECONDS.text === '600' && env.VOICE_DEVICE_ENVIRONMENT.type === 'plain_text' && env.VOICE_DEVICE_ENVIRONMENT.text === expected.preview_name, 'Unexpected preview runtime variables')
  requireThat(secretNames.every(name => env[name].type === 'secret_text'), 'Unexpected preview secret binding type')
}

export async function deployPreview(options, run = runFile, request = fetch) {
  const identity = validateIdentity(options.identity)
  credentials(options)
  requireThat(options.runtimeSecrets != null && Object.keys(options.runtimeSecrets).length === secretNames.length && secretNames.every(name => typeof options.runtimeSecrets[name] === 'string' && options.runtimeSecrets[name].length > 0), 'Missing preview runtime secret')
  requireThat(new TextEncoder().encode(options.runtimeSecrets.VOICE_DEVICE_COOKIE_SECRET).byteLength >= 32, 'Preview signing secret must contain at least 32 bytes')
  const directory = await mkdtemp(join(tmpdir(), 'lie-pr-preview-'))
  let stage = 'restore'
  try {
    const { worker } = await restore(options.artifactDir, join(directory, '.cloudflare/output'), identity)
    // Only the final upload directory contains runtime secrets; it is never an artifact.
    for (const name of secretNames) worker.env[name] = { type: 'unsafe:secret_text', text: options.runtimeSecrets[name] }
    await writeFile(join(directory, '.cloudflare/output/v0/workers/default/worker.config.json'), JSON.stringify(worker) + '\n', { mode: 0o600 })
    const env = await cliEnvironment(directory, options)
    stage = 'parent-preflight'
    const preflight = await run(process.execPath, [options.cliPath, 'workers', 'get', 'lie-pr-preview'], { cwd: directory, env, timeout: 30000, maxBuffer: 1024 * 1024 })
    previewParent(JSON.parse(preflight.stdout))
    stage = 'old-preview-preflight'
    const existing = await readMetadata(`${apiRoot(options)}/previews/pr-${identity.prNumber}`, options, request)
    if (existing != null) {
      requireThat(existing.name === `pr-${identity.prNumber}` && typeof existing.id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(existing.id), 'Unexpected existing preview identity')
      const previous = await readMetadata(`${apiRoot(options)}/previews/${encodeURIComponent(existing.id)}/deployments/latest`, options, request)
      requireThat(previous != null && typeof previous.id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(previous.id), 'Existing preview deployment could not be verified')
      // cf inherits omitted old secret names. Reject every extra binding before PR code can run.
      verifyRuntimeDeployment(previous, { preview_id: existing.id, deployment_id: previous.id, preview_name: existing.name })
    }
    // Absolute trusted CLI, empty project, no npm/package hooks, PR config or NODE_OPTIONS.
    stage = 'upload'
    const result = await run(process.execPath, [options.cliPath, 'previews', 'deploy', `pr-${identity.prNumber}`, '--prebuilt', '--mode', 'preview', '--worker', 'lie-pr-preview'], { cwd: directory, env, timeout: 180000, maxBuffer: 1024 * 1024 })
    stage = 'result-validate'
    const deployed = previewResult(JSON.parse(result.stdout), identity.prNumber)
    // beta.18 cannot GET Preview metadata through its CLI; verify only the exact new deployment.
    const url = `${apiRoot(options)}/previews/${encodeURIComponent(deployed.preview_id)}/deployments/${encodeURIComponent(deployed.deployment_id)}`
    stage = 'post-metadata'
    verifyRuntimeDeployment(await readMetadata(url, options, request), deployed)
    return deployed
  } catch (error) {
    throw new PreviewOperationError(stage, error)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

function publicInspectionUrls(value, fields, labels) {
  const candidates = fields.flatMap(field => {
    const entry = value[field]
    return Array.isArray(entry) ? entry : entry != null && typeof entry === 'object' ? Object.values(entry) : []
  }).filter(entry => typeof entry === 'string')
  const urls = candidates.filter(raw => {
    try {
      const url = new URL(raw), parts = url.hostname.split('.')
      return url.protocol === 'https:' && url.port === '' && url.username === '' && url.password === '' && url.search === '' && url.hash === '' && url.pathname === '/' && parts.length === 4 && parts.slice(2).join('.') === 'workers.dev' && labels.some(label => parts[0] === `${label.toLowerCase()}-lie-pr-preview`)
    } catch { return false }
  })
  return { urls: [...new Set(urls.map(raw => new URL(raw).origin))], candidateCount: candidates.length }
}

export async function inspectPreview(options, run = runFile, request = fetch) {
  let stage = 'inspect-input', directory
  try {
    credentials(options)
    const prNumber = Number(options.prNumber)
    requireThat(/^[1-9][0-9]*$/.test(String(options.prNumber)) && Number.isSafeInteger(prNumber), 'Invalid preview inspection target')
    directory = await mkdtemp(join(tmpdir(), 'lie-pr-preview-inspect-'))
    const env = await cliEnvironment(directory, options)
    stage = 'inspect-parent'
    let parent
    try {
      const result = await run(process.execPath, [options.cliPath, 'workers', 'get', 'lie-pr-preview'], { cwd: directory, env, timeout: 30000, maxBuffer: 1024 * 1024 })
      const value = JSON.parse(result.stdout)
      parent = value?.result ?? value
      requireThat(value?.success !== false && parent?.name === 'lie-pr-preview', 'Unexpected preview parent')
    } catch { parent = await readMetadata(apiRoot(options), options, request) }
    const summary = { parentExists: parent != null, parentBaseEmpty: false, previewExists: false, metadataHTTPcode: parent == null ? 404 : 200, previewURLs: [], deploymentURLs: [], previewURLCandidateCount: 0, deploymentURLCandidateCount: 0 }
    if (parent == null) return summary
    requireThat(parent.name === 'lie-pr-preview', 'Unexpected preview parent')
    try { previewParent(parent); summary.parentBaseEmpty = true } catch { /* Report only the boolean. */ }
    stage = 'inspect-preview'
    const preview = await readMetadata(`${apiRoot(options)}/previews/pr-${prNumber}`, options, request)
    summary.metadataHTTPcode = preview == null ? 404 : 200
    if (preview == null) return summary
    const publicId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value)
    requireThat(preview.name === `pr-${prNumber}` && publicId(preview.id), 'Unexpected preview identity')
    Object.assign(summary, { previewExists: true, previewID: preview.id, previewName: preview.name })
    const previewLabels = [preview.name, ...(publicId(preview.slug) ? [preview.slug] : [])]
    const previewLinks = publicInspectionUrls(preview, ['urls', 'preview_urls'], previewLabels)
    Object.assign(summary, { previewURLs: previewLinks.urls, previewURLCandidateCount: previewLinks.candidateCount })
    stage = 'inspect-deployment'
    const deployment = await readMetadata(`${apiRoot(options)}/previews/${encodeURIComponent(preview.id)}/deployments/latest`, options, request)
    summary.metadataHTTPcode = deployment == null ? 404 : 200
    if (deployment == null) return summary
    requireThat(publicId(deployment.id) && deployment.preview_id === preview.id, 'Unexpected deployment identity')
    const deploymentLinks = publicInspectionUrls(deployment, ['urls', 'deployment_urls'], [deployment.id, deployment.id.slice(0, 8)])
    Object.assign(summary, { deploymentURLs: deploymentLinks.urls, deploymentURLCandidateCount: deploymentLinks.candidateCount })
    const knownFields = ['id', 'preview_id', 'env', 'main_module', 'modules', 'assets', 'compatibility_date', 'compatibility_flags', 'limits', 'annotations', 'urls', 'created_on', 'modified_on']
    const names = ['ASSETS', 'SHARED_GAMES', 'VOICE_MAX_SESSION_SECONDS', 'VOICE_DEVICE_ENVIRONMENT', ...secretNames]
    const knownTypes = ['assets', 'r2_bucket', 'plain_text', 'secret_text', 'inherit']
    const bindings = deployment.env != null && typeof deployment.env === 'object' && !Array.isArray(deployment.env) ? deployment.env : {}
    Object.assign(summary, {
      deploymentID: deployment.id,
      topLevelFields: Object.keys(deployment).filter(key => knownFields.includes(key)).sort(),
      unknownTopLevelFieldCount: Object.keys(deployment).filter(key => !knownFields.includes(key)).length,
      envCount: Object.keys(bindings).length,
      unknownEnvCount: Object.keys(bindings).filter(key => !names.includes(key)).length,
      envTypes: Object.fromEntries(names.filter(name => Object.hasOwn(bindings, name)).map(name => [name, knownTypes.includes(bindings[name]?.type) ? bindings[name].type : 'unknown'])),
      r2DevMatch: bindings.SHARED_GAMES?.type === 'r2_bucket' && bindings.SHARED_GAMES.bucket_name === 'lie-shared-games-dev',
      namespacePrMatch: bindings.VOICE_DEVICE_ENVIRONMENT?.type === 'plain_text' && bindings.VOICE_DEVICE_ENVIRONMENT.text === `pr-${prNumber}`,
      voice600Match: bindings.VOICE_MAX_SESSION_SECONDS?.type === 'plain_text' && bindings.VOICE_MAX_SESSION_SECONDS.text === '600',
      secretTypeMatch: secretNames.every(name => bindings[name]?.type === 'secret_text')
    })
    return summary
  } catch (error) { throw new PreviewOperationError(stage, error) }
  finally { if (directory != null) await rm(directory, { recursive: true, force: true }) }
}

export async function initializePreviewParent(options, run = runFile, request = fetch) {
  credentials(options)
  const directory = await mkdtemp(join(tmpdir(), 'lie-pr-preview-init-'))
  let stage = 'init-parent-preflight'
  try {
    const env = await cliEnvironment(directory, options)
    let previous, absent = false
    try {
      previous = await run(process.execPath, [options.cliPath, 'workers', 'get', 'lie-pr-preview'], { cwd: directory, env, timeout: 30000, maxBuffer: 1024 * 1024 })
    } catch {
      // Never interpret a CLI authentication/transport error as permission to overwrite a Worker.
      const current = await readMetadata(apiRoot(options), options, request)
      if (current != null) {
        previewParent(current)
        return { initialized: true, existing: true, workerName: 'lie-pr-preview' }
      }
      absent = true
    }
    if (previous != null) {
      previewParent(JSON.parse(previous.stdout))
      return { initialized: true, existing: true, workerName: 'lie-pr-preview' }
    }
    requireThat(absent, 'Preview parent absence was not confirmed')
    stage = 'init-build-output'
    const workerRoot = join(directory, '.cloudflare/output/v0/workers/default')
    await mkdir(join(workerRoot, 'bundle'), { recursive: true, mode: 0o700 })
    const worker = {
      name: 'lie-pr-preview', compatibilityDate: '2026-11-01', workersDev: false, previewUrls: true,
      observability: { enabled: true, logs: { enabled: true, headSamplingRate: 1 }, traces: { enabled: true, headSamplingRate: 0.01 } },
      manifest: { type: 'complete', mainModule: 'index.js', modules: { 'index.js': { type: 'esm' } } }
    }
    await writeFile(join(directory, '.cloudflare/output/v0/config.json'), JSON.stringify({ buildContext: { mode: 'production', isPreview: false } }), { mode: 0o600 })
    await writeFile(join(workerRoot, 'worker.config.json'), JSON.stringify(worker), { mode: 0o600 })
    await writeFile(join(workerRoot, 'bundle/index.js'), "export default { fetch() { return new Response('PR preview parent', { status: 404 }) } }\n", { mode: 0o600 })
    stage = 'init-upload'
    await run(process.execPath, [options.cliPath, 'deploy', '--prebuilt', '--mode', 'production', '--worker', 'lie-pr-preview', '--provision=false'], { cwd: directory, env, timeout: 60000, maxBuffer: 1024 * 1024 })
    stage = 'init-post-metadata'
    const checked = await run(process.execPath, [options.cliPath, 'workers', 'get', 'lie-pr-preview'], { cwd: directory, env, timeout: 30000, maxBuffer: 1024 * 1024 })
    previewParent(JSON.parse(checked.stdout))
    return { initialized: true, existing: false, workerName: 'lie-pr-preview' }
  } catch (error) {
    throw new PreviewOperationError(stage, error)
  } finally { await rm(directory, { recursive: true, force: true }) }
}

export async function deletePreview(options, run = runFile, request = fetch) {
  credentials(options)
  const prNumber = Number(options.prNumber)
  requireThat(/^[1-9][0-9]*$/.test(String(options.prNumber)) && Number.isSafeInteger(prNumber), 'Invalid preview deletion target')
  const previewName = `pr-${prNumber}`
  const directory = await mkdtemp(join(tmpdir(), 'lie-pr-preview-delete-'))
  let stage = 'delete-upload'
  try {
    const env = await cliEnvironment(directory, options)
    // --force skips the interactive prompt; it does not force-delete references.
    try {
      await run(process.execPath, [options.cliPath, 'previews', 'delete', previewName, '--worker', 'lie-pr-preview', '--force'], { cwd: directory, env, timeout: 60000, maxBuffer: 1024 * 1024 })
    } catch { /* An already absent Preview may produce a CLI error. Verify absence below. */ }
    // beta.18 has no CLI Preview GET/list command. Use its own GET endpoint only to verify deletion.
    stage = 'delete-confirm-absence'
    const url = `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/workers/workers/lie-pr-preview/previews/${previewName}`
    const response = await request(url, { headers: { Authorization: `Bearer ${options.apiToken}` }, redirect: 'error', signal: AbortSignal.timeout(10000) })
    try { if (response.status !== 404) throw httpFailure(response.status) }
    finally { await response.body?.cancel() }
    return { deleted: true, previewName }
  } catch (error) {
    throw new PreviewOperationError(stage, error)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

async function main() {
  const env = process.env
  if (process.argv[2] === 'inspect') {
    console.log(JSON.stringify(await inspectPreview({ prNumber: env.PR_NUMBER, cliPath: env.PR_PREVIEW_CF_CLI, accountId: env.CLOUDFLARE_ACCOUNT_ID, apiToken: env.CLOUDFLARE_API_TOKEN })))
    return
  }
  if (process.argv[2] === 'init') {
    console.log(JSON.stringify(await initializePreviewParent({ cliPath: env.PR_PREVIEW_CF_CLI, accountId: env.CLOUDFLARE_ACCOUNT_ID, apiToken: env.CLOUDFLARE_API_TOKEN })))
    return
  }
  if (process.argv[2] === 'delete') {
    console.log(JSON.stringify(await deletePreview({ prNumber: env.PR_NUMBER, cliPath: env.PR_PREVIEW_CF_CLI, accountId: env.CLOUDFLARE_ACCOUNT_ID, apiToken: env.CLOUDFLARE_API_TOKEN })))
    return
  }
  const identity = JSON.parse(await readFile(env.PR_PREVIEW_IDENTITY_FILE, 'utf8'))
  const result = await deployPreview({ artifactDir: env.PR_PREVIEW_ARTIFACT_DIR, identity, cliPath: env.PR_PREVIEW_CF_CLI, accountId: env.CLOUDFLARE_ACCOUNT_ID, apiToken: env.CLOUDFLARE_API_TOKEN, runtimeSecrets: Object.fromEntries(secretNames.map(name => [name, env[name]])) })
  console.log(JSON.stringify(result))
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error instanceof PreviewOperationError ? error.message : 'Preview operation failed: stage=input'); process.exitCode = 1 })
