"""Generate animation JSON only; native PNG files are never edited."""
import json
from pathlib import Path
root=Path(__file__).parent
base=dict(x=0,y=0,pivotX=0,pivotY=0,rotation=0,scaleX=1,scaleY=1)
nodes=[]
def group(id,parent,pivot):
 t={**base,'x':pivot[0],'y':pivot[1],'pivotX':pivot[0],'pivotY':pivot[1]}
 nodes.append(dict(id=id,parent=parent,transform=t,visible=True))
def sprite(id,asset,order,mask,parent,visible=False):
 nodes.append(dict(id=id,parent=parent,transform=base.copy(),visible=visible,sprite=dict(asset=asset,order=order,mask=mask)))
group('body-root',None,(615,900))
group('contact-root','body-root',(615,380))
group('head-root','contact-root',(615,380))
group('left-root','body-root',(390,485))
group('right-root','body-root',(870,460))
group('speaking-root','body-root',(870,460))
body=[[490,335],[780,335],[815,450],[805,650],[810,750],[870,850],[1000,1254],[300,1254],[340,900],[365,850],[400,700],[375,550],[420,450]]
sprite('body','shared-torso',3,body,'body-root',True)
head=[[350,0],[800,0],[800,290],[739,290],[730,335],[700,365],[660,385],[600,402],[540,392],[510,373],[490,350],[350,350]]
for state in ['default','listening','waiting','speaking']:
 sprite('head-'+state,state+'-source',8,head,'head-root',state=='default')
sprite('arm-left','default-source',1,[[320,450],[435,410],[435,530],[415,630],[420,735],[390,800],[380,900],[330,1000],[370,1254],[180,1254],[180,1000],[200,800],[230,720],[245,650],[280,550]],'left-root',True)
sprite('arm-right','default-source',1,[[820,410],[950,425],[1080,650],[1100,1254],[860,1254],[900,1020],[870,900],[850,800],[825,720],[800,600]],'right-root',True)
sprite('arm-listening','listening-source',1,[[300,200],[500,200],[500,370],[470,395],[450,405],[485,415],[485,485],[450,580],[425,700],[210,730],[160,650],[180,500],[260,420],[300,390]],'contact-root')
# Canonical sleeves and skin have identical registration and share the chin contact rig.
sprite('arm-waiting-left','waiting-source',1,[[320,455],[450,400],[460,510],[445,585],[425,650],[445,710],[475,770],[450,815],[400,830],[350,795],[300,730],[260,680],[270,570]],'contact-root')
sprite('arm-waiting','waiting-source',9,[[520,345],[555,340],[570,365],[600,345],[650,340],[668,352],[665,372],[630,385],[635,400],[650,410],[650,440],[645,465],[630,490],[605,520],[575,540],[560,625],[535,700],[505,755],[460,790],[420,820],[380,810],[345,780],[325,735],[340,680],[380,625],[440,565],[495,495],[515,440]],'contact-root')
sprite('arm-waiting-right','waiting-source',9,[[820,420],[930,450],[1000,640],[980,720],[940,790],[900,800],[880,815],[850,838],[800,845],[740,848],[680,842],[620,831],[560,817],[520,814],[480,817],[460,830],[440,834],[420,820],[410,805],[425,780],[465,770],[500,780],[530,720],[650,715],[775,680],[790,580]],'contact-root')
sprite('sleeve-speaking','speaking-source',1,[[820,420],[935,450],[1000,560],[1060,670],[1030,710],[900,700],[835,650],[810,560]],'speaking-root')
sprite('arm-speaking','speaking-source',4,[[1030,645],[1065,720],[1065,800],[1045,845],[1010,858],[970,852],[940,850],[920,845],[900,830],[880,810],[860,790],[840,765],[825,740],[815,725],[780,728],[750,720],[730,705],[710,685],[690,660],[680,630],[690,610],[710,605],[735,615],[750,625],[780,630],[805,640],[830,640],[830,595],[840,565],[858,565],[874,600],[885,640],[885,675]],'speaking-root')
attachments=[n['id'] for n in nodes if n.get('sprite') and n['id']!='body']
def wave(node,property,values,duration):
 return dict(node=node,property=property,interpolation='linear',keys=[dict(time=duration*i/(len(values)-1),value=value) for i,value in enumerate(values)])
def clip(state,duration):
 visible=['head-'+state]
 if state=='default':visible+=['arm-left','arm-right']
 elif state=='listening':visible+=['arm-listening','arm-right']
 elif state=='waiting':visible+=['arm-waiting','arm-waiting-left','arm-waiting-right']
 else:visible+=['arm-left','sleeve-speaking','arm-speaking']
 tracks=[wave('body-root','y',[900,896,900,904,900],duration),wave('body-root','rotation',[0,.4,.08,-.4,0],duration)]
 if state in ['listening','waiting']:
  tracks += [wave('contact-root','rotation',[0,.95,.15,-.85,0],duration),wave('contact-root','y',[380,378.8,380,381.2,380],duration)]
 else:tracks += [wave('head-root','rotation',[0,1.6,.25,-1.3,0],duration),wave('head-root','y',[380,378.5,380,381.5,380],duration)]
 if state!='waiting':tracks += [wave('left-root','rotation',[0,.9,-.2,-1.4,0],duration),wave('right-root','rotation',[0,-1.3,.25,1.1,0],duration)]
 if state=='speaking':
  tracks += [wave('speaking-root','rotation',[0,-2.2,.35,1.7,0],duration)]
  for node,opened in [('head-speaking',True),('head-default',False)]:
   times=[0,.13,.34,.49,.73,.87,1,1.13,1.34,1.49,1.73,1.87,2,2.13,2.34,2.49,2.73,2.87,3,3.13,3.34,3.49,3.6]
   tracks.append(dict(node=node,property='visible',interpolation='step',keys=[dict(time=t,value=(i%2==1)==opened) for i,t in enumerate(times)]))
 return dict(duration=duration,loop=True,visibility={id:id in visible for id in attachments},tracks=tracks)
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets={id:dict(src=f'parts/{id}.png',width=1254,height=1254) for id in ['shared-torso','default-source','listening-source','waiting-source','speaking-source']},nodes=nodes,clips={s:clip(s,3.6 if s=='speaking' else 4.8) for s in ['default','listening','waiting','speaking']},states={s:s for s in ['default','listening','waiting','speaking']},transitions=[])
(root/'package.json').write_text(json.dumps(data,indent=2)+'\n')
