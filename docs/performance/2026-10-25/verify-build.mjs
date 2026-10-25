import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { Miniflare } from 'miniflare'

import { fingerprintAssets } from '../../../apps/web/build/static-assets.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const built = join(root, 'apps/gateway/.cloudflare/output/v0/workers/default')
const config = JSON.parse(await readFile(join(built, 'worker.config.json')))
const directory = join(built, 'assets')
const source = await readFile(join(built, 'bundle/index.js'), 'utf8')
const plan = await fingerprintAssets(join(root, 'apps/web/public'))
const files = await readdir(join(directory, 'assets'))
const js = `/assets/${files.find(path => path.endsWith('.js'))}`
const css = `/assets/${files.find(path => path.endsWith('.css'))}`
for (const [path, bytes] of plan.outputs) assert.deepEqual(await readFile(join(directory, path)), bytes)
assert.deepEqual(await readFile(join(directory, 'appearances/manifest.json')), await readFile(join(root, 'apps/web/public/appearances/manifest.json')))
const manifest = JSON.parse(plan.outputs.get(plan.manifestUrl.slice(1)))
let parts = 0
for (const preset of manifest) {
  for (const url of [preset.avatar, preset.portrait, ...Object.values(preset.portraits)]) assert.ok(plan.outputs.has(url.slice(1)))
  if (preset.animation == null) continue
  const bytes = plan.outputs.get(preset.animation.slice(1))
  assert.deepEqual(bytes, await readFile(join(root, 'apps/web/public/appearances', preset.id, 'animation/package.json')))
  for (const asset of Object.values(JSON.parse(bytes).assets)) {
    const url = new URL(asset.src, `https://local.example${preset.animation}`)
    assert.ok(plan.outputs.has(url.pathname.slice(1)))
    parts++
  }
}
const mf = new Miniflare({ workers: [{ config: {
  name: config.name, compatibilityDate: config.compatibilityDate,
  manifest: { mainModule: 'index.js', modulesRoot: root, modules: { 'index.js': { type: 'esm', contents: source } } },
  env: { ASSETS: { type: 'assets' } },
  assets: { ...config.assets, directory, hasUserWorker: true }
} }] })
const results = []
async function request(path, init) {
  const response = await Promise.race([mf.dispatchFetch(`https://local.example${path}`, init), new Promise((_, reject) => setTimeout(() => reject(new Error('Local asset request timed out')), 10_000).unref())])
  results.push({path, method:init?.method ?? 'GET',status:response.status, cache:response.headers.get('cache-control'),type:response.headers.get('content-type'),range:response.headers.get('content-range')})
  const body = await response.arrayBuffer()
  return new Response(body.byteLength === 0 ? null : body, {status:response.status,statusText:response.statusText,headers:response.headers})
}
const immutable = 'public, max-age=31536000, immutable'
try {
  for (const path of [js, css, plan.manifestUrl, manifest[0].avatar, manifest[0].animation]) {
    const cold = await request(path)
    assert.equal(cold.status, 200); assert.equal(cold.headers.get('cache-control'), immutable)
    const body = await cold.arrayBuffer()
    const etag = cold.headers.get('etag'); assert.ok(etag)
    const conditional = await request(path, {headers:{'If-None-Match':etag}})
    assert.equal(conditional.status, 304); assert.equal(conditional.headers.get('cache-control'), immutable)
    assert.equal((await conditional.arrayBuffer()).byteLength,0)
    const head = await request(path, {method:'HEAD'})
    assert.equal(head.status,200); assert.equal(head.headers.get('etag'),etag)
    assert.equal((await head.arrayBuffer()).byteLength,0)
    const range = await request(path, {headers:{Range:'bytes=0-9'}})
    assert.ok([200,206].includes(range.status)); assert.equal(range.headers.get('cache-control'),immutable)
    if (range.status === 206) {
      assert.equal(range.headers.get('content-range'),`bytes 0-9/${body.byteLength}`)
      assert.deepEqual(new Uint8Array(await range.arrayBuffer()),new Uint8Array(body).slice(0,10))
    } else {
      assert.deepEqual(new Uint8Array(await range.arrayBuffer()),new Uint8Array(body))
    }
  }
  const html = await request('/'); assert.equal(html.status,200)
  const htmlEtag=html.headers.get('etag')
  for (const path of ['/','/play','/editor','/appearances/manifest.json','/brand/logo.svg','/games/empty-medal-box.json','/api/health','/api/voice/status','/api/missing','/api/voice']) {
    const response=await request(path)
    assert.ok(!response.headers.get('cache-control')?.includes('immutable'))
    await response.arrayBuffer()
  }
  for (const path of [`/static/${'a'.repeat(64)}/missing.png`,'/assets/missing-AbCd1234.js','/static/invalid/missing.png']) {
    for (const mode of ['cors','navigate']) {
      const response=await request(path,{headers:{'Sec-Fetch-Mode':mode}})
      assert.equal(response.status,404);assert.equal(response.headers.get('cache-control'),'no-store')
      assert.ok(!response.headers.get('content-type')?.includes('text/html'))
    }
    if(htmlEtag != null) {
      const response=await request(path,{headers:{'If-None-Match':htmlEtag}})
      assert.equal(response.status,404);assert.equal(response.headers.get('cache-control'),'no-store')
    }
  }
  console.log(JSON.stringify({node:process.version,buildConfig:config.assets,outputs:plan.outputs.size,presets:manifest.length,parts,results},null,2))
} finally {await mf.dispose()}
