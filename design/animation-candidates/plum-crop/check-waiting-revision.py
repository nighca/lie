"""Read-only alpha and pose audit. Does not write or transform PNG files."""
import json, math, subprocess, os
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent
repo=root.parents[2]
p=json.loads((root/'package.json').read_text())
b=json.loads((root/'archive/2026-10-25-waiting-visibility/baseline-package.json').read_text())
old=b['clips'][b['states']['waiting']]
new=p['clips'][p['states']['waiting']]
assert p['nodes']==b['nodes'] and p['assets']==b['assets']
assert p['states']==b['states'] and p['transitions']==b['transitions']
for state in p['states']:
 if state!='waiting':assert p['clips'][p['states'][state]]==b['clips'][b['states'][state]]
normalized=json.loads(json.dumps(p))
for i,t in enumerate(new['tracks']):
 if t['property']=='scaleY':
  amplitude=.015
  assert min(k['value'] for k in t['keys'])==1-amplitude
  assert max(k['value'] for k in t['keys'])==1+amplitude
  normalized['clips'][p['states']['waiting']]['tracks'][i]=old['tracks'][i]
 elif root.name=='plum-crop' and t['node']=='head-root' and t['property']=='y':
  assert all(k['value']==859 for k in t['keys'])
  normalized['clips'][p['states']['waiting']]['tracks'][i]=old['tracks'][i]
assert normalized==b,'only waiting scaleY key values may change'
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
lower='body-waiting-lower' if root.name=='salt-pepper-beard' else 'waiting-lower-body'
upper='contact-root' if root.name=='salt-pepper-beard' else 'head-root'
waist=915 if root.name=='salt-pepper-beard' else 850
base=worlds(poses[0]);bounds=[]
for pose in poses:
 w=worlds(pose)
 assert np.array_equal(w[lower],base[lower])
 anchor=waist+(9 if root.name=='plum-crop' else 0)
 assert abs((w[upper]@np.array([620,waist,1]))[1]-anchor)<1e-8
 assert abs(w[upper][0,1])<1e-9 and abs(w[upper][1,0])<1e-9
 phasebounds=[]
 for id,pts in points.items():
  m=w[id];q=np.stack([m[0,0]*pts[0]+m[0,1]*pts[1]+m[0,2],m[1,0]*pts[0]+m[1,1]*pts[1]+m[1,2]])
  assert np.isfinite(q).all()
  phasebounds.append([float(q[0].min()),float(q[1].min()),float(q[0].max()),float(q[1].max())])
 bounds.append([min(v[0] for v in phasebounds),min(v[1] for v in phasebounds),max(v[2] for v in phasebounds),max(v[3] for v in phasebounds)])
assert min(v[1] for v in bounds)>=0,('hair crop',min(v[1] for v in bounds))
assert min(v[0] for v in bounds)>=0 and max(v[2] for v in bounds)<=p['canvas']['width']
print('PASS only waiting scaleY keys (plus plum static upper offset) changed; other states/assets/nodes exact baseline; 33 sampled full-parent fixed lower-body/waist/no side-sway; nonempty masked native-alpha bounds')
print(json.dumps({'role':root.name,'amplitude':amplitude,'period':new['duration'],'nonzeroAlphaPixels':sum(v.shape[1] for v in points.values()),'waitingBounds':[min(v[0] for v in bounds),min(v[1] for v in bounds),max(v[2] for v in bounds),max(v[3] for v in bounds)],'headVerticalPeakToPeakAtY250':2*amplitude*(waist-250)},indent=2))
print('Native alpha >0 at pixel centers; no antialias/color/duplicate contour judgement. Browser artistic acceptance and user confirmation remain required.')

# Opaque native source interiors at the upper/lower join, sampled through every real parent transform.
def in_mask(x,y,poly):
 inside=np.zeros(x.shape,dtype=bool)
 for i,(xi,yi) in enumerate(poly):
  xj,yj=poly[i-1]
  if yi!=yj:inside^=((yi>y)!=(yj>y)) & (x<(xj-xi)*(y-yi)/(yj-yi)+xi)
 return inside
images={id:np.asarray(Image.open(root/a['src'])) for id,a in p['assets'].items()}
reference=images['waiting-source']
yy,xx=np.mgrid[waist-8:waist+9:2,420:900:2]
x=xx.flatten()+.5;y=yy.flatten()+.5
keep=reference[yy.flatten(),xx.flatten(),3]>=240
x=x[keep];y=y[keep];assert len(x)>0
probes=0
for pose in poses:
 w=worlds(pose);opacity=np.zeros(x.shape,dtype=np.uint8)
 for n in p['nodes']:
  if n['id'] not in points:continue
  sp=n['sprite'];inv=np.linalg.inv(w[n['id']]);u=inv[0,0]*x+inv[0,1]*y+inv[0,2];v=inv[1,0]*x+inv[1,1]*y+inv[1,2]
  included=in_mask(u,v,sp['mask']) if 'mask' in sp else np.ones(x.shape,dtype=bool)
  if 'crop' in sp:u=u+sp['crop'][0];v=v+sp['crop'][1]
  im=images[sp['asset']];ix=np.floor(u).astype(int);iy=np.floor(v).astype(int)
  included&=(ix>=0)&(ix<im.shape[1])&(iy>=0)&(iy<im.shape[0])
  opacity[included]=np.maximum(opacity[included],im[iy[included],ix[included],3])
 assert np.all(opacity>=128),('waist seam',int(np.sum(opacity<128)))
 probes+=len(x)
print(f'PASS {probes} native-alpha waist interior probes over 33 real sampled full-parent phases; nearest source alpha, not Canvas color judgement.')
