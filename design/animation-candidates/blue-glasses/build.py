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

head=[[350,0],[800,0],[800,340],[690,340],[680,390],[600,395],[526,355],[350,350]]
sprite('head-closed','default-source',8,head,'head-root')
sprite('head-open','speaking-source',8,head,'head-root',False)
sprite('arm-left','default-source',4,[[360,490],[470,450],[475,540],[455,640],[460,780],[455,870],[395,1020],[390,1254],[220,1254],[240,1040],[300,870],[300,780],[280,730],[300,650],[330,550]],'left-root')
sprite('arm-right','default-source',4,[[780,430],[910,450],[1000,660],[1030,900],[1040,1254],[870,1254],[910,1040],[870,880],[830,800],[810,700],[780,600]],'right-root')
# Complete raised arm + own sleeve; hand follows head/contact rig.
sprite('arm-listening','listening-source',9,[[330,210],[510,210],[515,380],[465,450],[475,520],[450,650],[455,750],[220,750],[220,550],[290,450],[330,390]],'contact-root',False)
# All thinking-pose sleeves/arms use the same canonical bitmap and contact transform.
# Overlapping selections are identical source pixels, with no scaled second skin contour.
sprite('arm-waiting-left','waiting-source',1,[[350,490],[480,450],[500,540],[465,650],[480,730],[520,800],[515,845],[475,865],[435,845],[395,790],[365,735],[315,740],[310,660]],'contact-root',False)
sprite('arm-waiting','waiting-source',9,[[540,395],[565,365],[615,337],[650,332],[660,348],[640,375],[655,385],[660,425],[655,480],[630,520],[600,535],[580,650],[555,755],[530,820],[500,855],[470,855],[430,820],[410,780],[435,720],[475,650],[510,535],[535,490]],'contact-root',False)
sprite('arm-waiting-right','waiting-source',9,[[790,440],[910,460],[990,680],[970,760],[910,800],[890,858],[865,888],[800,895],[740,899],[680,892],[620,882],[560,872],[520,870],[480,878],[440,871],[410,862],[395,850],[410,815],[450,800],[480,815],[535,800],[650,795],[790,775],[790,650]],'contact-root',False)
sprite('sleeve-speaking','speaking-source',4,[[800,445],[910,450],[1010,700],[985,725],[838,754],[805,690],[795,600]],'speaking-root',False)
sprite('arm-speaking','speaking-source',4,[[845,635],[880,635],[895,670],[880,700],[963,691],[991,790],[989,845],[968,877],[945,892],[905,880],[875,867],[860,853],[850,840],[840,825],[830,812],[820,797],[810,788],[740,783],[715,768],[695,748],[675,733],[668,710],[686,698],[704,697],[724,687],[750,698],[780,706],[808,706],[830,682]],'speaking-root',False)
optional=['body-normal','body-listening','body-waiting','arm-left','arm-right','arm-listening','arm-waiting','arm-waiting-left','arm-waiting-right','sleeve-speaking','arm-speaking','head-closed','head-open']
def track(node,prop,values,d=4):
 return dict(node=node,property=prop,interpolation='linear',keys=[dict(time=d*i/(len(values)-1),value=v) for i,v in enumerate(values)])
def clip(state,d=4):
 visible=['head-closed']
 if state=='listening':visible+=['body-listening','arm-listening','arm-right']
 elif state=='waiting':visible+=['body-waiting','arm-waiting','arm-waiting-left','arm-waiting-right']
 elif state=='speaking':visible+=['body-normal','arm-left','sleeve-speaking','arm-speaking']
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
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets={x:dict(src=f'parts/{x}.png',width=1254,height=1254) for x in ['waiting-source','waiting-torso','shared-torso','default-source','listening-source','speaking-source']},nodes=nodes,clips={s:clip(s,3.6 if s=='speaking' else 4.8) for s in ['idle','listening','waiting','speaking']},states=dict(default='idle',listening='listening',waiting='waiting',speaking='speaking'),transitions=[])
(root/'package.json').write_text(json.dumps(data,indent=2)+'\n')
