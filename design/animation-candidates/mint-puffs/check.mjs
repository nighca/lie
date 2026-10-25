import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { readAnimationPackage } from '../../../packages/character-animation/src/package.ts'
import { sampleClip, AnimationTimeline } from '../../../packages/character-animation/src/playback.ts'
const dir = new URL('./', import.meta.url)
const raw = JSON.parse(fs.readFileSync(new URL('package.json', dir)))
const data = readAnimationPackage(raw)
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
const baseline = JSON.parse(fs.readFileSync(new URL('waiting-baseline.json', dir)))
const fingerprint = value => hash(JSON.stringify(value))
assert.equal(fingerprint(raw.assets), baseline.assets)
assert.equal(fingerprint(raw.nodes.filter(n=>['mouth-closed','mouth-open'].includes(n.id))), baseline.mouthNodes)
const originalPackage = JSON.parse(fs.readFileSync(new URL('archive/pre-2026-10-25-amplitude-package.json', dir)))
assert.deepEqual(raw.nodes.filter(n=>n.id!=='body-root'),originalPackage.nodes.filter(n=>n.id!=='body-root'))
const oldSpeaking=structuredClone(originalPackage.clips.speaking)
for(const track of oldSpeaking.tracks)if(track.node==='body-root' && track.property==='y')for(const key of track.keys)key.value+=6
assert.deepEqual(raw.clips.speaking,oldSpeaking)
const contact = data.nodes.find(n=>n.id==='chin-contact')
assert.equal(contact.sprite.asset, 'waiting-source')
for (const id of ['head','mouth-closed','mouth-open']) {
  const other = data.nodes.find(n=>n.id===id)
  assert.equal(contact.parent, other.parent)
  assert(contact.sprite.order > other.sprite.order)
}
assert.deepEqual(contact.transform, data.nodes.find(n=>n.id==='head').transform)
assert.deepEqual(contact.sprite.mask, data.nodes.find(n=>n.id==='head').sprite.mask)
const waitingVisibility = { ...raw.clips.waiting.visibility }
assert.equal(waitingVisibility.head, false)
delete waitingVisibility.head
assert.equal(fingerprint(waitingVisibility), baseline.waitingVisibility)
assert.equal(raw.clips.waiting.visibility['mouth-closed'], true)
assert.equal(raw.clips.waiting.visibility['mouth-open'], false)
const states = Object.keys(data.states)
function valid(pose, state) {
  for (const n of Object.values(pose)) for (const [key,value] of Object.entries(n.transform)) {
    assert(Number.isFinite(value)); if (key.startsWith('scale')) assert(value > 0)
  }
  assert.notEqual(pose['mouth-open'].visible, pose['mouth-closed'].visible)
  for (const other of states) assert.equal(pose[other+'-body'].visible, other === state)
  assert.equal(pose['listen-contact'].visible, state === 'listening')
  assert.equal(pose['chin-contact'].visible, state === 'waiting')
  assert.equal(pose['head'].visible, state !== 'waiting')
}
for (const state of states) {
  const clip = data.clips[data.states[state]]
  for (let i=0;i<320;i++) valid(sampleClip(data,clip,i/80),state)
  assert.deepEqual(sampleClip(data,clip,0),sampleClip(data,clip,4))
  const a=sampleClip(data,clip,1), b=sampleClip(data,clip,3)
  if (state==='waiting' || state==='listening') {
    assert(Math.abs(a['head-root'].transform.scaleY-b['head-root'].transform.scaleY-.036)<1e-9)
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
console.log(`PASS strict parser, 4 native PNG/hash/canonical/alpha checks, ${pixels} pixels, 1280 samples, four loop closures, mouth/pose exclusivity, real contact parents, fixed-waist breath, 100 interrupted switches; assets and mouth nodes unchanged; revised default/listening/waiting motion`)
