from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
INK='#111B45'; PAPER='#FFFEF7'; YELLOW='#FFF18A'; BLUE='#075BFA'; MUTED='#52607A'; AQUA='#78DDD7'; SOFT='#EAF2FF'
FONT='/System/Library/Fonts/Hiragino Sans GB.ttc'
def f(n,b=False): return ImageFont.truetype(FONT,n,index=2 if b else 0)
def text(im,xy,s,n=18,b=False,fill=INK,anchor=None): ImageDraw.Draw(im).text(xy,s,font=f(n,b),fill=fill,anchor=anchor)
def box(im,xy,fill=PAPER,r=20,stroke=INK,w=2): ImageDraw.Draw(im).rounded_rectangle(xy,r,fill=fill,outline=stroke,width=w)
def line(im,xy,fill=INK,w=3): ImageDraw.Draw(im).line(xy,fill=fill,width=w)
def img(im,name,xy,size):
 p=ROOT/'design/character-presets/assets'/name/'default.png'; a=Image.open(p).convert('RGBA');a.thumbnail((size,size));im.paste(a,xy,a)
def avatar(im,name,xy,size):
 p=ROOT/'design/character-presets/assets'/name/'avatar.png'
 a=Image.open(p).convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
 mask=Image.new('L',(size,size));ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
 # Preserve the official transparent image, within a circular crop.
 import PIL.ImageChops
 a.putalpha(PIL.ImageChops.multiply(a.getchannel('A'),mask));im.paste(a,xy,a)
def pill(im,xy,label,fill=PAPER,color=INK,width=72,height=42):
 x,y=xy;box(im,(x,y,x+width,y+height),fill,12,INK,2);text(im,(x+width/2,y+height/2),label,15,True,color,'mm')
def card(kind,scale=1):
 im=Image.new('RGBA',(420,204),(0,0,0,0)); d=ImageDraw.Draw(im)
 box(im,(2,8,416,200),'#E0D78A',22,None);box(im,(2,2,416,194),PAPER,22,INK,3)
 if kind=='A':
  d.ellipse((24,24,92,92),fill=YELLOW,outline=INK,width=2);avatar(im,'coral-bob',(26,26),64)
  text(im,(111,24),'请顾遥来接个话…',22,True)
  text(im,(111,59),'把下一句问题先放在嘴边。',16,False,MUTED)
  d.ellipse((27,125,41,139),fill=AQUA,outline=INK,width=2)
  text(im,(51,119),'正在连接',16,True)
  text(im,(25,156),'接通后再说话',15,False,MUTED)
  pill(im,(321,127),'取消',width=72,height=44)
 elif kind=='B':
  box(im,(2,2,416,87),BLUE,22,INK,3);d.rectangle((5,47,413,85),fill=BLUE)
  text(im,(24,22),'下一位，顾遥！',27,True,PAPER)
  # Cable is an illustrative system motif, never a voice waveform.
  line(im,[(27,120),(70,120),(70,140),(111,140)],BLUE,4)
  d.rounded_rectangle((17,110,37,130),5,fill=AQUA,outline=INK,width=2)
  d.rounded_rectangle((107,130,127,150),5,fill=YELLOW,outline=INK,width=2)
  text(im,(144,106),'正在接通语音…',18,True)
  text(im,(144,140),'接通后再说话',15,False,MUTED)
  pill(im,(321,139),'取消',width=72,height=44)
 elif kind=='C':
  # Small paper tab stays within the existing cream surface language.
  box(im,(23,19,110,49),YELLOW,9,None);text(im,(66,34),'侦探便签',14,True,INK,'mm')
  text(im,(24,65),'下一句，先问什么？',24,True)
  text(im,(24,105),'先打个招呼，还是直奔主题？',16,False,MUTED)
  text(im,(24,150),'正在连接 · 接通后再说话',15,True)
  pill(im,(321,139),'取消',width=72,height=44)
 return im.resize((420*scale,204*scale),Image.Resampling.LANCZOS)

OVERVIEW = [('A','候场小卡','推荐：最贴近现有奶油小卡','轻拟人旁白＋人物头像','头像轻轻点头，三点慢慢循环。'),('B','漫画接线牌','更活泼：把切人变成一次换场','钴蓝标题带＋接线插画','接线头轻摆，不模拟音量波形。'),('C','侦探便签','更克制：给等待一点用途','奶油便签＋通用思考提示','便签轻轻落下，随后保持安静。')]
im=Image.new('RGB',(1440,660),PAPER)
text(im,(36,25),'连接的这几秒，也可以有一点戏。',32,True)
text(im,(36,78),'沿用已确认的黄蓝撞色 / 深蓝描边 / 奶油阅读面 · 三个待确认方向',18,False,MUTED)
for i,(k,title,sub,a,b) in enumerate(OVERVIEW):
 x=36+i*468
 text(im,(x,143),k+'  '+title,27,True)
 text(im,(x,187),sub,17,False,MUTED)
 c=card(k);im.paste(c,(x,235),c)
 text(im,(x,472),a,20,True)
 text(im,(x,511),b,16,False,MUTED)
text(im,(36,589),'共同底线：真实接通即退出；等待不扣询问时间；保留取消；文案不暗示谁在撒谎。',18,True)
text(im,(36,625),'静态设计合成，非上线截图；动效为提议。',15,False,MUTED)
im.save(HERE/'overview.png')
for k,*_ in OVERVIEW: card(k,2).save(HERE/f'{k.lower()}-card.png')

def mobile(k):
 im=Image.new('RGB',(391,844),YELLOW)
 # Preserve the actual current wordmark from a checked-in browser screenshot.
 ref=Image.open(ROOT/'design/investigation-portrait-position/mobile-unchanged.png').convert('RGB')
 im.paste(ref.crop((16,15,174,63)),(16,15))
 text(im,(373,35),'结束本局',11,False,MUTED,'ra')
 text(im,(16,76),'消失的纪念章',20,True)
 text(im,(373,86),'案件背景 ↗',11,False,MUTED,'ra')
 for i,(p,n) in enumerate([('sunny-moustache','沈禾'),('coral-bob','顾遥'),('blue-glasses','陈拓')]):
  y=126+i*50; selected=i==1
  box(im,(16,y,215,y+44),BLUE if selected else PAPER,12,BLUE if selected else '#ADB5C7',2)
  avatar(im,p,(18,y+2),40)
  text(im,(132,y+22),n,14,True,PAPER if selected else INK,'mm')
 img(im,'coral-bob',(216,117),175)
 box(im,(16,306,375,710),PAPER,23,INK,2)
 text(im,(32,326),'顾遥的询问记录',17,True)
 line(im,[(31,357),(361,357)],'#D5D7DE',1)
 text(im,(31,375),'还没有对话，开口打个招呼吧。',15,False,MUTED)
 c=card(k).resize((343,167),Image.Resampling.LANCZOS);im.paste(c,(24,432),c)
 box(im,(0,727,390,856),PAPER,23,INK,2)
 text(im,(17,749),'剩余询问',11,False,MUTED)
 text(im,(77,741),'08:00',24,True)
 pill(im,(275,739),'我有答案了 →',width=98,height=34)
 pill(im,(18,783),'取消连接',BLUE,PAPER,width=128,height=44)
 text(im,(163,799),'正在连接',14,True,MUTED)
 return im

for k,*_ in OVERVIEW:
 mobile(k).save(HERE/f'{k.lower()}-mobile.png')
im=Image.new('RGB',(1320,1060),PAPER)
text(im,(35,27),'放回游戏里看：切换到顾遥，语音正在连接',29,True)
text(im,(35,77),'静态合成 · 391px 移动布局示意 · 正式人物素材 · 不包含模拟角色证词',17,False,MUTED)
for i,(k,title,*_) in enumerate(OVERVIEW):
 x=35+i*432
 text(im,(x,127),k+'  '+title,22,True)
 im.paste(mobile(k),(x,173))
im.save(HERE/'mobile-comparison.png')

im=Image.new('RGB',(1280,878),YELLOW)
ref=Image.open(ROOT/'design/investigation-portrait-position/mobile-unchanged.png').convert('RGB')
im.paste(ref.crop((16,15,174,63)).resize((198,60)),(26,22))
text(im,(705,34),'消失的纪念章',30,True,INK,'ma')
text(im,(705,81),'案件背景 ↗',13,False,MUTED,'ma')
text(im,(1253,42),'结束本局',14,False,MUTED,'ra')
for i,(p,n) in enumerate([('sunny-moustache','沈禾'),('coral-bob','顾遥'),('blue-glasses','陈拓')]):
 y=132+i*134; selected=i==1
 box(im,(26,y,124,y+122),BLUE if selected else PAPER,18,INK,2)
 avatar(im,p,(35,y+8),80)
 text(im,(75,y+105),n,16,True,PAPER if selected else INK,'mm')
img(im,'coral-bob',(145,144),530)
box(im,(695,129,1255,710),PAPER,26,INK,2)
text(im,(719,152),'顾遥的询问记录',23,True)
line(im,[(719,193),(1228,193)],'#D5D7DE',1)
text(im,(719,216),'还没有对话，开口打个招呼吧。',17,False,MUTED)
box(im,(148,730,1255,854),PAPER,24,INK,2)
text(im,(169,751),'剩余询问',13,False,MUTED)
text(im,(169,775),'08:00',30,True)
pill(im,(295,768),'取消连接',BLUE,PAPER,width=145,height=52)
text(im,(466,785),'正在连接',16,True,MUTED)
pill(im,(1110,773),'我有答案了 →',width=120,height=44)
c=card('A');im.paste(c,(430,381),c)
text(im,(25,847),'静态设计合成 · 待确认',12,False,MUTED)
im.save(HERE/'a-desktop.png')

sources=['design/ui/tokens.json','design/ui/spec.md','apps/web/src/App.vue','apps/web/src/style.css','design/investigation-portrait-position/mobile-unchanged.png']
sources += [f'design/character-presets/assets/{name}/{kind}.png' for name in ['coral-bob','sunny-moustache','blue-glasses'] for kind in ['default','avatar']]
(HERE/'source.json').write_text(json.dumps({'status':'proposal-awaiting-user-selection','date':'2026-10-30','base':'60c11f72b71ead4b8e744f2281d5dbecb796d11a','sources':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in sources},'font':{'file':FONT,'regularIndex':0,'boldIndex':2},'limitations':['Static Pillow compositions; no production edits or browser validation.','Animation descriptions are proposals, not animated output.','C uses a generic greeting cue that also works without previous transcripts.']},ensure_ascii=False,indent=2)+'\n')
print('Generated overview, three cards, three mobile frames, comparison, source manifest.')
