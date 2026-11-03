import assert from 'node:assert/strict'
import { chmod, cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const namespace = 'direct-formal-20261103-v1'
const secretNames = ['LINX_API_KEY', 'LINX_AGENT_ID', 'VOICE_DEVICE_COOKIE_SECRET']
const names = ['ASSETS', ...secretNames, 'VOICE_DEVICE_ENVIRONMENT', 'VOICE_MAX_SESSION_SECONDS', 'VOICE_TRANSPORT', 'PRIVATE_PREVIEW_EXPIRES_AT']

// Values come from the separately approved private operator flow, never from client assets.
export async function stage(buildDirectory, values, destination) {
  assert.deepEqual(Object.keys(values).sort(), ['agentId', 'apiKey', 'cookieSecret', 'expiresAt'].sort())
  assert.ok(typeof values.agentId === 'string' && /^[0-9a-f]{32}$/.test(values.agentId))
  assert.ok(typeof values.apiKey === 'string' && values.apiKey.length > 0)
  assert.ok(typeof values.cookieSecret === 'string' && Buffer.byteLength(values.cookieSecret) >= 32)
  assert.ok(typeof values.expiresAt === 'string' && Number.isFinite(Date.parse(values.expiresAt)) && Date.parse(values.expiresAt) > Date.now())
  const config = JSON.parse(await readFile(resolve(buildDirectory, 'v0/config.json'), 'utf8'))
  assert.equal(config.buildContext?.isPreview, true)
  assert.equal(config.buildContext.mode, 'preview')
  const relative = 'v0/workers/default/worker.config.json'
  const worker = JSON.parse(await readFile(resolve(buildDirectory, relative), 'utf8'))
  assert.equal(worker.name, 'lie-pr-preview')
  assert.deepEqual(Object.keys(worker.env).sort(), [...names].sort())
  assert.deepEqual(worker.env.ASSETS, { type: 'assets' })
  for (const name of secretNames) assert.deepEqual(worker.env[name], { type: 'secret' })
  assert.deepEqual(worker.env.VOICE_DEVICE_ENVIRONMENT, { type: 'text', value: namespace })
  assert.deepEqual(worker.env.VOICE_MAX_SESSION_SECONDS, { type: 'text', value: '600' })
  assert.deepEqual(worker.env.VOICE_TRANSPORT, { type: 'text', value: 'direct' })
  assert.deepEqual(worker.env.PRIVATE_PREVIEW_EXPIRES_AT, { type: 'text', value: '0' })
  for (const [name, text] of Object.entries({ LINX_API_KEY: values.apiKey, LINX_AGENT_ID: values.agentId, VOICE_DEVICE_COOKIE_SECRET: values.cookieSecret })) {
    worker.env[name] = { type: 'unsafe:secret_text', text }
  }
  worker.env.PRIVATE_PREVIEW_EXPIRES_AT = { type: 'text', value: values.expiresAt }
  await mkdir(destination, { mode: 0o700 })
  const output = resolve(destination, '.cloudflare/output')
  await cp(buildDirectory, output, { recursive: true, errorOnExist: true, force: false })
  await chmod(resolve(output, relative), 0o600)
  await writeFile(resolve(output, relative), JSON.stringify(worker), { mode: 0o600 })
  return { staged: true, bindingCount: names.length, namespace, transport: 'direct' }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [buildDirectory, privateValuesPath, destination] = process.argv.slice(2)
    assert.ok(buildDirectory && privateValuesPath && destination)
    const values = JSON.parse(await readFile(privateValuesPath, 'utf8'))
    console.log(JSON.stringify(await stage(buildDirectory, values, destination)))
  } catch { console.error('Formal direct preview staging failed'); process.exitCode = 1 }
}
