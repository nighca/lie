import { createHash } from 'node:crypto'
import { appendFile, cp, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = 'nighca/lie'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const requireThat = (condition, message) => { if (!condition) throw Error(message) }
const decimal = value => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value))
const safePath = value => typeof value === 'string' && value.length > 0 && !value.includes('\\') && value.split('/').every(part => part && part !== '.' && part !== '..' && part !== '.git' && !part.startsWith('.env') && !part.startsWith('.dev.vars'))

export function identity(env) {
  const result = { repository: env.GITHUB_REPOSITORY, sha: env.CI_HEAD_SHA ?? env.GITHUB_SHA, runId: env.CI_RUN_ID ?? env.GITHUB_RUN_ID, attempt: env.CI_RUN_ATTEMPT ?? env.GITHUB_RUN_ATTEMPT }
  requireThat(result.repository === repository && /^[a-f0-9]{40}$/.test(result.sha ?? '') && decimal(result.runId) && decimal(result.attempt), 'Invalid CI identity')
  return { ...result, runId: String(result.runId), attempt: String(result.attempt) }
}

export const artifactName = id => `production-build-${id.sha}-${id.runId}-${id.attempt}`

export function validateRun(event, actual, workflow) {
  const upstream = event.workflow_run
  requireThat(event.action === 'completed' && event.repository?.full_name === repository, 'Not a completed run in this repository')
  requireThat(workflow.path === '.github/workflows/ci.yml' && workflow.name === 'CI' && actual.workflow_id === workflow.id && upstream?.workflow_id === workflow.id, 'Unexpected CI workflow')
  for (const run of [upstream, actual]) {
    requireThat(run?.repository?.full_name === repository && run.head_repository?.full_name === repository && run.head_repository.id === run.repository.id, 'Untrusted run repository')
    requireThat(run.head_branch === 'main' && ['push', 'workflow_dispatch'].includes(run.event), 'Not a main CI run')
    requireThat(run.status === 'completed' && run.conclusion === 'success', 'CI did not complete successfully')
  }
  requireThat(actual.id === upstream.id && actual.run_attempt === upstream.run_attempt && actual.head_sha === upstream.head_sha, 'CI run or attempt changed')
  return identity({ GITHUB_REPOSITORY: repository, CI_HEAD_SHA: actual.head_sha, CI_RUN_ID: actual.id, CI_RUN_ATTEMPT: actual.run_attempt })
}

export function selectArtifact(response, id, repoId) {
  requireThat(Array.isArray(response.artifacts) && response.total_count === response.artifacts.length, 'Incomplete artifact listing')
  const matches = response.artifacts.filter(item => item.name === artifactName(id))
  requireThat(matches.length === 1, 'Verified build artifact missing or ambiguous')
  const item = matches[0]
  requireThat(decimal(item.id) && item.expired === false && /^sha256:[a-f0-9]{64}$/.test(item.digest ?? ''), 'Build artifact expired or invalid')
  requireThat(String(item.workflow_run?.id) === id.runId && item.workflow_run.head_sha === id.sha && item.workflow_run.repository_id === repoId && item.workflow_run.head_repository_id === repoId && item.workflow_run.head_branch === 'main', 'Build artifact provenance mismatch')
  return String(item.id)
}

async function inventory(root, prefix = '') {
  requireThat((await lstat(root)).isDirectory(), 'Build root must be a real directory')
  const files = []
  for (const name of (await readdir(root)).sort()) {
    const relative = prefix + name
    requireThat(safePath(relative), 'Unsafe build path')
    const path = join(root, name), stat = await lstat(path)
    if (stat.isDirectory()) files.push(...await inventory(path, relative + '/'))
    else {
      requireThat(stat.isFile(), 'Build contains a symlink or special file')
      files.push({ path: relative, size: stat.size, sha256: hash(await readFile(path)) })
    }
  }
  return files
}

async function inspectBuild(root) {
  root = join(root, 'v0')
  const config = JSON.parse(await readFile(join(root, 'config.json'), 'utf8'))
  requireThat(config.buildContext?.mode === 'production' && config.buildContext.isPreview === false, 'Not production Build Output')
  const worker = JSON.parse(await readFile(join(root, 'workers/default/worker.config.json'), 'utf8'))
  requireThat(worker.name === 'lie-game' && safePath(worker.manifest?.mainModule), 'Unexpected Worker build')
  requireThat((await lstat(join(root, 'workers/default/bundle', worker.manifest.mainModule))).isFile(), 'Missing Worker module')
  requireThat((await lstat(join(root, 'workers/default/assets/index.html'))).isFile(), 'Missing built web entry')
}

export async function pack(source, destination, id, lockPath = 'package-lock.json') {
  // Copy only Build Output, never project config, .dev.vars, caches or dependencies.
  await inventory(source)
  await inspectBuild(source)
  await mkdir(destination, { recursive: false })
  await cp(source, join(destination, 'bundle'), { recursive: true, force: false, errorOnExist: true })
  const receipt = { version: 1, ...id, lockSha256: hash(await readFile(lockPath)), files: await inventory(join(destination, 'bundle')) }
  await writeFile(join(destination, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n')
  return receipt
}

export async function restore(artifact, destination, id, lockPath = 'package-lock.json') {
  requireThat((await lstat(artifact)).isDirectory() && (await lstat(join(artifact, 'receipt.json'))).isFile(), 'Invalid artifact root')
  const receipt = JSON.parse(await readFile(join(artifact, 'receipt.json'), 'utf8'))
  requireThat(receipt.version === 1 && Object.entries(id).every(([key, value]) => receipt[key] === value), 'Build receipt identity mismatch')
  requireThat(receipt.lockSha256 === hash(await readFile(lockPath)), 'Build lockfile mismatch')
  const bundle = join(artifact, 'bundle'), files = await inventory(bundle)
  requireThat(JSON.stringify(receipt.files) === JSON.stringify(files), 'Build inventory mismatch')
  await inspectBuild(bundle)
  await mkdir(dirname(destination), { recursive: true })
  // A fresh destination prevents mixing output from different CI runs.
  await mkdir(destination)
  for (const name of await readdir(bundle)) await cp(join(bundle, name), join(destination, name), { recursive: true, force: false, errorOnExist: true })
  return files.length
}

async function api(path, env) {
  requireThat(env.GH_TOKEN, 'Missing read-only GitHub token')
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, { headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, signal: AbortSignal.timeout(30000) })
  requireThat(response.ok, `GitHub metadata request failed (${response.status})`)
  return response.json()
}

export async function authorize(env, select = true) {
  requireThat(env.GITHUB_EVENT_NAME === 'workflow_run' && env.GITHUB_REPOSITORY === repository, 'CD requires this repository workflow_run')
  const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'))
  requireThat(decimal(event.workflow_run?.id), 'Invalid triggering run ID')
  const run = await api(`actions/runs/${event.workflow_run.id}`, env)
  const workflow = await api('actions/workflows/ci.yml', env)
  const id = validateRun(event, run, workflow)
  const main = await api('git/ref/heads/main', env)
  requireThat(/^[a-f0-9]{40}$/.test(main.object?.sha ?? ''), 'Invalid current main metadata')
  const current = main.object.sha === id.sha
  const outputs = { current: String(current), sha: id.sha, run_id: id.runId, run_attempt: id.attempt }
  if (current && select) outputs.artifact_id = selectArtifact(await api(`actions/runs/${id.runId}/artifacts?per_page=100`, env), id, run.repository.id)
  return outputs
}

async function main() {
  const command = process.argv[2], env = process.env
  if (command === 'pack') {
    await mkdir('tmp', { recursive: true })
    const receipt = await pack('apps/gateway/.cloudflare/output', 'tmp/verified-build', identity(env))
    console.log(`Packed ${receipt.files.length} verified build files`)
  } else if (command === 'restore') {
    const count = await restore(env.ARTIFACT_DIR, 'apps/gateway/.cloudflare/output', identity(env))
    console.log(`Restored ${count} verified build files`)
  } else if (command === 'authorize' || command === 'latest') {
    const outputs = await authorize(env, command === 'authorize')
    for (const [key, value] of Object.entries(outputs)) await appendFile(env.GITHUB_OUTPUT, `${key}=${value}\n`)
    if (outputs.current === 'false') console.log('A newer main commit exists; skipping this deployment.')
  } else throw Error('Expected pack, authorize, restore or latest')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1 })
