import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { readAnimationPackage } from '../../../packages/appearance-animation/src/package.ts'
import { sampleClip, AnimationTimeline } from '../../../packages/appearance-animation/src/playback.ts'
const dir=new URL('./',import.meta.url)
const data=readAnimationPackage(JSON.parse(fs.readFileSync(new URL('package.json',dir))))
for(const [id,asset] of Object.entries(data.assets)) {
 const bytes=fs.readFileSync(new URL(asset.src,dir))
 assert.equal(bytes.subarray(1,4).toString(),'PNG'); assert.equal(bytes.readUInt32BE(16),asset.width);assert.equal(bytes.readUInt32BE(20),asset.height)
}
const provenance=JSON.parse(fs.readFileSync(new URL('provenance.json',dir)))
for(const item of provenance.sources) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(`parts/${item.id}.png`,dir))).digest('hex'),item.sha256)
for(const [state,expected] of Object.entries(provenance.originalCanonicalStates)) {
 const source=new URL(`../../appearances/assets/silver-bun/${state}.png`,dir)
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),expected,`canonical ${state} unchanged`)
}
function assertPose(pose,state) {
 for(const node of Object.values(pose))for(const value of Object.values(node.transform))assert(Number.isFinite(value))
 assert.notEqual(pose['mouth-closed'].visible,pose['mouth-open'].visible)
 const visibility=data.clips[data.states[state]].visibility
 for(const id of ['left-neutral','right-neutral','listen-arm','waiting-arms','speak-arm'])assert.equal(pose[id].visible,visibility[id],`${state}: ${id}`)
}
for(const state of Object.keys(data.states)) {
 const clip=data.clips[data.states[state]],a=sampleClip(data,clip,1),b=sampleClip(data,clip,3)
 assert.notEqual(a['body-root'].transform.y,b['body-root'].transform.y)
 assert.notEqual(a['head-root'].transform.rotation,b['head-root'].transform.rotation)
 for(let t=0;t<4;t+=.025){const pose=sampleClip(data,clip,t);assert.notEqual(pose['mouth-closed'].visible,pose['mouth-open'].visible);for(const n of Object.values(pose))for(const v of Object.values(n.transform))assert(Number.isFinite(v))}
 assert.deepEqual(sampleClip(data,clip,0),sampleClip(data,clip,4))
}
for(const id of ['listen-arm','waiting-arms','mouth-closed','mouth-open'])assert.equal(data.nodes.find(n=>n.id===id).parent,'head-root')
const timeline=new AnimationTimeline(data)
let previous=timeline.advance(.37)
for(const state of ['speaking','waiting','listening','default','waiting','speaking']) {
 timeline.setState(state)
 const immediate=timeline.advance(0)
 for(const id of Object.keys(previous))for(const key of Object.keys(previous[id].transform))assert.equal(immediate[id].transform[key],previous[id].transform[key],`interrupt continuity: ${id}.${key}`)
 assertPose(immediate,state)
 for(const delta of [.025,.045,.03]){previous=timeline.advance(delta);assertPose(previous,state)}
}
console.log('PASS: strict contract, PNG/canonical hashes, finite four-state sampling, exclusive mouths, loops, continuous micro motion, contact parents, numeric continuity on interrupted switching and target limb visibility')
