"""Emit animation JSON and read-only source metadata. Never edits pixels."""
import json, math, hashlib, struct
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
identity=dict(x=0,y=0,pivotX=0,pivotY=0,rotation=0,scaleX=1,scaleY=1)
nodes=[]
def group(id,parent,x,y):nodes.append(dict(id=id,parent=parent,transform={**identity,'x':x,'y':y,'pivotX':x,'pivotY':y},visible=True))
def sprite(id,asset,order,mask,parent='body-root',transform=None,crop=None):
 s=dict(asset=asset,order=order)
 if mask:s['mask']=mask
 if crop:s['crop']=crop
 nodes.append(dict(id=id,parent=parent,transform=transform or identity.copy(),visible=True,sprite=s))
group('body-root',None,640,960)
group('contact-root','body-root',630,430)
group('head-root','contact-root',630,430)
group('left-root','body-root',420,520)
group('right-root','body-root',870,520)
group('speaking-root','body-root',870,650)
body=[[558,390],[575,405],[590,425],[650,435],[675,355],[690,375],[790,370],[865,425],[905,475],[867,550],[830,680],[832,740],[841,770],[843,780],[839,800],[834,820],[842,840],[848,860],[853,880],[856,900],[862,920],[868,940],[866,960],[870,1020],[850,1040],[855,1080],[868,1120],[878,1160],[887,1200],[898,1254],[420,1254],[420,1040],[415,960],[424,880],[450,840],[470,780],[460,740],[436,700],[435,620],[410,510],[450,430],[535,390],[575,388]]
left=[[390,480],[445,515],[470,620],[485,720],[490,780],[470,840],[450,880],[425,900],[421,950],[393,1000],[390,1254],[240,1254],[240,1000],[285,880],[280,730],[310,600]]
right=[[835,440],[920,460],[1015,650],[1050,1254],[908,1254],[892,1220],[882,1180],[888,1140],[890,1080],[895,1030],[885,960],[875,940],[865,920],[857,900],[853,880],[848,860],[842,840],[833,820],[840,800],[842,780],[843,770],[810,740],[810,650]]
listen=[[375,210],[480,210],[535,370],[500,420],[470,490],[465,550],[480,630],[460,700],[420,735],[280,750],[235,700],[230,580],[285,485],[330,470],[368,415]]
speak=[[840,475],[950,475],[1030,660],[1030,880],[980,930],[880,930],[815,865],[800,805],[765,775],[725,770],[690,750],[665,725],[655,690],[664,670],[681,676],[704,694],[732,705],[765,704],[790,686],[812,658],[840,645],[854,650],[856,662],[840,690],[831,717],[839,747],[878,779],[900,790],[905,725],[870,650]]
sprite('body','default-source',10,body)
listening_body=[[x-25 if x<560 and y>=740 else x-18 if x<560 and y>=380 else x+4 if x>=790 and y>=1040 else x+9 if x>=790 and y>=680 else x+22 if x>=790 and y>=375 else x,y] for x,y in body]
sprite('listening-body','listening-source',10,listening_body)
sprite('left-arm','default-source',12,left,'left-root')
sprite('right-arm','default-source',12,right,'right-root')
listening_right=[[x+9 if i>=4 and y>=770 and x<920 else x,y] for i,(x,y) in enumerate(right)]
sprite('listening-right','listening-source',12,listening_right,'right-root')
sprite('listening-arm','listening-source',32,listen,'contact-root')
def lower_mask(poly,boundary):
 result=[]
 for i,current in enumerate(poly):
  previous=poly[i-1];ci=current[1]>=boundary;pi=previous[1]>=boundary
  if ci!=pi:result.append([previous[0]+(current[0]-previous[0])*(boundary-previous[1])/(current[1]-previous[1]),boundary])
  if ci:result.append(current)
 return result
sprite('speaking-arm','speaking-source',32,lower_mask(speak,650),'speaking-root')
sprite('speaking-fill','speaking-source',31,[[825,650],[1040,650],[1040,925],[890,925],[865,875],[815,815],[810,775],[825,745]],'speaking-root')
sprite('speaking-cap','speaking-source',33,[[825,420],[980,420],[1030,670],[825,670]])
# Waiting is one original upper contact group plus a fixed lower body; 16px overlap.
sprite('waiting-lower','waiting-source',9,[[200,942],[1100,942],[1100,1254],[200,1254]])
sprite('waiting-contact','waiting-source',20,[[200,380],[555,380],[555,335],[700,335],[700,375],[1100,375],[1100,958],[200,958]],'contact-root')
# Original heads preserve gaze, identity and exact waiting chin contact.
headmask=[[380,0],[800,0],[800,340],[695,350],[690,360],[694,375],[693,390],[700,402],[715,415],[720,420],[710,425],[660,440],[590,445],[575,410],[550,400],[380,400]]
for state in ['default','listening','waiting','speaking']:
 mask=[[x+10 if state=='listening' and 340<=y<=375 and x>650 else x,y] for x,y in headmask]
 sprite('head-'+state,state+'-source',30,mask,'head-root')
attachments=[n['id'] for n in nodes if 'sprite'in n]
def wave(node,prop,base,amp,d=4):return dict(node=node,property=prop,interpolation='linear',keys=[dict(time=d*i/4,value=v) for i,v in enumerate([base,base+amp,base,base-amp,base])])
clips={}
for state in ['default','listening','waiting','speaking']:
 visible=['head-'+state]
 if state=='default':visible+=['body','left-arm','right-arm']
 elif state=='listening':visible+=['listening-body','listening-arm','listening-right']
 elif state=='speaking':visible+=['body','left-arm','speaking-fill','speaking-arm','speaking-cap']
 else:visible=['head-waiting','waiting-contact','waiting-lower']
 tracks=[wave('body-root','y',960,3.5),wave('head-root','rotation',0,1.05),wave('head-root','y',430,1.2),wave('left-root','rotation',0,1),wave('right-root','rotation',0,-1)]
 if state=='listening':tracks=[wave('body-root','y',960,3.5),wave('contact-root','rotation',0,.8),wave('contact-root','y',430,1.2),wave('right-root','rotation',0,-1)]
 if state=='waiting':tracks=[wave('contact-root','y',950,0),wave('contact-root','pivotY',950,0),dict(node='contact-root',property='scaleY',interpolation='linear',keys=[dict(time=i/4,value=round(1+.006*math.sin(i*math.pi/8),8)) for i in range(17)])]
 if state=='speaking':
  tracks.append(wave('speaking-root','rotation',0,-1.6))
  times=[0,.15,.33,.52,.71,.9,1.1,1.3,1.51,1.72,1.94,2.14,2.36,2.57,2.77,2.98,3.2,3.4,3.61,3.81,4]
  for id,opened in [('head-speaking',True),('head-default',False)]:tracks.append(dict(node=id,property='visible',interpolation='step',keys=[dict(time=t,value=(i%2==1)==opened) for i,t in enumerate(times)]))
 clips[state]=dict(duration=4,loop=True,visibility={id:id in visible for id in attachments},tracks=tracks)
assets={};parts={}
for p in sorted((root/'parts').glob('*-source.png')):
 b=p.read_bytes();w,h=struct.unpack('>II',b[16:24]);im=Image.open(p)
 assets[p.stem]=dict(src='parts/'+p.name,width=w,height=h)
 parts[p.stem]=dict(sha256=hashlib.sha256(b).hexdigest(),width=w,height=h,mode=im.mode,alphaExtrema=list(im.getchannel('A').getextrema()))
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets=assets,nodes=nodes,clips=clips,states={s:s for s in clips},transitions=[])
(root/'package.json').write_text(json.dumps(data,indent=2)+'\n')
(root/'provenance.json').write_text(json.dumps(dict(parts=parts,generationCalls=1,repairCalls=0,generationRecords='generation-records.json',sources={s:hashlib.sha256((root/'../../character-presets/assets/ochre-freckles'/f'{s}.png').read_bytes()).hexdigest() for s in clips}),indent=2)+'\n')
