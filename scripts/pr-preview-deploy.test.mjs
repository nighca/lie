import assert from 'node:assert/strict'
import { access, lstat, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'

import { convertToWranglerConfig, OutputRootConfigSchema, OutputWorkerSchema } from '@cloudflare/config'

import { pack } from './pr-preview-artifact.mjs'
import { deletePreview, deployPreview, initializePreviewParent, inspectPreview, PreviewOperationError, previewResult, verifyRuntimeDeployment } from './pr-preview-deploy.mjs'

const id = { repository: 'nighca/lie', prNumber: 12, headSha: 'a'.repeat(40), baseSha: 'b'.repeat(40), mergeSha: 'c'.repeat(40), runId: '123', runAttempt: '2' }
const result = { type: 'preview', version: 1, preview_id: 'preview-id', preview_name: 'pr-12', preview_slug: 'pr-12', preview_urls: ['https://pr-12-lie-pr-preview.example.workers.dev'], deployment_id: 'deployment-id', deployment_urls: ['https://deployment-id-lie-pr-preview.example.workers.dev'] }
const secrets = { LINX_API_KEY: 'fake-api-key', LINX_WS_TOKEN: 'fake-ws-token', LINX_AGENT_ID: 'fake-agent-id', VOICE_DEVICE_COOKIE_SECRET: 'fake-signing-key-32-bytes-or-longer' }
function metadata() {
  return { success: true, result: { id: result.deployment_id, preview_id: result.preview_id, env: {
    ASSETS: { type: 'assets' }, SHARED_GAMES: { type: 'r2_bucket', bucket_name: 'lie-shared-games-dev' },
    VOICE_MAX_SESSION_SECONDS: { type: 'plain_text', text: '600' }, VOICE_DEVICE_ENVIRONMENT: { type: 'plain_text', text: 'pr-12' },
    ...Object.fromEntries(Object.keys(secrets).map(name => [name, { type: 'secret_text' }]))
  } } }
}
const metadataRequest = async url => String(url).endsWith('/previews/pr-12') ? new Response(null, { status: 404 }) : Response.json(metadata())
const roots = []
after(async () => { for (const root of roots) await rm(root, { recursive: true, force: true }) })
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'lie-preview-deploy-test-'))
  roots.push(root)
  const source = join(root, 'source'), worker = join(source, 'v0/workers/default')
  await mkdir(join(worker, 'bundle'), { recursive: true })
  await mkdir(join(worker, 'assets'), { recursive: true })
  await writeFile(join(source, 'v0/config.json'), JSON.stringify({ buildContext: { mode: 'preview', isPreview: true } }))
  await writeFile(join(worker, 'worker.config.json'), JSON.stringify({ name: 'lie-game', manifest: { type: 'complete', mainModule: 'index.js', modules: { 'index.js': { type: 'esm' } } } }))
  await writeFile(join(worker, 'bundle/index.js'), `import { writeFileSync } from 'node:fs'; writeFileSync(${JSON.stringify(join(root, 'PR-CODE-EXECUTED'))}, 'failure'); throw new Error('must not run')`)
  await writeFile(join(worker, 'assets/index.html'), '<html>PR frontend</html>')
  const artifactDir = join(root, 'artifact')
  await pack(source, artifactDir, id)
  return { root, artifactDir, identity: id, cliPath: join(root, 'fake-cli.mjs'), accountId: '1'.repeat(32), apiToken: 'fake-deployment-token', runtimeSecrets: secrets }
}

test('deployment result returns only validated IDs and URLs', () => {
  assert.deepEqual(previewResult({ ...result, env: { SECRET: 'not-returned' } }, '12'), result)
  for (const bad of [
    { preview_name: 'pr-13' }, { preview_id: '../escape' },
    { preview_urls: ['http://pr-12-lie-pr-preview.example.workers.dev'] },
    { preview_urls: ['https://production.example.com'] },
    { preview_urls: ['https://pr-12-lie-game.example.workers.dev'] },
    { deployment_urls: ['https://hash.evil.workers.dev'] },
    { deployment_urls: ['https://hash.example.workers.dev/?token=secret'] }
  ]) assert.throws(() => previewResult({ ...result, ...bad }, '12'))
})

test('final upload receives only constrained configuration and the deployment token', async () => {
  const f = await fixture()
  let stage
  const actual = await deployPreview(f, async (executable, args, options) => {
    stage = options.cwd
    assert.equal(executable, process.execPath)
    if (args[1] === 'workers') {
      assert.deepEqual(args, [f.cliPath, 'workers', 'get', 'lie-pr-preview'])
      return { stdout: JSON.stringify({ name: 'lie-pr-preview', previews_base_config: {} }) }
    }
    assert.deepEqual(args, [f.cliPath, 'previews', 'deploy', 'pr-12', '--prebuilt', '--mode', 'preview', '--worker', 'lie-pr-preview'])
    assert.equal((await lstat(stage)).mode & 0o777, 0o700)
    assert.equal(options.env.CLOUDFLARE_API_TOKEN, f.apiToken)
    for (const name of [...Object.keys(secrets), 'GH_TOKEN', 'GITHUB_TOKEN', 'NODE_OPTIONS', 'HOME']) assert.equal(options.env[name], undefined)
    const path = join(stage, '.cloudflare/output/v0/workers/default/worker.config.json')
    assert.equal((await lstat(path)).mode & 0o777, 0o600)
    const worker = JSON.parse(await readFile(path, 'utf8'))
    OutputWorkerSchema.parse(worker)
    const converted = convertToWranglerConfig({ worker, containers: [] })
    assert.equal(converted.r2_buckets[0].bucket_name, 'lie-shared-games-dev')
    assert.deepEqual(converted.unsafe.bindings.find(binding => binding.name === 'LINX_API_KEY'), { type: 'secret_text', text: secrets.LINX_API_KEY, name: 'LINX_API_KEY' })
    assert.equal(worker.name, 'lie-pr-preview')
    for (const [name, text] of Object.entries(secrets)) assert.deepEqual(worker.env[name], { type: 'unsafe:secret_text', text })
    assert.deepEqual((await readdir(stage)).sort(), ['.cloudflare', 'config'])
    return { stdout: JSON.stringify({ ...result, secret: 'do-not-return' }), stderr: '' }
  }, async (url, init) => {
    if (url.endsWith('/previews/pr-12')) return metadataRequest(url)
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${f.accountId}/workers/workers/lie-pr-preview/previews/preview-id/deployments/deployment-id`)
    assert.equal(init.redirect, 'error')
    return metadataRequest(url)
  })
  assert.deepEqual(actual, result)
  await assert.rejects(() => access(stage), { code: 'ENOENT' })
  await assert.rejects(() => access(join(f.root, 'PR-CODE-EXECUTED')), { code: 'ENOENT' })
})

test('actual child process executes the trusted fake CLI and never executes the PR module', async () => {
  const f = await fixture()
  await writeFile(f.cliPath, `import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs';
    assert.equal(process.env.GH_TOKEN, undefined);
    assert.equal(process.env.LINX_API_KEY, undefined); assert.equal(process.env.NODE_OPTIONS, undefined);
    const c=JSON.parse(readFileSync('.cloudflare/output/v0/workers/default/worker.config.json','utf8'));
    assert.equal(c.env.SHARED_GAMES.name, 'lie-shared-games-dev');
    assert.equal(c.env.LINX_API_KEY.type, 'unsafe:secret_text');
    if(process.argv[2]==='workers') console.log(JSON.stringify({name:'lie-pr-preview',previews_base_config:{}}));
    else {assert.equal(process.argv[2], 'previews'); console.log(${JSON.stringify(JSON.stringify(result))});}`)
  assert.deepEqual(await deployPreview(f, undefined, metadataRequest), result)
  await assert.rejects(() => access(join(f.root, 'PR-CODE-EXECUTED')), { code: 'ENOENT' })
})

test('CLI failure details cannot leak secrets and the temporary output is removed', async () => {
  const f = await fixture()
  let stage
  await assert.rejects(() => deployPreview(f, async (_executable, _args, options) => {
    stage = options.cwd
    throw Error(`CLI stderr containing ${secrets.LINX_API_KEY} and ${f.apiToken}`)
  }), error => !error.message.includes(secrets.LINX_API_KEY) && !error.message.includes(f.apiToken))
  await assert.rejects(() => access(stage), { code: 'ENOENT' })
})

test('inherited base settings stop before upload and are never silently removed', async () => {
  const f = await fixture()
  for (const base of [{ env: { PRODUCTION: { type: 'service', service: 'lie-game' } } }, { env: {} }, [], 'malformed']) {
    let calls = 0
    await assert.rejects(() => deployPreview(f, async () => {
      calls++
      return { stdout: JSON.stringify({ name: 'lie-pr-preview', previews_base_config: base }) }
    }, metadataRequest))
    assert.equal(calls, 1)
  }
})

test('post-upload inherited secrets, wrong storage, missing fields and failed metadata requests reject success', async () => {
  const f = await fixture()
  for (const mutate of [
    value => { value.result.env.OLD_SECRET = { type: 'secret_text' } },
    value => { value.result.env.SHARED_GAMES.bucket_name = 'lie-shared-games' },
    value => { delete value.result.env.VOICE_DEVICE_ENVIRONMENT },
    value => { value.result.env.LINX_API_KEY.type = 'inherit' },
    value => { value.result.id = 'old-deployment' },
    value => { value.result.preview_id = 'other-preview' },
    value => { value.result.env.VOICE_DEVICE_ENVIRONMENT.text = 'production' }
  ]) {
    const value = metadata()
    mutate(value)
    assert.throws(() => verifyRuntimeDeployment(value, result))
    let uploaded = false
    await assert.rejects(() => deployPreview(f, async (_executable, args) => {
      if (args[1] !== 'workers') uploaded = true
      return { stdout: JSON.stringify(args[1] === 'workers' ? { name: 'lie-pr-preview', previews_base_config: {} } : result) }
    }, async url => url.endsWith('/previews/pr-12') ? new Response(null, { status: 404 }) : Response.json(value)))
    assert.equal(uploaded, true)
  }
  await assert.rejects(() => deployPreview(f, async (_executable, args) => ({ stdout: JSON.stringify(args[1] === 'workers' ? { name: 'lie-pr-preview' } : result) }), async () => new Response(null, { status: 403 })))
})

test('old inherited secret or production binding is rejected before uploading PR code', async () => {
  const f = await fixture()
  for (const mutate of [
    value => { value.result.env.OLD_SECRET = { type: 'secret_text' } },
    value => { value.result.env.SHARED_GAMES.bucket_name = 'lie-shared-games' },
    value => { delete value.result.env.LINX_API_KEY }
  ]) {
    const previous = metadata()
    mutate(previous)
    let uploads = 0
    await assert.rejects(() => deployPreview(f, async (_executable, args) => {
      if (args[1] === 'previews') uploads++
      return { stdout: JSON.stringify({ name: 'lie-pr-preview', previews_base_config: {} }) }
    }, async url => Response.json(url.endsWith('/previews/pr-12') ? { name: 'pr-12', id: 'preview-id' } : previous)))
    assert.equal(uploads, 0)
  }
})

test('existing verified preview bindings allow replacement without inheriting extra names', async () => {
  const f = await fixture()
  let uploads = 0
  const value = await deployPreview(f, async (_executable, args) => {
    if (args[1] === 'previews') uploads++
    return { stdout: JSON.stringify(args[1] === 'workers' ? { name: 'lie-pr-preview' } : result) }
  }, async url => Response.json(url.endsWith('/previews/pr-12') ? { name: 'pr-12', id: 'preview-id' } : metadata()))
  assert.deepEqual(value, result)
  assert.equal(uploads, 1)
})

test('initialization does not overwrite an existing dedicated parent', async () => {
  const f = await fixture()
  let calls = 0, stage
  const value = await initializePreviewParent(f, async (_executable, args, options) => {
    stage = options.cwd
    calls++
    assert.deepEqual(args, [f.cliPath, 'workers', 'get', 'lie-pr-preview'])
    return { stdout: JSON.stringify({ name: 'lie-pr-preview', previews_base_config: {} }) }
  })
  assert.deepEqual(value, { initialized: true, existing: true, workerName: 'lie-pr-preview' })
  assert.equal(calls, 1)
  await assert.rejects(() => access(stage), { code: 'ENOENT' })
})

test('initialization deploys only an inert unbound parent after confirmed absence', async () => {
  const f = await fixture()
  let calls = 0, stage
  const value = await initializePreviewParent(f, async (executable, args, options) => {
    stage = options.cwd
    calls++
    assert.equal(executable, process.execPath)
    assert.equal(options.env.LINX_API_KEY, undefined)
    if (calls === 1) throw Error('CLI lookup failed')
    if (calls === 2) {
      assert.deepEqual(args, [f.cliPath, 'deploy', '--prebuilt', '--mode', 'production', '--worker', 'lie-pr-preview', '--provision=false'])
      const root = join(stage, '.cloudflare/output/v0')
      const config = JSON.parse(await readFile(join(root, 'config.json'), 'utf8'))
      assert.deepEqual(OutputRootConfigSchema.parse(config), { buildContext: { mode: 'production', isPreview: false } })
      const worker = JSON.parse(await readFile(join(root, 'workers/default/worker.config.json'), 'utf8'))
      OutputWorkerSchema.parse(worker)
      const converted = convertToWranglerConfig({ worker, containers: [] })
      assert.equal(converted.workers_dev, false)
      assert.equal(converted.preview_urls, true)
      assert.equal(worker.name, 'lie-pr-preview')
      assert.equal(worker.workersDev, false)
      assert.equal(worker.previewUrls, true)
      for (const field of ['env', 'assets', 'domains', 'triggers']) assert.equal(worker[field], undefined)
      assert.match(await readFile(join(root, 'workers/default/bundle/index.js'), 'utf8'), /status: 404/)
      return { stdout: '{}' }
    }
    assert.deepEqual(args, [f.cliPath, 'workers', 'get', 'lie-pr-preview'])
    return { stdout: JSON.stringify({ name: 'lie-pr-preview', previews_base_config: {} }) }
  }, async url => {
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${f.accountId}/workers/workers/lie-pr-preview`)
    return new Response(null, { status: 404 })
  })
  assert.deepEqual(value, { initialized: true, existing: false, workerName: 'lie-pr-preview' })
  assert.equal(calls, 3)
  await assert.rejects(() => access(stage), { code: 'ENOENT' })
})

test('initialization auth failure, unknown responses or nonempty base never authorize creation', async () => {
  const f = await fixture()
  for (const response of [() => new Response(null, { status: 403 }), () => new Response('null', { status: 200 }), () => Response.json({ name: 'lie-pr-preview', previews_base_config: { env: { PRODUCTION: {} } } })]) {
    let calls = 0
    await assert.rejects(() => initializePreviewParent(f, async () => { calls++; throw Error('unknown failure') }, async () => response()))
    assert.equal(calls, 1)
  }
})

test('initialization must read back an empty base after creating its inert parent', async () => {
  const f = await fixture()
  let calls = 0
  await assert.rejects(() => initializePreviewParent(f, async () => {
    calls++
    if (calls === 1) throw Error('missing')
    if (calls === 2) return { stdout: '{}' }
    return { stdout: JSON.stringify({ name: 'lie-pr-preview', previews_base_config: { env: { UNKNOWN: {} } } }) }
  }, async () => new Response(null, { status: 404 })))
  assert.equal(calls, 3)
})

test('missing runtime credentials or invalid identity stop before starting the CLI', async () => {
  const f = await fixture()
  let calls = 0
  const run = async () => { calls++; return { stdout: JSON.stringify(result) } }
  for (const bad of [
    { runtimeSecrets: { ...secrets, VOICE_DEVICE_COOKIE_SECRET: 'short' } },
    { runtimeSecrets: { ...secrets, LINX_API_KEY: '' } },
    { runtimeSecrets: { ...secrets, EXTRA: 'not-allowed' } },
    { accountId: 'invalid' }, { cliPath: './PR-controlled-cli' },
    { identity: { ...id, repository: 'fork/lie' } }
  ]) await assert.rejects(() => deployPreview({ ...f, ...bad }, run))
  assert.equal(calls, 0)
})

test('tampered artifact stops before deployment and cannot supply its own configuration script', async () => {
  const f = await fixture()
  await writeFile(join(f.artifactDir, 'package.json'), '{"scripts":{"build":"malicious"}}')
  let called = false
  await assert.rejects(() => deployPreview(f, async () => { called = true; return { stdout: JSON.stringify(result) } }))
  assert.equal(called, false)
})

test('deletion uses the fixed CLI target and confirms that exact Preview is absent', async () => {
  const f = await fixture()
  let stage
  const value = await deletePreview({ ...f, prNumber: 12 }, async (executable, args, options) => {
    stage = options.cwd
    assert.equal(executable, process.execPath)
    assert.deepEqual(args, [f.cliPath, 'previews', 'delete', 'pr-12', '--worker', 'lie-pr-preview', '--force'])
    assert.equal(options.env.LINX_API_KEY, undefined)
    assert.deepEqual(await readdir(stage), ['config'])
    return { stdout: 'Deleted', stderr: '' }
  }, async (url, init) => {
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${f.accountId}/workers/workers/lie-pr-preview/previews/pr-12`)
    assert.equal(init.headers.Authorization, `Bearer ${f.apiToken}`)
    assert.equal(init.redirect, 'error')
    return new Response(null, { status: 404 })
  })
  assert.deepEqual(value, { deleted: true, previewName: 'pr-12' })
  await assert.rejects(() => access(stage), { code: 'ENOENT' })
})

test('Aborted or exit zero never proves deletion when the Preview remains or API is forbidden', async () => {
  const f = await fixture()
  for (const status of [200, 403, 500]) {
    let stage
    await assert.rejects(() => deletePreview({ ...f, prNumber: 12 }, async (_executable, _args, options) => {
      stage = options.cwd
      return { stdout: 'Aborted.', stderr: '' }
    }, async () => new Response(null, { status })), /stage=delete-confirm-absence/)
    await assert.rejects(() => access(stage), { code: 'ENOENT' })
  }
})

test('already absent Preview is idempotent but invalid deletion targets never invoke cloud tools', async () => {
  const f = await fixture()
  assert.deepEqual(await deletePreview({ ...f, prNumber: 12 }, async () => { throw Error('already missing') }, async () => new Response(null, { status: 404 })), { deleted: true, previewName: 'pr-12' })
  let calls = 0
  for (const prNumber of ['../other', '0', '12/production', '9007199254740992']) await assert.rejects(() => deletePreview({ ...f, prNumber }, async () => { calls++ }, async () => { calls++ }))
  assert.equal(calls, 0)
})

test('inspect is read-only and exposes only known binding types and match booleans', async () => {
  const f = await fixture(), calls = []
  const value = metadata()
  value.result.env.LINX_API_KEY.text = 'sensitive-value'
  value.result.env['sensitive-key-name'] = { type: 'sensitive-type' }
  value.result['sensitive-field-name'] = 'sensitive-value'
  const summary = await inspectPreview({ ...f, prNumber: 12 }, async (_node, args) => {
    assert.deepEqual(args, [f.cliPath, 'workers', 'get', 'lie-pr-preview'])
    return { stdout: JSON.stringify({ name: 'lie-pr-preview', previews_base_config: {} }) }
  }, async (url, init) => {
    calls.push(url)
    assert.equal(init.method, undefined)
    return Response.json(url.endsWith('/previews/pr-12') ? { name: 'pr-12', id: 'preview-id' } : value)
  })
  assert.equal(calls.length, 2)
  assert.equal(summary.envCount, 9)
  assert.equal(summary.unknownEnvCount, 1)
  assert.equal(summary.r2DevMatch, true)
  assert.equal(summary.secretTypeMatch, true)
  assert.equal(JSON.stringify(summary).includes('sensitive'), false)
})

test('inspect reports absent previews and denies invalid targets, forbidden metadata or mismatched identities', async () => {
  const f = await fixture(), run = async () => ({ stdout: JSON.stringify({ name: 'lie-pr-preview' }) })
  assert.equal((await inspectPreview({ ...f, prNumber: 12 }, run, async () => new Response(null, { status: 404 }))).previewExists, false)
  await assert.rejects(() => inspectPreview({ ...f, prNumber: '../production' }, run), /stage=inspect-input/)
  await assert.rejects(() => inspectPreview({ ...f, prNumber: 12 }, run, async () => new Response(null, { status: 403 })), /stage=inspect-preview http=403/)
  assert.equal((await inspectPreview({ ...f, prNumber: 12 }, run, async () => Response.json({ name: 'pr-13', id: 'other' }))).previewNameMatch, false)
})

test('safe operation errors distinguish upload, result validation and metadata failures without raw diagnostics', async () => {
  const f = await fixture()
  const parent = { stdout: JSON.stringify({ name: 'lie-pr-preview' }) }
  await assert.rejects(() => deployPreview(f, async (_node, args) => {
    if (args[1] === 'workers') return parent
    throw Object.assign(Error('secret stderr'), { code: 7, stderr: secrets.LINX_API_KEY })
  }, metadataRequest), error => error instanceof PreviewOperationError && error.stage === 'upload' && error.exitCode === 7 && !error.message.includes('secret'))
  await assert.rejects(() => deployPreview(f, async (_node, args) => args[1] === 'workers' ? parent : { stdout: 'secret invalid JSON' }, metadataRequest), /stage=result-validate/)
  await assert.rejects(() => deployPreview(f, async (_node, args) => args[1] === 'workers' ? parent : { stdout: JSON.stringify(result) }, async url => url.endsWith('/previews/pr-12') ? new Response(null, { status: 404 }) : new Response(null, { status: 403 })), /stage=post-metadata http=403/)
})

test('inspection projects only explicitly supplied public URLs matching the Preview and deployment identities', async () => {
  const f = await fixture(), value = metadata()
  value.result.id = '12345678-deployment'
  value.result.deployment_urls = { public: 'https://12345678-lie-pr-preview.example.workers.dev', full: 'https://12345678-deployment-lie-pr-preview.example.workers.dev' }
  value.result.urls = ['https://12345678-lie-game.example.workers.dev', 'https://user:password@12345678-lie-pr-preview.example.workers.dev', 'https://12345678-lie-pr-preview.example.workers.dev/?token=secret', 'https://12345678-lie-pr-preview.example.workers.dev/#secret']
  value.result.env.LINX_API_KEY.text = 'https://12345678-lie-pr-preview.secret.workers.dev'
  const summary = await inspectPreview({ ...f, prNumber: 12 }, async () => ({ stdout: JSON.stringify({ name: 'lie-pr-preview' }) }), async url => Response.json(url.endsWith('/previews/pr-12') ? {
    name: 'pr-12', id: 'preview-id', urls: ['https://pr-12-lie-pr-preview.example.workers.dev', 'https://pr-13-lie-pr-preview.example.workers.dev'], preview_urls: { other: 'http://pr-12-lie-pr-preview.example.workers.dev' }
  } : value))
  assert.deepEqual(summary.previewURLs, ['https://pr-12-lie-pr-preview.example.workers.dev'])
  assert.deepEqual(summary.deploymentURLs, ['https://12345678-lie-pr-preview.example.workers.dev', 'https://12345678-deployment-lie-pr-preview.example.workers.dev'])
  assert.equal(summary.previewURLCandidateCount, 3)
  assert.equal(summary.deploymentURLCandidateCount, 6)
  assert.equal(JSON.stringify(summary).includes('password'), false)
  assert.equal(JSON.stringify(summary).includes('secret.workers.dev'), false)
})

test('inspection reports missing or mismatched latest identity as safe shape diagnostics', async () => {
  const f = await fixture()
  for (const deployment of [
    { env: {} },
    { id: { secret: 'sensitive-value' }, preview_id: 123, env: [] },
    { id: 'deployment-id', preview_id: 'another-preview', env: metadata().result.env }
  ]) {
    const summary = await inspectPreview({ ...f, prNumber: 12 }, async () => ({ stdout: JSON.stringify({ name: 'lie-pr-preview' }) }), async url => Response.json(url.endsWith('/previews/pr-12') ? { name: 'pr-12', id: 'preview-id' } : deployment))
    assert.equal(summary.metadataHTTPcode, 200)
    assert.equal(summary.previewIDMatch, false)
    assert.equal(summary.deploymentIDPresent, Object.hasOwn(deployment, 'id'))
    assert.deepEqual(summary.deploymentURLs, [])
    assert.equal(JSON.stringify(summary).includes('sensitive-value'), false)
    assert.throws(() => verifyRuntimeDeployment(deployment, result))
  }
})

test('inspect reports parent and Preview shape mismatches without following an invalid resource ID', async () => {
  const f = await fixture()
  for (const parent of [{ id: 'parent-id' }, { name: { secret: 'sensitive-value' } }, { name: 'wrong-parent' }]) {
    const summary = await inspectPreview({ ...f, prNumber: 12 }, async () => ({ stdout: JSON.stringify(parent) }), async () => { throw Error('must not follow') })
    assert.equal(summary.parentNameMatch, false)
    assert.equal(JSON.stringify(summary).includes('sensitive-value'), false)
  }
  for (const preview of [{ name: 'pr-12' }, { name: 'pr-12', id: '../production' }, { id: 'preview-id' }]) {
    let requests = 0
    const summary = await inspectPreview({ ...f, prNumber: 12 }, async () => ({ stdout: JSON.stringify({ name: 'lie-pr-preview' }) }), async url => {
      requests++
      assert.equal(url.endsWith('/previews/pr-12'), true)
      return Response.json(preview)
    })
    assert.equal(summary.previewExists, true)
    assert.equal(requests, 1)
    assert.deepEqual(summary.deploymentURLs, [])
  }
  await assert.rejects(() => inspectPreview({ ...f, prNumber: 12 }, async () => ({ stdout: 'invalid JSON' })), /stage=inspect-parent/)
})

test('diagnostic URL projection can use a missing preview_id only from the fixed verified latest endpoint', async () => {
  const f = await fixture()
  for (const previewId of [undefined, 'wrong-preview']) {
    const deployment = { id: '12345678-deployment', urls: ['https://12345678-lie-pr-preview.example.workers.dev', 'https://12345678-lie-game.example.workers.dev'] }
    if (previewId != null) deployment.preview_id = previewId
    const summary = await inspectPreview({ ...f, prNumber: 12 }, async () => ({ stdout: JSON.stringify({ name: 'lie-pr-preview' }) }), async url => {
      if (url.endsWith('/previews/pr-12')) return Response.json({ name: 'pr-12', id: 'preview-id' })
      assert.equal(url.endsWith('/previews/preview-id/deployments/latest'), true)
      return Response.json(deployment)
    })
    assert.deepEqual(summary.deploymentURLs, previewId == null ? ['https://12345678-lie-pr-preview.example.workers.dev'] : [])
    assert.equal(summary.deploymentURLCandidateCount, previewId == null ? 2 : 0)
    assert.throws(() => verifyRuntimeDeployment(deployment, result))
  }
})

test('native deployment UUID short URLs and metadata without preview_id retain all identity and binding checks', () => {
  const deploymentId = '063049c3-82d7-4aed-a9b6-2d490a1d84b3'
  const actual = { ...result, deployment_id: deploymentId, deployment_urls: ['https://063049c3-lie-pr-preview.example.workers.dev'] }
  assert.deepEqual(previewResult(actual, 12), actual)
  assert.doesNotThrow(() => previewResult({ ...actual, deployment_urls: [`https://${deploymentId}-lie-pr-preview.example.workers.dev`] }, 12))
  assert.throws(() => previewResult({ ...result, deployment_urls: ['https://deployme-lie-pr-preview.example.workers.dev'] }, 12))
  for (const host of ['063049c4-lie-pr-preview.example.workers.dev', '063049c3-lie-game.example.workers.dev', '063049c3-lie-pr-preview.foreign.workers.dev']) assert.throws(() => previewResult({ ...actual, deployment_urls: [`https://${host}`] }, 12))
  const value = metadata()
  value.result.id = deploymentId
  delete value.result.preview_id
  assert.doesNotThrow(() => verifyRuntimeDeployment(value, actual))
  for (const mutate of [v => { v.result.id = 'wrong-id' }, v => { v.result.preview_id = 'other-preview' }, v => { v.result.preview_id = null }, v => { v.result.preview_id = undefined }, v => { v.result.env.EXTRA = { type: 'secret_text' } }]) {
    const bad = structuredClone(value)
    mutate(bad)
    assert.throws(() => verifyRuntimeDeployment(bad, actual))
  }
})

test('both existing-latest preflight and exact-new postflight accept the observed native metadata shape', async () => {
  const f = await fixture(), deploymentId = '063049c3-82d7-4aed-a9b6-2d490a1d84b3'
  const uploaded = { ...result, deployment_id: deploymentId, deployment_urls: ['https://063049c3-lie-pr-preview.example.workers.dev'] }
  const requests = []
  assert.deepEqual(await deployPreview(f, async (_node, args) => ({ stdout: JSON.stringify(args[1] === 'workers' ? { name: 'lie-pr-preview' } : uploaded) }), async url => {
    requests.push(url)
    if (url.endsWith('/previews/pr-12')) return Response.json({ name: 'pr-12', id: 'preview-id' })
    const value = metadata()
    delete value.result.preview_id
    if (!url.endsWith('/deployments/latest')) value.result.id = deploymentId
    return Response.json(value)
  }), uploaded)
  assert.equal(requests[1].endsWith('/previews/preview-id/deployments/latest'), true)
  assert.equal(requests[2].endsWith(`/previews/preview-id/deployments/${deploymentId}`), true)
})
