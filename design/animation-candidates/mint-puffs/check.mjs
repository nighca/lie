import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { readAnimationPackage } from '../../../packages/appearance-animation/src/package.ts'
import { sampleClip, AnimationTimeline } from '../../../packages/appearance-animation/src/playback.ts'
const dir = new URL('./', import.meta.url)
const data = readAnimationPackage(JSON.parse(fs.readFileSync(new URL('package.json', dir))))
const provenance = JSON.parse(fs.readFileSync(new URL('provenance.json', dir)))
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
let pixels = data.canvas.width * data.canvas.height
for (const item of provenance.sources) {
  const asset = data.assets[item.id], bytes = fs.readFileSync(new URL(asset.src, dir))
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137,80,78,71,13,10,26,10]))
  assert.equal(bytes.readUInt32BE(16), asset.width)
  assert.equal(bytes.readUInt32BE(20), asset.height)
  assert.equal(hash(bytes), item.sha256)
  assert.equal(hash(fs.readFileSync(new URL(item.origin, dir))), item.sha256)
  assert.deepEqual(item.alphaExtrema, [0,255])
  pixels += asset.width * asset.height
}
assert(pixels <= 33554432)
const states = Object.keys(data.states)
function valid(pose, state) {
  for (const n of Object.values(pose)) for (const [key,value] of Object.entries(n.transform)) {
    assert(Number.isFinite(value)); if (key.startsWith('scale')) assert(value > 0)
  }
  assert.notEqual(pose['mouth-open'].visible, pose['mouth-closed'].visible)
  for (const other of states) assert.equal(pose[other+'-body'].visible, other === state)
  assert.equal(pose['listen-contact'].visible, state === 'listening')
  assert.equal(pose['chin-contact'].visible, state === 'waiting')
}
for (const state of states) {
  const clip = data.clips[data.states[state]]
  for (let i=0;i<320;i++) valid(sampleClip(data,clip,i/80),state)
  assert.deepEqual(sampleClip(data,clip,0),sampleClip(data,clip,4))
  const a=sampleClip(data,clip,1), b=sampleClip(data,clip,3)
  if (state==='waiting' || state==='listening') {
    assert.notEqual(a['head-root'].transform.scaleY,b['head-root'].transform.scaleY)
    for (const pose of [a,b]) {
      assert.deepEqual(pose['body-root'].transform,data.nodes[0].transform)
      assert.equal(pose['head-root'].transform.rotation,0)
      assert.equal(pose['head-root'].transform.y,858)
      assert.equal(pose['head-root'].transform.pivotY,858)
    }
  } else {
    assert.notEqual(a['head-root'].transform.rotation,b['head-root'].transform.rotation)
    assert.notEqual(a['body-root'].transform.y,b['body-root'].transform.y)
  }
}
for (const id of ['head','mouth-open','mouth-closed','listen-contact','chin-contact','waiting-body','listening-body']) assert.equal(data.nodes.find(n=>n.id===id).parent,'head-root')
const timeline=new AnimationTimeline(data)
let previous=timeline.advance(.37)
for(let i=0;i<100;i++) {
  const state=states[i%4]; timeline.setState(state)
  const immediate=timeline.advance(0);valid(immediate,state)
  for(const id of Object.keys(previous))assert.deepEqual(immediate[id].transform,previous[id].transform)
  for(const delta of [.025,.045,.03]){previous=timeline.advance(delta);valid(previous,state)}
}
console.log(`PASS strict parser, 4 native PNG/hash/canonical/alpha checks, ${pixels} pixels, 1280 samples, four loop closures, mouth/pose exclusivity, real contact parents, fixed-waist breath, 100 interrupted switches`)
