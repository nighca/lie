import { createRequire } from 'node:module'
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { randomUUID } from 'node:crypto'
import { matrix } from './matrix.mjs'
import { approvedPrompt, expectedModelId, hash, limits } from './settings.mjs'
import { cleanupOwned, freshState, verifyOwner, withOwnedResources } from './owned-resources.mjs'
import { collectAnswer } from './answer.mjs'

async function main() {
  const args = process.argv.slice(2)
  const execute = args.includes('--execute-reviewed')
  const cleanup = args.includes('--cleanup-reviewed')
  if (execute === cleanup) throw new Error('choose-execute-or-cleanup')
  const keyIndex = args.indexOf('--key-file')
  if (keyIndex < 0 || !args[keyIndex + 1] || args[keyIndex + 1].startsWith('--')) throw new Error('missing-key-file')
  const temporary = new URL('./tmp/', import.meta.url)
  await mkdir(temporary, { recursive: true })
  const statePath = new URL('owned-state.json', temporary)
  const key = (await readFile(args[keyIndex + 1], 'utf8')).trim()
  async function api(operation, path, method = 'GET', body = null) {
    const response = await fetch(`https://xrobo.qiniu.com${path}`, { method, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: body == null ? null : JSON.stringify(body), signal: AbortSignal.timeout(20_000) })
    const raw = await response.text()
    if (Buffer.byteLength(raw) > 1_048_576) throw new Error('api-response-too-large')
    const result = JSON.parse(raw)
    console.log(JSON.stringify({ operation, status: response.status, code: result.code ?? null }))
    if (!response.ok || result.code !== 0) throw new Error('api-rejected')
    return result
  }
  async function save(state) { verifyOwner(state); const next = new URL('owned-state.next.json', temporary); await writeFile(next, JSON.stringify(state), { mode: 0o600 }); await rename(next, statePath) }
  const remove = () => unlink(statePath)
  if (cleanup) { const state = JSON.parse(await readFile(statePath, 'utf8')); await cleanupOwned(state, { api, save, remove }); console.log(JSON.stringify({ cleanup: 'complete' })); return }
  const metadata = JSON.parse(await readFile(new URL('metadata.json', temporary), 'utf8'))
  const systemPrompt = await approvedPrompt()
  const metadataAge = Date.now() - Date.parse(metadata.capturedAt)
  if (!Number.isFinite(metadataAge) || metadataAge < 0 || metadata.llmModelId !== expectedModelId || !metadata.modelMatchedExpected || !metadata.genericPromptMatchesSource || metadata.genericPromptHash !== hash(systemPrompt) || metadata.memModelId !== 'Memory_nomem' || metadata.chatHistoryConf !== 0 || typeof metadata.ttsVoiceId !== 'string' || !metadata.ttsVoiceId || metadataAge > 86_400_000) throw new Error('metadata-not-approved-or-stale')
  const hashes = JSON.parse(await readFile(new URL('prepared-hashes.json', temporary), 'utf8'))
  for (const [path, expected] of Object.entries(hashes)) if (hash(await readFile(new URL(`../../${path}`, import.meta.url))) !== expected) throw new Error('prepared-context-stale')
  const contexts = JSON.parse(await readFile(new URL('prepared-contexts.json', temporary), 'utf8'))
  if (contexts.length !== limits.answers || matrix.length !== limits.answers || contexts.some((item, index) => item.id !== matrix[index].id || item.question !== matrix[index].question || item.gameId !== matrix[index].gameId || item.characterId !== matrix[index].characterId)) throw new Error('prepared-context-mismatch')
  const require = createRequire(process.env.LIE_DEPENDENCY_ROOT ?? new URL('../../package.json', import.meta.url))
  const WebSocket = require('ws')
  const ledger = await open(new URL('execution-attempt.json', temporary), 'wx', 0o600)
  await ledger.writeFile(JSON.stringify({ at: new Date().toISOString(), maxAnswers: limits.answers })); await ledger.close()
  const state = freshState()
  const stateFile = await open(statePath, 'wx', 0o600); await stateFile.writeFile(JSON.stringify(state)); await stateFile.close()
  const abort = new AbortController()
  const onSignal = () => abort.abort()
  process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal)
  const results = []
  async function saveResults() { const next = new URL('live-results.next.json', temporary); await writeFile(next, JSON.stringify(results, null, 2), { mode: 0o600 }); await rename(next, new URL('live-results.json', temporary)) }
  try {
    await withOwnedResources(state, {
      api, save, remove, signal: abort.signal, config: { llmModelId: metadata.llmModelId, ttsVoiceId: metadata.ttsVoiceId, systemPrompt },
      async ota(device) {
        const response = await fetch('https://xrobo.qiniuapi.com/v1/ota/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Activation-Version': '1', 'Device-Id': device.mac, 'Client-Id': device.client, 'User-Agent': 'lie-case-live/0.1' }, body: JSON.stringify({ mac_address: device.mac, uuid: device.client, application: { version: '0.1.0', elf_sha256: '0'.repeat(64) }, board: { type: 'lie-game-test', ssid: 'test', rssi: 0 } }), signal: AbortSignal.timeout(20_000) })
        if (!response.ok) throw new Error('ota-failed')
        return response.json()
      },
    }, async owned => {
      for (const [index, row] of matrix.entries()) {
        if (abort.signal.aborted || results.length >= limits.answers) throw new Error('execution-aborted')
        const device = owned.devices.find(item => item.identity === `${row.gameId}/${row.characterId}`)
        const record = { id: row.id, gameId: row.gameId, characterId: row.characterId, question: row.question, verdict: 'PENDING', output: null, protocol: null, reason: null }
        try {
          const answer = await collectAnswer({ createSocket: (...args) => new WebSocket(...args), device: { ...device, client: randomUUID() }, agentId: owned.agentId, question: row.question, readContext: () => contexts[index].context, signal: abort.signal })
          const { output, ...protocol } = answer
          record.output = output; record.protocol = protocol
          results.push(record); await saveResults()
          console.log(JSON.stringify({ id: row.id, question: row.question, output: answer.output, criteria: { pass: row.pass, fail: row.fail } }))
          const review = createInterface({ input: process.stdin, output: process.stdout })
          let decision
          try { decision = (await review.question('Read saved answer. PASS / FAIL / UNCERTAIN: ', { signal: abort.signal })).trim() } finally { review.close() }
          record.verdict = ['PASS', 'FAIL', 'UNCERTAIN'].includes(decision) ? decision : 'UNCERTAIN'
          await saveResults()
          if (record.verdict !== 'PASS') throw new Error('semantic-stop')
        } catch (error) {
          if (!results.includes(record)) { record.verdict = 'PROTOCOL_FAILURE'; record.reason = ['answer-timeout', 'transport', 'early-close', 'audio-flood', 'message-flood', 'output-flood', 'multiple-answers', 'stt-mismatch', 'hello-invalid', 'quota', 'context-order-or-flood', 'context-too-large', 'unexpected-tool', 'repeated-tools-list', 'answer-incomplete', 'protocol', 'execution-aborted', 'send-failed'].includes(error.message) ? error.message : 'sample-failed'; record.protocol = error.protocol ?? null; results.push(record); await saveResults() }
          else if (record.verdict === 'PENDING') { record.verdict = 'UNCERTAIN'; record.reason = 'review-interrupted'; await saveResults() }
          throw new Error('run-stopped')
        }
      }
    })
    console.log(JSON.stringify({ completed: results.length, cleanup: 'complete', inferenceRetry: false }))
  } finally { process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal) }
}
main().catch(() => { console.error(JSON.stringify({ stopped: true, retry: false, inspectOwnedStateIfPresent: true })); process.exitCode = 1 })
