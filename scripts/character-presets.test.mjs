import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { syncCharacterPresets } from './character-presets.mjs'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmhsAAAAASUVORK5CYII=', 'base64')
function entry(id = 'fixture-guide') {
  return {
    id, name: '新的中文形象', avatar: `assets/${id}/default.png`, portrait: `assets/${id}/default.png`,
    accent: '#123456', voiceId: 'existing-authorized-voice',
    portraits: Object.fromEntries(['listening', 'waiting', 'speaking'].map((state) => [state, `assets/${id}/${state}.png`])),
  }
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'lie-characterPresets-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const sourceDirectory = join(directory, 'source')
  const outputDirectory = join(directory, 'output')
  async function assets(id) {
    await mkdir(join(sourceDirectory, 'assets', id), { recursive: true })
    for (const state of ['default', 'listening', 'waiting', 'speaking']) await writeFile(join(sourceDirectory, 'assets', id, `${state}.png`), png)
  }
  async function manifest(value) { await writeFile(join(sourceDirectory, 'manifest.json'), JSON.stringify(value)) }
  await assets('fixture-guide')
  await manifest([entry()])
  return { sourceDirectory, outputDirectory, assets, manifest }
}

test('a new characterPreset needs only assets and one source entry; generated names and voices are preserved', async (t) => {
  const f = await fixture(t)
  await syncCharacterPresets(f)
  await f.assets('another-new-person')
  await f.manifest([entry(), { ...entry('another-new-person'), name: '另一个中文名' }])
  assert.equal((await syncCharacterPresets(f)).count, 2)
  const runtime = JSON.parse(await readFile(join(f.outputDirectory, 'manifest.json'), 'utf8'))
  assert.equal(runtime[1].name, '另一个中文名')
  assert.equal(runtime[1].voiceId, 'existing-authorized-voice')
  assert.equal(runtime[1].avatar, '/appearances/another-new-person/default.png')
  assert.equal(runtime[1].portrait, '/appearances/another-new-person/default.png')
  for (const state of ['listening', 'waiting', 'speaking']) assert.equal(runtime[1].portraits[state], `/appearances/another-new-person/${state}.png`)
  assert.deepEqual(await readFile(join(f.outputDirectory, 'another-new-person/speaking.png')), png)
})

test('generation is deterministic and leaves unchanged files unchanged', async (t) => {
  const f = await fixture(t)
  await syncCharacterPresets(f)
  const before = await readFile(join(f.outputDirectory, 'manifest.json'))
  assert.deepEqual((await syncCharacterPresets(f)).differences, [])
  assert.deepEqual(await readFile(join(f.outputDirectory, 'manifest.json')), before)
  assert.deepEqual((await syncCharacterPresets({ ...f, check: true })).differences, [])
})

test('checks reject stale metadata, bytes and obsolete output; generation repairs them', async (t) => {
  const f = await fixture(t)
  await syncCharacterPresets(f)
  await writeFile(join(f.outputDirectory, 'manifest.json'), '[]\n')
  await assert.rejects(syncCharacterPresets({ ...f, check: true }), /manifest.json/)
  await syncCharacterPresets(f)
  await writeFile(join(f.outputDirectory, 'fixture-guide/default.png'), 'stale')
  await assert.rejects(syncCharacterPresets({ ...f, check: true }), /fixture-guide\/default.png/)
  await writeFile(join(f.outputDirectory, 'obsolete.png'), png)
  await assert.rejects(syncCharacterPresets({ ...f, check: true }), /obsolete.png \(obsolete\)/)
  await syncCharacterPresets(f)
  assert.deepEqual((await syncCharacterPresets({ ...f, check: true })).differences, [])
  await assert.rejects(readFile(join(f.outputDirectory, 'obsolete.png')), { code: 'ENOENT' })
})

for (const [label, mutate, message] of [
  ['duplicate IDs', (item) => [item, item], /Duplicate characterPreset id/],
  ['missing name', (item) => [{ ...item, name: null }], /\.name/],
  ['empty name', (item) => [{ ...item, name: '  ' }], /\.name/],
  ['missing voice', (item) => [{ ...item, voiceId: null }], /\.voiceId/],
  ['empty voice', (item) => [{ ...item, voiceId: '' }], /\.voiceId/],
  ['missing states', (item) => [{ ...item, portraits: null }], /\.portraits/],
  ['missing speaking', (item) => [{ ...item, portraits: { listening: item.portraits.listening, waiting: item.portraits.waiting } }], /\.speaking/],
  ['noncanonical paths', (item) => [{ ...item, portrait: '../outside.png' }], /\.portrait/],
  ['unsafe ID', (item) => [{ ...item, id: '../outside' }], /CharacterPreset id/],
  ['unknown source field', (item) => [{ ...item, displayLabel: 'typo' }], /unexpected field displayLabel/],
]) {
  test(`invalid source (${label}) cannot change existing output`, async (t) => {
    const f = await fixture(t)
    await syncCharacterPresets(f)
    const before = await readFile(join(f.outputDirectory, 'manifest.json'))
    await f.manifest(mutate(entry()))
    await assert.rejects(syncCharacterPresets(f), message)
    assert.deepEqual(await readFile(join(f.outputDirectory, 'manifest.json')), before)
  })
}

test('missing resources, invalid PNG and mismatched canvases are rejected before writing', async (t) => {
  const f = await fixture(t)
  const speaking = join(f.sourceDirectory, 'assets/fixture-guide/speaking.png')
  await rm(speaking)
  await assert.rejects(syncCharacterPresets(f), { code: 'ENOENT' })
  await writeFile(speaking, 'not-png')
  await assert.rejects(syncCharacterPresets(f), /expected PNG/)
  const differentSize = Buffer.from(png)
  differentSize.writeUInt32BE(2, 16)
  await writeFile(speaking, differentSize)
  await assert.rejects(syncCharacterPresets(f), /state canvas must match default/)
})

test('a distinct avatar has one canonical URL in the same preset directory', async (t) => {
  const f = await fixture(t)
  await writeFile(join(f.sourceDirectory, 'assets/fixture-guide/avatar.png'), png)
  await f.manifest([{ ...entry(), avatar: 'assets/fixture-guide/avatar.png' }])
  assert.equal((await syncCharacterPresets(f)).assets, 5)
  const runtime = JSON.parse(await readFile(join(f.outputDirectory, 'manifest.json'), 'utf8'))
  assert.equal(runtime[0].avatar, '/appearances/fixture-guide/avatar.png')
  assert.equal(runtime[0].portrait, '/appearances/fixture-guide/default.png')
  assert.deepEqual(await readFile(join(f.outputDirectory, 'fixture-guide/avatar.png')), png)
})

test('source and output trees cannot overlap or traverse symlinks', async (t) => {
  const f = await fixture(t)
  await assert.rejects(syncCharacterPresets({ ...f, outputDirectory: f.sourceDirectory }), /separate directory trees/)
  const sourceAsset = join(f.sourceDirectory, 'assets/fixture-guide/speaking.png')
  await rm(sourceAsset)
  await symlink(join(f.sourceDirectory, 'assets/fixture-guide/default.png'), sourceAsset)
  await assert.rejects(syncCharacterPresets(f), /expected a regular asset/)
})

async function animationFixture(f) {
  const base = join(f.sourceDirectory, 'assets/fixture-guide/animation')
  await mkdir(join(base, 'parts'), { recursive: true })
  await writeFile(join(base, 'parts/body.png'), png)
  const data = { schemaVersion: 1, canvas: { width: 1, height: 1 }, assets: { body: { src: 'parts/body.png', width: 1, height: 1 } }, nodes: [{ id: 'body', parent: null, visible: true, transform: { x: 0, y: 0, pivotX: 0, pivotY: 0, rotation: 0, scaleX: 1, scaleY: 1 }, sprite: { asset: 'body', order: 0 } }], clips: { idle: { duration: 1, loop: true, visibility: {}, tracks: [] } }, states: { default: 'idle', listening: 'idle', waiting: 'idle', speaking: 'idle' }, transitions: [] }
  const path = join(base, 'package.json')
  await writeFile(path, JSON.stringify(data))
  return { path, base, data }
}

test('animated and static characterPresets coexist; shared parts are copied once with unchanged bytes', async t => {
  const f = await fixture(t), animation = await animationFixture(f)
  await f.assets('another-person')
  await f.manifest([{ ...entry(), animation: 'assets/fixture-guide/animation/package.json' }, entry('another-person')])
  await syncCharacterPresets(f)
  const runtime = JSON.parse(await readFile(join(f.outputDirectory, 'manifest.json'), 'utf8'))
  assert.equal(runtime[0].animation, '/appearances/fixture-guide/animation/package.json')
  assert.equal(runtime[1].animation, undefined)
  assert.deepEqual(await readFile(join(f.outputDirectory, 'fixture-guide/animation/package.json')), await readFile(animation.path))
  assert.deepEqual(await readFile(join(f.outputDirectory, 'fixture-guide/animation/parts/body.png')), png)
  await f.manifest([entry(), entry('another-person')]); await syncCharacterPresets(f)
  await assert.rejects(readFile(join(f.outputDirectory, 'fixture-guide/animation/package.json')), { code: 'ENOENT' })
})

test('canonical animation rejects PNG bytes disguised under a WebP filename before changing outputs', async t => {
  const f = await fixture(t); await syncCharacterPresets(f)
  const before = await readFile(join(f.outputDirectory, 'manifest.json'))
  const animation = await animationFixture(f)
  animation.data.assets.body.src = 'parts/body.webp'
  await writeFile(join(animation.base, 'parts/body.webp'), png)
  await writeFile(animation.path, JSON.stringify(animation.data))
  await f.manifest([{ ...entry(), animation: 'assets/fixture-guide/animation/package.json' }])
  await assert.rejects(syncCharacterPresets(f), /canonical animation parts must use parts\/\*\.png/)
  assert.deepEqual(await readFile(join(f.outputDirectory, 'manifest.json')), before)
})

for (const [label, mutate] of [
  ['unsupported version', data => { data.schemaVersion = 3 }],
  ['outside asset', data => { data.assets.body.src = '../outside.png' }],
  ['missing node', data => { data.nodes[0].parent = 'missing' }],
  ['wrong dimensions', data => { data.assets.body.width = 2 }],
]) {
  test(`bad animation (${label}) cannot change existing generated output`, async t => {
    const f = await fixture(t); await syncCharacterPresets(f)
    const before = await readFile(join(f.outputDirectory, 'manifest.json'))
    const animation = await animationFixture(f); mutate(animation.data)
    await writeFile(animation.path, JSON.stringify(animation.data))
    await f.manifest([{ ...entry(), animation: 'assets/fixture-guide/animation/package.json' }])
    await assert.rejects(syncCharacterPresets(f))
    assert.deepEqual(await readFile(join(f.outputDirectory, 'manifest.json')), before)
  })
}

const resultStates = { accusedCorrectly: 'accused-correctly', accusedWrongly: 'accused-wrongly' }
async function resultImages(f) {
  const item = entry()
  for (const [state, filename] of Object.entries(resultStates)) {
    item.portraits[state] = `assets/fixture-guide/${filename}.png`
    await writeFile(join(f.sourceDirectory, item.portraits[state]), png)
  }
  return item
}
test('static and animated result portraits share canonical generation and check paths', async t => {
  const f = await fixture(t), item = await resultImages(f)
  await f.manifest([item]); await syncCharacterPresets(f)
  const animation = await animationFixture(f)
  animation.data.schemaVersion = 2
  animation.data.clips.reaction = { duration: 1, loop: false, visibility: {}, tracks: [] }
  for (const state of Object.keys(resultStates)) animation.data.states[state] = 'reaction'
  await writeFile(animation.path, JSON.stringify(animation.data))
  await f.manifest([{ ...item, animation: 'assets/fixture-guide/animation/package.json' }])
  await syncCharacterPresets(f)
  assert.deepEqual((await syncCharacterPresets({ ...f, check: true })).differences, [])
  const [runtime] = JSON.parse(await readFile(join(f.outputDirectory, 'manifest.json'), 'utf8'))
  for (const [state, filename] of Object.entries(resultStates)) {
    assert.equal(runtime.portraits[state], `/appearances/fixture-guide/${filename}.png`)
    assert.deepEqual(await readFile(join(f.outputDirectory, `fixture-guide/${filename}.png`)), png)
  }
  delete item.portraits.accusedWrongly
  await f.manifest([{ ...item, animation: 'assets/fixture-guide/animation/package.json' }])
  await assert.rejects(syncCharacterPresets(f), /accusedWrongly animation requires matching static portrait/)
})
test('result portraits reject missing bytes, null, wrong paths and mismatched canvas before writing', async t => {
  const f = await fixture(t), item = entry()
  item.portraits.accusedCorrectly = 'assets/fixture-guide/accused-correctly.png'
  await f.manifest([item])
  await assert.rejects(syncCharacterPresets(f), { code: 'ENOENT' })
  for (const value of [null, 'assets/fixture-guide/default.png', '../other.png']) {
    item.portraits.accusedCorrectly = value; await f.manifest([item])
    await assert.rejects(syncCharacterPresets(f), /portraits.accusedCorrectly/)
  }
  const valid = await resultImages(f)
  const different = Buffer.from(png); different.writeUInt32BE(2, 16)
  await writeFile(join(f.sourceDirectory, valid.portraits.accusedWrongly), different)
  await f.manifest([valid])
  await assert.rejects(syncCharacterPresets(f), /state canvas must match default/)
})
