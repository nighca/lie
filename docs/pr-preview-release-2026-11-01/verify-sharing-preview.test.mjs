import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { verifySharing } from './verify-sharing-preview.mjs'

test('the exact six-request acceptance retains both snapshots and stable duplicate IDs', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-sharing-method-'))
  try {
    const objects = new Map(), methods = []
    const result = await verifySharing('https://pr-42-lie-pr-preview.example.workers.dev', 42, join(directory, 'ledger.json'), async (url, options) => {
      methods.push(options.method)
      assert.equal(options.redirect, 'manual')
      assert.ok(url.startsWith('https://pr-42-lie-pr-preview.example.workers.dev/api/shared-games/v1'))
      if (options.method === 'POST') {
        const id = createHash('sha256').update(options.body).digest().subarray(0, 16).toString('base64url')
        objects.set(id, JSON.parse(options.body))
        return Response.json({ id })
      }
      return Response.json(objects.get(url.split('/').at(-1)))
    }, 'synthetic-method-test')
    assert.equal(result.requests, 6)
    assert.equal(result.passed, true)
    assert.equal(objects.size, 2)
    assert.notEqual(...result.caseIds)
    assert.deepEqual(methods, ['POST', 'GET', 'POST', 'POST', 'GET', 'GET'])
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('a failed response stops without retry and records its possibly committed request', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-sharing-failure-'))
  try {
    const path = join(directory, 'ledger.json')
    let calls = 0
    await assert.rejects(verifySharing('https://pr-42-lie-pr-preview.example.workers.dev', 42, path, async () => { calls++; throw Error('Unknown response') }))
    assert.equal(calls, 1)
    const ledger = JSON.parse(await readFile(path, 'utf8'))
    assert.equal(ledger.requests, 1)
    assert.equal(ledger.unknownRequest.method, 'POST')
    assert.equal(ledger.passed, false)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
