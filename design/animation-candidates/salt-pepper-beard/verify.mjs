import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readAnimationPackage } from '../../../packages/character-animation/src/package.ts'
import { AnimationTimeline, sampleClip } from '../../../packages/character-animation/src/playback.ts'
const root=new URL('./',import.meta.url)
const data=readAnimationPackage(JSON.parse(readFileSync(new URL('package.json',root))))
const provenance=JSON.parse(readFileSync(new URL('provenance.json',root)))
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
for(const [id,asset] of Object.entries(data.assets)) {
 const bytes=readFileSync(new URL(asset.src,root))
 assert.deepEqual(bytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]))
 assert.equal(bytes.subarray(12,16).toString(),'IHDR')
 assert.equal(bytes.readUInt32BE(16),asset.width)
 assert.equal(bytes.readUInt32BE(20),asset.height)
 assert.equal(hash(bytes),provenance.parts[id].sha256)
 assert.deepEqual(provenance.parts[id].alphaExtrema,[0,255])
}
for(const [state,meta] of Object.entries(provenance.sources)) {
 const original=readFileSync(new URL(`../../character-presets/assets/salt-pepper-beard/${state}.png`,root))
 assert.equal(hash(original),meta.sha256)
 assert.equal(meta.sha256,provenance.parts[state+'-source'].sha256)
}
const expectedArms={default:['arm-left','arm-right'],listening:['arm-listening','arm-right-listening'],waiting:[],speaking:['arm-left','sleeve-speaking','arm-speaking']}
const heads=['head-default','head-listening','head-waiting','head-speaking']
function checkPose(pose,state,elapsed) {
 const target=sampleClip(data,data.clips[data.states[state]],elapsed)
 for(const [id,node] of Object.entries(pose)) {
  for(const value of Object.values(node.transform))assert(Number.isFinite(value),`${state}/${id}: finite transform`)
  assert.equal(node.visible,target[id].visible,`${state}/${id}: immediate target visibility`)
 }
 assert.equal(heads.filter(id=>pose[id].visible).length,1,`${state}: exactly one head/mouth`)
 assert.equal(pose['contact-waiting'].visible,state==='waiting')
 assert.equal(pose['body-waiting-lower'].visible,state==='waiting')
 if(state==='speaking')assert(pose['head-default'].visible || pose['head-speaking'].visible)
 else assert(pose['head-'+state].visible)
 for(const node of data.nodes.filter(node=>node.id.startsWith('arm-') || node.id.startsWith('sleeve-')))assert.equal(pose[node.id].visible,expectedArms[state].includes(node.id),`${state}/${node.id}: state-specific attachment`)
}
for(const [state,id] of Object.entries(data.states)) {
 const clip=data.clips[id]
 assert.deepEqual(sampleClip(data,clip,0),sampleClip(data,clip,clip.duration))
 for(let i=0;i<240;i++)checkPose(sampleClip(data,clip,i*clip.duration/240),state,i*clip.duration/240)
 const positive=sampleClip(data,clip,clip.duration*.25),negative=sampleClip(data,clip,clip.duration*.75)
 if(state==='waiting')assert.deepEqual(positive['body-root'].transform,negative['body-root'].transform)
 else assert.notDeepEqual(positive['body-root'].transform,negative['body-root'].transform)
 assert.notDeepEqual(positive[state==='listening'||state==='waiting'?'contact-root':'head-root'].transform,negative[state==='listening'||state==='waiting'?'contact-root':'head-root'].transform)
}
function local(t) {
 const r=t.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),a=c*t.scaleX,b=s*t.scaleX,k=-s*t.scaleY,d=c*t.scaleY
 return [a,b,k,d,t.x-a*t.pivotX-k*t.pivotY,t.y-b*t.pivotX-d*t.pivotY]
}
function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]}
function world(pose) {
 const result=new Map()
 for(const node of data.nodes){const matrix=local(pose[node.id].transform);result.set(node.id,node.parent==null?matrix:multiply(result.get(node.parent),matrix))}
 return result
}
const waiting=data.clips[data.states.waiting]
assert(!waiting.tracks.some(t=>t.property==='scaleX'||t.property==='scaleY'))
const baseline=world(sampleClip(data,waiting,0)).get('body-waiting-lower')
for(let i=0;i<=240;i++) {
 const matrices=world(sampleClip(data,waiting,waiting.duration*i/240)),lower=matrices.get('body-waiting-lower'),upper=matrices.get('contact-waiting')
 assert.deepEqual(lower,baseline,'waiting full-parent lower body remains fixed')
 assert(Math.abs(upper[1])<1e-12);assert(Math.abs(upper[2])<1e-12);assert.equal(upper[0],1)
 assert(Math.abs(upper[0]*620+upper[2]*915+upper[4]-620)<1e-9)
 assert.equal(upper[3],1,'torso never stretches')
 assert.deepEqual(matrices.get('head-waiting'),matrices.get('waiting-hand'),'chin contact shares full parent transform')
}
assert.equal(data.nodes.find(node=>node.id==='head-root').parent,'contact-root')
for(const id of ['arm-listening','waiting-hand','neck-waiting']) {
 const node=data.nodes.find(node=>node.id===id)
 assert.equal(node.parent,'contact-root')
 assert.equal(node.sprite.asset,id==='arm-listening'?'listening-source':'waiting-source')
 assert.deepEqual(node.transform,{x:0,y:0,pivotX:0,pivotY:0,rotation:0,scaleX:1,scaleY:1})
}
for(const id of ['sleeve-speaking','arm-speaking']) {
 const node=data.nodes.find(node=>node.id===id)
 assert.equal(node.parent,'speaking-root')
 assert.equal(node.sprite.asset,'speaking-source')
}
assert.equal(data.nodes.find(n=>n.id==='contact-waiting').parent,'waiting-breath-root')
assert.equal(data.nodes.find(node=>node.id==='body-waiting-lower').parent,'body-root')
assert.equal(data.nodes.find(node=>node.id==='body-waiting-lower').sprite.asset,'waiting-source')
assert.equal(data.nodes.find(node=>node.id==='contact-waiting').sprite.asset,'waiting-source')
const timeline=new AnimationTimeline(data)
timeline.setState('speaking')
checkPose(timeline.advance(.11),'speaking',.11)
for(let i=0;i<100;i++) {
 const state=['listening','waiting','speaking','default'][i%4],before=timeline.advance(0)
 timeline.setState(state)
 const after=timeline.advance(0)
 for(const id of Object.keys(before))assert.deepEqual(after[id].transform,before[id].transform,`${state}/${id}: numeric continuity on interruption`)
 checkPose(after,state,0)
 const elapsed=[.09,.17,.21][i%3]
 checkPose(timeline.advance(elapsed),state,elapsed)
}
console.log(`PASS: strict v1 and pixel budget; ${Object.keys(data.assets).length} PNG dimensions/hashes/alpha; 4 canonical source hashes; 960 samples; 4 loop closures; single head/mouth and state attachments; contact registration; 241 full-parent waiting fixed-lower/contact samples; 100 interrupted settles with continuous finite transforms and target visibility`)
