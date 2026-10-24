"""Neutral-pose 2px source-selection diagnostics; not world-space/rendered visual QA."""
import json
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
data=json.loads((root/'package.json').read_text())
images={id:Image.open(root/a['src']).convert('RGBA') for id,a in data['assets'].items()}
def inside(x,y,p):
 result=False;j=len(p)-1
 for i in range(len(p)):
  a,b=p[i],p[j]
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
  j=i
 return result
for state,clipid in data['states'].items():
 clip=data['clips'][clipid]
 active=[n['sprite'] for n in data['nodes'] if 'sprite' in n and clip['visibility'].get(n['id'],n['visible'])]
 for side,box in [('right',(750,350,1080,920)),('left',(250,380,520,900))]:
  reference='default-source' if state=='speaking' and side=='left' else state+'-source'
  opaque=black=holes=missed=0;first=[]
  for y in range(box[1],box[3],2):
   for x in range(box[0],box[2],2):
    r,g,b,a=images[reference].getpixel((x,y))
    if a<=200:continue
    opaque+=1
    selected=[s for s in active if inside(x+.5,y+.5,s['mask'])]
    if not any(images[s['asset']].getpixel((x,y))[3]>200 for s in selected):
     holes+=1
     if len(first)<4:first.append((x,y))
    if r<90 and g<90 and b<140:
     black+=1
     if not any(s['asset']==reference for s in selected):missed+=1
  if not (state=='speaking' and side=='right'):assert holes==0 and missed==0,(state,side,holes,missed,first)
  print(state,side,'reference',reference,'opaque',opaque,'uncovered-alpha',holes,'source-black',black,'outside-source-selection',missed,'first-gaps',first)
