import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const identity = JSON.parse(await readFile(join(root, 'tmp/q90-built-identity.json')))
const origin = 'http://127.0.0.1:5356', records = []
async function get(path, options = {}) {
  const response = await fetch(origin + path, options), body = Buffer.from(await response.arrayBuffer())
  records.push({ path, method: options.method ?? 'GET', status: response.status, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex'), headers: Object.fromEntries(['content-type', 'content-length', 'cache-control', 'etag'].map(key => [key, response.headers.get(key)])) })
  return { response, body }
}
const { response, body } = await get(identity.manifestUrl)
assert.equal(response.status, 200); assert.ok(response.headers.get('content-type').includes('application/json'))
assert.deepEqual(body, await readFile(join(root, 'apps/web/dist', identity.manifestUrl)))
const manifest = JSON.parse(body), imageUrl = manifest.find(item => item.id === 'sunny-moustache').avatar
const image = await get(imageUrl)
assert.equal(image.response.headers.get('content-type'), 'image/webp')
assert.equal(image.response.headers.get('cache-control'), 'public, max-age=31536000, immutable')
assert.deepEqual(image.body, await readFile(join(root, 'apps/web/dist', imageUrl)))
const conditional = await get(imageUrl, { headers: { 'If-None-Match': image.response.headers.get('etag') } })
assert.equal(conditional.response.status, 304); assert.equal(conditional.body.length, 0)
assert.equal(conditional.response.headers.get('cache-control'), 'public, max-age=31536000, immutable')
const head = await get(imageUrl, { method: 'HEAD' }); assert.equal(head.response.status, 200); assert.equal(head.body.length, 0)
const missing = await get(`/static/${'0'.repeat(64)}/appearances/missing.webp`)
assert.equal(missing.response.status, 404); assert.equal(missing.response.headers.get('cache-control'), 'no-store'); assert.equal(missing.body.toString(), 'Asset not found')
const report = { source: 'ASSETS-only actual built Worker via local HTTP; not production/browser performance', node: process.version, origin, records }
await writeFile(join(root, 'tmp/q90-http-acceptance.json'), JSON.stringify(report, null, 2) + '\n')
console.log(records.map(record => ({ ...record, sha256: record.sha256.slice(0, 12) })))
