import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import { runReconciliation } from './reconcile.mjs'

test('reconciliation import and missing flag cannot start a request', async () => {
  let called = false
  await assert.rejects(runReconciliation({ request: async () => { called = true } }), /read-only turn/)
  assert.equal(called, false)
})

async function fixture(responseBody, { hugeBody = false, fail = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'lie-reconcile-offline-'))
  try {
    const statePath = join(dir, 'state.json'), keyPath = join(dir, 'key'), reportPath = join(dir, 'result.json')
    const before = { owner: 'lie-p0-token-share-2026-11-01', agentName: 'LIE-P0-token-share-1234567890123-abcdef',
      agentId: null, createAttempted: true, devices: [], cleanupComplete: false, preserved: 'PRIVATE-STATE' }
    await writeFile(statePath, JSON.stringify(before), { mode: 0o600 })
    await writeFile(keyPath, 'PRIVATE-KEY', { mode: 0o600 })
    const calls = []
    const summary = await runReconciliation({ approval: 'single-readonly-reconciliation-turn-approved', keyPath, statePath, reportPath,
      request: async (url, options) => {
        calls.push({ url, options })
        if (fail) throw new Error('PRIVATE-TRANSPORT-ERROR')
        return new Response(hugeBody ? 'X'.repeat(256 * 1024 + 1) : JSON.stringify(responseBody), { status: 200, headers: { 'Content-Type': 'application/json' } })
      } })
    const after = JSON.parse(await readFile(statePath, 'utf8'))
    const report = await readFile(reportPath, 'utf8')
    assert.equal(report.includes('PRIVATE'), false)
    assert.equal(report.includes(before.agentName), false)
    assert.equal(report.includes('abcdefabcdefabcdefabcdefabcdefab'), false)
    assert.equal((await stat(statePath)).mode & 0o777, 0o600)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://xrobo.qiniu.com/xiaozhi/agent/list?limit=20')
    assert.equal(calls[0].options.method, 'GET')
    assert.equal(calls[0].options.redirect, 'error')
    assert.deepEqual(Object.keys(summary), ['httpStatus', 'businessCode', 'match', 'hasMore'])
    return { before, after, summary }
  } finally { await rm(dir, { recursive: true, force: true }) }
}

const matched = { id: 'abcdefabcdefabcdefabcdefabcdefab', agentName: 'LIE-P0-token-share-1234567890123-abcdef', systemPrompt: 'PRIVATE-PROMPT' }

test('one exact match atomically records only ID and preserves prior ownership fields', async () => {
  const { before, after, summary } = await fixture({ code: 0, data: [matched, { agentName: 'PRIVATE-UNRELATED' }], nextCursor: null })
  assert.deepEqual(summary, { httpStatus: 200, businessCode: 0, match: 1, hasMore: false })
  assert.deepEqual(after, { ...before, agentId: matched.id })
})

test('zero and duplicate matches stop after one page without changing ownership state', async () => {
  const none = await fixture({ code: 0, data: [{ agentName: 'PRIVATE-UNRELATED' }], nextCursor: 'a'.repeat(32) })
  assert.deepEqual(none.summary, { httpStatus: 200, businessCode: 0, match: 0, hasMore: true })
  assert.deepEqual(none.before, none.after)
  const duplicate = await fixture({ code: 0, data: [matched, matched], nextCursor: null })
  assert.equal(duplicate.summary.match, 'multiple')
  assert.deepEqual(duplicate.before, duplicate.after)
})

test('oversized, invalid pagination and network failures do not imply no match or mutate state', async () => {
  for (const options of [{ hugeBody: true }, { fail: true }, {}]) {
    const result = await fixture({ code: 0, data: [matched], nextCursor: 'PRIVATE-INVALID' }, options)
    assert.equal(result.summary.match, null)
    assert.deepEqual(result.before, result.after)
  }
})
