import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readAnimationPackage } from '../../packages/character-animation/src/package.ts'
import { AnimationTimeline, sampleClip } from '../../packages/character-animation/src/playback.ts'

const characters = JSON.parse(await readFile(new URL('./characters.json', import.meta.url), 'utf8'))
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const results = []
for (const { id, name } of characters) {
  const candidateUrl = new URL(`./${id}/`, import.meta.url)
  const originalUrl = new URL(`../character-presets/assets/${id}/animation/`, import.meta.url)
  const bytes = await readFile(new URL('package.json', candidateUrl))
  const data = readAnimationPackage(JSON.parse(bytes))
  const original = readAnimationPackage(JSON.parse(await readFile(new URL('package.json', originalUrl))))
  assert.equal(data.schemaVersion, 2, id)
  assert.deepEqual(data.canvas, original.canvas, id)
  assert.deepEqual(data.nodes.slice(0, original.nodes.length), original.nodes, id)
  assert.deepEqual(data.transitions, original.transitions, id)
  for (const [key, clip] of Object.entries(original.clips)) {
    assert.deepEqual(data.clips[key], clip, `${id}: original clip ${key}`)
    const pose = sampleClip(data, data.clips[key], 0)
    for (const node of data.nodes.slice(original.nodes.length)) {
      if (node.sprite != null) assert.equal(pose[node.id].visible, false, `${id}: extra sprite in original clip`)
    }
  }
  for (const state of ['default', 'listening', 'waiting', 'speaking']) assert.equal(data.states[state], original.states[state])
  for (const [key, asset] of Object.entries(original.assets)) {
    assert.deepEqual(data.assets[key], asset)
    assert.deepEqual(await readFile(new URL(asset.src, candidateUrl)), await readFile(new URL(asset.src, originalUrl)))
  }
  for (const asset of Object.values(data.assets)) {
    const png = await readFile(new URL(asset.src, candidateUrl))
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(png.readUInt32BE(16), asset.width)
    assert.equal(png.readUInt32BE(20), asset.height)
  }
  const terminals = {}
  for (const [state, filename] of [['accusedCorrectly', 'accused-correctly'], ['accusedWrongly', 'accused-wrongly']]) {
    const clip = data.clips[data.states[state]]
    assert.ok(clip != null, `${id}: missing ${state}`)
    assert.equal(clip.loop, false)
    assert.ok(clip.duration >= .8 && clip.duration <= 1.5)
    const end = sampleClip(data, clip, clip.duration)
    const timeline = new AnimationTimeline(data, state)
    assert.deepEqual(timeline.advance(100), end)
    assert.equal(timeline.finished, true)
    timeline.setState(state)
    assert.deepEqual(timeline.advance(1), end)
    for (let i = 0; i <= 120; i++) {
      const pose = sampleClip(data, clip, clip.duration * i / 120)
      for (const node of data.nodes) {
        assert.equal(pose[node.id].transform.scaleX, node.transform.scaleX, `${id}: changing scaleX`)
        assert.equal(pose[node.id].transform.scaleY, node.transform.scaleY, `${id}: changing scaleY`)
      }
    }
    const png = await readFile(new URL(`${filename}.png`, candidateUrl))
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(png.readUInt32BE(16), data.canvas.width)
    assert.equal(png.readUInt32BE(20), data.canvas.height)
    terminals[state] = digest(png)
  }
  results.push({ id, name, status: 'passed', originalClipsAndParts: 'unchanged', rigidSamples: 242, assets: Object.keys(data.assets).length, packageSha256: digest(bytes), terminalSha256: terminals })
}
console.log(JSON.stringify({ status: 'passed', characters: results.length, results }, null, 2))
