import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { readAnimationPackage } from '../../../packages/character-animation/src/package.ts'
import { sampleClip, AnimationTimeline } from '../../../packages/character-animation/src/playback.ts'
const root=new URL('./',import.meta.url),read=path=>readFileSync(new URL(path,root)),hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const data=readAnimationPackage(JSON.parse(read('package.json'))),provenance=JSON.parse(read('provenance.json'))
for(const [id,asset] of Object.entries(data.assets)) {
 const bytes=read(asset.src)
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(bytes.subarray(12,16).toString(),'IHDR')
 assert.equal(bytes.readUInt32BE(16),asset.width);assert.equal(bytes.readUInt32BE(20),asset.height)
 assert.equal(hash(bytes),provenance.parts[id].sha256)
 const state=id.replace('-source',''),canonical=read(`../../character-presets/assets/ochre-freckles/${state}.png`)
 assert.equal(hash(bytes),hash(canonical));assert.equal(hash(canonical),provenance.sources[state])
}
const heads=['head-default','head-listening','head-waiting']
const expected={default:['body','left-arm','right-arm'],listening:['listening-body','listening-arm','listening-right'],waiting:['waiting-lower','waiting-contact','waiting-arm-contact','waiting-support'],speaking:['body','left-arm','speaking-fill','speaking-arm','speaking-cap']}
function check(pose,state) {
 assert.equal(heads.filter(id=>pose[id].visible).length,1)
 for(const node of data.nodes) {
  for(const [key,v] of Object.entries(pose[node.id].transform)){assert(Number.isFinite(v));if(key.startsWith('scale'))assert.equal(v,1)}
  if(node.id==='mouth-open'){if(state!=='speaking')assert.equal(pose[node.id].visible,false);continue}
  if(node.sprite && !heads.includes(node.id))assert.equal(pose[node.id].visible,expected[state].includes(node.id),state+'/'+node.id)
 }
}
function local(t){const r=t.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),a=c*t.scaleX,b=s*t.scaleX,k=-s*t.scaleY,d=c*t.scaleY;return[a,b,k,d,t.x-a*t.pivotX-k*t.pivotY,t.y-b*t.pivotX-d*t.pivotY]}
function mul(a,b){return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]}
function world(pose){const m={};for(const n of data.nodes)m[n.id]=n.parent?mul(m[n.parent],local(pose[n.id].transform)):local(pose[n.id].transform);return m}
const evidence={}
for(const state of Object.keys(data.states)) {
 const clip=data.clips[data.states[state]];assert.deepEqual(sampleClip(data,clip,0),sampleClip(data,clip,4))
 for(let i=0;i<240;i++)check(sampleClip(data,clip,i/60),state)
 const positive=sampleClip(data,clip,1),negative=sampleClip(data,clip,3)
 assert.notDeepEqual(positive[state==='waiting'||state==='listening'?'contact-root':'head-root'],negative[state==='waiting'||state==='listening'?'contact-root':'head-root'])
 evidence[state]=Array.from({length:33},(_,i)=>({seconds:i/8,pose:sampleClip(data,clip,i/8),world:world(sampleClip(data,clip,i/8))}))
}
for(const phase of evidence.waiting) {
 const m=phase.world
 assert(m['waiting-lower'].every((v,i)=>Math.abs(v-[1,0,0,1,0,0][i])<1e-12))
 assert(Math.abs(Math.hypot(m['waiting-arm-contact'][0],m['waiting-arm-contact'][1])-1)<1e-12)
 assert(Math.abs(Math.hypot(m['waiting-arm-contact'][2],m['waiting-arm-contact'][3])-1)<1e-12)
 assert(Math.abs(m['waiting-arm-contact'][0]*m['waiting-arm-contact'][2]+m['waiting-arm-contact'][1]*m['waiting-arm-contact'][3])<1e-12)
 assert.deepEqual(m['head-waiting'],m['waiting-arm-contact'])
}
assert.equal(data.nodes.find(n=>n.id==='listening-arm').parent,'contact-root')
assert.equal(data.nodes.find(n=>n.id==='head-root').parent,'contact-root')
assert.equal(data.nodes.find(n=>n.id==='waiting-contact').sprite.mask[3][1],958)
assert.equal(data.nodes.find(n=>n.id==='waiting-lower').sprite.mask[0][1],942)
const speech=data.clips.speaking
for(let i=0;i<240;i++){const p=sampleClip(data,speech,i/60);assert.equal(p['head-default'].visible,true);assert.equal(p['head-default'].transform.scaleX,1);assert.equal(p['head-default'].transform.scaleY,1)}
assert.equal(sampleClip(data,speech,.2)['mouth-open'].visible,true)
assert.equal(sampleClip(data,speech,.4)['mouth-open'].visible,false)
assert.deepEqual(data.nodes.find(n=>n.id==='mouth-open').transform,{x:590,y:291,pivotX:0,pivotY:0,rotation:0,scaleX:1,scaleY:1})
const clock=new AnimationTimeline(data)
for(let i=0;i<100;i++) {
 const state=['speaking','waiting','listening','default'][i%4],before=clock.advance(0);clock.setState(state);const after=clock.advance(0)
 for(const id of Object.keys(before))assert.deepEqual(after[id].transform,before[id].transform)
 check(after,state);check(clock.advance([.09,.17,.27][i%3]),state)
}
mkdirSync(new URL('evidence/',root),{recursive:true});writeFileSync(new URL('evidence/poses.json',root),JSON.stringify(evidence))
console.log('PASS strict parser; 4 PNG byte hashes/actual dimensions/canonical identity; 960 finite samples; 4 loop closures; single canonical head and exclusive limbs; 33 full-parent fixed-waist/contact phases; 100 interrupted numeric-continuity sequences')
