import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parsePreviewArtifactName, selectPreviewArtifact, validateClosedPreview, validateMergeEquivalence, validatePreviewRun } from './pr-preview-github.mjs'
import { previewDomain, previewResult } from './pr-preview-deploy.mjs'

const repository = 'nighca/lie'
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value)
const integer = value => /^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(Number(value))
const requireThat = (condition, message) => { if (!condition) throw new Error(message) }

function publisherIdentity(value) {
  requireThat(integer(value?.publisherRunId) && integer(value?.publisherRunAttempt), 'Invalid publisher run identity')
  return { publisherRunId: String(value.publisherRunId), publisherRunAttempt: String(value.publisherRunAttempt) }
}

export function githubClient(token, fetcher = fetch) {
  requireThat(typeof token === 'string' && token.length > 0, 'Missing GitHub token')
  return async (path, body = null) => {
    requireThat(typeof path === 'string' && !path.startsWith('/') && !path.includes('://'), 'Invalid GitHub API path')
    const response = await fetcher(`https://api.github.com/repos/${repository}/${path}`, {
      method: body == null ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body == null ? {} : { 'Content-Type': 'application/json' }) },
      ...(body == null ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000)
    })
    requireThat(response.ok, `GitHub API failed (${response.status})`)
    return response.status === 204 ? null : response.json()
  }
}

function eventIdentity(event) {
  requireThat(event?.repository?.full_name === repository && integer(event.repository.id), 'Unexpected publisher repository')
  if (event.workflow_run != null) {
    requireThat(event.action === 'completed' && integer(event.workflow_run.id), 'Unexpected workflow_run event')
    return { manual: false, approvalHeadSha: null }
  }
  requireThat(event.ref === 'refs/heads/main' && event.inputs != null && integer(event.inputs.pr_number) && sha(event.inputs.head_sha), 'Manual preview requires main, PR number and complete head SHA')
  return { manual: true, approvalHeadSha: event.inputs.head_sha }
}

function runIdentity(run, workflow, event) {
  requireThat(workflow?.path === '.github/workflows/pr-ci.yml' && workflow.name === 'PR CI' && integer(workflow.id), 'Unexpected PR CI workflow')
  requireThat(integer(run?.id) && integer(run.run_attempt) && run.workflow_id === workflow.id && run.event === 'pull_request' &&
    run.repository?.full_name === repository && run.repository.id === event.repository.id && sha(run.head_sha), 'Unexpected PR CI source')
  requireThat(run.status === 'completed' && run.conclusion === 'success', 'PR CI did not complete successfully')
  if (event.workflow_run != null) {
    const upstream = event.workflow_run
    requireThat(upstream.id === run.id && upstream.run_attempt === run.run_attempt && upstream.head_sha === run.head_sha && upstream.workflow_id === workflow.id &&
      upstream.event === 'pull_request' && upstream.status === 'completed' && upstream.conclusion === 'success' &&
      upstream.repository?.id === run.repository.id && upstream.repository?.full_name === repository &&
      upstream.head_repository?.id === run.head_repository?.id && upstream.head_repository?.full_name === run.head_repository?.full_name, 'Triggering PR CI run changed')
  }
}

function listing(items) {
  requireThat(Array.isArray(items?.artifacts) && items.total_count === items.artifacts.length, 'Incomplete preview artifact listing')
  return items.artifacts
}

async function artifactsFor(api, runId) {
  requireThat(integer(runId), 'Invalid run ID')
  return api(`actions/runs/${runId}/artifacts?per_page=100`)
}

async function currentPull(api, number) {
  requireThat(integer(number), 'Invalid PR number')
  const pr = await api(`pulls/${number}`)
  requireThat(pr?.number === Number(number) && pr.base?.repo?.full_name === repository && pr.base?.ref === 'main', 'Unexpected PR')
  return pr
}

function provisionalReceipt(pr, run, testedMergeSha) {
  return { version: 1, repository, prNumber: pr.number, headSha: pr.head.sha, baseSha: pr.base.sha, mergeSha: testedMergeSha,
    runId: String(run.id), runAttempt: String(run.run_attempt) }
}

async function latestRun(api, workflow, pr) {
  const candidates = []
  for (let page = 1; page <= 3; page++) {
    const response = await api(`actions/workflows/${workflow.id}/runs?event=pull_request&per_page=100&page=${page}`)
    requireThat(Array.isArray(response?.workflow_runs), 'Invalid PR CI run listing')
    candidates.push(...response.workflow_runs.filter(run => run.head_sha === pr.head.sha || run.head_sha === pr.merge_commit_sha ||
      (sha(run.head_sha) && integer(run.id) && integer(run.run_attempt) && run.workflow_id === workflow.id && run.event === 'pull_request' &&
        run.repository?.id === pr.base.repo.id && run.repository?.full_name === repository &&
        run.head_repository?.id === pr.head.repo.id && run.head_repository?.full_name === pr.head.repo.full_name &&
        Array.isArray(run.pull_requests) && run.pull_requests.some(item =>
          item.number === pr.number && item.head?.sha === pr.head.sha && item.base?.sha === pr.base.sha))))
    if (response.workflow_runs.length < 100) break
  }
  requireThat(candidates.length > 0, 'No recent CI run for the current PR; rerun PR CI')
  for (const run of candidates) requireThat(integer(run.id), 'Invalid listed CI run')
  const id = Math.max(...candidates.map(run => Number(run.id)))
  return api(`actions/runs/${id}`)
}

async function mergeCommits(api, testedSha, currentSha) {
  requireThat(sha(testedSha) && sha(currentSha), 'Invalid preview merge SHA')
  const mergeCommit = await api(`git/commits/${testedSha}`)
  const currentMergeCommit = testedSha === currentSha ? mergeCommit : await api(`git/commits/${currentSha}`)
  return { mergeCommit, currentMergeCommit }
}

function skip(context, reason) { return { ...context, action: 'skip', status: reason } }

/** Select only API identities. Downloading or executing PR code is never done here. */
export async function prepare(event, api, publisherData) {
  const source = eventIdentity(event)
  const publisher = publisherIdentity(publisherData)
  const workflow = await api('actions/workflows/pr-ci.yml')
  let pr, run, artifacts
  if (source.manual) {
    pr = await currentPull(api, event.inputs.pr_number)
    const context = { ...publisher, event, prNumber: pr.number, previewName: `pr-${pr.number}`, approvalHeadSha: source.approvalHeadSha }
    if (pr.state !== 'open' || pr.head.sha !== source.approvalHeadSha) return skip(context, 'stale')
    run = await latestRun(api, workflow, pr)
    runIdentity(run, workflow, event)
    artifacts = await artifactsFor(api, run.id)
  } else {
    run = await api(`actions/runs/${event.workflow_run.id}`)
    runIdentity(run, workflow, event)
    artifacts = await artifactsFor(api, run.id)
    const items = listing(artifacts)
    const closed = items.filter(item => /^pr-preview-closed-[1-9][0-9]*$/.test(item.name))
    if (closed.length > 0) {
      requireThat(closed.length === 1, 'Ambiguous closed PR signal')
      const number = Number(closed[0].name.slice('pr-preview-closed-'.length))
      pr = await currentPull(api, number)
      if (pr.state !== 'closed') return skip({ ...publisher, event, prNumber: number, previewName: `pr-${number}` }, 'reopened')
      const previewName = validateClosedPreview(pr, number)
      return { ...publisher, action: 'cleanup', status: 'closed', event, prNumber: number, previewName, runId: String(run.id), runAttempt: String(run.run_attempt) }
    }
    const discovered = items.map(item => parsePreviewArtifactName(item.name)).filter(item => item != null && item.runId === String(run.id) && item.runAttempt === String(run.run_attempt))
    requireThat(discovered.length === 1, 'Preview build artifact missing or ambiguous')
    pr = await currentPull(api, discovered[0].prNumber)
    const context = { ...publisher, event, prNumber: pr.number, previewName: `pr-${pr.number}`, approvalHeadSha: null }
    if (pr.state === 'closed') return skip(context, 'closed')
    if (![pr.head.sha, discovered[0].mergeSha].includes(run.head_sha)) return skip(context, 'stale')
  }
  const artifact = selectPreviewArtifact(artifacts, pr, run)
  const testedMergeSha = parsePreviewArtifactName(artifact.name).mergeSha
  const context = { ...publisher, event, prNumber: pr.number, previewName: `pr-${pr.number}`, approvalHeadSha: source.approvalHeadSha,
    runId: String(run.id), runAttempt: String(run.run_attempt), receipt: provisionalReceipt(pr, run, testedMergeSha),
    artifactId: String(artifact.id), artifactDigest: artifact.digest }
  if (pr.draft === true) return skip(context, 'skipped')
  requireThat(sha(pr.merge_commit_sha), 'PR test merge is unavailable; resolve conflicts and rerun CI')
  const mainRef = await api('git/ref/heads/main')
  const commits = await mergeCommits(api, testedMergeSha, pr.merge_commit_sha)
  const outcome = validatePreviewRun({ event, run, workflow, pr, mainRef, ...commits, receipt: context.receipt, artifacts, approvalHeadSha: source.approvalHeadSha })
  if (outcome.status !== 'deploy') return skip(context, outcome.status)
  return { ...context, action: 'deploy', status: 'deploy', identity: outcome }
}

/** Reread every identity after download and at both sides of cloud deployment. */
export async function authorize(context, receipt, api) {
  requireThat(context?.action === 'deploy' && integer(context.prNumber) && integer(context.runId), 'Invalid deployment context')
  requireThat(['repository', 'prNumber', 'headSha', 'baseSha', 'mergeSha', 'runId', 'runAttempt'].every(key =>
    receipt?.[key] === context.receipt?.[key]), 'Preview receipt run or attempt or build identity changed')
  const [pr, run, workflow, artifacts, mainRef] = await Promise.all([
    currentPull(api, context.prNumber), api(`actions/runs/${context.runId}`), api('actions/workflows/pr-ci.yml'), artifactsFor(api, context.runId), api('git/ref/heads/main')
  ])
  const commits = sha(pr.merge_commit_sha) ? await mergeCommits(api, receipt?.mergeSha, pr.merge_commit_sha) : {}
  const outcome = validatePreviewRun({ event: context.event, run, workflow, pr, mainRef, ...commits, receipt, artifacts, approvalHeadSha: context.approvalHeadSha })
  if (outcome.status === 'deploy') {
    requireThat(outcome.artifactId === context.artifactId && outcome.artifactDigest === context.artifactDigest &&
      outcome.runAttempt === context.runAttempt, 'Selected preview artifact changed')
  }
  return outcome
}

function runURL(context) { return `https://github.com/${repository}/actions/runs/${publisherIdentity(context).publisherRunId}` }

async function commitStatus(api, context, state, description, targetURL) {
  return api(`statuses/${context.receipt.headSha}`, { state, context: 'preview', description, target_url: targetURL })
}

/** Must run only after authorize returned deploy. */
export async function pending(context, receipt, api, { onDeploymentCreated = null } = {}) {
  const identity = await authorize(context, receipt, api)
  if (identity.status !== 'deploy') return { ...context, status: identity.status }
  requireThat(context.deploymentId == null, 'Preview deployment already started')
  const deployment = await api('deployments', { ref: identity.headSha, environment: `preview/pr-${context.prNumber}`,
    auto_merge: false, required_contexts: [], production_environment: false, transient_environment: true,
    description: `PR #${context.prNumber}: ${identity.mergeSha}`, payload: { preview: 'lie-pr-preview', pr_number: context.prNumber, ...identity } })
  requireThat(integer(deployment?.id), 'Invalid GitHub deployment ID')
  const updated = { ...context, deploymentId: String(deployment.id) }
  if (onDeploymentCreated != null) await onDeploymentCreated(updated)
  await api(`deployments/${updated.deploymentId}/statuses`, { state: 'in_progress', log_url: runURL(context), auto_inactive: false, description: 'Deploying this PR build' })
  await commitStatus(api, context, 'pending', 'Deploying current PR preview', runURL(context))
  return updated
}

export function previewURLs(result, prNumber) {
  const deployment = previewResult(result, prNumber)
  const urls = deployment.preview_urls.filter(url => new URL(url).hostname.endsWith(`.${previewDomain}`))
  const immutableURLs = deployment.deployment_urls.filter(url => new URL(url).hostname.endsWith(`.${previewDomain}`))
  requireThat(urls.length > 0 && immutableURLs.length > 0, 'Cloudflare did not return the configured custom preview URLs')
  return { url: urls[0], immutableURLs }
}

async function boundedJSON(response, signal) {
  const reader = response.body?.getReader()
  requireThat(reader != null, 'Preview probe returned no JSON body')
  const cancel = () => { void reader.cancel().catch(() => {}) }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    const chunks = []
    let size = 0
    while (true) {
      requireThat(!signal.aborted, 'Preview probe timed out')
      const { value, done } = await reader.read()
      requireThat(!signal.aborted, 'Preview probe timed out')
      if (done) break
      size += value.byteLength
      requireThat(size <= 65536, 'Preview probe JSON exceeds 64 KiB')
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } finally {
    signal.removeEventListener('abort', cancel)
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

/** Four bounded GETs only. Config ready is not proof of live provider/voice behavior. */
export async function probe(context, result, fetcher = fetch, { timeoutMs = 10000 } = {}) {
  requireThat(integer(context?.prNumber) && Number.isSafeInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 10000, 'Invalid preview probe identity or deadline')
  const origin = previewURLs(result, context.prNumber).url
  const routes = ['/', '/editor', '/api/health', '/api/voice/status']
  for (const path of routes) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let response
    try {
      response = await fetcher(`${origin}${path}`, { method: 'GET', redirect: 'manual', credentials: 'omit',
        headers: { 'Cache-Control': 'no-store' }, signal: controller.signal })
      requireThat(!controller.signal.aborted && response.status === 200, 'Preview probe request did not return 200')
      if (path === '/' || path === '/editor') {
        requireThat(/^text\/html(?:\s*;|$)/i.test(response.headers.get('Content-Type') ?? ''), 'Preview page probe did not return HTML')
        await response.body?.cancel()
      } else {
        requireThat(/^application\/json(?:\s*;|$)/i.test(response.headers.get('Content-Type') ?? ''), 'Preview API probe did not return JSON')
        const body = await boundedJSON(response, controller.signal)
        requireThat(body?.status === (path === '/api/health' ? 'ok' : 'ready'), 'Preview API probe returned an unexpected status')
        if (path === '/api/health') requireThat(body.storage === 'r2', 'Preview health probe did not confirm R2 configuration')
      }
      requireThat(!controller.signal.aborted, 'Preview probe timed out')
    } catch {
      throw new Error(`Preview HTTP probe failed for ${path}`)
    } finally {
      clearTimeout(timer)
      await response?.body?.cancel().catch(() => {})
    }
  }
  return { status: 'passed', url: origin, requests: routes.length }
}

async function inactive(api, context, description) {
  if (context.deploymentId != null) {
    requireThat(integer(context.deploymentId), 'Invalid GitHub deployment ID')
    await api(`deployments/${context.deploymentId}/statuses`, { state: 'inactive', log_url: runURL(context), auto_inactive: false, description })
  }
}

/** Call only after the workflow's HTTP probe passes. Never delete an old run's whole preview. */
export async function publish(context, receipt, result, api) {
  requireThat(integer(context?.deploymentId), 'Missing pending GitHub deployment')
  const urls = previewURLs(result, context.prNumber)
  let identity
  try { identity = await authorize(context, receipt, api) } catch {
    await inactive(api, context, 'Build identity changed; preview is not current')
    return { status: 'stale' }
  }
  if (identity.status !== 'deploy') {
    await inactive(api, context, 'PR changed or closed during deployment')
    return { status: identity.status }
  }
  await api(`deployments/${context.deploymentId}/statuses`, { state: 'success', environment_url: urls.url, log_url: runURL(context),
    auto_inactive: false, description: `UI and Worker merge ${identity.mergeSha.slice(0, 12)}` })
  await commitStatus(api, context, 'success', `UI and Worker ${identity.mergeSha.slice(0, 12)}`, urls.url)
  return { status: 'success', ...urls, currentMergeSha: identity.currentMergeSha }
}

export async function fail(context, receipt, api) {
  if (context?.deploymentId != null) {
    requireThat(integer(context.deploymentId), 'Invalid GitHub deployment ID')
    await api(`deployments/${context.deploymentId}/statuses`, { state: 'failure', log_url: runURL(context), auto_inactive: false,
      description: 'Update failed; stable URL may still serve an older build' })
  }
  let identity
  try { identity = await authorize(context, receipt, api) } catch {
    return { status: 'stale' }
  }
  if (identity.status === 'deploy') await commitStatus(api, context, 'failure', 'Update failed; existing preview may be an older build', runURL(context))
  return { status: identity.status === 'deploy' ? 'failure' : identity.status }
}

async function approvedDeploymentStarted(context, api) {
  const expected = context.receipt
  for (let page = 1; page <= 3; page++) {
    const deployments = await api(`deployments?environment=${encodeURIComponent(`preview/pr-${context.prNumber}`)}&sha=${expected.headSha}&per_page=100&page=${page}`)
    requireThat(Array.isArray(deployments), 'Invalid preview deployment listing')
    for (const deployment of deployments) {
      const payload = deployment.payload
      // Approval follows the code, so a newer CI run must also suppress a late notice.
      if (deployment.sha !== expected.headSha || payload?.preview !== 'lie-pr-preview' || payload.pr_number !== context.prNumber ||
        !['headSha', 'baseSha'].every(key => payload[key] === expected[key])) continue
      requireThat(integer(deployment.id), 'Invalid preview deployment ID')
      const statuses = await api(`deployments/${deployment.id}/statuses?per_page=1`)
      requireThat(Array.isArray(statuses) && statuses.length <= 1, 'Invalid latest deployment status listing')
      if (!['pending', 'queued', 'in_progress', 'success'].includes(statuses[0]?.state)) continue
      const commits = await mergeCommits(api, expected.mergeSha, payload.mergeSha)
      validateMergeEquivalence({ testedCommit: commits.mergeCommit, currentCommit: commits.currentMergeCommit,
        testedSha: expected.mergeSha, currentSha: payload.mergeSha, baseSha: expected.baseSha, headSha: expected.headSha })
      return true
    }
    if (deployments.length < 100) return false
    requireThat(page < 3, 'Preview deployment listing exceeds approval-notice bound')
  }
  return false
}

/** A waiting commit status grants no credentials and only links the trusted manual entry. */
export async function notice(context, api) {
  if (context?.action !== 'skip' || context.status !== 'awaiting-approval') return { status: 'skipped' }
  requireThat(integer(context.prNumber) && sha(context.receipt?.headSha), 'Invalid preview approval notice')
  const sameWaitingBuild = current => current.action === 'skip' && current.status === 'awaiting-approval' &&
    current.prNumber === context.prNumber && current.artifactId === context.artifactId && current.artifactDigest === context.artifactDigest &&
    ['headSha', 'baseSha', 'mergeSha', 'runId', 'runAttempt'].every(key => current.receipt?.[key] === context.receipt[key])
  const current = await prepare(context.event, api, publisherIdentity(context))
  if (!sameWaitingBuild(current)) return { status: 'stale' }
  if (await approvedDeploymentStarted(context, api)) return { status: 'already-approved' }
  const latest = await prepare(context.event, api, publisherIdentity(context))
  if (!sameWaitingBuild(latest)) return { status: 'stale' }
  await commitStatus(api, context, 'pending', `Preview requires approval of head ${context.receipt.headSha.slice(0, 12)}`,
    `https://github.com/${repository}/actions/workflows/pr-preview.yml`)
  return { status: 'awaiting-approval' }
}

export async function cleanupAuthorize(context, api) {
  requireThat(context?.action === 'cleanup' && integer(context.prNumber), 'Invalid cleanup context')
  const pr = await currentPull(api, context.prNumber)
  if (pr.state !== 'closed') return { status: 'reopened' }
  return { status: 'cleanup', previewName: validateClosedPreview(pr, context.prNumber), prNumber: pr.number }
}

/** Call only after successful cloud deletion/read-back; never touches R2 or provider resources. */
export async function cleanupReport(context, api) {
  const identity = await cleanupAuthorize(context, api)
  if (identity.status !== 'cleanup') return identity
  const deployments = []
  for (let page = 1; page <= 3; page++) {
    const items = await api(`deployments?environment=${encodeURIComponent(`preview/pr-${context.prNumber}`)}&per_page=100&page=${page}`)
    requireThat(Array.isArray(items), 'Invalid deployment listing')
    deployments.push(...items)
    if (items.length < 100) break
    requireThat(page < 3, 'Preview deployment listing exceeds cleanup bound')
  }
  for (const deployment of deployments) {
    requireThat(integer(deployment.id), 'Invalid deployment ID')
    if (deployment.payload?.preview !== 'lie-pr-preview' || deployment.payload?.pr_number !== context.prNumber) continue
    await inactive(api, { ...context, deploymentId: String(deployment.id) }, 'PR closed; preview removed')
  }
  return { status: 'cleaned', count: deployments.length }
}

export async function outputs(values, path) {
  if (path == null) return
  for (const [key, value] of Object.entries(values)) {
    requireThat(/^[a-z_]+$/.test(key) && !/[\r\n]/.test(String(value)), 'Unsafe GitHub output')
    await appendFile(path, `${key}=${value}\n`)
  }
}

async function save(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 })
}

async function successSummary(path, context, receipt, result, currentMergeSha) {
  if (path == null) return
  const urls = previewURLs(result, context.prNumber)
  requireThat(integer(context.prNumber) && integer(receipt.runId) && integer(receipt.runAttempt) &&
    sha(receipt.headSha) && sha(receipt.mergeSha) && sha(currentMergeSha), 'Invalid preview summary identity')
  const publisher = publisherIdentity(context)
  const links = [`- Stable preview: [${urls.url}](${urls.url})`]
  links.push(...urls.immutableURLs.map(url => `- Immutable deployment: [${url}](${url})`))
  links.push(`- PR head: \`${receipt.headSha}\``, `- Tested UI and Worker merge: \`${receipt.mergeSha}\``,
    `- Current PR merge (content equivalent): \`${currentMergeSha}\``,
    `- Producer CI: [run ${receipt.runId}, attempt ${receipt.runAttempt}](https://github.com/${repository}/actions/runs/${receipt.runId})`,
    `- Publisher: [run ${publisher.publisherRunId}, attempt ${publisher.publisherRunAttempt}](${runURL(context)})`)
  await appendFile(path, `\n### PR #${context.prNumber} preview\n\n${links.join('\n')}\n`)
}

async function failureSummary(path, context) {
  if (path == null) return
  requireThat(integer(context.prNumber), 'Invalid preview failure identity')
  await appendFile(path, `\n### PR #${context.prNumber} preview update failed\n\nThe stable URL may still serve an older build. [Publisher logs](${runURL(context)}).\n`)
}

export async function main(command, env = process.env, fetcher = fetch) {
  requireThat(env.GITHUB_REPOSITORY === repository, 'Publisher requires nighca/lie')
  const api = command === 'probe' ? null : githubClient(env.GH_TOKEN, fetcher)
  const contextFile = resolve(env.PR_PREVIEW_CONTEXT_FILE ?? 'tmp/pr-preview-context.json')
  const identityFile = resolve(env.PR_PREVIEW_IDENTITY_FILE ?? 'tmp/pr-preview-identity.json')
  const receiptFile = resolve(env.PR_PREVIEW_ARTIFACT_DIR ?? `${env.RUNNER_TEMP ?? 'tmp'}/pr-preview-artifact`, 'receipt.json')
  const publisher = () => publisherIdentity({ publisherRunId: env.GITHUB_RUN_ID, publisherRunAttempt: env.GITHUB_RUN_ATTEMPT })
  if (command === 'prepare') {
    requireThat(['workflow_run', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME), 'Unexpected publisher event')
    const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'))
    const context = await prepare(event, api, publisher())
    if (env.SELECTED_PR_NUMBER != null) requireThat(integer(env.SELECTED_PR_NUMBER) && Number(env.SELECTED_PR_NUMBER) === context.prNumber, 'Selected PR changed between publisher jobs')
    await save(contextFile, context)
    await outputs({ action: context.action, status: context.status, pr_number: context.prNumber,
      artifact_id: context.artifactId ?? '', run_id: context.runId ?? '', run_attempt: context.runAttempt ?? '', context_file: contextFile, identity_file: identityFile }, env.GITHUB_OUTPUT)
    return context
  }
  const context = JSON.parse(await readFile(contextFile, 'utf8'))
  const currentPublisher = publisher()
  requireThat(context.publisherRunId === currentPublisher.publisherRunId && context.publisherRunAttempt === currentPublisher.publisherRunAttempt, 'Preview context belongs to another publisher run')
  if (command === 'probe') {
    const result = JSON.parse(await readFile(env.PR_PREVIEW_DEPLOYMENT_FILE ?? 'tmp/pr-preview-deployment.json', 'utf8'))
    return probe(context, result, fetcher)
  }
  if (context.event != null && context.event.workflow_run == null) {
    requireThat(env.GITHUB_EVENT_NAME === 'workflow_dispatch', 'Manual context requires the current workflow_dispatch event')
    const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'))
    requireThat(event.workflow_run == null && event.ref === 'refs/heads/main' && event.repository?.id === context.event?.repository?.id &&
      event.repository?.full_name === repository && event.inputs?.pr_number === context.event?.inputs?.pr_number &&
      event.inputs?.head_sha === context.event?.inputs?.head_sha, 'Manual context does not match the current GitHub event')
  }
  if (command === 'cleanup-authorize') {
    const result = await cleanupAuthorize(context, api)
    await outputs({ current: String(result.status === 'cleanup'), preview_name: result.previewName ?? '' }, env.GITHUB_OUTPUT)
    return result
  }
  if (command === 'cleanup-report') {
    requireThat(env.PR_PREVIEW_DELETE_CONFIRMED === 'true', 'Cloud preview deletion has not been confirmed')
    return cleanupReport(context, api)
  }
  if (command === 'notice') return notice(context, api)
  const receipt = JSON.parse(await readFile(receiptFile, 'utf8'))
  if (command === 'authorize' || command === 'recheck') {
    const result = await authorize(context, receipt, api)
    if (result.status === 'deploy') {
      await save(identityFile, { version: 1, repository, ...result })
    }
    await outputs({ current: String(result.status === 'deploy'), identity_file: identityFile }, env.GITHUB_OUTPUT)
    return result
  }
  if (command === 'pending') {
    const result = await pending(context, receipt, api, { onDeploymentCreated: created => save(contextFile, created) })
    await save(contextFile, result)
    await outputs({ current: String(result.deploymentId != null), deployment_id: result.deploymentId ?? '' }, env.GITHUB_OUTPUT)
    return result
  }
  if (command === 'publish') {
    const result = JSON.parse(await readFile(env.PR_PREVIEW_DEPLOYMENT_FILE ?? 'tmp/pr-preview-deployment.json', 'utf8'))
    const published = await publish(context, receipt, result, api)
    if (published.status === 'success') await successSummary(env.GITHUB_STEP_SUMMARY, context, receipt, result, published.currentMergeSha)
    return published
  }
  if (command === 'fail') {
    const failed = await fail(context, receipt, api)
    await failureSummary(env.GITHUB_STEP_SUMMARY, context)
    return failed
  }
  throw new Error('Expected prepare, authorize, recheck, pending, probe, publish, fail, notice, cleanup-authorize or cleanup-report')
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv[2])
}
