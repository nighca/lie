"""Assemble data and copy unmodified PNGs. Never edits image pixels."""
import json, shutil, hashlib
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
repo=root.parents[2]
gen=Path('/Users/nighca/.codex/generated_images/01a16db7-5ef1-7342-b690-7847489750d7')
files={'head':gen/'exec-0d6778c7-bc4c-4ebd-8a3b-195b1c0ed108.png','mouths':gen/'exec-cc23c077-ca28-4f1b-8ba6-9896060af9a8.png'}
for state in ['default','listening','waiting','speaking']:files[state+'-source']=repo/'design/appearances/assets/silver-bun'/f'{state}.png'
assets={};sources=[]
for name,p in files.items():
 dest=root/'parts'/f'{name}.png';shutil.copyfile(p,dest);im=Image.open(p)
 assets[name]={'src':f'parts/{name}.png','width':im.width,'height':im.height}
 sources.append({'id':name,'source':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':list(im.size),'mode':im.mode,'alphaExtrema':list(im.getchannel('A').getextrema())})
def t(x=0,y=0,px=0,py=0,s=1):return dict(x=x,y=y,pivotX=px,pivotY=py,rotation=0,scaleX=s,scaleY=s)
nodes=[]
def node(id,parent=None,transform=None,asset=None,order=0,mask=None,crop=None,visible=True):
 n=dict(id=id,parent=parent,transform=transform or t(),visible=visible)
 if asset:
  n['sprite']=dict(asset=asset,order=order)
  if mask:n['sprite']['mask']=mask
  if crop:n['sprite']['crop']=crop
 nodes.append(n)
node('body-root',transform=t(650,800,650,800))
node('torso','body-root',asset='default-source',order=10,mask=[[580,375],[715,375],[745,400],[850,425],[945,530],[875,680],[900,800],[920,880],[938,950],[915,968],[918,1000],[925,1100],[931,1200],[940,1254],[374,1254],[382,972],[385,912],[443,759],[440,650],[330,530],[350,460],[420,420],[578,395]])
left=[[420,438],[505,452],[489,538],[477,685],[448,784],[407,867],[397,942],[400,990],[390,1040],[411,1165],[375,1218],[278,1180],[268,1090],[293,1000],[289,856],[298,780],[286,732],[318,671],[340,546],[367,480]]
right=[[818,456],[896,481],[934,552],[953,710],[983,788],[985,864],[1000,1060],[1035,1194],[976,1225],[933,1195],[946,1080],[935,1000],[919,885],[884,817],[875,673],[856,560]]
node('left-neutral','body-root',t(445,480,445,480),asset='default-source',order=20,mask=left)
node('right-neutral','body-root',t(875,500,875,500),asset='default-source',order=21,mask=right)
node('head-root','body-root',t(625,390,625,390))
node('head','head-root',t(307,-15,s=.45),asset='head',order=30,mask=[[0,0],[1362,0],[1362,1155],[1030,1155],[1030,925],[540,925],[540,1155],[0,1155]])
node('waiting-torso','head-root',asset='waiting-source',order=10,mask=[[580,375],[715,375],[745,400],[850,425],[945,530],[875,680],[900,800],[940,975],[950,1254],[374,1254],[382,972],[385,912],[443,759],[440,650],[330,530],[350,460],[420,420],[578,395]],visible=False)
node('listening-torso','head-root',asset='listening-source',order=10,mask=[[580,375],[715,375],[745,400],[850,425],[945,530],[875,680],[900,800],[920,880],[938,950],[915,968],[918,1000],[925,1100],[931,1200],[940,1254],[374,1254],[355,1000],[355,950],[385,875],[425,800],[460,720],[470,650],[470,560],[440,500],[420,420],[578,395]],visible=False)
node('mouth-closed','head-root',t(577,316,s=.16),asset='mouths',order=31,crop=[245,235,590,260])
node('mouth-open','head-root',t(577,309,s=.16),asset='mouths',order=31,crop=[1380,170,620,380],visible=False)
node('listen-arm','head-root',asset='listening-source',order=40,mask=[[419,253],[446,251],[465,278],[472,315],[493,332],[511,365],[504,407],[485,432],[465,481],[452,531],[451,595],[435,662],[407,722],[359,744],[310,731],[280,703],[275,649],[284,586],[308,537],[339,514],[369,463],[405,411],[398,389],[380,345],[382,313],[397,278]],visible=False)
node('waiting-arms','head-root',asset='waiting-source',order=40,mask=[[411,444],[375,491],[365,574],[369,685],[382,746],[415,794],[455,820],[539,827],[720,845],[854,868],[922,850],[957,800],[968,713],[951,608],[924,530],[866,476],[820,446],[796,491],[824,600],[839,691],[762,733],[637,742],[589,718],[605,654],[615,525],[642,466],[653,418],[642,382],[594,363],[563,392],[549,441],[552,502],[514,583],[486,648],[466,600],[485,501],[480,449]],visible=False)
node('speak-arm','body-root',t(880,530,880,530),asset='speaking-source',order=40,mask=[[820,450],[947,500],[974,600],[1030,610],[1060,680],[1040,770],[1000,870],[924,900],[860,870],[830,790],[820,700],[850,650]],visible=False)
def track(n,p,vals,d=4):return dict(node=n,property=p,interpolation='linear',keys=[dict(time=d*i/(len(vals)-1),value=v) for i,v in enumerate(vals)])
clips={}
for state in ['idle','listening','waiting','speaking']:
 vis={'torso':state not in ['waiting','listening'],'waiting-torso':state=='waiting','listening-torso':state=='listening','left-neutral':state not in ['listening','waiting'],'right-neutral':state not in ['waiting','speaking'],'listen-arm':state=='listening','waiting-arms':state=='waiting','speak-arm':state=='speaking','mouth-open':False,'mouth-closed':True}
 tracks=[track('body-root','y',[800,798,800,802,800]),track('head-root','rotation',[0,.35,0,-.35,0]),track('head-root','y',[390,389,390,391,390])]
 if state not in ['waiting','listening']:tracks += [track('left-neutral','rotation',[0,.3,0,-.3,0])]
 if state not in ['waiting','speaking']:tracks += [track('right-neutral','rotation',[0,-.3,0,.3,0])]
 if state=='speaking':
  tracks += [track('speak-arm','rotation',[0,1,0,-1,0])]
  for n,invert in [('mouth-open',False),('mouth-closed',True)]:tracks.append(dict(node=n,property='visible',interpolation='step',keys=[dict(time=i*.25,value=(i%3!=0)^invert) for i in range(17)]))
 clips[state]=dict(duration=4,loop=True,visibility=vis,tracks=tracks)
data=dict(schemaVersion=1,canvas=dict(width=1254,height=1254),assets=assets,nodes=nodes,clips=clips,states=dict(default='idle',listening='listening',waiting='waiting',speaking='speaking'),transitions=[])
(root/'package.json').write_text(json.dumps(data,indent=2)+'\n')
(root/'provenance.json').write_text(json.dumps({'sources':sources,'originalCanonicalStates':{s:hashlib.sha256((repo/'design/appearances/assets/silver-bun'/f'{s}.png').read_bytes()).hexdigest() for s in ['default','listening','waiting','speaking']}},indent=2)+'\n')
