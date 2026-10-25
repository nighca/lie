"""Read-only full-chain source-alpha and hair-bound audit. Never changes pixels."""
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
  if sp.get('crop'):
   if not (0<=u<sp['crop'][2] and 0<=v<sp['crop'][3]):continue
   u+=sp['crop'][0];v+=sp['crop'][1]
  im=images[sp['asset']];u=round(u);v=round(v)
  if 0<=u<im.width and 0<=v<im.height:result=max(result,im.getpixel((u,v))[3])
 return result
js="""import fs from 'node:fs';import{readAnimationPackage}from './packages/character-animation/src/package.ts';import{sampleClip}from './packages/character-animation/src/playback.ts';const p=readAnimationPackage(JSON.parse(fs.readFileSync('design/animation-candidates/mint-puffs/package.json')));console.log(JSON.stringify(Object.fromEntries(Object.keys(p.states).map(s=>[s,Array.from({length:32},(_,i)=>sampleClip(p,p.clips[p.states[s]],i/8))]))));"""
env={**os.environ,'PATH':'/private/tmp/lie-toolchain-node/node-v24.22.1-darwin-arm64/bin:'+os.environ['PATH']}
poses=json.loads(subprocess.check_output(['node','--experimental-transform-types','--input-type=module','-e',js],cwd=repo,env=env,text=True))
contact=next(n for n in data['nodes'] if n['id']=='chin-contact')
head=next(n for n in data['nodes'] if n['id']=='head')
assert contact['sprite']['asset']=='waiting-source'
assert contact['sprite']['mask']==head['sprite']['mask']
assert contact['transform']==head['transform']
assert contact['parent']==head['parent']=='head-root'
# The diagnosed dark default-jaw pixels must now use the original waiting pixels.
for x,y in [(597,393),(598,393),(600,394),(599,395)]:
 original=images['waiting-source'].getpixel((x,y))
 wrong=images['default-source'].getpixel((x,y))
 assert original[3]>=240 and original[0]>wrong[0]+40,(x,y,'empty or irrelevant jaw probe')
 assert inside(x,y,contact['sprite']['mask'])
 for pose in poses['waiting']:
  assert pose['chin-contact']['visible'] and not pose['head']['visible']
counts={}
bands={'neck':(620,705,423,468),'shoulders':(470,830,480,505),'listening-wrist':(380,425,505,540),'waiting-chin':(610,650,390,430),'waist':(470,860,850,866)}
for state in poses:
 ref=images[state+'-source']
 for name,(x0,x1,y0,y1) in bands.items():
  if name=='listening-wrist' and state!='listening':continue
  if name=='waiting-chin' and state!='waiting':continue
  count=0
  for phase,pose in enumerate(poses[state]):
   for y in range(y0,y1,4):
    for x in range(x0,x1,4):
     if ref.getpixel((x,y))[3]>=240:
      count+=1
      assert alpha(pose,x,y+12)>=128,(state,name,phase/8,x,y,'missing opaque material')
  assert count>100,(state,name,'empty source probes',count)
  counts[state+'/'+name]=count
# Actual nontransparent source hair bounds through the complete head->head-root->body-root chain.
limits={}
for state,frames in poses.items():
 head=next(n for n in data['nodes'] if n['id']==('chin-contact' if state=='waiting' else 'head'))
 im=images[head['sprite']['asset']];mask=head['sprite']['mask']
 hair=[]
 for y in range(0,600):
  for x in range(im.width):
   if im.getpixel((x,y))[3]>0 and inside(x,y,mask):hair.append((x,y))
 assert len(hair)>1000
 minimum=1254
 for pose in frames:
  matrices={}
  for n in data['nodes']:
   m=local(pose[n['id']]['transform']);parent=n['parent']
   matrices[n['id']]=m if parent is None else multiply(matrices[parent],m)
  m=matrices[head['id']]
  minimum=min(minimum,min(m[1]*x+m[3]*y+m[5] for x,y in hair))
 assert minimum>=3,(state,'hair crop risk',minimum)
 limits[state]=round(minimum,3)
print('PASS 32 real-sampler phases, nonempty full-chain source-alpha seams:',counts,'; actual every-nonzero-alpha hair minY:',limits,'; four diagnosed jaw points use original waiting material, not default jaw')

# Probe both sides of the actual new sleeve/body cuts, excluding the original outer alpha edge.
cut_counts={}
for state,band in [('waiting',(400,660,700,815)),('listening',(480,570,425,765))]:
 ref=images[state+'-source'];points=[]
 for y in range(band[2],band[3],2):
  for x in range(band[0],band[1],2):
   if all(ref.getpixel((x+dx,y+dy))[3]>=240 for dx,dy in [(dx,dy) for dx in range(-8,9,2) for dy in range(-8,9,2)]):points.append((x,y))
 assert len(points)>300
 for frame,pose in enumerate(poses[state]):
  for x,y in points:assert alpha(pose,x,y+12)>=128,(state,frame/8,x,y,'new split boundary lost original interior material')
 cut_counts[state]=len(points)*len(poses[state])
rigid_count=0
for state,frames in poses.items():
 for pose in frames:
  matrices={}
  for n in data['nodes']:
   m=local(pose[n['id']]['transform']);matrices[n['id']]=m if n['parent'] is None else multiply(matrices[n['parent']],m)
  for id in ['head','chin-contact','listen-contact','waiting-arm-contact']:
   if not pose[id]['visible']:continue
   a,b,c,d,_,_=matrices[id]
   assert abs(math.hypot(a,b)-1)<1e-12 and abs(math.hypot(c,d)-1)<1e-12
   assert abs(a*c+b*d)<1e-12
   rigid_count+=1
  if state in ['listening','waiting']:
   assert matrices[state+'-lower']==[1,0,0,1,0,862]
   assert abs(matrices[state+'-body'][1])<1e-12 and abs(matrices[state+'-body'][2])<1e-12
   assert matrices[state+'-body']!=matrices['head']
print('PASS new split interior boundary alpha probes:',cut_counts,'; constant unit orthogonal world columns:',rigid_count,'; independent unrotated chest and fixed lower')

# Original transparent armpit gap assigns torso ink to chest, never to the rotating sleeve.
ref=images['listening-source'];arm=next(n['sprite']['mask'] for n in data['nodes'] if n['id']=='listen-contact');body=next(n['sprite']['mask'] for n in data['nodes'] if n['id']=='listening-body');ink_count=0
for y in range(660,726):
 gap=next(x for x in range(440,530) if all(ref.getpixel((x+i,y))[3]<200 for i in range(2)))
 torso_start=next(x for x in range(gap+2,560) if ref.getpixel((x,y))[3]>=240)
 for x in range(torso_start,torso_start+7):
  r,g,b,a=ref.getpixel((x,y))
  if a>=240 and max(r,g,b)<100:
   ink_count+=1;assert not inside(x,y,arm),(x,y,'original torso ink duplicated in rotating listening sleeve')
assert ink_count>100
print('PASS',ink_count,'source-classified armpit torso ink samples excluded from moving sleeve')
