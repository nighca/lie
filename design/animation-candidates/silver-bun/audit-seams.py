"""Read-only alpha coverage at internal sleeve seams using real sampled poses and full parent chains."""
import json,math,subprocess
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
p=json.loads((root/'package.json').read_text());images={k:Image.open(root/v['src']) for k,v in p['assets'].items()}
def inside(x,y,poly):
 r=False
 for i,(xi,yi) in enumerate(poly):
  xj,yj=poly[i-1]
  if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:r=not r
 return r
poses=json.loads(subprocess.check_output(['node','--experimental-transform-types','--input-type=module','-e',"""
import fs from 'node:fs';
import {readAnimationPackage} from './packages/appearance-animation/src/package.ts';
import {sampleClip} from './packages/appearance-animation/src/playback.ts';
const data=readAnimationPackage(JSON.parse(fs.readFileSync('design/animation-candidates/silver-bun/package.json')));
console.log(JSON.stringify(Object.fromEntries(['default','listening'].map(state=>[state,Array.from({length:32},(_,i)=>sampleClip(data,data.clips[data.states[state]],i/8))]))));
"""],cwd=root.parents[2]))
def alpha(n,world,nodes):
 chain=[];c=n
 while c is not None:
  if not c['visible']:return 0
  chain.append(c);c=nodes[c['parent']] if c['parent'] else None
 x,y=world
 for c in reversed(chain):
  tr=c['transform'];r=tr['rotation']*math.pi/180;dx=x-tr['x'];dy=y-tr['y'];x=(dx*math.cos(r)+dy*math.sin(r))/tr['scaleX']+tr['pivotX'];y=(-dx*math.sin(r)+dy*math.cos(r))/tr['scaleY']+tr['pivotY']
 s=n['sprite']
 if 'mask' in s and not inside(x,y,s['mask']):return 0
 im=images[s['asset']]
 if 'crop' in s:x+=s['crop'][0];y+=s['crop'][1]
 return im.getpixel((int(x),int(y)))[3] if 0<=x<im.width and 0<=y<im.height else 0
for state in ['default','listening']:
 for phase,pose in enumerate(poses[state]):
  nodes={n['id']:{**n,**pose[n['id']]} for n in p['nodes']}
  torso=nodes['listening-torso' if state=='listening' else 'torso']
  def world(x,y):
   c=torso
   while c:
    tr=c['transform'];r=tr['rotation']*math.pi/180;dx=(x-tr['pivotX'])*tr['scaleX'];dy=(y-tr['pivotY'])*tr['scaleY'];x=tr['x']+dx*math.cos(r)-dy*math.sin(r);y=tr['y']+dx*math.sin(r)+dy*math.cos(r);c=nodes[c['parent']] if c['parent'] else None
   return x,y
  regions=[('right sleeve/torso',870,911,640,841)]
  if state=='default':regions.append(('left inner cuff',395,426,830,881))
  for label,x0,x1,y0,y1 in regions:
   checked=0
   for y in range(y0,y1):
    for x in range(x0,x1):
     # Opaque source interiors only: outer silhouette movement is not a hole.
     if images[torso['sprite']['asset']].getpixel((x,y))[3]<240:continue
     checked+=1
     w=world(x+.5,y+.5)
     a=0
     for n in nodes.values():
      if n['visible'] and 'sprite' in n:
       a=max(a,alpha(n,w,nodes))
       if a>=128:break
     assert a>=128,f'{state} {phase/8}s {label}: transparent interior at source {x},{y}'
   assert checked>0
 print(f'PASS: {state} internal sleeve seams covered at all 32 real sampler phases (125ms), full parent transforms and source alpha')
print('Read-only nearest-source-alpha coverage, not antialiased Canvas image comparison; outer silhouette, colour/duplicate lines and artistic acceptance require browser review.')
