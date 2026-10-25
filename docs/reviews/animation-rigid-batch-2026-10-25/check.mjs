import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
const root=process.argv[2], base='8be6d0315a393281484d65fa903353d4ea666739', head='22b2ee8b635b2e6944d3801721673bc5122dfa3b'
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'})
const {readAnimationPackage}=await import(path.join(root,'packages/character-animation/src/package.ts'))
const {sampleClip,AnimationTimeline}=await import(path.join(root,'packages/character-animation/src/playback.ts'))
assert.equal(git('rev-parse','HEAD').trim(),head);assert.equal(git('status','--porcelain').trim(),'')
const ids=['silver-bun','salt-pepper-beard','plum-crop','mint-puffs','ochre-freckles']
const commits=git('rev-list','--reverse',`${base}..${head}`).trim().split('\n')
assert.equal(commits.length,20)
const perCommit=[]
for(const sha of commits){
 const files=git('diff-tree','--no-commit-id','--name-only','-r',sha).trim().split('\n')
 assert(files.every(file=>file.startsWith('design/animation-candidates/')||file.startsWith('design/character-presets/assets/')||file.startsWith('docs/animation/')))
 let json=0,packages=0
 for(const file of files.filter(file=>file.endsWith('.json'))){const value=JSON.parse(git('show',`${sha}:${file}`));json++;if(value.schemaVersion===1){readAnimationPackage(value);packages++}}
 perCommit.push({sha,subject:git('show','-s','--format=%s',sha).trim(),files:files.length,jsonParsed:json,animationPackagesParsed:packages})
}
const files=git('diff','--name-only',base,head).trim().split('\n')
assert.equal(files.length,183)
const formal=files.filter(file=>file.startsWith('design/character-presets/'))
assert.deepEqual(formal.sort(),ids.map(id=>`design/character-presets/assets/${id}/animation/package.json`).sort())
assert.equal(git('diff',base,head,'--','packages','apps','scripts','package.json','package-lock.json','design/character-presets/manifest.json'),'')
assert.equal(git('diff','abb12dbf7a40689be593c2a1e580f23cfcc5611e',base,'--','packages/character-animation','design/animation-candidates','design/character-presets'),'')
const accepted=JSON.parse(fs.readFileSync(path.join(root,'docs/animation/2026-10-25-rigid-motion-game-integration/accepted-package-sha256.json')))
const {createHash}=await import('node:crypto');const hash=b=>createHash('sha256').update(b).digest('hex')
const results=[]
for(const id of ids){
 const candidate=path.join(root,`design/animation-candidates/${id}/package.json`), bytes=fs.readFileSync(candidate)
 assert.equal(hash(bytes),accepted[id]);assert.equal(hash(fs.readFileSync(path.join(root,`design/character-presets/assets/${id}/animation/package.json`))),accepted[id])
 const generated=path.join(root,`apps/web/public/appearances/${id}/animation/package.json`)
 assert.equal(hash(fs.readFileSync(generated)),accepted[id])
 const data=readAnimationPackage(JSON.parse(bytes)), old=readAnimationPackage(JSON.parse(git('show',`${base}:design/animation-candidates/${id}/package.json`)))
 assert.deepEqual(data.assets,old.assets)
 for(const asset of Object.values(data.assets)){
  const current=fs.readFileSync(path.join(path.dirname(candidate),asset.src))
  const original=execFileSync('git',['-C',root,'show',`${base}:design/animation-candidates/${id}/${asset.src}`])
  assert.equal(hash(current),hash(original))
  assert.equal(hash(current),hash(fs.readFileSync(path.join(root,`design/character-presets/assets/${id}/animation/${asset.src}`))))
 }
 let samples=0,unchanged=0
 function world(d,p){const map={};for(const n of d.nodes){const t=p[n.id].transform,r=t.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),a=c*t.scaleX,b=s*t.scaleX,k=-s*t.scaleY,v=c*t.scaleY;const m=[a,b,k,v,t.x-a*t.pivotX-k*t.pivotY,t.y-b*t.pivotX-v*t.pivotY];const q=n.parent?map[n.parent]:null;map[n.id]=q?[q[0]*a+q[2]*b,q[1]*a+q[3]*b,q[0]*k+q[2]*v,q[1]*k+q[3]*v,q[0]*m[4]+q[2]*m[5]+q[4],q[1]*m[4]+q[3]*m[5]+q[5]]:m}return map}
 for(const state of Object.keys(data.states)){
  const clip=data.clips[data.states[state]]
  const target=state==='waiting'||(id==='mint-puffs'&&['default','listening'].includes(state))||(id==='ochre-freckles'&&state==='speaking')
  if(target)assert(!clip.tracks.some(t=>t.property==='scaleX'||t.property==='scaleY'))
  for(const track of clip.tracks)if(track.interpolation==='linear')assert(Math.abs(Number(track.keys[0].value)-Number(track.keys.at(-1).value))<1e-8)
  for(let i=0;i<=240;i++){
   const p=sampleClip(data,clip,i*clip.duration/240), w=world(data,p)
   for(const v of Object.values(p))for(const value of Object.values(v.transform))assert(Number.isFinite(value))
   if(!['mint-puffs','ochre-freckles'].includes(id)&&state!=='waiting'){
    const q=sampleClip(old,old.clips[old.states[state]],i*clip.duration/240),v=world(old,q)
    for(const n of old.nodes.filter(n=>n.sprite&&q[n.id].visible)){assert(p[n.id].visible);assert.deepEqual(w[n.id],v[n.id]);assert.deepEqual(data.nodes.find(x=>x.id===n.id).sprite,n.sprite)}unchanged++
   }
   samples++
  }
 }
 const clock=new AnimationTimeline(data);for(let i=0;i<100;i++){const before=clock.advance(0);clock.setState(['waiting','speaking','default','listening'][i%4]);const after=clock.advance(0);for(const n of data.nodes)assert.deepEqual(after[n.id].transform,before[n.id].transform);clock.advance(.07)}
 results.push({id,sha256:accepted[id],candidateFormalGeneratedIdentical:true,nativePartsUnchanged:true,sampledPoses:samples,unchangedNonwaitingPoses:unchanged,interruptionSequences:100})
}
console.log(JSON.stringify({base,head,perCommit,finalFiles:files.length,formalFiles:formal,results},null,2))
