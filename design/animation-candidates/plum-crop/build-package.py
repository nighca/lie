import json, hashlib, struct, math
from pathlib import Path
from PIL import Image
d=Path(__file__).parent
def t(x=0,y=0,px=0,py=0,r=0,s=1):return dict(x=x,y=y,pivotX=px,pivotY=py,rotation=r,scaleX=s,scaleY=s)
def node(id,parent,transform,sprite=None):
 n=dict(id=id,parent=parent,transform=transform,visible=True)
 if sprite:n['sprite']=sprite
 return n
def sprite(asset,order,mask=None,crop=None):
 a=dict(asset=asset,order=order)
 if mask:a['mask']=mask
 if crop:a['crop']=crop
 return a
torso=[[540,420],[720,405],[850,440],[945,485],[955,560],[890,600],[895,760],[908,840],[908,860],[896,880],[889,900],[890,910],[887,920],[876,932],[869,950],[890,1000],[904,1050],[915,1100],[927,1150],[930,1180],[937,1200],[950,1254],[410,1254],[400,1050],[408,910],[450,830],[465,760],[465,600],[375,560],[380,500]]
left=[[390,495],[455,530],[480,620],[503,785],[455,900],[408,950],[390,1055],[420,1254],[250,1254],[248,1020],[275,900],[268,750],[300,630]]
right=[[870,465],[955,500],[1040,780],[1060,1254],[925,1254],[915,1040],[918,950],[903,930],[897,920],[894,910],[889,900],[889,890],[850,775],[860,600]]
listen=[[447,235],[467,247],[462,273],[451,306],[460,327],[482,342],[501,334],[518,331],[530,341],[510,378],[486,402],[465,422],[451,463],[432,526],[480,545],[500,650],[480,755],[350,785],[240,740],[230,600],[285,520],[340,460],[375,380],[376,312],[392,279],[420,247]]
waitingBody=[[535,410],[725,400],[860,440],[965,540],[1000,745],[985,875],[940,930],[980,1254],[405,1254],[410,1010],[450,885],[345,810],[340,600],[355,500],[435,450]]
waitingArms=[[540,350],[670,350],[680,375],[655,410],[665,470],[605,540],[590,640],[625,740],[760,750],[835,725],[930,730],[995,780],[990,895],[870,920],[720,880],[590,845],[480,870],[375,835],[340,735],[355,630],[440,600],[490,620],[525,510]]
speak=[[870,540],[970,540],[1040,655],[1030,830],[970,910],[880,895],[845,820],[835,765],[830,755],[825,749],[820,748],[810,750],[800,752],[790,754],[780,752],[770,746],[760,741],[750,736],[740,732],[735,714],[730,705],[725,696],[720,682],[715,672],[710,664],[718,658],[725,658],[735,660],[745,666],[750,670],[752,665],[755,662],[765,662],[775,666],[785,672],[795,679],[805,685],[815,687],[820,685],[825,678],[829,673],[829,649],[832,631],[837,623],[845,621],[851,625],[857,645],[867,654],[873,662],[879,680],[875,595]]
nodes=[node('body-root',None,t(650,800,650,800)),node('torso','body-root',t(),sprite('default-source',10,torso)),node('head-root','body-root',t(630,440,630,440)),node('head','head-root',t(257,-25,s=.54),sprite('head',30,[[240,50],[940,50],[940,830],[500,830],[500,790],[250,700]])),node('left-neutral','body-root',t(430,535,430,535),sprite('default-source',20,left)),node('right-neutral','body-root',t(910,530,910,530),sprite('default-source',21,right)),node('listen-arm','head-root',t(),sprite('listening-source',40,listen)),node('waiting-torso','head-root',t(),sprite('waiting-source',11,waitingBody)),node('waiting-arms','head-root',t(),sprite('waiting-source',41,waitingArms)),node('speak-arm','body-root',t(910,530,910,530),sprite('speaking-source',42,speak)),node('mouth-closed','head-root',t(576,294),sprite('default-source',35,[[0,20],[104,0],[110,10],[97,35],[65,42],[20,36]], [576,294,110,52])),node('mouth-open','head-root',t(579,294),sprite('speaking-source',36,[[0,26],[92,0],[98,5],[90,44],[65,62],[35,62],[13,44]], [579,294,100,65]))]
def waist_mask(polygon,boundary,upper):
 result=[]
 for i,current in enumerate(polygon):
  previous=polygon[i-1]
  ci=current[1]<=boundary if upper else current[1]>=boundary
  pi=previous[1]<=boundary if upper else previous[1]>=boundary
  if ci!=pi:result.append([previous[0]+(current[0]-previous[0])*(boundary-previous[1])/(current[1]-previous[1]),boundary])
  if ci:result.append(current)
 return result
nodes.append(node('waiting-lower-body','body-root',t(),sprite('waiting-source',9,waist_mask(waitingBody,842,False))))
next(n for n in nodes if n['id']=='waiting-torso')['sprite']['mask']=waist_mask(waitingBody,858,True)
nodes.append(node('listening-torso','body-root',t(),sprite('listening-source',10,torso)))
nodes.append(node('speaking-shoulder-cap','body-root',t(),sprite('speaking-source',43,[[840,420],[980,420],[980,560],[840,560]])))
def wave(node,prop,base,amp):return dict(node=node,property=prop,interpolation='linear',keys=[dict(time=i,value=v) for i,v in [(0,base),(1,base+amp),(2,base),(3,base-amp),(4,base)]])
clips={}
for state in ['default','listening','waiting','speaking']:
 vis={id:False for id in ['torso','left-neutral','right-neutral','listen-arm','waiting-torso','waiting-arms','speak-arm','mouth-open']}
 vis.update({'speaking-shoulder-cap':state=='speaking','waiting-lower-body':state=='waiting','listening-torso':state=='listening','mouth-closed':True,'torso':state not in ['waiting','listening'],'left-neutral':state in ['default','speaking'],'right-neutral':state in ['default','listening'],'listen-arm':state=='listening','waiting-torso':state=='waiting','waiting-arms':state=='waiting','speak-arm':state=='speaking'})
 tracks=[wave('body-root','y',800,4),wave('head-root','rotation',0,.85 if state in ['listening','waiting'] else 1.2),wave('head-root','y',440,1.5),wave('left-neutral','rotation',0,1.2),wave('right-neutral','rotation',0,-1.2),wave('speak-arm','rotation',0,-1.9)]
 if state=='waiting':
  tracks=[wave('body-root','y',800,0),wave('head-root','rotation',0,0),wave('head-root','pivotY',850,0),wave('head-root','y',850,0),dict(node='head-root',property='scaleY',interpolation='linear',keys=[dict(time=i/4,value=round(1+.006*math.sin(i*math.pi/8),6)) for i in range(17)])]
 if state=='speaking':
  times=[0,.18,.36,.56,.72,.95,1.15,1.36,1.58,1.8,2.05,2.28,2.48,2.72,2.95,3.18,3.42,3.65,3.82,4]
  for id,invert in [('mouth-open',False),('mouth-closed',True)]:
   tracks.append(dict(node=id,property='visible',interpolation='step',keys=[dict(time=time,value=(bool(i%2)^invert)) for i,time in enumerate(times)]))
 clips[state]=dict(duration=4,loop=True,visibility=vis,tracks=tracks)
assets={}
sources=[]
for p in sorted((d/'parts').glob('*.png')):
 b=p.read_bytes();w,h=struct.unpack('>II',b[16:24]);assets[p.stem]=dict(src='parts/'+p.name,width=w,height=h)
 im=Image.open(p)
 sources.append(dict(id=p.stem,mode=im.mode,alphaExtrema=list(im.getchannel('A').getextrema()),sha256=hashlib.sha256(b).hexdigest(),width=w,height=h,origin='/Users/nighca/.codex/generated_images/01a16e95-7926-79e0-a8ae-6f56388db3d8/exec-7ec2e3ee-5d07-4ed0-b3b3-9f81361a655f.png' if p.stem=='head' else str((d/'../../appearances/assets/plum-crop'/f'{p.stem.replace("-source","")}.png').resolve())))
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets=assets,nodes=nodes,clips=clips,states={s:s for s in clips},transitions=[])
(d/'package.json').write_text(json.dumps(data,indent=2)+'\n')
(d/'provenance.json').write_text(json.dumps(dict(sources=sources,generationCalls=1,originalCanonicalStates={s:hashlib.sha256((d/'../../appearances/assets/plum-crop'/f'{s}.png').resolve().read_bytes()).hexdigest() for s in clips}),indent=2)+'\n')
