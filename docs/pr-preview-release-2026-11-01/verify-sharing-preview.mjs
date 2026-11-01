import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { previewTarget } from './verify-voice-preview.mjs'

export async function verifySharing(origin, prNumber, ledgerPath, request = fetch, seed = new Date().toISOString()) {
  const target = previewTarget(origin, prNumber)
  const first = { id: `pr-preview-${prNumber}-${seed}`, title: 'PR 预览合成案件一', background: '只用于预览存储验收的合成背景。', interrogationLimitSeconds: 60,
    characters: [{ id: 'a', name: '合成甲', profile: '合成角色甲。', appearanceId: 'coral-bob' }, { id: 'b', name: '合成乙', profile: '合成角色乙。', appearanceId: null }],
    ending: { culpritId: 'a', reveal: '合成测试经过。' } }
  const second = { ...first, title: 'PR 预览合成案件二' }
  const canonical = [first, second].map(value => JSON.stringify(value))
  const ids = canonical.map(value => createHash('sha256').update(value).digest().subarray(0, 16).toString('base64url'))
  const ledger = { origin: target.origin, prNumber: Number(prNumber), seed, requests: 0, unknownRequest: null, completed: [], caseIds: ids, passed: false }
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2), { flag: 'wx', mode: 0o600 })
  async function call(method, path, body, expected) {
    if (ledger.requests >= 6) throw Error('Sharing request limit reached')
    ledger.requests++
    ledger.unknownRequest = { method, path }
    await writeFile(ledgerPath, JSON.stringify(ledger, null, 2), { mode: 0o600 })
    const response = await request(target.origin + path, { method, redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { Origin: target.origin, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, ...(body == null ? {} : { body }) })
    if (response.status !== 200 || !response.headers.get('Content-Type')?.includes('application/json')) { await response.body?.cancel(); throw Error('Sharing response status or content type failed') }
    const reader = response.body?.getReader()
    if (reader == null) throw Error('Sharing response body missing')
    let bytes = 0, text = ''
    const decoder = new TextDecoder()
    try {
      while (true) {
        const value = await reader.read()
        if (value.done) break
        bytes += value.value.byteLength
        if (bytes > 65536) { await reader.cancel(); throw Error('Sharing response too large') }
        text += decoder.decode(value.value, { stream: true })
      }
      text += decoder.decode()
    } finally { reader.releaseLock() }
    if (JSON.stringify(JSON.parse(text)) !== JSON.stringify(expected)) throw Error('Sharing content identity mismatch')
    ledger.completed.push({ method, path })
    ledger.unknownRequest = null
    await writeFile(ledgerPath, JSON.stringify(ledger, null, 2), { mode: 0o600 })
  }
  const api = '/api/shared-games/v1'
  await call('POST', api, canonical[0], { id: ids[0] })
  await call('GET', `${api}/${ids[0]}`, null, first)
  await call('POST', api, canonical[0], { id: ids[0] })
  await call('POST', api, canonical[1], { id: ids[1] })
  await call('GET', `${api}/${ids[0]}`, null, first)
  await call('GET', `${api}/${ids[1]}`, null, second)
  ledger.passed = true
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2), { mode: 0o600 })
  return { passed: true, requests: ledger.requests, caseIds: ids, duplicateStable: true, oldSnapshotPreserved: true }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length !== 3) throw Error('Explicit PR origin, PR number and private ledger path required')
  verifySharing(args[0], args[1], resolve(args[2])).then(value => console.log(JSON.stringify(value))).catch(() => {
    console.error('Sharing acceptance stopped; ledger preserves sent requests and unknown response')
    process.exitCode = 1
  })
}
