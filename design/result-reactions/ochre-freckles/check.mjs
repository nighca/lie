import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readAnimationPackage } from '../../../packages/character-animation/src/package.ts'
import { AnimationTimeline, sampleClip } from '../../../packages/character-animation/src/playback.ts'

const candidateUrl = new URL('./', import.meta.url)
const originalUrl = new URL('../../character-presets/assets/ochre-freckles/animation/', import.meta.url)
const original = JSON.parse(await readFile(new URL('package.json', originalUrl), 'utf8'))
const raw = JSON.parse(await readFile(new URL('package.json', candidateUrl), 'utf8'))
const data = readAnimationPackage(raw)
for (const [id, clip] of Object.entries(original.clips)) assert.deepEqual(raw.clips[id], clip)
assert.deepEqual(raw.nodes.slice(0, original.nodes.length), original.nodes)
assert.deepEqual(raw.transitions, original.transitions)
for (const [id, asset] of Object.entries(original.assets)) {
  assert.deepEqual(raw.assets[id], asset)
  assert.deepEqual(await readFile(new URL(asset.src, candidateUrl)), await readFile(new URL(asset.src, originalUrl)))
}
const sourceOnly = process.argv.includes('--source-only')
const hashes = {}
for (const [id, asset] of Object.entries(data.assets)) {
  const bytes = await readFile(new URL(asset.src, candidateUrl))
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.readUInt32BE(16), asset.width)
  assert.equal(bytes.readUInt32BE(20), asset.height)
  hashes[id] = createHash('sha256').update(bytes).digest('hex')
}
for (const [state, filename] of [['accusedCorrectly', 'accused-correctly'], ['accusedWrongly', 'accused-wrongly']]) {
  const clip = data.clips[data.states[state]]
  assert.equal(clip.loop, false)
  assert.ok(clip.duration >= 1 && clip.duration <= 1.3)
  const end = sampleClip(data, clip, clip.duration)
  assert.deepEqual(sampleClip(data, clip, 100), end)
  const clock = new AnimationTimeline(data, state)
  assert.deepEqual(clock.advance(100), end)
  assert.equal(clock.finished, true)
  for (let i = 0; i <= 120; i++) {
    const pose = sampleClip(data, clip, clip.duration * i / 120)
    for (const node of original.nodes.filter(node => node.sprite != null && node.id.startsWith('head-'))) assert.equal(pose[node.id].visible, false)
    assert.equal(pose[filename + '-head'].visible, true)
    assert.equal(pose['mouth-open'].visible, false)
    for (const node of data.nodes) {
      assert.equal(pose[node.id].transform.scaleX, node.transform.scaleX)
      assert.equal(pose[node.id].transform.scaleY, node.transform.scaleY)
    }
  }
  if (!sourceOnly) {
  const png = await readFile(new URL(filename + '.png', candidateUrl))
  assert.equal(png.readUInt32BE(16), data.canvas.width)
  assert.equal(png.readUInt32BE(20), data.canvas.height)
  hashes[filename + '-terminal'] = createHash('sha256').update(png).digest('hex')
  }
}
console.log(JSON.stringify({ status: sourceOnly ? 'source-data-passed-terminal-and-browser-pending' : 'passed', originalClipsAndParts: 'unchanged', rigidResultSamples: 242, terminalHold: true, assets: Object.keys(data.assets).length, sha256: hashes }, null, 2))
