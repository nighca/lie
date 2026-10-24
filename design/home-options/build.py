from pathlib import Path
out=Path(__file__).parent
people=''.join(f'<span class="figure {name}"><img src="../appearances/assets/{name}.png" alt=""></span>' for name in ['sunny-moustache','coral-bob','blue-glasses'])
for option in ['a','b']:
 for count in [1,2]:
  first=f'''<article class="case available"><div class="cover"><div class="cover-orbit"></div>{people}<span class="case-number">01</span></div><div class="case-info"><h2>空盒里的纪念章</h2><p>摄影社合影前，一枚纪念章不见了。和三位同伴聊聊，找出谁拿走了它。</p><div class="case-footer"><span class="time">08:00 询问时间</span><button>查看案件 <span>→</span></button></div></div></article>'''
  second='''<article class="case pending"><div class="cover"><div class="stage-disc">？</div><i class="curtain left"></i><i class="curtain right"></i><span class="case-number">02</span></div><div class="case-info"><h2>压轴怎么是鸭叫</h2><p>木偶剧谢幕，压轴曲却变成了鸭叫。四个人，谁动了这段声音？</p><div class="case-footer"><span class="pending-label">筹备中 · 设计占位，未上线</span></div></div></article>''' if count==2 else ''
  introduction=f'<section class="introduction"><h1>有人，<br>有话没说完。</h1><p>和故事里的人物语音对话，<br>作出你的指认。</p><div class="invitation"><div class="hello-blob"></div>{people}</div></section>' if option=='a' else '<section class="introduction"><h1>挑一桩故事，开口问。</h1><p>和故事里的人物语音对话，作出你的指认。</p></section>'
  html=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>首页候选{option.upper()} · {count}案</title><link rel="stylesheet" href="home.css"></head><body class="option-{option} count-{count}"><div class="app"><header class="site-header"><div class="brand"><img src="../brand/logo.svg" alt="LIE"><span>语音推理</span></div></header><main>{introduction}<section class="cases" aria-label="可选案件">{first}{second}</section></main></div></body></html>'''
  (out/f'{option}-{count}.html').write_text(html)
