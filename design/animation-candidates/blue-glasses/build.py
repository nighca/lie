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
group('left-root',pivot=(450,500))
group('right-root',pivot=(820,475))
group('speaking-root',pivot=(820,475))
full=[[0,0],[1254,0],[1254,1254],[0,1254]]
# Exclude generated empty sleeve interiors; canonical complete sleeve/arm pieces cover shoulders.
body_mask=[[530,340],[740,340],[790,430],[820,500],[800,650],[810,850],[1000,1254],[350,1254],[400,900],[450,850],[450,600],[470,470]]
sprite('body-normal','shared-torso',3,body_mask)
sprite('body-listening','shared-torso',3,body_mask,visible=False)
sprite('body-waiting','waiting-torso',3,body_mask,visible=False)
sprite('sleeve-waiting-left','waiting-source',4,[[350,490],[470,450],[490,570],[470,680],[450,735],[320,735],[300,660]],visible=False)
sprite('sleeve-waiting-right','waiting-source',4,[[790,440],[910,460],[990,680],[980,735],[810,735],[790,650]],visible=False)
head=[[350,0],[800,0],[800,340],[690,340],[680,390],[600,395],[526,355],[350,350]]
sprite('head-closed','default-source',8,head,'head-root')
sprite('head-open','speaking-source',8,head,'head-root',False)
sprite('arm-left','default-source',4,[[360,490],[470,450],[475,540],[455,640],[460,780],[455,870],[395,1020],[390,1254],[220,1254],[240,1040],[300,870],[300,780],[280,730],[300,650],[330,550]],'left-root')
sprite('arm-right','default-source',4,[[780,430],[910,450],[1000,660],[1030,900],[1040,1254],[870,1254],[910,1040],[870,880],[830,800],[810,700],[780,600]],'right-root')
# Complete raised arm + own sleeve; hand follows head/contact rig.
sprite('arm-listening','listening-source',9,[[330,210],[510,210],[515,380],[465,450],[475,520],[450,650],[455,750],[220,750],[220,550],[290,450],[330,390]],'contact-root',False)
# Crossed support arm + chin hand share one contact rig; canonical sleeves cover their upper ends.
sprite('arm-waiting-back','waiting-arms',1,full,'contact-root',False)
nodes[-1]['transform'].update(x=170,y=198,scaleX=.7,scaleY=.65)
front=[[(x-170)/.7,(y-198)/.65] for x,y in [[560,335],[675,335],[675,735],[1050,735],[1050,1100],[250,1100],[250,735],[420,735],[505,535],[540,480]]]
sprite('arm-waiting','waiting-arms',9,front,'contact-root',False)
nodes[-1]['transform'].update(x=170,y=198,scaleX=.7,scaleY=.65)
sprite('arm-speaking','speaking-source',4,[[780,430],[910,450],[1010,700],[1015,900],[930,910],[870,860],[820,805],[750,795],[700,775],[670,740],[660,700],[700,690],[750,680],[800,700],[825,640],[820,550]],'speaking-root',False)
optional=['body-normal','body-listening','body-waiting','sleeve-waiting-left','sleeve-waiting-right','arm-left','arm-right','arm-listening','arm-waiting','arm-waiting-back','arm-speaking','head-closed','head-open']
def track(node,prop,values,d=4):
 return dict(node=node,property=prop,interpolation='linear',keys=[dict(time=d*i/(len(values)-1),value=v) for i,v in enumerate(values)])
def clip(state,d=4):
 visible=['head-closed']
 if state=='listening':visible+=['body-listening','arm-listening','arm-right']
 elif state=='waiting':visible+=['body-waiting','sleeve-waiting-left','sleeve-waiting-right','arm-waiting','arm-waiting-back']
 elif state=='speaking':visible+=['body-normal','arm-left','arm-speaking']
 else:visible+=['body-normal','arm-left','arm-right']
 tracks=[track('body-root','y',[900,896,900,904,900],d),track('body-root','rotation',[0,.4,.08,-.4,0],d)]
 if state in ['waiting','listening']:
  tracks += [track('contact-root','rotation',[0,.95,.15,-.85,0],d),track('contact-root','y',[390,388.8,390,391.2,390],d)]
 else:tracks += [track('head-root','rotation',[0,1.6,.25,-1.3,0],d),track('head-root','y',[390,388.5,390,391.5,390],d)]
 if state!='waiting':tracks+=[track('right-root','rotation',[0,-1.3,.25,1.1,0],d),track('left-root','rotation',[0,.9,-.2,-1.4,0],d)]
 if state=='speaking':
  tracks += [track('speaking-root','rotation',[0,-2.2,.35,1.7,0],d)]
  for node,vals in [('head-open',[False,True,False,True,False,True,False]),('head-closed',[True,False,True,False,True,False,True])]:
   tracks.append(dict(node=node,property='visible',interpolation='step',keys=[dict(time=t,value=v) for t,v in [(round(t+j,3),v) for j in range(3) for t,v in zip([0,.13,.34,.49,.73,.87],vals[:6])] + [(3.0,vals[0]),(3.13,vals[1]),(3.34,vals[2]),(3.49,vals[3]),(3.6,vals[0])]]))
 return dict(duration=d,loop=True,visibility={x:x in visible for x in optional},tracks=tracks)
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets={x:dict(src=f'parts/{x}.png',width=1254,height=1254) for x in ['waiting-source','waiting-torso','waiting-arms','shared-torso','default-source','listening-source','speaking-source']},nodes=nodes,clips={s:clip(s,3.6 if s=='speaking' else 4.8) for s in ['idle','listening','waiting','speaking']},states=dict(default='idle',listening='listening',waiting='waiting',speaking='speaking'),transitions=[])
(root/'package.json').write_text(json.dumps(data,indent=2)+'\n')
