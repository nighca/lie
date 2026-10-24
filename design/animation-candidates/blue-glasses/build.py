"""Build animation data only. PNGs are copied native outputs, never edited here."""
import json
from pathlib import Path

root = Path(__file__).parent
T = dict(x=0,y=0,pivotX=0,pivotY=0,rotation=0,scaleX=1,scaleY=1)
nodes=[]
def group(id,parent='body-root',pivot=None):
 t=T.copy()
 if pivot:t.update(x=pivot[0],y=pivot[1],pivotX=pivot[0],pivotY=pivot[1])
 nodes.append(dict(id=id,parent=parent,transform=t,visible=True))
def sprite(id,asset,order,mask,parent='body-root',visible=True):
 nodes.append(dict(id=id,parent=parent,transform=T.copy(),visible=visible,sprite=dict(asset=asset,order=order,mask=mask)))
group('body-root',None,(615,900))
group('contact-root',pivot=(615,390))
group('head-root','contact-root',(615,390))
group('left-root',pivot=(400,720))
group('right-root',pivot=(900,700))
group('speaking-root',pivot=(900,720))
full=[[0,0],[1254,0],[1254,1254],[0,1254]]
# Generated torso has complete sleeves; variants mask only sleeves replaced by pose-specific source.
sprite('body-normal','shared-torso',3,full)
sprite('body-listening','shared-torso',3,[[520,340],[1050,340],[1050,1254],[400,1254],[400,870],[438,800],[438,620],[475,470],[520,440]],visible=False)
sprite('body-waiting','waiting-torso',3,full,visible=False)
head=[[350,0],[800,0],[800,340],[690,340],[680,390],[600,395],[526,355],[350,350]]
sprite('head-closed','default-source',8,head,'head-root')
sprite('head-open','speaking-source',8,head,'head-root',False)
sprite('arm-left','default-source',1,[[340,720],[465,720],[455,870],[395,1020],[390,1254],[220,1254],[240,1040],[300,870]],'left-root')
sprite('arm-right','default-source',1,[[840,680],[970,680],[1030,900],[1040,1254],[870,1254],[910,1040],[870,880]],'right-root')
# Complete raised arm + own sleeve; hand follows head/contact rig.
sprite('arm-listening','listening-source',9,[[330,210],[510,210],[515,380],[465,450],[475,520],[450,650],[455,750],[220,750],[220,550],[290,450],[330,390]],'contact-root',False)
# Crossed support arm + chin hand + both sleeves; common parent preserves chin contact.
sprite('arm-waiting-back','waiting-arms',1,full,'contact-root',False)
nodes[-1]['transform'].update(x=170,y=198,scaleX=.7,scaleY=.65)
front=[[(x-170)/.7,(y-198)/.65] for x,y in [[560,335],[675,335],[675,735],[1050,735],[1050,1100],[250,1100],[250,735],[420,735],[505,535],[540,480]]]
sprite('arm-waiting','waiting-arms',9,front,'contact-root',False)
nodes[-1]['transform'].update(x=170,y=198,scaleX=.7,scaleY=.65)
sprite('arm-speaking','speaking-source',9,[[845,635],[880,635],[895,670],[880,700],[963,691],[991,790],[989,845],[968,877],[945,892],[905,880],[875,867],[860,853],[850,840],[840,825],[830,812],[820,797],[810,788],[740,783],[715,768],[695,748],[675,733],[668,710],[686,698],[704,697],[724,687],[750,698],[780,706],[808,706],[830,682]],'speaking-root',False)
optional=['body-normal','body-listening','body-waiting','arm-left','arm-right','arm-listening','arm-waiting','arm-waiting-back','arm-speaking','head-closed','head-open']
def track(node,prop,values,d=4):
 return dict(node=node,property=prop,interpolation='linear',keys=[dict(time=d*i/(len(values)-1),value=v) for i,v in enumerate(values)])
def clip(state,d=4):
 visible=['head-closed']
 if state=='listening':visible+=['body-listening','arm-listening','arm-right']
 elif state=='waiting':visible+=['body-waiting','arm-waiting','arm-waiting-back']
 elif state=='speaking':visible+=['body-normal','arm-left','arm-speaking']
 else:visible+=['body-normal','arm-left','arm-right']
 tracks=[track('body-root','y',[900,898,900,902,900],d),track('body-root','rotation',[0,.18,0,-.18,0],d)]
 if state in ['waiting','listening']:
  tracks += [track('contact-root','rotation',[0,.32,0,-.32,0],d),track('contact-root','y',[390,389.5,390,390.5,390],d)]
 else:tracks += [track('head-root','rotation',[0,.65,0,-.5,0],d),track('head-root','y',[390,389,390,391,390],d)]
 if state!='waiting':tracks+=[track('right-root','rotation',[0,-.35,0,.35,0],d),track('left-root','rotation',[0,.35,0,-.35,0],d)]
 if state=='speaking':
  tracks += [track('speaking-root','rotation',[0,-1.4,0,1.0,0],d)]
  for node,vals in [('head-open',[False,True,False,True,False,True,False]),('head-closed',[True,False,True,False,True,False,True])]:
   tracks.append(dict(node=node,property='visible',interpolation='step',keys=[dict(time=t,value=v) for t,v in [(round(t+j,3),v) for j in range(3) for t,v in zip([0,.13,.34,.49,.73,.87],vals[:6])] + [(3.0,vals[0]),(3.13,vals[1]),(3.34,vals[2]),(3.49,vals[3]),(3.6,vals[0])]]))
 return dict(duration=d,loop=True,visibility={x:x in visible for x in optional},tracks=tracks)
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets={x:dict(src=f'parts/{x}.png',width=1254,height=1254) for x in ['waiting-torso','waiting-arms','shared-torso','default-source','listening-source','speaking-source']},nodes=nodes,clips={s:clip(s,3.6 if s=='speaking' else 4.8) for s in ['idle','listening','waiting','speaking']},states=dict(default='idle',listening='listening',waiting='waiting',speaking='speaking'),transitions=[])
(root/'package.json').write_text(json.dumps(data,indent=2)+'\n')
