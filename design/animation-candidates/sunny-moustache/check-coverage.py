"""Read-only source alpha/black-outline selection check at the neutral pose, not visual QA."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
data=json.loads((root/'package.json').read_text())
def inside(x,y,p):
 result=False;j=len(p)-1
 for i in range(len(p)):
  a,b=p[i],p[j]
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
  j=i
 return result
regions={'right-shoulder-cuff':(800,380,1080,740),'left-shoulder-cuff':(240,420,470,750)}
for state in data['states']:
 clip=data['clips'][data['states'][state]]
 active=[n for n in data['nodes'] if 'sprite' in n and clip['visibility'].get(n['id'],n['visible'])]
 original=Image.open(root/'parts'/f'{state}-source.png').convert('RGBA')
 # For default/speaking the left shared relaxed limb comes from default, at identical registration.
 assets={id:Image.open(root/v['src']).convert('RGBA') for id,v in data['assets'].items()}
 for name,(x0,y0,x1,y1) in regions.items():
  opaque=0;holes=[];black=0;missed_black=[]
  for y in range(y0,y1,2):
   for x in range(x0,x1,2):
    r,g,b,a=original.getpixel((x,y))
    if a<=200:continue
    opaque+=1
    selected=[n['sprite'] for n in active if inside(x+.5,y+.5,n['sprite']['mask'])]
    if not any(assets[s['asset']].getpixel((x,y))[3]>200 for s in selected):holes.append((x,y))
    if r<90 and g<90 and b<140:
     black+=1
     if not any(s['asset']==state+'-source' or state=='speaking' and name.startswith('left') and s['asset']=='default-source' for s in selected):missed_black.append((x,y))
  if (state,name) not in [('listening','right-shoulder-cuff'),('speaking','left-shoulder-cuff')]:
   assert not holes and not missed_black,(state,name,holes[:4],missed_black[:4])
  print(state,name,'opaque',opaque,'uncovered-alpha',len(holes),'source-black',black,'outside-canonical-selection',len(missed_black),'first-gaps',holes[:4])
