import assert from 'node:assert/strict'
import test from 'node:test'

import { artifactName, parsePreviewArtifactName, previewArtifactName, selectPreviewArtifact, validateClosedPreview, validatePreviewRun } from './pr-preview-github.mjs'

const headSha = 'a'.repeat(40), baseSha = 'b'.repeat(40), mergeSha = 'c'.repeat(40)
const repository = { id: 1, full_name: 'nighca/lie' }

function fixture({ fork = false, dispatch = false } = {}) {
  const headRepository = fork ? { id: 2, full_name: 'contributor/lie' } : { ...repository }
  const run = { id: 100, run_attempt: 2, workflow_id: 10, event: 'pull_request', status: 'completed', conclusion: 'success', head_sha: headSha,
    repository: { ...repository }, head_repository: headRepository, actor: { login: 'contributor' }, pull_requests: [{ number: 42 }] }
  const receipt = { version: 1, repository: 'nighca/lie', prNumber: 42, headSha, baseSha, mergeSha, runId: '100', runAttempt: '2' }
  return {
    event: dispatch ? { repository: { ...repository }, ref: 'refs/heads/main', inputs: { pr: '42', head_sha: headSha } }
      : { action: 'completed', repository: { ...repository }, workflow_run: structuredClone(run) },
    run, workflow: { id: 10, path: '.github/workflows/pr-ci.yml', name: 'PR CI' },
    pr: { number: 42, state: 'open', draft: false, mergeable: true, merge_commit_sha: mergeSha,
      base: { repo: { ...repository }, ref: 'main', sha: baseSha }, head: { repo: headRepository, sha: headSha }, user: { login: 'contributor' } },
    mergeCommit: { sha: mergeSha, parents: [{ sha: baseSha }, { sha: headSha }] }, receipt,
    artifacts: { total_count: 1, artifacts: [{ id: 200, name: previewArtifactName(receipt), expired: false, digest: `sha256:${'d'.repeat(64)}`,
      workflow_run: { id: 100, repository_id: 1, head_repository_id: headRepository.id, head_sha: headSha } }] },
    approvalHeadSha: dispatch ? headSha : null
  }
}

test('same-repository successful current merge deploys its exact artifact', () => {
  const result = validatePreviewRun(fixture())
  assert.deepEqual(result, { status: 'deploy', prNumber: 42, previewName: 'pr-42', headSha, baseSha, mergeSha,
    runId: '100', runAttempt: '2', artifactId: '200', artifactDigest: `sha256:${'d'.repeat(64)}` })
})

test('artifact discovery parses canonical names only and selects independently of the receipt', () => {
  const input = fixture()
  const name = artifactName(input.receipt)
  assert.deepEqual(parsePreviewArtifactName(name), { prNumber: 42, mergeSha, runId: '100', runAttempt: '2' })
  assert.equal(selectPreviewArtifact(input.artifacts, input.pr, input.run).id, 200)
  for (const bad of [null, '', name + '/other', name.replace('-42-', '-0-'), name.replace('-42-', '-042-'),
    name.replace('-100-', '-9007199254740992-'), name.replace(mergeSha, 'not-a-sha')]) assert.equal(parsePreviewArtifactName(bad), null)
})

test('accepts a run whose head_sha is the merge SHA without confusing it with PR head', () => {
  const input = fixture()
  input.run.head_sha = input.event.workflow_run.head_sha = input.artifacts.artifacts[0].workflow_run.head_sha = mergeSha
  assert.equal(validatePreviewRun(input).status, 'deploy')
})

test('fork requires manual approval of the current head from main', () => {
  const automatic = fixture({ fork: true })
  automatic.run.pull_requests = automatic.event.workflow_run.pull_requests = []
  assert.equal(validatePreviewRun(automatic).status, 'awaiting-approval')
  assert.equal(validatePreviewRun(fixture({ fork: true, dispatch: true })).status, 'deploy')
  automatic.approvalHeadSha = headSha
  assert.throws(() => validatePreviewRun(automatic), /cannot grant manual/)
})

test('Dependabot remains low trust even when its head repository is this repository', () => {
  for (const target of ['user', 'actor', 'triggering_actor']) {
    const input = fixture()
    if (target === 'user') input.pr.user.login = 'dependabot[bot]'
    else input.run[target] = { login: 'dependabot[bot]' }
    assert.equal(validatePreviewRun(input).status, 'awaiting-approval')
  }
  const approved = fixture({ dispatch: true })
  approved.pr.user.login = 'dependabot[bot]'
  assert.equal(validatePreviewRun(approved).status, 'deploy')
})

test('changed current head, base, merge, approval or merge conflict is stale', () => {
  for (const mutate of [input => { input.pr.head.sha = 'e'.repeat(40) }, input => { input.pr.base.sha = 'e'.repeat(40) },
    input => { input.pr.merge_commit_sha = null }, input => { input.pr.mergeable = false },
    input => { input.approvalHeadSha = 'e'.repeat(40) }]) {
    const input = fixture({ dispatch: true })
    mutate(input)
    assert.equal(validatePreviewRun(input).status, 'stale')
  }
})

test('draft is skipped and closed is reported separately from deploy', () => {
  const draft = fixture()
  draft.pr.draft = true
  assert.equal(validatePreviewRun(draft).status, 'skipped')
  const closed = fixture()
  closed.pr.state = 'closed'
  closed.pr.merge_commit_sha = 'e'.repeat(40)
  assert.equal(validatePreviewRun(closed).status, 'closed')
})

for (const [name, mutate] of [
  ['unsuccessful run', input => { input.run.conclusion = 'failure' }],
  ['unfinished run', input => { input.run.status = 'in_progress' }],
  ['push run', input => { input.run.event = 'push' }],
  ['wrong workflow', input => { input.workflow.id = 11 }],
  ['wrong workflow path', input => { input.workflow.path = '.github/workflows/ci.yml' }],
  ['wrong workflow name', input => { input.workflow.name = 'CI' }],
  ['fork event repository', input => { input.event.repository.full_name = 'fork/lie' }],
  ['wrong run repository ID', input => { input.run.repository.id = 5 }],
  ['wrong head repository', input => { input.run.head_repository = { id: 5, full_name: 'fork/lie' } }],
  ['missing head repositories', input => { delete input.run.head_repository; delete input.pr.head.repo }],
  ['wrong target branch', input => { input.pr.base.ref = 'other' }],
  ['other PR association', input => { input.run.pull_requests = [{ number: 43 }] }],
  ['malformed PR association', input => { input.run.pull_requests = {} }],
  ['new API attempt', input => { input.run.run_attempt = 3 }],
  ['different event run', input => { input.event.workflow_run.id = 101 }],
  ['failed event', input => { input.event.workflow_run.conclusion = 'failure' }],
  ['receipt attempt mismatch', input => { input.receipt.runAttempt = '1' }],
  ['receipt run mismatch', input => { input.receipt.runId = '101' }],
  ['receipt PR mismatch', input => { input.receipt.prNumber = 43 }],
  ['receipt repository mismatch', input => { input.receipt.repository = 'fork/lie' }],
  ['invalid receipt SHA', input => { input.receipt.headSha = 'not-a-sha' }],
  ['unrelated run SHA', input => { input.run.head_sha = input.event.workflow_run.head_sha = 'e'.repeat(40) }],
  ['wrong merge commit', input => { input.mergeCommit.sha = headSha }],
  ['merge parents reversed', input => { input.mergeCommit.parents.reverse() }],
  ['merge parent replaced', input => { input.mergeCommit.parents[1].sha = 'e'.repeat(40) }],
  ['one-parent commit', input => { input.mergeCommit.parents.pop() }],
  ['missing artifact', input => { input.artifacts = { total_count: 0, artifacts: [] } }],
  ['ambiguous artifact', input => { input.artifacts.artifacts.push(structuredClone(input.artifacts.artifacts[0])); input.artifacts.total_count++ }],
  ['incomplete artifact listing', input => { input.artifacts.total_count++ }],
  ['expired artifact', input => { input.artifacts.artifacts[0].expired = true }],
  ['missing digest', input => { delete input.artifacts.artifacts[0].digest }],
  ['wrong digest', input => { input.artifacts.artifacts[0].digest = 'sha256:no' }],
  ['wrong artifact run', input => { input.artifacts.artifacts[0].workflow_run.id = 101 }],
  ['wrong artifact repository', input => { input.artifacts.artifacts[0].workflow_run.repository_id = 2 }],
  ['wrong artifact head repository', input => { input.artifacts.artifacts[0].workflow_run.head_repository_id = 2 }],
  ['wrong artifact SHA', input => { input.artifacts.artifacts[0].workflow_run.head_sha = mergeSha }]
]) test(`rejects ${name}`, () => {
  const input = fixture()
  mutate(input)
  assert.throws(() => validatePreviewRun(input))
})

test('manual approval rejects other refs, absent or partial SHA, and nonpositive IDs', () => {
  for (const mutate of [input => { input.event.ref = 'refs/heads/feature' }, input => { input.approvalHeadSha = null },
    input => { input.approvalHeadSha = headSha.slice(0, 7) }, input => { input.receipt.runId = '0' },
    input => { input.pr.number = 0 }]) {
    const input = fixture({ fork: true, dispatch: true })
    mutate(input)
    assert.throws(() => validatePreviewRun(input))
  }
})

test('cleanup only returns one canonical name for a confirmed closed main PR', () => {
  const { pr } = fixture()
  pr.state = 'closed'
  assert.equal(validateClosedPreview(pr, '42'), 'pr-42')
  assert.throws(() => validateClosedPreview(pr, 43))
  assert.throws(() => validateClosedPreview(pr, '42/other'))
  pr.state = 'open'
  assert.throws(() => validateClosedPreview(pr, 42))
})
