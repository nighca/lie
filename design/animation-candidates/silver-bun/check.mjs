import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { readAnimationPackage } from '../../../packages/character-animation/src/package.ts'
import { sampleClip, AnimationTimeline } from '../../../packages/character-animation/src/playback.ts'
const dir=new URL('./',import.meta.url)
const data=readAnimationPackage(JSON.parse(fs.readFileSync(new URL('package.json',dir))))
for(const [id,asset] of Object.entries(data.assets)) {
 const bytes=fs.readFileSync(new URL(asset.src,dir))
 assert.equal(bytes.subarray(1,4).toString(),'PNG'); assert.equal(bytes.readUInt32BE(16),asset.width);assert.equal(bytes.readUInt32BE(20),asset.height)
}
const provenance=JSON.parse(fs.readFileSync(new URL('provenance.json',dir)))
for(const item of provenance.sources) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(`parts/${item.id}.png`,dir))).digest('hex'),item.sha256)
for(const [state,expected] of Object.entries(provenance.originalCanonicalStates)) {
 const source=new URL(`../../character-presets/assets/silver-bun/${state}.png`,dir)
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),expected,`canonical ${state} unchanged`)
}
function assertPose(pose,state) {
 for(const node of Object.values(pose))for(const value of Object.values(node.transform))assert(Number.isFinite(value))
 assert.notEqual(pose['mouth-closed'].visible,pose['mouth-open'].visible)
 const visibility=data.clips[data.states[state]].visibility
 for(const id of ['torso','waiting-torso','waiting-lower-body','listening-torso','left-neutral','right-neutral','listen-arm','waiting-arms','speak-arm'])assert.equal(pose[id].visible,visibility[id]??data.nodes.find(node=>node.id===id).visible,`${state}: ${id}`)
}
for(const state of Object.keys(data.states)) {
 const clip=data.clips[data.states[state]],a=sampleClip(data,clip,1),b=sampleClip(data,clip,3)
 if(state==='waiting'){
  assert.equal(a['body-root'].transform.y,800);assert.equal(b['body-root'].transform.y,800)
  assert.equal(a['head-root'].transform.rotation,0);assert.equal(b['head-root'].transform.rotation,0)
  assert.notEqual(a['head-root'].transform.scaleY,b['head-root'].transform.scaleY)
 }else{
  assert.notEqual(a['body-root'].transform.y,b['body-root'].transform.y)
  assert.notEqual(a['head-root'].transform.rotation,b['head-root'].transform.rotation)
 }
 for(let t=0;t<4;t+=.025){const pose=sampleClip(data,clip,t);assert.notEqual(pose['mouth-closed'].visible,pose['mouth-open'].visible);if(state==='waiting'){assert.deepEqual(pose['body-root'].transform,data.nodes.find(node=>node.id==='body-root').transform);assert.deepEqual(pose['waiting-lower-body'].transform,data.nodes.find(node=>node.id==='waiting-lower-body').transform);assert.equal(pose['head-root'].transform.rotation,0);assert.equal(pose['head-root'].transform.x,625);assert.equal(pose['head-root'].transform.pivotY,850);assert.equal(pose['head-root'].transform.y,850);assert.equal(pose['head-root'].transform.scaleX,1)}for(const n of Object.values(pose))for(const v of Object.values(n.transform))assert(Number.isFinite(v))}
 assert.deepEqual(sampleClip(data,clip,0),sampleClip(data,clip,4))
}
for(const id of ['listen-arm','listening-torso','waiting-arms','waiting-torso','mouth-closed','mouth-open'])assert.equal(data.nodes.find(n=>n.id===id).parent,'head-root')
assert.deepEqual(data.nodes.find(node=>node.id==='listening-torso').transform,data.nodes.find(node=>node.id==='listen-arm').transform)
assert.deepEqual(data.nodes.find(node=>node.id==='waiting-torso').transform,data.nodes.find(node=>node.id==='waiting-arms').transform)
assert.equal(data.nodes.find(node=>node.id==='waiting-lower-body').parent,'body-root')
assert.equal(data.nodes.find(node=>node.id==='waiting-lower-body').visible,false)
const torso=data.nodes.find(node=>node.id==='torso')
function inside([x,y],polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))result=!result}return result}
for(const id of ['right-neutral','speak-arm']) {
 const node=data.nodes.find(node=>node.id===id)
 const values=Object.values(data.clips).flatMap(clip=>clip.tracks.filter(track=>track.node===id&&track.property==='rotation').flatMap(track=>track.keys.map(key=>key.value)))
 for(const angle of [Math.min(...values),Math.max(...values)])for(const [x,y] of [[818,456],[825,458],[832,460],[840,464],[848,468]]) {
  const r=angle*Math.PI/180, dx=(x-node.transform.pivotX)*node.transform.scaleX, dy=(y-node.transform.pivotY)*node.transform.scaleY
  const rotated=[node.transform.x+dx*Math.cos(r)-dy*Math.sin(r),node.transform.y+dx*Math.sin(r)+dy*Math.cos(r)]
  const local=[(rotated[0]-torso.transform.x)/torso.transform.scaleX+torso.transform.pivotX,(rotated[1]-torso.transform.y)/torso.transform.scaleY+torso.transform.pivotY]
  assert(inside(local,torso.sprite.mask),`${id} shoulder bridge covered at ${angle} degrees: ${x},${y}`)
 }
}
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
