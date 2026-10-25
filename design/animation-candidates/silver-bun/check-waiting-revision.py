"""Read-only alpha and pose audit. Does not write or transform PNG files."""
import json, math, subprocess, os
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent
repo=root.parents[2]
p=json.loads((root/'package.json').read_text())
b=json.loads((root/'archive/2026-10-25-waiting-visibility/baseline-package.json').read_text())
assert p['assets']==b['assets'] and p['states']==b['states'] and p['transitions']==b['transitions']
new=p['clips'][p['states']['waiting']]
for state in p['states']:
 if state=='waiting':continue
 before=b['clips'][b['states'][state]];after=p['clips'][p['states'][state]]
 assert after['tracks']==before['tracks']
 for id,value in before['visibility'].items():assert after['visibility'][id]==value
 for id,value in after['visibility'].items():
  if id not in before['visibility']:
   old_node=next((n for n in b['nodes'] if n['id']==id),None)
   assert value==(old_node['visible'] if old_node else False)
for n in b['nodes']:
 if n['id'] not in ['waiting-arms','waiting-torso']:
  assert n==next(x for x in p['nodes'] if x['id']==n['id'])
code="""
import fs from 'node:fs';
import {readAnimationPackage} from './packages/character-animation/src/package.ts';
import {sampleClip} from './packages/character-animation/src/playback.ts';
const data=readAnimationPackage(JSON.parse(fs.readFileSync(process.argv[1]))),clip=data.clips[data.states.waiting];
console.log(JSON.stringify(Array.from({length:33},(_,i)=>sampleClip(data,clip,clip.duration*i/32))));
"""
poses=json.loads(subprocess.check_output(['node','--experimental-transform-types','--input-type=module','-e',code,str(root/'package.json')],cwd=repo))
def matrix(t):
 r=math.radians(t['rotation']);c=math.cos(r);s=math.sin(r)
 a=c*t['scaleX'];b=s*t['scaleX'];k=-s*t['scaleY'];d=c*t['scaleY']
 return np.array([[a,k,t['x']-a*t['pivotX']-k*t['pivotY']],[b,d,t['y']-b*t['pivotX']-d*t['pivotY']],[0,0,1]])
def worlds(pose):
 out={}
 def at(id):
  n=next(n for n in p['nodes'] if n['id']==id)
  if id not in out:out[id]=(at(n['parent']) if n['parent'] else np.eye(3))@matrix(pose[id]['transform'])
  return out[id]
 for n in p['nodes']:at(n['id'])
 return out
points={}
for n in p['nodes']:
 if 'sprite' not in n or not poses[0][n['id']]['visible']:continue
 s=n['sprite'];im=np.asarray(Image.open(root/p['assets'][s['asset']]['src']))
 crop=s.get('crop',[0,0,im.shape[1],im.shape[0]])
 x0,y0,w,h=crop;alpha=im[y0:y0+h,x0:x0+w,3]
 yy,xx=np.nonzero(alpha>0);x=xx+.5;y=yy+.5
 if 'mask' in s:
  inside=np.zeros(x.shape,dtype=bool);poly=s['mask']
  for i,(xi,yi) in enumerate(poly):
   xj,yj=poly[i-1]
   if yi!=yj:inside^=((yi>y)!=(yj>y)) & (x<(xj-xi)*(y-yi)/(yj-yi)+xi)
  x=x[inside];y=y[inside]
 assert len(x)>0,n['id']
 points[n['id']]=np.stack([x,y,np.ones(len(x))])
lower='waiting-lower-body'
upper='head-root'
waist=850
base=worlds(poses[0]);bounds=[]
contact_ids=['head','mouth-closed','waiting-hand']
reference_columns={id:base[id][:2,:2].T@base[id][:2,:2] for id in contact_ids}
relative=np.linalg.inv(base['head'])@base['waiting-hand']
for pose in poses:
 w=worlds(pose)
 assert np.array_equal(w[lower],base[lower])
 for id in contact_ids:
  gram=w[id][:2,:2].T@w[id][:2,:2]
  assert np.allclose(gram,reference_columns[id],atol=1e-12),('non-rigid head/contact',id)
  assert abs(gram[0,1])<1e-12,('nonorthogonal',id)
 assert np.allclose(np.linalg.inv(w['head'])@w['waiting-hand'],relative,atol=1e-10)
 assert np.allclose(w['waiting-torso'][:2,:2],np.eye(2)),'torso must not rotate with head'
 phasebounds=[]
 for id,pts in points.items():
  m=w[id];q=np.stack([m[0,0]*pts[0]+m[0,1]*pts[1]+m[0,2],m[1,0]*pts[0]+m[1,1]*pts[1]+m[1,2]])
  assert np.isfinite(q).all()
  phasebounds.append([float(q[0].min()),float(q[1].min()),float(q[0].max()),float(q[1].max())])
 bounds.append([min(v[0] for v in phasebounds),min(v[1] for v in phasebounds),max(v[2] for v in phasebounds),max(v[3] for v in phasebounds)])
assert not np.allclose(worlds(poses[8])['head-root'],worlds(poses[24])['head-root'])
assert not np.allclose(worlds(poses[8])['waiting-torso'],worlds(poses[24])['waiting-torso'])
assert min(v[1] for v in bounds)>=0,('hair crop',min(v[1] for v in bounds))
assert min(v[0] for v in bounds)>=0 and max(v[2] for v in bounds)<=p['canvas']['width']
print('PASS exact nonwaiting tracks/visibility and original nonwaiting node definitions; 33 real full-parent rigid head/contact matrices: column lengths invariant/orthogonal, head-to-hand relation constant, fixed lower body and torso has no head rotation')
print(json.dumps({'role':root.name,'period':new['duration'],'nonzeroAlphaPixels':sum(v.shape[1] for v in points.values()),'waitingBounds':[min(v[0] for v in bounds),min(v[1] for v in bounds),max(v[2] for v in bounds),max(v[3] for v in bounds)]},indent=2))
print('Native alpha >0 at pixel centers; not antialiased color/duplicate-contour judgement. Parent browser artistic review and user confirmation remain required.')

# Opaque native source interiors at the upper/lower join, sampled through every real parent transform.
def in_mask(x,y,poly):
 inside=np.zeros(x.shape,dtype=bool)
 for i,(xi,yi) in enumerate(poly):
  xj,yj=poly[i-1]
  if yi!=yj:inside^=((yi>y)!=(yj>y)) & (x<(xj-xi)*(y-yi)/(yj-yi)+xi)
 return inside
images={id:np.asarray(Image.open(root/a['src'])) for id,a in p['assets'].items()}
reference=images['waiting-source']
yy1,xx1=np.mgrid[waist-8:waist+9:2,420:900:2]
yy2,xx2=np.mgrid[440:640:2,500:650:2]
yy3,xx3=np.mgrid[610:686:2,420:650:2]
yy=np.concatenate([yy1.flatten(),yy2.flatten(),yy3.flatten()]);xx=np.concatenate([xx1.flatten(),xx2.flatten(),xx3.flatten()])
x=xx.flatten()+.5;y=yy.flatten()+.5
keep=reference[yy.flatten(),xx.flatten(),3]>=240
for dx,dy in [(3,0),(-3,0),(0,3),(0,-3)]:keep &= reference[yy.flatten()+dy,xx.flatten()+dx,3]>=240
x=x[keep];y=y[keep];assert len(x)>0
def draw_alpha(w,x,y):
 opacity=np.zeros(x.shape,dtype=np.uint8)
 for n in p['nodes']:
  if n['id'] not in points:continue
  sp=n['sprite'];inv=np.linalg.inv(w[n['id']]);u=inv[0,0]*x+inv[0,1]*y+inv[0,2];v=inv[1,0]*x+inv[1,1]*y+inv[1,2]
  included=in_mask(u,v,sp['mask']) if 'mask' in sp else np.ones(x.shape,dtype=bool)
  if 'crop' in sp:u=u+sp['crop'][0];v=v+sp['crop'][1]
  im=images[sp['asset']];ix=np.floor(u).astype(int);iy=np.floor(v).astype(int)
  included&=(ix>=0)&(ix<im.shape[1])&(iy>=0)&(iy<im.shape[0])
  opacity[included]=np.maximum(opacity[included],im[iy[included],ix[included],3])
 return opacity
probes=0
for pose in poses:
 w=worlds(pose);opacity=draw_alpha(w,x,y)
 assert np.all(opacity>=128),('waist/contact seam',int(np.sum(opacity<128)),list(zip(x[opacity<128][:12],y[opacity<128][:12])))
 probes+=len(x)
print(f'PASS {probes} native-alpha waist/contact interior probes over 33 real sampled full-parent phases; nearest source alpha, not Canvas color judgement.')

# Neck skin interior probes follow the actual head/contact group world matrix.
y0,y1,x0,x1={'silver-bun':(390,500,620,740),'salt-pepper-beard':(350,455,605,735),'plum-crop':(375,485,635,720)}[root.name]
ny,nx=np.mgrid[y0:y1:2,x0:x1:2]
def skin_at(x,y):
 rgba=reference[y,x].astype(float)
 return (rgba[...,3]>=240)&(rgba[...,0]>140)&(rgba[...,1]>70)&(rgba[...,1]<220)&(rgba[...,2]<170)&(rgba[...,0]>rgba[...,1]*1.15)
keep=skin_at(nx,ny)
for dx,dy in [(4,0),(-4,0),(0,4),(0,-4)]:keep &= skin_at(nx+dx,ny+dy)
nx=nx[keep]+.5;ny=ny[keep]+.5;assert len(nx)>0
neck_probes=0
for pose in poses:
 w=worlds(pose);m=w['contact-root' if root.name=='salt-pepper-beard' else 'head-root']
 xw=m[0,0]*nx+m[0,1]*ny+m[0,2];yw=m[1,0]*nx+m[1,1]*ny+m[1,2]
 opacity=draw_alpha(w,xw,yw)
 assert np.all(opacity>=128),('neck interior',int(np.sum(opacity<128)),list(zip(nx[opacity<128][:8],ny[opacity<128][:8])))
 neck_probes+=len(nx)
print(f'PASS {neck_probes} neck skin interior probes with4px skin margin, following contact world matrices over33 phases; alpha only, collar/outline color requires native Canvas review.')

other_code="""
import fs from 'node:fs';import assert from 'node:assert/strict';
import {readAnimationPackage} from './packages/character-animation/src/package.ts';
import {sampleClip} from './packages/character-animation/src/playback.ts';
const current=readAnimationPackage(JSON.parse(fs.readFileSync(process.argv[1]))),before=readAnimationPackage(JSON.parse(fs.readFileSync(process.argv[2])));
function local(t){const r=t.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),a=c*t.scaleX,b=s*t.scaleX,k=-s*t.scaleY,d=c*t.scaleY;return[a,b,k,d,t.x-a*t.pivotX-k*t.pivotY,t.y-b*t.pivotX-d*t.pivotY]}
function mul(a,b){return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]}
function world(data,pose){let result={};for(const n of data.nodes)result[n.id]=n.parent?mul(result[n.parent],local(pose[n.id].transform)):local(pose[n.id].transform);return result}
let count=0;for(const state of ['default','listening','speaking'])for(let i=0;i<240;i++){const ca=current.clips[current.states[state]],ba=before.clips[before.states[state]],p=sampleClip(current,ca,i*ca.duration/240),q=sampleClip(before,ba,i*ba.duration/240),pw=world(current,p),qw=world(before,q);for(const n of before.nodes)if(q[n.id].visible&&n.sprite){assert(p[n.id].visible);assert.deepEqual(pw[n.id],qw[n.id]);assert.deepEqual(current.nodes.find(v=>v.id===n.id).sprite,n.sprite);count++}for(const n of current.nodes)if(n.sprite&&!before.nodes.some(v=>v.id===n.id))assert.equal(p[n.id].visible,false)}console.log('PASS exact visible native sprite and full-parent world matrix identity for720 nonwaiting real sampled poses; '+count+' rendered-node comparisons')
"""
print(subprocess.check_output(["node","--experimental-transform-types","--input-type=module","-e",other_code,str(root/"package.json"),str(root/"archive/2026-10-25-waiting-visibility/baseline-package.json")],cwd=repo,text=True).strip())
