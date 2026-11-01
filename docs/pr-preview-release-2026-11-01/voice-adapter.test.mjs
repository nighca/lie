import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'

import { adaptVoiceRunner, prepareVoiceAdapter } from './prepare-voice-adapter.mjs'
import { previewTarget } from './verify-voice-preview.mjs'

const source = name => execFileSync('git', ['show', `cbc88f474db2a103af2c50a0c016571a9ae0c58e:docs/reviews/device-concurrency-2026-11-01/${name}`], { encoding: 'utf8' })

test('thin adaptation retains reviewed logic while reducing budgets and replacing production identity', () => {
  const adapted = adaptVoiceRunner(source('release-api-v2.mjs'))
  for (const text of ['90000', '88000', "d.environment !== 'production:https'", 'productionCandidate = false', 'production-cookie-secret']) assert.ok(!adapted.includes(text))
  for (const text of ['(cleanup ? 30 : 26)', 'this.c.logical >= 4', 'this.c.upgrades + 2 > 8', 'd.environment !== deviceEnvironment',
    'origin !== approvedPreviewOrigin', 'if (mode === \'smoke\') throw', 'canUnbind(jar)', 'Normal socket close not confirmed before unbind']) assert.ok(adapted.includes(text))
  assert.throws(() => adaptVoiceRunner('unreviewed source'))
})

test('only the explicit stable PR origin is accepted, with matching namespace', () => {
  assert.deepEqual(previewTarget('https://pr-42-lie-pr-preview.example.workers.dev', 42), { origin: 'https://pr-42-lie-pr-preview.example.workers.dev', environment: 'pr-42:https' })
  for (const url of ['https://lie.agency', 'https://pr-43-lie-pr-preview.example.workers.dev', 'http://pr-42-lie-pr-preview.example.workers.dev', 'https://user@pr-42-lie-pr-preview.example.workers.dev', 'https://pr-42-lie-pr-preview.example.workers.dev/?token=x']) assert.throws(() => previewTarget(url, 42))
})

test('prepared reviewed runner enforces 4 WS/8 upgrades/30 HTTP/60 socket seconds without network', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-voice-adapter-test-'))
  try {
    await prepareVoiceAdapter(directory, source)
    // The reviewed dependency is resolved from the project, not a remote installation.
    const { symlink } = await import('node:fs/promises')
    await symlink(join(process.cwd(), 'node_modules'), join(directory, 'node_modules'))
    const { Budget } = await import(pathToFileURL(join(directory, 'release-api-v2.mjs')))
    const budget = new Budget()
    for (let index = 0; index < 4; index++) budget.ws()
    assert.equal(budget.c.logical, 4)
    assert.equal(budget.c.upgrades, 8)
    assert.throws(() => budget.ws())
    const atCap = new Budget({ socketMs: 60000 })
    assert.throws(() => atCap.ws())
    const http = new Budget()
    http.http(26)
    assert.throws(() => http.http(1))
    http.http(4, true)
    assert.throws(() => http.http(1, true))
    assert.ok((await readFile(join(directory, 'release-api-v2.mjs'), 'utf8')).includes('58000'))
  } finally { await rm(directory, { recursive: true, force: true }) }
})
