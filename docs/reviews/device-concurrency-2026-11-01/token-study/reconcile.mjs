import { readFile, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const endpoint = 'https://xrobo.qiniu.com/xiaozhi/agent/list?limit=20'
const owner = 'lie-p0-token-share-2026-11-01'
const bodyLimit = 256 * 1024

async function limitedJSON(response, signal) {
  const declared = Number(response.headers.get('Content-Length'))
  if (Number.isFinite(declared) && declared > bodyLimit) throw new Error('Body limit')
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Missing body')
  let total = 0
  const chunks = []
  try {
    while (true) {
      signal.throwIfAborted()
      const next = await reader.read()
      signal.throwIfAborted()
      if (next.done) break
      total += next.value.byteLength
      if (total > bodyLimit) throw new Error('Body limit')
      chunks.push(next.value)
    }
    return JSON.parse(Buffer.concat(chunks, total).toString('utf8'))
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
}

export async function runReconciliation({ approval, keyPath, statePath, reportPath, request = globalThis.fetch }) {
  if (approval !== 'single-readonly-reconciliation-turn-approved') throw new Error('Missing specific read-only turn')
  const summary = { httpStatus: null, businessCode: null, match: null, hasMore: null }
  const signal = AbortSignal.timeout(15000)
  try {
    const stateMode = (await stat(statePath)).mode & 0o777
    const original = await readFile(statePath, 'utf8')
    const state = JSON.parse(original)
    if (stateMode !== 0o600 || state.owner !== owner || state.createAttempted !== true || state.agentId !== null ||
      !Array.isArray(state.devices) || state.devices.length !== 0 || state.cleanupComplete !== false ||
      !/^LIE-P0-token-share-\d{13}-[a-f0-9]{6}$/.test(state.agentName)) throw new Error('Unexpected ownership state')
    const key = (await readFile(keyPath, 'utf8')).trim()
    if (!key) throw new Error('Missing approved key')
    signal.throwIfAborted()
    const response = await request(endpoint, { method: 'GET', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      redirect: 'error', signal })
    summary.httpStatus = response.status
    const body = await limitedJSON(response, signal)
    summary.businessCode = Number.isSafeInteger(body?.code) ? body.code : null
    if (!response.ok || body?.code !== 0 || !Array.isArray(body.data) || body.data.length > 20 ||
      !(body.nextCursor === null || (typeof body.nextCursor === 'string' && /^[a-f0-9]{32}$/.test(body.nextCursor)))) throw new Error('Rejected response')
    summary.hasMore = body.nextCursor !== null
    const matches = body.data.filter(row => row != null && row.agentName === state.agentName)
    if (matches.length === 0) summary.match = 0
    else if (matches.length > 1) summary.match = 'multiple'
    else {
      if (typeof matches[0].id !== 'string' || !/^[a-f0-9]{32}$/.test(matches[0].id)) throw new Error('Invalid matched ID')
      signal.throwIfAborted()
      if ((await stat(statePath)).mode & 0o077 || await readFile(statePath, 'utf8') !== original) throw new Error('Ownership state changed')
      const temporary = resolve(dirname(statePath), `.reconcile-state-${randomUUID()}.json`)
      try {
        await writeFile(temporary, JSON.stringify({ ...state, agentId: matches[0].id }), { flag: 'wx', mode: 0o600 })
        signal.throwIfAborted()
        await rename(temporary, statePath)
      } finally { await unlink(temporary).catch(() => {}) }
      summary.match = 1
    }
  } catch { /* Null match means no trustworthy lookup result; do not infer absence. */ }
  await writeFile(reportPath, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  return summary
}

// This flag identifies a granted read-only turn; importing or default execution does nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href &&
  process.argv.length === 3 && process.argv[2] === '--execute-readonly-approved') {
  try {
    const root = resolve(import.meta.dirname, '../../../..')
    const summary = await runReconciliation({ approval: 'single-readonly-reconciliation-turn-approved',
      keyPath: '/Users/nighca/code/nighca/lie/.linx-api-key', statePath: resolve(root, 'tmp/p0-token-study-run01/state.json'),
      reportPath: resolve(import.meta.dirname, 'reconciliation-result.json') })
    console.log(JSON.stringify(summary))
    if (summary.match == null) process.exitCode = 1
  } catch {
    console.log(JSON.stringify({ httpStatus: null, businessCode: null, match: null, hasMore: null }))
    process.exitCode = 1
  }
}
