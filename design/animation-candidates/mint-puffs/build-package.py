import json, hashlib, struct, math
from pathlib import Path
from PIL import Image
d=Path(__file__).parent

def transform(x=0,y=0,px=0,py=0,r=0,s=1):
 return dict(x=x,y=y,pivotX=px,pivotY=py,rotation=r,scaleX=s,scaleY=s)
def node(id,parent,t,sprite=None):
 n=dict(id=id,parent=parent,transform=t,visible=True)
 if sprite:n['sprite']=sprite
 return n
def sprite(asset,order,mask=None,crop=None):
 n=dict(asset=asset,order=order)
 if mask:n['mask']=mask
 if crop:n['crop']=crop
 return n
def rect(x0,y0,x1,y1):return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]
def wave(id,prop,base,amp):return dict(node=id,property=prop,interpolation='linear',keys=[dict(time=i/4,value=round(base+amp*math.sin(i*math.pi/8),6)) for i in range(17)])
# Source masks preserve neck material and broad shoulder caps behind moving arms.
body=rect(0,415,1254,1254)
# The listening hand/forearm starts above the body cut and remains a single contact group.
listen=[[390,240],[530,240],[545,435],[580,435],[580,540],[330,650],[270,630],[340,475],[390,415]]
# Waiting keeps its original head/chin/hand as one same-source contact assembly.
nodes=[node('body-root',None,transform(650,860,650,850)),node('head-root','body-root',transform(650,445,650,445)),node('head','head-root',transform(),sprite('default-source',30,[[0,0],[1254,0],[1254,431],[747,431],[750,493],[575,493],[580,431],[0,431]])),node('mouth-closed','head-root',transform(603,320),sprite('default-source',35,[[0,21],[85,0],[94,5],[85,31],[50,44],[10,38]],[603,320,96,48])),node('mouth-open','head-root',transform(603,320),sprite('speaking-source',36,[[0,25],[88,0],[95,4],[89,44],[63,69],[30,66],[10,45]],[603,320,98,72]))]
for state in ['default','listening','waiting','speaking']:
 parent='head-root' if state in ['listening','waiting'] else 'body-root'
 nodes.append(node(state+'-body',parent,transform(),sprite(state+'-source',10,body)))
 if state in ['listening','waiting']:
  nodes[-1]['sprite']['mask']=body
  # Split only at the fixed waist; upper and lower overlap by 16 source pixels.
  nodes[-1]['sprite']['crop']=[0,0,1254,866]
  nodes.append(node(state+'-lower','body-root',transform(0,850),sprite(state+'-source',9,None,[0,850,1254,404])))
 if state=='listening':nodes.append(node('listen-contact','head-root',transform(),sprite('listening-source',40,listen)))
 if state=='waiting':nodes.append(node('chin-contact','head-root',transform(),sprite('waiting-source',41,[[0,0],[1254,0],[1254,431],[747,431],[750,493],[575,493],[580,431],[0,431]])))
clips={}
for state in ['default','listening','waiting','speaking']:
 visibility={n['id']:False for n in nodes if n.get('sprite') and n['id'] not in ['head','mouth-closed','mouth-open']}
 for id in [state+'-body']:
  visibility[id]=True
 if state in ['listening','waiting']:visibility[state+'-lower']=True
 visibility['listen-contact']=state=='listening';visibility['chin-contact']=state=='waiting'
 visibility.update({'mouth-closed':True,'mouth-open':False})
 if state=='waiting':visibility['head']=False
 tracks=[wave('body-root','y',860,3),wave('head-root','rotation',0,.9),wave('head-root','y',445,1.2)]
 if state in ['listening','waiting']:
  tracks=[wave('body-root','y',860,0),wave('head-root','y',858,0),wave('head-root','pivotY',858,0),wave('head-root','scaleY',1,.006)]
 if state=='speaking':
  times=[0,.18,.36,.56,.72,.95,1.15,1.36,1.58,1.8,2.05,2.28,2.48,2.72,2.95,3.18,3.42,3.65,3.82,4]
  for id,invert in [('mouth-open',False),('mouth-closed',True)]:tracks.append(dict(node=id,property='visible',interpolation='step',keys=[dict(time=time,value=(bool(i%2)^invert)) for i,time in enumerate(times)]))
 clips[state]=dict(duration=4,loop=True,visibility=visibility,tracks=tracks)
assets={};sources=[]
for p in sorted((d/'parts').glob('*-source.png')):
 b=p.read_bytes();w,h=struct.unpack('>II',b[16:24]);assets[p.stem]=dict(src='parts/'+p.name,width=w,height=h)
 im=Image.open(p)
 sources.append(dict(id=p.stem,sha256=hashlib.sha256(b).hexdigest(),width=w,height=h,alphaExtrema=list(im.getchannel('A').getextrema()),origin='../../character-presets/assets/mint-puffs/'+p.stem.replace('-source','')+'.png'))
p=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets=assets,nodes=nodes,clips=clips,states={s:s for s in clips},transitions=[])
(d/'package.json').write_text(json.dumps(p,indent=2)+'\n')
(d/'provenance.json').write_text(json.dumps(dict(sources=sources,generationCalls=1),indent=2)+'\n')
