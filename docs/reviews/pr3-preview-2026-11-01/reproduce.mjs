// Offline historical reproduction. No credentials, cloud calls or dependency install.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const sourceCommit = '1e88180239684db1ef5d3bddde3375639ee4bec7'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const hashes = {
  'pr-preview.mjs': 'cd05c035a7983e249e911e17d814dd77296176f9a3b9ea2b2f3d216010f16db3',
  'pr-preview-github.mjs': '22ddedd5039c65d24e9e55529d17717d2fd669ce91932f717b27db5092292cbf',
  'pr-preview-deploy.mjs': 'dbbbb0752b7fd2df214b94a63f5fb3be43036ce4d27837cc8d18647e5bd4cd26',
  'pr-preview-artifact.mjs': '7a4763d8dd513706639498ca4f89f79f0a78d8e3e274f82223082850a167cac5'
}
globalThis.fetch = () => { throw new Error('Network forbidden in historical reproduction') }
const temporary = await mkdtemp(join(tmpdir(), 'lie-pr3-offline-'))
try {
  for (const [name, expected] of Object.entries(hashes)) {
    const bytes = execFileSync('git', ['show', `${sourceCommit}:scripts/${name}`], { cwd: root })
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, `Pinned source changed: ${name}`)
    await writeFile(join(temporary, name), bytes, { flag: 'wx' })
  }
  const load = name => import(pathToFileURL(join(temporary, name)).href)
  const { artifactName, validatePreviewRun } = await load('pr-preview-github.mjs')
  const { prepare } = await load('pr-preview.mjs')
  const { identityFromEnv } = await load('pr-preview-artifact.mjs')
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
      runs: [structuredClone(run)], deployments: [], deploymentStatuses: {}, reads: [], writes: [],
      publisher: { publisherRunId: '500', publisherRunAttempt: '1' }
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
  const oldBase = 'f504e1acc1044f58c5b455daeb62b96fa5b9047c'
  const testedBase = '1e88180239684db1ef5d3bddde3375639ee4bec7'
  const f = fixture()
  f.pr.base.sha = f.receipt.baseSha = oldBase
  f.mergeCommit.parents[0].sha = testedBase
  await assert.rejects(prepare(f.event, f.api, f.publisher), /Preview is not the current PR test merge/)
  assert.deepEqual(f.writes, [])
  console.log('PASS: unchanged production prepare reproduces observed mismatch; zero API writes')

  const input = {event:f.event, run:f.run, workflow:f.workflow, pr:f.pr, mergeCommit:f.mergeCommit, receipt:f.receipt, artifacts:f.artifacts}
  const correctedReceipt = {...f.receipt, baseSha:testedBase}
  assert.equal(validatePreviewRun({...input, receipt:correctedReceipt}).status, 'stale')
  console.log('PASS: correcting only receipt still fails current pr.base comparator')
  const produced = identityFromEnv({GITHUB_REPOSITORY:'nighca/lie', PR_NUMBER:'42', PR_HEAD_SHA:headSha, PR_BASE_SHA:oldBase, PR_MERGE_SHA:mergeSha, GITHUB_RUN_ID:'100', GITHUB_RUN_ATTEMPT:'2'})
  assert.equal(produced.baseSha, oldBase)
  console.log('PASS: unchanged producer preserves old event base in receipt identity')
  const control = fixture()
  assert.equal((await prepare(control.event, control.api, control.publisher)).action, 'deploy')
  assert.deepEqual(control.writes, [])
  console.log('PASS: existing aligned-base control succeeds without network/writes')

} finally {
  await rm(temporary, { recursive: true, force: true })
}
