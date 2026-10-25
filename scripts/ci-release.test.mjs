import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, test } from 'node:test'

import { artifactName, authorize, identity, pack, restore, selectArtifact, validateRun } from './ci-release.mjs'

const sha = 'a'.repeat(40)
const id = identity({ GITHUB_REPOSITORY: 'nighca/lie', GITHUB_SHA: sha, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2' })
const workflow = { id: 10, path: '.github/workflows/ci.yml', name: 'CI' }
const repo = { id: 7, full_name: 'nighca/lie' }
const run = { id: 123, workflow_id: 10, repository: repo, head_repository: repo, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success', head_sha: sha, run_attempt: 2 }
const event = { action: 'completed', repository: repo, workflow_run: run }
const artifact = { id: 90, name: artifactName(id), expired: false, digest: 'sha256:' + 'd'.repeat(64), workflow_run: { id: 123, head_sha: sha, head_branch: 'main', repository_id: 7, head_repository_id: 7 } }
const roots = []
afterEach(async () => { await Promise.all(roots.splice(0).map(path => rm(path, { recursive: true, force: true }))) })
async function temporary() { const root = await mkdtemp(join(tmpdir(), 'lie-ci-release-')); roots.push(root); return root }

for (const scenario of [
  ['failure', { conclusion: 'failure' }], ['cancelled', { conclusion: 'cancelled' }],
  ['unfinished', { status: 'in_progress' }], ['feature branch', { head_branch: 'feature' }],
  ['pull request', { event: 'pull_request' }], ['fork', { head_repository: { id: 8, full_name: 'someone/lie' } }],
  ['other workflow', { workflow_id: 11 }], ['another SHA', { head_sha: 'b'.repeat(40) }],
  ['new attempt', { run_attempt: 3 }], ['wrong run', { id: 124 }]
]) test(`rejects ${scenario[0]} as a deployment source`, () => {
  assert.throws(() => validateRun(event, { ...run, ...scenario[1] }, workflow))
})
test('accepts only exact successful CI identity, including explicit manual CI on main', () => {
  assert.deepEqual(validateRun(event, run, workflow), id)
  const manual = { ...run, event: 'workflow_dispatch' }
  assert.deepEqual(validateRun({ ...event, workflow_run: manual }, manual, workflow), id)
  assert.throws(() => validateRun({ ...event, repository: { full_name: 'fork/lie' } }, run, workflow))
  assert.throws(() => validateRun(event, run, { ...workflow, path: '.github/workflows/other.yml' }))
  assert.throws(() => validateRun(event, run, { ...workflow, name: 'Other checks' }))
})
test('artifact selection binds run, attempt name, SHA and repositories, not newest artifact', () => {
  assert.equal(selectArtifact({ total_count: 1, artifacts: [artifact] }, id, 7), '90')
  for (const item of [
    { ...artifact, expired: true }, { ...artifact, digest: null }, { ...artifact, name: artifact.name.replace('-2', '-1') },
    { ...artifact, workflow_run: { ...artifact.workflow_run, head_sha: 'b'.repeat(40) } },
    { ...artifact, workflow_run: { ...artifact.workflow_run, head_repository_id: 8 } }
  ]) assert.throws(() => selectArtifact({ total_count: 1, artifacts: [item] }, id, 7))
  assert.throws(() => selectArtifact({ total_count: 2, artifacts: [artifact] }, id, 7))
  assert.throws(() => selectArtifact({ total_count: 2, artifacts: [artifact, artifact] }, id, 7))
})
test('authorization skips stale main without downloading; does not use CD github.sha', async () => {
  const root = await temporary(), path = join(root, 'event.json')
  await writeFile(path, JSON.stringify(event))
  const original = globalThis.fetch, calls = []
  let latest = sha
  globalThis.fetch = async url => {
    calls.push(String(url))
    const data = String(url).includes('/artifacts?') ? { total_count: 1, artifacts: [artifact] }
      : String(url).endsWith('/actions/runs/123') ? run
      : String(url).endsWith('/ci.yml') ? workflow : { object: { sha: latest } }
    return Response.json(data)
  }
  try {
    const env = { GITHUB_EVENT_NAME: 'workflow_run', GITHUB_REPOSITORY: 'nighca/lie', GITHUB_EVENT_PATH: path, GITHUB_SHA: 'c'.repeat(40), GH_TOKEN: 'fake-test-token' }
    assert.deepEqual(await authorize(env), { current: 'true', sha, run_id: '123', run_attempt: '2', artifact_id: '90' })
    latest = 'b'.repeat(40); calls.length = 0
    assert.equal((await authorize(env)).current, 'false')
    assert.equal(calls.some(url => url.includes('/artifacts?')), false)
  } finally { globalThis.fetch = original }
})
async function fixture() {
  const root = await temporary(), source = join(root, 'output'), lock = join(root, 'package-lock.json')
  await mkdir(join(source, 'v0/workers/default/bundle/.vite'), { recursive: true })
  await mkdir(join(source, 'v0/workers/default/assets/.well-known'), { recursive: true })
  await writeFile(join(source, 'v0/config.json'), JSON.stringify({ buildContext: { isPreview: false, mode: 'production' } }))
  await writeFile(join(source, 'v0/workers/default/worker.config.json'), JSON.stringify({ name: 'lie-game', manifest: { mainModule: 'index.js' } }))
  await writeFile(join(source, 'v0/workers/default/bundle/index.js'), 'export default {}')
  await writeFile(join(source, 'v0/workers/default/bundle/.vite/manifest.json'), '{}')
  await writeFile(join(source, 'v0/workers/default/assets/index.html'), '<html>verified</html>')
  await writeFile(join(source, 'v0/workers/default/assets/.well-known/example'), 'hidden asset')
  await writeFile(lock, 'locked dependency bytes')
  return { root, source, lock, artifact: join(root, 'artifact'), target: join(root, 'restored') }
}
test('roundtrip preserves complete worker/assets and hidden files without rebuild', async () => {
  const f = await fixture(), receipt = await pack(f.source, f.artifact, id, f.lock)
  assert.equal(await restore(f.artifact, f.target, id, f.lock), receipt.files.length)
  assert.equal(await readFile(join(f.target, 'v0/workers/default/bundle/.vite/manifest.json'), 'utf8'), '{}')
  assert.equal(await readFile(join(f.target, 'v0/workers/default/assets/.well-known/example'), 'utf8'), 'hidden asset')
  await assert.rejects(() => restore(f.artifact, f.target, id, f.lock))
})
test('wrong receipt identity, lock or modified payload never restores', async () => {
  const f = await fixture(); await pack(f.source, f.artifact, id, f.lock)
  await assert.rejects(() => restore(f.artifact, f.target, { ...id, attempt: '1' }, f.lock))
  await writeFile(f.lock, 'changed'); await assert.rejects(() => restore(f.artifact, f.target, id, f.lock))
  await writeFile(f.lock, 'locked dependency bytes')
  await writeFile(join(f.artifact, 'bundle/v0/workers/default/assets/index.html'), '<html>unverified</html>')
  await assert.rejects(() => restore(f.artifact, f.target, id, f.lock))
})
test('extra files, traversal receipts and symlinks are rejected', async () => {
  const f = await fixture(); await pack(f.source, f.artifact, id, f.lock)
  await writeFile(join(f.artifact, 'bundle/extra-file'), 'not in inventory')
  await assert.rejects(() => restore(f.artifact, f.target, id, f.lock))
  await rm(join(f.artifact, 'bundle/extra-file'))
  const receiptPath = join(f.artifact, 'receipt.json'), receipt = JSON.parse(await readFile(receiptPath, 'utf8'))
  receipt.files[0].path = '../../outside'; await writeFile(receiptPath, JSON.stringify(receipt))
  await assert.rejects(() => restore(f.artifact, f.target, id, f.lock))
  await symlink(f.lock, join(f.source, 'linked-file'))
  await assert.rejects(() => pack(f.source, join(f.root, 'second-artifact'), id, f.lock))
  await rm(join(f.source, 'linked-file'))
  await writeFile(join(f.source, '.env.production'), 'must not upload')
  await assert.rejects(() => pack(f.source, join(f.root, 'third-artifact'), id, f.lock))
})
test('preview mode, missing web and wrong worker cannot be packaged', async () => {
  const f = await fixture()
  await writeFile(join(f.source, 'v0/config.json'), JSON.stringify({ buildContext: { isPreview: true, mode: 'production' } }))
  await assert.rejects(() => pack(f.source, f.artifact, id, f.lock))
  await writeFile(join(f.source, 'v0/config.json'), JSON.stringify({ buildContext: { isPreview: false, mode: 'production' } }))
  await writeFile(join(f.source, 'v0/workers/default/worker.config.json'), JSON.stringify({ name: 'wrong-worker', manifest: { mainModule: 'index.js' } }))
  await assert.rejects(() => pack(f.source, f.artifact, id, f.lock))
  await writeFile(join(f.source, 'v0/workers/default/worker.config.json'), JSON.stringify({ name: 'lie-game', manifest: { mainModule: 'index.js' } }))
  await rm(join(f.source, 'v0/workers/default/assets/index.html'))
  await assert.rejects(() => pack(f.source, f.artifact, id, f.lock))
})
