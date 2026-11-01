import assert from 'node:assert/strict'
import { lstat, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { configureRuntimeSecrets } from './configure-runtime-secrets.mjs'

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), 'lie-preview-secret-method-'))
  try {
    const source = join(directory, 'approved-development.vars'), state = join(directory, 'private')
    await writeFile(source, 'LINX_API_KEY="fake-api-key"\nLINX_AGENT_ID=fake-agent\nLINX_WS_TOKEN=fake-ws\nUNRELATED=fake-unrelated\n', { mode: 0o600 })
    await run({ directory, source, state })
  } finally { await rm(directory, { recursive: true, force: true }) }
}

test('writes only four preview fields via stdin and preserves a private signing source', async () => fixture(async ({ source, state }) => {
  const calls = []
  const result = await configureRuntimeSecrets(source, state, (executable, args, options) => {
    assert.equal(executable, 'gh')
    assert.deepEqual(args.slice(-4), ['--repo', 'nighca/lie', '--env', 'pr-preview'])
    assert.ok(!JSON.stringify(args).includes('fake-'))
    assert.ok(!JSON.stringify(options).includes('fake-unrelated'))
    calls.push({ args, input: options.input })
  })
  assert.deepEqual(calls.map(call => call.args[2]), ['PR_PREVIEW_LINX_API_KEY', 'PR_PREVIEW_LINX_AGENT_ID', 'PR_PREVIEW_LINX_WS_TOKEN', 'PR_PREVIEW_VOICE_DEVICE_COOKIE_SECRET'])
  assert.deepEqual(calls.slice(0, 3).map(call => call.input), ['fake-api-key', 'fake-agent', 'fake-ws'])
  assert.ok(Buffer.byteLength(calls[3].input) >= 32)
  assert.equal((await lstat(state)).mode & 0o777, 0o700)
  assert.equal((await lstat(join(state, 'cookie-signing.key'))).mode & 0o777, 0o600)
  assert.equal(await readFile(join(state, 'cookie-signing.key'), 'utf8'), calls[3].input)
  assert.ok(!JSON.stringify(result).includes('fake-'))
  let reused
  await configureRuntimeSecrets(source, state, (_executable, args, options) => { if (args[2] === 'PR_PREVIEW_VOICE_DEVICE_COOKIE_SECRET') reused = options.input })
  assert.equal(reused, calls[3].input)
}))

test('failure stops once and does not expose child error or secret values', async () => fixture(async ({ source, state }) => {
  let calls = 0
  await assert.rejects(configureRuntimeSecrets(source, state, () => { calls++; throw new Error('fake-api-key opaque child output') }), error => {
    assert.ok(!error.message.includes('fake-api-key'))
    return true
  })
  assert.equal(calls, 1)
  const saved = JSON.parse(await readFile(join(state, 'configuration-result.json'), 'utf8'))
  assert.deepEqual(saved.configured, [])
  assert.equal(saved.unknownField, 'PR_PREVIEW_LINX_API_KEY')
}))

for (const [name, content] of [
  ['duplicate assignment', 'LINX_API_KEY=fake-one\nLINX_API_KEY=fake-two\nLINX_AGENT_ID=fake-agent\nLINX_WS_TOKEN=fake-ws\n'],
  ['duplicate export', 'LINX_API_KEY=fake-one\nexport LINX_API_KEY=fake-two\nLINX_AGENT_ID=fake-agent\nLINX_WS_TOKEN=fake-ws\n'],
  ['empty value', 'LINX_API_KEY=\nLINX_AGENT_ID=fake-agent\nLINX_WS_TOKEN=fake-ws\n'],
  ['control character', 'LINX_API_KEY="fake\tkey"\nLINX_AGENT_ID=fake-agent\nLINX_WS_TOKEN=fake-ws\n'],
  ['embedded whitespace', 'LINX_API_KEY="fake key"\nLINX_AGENT_ID=fake-agent\nLINX_WS_TOKEN=fake-ws\n']
]) test(`refuses ${name} before any secret write`, async () => fixture(async ({ source, state }) => {
  await writeFile(source, content, { mode: 0o600 })
  let calls = 0
  await assert.rejects(configureRuntimeSecrets(source, state, () => { calls++ }))
  assert.equal(calls, 0)
}))

test('unapproved-shaped paths, symlink sources and missing fields never start gh', async () => fixture(async ({ directory, source, state }) => {
  let calls = 0
  const run = () => { calls++ }
  await assert.rejects(configureRuntimeSecrets('relative.vars', state, run))
  const link = join(directory, 'source-link')
  await symlink(source, link)
  await assert.rejects(configureRuntimeSecrets(link, state, run))
  await writeFile(source, 'LINX_API_KEY=fake-api-only\n', { mode: 0o600 })
  await assert.rejects(configureRuntimeSecrets(source, state, run))
  assert.equal(calls, 0)
}))
