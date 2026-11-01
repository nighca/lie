const repository = 'nighca/lie'
const shaPattern = /^[a-f0-9]{40}$/
const requireThat = (condition, message) => { if (!condition) throw new Error(message) }
const positiveInteger = value => /^(?:[1-9][0-9]*)$/.test(String(value)) && Number.isSafeInteger(Number(value))
const sha = value => typeof value === 'string' && shaPattern.test(value)
const sameRepository = (actual, expected) => positiveInteger(actual?.id) && positiveInteger(expected?.id) &&
  typeof actual?.full_name === 'string' && actual.full_name.length > 0 && actual.full_name === expected?.full_name && actual.id === expected.id

function previewIdentity(pr) {
  requireThat(positiveInteger(pr?.number) && pr.base?.repo?.full_name === repository && positiveInteger(pr.base.repo.id), 'Unexpected preview repository or PR')
  requireThat(pr.base.ref === 'main', 'Preview requires a main-targeted PR')
  return { prNumber: pr.number, previewName: `pr-${pr.number}` }
}

export function previewArtifactName(receipt) {
  return `pr-preview-${receipt.prNumber}-${receipt.mergeSha}-${receipt.runId}-${receipt.runAttempt}`
}

export const artifactName = previewArtifactName

/** Parse only for read-only API discovery; this does not authorize publication. */
export function parsePreviewArtifactName(name) {
  if (typeof name !== 'string') return null
  const match = /^pr-preview-([1-9][0-9]*)-([a-f0-9]{40})-([1-9][0-9]*)-([1-9][0-9]*)$/.exec(name)
  if (match == null || ![match[1], match[3], match[4]].every(positiveInteger)) return null
  return { prNumber: Number(match[1]), mergeSha: match[2], runId: match[3], runAttempt: match[4] }
}

export function selectPreviewArtifact(artifacts, pr, run) {
  previewIdentity(pr)
  requireThat(sha(pr.merge_commit_sha) && positiveInteger(run?.id) && positiveInteger(run.run_attempt), 'Invalid artifact selection identity')
  const listing = Array.isArray(artifacts) ? { artifacts, total_count: artifacts.length } : artifacts
  requireThat(Array.isArray(listing?.artifacts) && listing.total_count === listing.artifacts.length, 'Incomplete preview artifact listing')
  const name = previewArtifactName({ prNumber: pr.number, mergeSha: pr.merge_commit_sha, runId: String(run.id), runAttempt: String(run.run_attempt) })
  const matches = listing.artifacts.filter(item => item.name === name)
  requireThat(matches.length === 1, 'Preview artifact missing or ambiguous')
  const artifact = matches[0]
  requireThat(positiveInteger(artifact.id) && artifact.expired === false && typeof artifact.digest === 'string' && /^sha256:[a-f0-9]{64}$/.test(artifact.digest), 'Preview artifact expired or invalid')
  requireThat(artifact.workflow_run?.id === run.id && artifact.workflow_run.repository_id === run.repository?.id &&
    artifact.workflow_run.head_repository_id === run.head_repository?.id && artifact.workflow_run.head_sha === run.head_sha, 'Preview artifact provenance mismatch')
  return artifact
}

/** Only a current API-confirmed closed PR can authorize removing its preview. */
export function validateClosedPreview(pr, requestedNumber) {
  const identity = previewIdentity(pr)
  requireThat(positiveInteger(requestedNumber) && Number(requestedNumber) === pr.number, 'Cleanup PR mismatch')
  requireThat(pr.state === 'closed', 'Preview cleanup requires a closed PR')
  return identity.previewName
}

/**
 * All inputs are data: API responses, a GitHub event payload, and the downloaded
 * receipt. Dispatch callers pass approvalHeadSha explicitly from their input.
 * A receipt alone never authorizes publication or cleanup.
 */
export function validatePreviewRun({ event, run, workflow, pr, mergeCommit, receipt, artifacts, approvalHeadSha = null }) {
  const identity = previewIdentity(pr)
  const outcome = status => ({ status, ...identity })
  requireThat(sameRepository(event?.repository, pr.base.repo), 'Unexpected event repository')
  requireThat(positiveInteger(workflow?.id) && workflow.path === '.github/workflows/pr-ci.yml' && workflow.name === 'PR CI', 'Unexpected PR CI workflow')
  requireThat(run?.workflow_id === workflow.id && positiveInteger(run.id) && positiveInteger(run.run_attempt), 'Invalid PR CI run identity')
  requireThat(sameRepository(run.repository, pr.base.repo) && sameRepository(run.head_repository, pr.head?.repo), 'Unexpected PR CI run repository')
  requireThat(run.event === 'pull_request' && run.status === 'completed' && run.conclusion === 'success', 'PR CI must complete successfully')
  requireThat(sha(run.head_sha), 'Invalid PR CI head SHA')

  if (event.workflow_run != null) {
    const upstream = event.workflow_run
    requireThat(event.action === 'completed' && upstream.id === run.id && upstream.run_attempt === run.run_attempt &&
      upstream.head_sha === run.head_sha && upstream.workflow_id === workflow.id &&
      sameRepository(upstream.repository, run.repository) && sameRepository(upstream.head_repository, run.head_repository) &&
      upstream.event === 'pull_request' && upstream.status === 'completed' && upstream.conclusion === 'success', 'Triggering CI run changed or was unsuccessful')
    requireThat(approvalHeadSha == null, 'A workflow_run cannot grant manual preview approval')
  } else {
    requireThat(event.ref === 'refs/heads/main' && event.inputs != null, 'Manual preview approval must run from main')
    requireThat(sha(approvalHeadSha), 'Manual preview approval requires a complete head SHA')
  }

  requireThat(receipt?.version === 1 && receipt.repository === repository && receipt.prNumber === pr.number &&
    sha(receipt.headSha) && sha(receipt.baseSha) && sha(receipt.mergeSha) &&
    typeof receipt.runId === 'string' && positiveInteger(receipt.runId) &&
    typeof receipt.runAttempt === 'string' && positiveInteger(receipt.runAttempt), 'Invalid preview receipt identity')
  requireThat(receipt.runId === String(run.id) && receipt.runAttempt === String(run.run_attempt), 'Preview receipt run or attempt mismatch')
  requireThat(run.head_sha === receipt.headSha || run.head_sha === receipt.mergeSha, 'PR CI SHA does not match the preview receipt')

  // A fork workflow_run may omit its pull_requests array. The independently read
  // current PR, its head repository, and merge parents still bind the code below.
  requireThat(run.pull_requests == null || Array.isArray(run.pull_requests), 'Invalid PR CI association')
  if (run.pull_requests?.length > 0) requireThat(run.pull_requests.some(item => item.number === pr.number), 'PR CI belongs to another PR')
  if (pr.state === 'closed') return outcome('closed')
  requireThat(pr.state === 'open', 'Unexpected PR state')
  if (pr.head?.sha !== receipt.headSha || pr.base.sha !== receipt.baseSha || pr.merge_commit_sha !== receipt.mergeSha) return outcome('stale')
  if (approvalHeadSha != null && approvalHeadSha !== pr.head.sha) return outcome('stale')
  if (pr.mergeable === false) return outcome('stale')
  requireThat(mergeCommit?.sha === receipt.mergeSha && Array.isArray(mergeCommit.parents) && mergeCommit.parents.length === 2 &&
    mergeCommit.parents[0]?.sha === receipt.baseSha && mergeCommit.parents[1]?.sha === receipt.headSha, 'Preview is not the current PR test merge')

  const artifact = selectPreviewArtifact(artifacts, pr, run)

  if (pr.draft === true) return outcome('skipped')
  const lowTrust = pr.head.repo.id !== pr.base.repo.id || [pr.user?.login, run.actor?.login, run.triggering_actor?.login].includes('dependabot[bot]')
  if (lowTrust && approvalHeadSha == null) return outcome('awaiting-approval')
  return { status: 'deploy', ...identity, headSha: receipt.headSha, baseSha: receipt.baseSha, mergeSha: receipt.mergeSha,
    runId: receipt.runId, runAttempt: receipt.runAttempt, artifactId: String(artifact.id), artifactDigest: artifact.digest }
}
