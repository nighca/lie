import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { readAnimationPackage } from '../../../packages/appearance-animation/src/package.ts'
import { sampleClip, AnimationTimeline } from '../../../packages/appearance-animation/src/playback.ts'
const root = new URL('./',import.meta.url)
const data=readAnimationPackage(JSON.parse(readFileSync(new URL('package.json',root))))
const provenance=JSON.parse(readFileSync(new URL('provenance.json',root)))
const hash=b=>createHash('sha256').update(b).digest('hex')
for(const [id,asset] of Object.entries(data.assets)) {
 const bytes=readFileSync(new URL(asset.src,root))
 assert.equal(bytes.subarray(1,4).toString(),'PNG')
 assert.equal(bytes.readUInt32BE(16),asset.width)
 assert.equal(bytes.readUInt32BE(20),asset.height)
 assert.equal(hash(bytes),provenance.parts[id].sha256)
}
for(const [state,clipId] of Object.entries(data.states)) {
 const clip=data.clips[clipId]
 assert.deepEqual(sampleClip(data,clip,0),sampleClip(data,clip,clip.duration))
 for(let i=0;i<240;i++) {
  const pose=sampleClip(data,clip,i*clip.duration/240)
  for(const node of Object.values(pose))for(const value of Object.values(node.transform))assert(Number.isFinite(value))
  assert.notEqual(pose['head-open'].visible,pose['head-closed'].visible)
  if(state==='waiting')assert(pose['arm-waiting'].visible && pose['arm-waiting-back'].visible)
  if(state==='listening')assert(pose['arm-listening'].visible)
 }
 assert.notDeepEqual(sampleClip(data,clip,clip.duration*.25),sampleClip(data,clip,clip.duration*.75))
}
assert.equal(data.nodes.find(n=>n.id==='head-root').parent,'contact-root')
for(const id of ['arm-listening','arm-waiting','arm-waiting-back'])assert.equal(data.nodes.find(n=>n.id===id).parent,'contact-root')
const timeline=new AnimationTimeline(data)
function checkInterruptedPose(pose,state,elapsed) {
 const target=sampleClip(data,data.clips[data.states[state]],elapsed)
 for(const [id,node] of Object.entries(pose)) {
  for(const value of Object.values(node.transform))assert(Number.isFinite(value),`${state}/${id}: finite interrupted transform`)
  assert.equal(node.visible,target[id].visible,`${state}/${id}: visibility follows target clip immediately`)
 }
 assert.notEqual(pose['head-open'].visible,pose['head-closed'].visible,`${state}: exclusive mouth attachments`)
}
timeline.setState('speaking')
checkInterruptedPose(timeline.advance(.11),'speaking',.11)
for(let i=0;i<100;i++) {
 const state=['listening','waiting','speaking','default'][i%4]
 const before=timeline.advance(0)
 timeline.setState(state)
 const after=timeline.advance(0)
 for(const id of Object.keys(before)) {
  for(const value of Object.values(before[id].transform))assert(Number.isFinite(value),`${id}: finite pre-interruption transform`)
  assert.deepEqual(after[id].transform,before[id].transform,`${state}/${id}: all numeric channels continuous at interruption`)
 }
 checkInterruptedPose(after,state,0)
 const elapsed=[.09,.17,.21][i%3]
 checkInterruptedPose(timeline.advance(elapsed),state,elapsed)
}
for(const [state,entry] of Object.entries(provenance.sources))assert.equal(hash(readFileSync(fileURLToPath(new URL(`../../appearances/assets/blue-glasses/${state}.png`,root)))),entry.sha256)
console.log(`PASS: strict contract; ${Object.keys(data.assets).length} native PNG sizes/hashes; 960 samples; loop closure; exclusive mouths; contact hierarchy; 100 interruptions (all-channel continuity, finite transforms, target visibility and exclusive mouths); canonical source hashes`)
