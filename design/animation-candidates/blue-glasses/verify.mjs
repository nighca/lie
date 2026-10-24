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
for(let i=0;i<100;i++){timeline.setState(['default','listening','waiting','speaking'][i%4]);const pose=timeline.advance(.09);assert(pose['head-closed'] || pose['head-open'])}
for(const [state,entry] of Object.entries(provenance.sources))assert.equal(hash(readFileSync(fileURLToPath(new URL(`../../appearances/assets/blue-glasses/${state}.png`,root)))),entry.sha256)
console.log(`PASS: strict contract; ${Object.keys(data.assets).length} native PNG sizes/hashes; 960 samples; loop closure; exclusive mouths; contact hierarchy; 100 interruptions; canonical source hashes`)
