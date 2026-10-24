"""Read-only source-alpha/mask audit; never writes images."""
import json, math, subprocess, os
from pathlib import Path
from PIL import Image
d=Path(__file__).resolve().parent
repo=d.parents[2]
data=json.loads((d/'package.json').read_text())
images={k:Image.open(d/a['src']).convert('RGBA') for k,a in data['assets'].items()}
def inside(x,y,poly):
 result=False
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
 return result
# Static canonical body coverage in each state. Speaking intentionally reuses default torso/left arm.
for state,ids in [('default',['torso','left-neutral','right-neutral']),('listening',['listening-torso','listen-arm','right-neutral']),('waiting',['waiting-torso','waiting-arms','waiting-lower-body'])]:
 im=images[state+'-source']
 polygons=[n['sprite']['mask'] for n in data['nodes'] if n['id'] in ids]
 missing=[]
 for y in range(500,1254,2):
  for x in range(240,1070,2):
   if im.getpixel((x,y))[3]>=200 and not any(inside(x,y,p) for p in polygons):missing.append((x,y))
 assert not missing,(state,'clipped canonical body pixels',len(missing),missing[:12])
torso=next(n for n in data['nodes'] if n['id']=='torso')['sprite']['mask']
for y in range(925,1254):
 for x in range(910,1050):
  r,g,b,a=images['default-source'].getpixel((x,y))
  if a>=200 and r>130 and r>g*1.3 and g>b*1.15:assert not inside(x,y,torso),('lowered arm retained in torso',x,y)
hand=next(n for n in data['nodes'] if n['id']=='speak-arm')['sprite']['mask']
hand_pixels=0
for y in range(615,756):
 for x in range(710,881):
  r,g,b,a=images['speaking-source'].getpixel((x,y))
  if a>=200 and r>130 and r>g*1.3 and g>b*1.15:
   hand_pixels+=1
   assert inside(x,y,hand),('clipped original speaking hand skin',x,y)
for point in [(755,664),(775,667),(805,687),(785,750),(750,733),(740,729)]:
 assert inside(*point,hand),('clipped original hand ink probe',point)
def local(t):
 r=t['rotation']*math.pi/180;c=math.cos(r);s=math.sin(r);a=c*t['scaleX'];b=s*t['scaleX'];e=-s*t['scaleY'];f=c*t['scaleY']
 return [a,b,e,f,t['x']-a*t['pivotX']-e*t['pivotY'],t['y']-b*t['pivotX']-f*t['pivotY']]
def multiply(a,b):return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]
def inverse(m,x,y):
 det=m[0]*m[3]-m[1]*m[2];x-=m[4];y-=m[5]
 return ((m[3]*x-m[2]*y)/det,(-m[1]*x+m[0]*y)/det)
def alpha(pose,x,y):
 matrices={};visible={};result=0
 for n in data['nodes']:
  m=local(pose[n['id']]['transform']);parent=n['parent']
  matrices[n['id']]=m if parent is None else multiply(matrices[parent],m)
  visible[n['id']]=pose[n['id']]['visible'] and (parent is None or visible[parent])
  sp=n.get('sprite')
  if not sp or not visible[n['id']]:continue
  u,v=inverse(matrices[n['id']],x,y)
  if sp.get('mask') and not inside(u,v,sp['mask']):continue
  if sp.get('crop'):u+=sp['crop'][0];v+=sp['crop'][1]
  im=images[sp['asset']];u=round(u);v=round(v)
  if 0<=u<im.width and 0<=v<im.height:result=max(result,im.getpixel((u,v))[3])
 return result
js="""import fs from 'node:fs';import{readAnimationPackage}from './packages/appearance-animation/src/package.ts';import{sampleClip}from './packages/appearance-animation/src/playback.ts';const p=readAnimationPackage(JSON.parse(fs.readFileSync('design/animation-candidates/plum-crop/package.json')));console.log(JSON.stringify(Object.fromEntries(Object.keys(p.states).map(s=>[s,Array.from({length:32},(_,i)=>sampleClip(p,p.clips[p.states[s]],i/8))]))));"""
env={**os.environ,'PATH':'/private/tmp/lie-toolchain-node/node-v24.22.1-darwin-arm64/bin:'+os.environ['PATH']}
poses=json.loads(subprocess.check_output(['node','--experimental-transform-types','--input-type=module','-e',js],cwd=repo,env=env,text=True))
shoulder_probes=0
for pose in poses['speaking']:
 dy=pose['body-root']['transform']['y']-800
 for x,y in [(865,461),(870,462),(875,464),(880,466),(885,468),(890,471)]:
  source_alpha=images['speaking-source'].getpixel((x,y))[3]
  assert source_alpha>=200,('diagnosed shoulder source point',x,y,source_alpha)
  assert alpha(pose,x,y+dy)>=128,('speaking shoulder cap lost at phase',x,y,dy)
  shoulder_probes+=1
count=0
for state in ['default','listening','speaking','waiting']:
 # Bounded internal bands, excluding animated outer silhouettes.
 bands=[(470,495,600,740),(875,900,600,810)] if state!='waiting' else [(460,865,840,855)]
 ref=images[('default' if state=='speaking' else state)+'-source']
 for i,pose in enumerate(poses[state]):
  bad=[]
  for x0,x1,y0,y1 in bands:
   for y in range(y0,y1,4):
    for x in range(x0,x1,4):
     if ref.getpixel((x,y))[3]>=240:
      count+=1
      if alpha(pose,x,y)<128:bad.append((x,y))
  assert not bad,(state,i/8,'internal source-alpha seam',len(bad),bad[:12])
print('PASS: static body/hand/sleeve silhouette coverage; no lowered-arm skin residue; 32 full-chain phases per state;',count,'internal opacity probes;',hand_pixels,'speaking-hand skin pixels and 6 original-ink probes retained;',shoulder_probes,'anchored shoulder probes retained. Geometry/nearest-alpha evidence only, not Canvas colour or visual acceptance.')
