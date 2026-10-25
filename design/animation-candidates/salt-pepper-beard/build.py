"""Build rig/animation JSON only, without editing any PNG pixels."""
import json
import math
from pathlib import Path
root=Path(__file__).parent
identity=dict(x=0,y=0,pivotX=0,pivotY=0,rotation=0,scaleX=1,scaleY=1)
nodes=[]
def group(id,parent,p):
 nodes.append(dict(id=id,parent=parent,transform={**identity,'x':p[0],'y':p[1],'pivotX':p[0],'pivotY':p[1]},visible=True))
def sprite(id,asset,order,mask,parent,visible=False):
 nodes.append(dict(id=id,parent=parent,transform=identity.copy(),visible=visible,sprite=dict(asset=asset,order=order,mask=mask)))
group('body-root',None,(630,930))
group('waiting-breath-root','body-root',(0,0))
group('contact-root','body-root',(620,395))
group('head-root','contact-root',(620,395))
group('left-root','body-root',(410,870))
group('right-root','body-root',(870,465))
group('speaking-root','body-root',(870,465))
sprite('lower-fill','lower-fill',0,[[0,935],[1254,935],[1254,1254],[0,1254]],'body-root',True)
body=[[530,410],[620,420],[685,365],[710,315],[740,355],[850,395],[930,440],[880,550],[860,700],[860,810],[875,880],[875,980],[400,980],[400,940],[410,880],[445,830],[445,740],[420,620],[390,520],[420,450],[520,410]]
sprite('body-default','default-source',3,body,'body-root',True)
body_listening=[([400,830] if p==[445,830] else [400,740] if p==[445,740] else p) for p in body]
sprite('body-listening','listening-source',3,body_listening,'body-root')
head=[[350,0],[800,0],[800,290],[725,290],[720,330],[700,370],[665,410],[620,430],[570,425],[545,405],[500,385],[350,365]]
for s in ['default','listening','waiting','speaking']:sprite('head-'+s,s+'-source',8,head,'head-root',s=='default')
sprite('arm-left','default-source',1,[[230,390],[590,350],[580,470],[500,600],[490,760],[490,820],[450,880],[430,910],[400,1000],[420,1254],[200,1254],[200,900],[220,650]],'left-root',True)
sprite('arm-right','default-source',1,[[700,310],[1100,360],[1150,650],[1150,1254],[850,1254],[900,1030],[900,950],[890,900],[880,860],[865,820],[860,780],[850,740],[760,550]],'right-root',True)
sprite('arm-listening','listening-source',1,[[280,180],[530,180],[550,365],[590,370],[570,460],[520,600],[470,650],[425,700],[340,725],[220,725],[160,650],[150,500],[280,400]],'contact-root')
sprite('arm-right-listening','listening-source',1,[[700,310],[1100,360],[1150,650],[1150,1254],[850,1254],[900,1030],[900,950],[890,900],[880,860],[865,820],[860,780],[850,740],[760,550]],'right-root')
sprite('body-waiting-lower','waiting-source',3,[[200,895],[1100,895],[1100,1254],[200,1254]],'body-root')
sprite('contact-waiting','waiting-source',4,[[250,420],[500,380],[497,400],[482,450],[472,500],[447,560],[427,620],[437,641],[452,655],[475,666],[500,670],[523,668],[531,648],[538,560],[558,520],[583,490],[598,450],[613,400],[608,380],[650,430],[700,380],[735,330],[1030,370],[1050,925],[250,925]],'waiting-breath-root')
sprite('waiting-hand','waiting-source',9,[[500,350],[600,345],[630,385],[625,430],[606,470],[580,510],[558,560],[538,600],[535,645],[530,690],[410,690],[420,620],[443,560],[468,500],[478,450],[493,400]],'contact-root')
sprite('neck-waiting','waiting-source',4,[[450,310],[724,310],[726,330],[731,350],[737,355],[735,365],[739,370],[745,380],[737,390],[728,400],[716,410],[702,420],[686,430],[666,440],[638,450],[611,460],[604,470],[500,500]],'contact-root')
sprite('sleeve-speaking','speaking-source',1,[[700,310],[1100,360],[1150,650],[1100,880],[1030,900],[900,890],[850,845],[850,815],[840,780],[820,740],[810,700],[790,620],[780,500]],'speaking-root')
sprite('hem-speaking','speaking-source',3,[[780,860],[862,860],[862,980],[780,980]],'body-root')
sprite('arm-speaking','speaking-source',4,[[870,720],[920,750],[930,810],[900,850],[870,845],[835,820],[800,790],[770,765],[735,770],[695,765],[660,750],[640,730],[620,700],[615,675],[625,660],[645,655],[665,660],[680,650],[715,670],[745,680],[760,670],[760,635],[770,605],[788,600],[800,615],[805,645],[820,665],[820,700]],'speaking-root')
sprite('waiting-cuff-front','waiting-source',10,[[410,608],[420,610],[430,630],[445,646],[465,658],[490,664],[510,663],[525,659],[531,642],[550,685],[550,740],[390,740],[390,608]],'waiting-breath-root')
attachments=[n['id'] for n in nodes if 'sprite' in n]
def wave(node,prop,values,d):return dict(node=node,property=prop,interpolation='linear',keys=[dict(time=d*i/(len(values)-1),value=v) for i,v in enumerate(values)])
def clip(s,d):
 visible=['head-'+s]
 if s=='waiting':visible+=['body-waiting-lower','contact-waiting','neck-waiting','waiting-hand','waiting-cuff-front']
 elif s=='listening':visible+=['lower-fill','body-listening','arm-listening','arm-right-listening']
 elif s=='speaking':visible+=['lower-fill','body-default','arm-left','hem-speaking','sleeve-speaking','arm-speaking']
 else:visible+=['lower-fill','body-default','arm-left','arm-right']
 tracks=[] if s=='waiting' else [wave('body-root','y',[930,926,930,934,930],d),wave('body-root','rotation',[0,.4,.08,-.4,0],d)]
 if s=='waiting':
  tracks += [wave('contact-root','pivotY',[420,420],d),wave('contact-root','y',[420,419.4,420,420.8,420],d),wave('contact-root','rotation',[0,.8,.15,-1,0],d),wave('waiting-breath-root','y',[0,-1.8,-.2,1.5,0],d)]
 elif s=='listening':tracks += [wave('contact-root','rotation',[0,.95,.15,-.85,0],d),wave('contact-root','y',[395,393.8,395,396.2,395],d)]
 else:tracks += [wave('head-root','rotation',[0,1.6,.25,-1.3,0],d),wave('head-root','y',[395,393.5,395,396.5,395],d)]
 if s!='waiting':tracks += [wave('left-root','rotation',[0,.9,-.2,-1.4,0],d),wave('right-root','rotation',[0,-1.3,.25,1.1,0],d)]
 if s=='speaking':
  tracks+=[wave('speaking-root','rotation',[0,-2.2,.35,1.7,0],d)]
  times=[0,.13,.34,.49,.73,.87,1,1.13,1.34,1.49,1.73,1.87,2,2.13,2.34,2.49,2.73,2.87,3,3.13,3.34,3.49,3.6]
  for id,opened in [('head-speaking',True),('head-default',False)]:tracks.append(dict(node=id,property='visible',interpolation='step',keys=[dict(time=t,value=(i%2==1)==opened) for i,t in enumerate(times)]))
 return dict(duration=d,loop=True,visibility={id:id in visible for id in attachments},tracks=tracks)
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets={id:dict(src=f'parts/{id}.png',width=1254,height=1254) for id in ['default-source','listening-source','waiting-source','speaking-source','lower-fill']},nodes=nodes,clips={s:clip(s,3.6 if s=='speaking' else 4.8) for s in ['default','listening','waiting','speaking']},states={s:s for s in ['default','listening','waiting','speaking']},transitions=[])
(root/'package.json').write_text(json.dumps(data,indent=2)+'\n')
