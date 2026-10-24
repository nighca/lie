"""Read-only opaque source/actual-parent-chain coverage probes, no raster output."""
import json, math, collections
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
data=json.loads((root/'package.json').read_text());phases=json.loads((root/'evidence/poses.json').read_text())
images={id:Image.open(root/a['src']).convert('RGBA') for id,a in data['assets'].items()}
def inside(x,y,poly):
 c=False
 for i,(bx,by) in enumerate(poly):
  ax,ay=poly[i-1]
  if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:c=not c
 return c
def mappt(m,x,y):return m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]
def inverse(m,x,y):
 a,b,c,d,e,f=m;det=a*d-b*c;x-=e;y-=f
 return (d*x-c*y)/det,(-b*x+a*y)/det
def visible(n,p):return p[n['id']]['visible'] and (n['parent'] is None or visible(next(v for v in data['nodes'] if v['id']==n['parent']),p))
def alpha(n,x,y,phase):
 sp=n['sprite'];x,y=inverse(phase['world'][n['id']],x,y)
 if 'mask'in sp and not inside(x,y,sp['mask']):return 0
 if 'crop'in sp:x+=sp['crop'][0];y+=sp['crop'][1]
 im=images[sp['asset']];x=int(x);y=int(y)
 return im.getpixel((x,y))[3] if 0<=x<im.width and 0<=y<im.height else 0
report=[]
# Baseline full source coverage: no canonical opaque pixel may silently vanish in these states.
for state in ['default','listening','waiting']:
 phase=phases[state][0];im=images[state+'-source'];draws=[n for n in data['nodes'] if 'sprite'in n and visible(n,phase['pose'])]
 missing=[];probes=0
 for y in range(2,1252,3):
  for x in range(2,1252,3):
   if im.getpixel((x,y))[3]<245:continue
   probes+=1
   if max(alpha(n,x,y,phase) for n in draws)<200:missing.append((x,y))
 assert not missing,(state,missing)
 report.append(f'{state}: {probes} baseline opaque probes; missing={len(missing)}; regions={collections.Counter((x//50*50,y//50*50) for x,y in missing).most_common(12)}')
# Full-chain interior probes at all 33 phases. Around neck, shoulders, wrists, armpits and waist.
points={'default':[(600,425),(680,420),(440,540),(865,540),(445,755),(820,840),(450,930),(930,940),(640,950)],'listening':[(600,425),(680,420),(460,440),(400,520),(865,540),(820,840),(930,940),(640,950)],'waiting':[(600,425),(680,420),(560,520),(525,650),(500,800),(710,800),(640,950),(500,950),(800,950)],'speaking':[(600,425),(680,420),(440,540),(870,540),(445,755),(840,760),(865,700),(885,730),(880,815),(450,930),(640,950)]}
fail=[];count=0
for state,coords in points.items():
 for phase in phases[state]:
  draws=[n for n in data['nodes'] if 'sprite'in n and visible(n,phase['pose'])]
  for x,y in coords:
   im=images[state+'-source'];assert im.getpixel((x,y))[3]>=245,(state,x,y,'empty source probe')
   parent='contact-root' if state=='waiting' and y<950 else 'body-root'
   wx,wy=mappt(phase['world'][parent],x,y);count+=1
   if max(alpha(n,wx,wy,phase) for n in draws)<200:fail.append((state,phase['seconds'],x,y))
report.append(f'{count} nonempty opacity probes with full parent chain; failures={fail}')
# Diagnose actual original ink ownership, not only opaque union coverage.
ink_probes=0
for state,arm_id,body_id in [('default','right-arm','body'),('listening','listening-right','listening-body')]:
 im=images[state+'-source'];arm=next(n['sprite']['mask'] for n in data['nodes'] if n['id']==arm_id);body=next(n['sprite']['mask'] for n in data['nodes'] if n['id']==body_id)
 for y in range(780,841):
  gap=next((x for x in range(800,880) if all(im.getpixel((x+i,y))[3]<200 for i in range(5))),None)
  assert gap is not None,(state,y,'no real armpit gap')
  arm_start=next(x for x in range(gap+5,930) if im.getpixel((x,y))[3]>240)
  for x in range(gap-8,gap):
   r,g,b,a=im.getpixel((x,y))
   if a>=245 and r<80 and g<80 and b<120:
    ink_probes+=1;assert not inside(x,y,arm),(state,x,y,'torso ink duplicated in moving arm')
  for x in range(arm_start,arm_start+6):
   r,g,b,a=im.getpixel((x,y))
   if a>=245 and r<80 and g<80 and b<120:
    ink_probes+=1;assert not inside(x,y,body),(state,x,y,'sleeve ink duplicated in torso')
assert ink_probes>100
report.append(f'{ink_probes} classified canonical armpit ink probes excluded from opposite moving part')
lower_probes=0
for state,arm_id,body_id in [('default','right-arm','body'),('listening','listening-right','listening-body')]:
 im=images[state+'-source'];arm=next(n['sprite']['mask'] for n in data['nodes'] if n['id']==arm_id);body=next(n['sprite']['mask'] for n in data['nodes'] if n['id']==body_id)
 for y in range(1040,1254,2):
  pant_end=next(x for x in range(800,930) if all(im.getpixel((x+i,y))[3]<200 for i in range(4)))
  for x in range(pant_end-10,pant_end):
   r,g,b,a=im.getpixel((x,y))
   if a>=245:
    lower_probes+=1;assert not inside(x,y,arm),(state,x,y,'pants copied into moving arm')
  for x in range(880,1020,2):
   r,g,b,a=im.getpixel((x,y))
   if a>=245 and r>180 and 80<g<205 and b<190 and r>g*1.2:
    lower_probes+=1;assert not inside(x,y,body),(state,x,y,'hand copied into body')
assert lower_probes>100
report.append(f'{lower_probes} actual pants/hand probes exclude lower silhouette contamination')
print('\n'.join(report))
assert not fail
