import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { syncAppearances } from './appearances.mjs'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nmhsAAAAASUVORK5CYII=', 'base64')
function entry(id = 'fixture-guide') {
  return {
    id, name: '新的中文形象', avatar: `assets/${id}/default.png`, portrait: `assets/${id}/default.png`,
    accent: '#123456', voiceId: 'existing-authorized-voice',
    portraits: Object.fromEntries(['listening', 'waiting', 'speaking'].map((state) => [state, `assets/${id}/${state}.png`])),
  }
}
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'lie-appearances-'))
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

test('a new appearance needs only assets and one source entry; generated names and voices are preserved', async (t) => {
  const f = await fixture(t)
  await syncAppearances(f)
  await f.assets('another-new-person')
  await f.manifest([entry(), { ...entry('another-new-person'), name: '另一个中文名' }])
  assert.equal((await syncAppearances(f)).count, 2)
  const runtime = JSON.parse(await readFile(join(f.outputDirectory, 'manifest.json'), 'utf8'))
  assert.equal(runtime[1].name, '另一个中文名')
  assert.equal(runtime[1].voiceId, 'existing-authorized-voice')
  assert.equal(runtime[1].portrait, '/appearances/another-new-person/default.png')
  for (const state of ['listening', 'waiting', 'speaking']) assert.equal(runtime[1].portraits[state], `/appearances/another-new-person/${state}.png`)
  assert.deepEqual(await readFile(join(f.outputDirectory, 'another-new-person/speaking.png')), png)
})

test('generation is deterministic and leaves unchanged files unchanged', async (t) => {
  const f = await fixture(t)
  await syncAppearances(f)
  const before = await readFile(join(f.outputDirectory, 'manifest.json'))
  assert.deepEqual((await syncAppearances(f)).differences, [])
  assert.deepEqual(await readFile(join(f.outputDirectory, 'manifest.json')), before)
  assert.deepEqual((await syncAppearances({ ...f, check: true })).differences, [])
})

test('checks reject stale metadata, bytes and obsolete output; generation repairs them', async (t) => {
  const f = await fixture(t)
  await syncAppearances(f)
  await writeFile(join(f.outputDirectory, 'manifest.json'), '[]\n')
  await assert.rejects(syncAppearances({ ...f, check: true }), /manifest.json/)
  await syncAppearances(f)
  await writeFile(join(f.outputDirectory, 'fixture-guide/default.png'), 'stale')
  await assert.rejects(syncAppearances({ ...f, check: true }), /fixture-guide\/default.png/)
  await writeFile(join(f.outputDirectory, 'obsolete.png'), png)
  await assert.rejects(syncAppearances({ ...f, check: true }), /obsolete.png \(obsolete\)/)
  await syncAppearances(f)
  assert.deepEqual((await syncAppearances({ ...f, check: true })).differences, [])
  await assert.rejects(readFile(join(f.outputDirectory, 'obsolete.png')), { code: 'ENOENT' })
})

for (const [label, mutate, message] of [
  ['duplicate IDs', (item) => [item, item], /Duplicate appearance id/],
  ['missing name', (item) => [{ ...item, name: null }], /\.name/],
  ['empty name', (item) => [{ ...item, name: '  ' }], /\.name/],
  ['missing voice', (item) => [{ ...item, voiceId: null }], /\.voiceId/],
  ['empty voice', (item) => [{ ...item, voiceId: '' }], /\.voiceId/],
  ['missing states', (item) => [{ ...item, portraits: null }], /\.portraits/],
  ['missing speaking', (item) => [{ ...item, portraits: { listening: item.portraits.listening, waiting: item.portraits.waiting } }], /\.speaking/],
  ['noncanonical paths', (item) => [{ ...item, portrait: '../outside.png' }], /\.portrait/],
  ['unsafe ID', (item) => [{ ...item, id: '../outside' }], /Appearance id/],
  ['unsafe public directory', (item) => [{ ...item, publicDirectory: '../outside' }], /publicDirectory/],
  ['unsafe avatar output', (item) => [{ ...item, publicAvatar: '../outside.png' }], /publicAvatar/],
]) {
  test(`invalid source (${label}) cannot change existing output`, async (t) => {
    const f = await fixture(t)
    await syncAppearances(f)
    const before = await readFile(join(f.outputDirectory, 'manifest.json'))
    await f.manifest(mutate(entry()))
    await assert.rejects(syncAppearances(f), message)
    assert.deepEqual(await readFile(join(f.outputDirectory, 'manifest.json')), before)
  })
}

test('missing resources, invalid PNG and mismatched canvases are rejected before writing', async (t) => {
  const f = await fixture(t)
  const speaking = join(f.sourceDirectory, 'assets/fixture-guide/speaking.png')
  await rm(speaking)
  await assert.rejects(syncAppearances(f), { code: 'ENOENT' })
  await writeFile(speaking, 'not-png')
  await assert.rejects(syncAppearances(f), /expected PNG/)
  const differentSize = Buffer.from(png)
  differentSize.writeUInt32BE(2, 16)
  await writeFile(speaking, differentSize)
  await assert.rejects(syncAppearances(f), /state canvas must match default/)
})

test('two IDs cannot overwrite the same generated public paths', async (t) => {
  const f = await fixture(t)
  await f.assets('second-person')
  await f.manifest([{ ...entry(), publicDirectory: 'shared' }, { ...entry('second-person'), publicDirectory: 'shared' }])
  await assert.rejects(syncAppearances(f), /Conflicting generated appearance path/)
})

test('legacy public URLs are catalog metadata and do not change canonical source paths', async (t) => {
  const f = await fixture(t)
  await writeFile(join(f.sourceDirectory, 'assets/fixture-guide/avatar.png'), png)
  await f.manifest([{ ...entry(), avatar: 'assets/fixture-guide/avatar.png', publicDirectory: 'fixture-guide-v1', publicAvatar: 'fixture-guide.png' }])
  await syncAppearances(f)
  const runtime = JSON.parse(await readFile(join(f.outputDirectory, 'manifest.json'), 'utf8'))
  assert.equal(runtime[0].avatar, '/appearances/fixture-guide.png')
  assert.equal(runtime[0].portrait, '/appearances/fixture-guide-v1/default.png')
})

test('source and output trees cannot overlap or traverse symlinks', async (t) => {
  const f = await fixture(t)
  await assert.rejects(syncAppearances({ ...f, outputDirectory: f.sourceDirectory }), /separate directory trees/)
  const sourceAsset = join(f.sourceDirectory, 'assets/fixture-guide/speaking.png')
  await rm(sourceAsset)
  await symlink(join(f.sourceDirectory, 'assets/fixture-guide/default.png'), sourceAsset)
  await assert.rejects(syncAppearances(f), /expected a regular asset/)
})
