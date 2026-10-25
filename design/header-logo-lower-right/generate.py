from pathlib import Path
from html import escape
import re,base64,json,hashlib
D=Path(__file__).resolve().parent
R=D.parents[1]
INK='#111b45';PAPER='#fffef7';YELLOW='#fff18a';MUTED='#52607a';BLUE='#2055fa'
def inner(p):return re.sub(r'</svg>\s*$','',re.sub(r'^<svg\b[^>]*>','',p.read_text().strip()))
LOGO=inner(R/'apps/web/public/brand/logo.svg');LINE=inner(R/'apps/web/public/brand/underline.svg')
def text(x,y,s,size=16,weight=400,color=INK):return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(s)}</text>'
def rect(x,y,w,h,r=0,fill=PAPER,stroke=None):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="2"' if stroke else '')+'/>'
def mark(x,y,scale=1):return f'<g transform="translate({x} {y}) scale({scale})"><g transform="rotate(-8 105 53)"><svg x="70" y="49" width="68" height="9" viewBox="0 0 100 12" preserveAspectRatio="none">{LINE}</svg></g><svg width="105" height="56" viewBox="0 0 440 235">{LOGO}</svg></g>'
def image(name,x,y,w):
 b=base64.b64encode((D/'context'/f'{name}.png').read_bytes()).decode()
 return f'<image x="{x}" y="{y}" width="{w}" height="{w}" href="data:image/png;base64,{b}"/>'
def svg(w,h,body):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><g font-family="system-ui,-apple-system,\'PingFang SC\',sans-serif">{body}</g></svg>'
cases=[json.loads(p.read_text()) for p in sorted((R/'content/games').glob('*.json'))]
def button(x,y,w=150):return rect(x,y+4,w,46,14,INK)+rect(x,y,w,46,14,BLUE,INK)+text(x+18,y+29,'查看案件',16,700,'white')+text(x+w-30,y+29,'→',20,700,'white')
def card(c,i,x,y,w,mobile=False):
 out=rect(x,y+5,w,225,24,INK)+rect(x,y,w,225,24,PAPER,INK)+rect(x+24,y+22,34,28,9,YELLOW,INK)+text(x+32,y+42,f'{i:02}',14,800)
 out+=text(x+w-75,y+42,f'{len(c["characters"])}位角色',12,color=MUTED)+text(x+24,y+89,c['title'],24 if mobile else 27,800)
 # Keep actual case copy; wrap static Chinese text for the chosen mockup width.
 s=c['summary'];n=21 if mobile else 32
 for j in range(0,len(s),n):out+=text(x+24,y+123+j//n*25,s[j:j+n],14 if mobile else 15,color=MUTED)
 return out+button(x+w-174,y+156)
def desktop():
 out=rect(0,0,1280,1180,0,YELLOW)+mark(24,24)+text(1170,61,'创作案件',15,700)
 out+=text(24,175,'有人在说谎',52,850)+text(24,224,'和角色语音对话，',19,color=MUTED)+text(24,255,'找出藏起真相的人。',19,color=MUTED)
 out+='<ellipse cx="307" cy="477" rx="285" ry="139" transform="rotate(-4 307 477)" fill="#78ddd7" stroke="#111b45" stroke-width="2"/>'
 out+=image('sunny',-28,325,340)+image('blue',246,325,340)+image('coral',111,298,365)+text(20,336,'✦',32,700,BLUE)+text(580,360,'✦',24,700,BLUE)
 out+=text(24,700,'开口问话',14,650)+text(112,700,'→',14,color=MUTED)+text(142,700,'对照说法',14,650)+text(231,700,'→',14,color=MUTED)+text(261,700,'最终指认',14,650)
 out+=text(668,150,'选择案件',20,850)
 for i,c in enumerate(cases):out+=card(c,i+1,668,179+i*247,588)
 return out

def mobile():
 out=rect(0,0,391,1580,0,YELLOW)+mark(16,17,.84)+text(310,46,'创作案件',13,700)
 out+=text(16,126,'有人在说谎',36,850)+text(16,162,'和角色语音对话，找出藏起真相的人。',15,color=MUTED)
 out+='<ellipse cx="195" cy="307" rx="178" ry="94" fill="#78ddd7" stroke="#111b45" stroke-width="2"/>'
 out+=image('sunny',-25,206,220)+image('blue',171,206,220)+image('coral',72,185,236)+text(16,215,'✦',26,700,BLUE)
 out+=text(18,453,'开口问话',14,650)+text(104,453,'→',14,color=MUTED)+text(137,453,'对照说法',14,650)+text(224,453,'→',14,color=MUTED)+text(257,453,'最终指认',14,650)+text(16,507,'选择案件',18,850)
 for i,c in enumerate(cases):out+=card(c,i+1,16,532+i*247,359,True)
 return out
(D/'brand-mark.svg').write_text(svg(142,64,mark(0,0)))
(D/'desktop-page.svg').write_text(svg(1280,1180,desktop()))
(D/'mobile-page.svg').write_text(svg(391,1580,mobile()))
# Square boards preserve native QuickLook rendering without cropping.
(D/'desktop-board.svg').write_text(svg(1280,1280,desktop()+rect(0,1180,1280,100,0,'#f4f1e7')+text(24,1220,'右下方下划线 · 完整首页设计预览（待确认）',20,750)+text(24,1253,'静态页面上下文；只调整品牌组合，未修改正式界面。',14,color=MUTED)))
body=rect(0,0,1280,1280,0,'#f4f1e7')+text(32,52,'窄屏 · 完整首页与首屏大小',26,800)
body+=f'<svg x="32" y="90" width="286" height="1156" viewBox="0 0 391 1580">{mobile()}</svg>'
body+=text(370,121,'391px 首屏原尺寸',20,750)+f'<svg x="370" y="150" width="391" height="844" viewBox="0 0 391 844">{mobile()}</svg>'
body+=text(810,200,'右下方的一笔',22,750)+mark(810,250,2)+text(810,430,'从 E 下缘附近向右伸出',17)+text(810,463,'原 Logo 比例与笔触保留',15,color=MUTED)+text(810,496,'文字叠在笔触前方',15,color=MUTED)+text(810,529,'图形仍待确认',15,color=MUTED)
(D/'mobile-board.svg').write_text(svg(1280,1280,body))
(D/'preview.html').write_text('<!doctype html><meta charset="utf-8"><title>Logo右下方下划线 · 完整首页</title><style>body{margin:0;background:#fff18a}img{display:block;width:100%;max-width:1280px;margin:auto}.mobile{display:none}@media(max-width:600px){.desktop{display:none}.mobile{display:block;max-width:391px}}</style><img class="desktop" src="desktop-page.svg" alt="桌面完整首页设计"><img class="mobile" src="mobile-page.svg" alt="窄屏完整首页设计">')
(D/'source.json').write_text(json.dumps({'base':'0abc82d1acdfbaedab19888cd94ac5eaad166ab1','status':'proposal-awaiting-user-approval','mark':{'logo':[105,56],'underline':[70,49,68,9],'rotationDegrees':-8,'frame':[142,64]},'sources':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [R/'apps/web/public/brand/logo.svg',R/'apps/web/public/brand/underline.svg']},'context':'Static reconstruction from current homepage layout/content; existing avatar PNGs resized via sips. Not a live application screenshot.'},ensure_ascii=False,indent=2)+'\n')
