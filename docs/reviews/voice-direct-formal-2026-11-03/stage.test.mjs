import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { stage } from './stage.mjs'

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'formal-stage-test-'))
  const build = join(directory, 'build'), relative = 'v0/workers/default/worker.config.json'
  await mkdir(join(build, 'v0/workers/default'), { recursive: true })
  await writeFile(join(build, 'v0/config.json'), JSON.stringify({ buildContext: { mode: 'preview', isPreview: true } }))
  const worker = { name: 'lie-pr-preview', env: {
    ASSETS: { type: 'assets' }, LINX_API_KEY: { type: 'secret' }, LINX_AGENT_ID: { type: 'secret' }, VOICE_DEVICE_COOKIE_SECRET: { type: 'secret' },
    VOICE_DEVICE_ENVIRONMENT: { type: 'text', value: 'direct-formal-20261103-v1' }, VOICE_MAX_SESSION_SECONDS: { type: 'text', value: '600' },
    VOICE_TRANSPORT: { type: 'text', value: 'direct' }, PRIVATE_PREVIEW_EXPIRES_AT: { type: 'text', value: '0' }
  } }
  await writeFile(join(build, relative), JSON.stringify(worker))
  const values = { apiKey: 'fake-management-key', agentId: 'a'.repeat(32), cookieSecret: 'fake-cookie-secret-that-is-at-least-32-bytes', expiresAt: new Date(Date.now() + 3600000).toISOString() }
  return { directory, build, relative, worker, values, destination: join(directory, 'stage') }
}

test('stages only the exact formal preview bindings and retains the approved absolute expiry', async () => {
  const f = await fixture()
  try {
    const result = await stage(f.build, f.values, f.destination)
    assert.equal(result.bindingCount, 8)
    assert.equal(JSON.stringify(result).includes(f.values.apiKey), false)
    const output = join(f.destination, '.cloudflare/output', f.relative)
    const worker = JSON.parse(await readFile(output, 'utf8'))
    assert.deepEqual(worker.env.LINX_API_KEY, { type: 'unsafe:secret_text', text: f.values.apiKey })
    assert.deepEqual(worker.env.LINX_AGENT_ID, { type: 'unsafe:secret_text', text: f.values.agentId })
    assert.deepEqual(worker.env.VOICE_DEVICE_COOKIE_SECRET, { type: 'unsafe:secret_text', text: f.values.cookieSecret })
    assert.equal(worker.env.PRIVATE_PREVIEW_EXPIRES_AT.value, f.values.expiresAt)
    assert.equal(Object.hasOwn(worker.env, 'LINX_WS_TOKEN'), false)
    assert.equal(Object.hasOwn(worker.env, 'PRIVATE_PREVIEW_DEVICE_ID'), false)
    assert.equal((await stat(output)).mode & 0o777, 0o600)
    assert.equal((await stat(f.destination)).mode & 0o777, 0o700)
    await assert.rejects(() => stage(f.build, f.values, f.destination))
  } finally { await rm(f.directory, { recursive: true }) }
})

test('rejects inherited fixed identity, production shape, changed mode, expired or invalid private values', async () => {
  for (const mutate of [
    f => { f.worker.env.PRIVATE_PREVIEW_DEVICE_ID = { type: 'secret' } },
    f => { f.worker.env.SHARED_GAMES = { type: 'r2', name: 'lie-shared-games' } },
    f => { f.worker.env.VOICE_TRANSPORT.value = 'relay' },
    f => { f.worker.env.VOICE_DEVICE_ENVIRONMENT.value = 'production' },
    f => { f.values.expiresAt = '2000-01-01T00:00:00Z' },
    f => { f.values.cookieSecret = 'short' },
    f => { f.values.agentId = 'unknown-agent' }
  ]) {
    const f = await fixture()
    try {
      mutate(f)
      await writeFile(join(f.build, f.relative), JSON.stringify(f.worker))
      await assert.rejects(() => stage(f.build, f.values, f.destination))
      await assert.rejects(() => stat(f.destination), { code: 'ENOENT' })
    } finally { await rm(f.directory, { recursive: true }) }
  }
})
