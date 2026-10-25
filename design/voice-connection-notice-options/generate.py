from pathlib import Path
from html import escape
import re, base64, json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
INK='#111b45'; YELLOW='#fff18a'; PAPER='#fffef7'; MUTED='#52607a'; BLUE='#075bfa'; SOFT='#eaf2ff'
FONT="system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif"
def inner(path):
 s=path.read_text().strip();return re.sub(r'</svg>\s*$','',re.sub(r'^<svg\b[^>]*>','',s))
LOGO=inner(ROOT/'apps/web/public/brand/logo.svg');LINE=inner(ROOT/'apps/web/public/brand/underline.svg')
def txt(x,y,s,size=16,weight=400,color=INK,anchor='start'):
 return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{escape(s)}</text>'
def rect(x,y,w,h,r,fill,stroke=None,sw=1):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '')+'/>'
def defs():
 out='<defs>'
 for name in ['sunny','coral','blue']:
  data=base64.b64encode((HERE/'context'/(name+'.png')).read_bytes()).decode()
  out+=f'<image id="{name}-image" width="384" height="384" href="data:image/png;base64,{data}"/>'
 return out+'</defs>'
def svg(w,h,body):
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{defs()}<g font-family="{FONT}">{body}</g></svg>'
def image(name,x,y,w):
 return f'<use href="#{name}-image" transform="translate({x} {y}) scale({w/384})"/>'
def logo(x,y,mobile=False):
 w,h,size,gap=(88,47,14,8) if mobile else (105,56,18,16)
 return f'<g transform="translate({x} {y})"><svg width="{w}" height="{h}" viewBox="0 0 440 235">{LOGO}</svg><g transform="rotate(-5 {w+gap+30} {h/2+11})"><svg x="{w+gap-2}" y="{h/2+7}" width="{61 if mobile else 79}" height="8" viewBox="0 0 100 12" preserveAspectRatio="none">{LINE}</svg></g>{txt(w+gap,h/2+6,"语音推理",size,800)}</g>'
def spin(x,y,r=9,color=BLUE):
 return f'<g transform="translate({x} {y})"><circle r="{r}" fill="none" stroke="{color}" stroke-opacity=".18" stroke-width="2"/><path d="M0 -{r} A{r} {r} 0 0 1 {r} 0" fill="none" stroke="{color}" stroke-width="2.5" stroke-linecap="round"/></g>'
SIZES={'A':((360,72),(312,68)),'B':((380,60),(328,60)),'C':((336,72),(296,72)),'current':((560,95.5),(359,83.2))}
def card(kind,mobile=False):
 w,h=SIZES[kind][mobile]
 if kind=='current':
  out=rect(0,3,w,h,18,'#111b4533')+rect(0,0,w,h,18,INK)
  out+=spin(26,29,9,'#78ddd7')+txt(44,36,'正在连接语音',18 if mobile else 20,800,PAPER)
  out+=txt(16,59,'沈禾 · 连接成功后再说话',14 if mobile else 15,400,PAPER)
  out+=rect(w-92,(h-44)/2,76,44,16,'none','#657087',2)+txt(w-54,h/2+5,'取消连接',13,700,PAPER,'middle')
 elif kind=='A':
  out=rect(0,3,w,h,16,'#111b451c')+rect(0,0,w,h,16,PAPER,INK,2)
  out+=spin(25,h/2,9)+txt(46,27 if mobile else 29,'正在连接…',18,800)+txt(46,47 if mobile else 49,'连好后再说话',13,400,MUTED)
  out+=rect(w-68,(h-44)/2,56,44,12,'none','#9ba6bb',1.5)+txt(w-40,h/2+5,'取消',14,600,INK,'middle')
 elif kind=='B':
  out=rect(0,2,w,h,30,'#075bfa12')+rect(0,0,w,h,30,SOFT,'#96b4e3',1.5)
  out+=spin(25,h/2,8)+txt(44,h/2+5,'正在连接，连好再说',15,650)
  out+=f'<path d="M{w-68} 17V43" stroke="#9cb1d1"/>'+txt(w-36,h/2+5,'取消',13,600,INK,'middle')
 elif kind=='C':
  out=rect(0,4,w,h,18,'#111b451c')+f'<rect width="{w}" height="{h}" rx="18" fill="{PAPER}" fill-opacity=".94" stroke="#a6b4c8" stroke-width="1.3"/>'+rect(1.5,15,3,h-30,1.5,BLUE)
  for x,opacity in [(20,.35),(28,.65),(36,1)]:out+=f'<circle cx="{x}" cy="{h/2}" r="2.5" fill="{BLUE}" opacity="{opacity}"/>'
  out+=txt(49,29,'语音准备中',16,750)+txt(49,49,'接通后再开口',13,400,MUTED)+txt(w-35,h/2+5,'取消',14,600,INK,'middle')
 return w,h,out

def character(name,label,x,y,w=199,h=44,selected=False):
 fill=BLUE if selected else PAPER
 out=rect(x,y,w,h,12,fill,BLUE if selected else '#cbd0da',1.5)
 out+=f'<svg x="{x+1}" y="{y+1}" width="40" height="40" viewBox="0 0 40 40">{image(name,-20,-1,80)}</svg>'
 return out+txt(x+40+(w-40)/2,y+28,label,13,700,'white' if selected else INK,'middle')
def mobile(kind):
 out=rect(0,0,391,844,0,YELLOW)+logo(16,12,True)+txt(375,38,'结束本局',11,400,MUTED,'end')
 out+=txt(16,96,'空盒里的纪念章',20,800)+txt(375,94,'案件背景 ↗',10,400,MUTED,'end')
 for i,(name,label) in enumerate([('sunny','沈禾'),('coral','顾遥'),('blue','陈拓')]):out+=character(name,label,16,116+50*i,selected=i==0)
 out+=f'<svg x="227" y="116" width="148" height="168" viewBox="0 0 148 168"><ellipse cx="74" cy="88" rx="70" ry="74" fill="#fff1b6"/>{image("sunny",-24,5,196)}</svg>'
 out+=rect(16,296,359,414,22,PAPER,INK,2)+txt(30,328,'沈禾的询问记录',16,750)+f'<path d="M30 343H361" stroke="#111b4526"/>'+txt(30,373,'还没有对话，开口打个招呼吧。',15,400,MUTED)
 out+=rect(0,726,391,118,22,PAPER,INK,2)+rect(0,754,391,90,0,PAPER)+f'<path d="M1 754V844H390V754" stroke="{INK}" fill="none" stroke-width="2"/>'
 out+=txt(16,758,'剩余询问',10,400,MUTED)+txt(64,760,'08:00',24,850)+rect(277,738,98,34,12,PAPER,INK,2)+txt(326,760,'我有答案了 →',11,700,INK,'middle')
 out+=rect(16,783,128,47,13,INK)+rect(16,780,128,47,13,BLUE,INK,2)+txt(80,810,'取消连接',14,700,'white','middle')+txt(162,809,'正在连接',12,600,MUTED)
 w,h,body=card(kind,True);out+=f'<g transform="translate({(391-w)/2} {844*.55-h/2})">{body}</g>'
 return out

def desktop(kind):
 out=rect(0,0,1280,878,0,YELLOW)+logo(24,24)+txt(704,61,'空盒里的纪念章',30,800,anchor='middle')+txt(704,88,'案件背景 ↗',11,color=MUTED,anchor='middle')+txt(1256,58,'结束本局',13,color=MUTED,anchor='end')
 for i,(name,label) in enumerate([('sunny','沈禾'),('coral','顾遥'),('blue','陈拓')]):
  y=132+134*i;out+=rect(26,y,98,122,18,BLUE if i==0 else PAPER,BLUE if i==0 else '#cbd0da',1.5)
  out+=f'<svg x="27" y="{y+1}" width="96" height="83" viewBox="0 0 96 83">{image(name,-48,-3,192)}</svg>'+txt(75,y+106,label,14,750,'white' if i==0 else INK,'middle')
 out+=f'<svg x="148" y="129" width="527" height="581" viewBox="0 0 527 581"><ellipse cx="264" cy="315" rx="240" ry="242" fill="#fff1b6"/>{image("sunny",0,32,527)}</svg>'
 out+=rect(695,129,561,581,26,PAPER,INK,2)+txt(719,166,'沈禾的询问记录',20,750)+f'<path d="M719 190H1230" stroke="#111b4526"/>'+txt(719,220,'还没有对话，开口打个招呼吧。',16,400,MUTED)
 out+=rect(148,730,1108,124,24,PAPER,INK,2)+txt(168,777,'剩余询问',12,400,MUTED)+txt(168,808,'08:00',26,850)+rect(268,768,146,48,14,BLUE,INK,2)+txt(341,799,'取消连接',14,750,'white','middle')+txt(438,798,'正在连接',13,700,MUTED)+rect(1130,773,102,42,12,PAPER,INK,2)+txt(1181,800,'我有答案了 →',12,700,INK,'middle')
 w,h,body=card(kind,False);out+=f'<g transform="translate({(1280-w)/2} {878*.55-h/2})">{body}</g>'
 return out

for kind in ['A','B','C']:
 w,h,body=card(kind,True)
 (HERE/f'{kind.lower()}-card.svg').write_text(svg(w,h,body))
 (HERE/f'{kind.lower()}-mobile.svg').write_text(svg(391,844,mobile(kind)))
 (HERE/f'{kind.lower()}-desktop.svg').write_text(svg(1280,878,desktop(kind)))
board=rect(0,0,1280,1280,0,'#f4f1e7')+txt(32,50,'连接提示 · 三版浅色紧凑方案',28,800)+txt(32,82,'同一连接状态与位置，只比较文案、轻重与体积 · 全部待确认',15,color=MUTED)
labels={'A':('A  奶油色小卡 · 推荐','312 × 68px · 双行提示，层级清楚'),'B':('B  浅蓝紧凑条','328 × 60px · 单行信息，更扁平'),'C':('C  轻透浮层','296 × 72px · 三点等待，视觉最轻')}
for kind,x in [('A',32),('B',445),('C',858)]:
 title,desc=labels[kind];board+=txt(x,126,title,20,750)+txt(x,153,desc,13,color=MUTED)
 board+=f'<svg x="{x}" y="174" width="391" height="844" viewBox="0 0 391 844">{mobile(kind)}</svg>'
board+=txt(32,1065,'原移动端：359 × 83px 深色卡。三版均保留至少 44px 高的取消点击区。',15,600)
board+=txt(32,1101,'推荐 A：与询问记录同色，边框保持可见；短文案明确“还没连好”，体积更小。',15,color=MUTED)
board+=txt(32,1131,'A / B 为持续旋转圆环；C 为三点依次淡亮。减少动态时均保留静态等待标记。',14,color=MUTED)
board+=txt(32,1201,'待用户选定后再实现',16,750)+txt(32,1231,'静态设计上下文，不是实际浏览器功能验收；不改变计时、切人、取消或提示消失条件。',13,color=MUTED)
(HERE/'mobile-comparison.svg').write_text(svg(1280,1280,board))
board=rect(0,0,1280,1280,0,'#f4f1e7')+txt(32,50,'桌面上下文 · 与当前样式对照',28,800)+txt(32,82,'各窗为 1280 × 878px 布局的等比缩略图；独立 SVG 可按原尺寸查看。',15,color=MUTED)
for kind,x,y in [('current',32,139),('A',656,139),('B',32,685),('C',656,685)]:
 label='当前 · 深色 560 × 96px' if kind=='current' else {'A':'A · 奶油色 360 × 72px','B':'B · 浅蓝 380 × 60px','C':'C · 轻透 336 × 72px'}[kind]
 board+=txt(x,y-15,label,18,750)+f'<svg x="{x}" y="{y}" width="592" height="406.1" viewBox="0 0 1280 878">{desktop(kind)}</svg>'
 if kind=='current':board+=txt(x,y+436,'现有文案：正在连接语音 / 沈禾 · 连接成功后再说话',13,color=MUTED)
 else:board+=txt(x,y+436,{'A':'正在连接… / 连好后再说话','B':'正在连接，连好再说','C':'语音准备中 / 接通后再开口'}[kind],14,color=MUTED)
board+=txt(32,1205,'位置保留在视口高度约 55%，不增加遮罩、确认或自动消失计时。',15,600)
board+=txt(32,1235,'方案均待确认；头部采用当前品牌组合，未混入尚未批准的 Logo 改版。',13,color=MUTED)
(HERE/'desktop-comparison.svg').write_text(svg(1280,1280,board))

styles='''*{box-sizing:border-box}body{margin:0;background:#f4f1e7;color:#111b45;font:16px/1.6 system-ui,-apple-system,'PingFang SC',sans-serif}main{max-width:1280px;padding:24px;margin:auto}h1{font-size:26px}.grid{display:flex;flex-wrap:wrap;gap:24px}.sample{padding:20px;background:#fff18a;border-radius:20px}.card{display:flex;align-items:center;gap:10px;color:#111b45}.copy{min-width:0;flex:1}.copy strong{display:block;font-size:18px;line-height:25px}.copy small{display:block;font-size:13px;color:#52607a;line-height:18px}.card button{flex:none;min-height:44px;min-width:48px;color:inherit;background:transparent;font:600 14px system-ui;cursor:pointer}.ring{flex:none;width:18px;height:18px;border:2px solid #075bfa2e;border-top-color:#075bfa;border-right-color:#075bfa;border-radius:50%;animation:spin 1.1s linear infinite}.a{width:312px;min-height:68px;padding:10px 12px;border:2px solid #111b45;background:#fffef7;border-radius:16px;box-shadow:0 3px #111b451c}.a button{border:1.5px solid #9ba6bb;border-radius:12px}.b{width:328px;min-height:60px;padding:6px 12px;border:1.5px solid #96b4e3;background:#eaf2ff;border-radius:30px}.b .copy{font-size:15px;font-weight:650;white-space:nowrap}.b button{border:0;border-left:1px solid #9cb1d1;border-radius:0}.c{position:relative;width:296px;min-height:72px;padding:12px 10px;background:#fffef7f0;border:1.3px solid #a6b4c8;border-radius:18px;box-shadow:0 4px #111b451c}.c:before{content:'';position:absolute;left:0;top:15px;bottom:15px;width:3px;background:#075bfa;border-radius:2px}.c .copy strong{font-size:16px}.c button{border:0}.dots{display:flex;gap:3px;padding-left:5px}.dots i{width:5px;height:5px;border-radius:50%;background:#075bfa;animation:wait 1.2s ease-in-out infinite}.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}@keyframes spin{to{transform:rotate(1turn)}}@keyframes wait{0%,80%,100%{opacity:.35}40%{opacity:1}}@media(prefers-reduced-motion:reduce){.ring,.dots i{animation:none}.dots i{opacity:.7}}button:focus-visible{outline:3px solid #075bfa;outline-offset:3px}'''
html=f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>连接提示三版设计 · 待确认</title><style>{styles}</style><main><h1>三版连接提示 · 待确认</h1><p>仅为动效与排版设计；没有真实连接状态，取消按钮不执行语音操作。</p><div class="grid">
<section class="sample"><h2>A · 奶油色（推荐）</h2><div class="card a" role="status"><span class="ring" aria-hidden="true"></span><div class="copy"><strong>正在连接…</strong><small>连好后再说话</small></div><button type="button" aria-label="取消连接">取消</button></div></section>
<section class="sample"><h2>B · 浅蓝紧凑条</h2><div class="card b" role="status"><span class="ring" aria-hidden="true"></span><span class="copy">正在连接，连好再说</span><button type="button" aria-label="取消连接">取消</button></div></section>
<section class="sample"><h2>C · 轻透浮层</h2><div class="card c" role="status"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><div class="copy"><strong>语音准备中</strong><small>接通后再开口</small></div><button type="button" aria-label="取消连接">取消</button></div></section></div><p>上下文与尺寸见 mobile-comparison.svg / desktop-comparison.svg。系统减少动态设置会停止装饰动画。</p></main></html>'''
(HERE/'preview.html').write_text(html)
(HERE/'options.json').write_text(json.dumps({'status':'A-approved-for-implementation','approval':'2026-10-25: 我看过了，我觉得奶油色小卡最合适，按这个设计做吧','recommended':'A','sizes':SIZES,'copy':{'A':['正在连接…','连好后再说话'],'B':['正在连接，连好再说'],'C':['语音准备中','接通后再开口']},'cancelMinimumTargetHeight':44,'placementViewportHeightRatio':.55},ensure_ascii=False,indent=2)+'\n')
