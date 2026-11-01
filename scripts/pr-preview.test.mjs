import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { artifactName } from './pr-preview-github.mjs'
import { authorize, cleanupAuthorize, cleanupReport, fail, githubClient, main, notice, outputs, pending, prepare, previewURLs, probe, publish } from './pr-preview.mjs'

const headSha = 'a'.repeat(40), baseSha = 'b'.repeat(40), mergeSha = 'c'.repeat(40)
const repo = { id: 1, full_name: 'nighca/lie' }

function fixture({ fork = false, dispatch = false } = {}) {
  const headRepository = fork ? { id: 2, full_name: 'contributor/lie' } : { ...repo }
  const run = { id: 100, run_attempt: 2, workflow_id: 10, event: 'pull_request', status: 'completed', conclusion: 'success', head_sha: headSha,
    repository: { ...repo }, head_repository: headRepository, actor: { login: 'contributor' }, pull_requests: fork ? [] : [{ number: 42 }] }
  const receipt = { version: 1, repository: repo.full_name, prNumber: 42, headSha, baseSha, mergeSha, runId: '100', runAttempt: '2' }
  const state = {
    event: dispatch ? { repository: { ...repo }, ref: 'refs/heads/main', inputs: { pr_number: '42', head_sha: headSha } }
      : { repository: { ...repo }, action: 'completed', workflow_run: structuredClone(run) },
    run, receipt, workflow: { id: 10, name: 'PR CI', path: '.github/workflows/pr-ci.yml' },
    pr: { number: 42, state: 'open', draft: false, mergeable: true, merge_commit_sha: mergeSha,
      base: { repo: { ...repo }, ref: 'main', sha: baseSha }, head: { repo: headRepository, sha: headSha }, user: { login: 'contributor' } },
    mergeCommit: { sha: mergeSha, parents: [{ sha: baseSha }, { sha: headSha }] },
    artifacts: { total_count: 1, artifacts: [{ id: 200, name: artifactName(receipt), expired: false, digest: `sha256:${'d'.repeat(64)}`,
      workflow_run: { id: 100, repository_id: 1, head_repository_id: headRepository.id, head_sha: headSha } }] },
    runs: [structuredClone(run)], deployments: [], deploymentStatuses: {}, reads: [], writes: []
  }
  state.api = async (path, body = null) => {
    if (body != null) {
      state.writes.push({ path, body: structuredClone(body) })
      return path === 'deployments' ? { id: 300 } : { id: 400 }
    }
    state.reads.push(path)
    if (path === 'actions/workflows/pr-ci.yml') return structuredClone(state.workflow)
    if (path === 'pulls/42') return structuredClone(state.pr)
    if (path === 'actions/runs/100') return structuredClone(state.run)
    if (path === 'actions/runs/100/artifacts?per_page=100') return structuredClone(state.artifacts)
    if (path === `git/commits/${state.pr.merge_commit_sha}`) return structuredClone(state.mergeCommit)
    const latestStatus = /^deployments\/([1-9][0-9]*)\/statuses\?per_page=1$/.exec(path)
    if (latestStatus != null) return structuredClone(state.deploymentStatuses[latestStatus[1]] ?? [])
    if (path.startsWith('actions/workflows/10/runs?')) return { workflow_runs: structuredClone(state.runs) }
    if (path.startsWith('deployments?')) return structuredClone(state.deployments)
    throw new Error(`Unexpected test API path: ${path}`)
  }
  return state
}

test('automatic publisher discovers a canonical artifact and independently selects the current PR', async () => {
  const f = fixture()
  const context = await prepare(f.event, f.api)
  assert.equal(context.action, 'deploy')
  assert.equal(context.artifactId, '200')
  assert.equal(context.identity.mergeSha, mergeSha)
  assert.deepEqual(f.writes, [])
  assert.ok(f.reads.includes(`git/commits/${mergeSha}`))
})

test('fork run with omitted PR association waits for approval; manual current SHA permits it', async () => {
  const f = fixture({ fork: true })
  assert.equal((await prepare(f.event, f.api)).status, 'awaiting-approval')
  const manual = fixture({ fork: true, dispatch: true })
  const context = await prepare(manual.event, manual.api)
  assert.equal(context.action, 'deploy')
  assert.equal(context.approvalHeadSha, headSha)
})

test('manual approval of an old head does not discover or download a run', async () => {
  const f = fixture({ dispatch: true })
  f.event.inputs.head_sha = 'e'.repeat(40)
  assert.equal((await prepare(f.event, f.api)).status, 'stale')
  assert.equal(f.reads.some(path => path.startsWith('actions/runs/')), false)
})

test('manual approval cannot select a branch or arbitrary run ID', async () => {
  const f = fixture({ dispatch: true })
  f.event.ref = 'refs/heads/feature'
  await assert.rejects(prepare(f.event, f.api), /requires main/)
  f.event.ref = 'refs/heads/main'
  f.event.inputs = { run_id: '100', head_sha: headSha }
  await assert.rejects(prepare(f.event, f.api), /PR number/)
})

test('manual path relies on the native workflow entry without querying collaborator permissions', async () => {
  const f = fixture({ fork: true, dispatch: true })
  const context = await prepare(f.event, f.api)
  assert.equal((await authorize(context, f.receipt, f.api)).status, 'deploy')
  const started = await pending(context, f.receipt, f.api)
  assert.equal((await publish(started, f.receipt, deployedPreview(), f.api)).status, 'success')
  assert.equal(f.reads.some(path => path.startsWith('collaborators/')), false)
})

test('workflow inputs cannot substitute another head or select any actor permission mechanism', async () => {
  const f = fixture({ fork: true, dispatch: true })
  f.event.inputs.actor = 'made-up-user'
  f.event.inputs.permission = 'admin'
  const context = await prepare(f.event, f.api)
  assert.equal(context.action, 'deploy')
  assert.equal(f.reads.some(path => path.startsWith('collaborators/')), false)
  f.event.inputs.head_sha = 'e'.repeat(40)
  assert.equal((await prepare(f.event, f.api)).status, 'stale')
})

for (const [name, mutate] of [
  ['other workflow', f => { f.workflow.path = '.github/workflows/evil.yml' }],
  ['wrong run attempt', f => { f.run.run_attempt = 3 }],
  ['failed CI', f => { f.run.conclusion = 'failure' }],
  ['wrong repository', f => { f.run.repository.id = 99 }],
  ['ambiguous build', f => { f.artifacts.artifacts.push(structuredClone(f.artifacts.artifacts[0])); f.artifacts.total_count++ }],
  ['truncated artifact list', f => { f.artifacts.total_count++ }],
  ['invalid artifact digest', f => { f.artifacts.artifacts[0].digest = 'bad' }]
]) test(`prepare refuses ${name}`, async () => {
  const f = fixture()
  mutate(f)
  await assert.rejects(prepare(f.event, f.api))
  assert.deepEqual(f.writes, [])
})

test('old merge artifact is skipped when base changes', async () => {
  const f = fixture()
  f.pr.merge_commit_sha = 'e'.repeat(40)
  assert.equal((await prepare(f.event, f.api)).status, 'stale')
})

test('draft never starts publishing', async () => {
  const f = fixture()
  f.pr.draft = true
  assert.equal((await prepare(f.event, f.api)).status, 'skipped')
})

test('manual discovery rejects the newest current-head run when it failed rather than using older success', async () => {
  const f = fixture({ dispatch: true })
  f.run.conclusion = 'failure'
  await assert.rejects(prepare(f.event, f.api), /did not complete/)
})

test('manual discovery fails closed after a bounded scan', async () => {
  const f = fixture({ dispatch: true })
  f.runs = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, head_sha: 'e'.repeat(40) }))
  await assert.rejects(prepare(f.event, f.api), /rerun PR CI/)
  assert.equal(f.reads.filter(path => path.startsWith('actions/workflows/10/runs?')).length, 3)
})

test('downloaded receipt must match independent API and the selected artifact', async () => {
  const f = fixture()
  const context = await prepare(f.event, f.api)
  assert.equal((await authorize(context, f.receipt, f.api)).status, 'deploy')
  await assert.rejects(authorize(context, { ...f.receipt, runId: '101' }, f.api), /run or attempt/)
  f.artifacts.artifacts[0].id = 201
  await assert.rejects(authorize(context, f.receipt, f.api), /artifact changed/)
})

test('pending creates non-production deployment bound to head, while describing the tested merge', async () => {
  const f = fixture()
  const context = await pending(await prepare(f.event, f.api), f.receipt, f.api)
  assert.equal(context.deploymentId, '300')
  const deployment = f.writes.find(item => item.path === 'deployments').body
  assert.equal(deployment.ref, headSha)
  assert.equal(deployment.production_environment, false)
  assert.equal(deployment.transient_environment, true)
  assert.equal(deployment.payload.mergeSha, mergeSha)
  assert.equal(f.writes.at(-1).path, `statuses/${headSha}`)
})

test('pending rechecks and refuses a PR that closed before starting deployment', async () => {
  const f = fixture()
  const context = await prepare(f.event, f.api)
  f.pr.state = 'closed'
  assert.equal((await pending(context, f.receipt, f.api)).status, 'closed')
  assert.deepEqual(f.writes, [])
})

test('current deployment publishes only a Cloudflare URL and records UI+Worker merge identity', async () => {
  const f = fixture()
  const context = await pending(await prepare(f.event, f.api), f.receipt, f.api)
  const result = await publish(context, f.receipt, { preview_urls: ['https://pr-42-lie-pr-preview.account.workers.dev/'], deployment_urls: [] }, f.api)
  assert.equal(result.status, 'success')
  assert.equal(f.writes.at(-1).body.state, 'success')
  assert.match(f.writes.at(-1).body.description, /UI and Worker/)
  assert.equal(f.writes.at(-1).body.target_url, result.url)
})

test('PR updated during upload only inactivates this run and never updates head status or deletes a preview', async () => {
  const f = fixture()
  const context = await pending(await prepare(f.event, f.api), f.receipt, f.api)
  f.writes.length = 0
  f.pr.head.sha = 'e'.repeat(40)
  const result = await publish(context, f.receipt, { preview_urls: ['https://pr-42.account.workers.dev/'] }, f.api)
  assert.equal(result.status, 'stale')
  assert.deepEqual(f.writes.map(item => [item.path, item.body.state]), [['deployments/300/statuses', 'inactive']])
})

test('new CI attempt after upload never receives a success status', async () => {
  const f = fixture()
  const context = await pending(await prepare(f.event, f.api), f.receipt, f.api)
  f.writes.length = 0
  f.run.run_attempt++
  const result = await publish(context, f.receipt, { preview_urls: ['https://pr-42.account.workers.dev/'] }, f.api)
  assert.equal(result.status, 'stale')
  assert.deepEqual(f.writes.map(item => item.body.state), ['inactive'])
})

test('failure status explicitly distinguishes an existing older preview', async () => {
  const f = fixture()
  const context = await pending(await prepare(f.event, f.api), f.receipt, f.api)
  f.writes.length = 0
  assert.equal((await fail(context, f.receipt, f.api)).status, 'failure')
  assert.match(f.writes.at(-1).body.description, /older build/)
  f.writes.length = 0
  f.pr.head.sha = 'e'.repeat(40)
  await fail(context, f.receipt, f.api)
  assert.equal(f.writes.some(item => item.path.startsWith('statuses/')), false)
})

test('waiting notice rereads API identities and links only the trusted approval workflow', async () => {
  const f = fixture({ fork: true })
  const context = await prepare(f.event, f.api)
  assert.equal((await notice(context, f.api)).status, 'awaiting-approval')
  assert.equal(f.writes.length, 1)
  assert.equal(f.writes[0].path, `statuses/${headSha}`)
  assert.equal(f.writes[0].body.state, 'pending')
  assert.equal(f.writes[0].body.target_url, 'https://github.com/nighca/lie/actions/workflows/pr-preview.yml')
})

test('waiting notice never writes an old head or a draft/closed status', async () => {
  for (const mutate of [f => { f.pr.head.sha = 'e'.repeat(40) }, f => { f.pr.state = 'closed' }, f => { f.pr.draft = true }]) {
    const f = fixture({ fork: true })
    const context = await prepare(f.event, f.api)
    mutate(f)
    assert.equal((await notice(context, f.api)).status, 'stale')
    assert.deepEqual(f.writes, [])
  }
  const f = fixture()
  assert.equal((await notice({ action: 'skip', status: 'stale' }, f.api)).status, 'skipped')
  assert.deepEqual(f.reads, [])
})

for (const state of ['pending', 'in_progress', 'success']) test(`late automatic notice preserves a manually approved ${state} deployment`, async () => {
  const f = fixture({ fork: true })
  const context = await prepare(f.event, f.api)
  f.deployments = [{ id: 300, sha: headSha, payload: { preview: 'lie-pr-preview', pr_number: 42, ...f.receipt } }]
  f.deploymentStatuses[300] = [{ state }]
  assert.equal((await notice(context, f.api)).status, 'already-approved')
  assert.deepEqual(f.writes, [])
})

for (const [name, mutate] of [
  ['another project', f => { f.deployments[0].payload.preview = 'another-project' }],
  ['another PR', f => { f.deployments[0].payload.pr_number = 43 }],
  ['an older head', f => { f.deployments[0].sha = f.deployments[0].payload.headSha = 'e'.repeat(40) }],
  ['an older base', f => { f.deployments[0].payload.baseSha = 'e'.repeat(40) }],
  ['an older merge', f => { f.deployments[0].payload.mergeSha = 'e'.repeat(40) }],
  ['a failed deployment', f => { f.deploymentStatuses[300] = [{ state: 'failure' }] }],
  ['a deployment with no status', f => { f.deploymentStatuses[300] = [] }]
]) test(`approval notice is not blocked by ${name}`, async () => {
  const f = fixture({ fork: true })
  const context = await prepare(f.event, f.api)
  f.deployments = [{ id: 300, sha: headSha, payload: { preview: 'lie-pr-preview', pr_number: 42, ...f.receipt } }]
  f.deploymentStatuses[300] = [{ state: 'success' }]
  mutate(f)
  assert.equal((await notice(context, f.api)).status, 'awaiting-approval')
  assert.equal(f.writes.length, 1)
  assert.equal(f.writes[0].body.state, 'pending')
})

for (const [name, changed] of [['another run', { runId: '101' }], ['another attempt', { runAttempt: '3' }]]) {
  test(`approval notice preserves same-code approved deployment from ${name}`, async () => {
    const f = fixture({ fork: true })
    const context = await prepare(f.event, f.api)
    f.deployments = [{ id: 300, sha: headSha, payload: { preview: 'lie-pr-preview', pr_number: 42, ...f.receipt, ...changed } }]
    f.deploymentStatuses[300] = [{ state: 'success' }]
    assert.equal((await notice(context, f.api)).status, 'already-approved')
    assert.deepEqual(f.writes, [])
  })
}

test('approval notice scans bounded deployment pages and finds a later-page success', async () => {
  const f = fixture({ fork: true })
  const context = await prepare(f.event, f.api)
  const api = async (path, body) => {
    if (body == null && path.startsWith('deployments?')) {
      return path.endsWith('page=1') ? Array.from({ length: 100 }, (_, index) => ({ id: index + 1, sha: headSha, payload: { preview: 'other' } }))
        : [{ id: 300, sha: headSha, payload: { preview: 'lie-pr-preview', pr_number: 42, ...f.receipt } }]
    }
    return f.api(path, body)
  }
  f.deploymentStatuses[300] = [{ state: 'success' }]
  assert.equal((await notice(context, api)).status, 'already-approved')
  assert.deepEqual(f.writes, [])
})

test('approval notice fails closed when deployment pagination exceeds its bound', async () => {
  const f = fixture({ fork: true })
  const context = await prepare(f.event, f.api)
  f.deployments = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, sha: headSha, payload: { preview: 'other' } }))
  await assert.rejects(notice(context, f.api), /exceeds approval-notice bound/)
  assert.equal(f.reads.filter(path => path.startsWith('deployments?')).length, 3)
  assert.deepEqual(f.writes, [])
})

test('closed signal authorizes cleanup only after reading current closed PR', async () => {
  const f = fixture()
  f.pr.state = 'closed'
  f.artifacts = { total_count: 1, artifacts: [{ name: 'pr-preview-closed-42' }] }
  const context = await prepare(f.event, f.api)
  assert.equal(context.action, 'cleanup')
  assert.equal((await cleanupAuthorize(context, f.api)).previewName, 'pr-42')
  f.pr.state = 'open'
  assert.equal((await cleanupAuthorize(context, f.api)).status, 'reopened')
  assert.equal((await prepare(f.event, f.api)).status, 'reopened')
})

test('confirmed cleanup inactivates only project-marked deployment records and never writes storage/provider', async () => {
  const f = fixture()
  f.pr.state = 'closed'
  const context = { action: 'cleanup', prNumber: 42, runId: '100' }
  f.deployments = [{ id: 300, payload: { preview: 'lie-pr-preview', pr_number: 42 } }, { id: 301, payload: { preview: 'other', pr_number: 42 } }]
  await cleanupReport(context, f.api)
  assert.deepEqual(f.writes.map(item => item.path), ['deployments/300/statuses'])
})

test('preview URL parser refuses arbitrary domains, credential URLs, query injection and missing URLs', () => {
  assert.equal(previewURLs({ previewUrls: { default: 'https://pr-42.account.workers.dev' } }).url, 'https://pr-42.account.workers.dev/')
  for (const value of ['http://pr-42.account.workers.dev', 'https://workers.dev.evil.example', 'https://user@pr-42.account.workers.dev',
    'https://pr-42.account.workers.dev/?token=x', 'https://pr-42.account.workers.dev/path', 'https://pr-42.account.workers.dev/#fragment']) {
    assert.throws(() => previewURLs({ preview_urls: [value] }))
  }
  assert.throws(() => previewURLs({ preview_urls: [] }))
})

test('GitHub client is fixed to this repository and never emits an opaque error response', async () => {
  const calls = []
  const api = githubClient('fake-token', async (url, options) => { calls.push({ url, options }); return { ok: false, status: 403, json: () => { throw new Error('must not read') } } })
  await assert.rejects(api('pulls/42'), /^Error: GitHub API failed \(403\)$/)
  assert.match(calls[0].url, /^https:\/\/api.github.com\/repos\/nighca\/lie\//)
  await assert.rejects(api('https://example.com'), /Invalid/)
})

test('GitHub output values reject newline injection', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-outputs-'))
  try {
    const path = join(directory, 'output')
    await outputs({ action: 'deploy', pr_number: 42 }, path)
    assert.equal(await readFile(path, 'utf8'), 'action=deploy\npr_number=42\n')
    await assert.rejects(outputs({ action: 'deploy\nmalicious=value' }, path), /Unsafe/)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('cleanup-report CLI requires an explicit deletion confirmation before any write', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-cli-'))
  try {
    const context = join(directory, 'context.json')
    await writeFile(context, JSON.stringify({ action: 'cleanup', prNumber: 42, runId: '100' }))
    let calls = 0
    await assert.rejects(main('cleanup-report', { GITHUB_REPOSITORY: repo.full_name, GH_TOKEN: 'fake', PR_PREVIEW_CONTEXT_FILE: context }, async () => { calls++; throw new Error('must not call') }), /not been confirmed/)
    assert.equal(calls, 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('publisher job cannot silently change the PR selected for its concurrency group', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-selected-'))
  try {
    const f = fixture()
    const event = join(directory, 'event.json')
    const context = join(directory, 'context.json')
    await writeFile(event, JSON.stringify(f.event))
    const env = { GITHUB_REPOSITORY: repo.full_name, GITHUB_EVENT_NAME: 'workflow_run', GITHUB_EVENT_PATH: event,
      GH_TOKEN: 'fake', SELECTED_PR_NUMBER: '43', PR_PREVIEW_CONTEXT_FILE: context }
    const fetcher = async (url, init) => {
      const path = url.slice(`https://api.github.com/repos/${repo.full_name}/`.length)
      const value = await f.api(path, init.method === 'POST' ? JSON.parse(init.body) : null)
      return { ok: true, status: 200, json: async () => value }
    }
    await assert.rejects(main('prepare', env, fetcher), /changed between publisher jobs/)
    await assert.rejects(readFile(context), { code: 'ENOENT' })
    assert.deepEqual(f.writes, [])
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('closed signal cannot come from a different workflow even if it names a real closed PR', async () => {
  const f = fixture()
  f.pr.state = 'closed'
  f.artifacts = { total_count: 1, artifacts: [{ name: 'pr-preview-closed-42' }] }
  f.run.workflow_id = f.event.workflow_run.workflow_id = 99
  await assert.rejects(prepare(f.event, f.api), /Unexpected PR CI source/)
  assert.deepEqual(f.writes, [])
})

function deployedPreview() {
  return { type: 'preview', version: 1, preview_id: 'preview-id', preview_name: 'pr-42', preview_slug: 'pr-42',
    preview_urls: ['https://pr-42-lie-pr-preview.account.workers.dev/'], deployment_id: 'deployment-id',
    deployment_urls: ['https://deployment-id-lie-pr-preview.account.workers.dev/'] }
}

function probeResponse(path) {
  if (path === '/' || path === '/editor') return new Response('<html>preview</html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  return Response.json(path === '/api/health' ? { status: 'ok', storage: 'r2' } : { status: 'ready' })
}

test('HTTP probe makes exactly four same-origin bounded GETs and does not prepare or open voice', async () => {
  const calls = []
  const result = await probe({ prNumber: 42 }, deployedPreview(), async (url, options) => {
    calls.push({ url, options })
    return probeResponse(new URL(url).pathname)
  })
  assert.deepEqual(result, { status: 'passed', url: 'https://pr-42-lie-pr-preview.account.workers.dev', requests: 4 })
  assert.deepEqual(calls.map(call => new URL(call.url).pathname), ['/', '/editor', '/api/health', '/api/voice/status'])
  assert.ok(calls.every(call => call.options.method === 'GET' && call.options.redirect === 'manual' && call.options.credentials === 'omit' &&
    call.options.headers['Cache-Control'] === 'no-store' && call.options.signal instanceof AbortSignal))
})

test('HTTP probe validates every returned URL and its parent target before any network call', async () => {
  for (const mutate of [
    data => { data.preview_urls = ['https://localhost/'] },
    data => { data.preview_urls = ['https://pr-42-other.account.workers.dev/'] },
    data => { data.preview_urls = ['https://user:password@pr-42-lie-pr-preview.account.workers.dev/'] },
    data => { data.preview_urls = ['https://pr-42-lie-pr-preview.account.workers.dev/?token=bad'] },
    data => { data.deployment_urls = ['https://deployment-lie-pr-preview.evil.workers.dev/'] },
    data => { data.preview_name = 'pr-43' }
  ]) {
    const data = deployedPreview()
    mutate(data)
    let calls = 0
    await assert.rejects(probe({ prNumber: 42 }, data, async () => { calls++; throw new Error('must not fetch') }))
    assert.equal(calls, 0)
  }
})

test('HTTP probe never follows redirects or retries a failed request', async () => {
  const calls = []
  await assert.rejects(probe({ prNumber: 42 }, deployedPreview(), async (url, options) => {
    calls.push({ url, options })
    return new Response(null, { status: 302, headers: { Location: 'https://example.com/' } })
  }), /probe failed for \/$/)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.redirect, 'manual')
})

for (const [name, path, response] of [
  ['HTML instead of health JSON', '/api/health', () => new Response('<html>fallback</html>', { headers: { 'Content-Type': 'text/html' } })],
  ['JSON instead of editor HTML', '/editor', () => Response.json({ status: 'ok' })],
  ['wrong storage', '/api/health', () => Response.json({ status: 'ok', storage: 'none' })],
  ['unavailable voice', '/api/voice/status', () => Response.json({ status: 'unavailable' })],
  ['invalid JSON', '/api/health', () => new Response('{invalid}', { headers: { 'Content-Type': 'application/json' } })],
  ['oversized JSON', '/api/health', () => new Response(JSON.stringify({ status: 'ok', storage: 'r2', extra: 'x'.repeat(65536) }), { headers: { 'Content-Type': 'application/json' } })],
  ['non-200 voice status', '/api/voice/status', () => Response.json({ error: 'unavailable' }, { status: 503 })]
]) test(`HTTP probe refuses ${name}`, async () => {
  const calls = []
  await assert.rejects(probe({ prNumber: 42 }, deployedPreview(), async url => {
    const currentPath = new URL(url).pathname
    calls.push(currentPath)
    return currentPath === path ? response() : probeResponse(currentPath)
  }), new RegExp(`probe failed for ${path}$`))
  assert.equal(calls.at(-1), path)
  assert.equal(calls.filter(item => item === path).length, 1)
})

test('HTTP probe deadline aborts the fetch and stops without a retry', async () => {
  let calls = 0, aborted = false
  await assert.rejects(probe({ prNumber: 42 }, deployedPreview(), async (_url, { signal }) => {
    calls++
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => { aborted = true; reject(signal.reason) }, { once: true }))
  }, { timeoutMs: 10 }), /probe failed for \/$/)
  assert.equal(calls, 1)
  assert.equal(aborted, true)
})

test('HTTP probe deadline cancels a stalled JSON response body', async () => {
  let cancelled = false
  await assert.rejects(probe({ prNumber: 42 }, deployedPreview(), async url => {
    const path = new URL(url).pathname
    if (path !== '/api/health') return probeResponse(path)
    return new Response(new ReadableStream({ start() {}, cancel() { cancelled = true } }), { headers: { 'Content-Type': 'application/json' } })
  }, { timeoutMs: 10 }), /probe failed for \/api\/health$/)
  assert.equal(cancelled, true)
})

test('HTTP probe CLI needs neither a GitHub token nor receipt access', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-probe-cli-'))
  try {
    const contextFile = join(directory, 'context.json'), deploymentFile = join(directory, 'deployment.json')
    await writeFile(contextFile, JSON.stringify({ prNumber: 42 }))
    await writeFile(deploymentFile, JSON.stringify(deployedPreview()))
    const result = await main('probe', { GITHUB_REPOSITORY: repo.full_name, PR_PREVIEW_CONTEXT_FILE: contextFile,
      PR_PREVIEW_DEPLOYMENT_FILE: deploymentFile, PR_PREVIEW_ARTIFACT_DIR: join(directory, 'missing') }, async url => probeResponse(new URL(url).pathname))
    assert.equal(result.requests, 4)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

function apiFetcher(api) {
  return async (url, init) => {
    const path = url.slice(`https://api.github.com/repos/${repo.full_name}/`.length)
    const value = await api(path, init.method === 'POST' ? JSON.parse(init.body) : null)
    return { ok: true, status: 200, json: async () => value }
  }
}

test('manual recheck CLI requires the saved PR/head to match the current native workflow event', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-event-recheck-'))
  try {
    const f = fixture({ fork: true, dispatch: true })
    const context = await prepare(f.event, f.api)
    const contextPath = join(directory, 'context.json'), eventPath = join(directory, 'event.json'), identityPath = join(directory, 'identity.json')
    await writeFile(contextPath, JSON.stringify(context))
    await writeFile(eventPath, JSON.stringify(f.event))
    await writeFile(join(directory, 'receipt.json'), JSON.stringify(f.receipt))
    const env = { GITHUB_REPOSITORY: repo.full_name, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_EVENT_PATH: eventPath,
      GH_TOKEN: 'fake', PR_PREVIEW_CONTEXT_FILE: contextPath, PR_PREVIEW_ARTIFACT_DIR: directory, PR_PREVIEW_IDENTITY_FILE: identityPath }
    assert.equal((await main('recheck', env, apiFetcher(f.api))).status, 'deploy')
    const savedIdentity = await readFile(identityPath, 'utf8')
    f.event.inputs.head_sha = 'e'.repeat(40)
    await writeFile(eventPath, JSON.stringify(f.event))
    await assert.rejects(main('recheck', env, apiFetcher(f.api)), /does not match the current GitHub event/)
    assert.equal(await readFile(identityPath, 'utf8'), savedIdentity)
    assert.equal(f.reads.some(path => path.startsWith('collaborators/')), false)
    assert.deepEqual(f.writes, [])
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('CLI persists the deployment ID before a pending status failure, so fail can close the in-progress record', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-pending-recovery-'))
  try {
    const f = fixture()
    const context = await prepare(f.event, f.api)
    const contextPath = join(directory, 'context.json')
    await writeFile(contextPath, JSON.stringify(context))
    await writeFile(join(directory, 'receipt.json'), JSON.stringify(f.receipt))
    let failCommitStatus = true
    const api = async (path, body) => {
      if (body != null && path === `statuses/${headSha}` && failCommitStatus) {
        failCommitStatus = false
        throw new Error('One commit status request failed')
      }
      return f.api(path, body)
    }
    const env = { GITHUB_REPOSITORY: repo.full_name, GH_TOKEN: 'fake', PR_PREVIEW_CONTEXT_FILE: contextPath,
      PR_PREVIEW_ARTIFACT_DIR: directory }
    await assert.rejects(main('pending', env, apiFetcher(api)), /One commit status request failed/)
    assert.equal(JSON.parse(await readFile(contextPath, 'utf8')).deploymentId, '300')
    assert.deepEqual(f.writes.filter(item => item.path === 'deployments/300/statuses').map(item => item.body.state), ['in_progress'])
    await main('fail', env, apiFetcher(api))
    assert.deepEqual(f.writes.filter(item => item.path === 'deployments/300/statuses').map(item => item.body.state), ['in_progress', 'failure'])
    assert.equal(f.writes.at(-1).body.state, 'failure')
  } finally { await rm(directory, { recursive: true, force: true }) }
})
