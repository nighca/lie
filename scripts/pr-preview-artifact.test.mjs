import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'

import { artifactName, identityFromEnv, pack, restore, validateIdentity } from './pr-preview-artifact.mjs'
import { validatePreviewRun } from './pr-preview-github.mjs'

const id = { repository: 'nighca/lie', prNumber: 12, headSha: 'a'.repeat(40), baseSha: 'b'.repeat(40), mergeSha: 'c'.repeat(40), runId: '123', runAttempt: '2' }
const roots = []
after(async () => { for (const root of roots) await rm(root, { recursive: true, force: true }) })
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'lie-preview-artifact-test-'))
  roots.push(root)
  const source = join(root, 'output'), workerRoot = join(source, 'v0/workers/default')
  await mkdir(join(workerRoot, 'bundle/.vite'), { recursive: true })
  await mkdir(join(workerRoot, 'assets/.well-known'), { recursive: true })
  await writeFile(join(source, 'v0/config.json'), JSON.stringify({ accountId: 'artifact-controlled-account', buildContext: { mode: 'preview', isPreview: true } }))
  const worker = {
    name: 'lie-game', compatibilityDate: '2099-01-01', compatibilityFlags: ['untrusted'],
    domains: ['production.example'], triggers: [{ type: 'scheduled', cron: '* * * * *' }],
    env: { SHARED_GAMES: { type: 'r2', name: 'lie-shared-games' }, VOICE_TRANSPORT: { type: 'text', value: 'relay' }, EVIL: { type: 'worker', worker: 'production' } },
    unsafe: { metadata: { untrusted: true } }, exports: { BadClass: { type: 'durable-object' } },
    manifest: { type: 'complete', mainModule: 'index.js', modules: { 'index.js': { type: 'esm' }, 'helper.wasm': { type: 'wasm' } } }
  }
  await writeFile(join(workerRoot, 'worker.config.json'), JSON.stringify(worker))
  await writeFile(join(workerRoot, 'bundle/index.js'), 'throw new Error("PR module must never execute in the publisher")')
  await writeFile(join(workerRoot, 'bundle/helper.wasm'), new Uint8Array([0, 97, 115, 109]))
  await writeFile(join(workerRoot, 'bundle/.vite/manifest.json'), '{}')
  await writeFile(join(workerRoot, 'assets/index.html'), '<html>PR UI</html>')
  await writeFile(join(workerRoot, 'assets/.well-known/example'), 'hidden asset')
  return { root, source, workerRoot, worker, artifact: join(root, 'artifact'), target: join(root, 'restored') }
}

test('identity names bind all three commits and the exact CI attempt', () => {
  assert.equal(artifactName(id), `pr-preview-12-${id.mergeSha}-123-2`)
  assert.deepEqual(identityFromEnv({ GITHUB_REPOSITORY: id.repository, PR_NUMBER: '12', PR_HEAD_SHA: id.headSha, PR_BASE_SHA: id.baseSha, PR_MERGE_SHA: id.mergeSha, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2' }), id)
  for (const bad of [{ repository: 'fork/lie' }, { prNumber: '../1' }, { runAttempt: '0' }, { mergeSha: 'not-a-commit' }]) assert.throws(() => validateIdentity({ ...id, ...bad }))
})

test('roundtrip preserves PR module and static bytes while rebuilding every deployment setting', async () => {
  const f = await fixture()
  const receipt = await pack(f.source, f.artifact, id)
  const result = await restore(f.artifact, f.target, id)
  assert.equal(result.files, receipt.files.length)
  assert.equal(result.worker.name, 'lie-pr-preview')
  assert.equal(result.worker.compatibilityDate, '2026-10-23')
  assert.deepEqual(result.worker.compatibilityFlags, ['enable_request_signal'])
  assert.deepEqual(result.worker.env.SHARED_GAMES, { type: 'r2', name: 'lie-shared-games-dev' })
  assert.deepEqual(result.worker.env.VOICE_DEVICE_ENVIRONMENT, { type: 'text', value: 'pr-12' })
  assert.deepEqual(result.worker.env.VOICE_TRANSPORT, { type: 'text', value: 'direct' })
  for (const field of ['domains', 'triggers', 'unsafe', 'exports', 'accountId']) assert.equal(result.worker[field], undefined)
  assert.equal(result.worker.env.EVIL, undefined)
  assert.deepEqual(JSON.parse(await readFile(join(f.target, 'v0/config.json'), 'utf8')), { buildContext: { mode: 'preview', isPreview: true } })
  for (const path of ['bundle/index.js', 'bundle/helper.wasm', 'bundle/.vite/manifest.json', 'assets/index.html', 'assets/.well-known/example']) {
    assert.deepEqual(await readFile(join(f.target, 'v0/workers/default', path)), await readFile(join(f.workerRoot, path)))
  }
  assert.deepEqual((await readdir(join(f.target, 'v0/workers'))), ['default'])
})

test('real packed receipt satisfies the GitHub authorization contract', async () => {
  const f = await fixture(), receipt = await pack(f.source, f.artifact, id)
  const repository = { id: 1, full_name: id.repository }
  const run = { id: 123, run_attempt: 2, workflow_id: 10, event: 'pull_request', status: 'completed', conclusion: 'success', head_sha: id.headSha, repository, head_repository: repository, actor: { login: 'maintainer' }, pull_requests: [{ number: id.prNumber }] }
  const pr = { number: id.prNumber, state: 'open', draft: false, mergeable: true, merge_commit_sha: id.mergeSha, base: { repo: repository, ref: 'main', sha: id.baseSha }, head: { repo: repository, sha: id.headSha }, user: { login: 'maintainer' } }
  const result = validatePreviewRun({
    event: { action: 'completed', repository, workflow_run: run }, run,
    workflow: { id: 10, path: '.github/workflows/pr-ci.yml', name: 'PR CI' }, pr,
    mainRef: { ref: 'refs/heads/main', object: { type: 'commit', sha: id.baseSha } },
    mergeCommit: { sha: id.mergeSha, tree: { sha: 'e'.repeat(40) }, parents: [{ sha: id.baseSha }, { sha: id.headSha }] }, receipt,
    artifacts: { total_count: 1, artifacts: [{ id: 200, name: artifactName(receipt), expired: false, digest: `sha256:${'d'.repeat(64)}`, workflow_run: { id: 123, repository_id: 1, head_repository_id: 1, head_sha: id.headSha } }] }
  })
  assert.equal(result.status, 'deploy')
  assert.equal(result.prNumber, 12)
})

test('Vite partial manifests infer only JavaScript and sourcemap module data', async () => {
  const f = await fixture()
  f.worker.manifest = { type: 'partial', mainModule: 'index.js', modules: { 'helper.wasm': { type: 'wasm' } } }
  await writeFile(join(f.workerRoot, 'worker.config.json'), JSON.stringify(f.worker))
  await writeFile(join(f.workerRoot, 'bundle/index.js.map'), '{}')
  await pack(f.source, f.artifact, id)
  const { worker } = await restore(f.artifact, f.target, id)
  assert.equal(worker.manifest.type, 'complete')
  assert.deepEqual(worker.manifest.modules, { 'index.js': { type: 'esm' }, 'index.js.map': { type: 'sourcemap' }, 'helper.wasm': { type: 'wasm' } })
})

for (const key of ['prNumber', 'headSha', 'baseSha', 'mergeSha', 'runId', 'runAttempt']) {
  test(`receipt rejects a different ${key}`, async () => {
    const f = await fixture()
    await pack(f.source, f.artifact, id)
    const wrong = key.endsWith('Sha') ? 'd'.repeat(40) : '999'
    await assert.rejects(() => restore(f.artifact, f.target, { ...id, [key]: wrong }), /identity mismatch/)
  })
}

test('changed bytes or inventory never reach restored output', async () => {
  const f = await fixture()
  await pack(f.source, f.artifact, id)
  await writeFile(join(f.artifact, 'bundle/v0/workers/default/assets/index.html'), 'tampered')
  await assert.rejects(() => restore(f.artifact, f.target, id), /inventory mismatch/)
  await assert.rejects(() => readdir(f.target), { code: 'ENOENT' })
})

for (const path of ['v0/workers/other/worker.config.json', 'v0/containers/example/config.json', 'package.json', 'v0/workers/default/assets/.env', 'v0/workers/default/bundle/.dev.vars']) {
  test(`refuses unexpected or private file ${path}`, async () => {
    const f = await fixture(), absolute = join(f.source, path)
    await mkdir(join(absolute, '..'), { recursive: true })
    await writeFile(absolute, 'untrusted file')
    await assert.rejects(() => pack(f.source, f.artifact, id))
  })
}

test('rejects artifact outer files even with a valid bundle receipt', async () => {
  const f = await fixture()
  await pack(f.source, f.artifact, id)
  await writeFile(join(f.artifact, 'cloudflare.config.ts'), 'throw new Error("never execute")')
  await assert.rejects(() => restore(f.artifact, f.target, id), /Unexpected preview artifact/)
})

test('refuses symlinks and oversized sparse files before reading their bytes', async () => {
  const f = await fixture()
  await symlink('/etc/passwd', join(f.workerRoot, 'assets/link'))
  await assert.rejects(() => pack(f.source, f.artifact, id), /symlink/)
  await rm(join(f.workerRoot, 'assets/link'))
  const huge = join(f.workerRoot, 'assets/huge')
  await writeFile(huge, '')
  await truncate(huge, 25 * 1024 * 1024 + 1)
  await assert.rejects(() => pack(f.source, f.artifact, id), /size or file limits/)
})

for (const change of [
  { mainModule: '../escape.js' },
  { modules: { 'index.js': { type: 'esm', unexpected: true } } },
  { modules: { 'index.js': { type: 'sourcemap' } } },
  { modules: { 'index.js': { type: 'esm' }, 'missing.js': { type: 'esm' } } }
]) {
  test(`rejects invalid manifest ${JSON.stringify(change)}`, async () => {
    const f = await fixture()
    f.worker.manifest = { ...f.worker.manifest, ...change }
    await writeFile(join(f.workerRoot, 'worker.config.json'), JSON.stringify(f.worker))
    await assert.rejects(() => pack(f.source, f.artifact, id))
  })
}

test('production build intent and destination mixing are both rejected', async () => {
  const f = await fixture()
  await writeFile(join(f.source, 'v0/config.json'), JSON.stringify({ buildContext: { mode: 'production', isPreview: false } }))
  await assert.rejects(() => pack(f.source, f.artifact, id), /Expected preview Build Output/)
  await writeFile(join(f.source, 'v0/config.json'), JSON.stringify({ buildContext: { mode: 'preview', isPreview: true } }))
  await pack(f.source, f.artifact, id)
  await mkdir(f.target)
  await assert.rejects(() => restore(f.artifact, f.target, id), { code: 'EEXIST' })
})
