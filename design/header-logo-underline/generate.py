from pathlib import Path
from html import escape
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
logo = (ROOT / 'apps/web/public/brand/logo.svg').read_text()
underline = (ROOT / 'apps/web/public/brand/underline.svg').read_text()
def inner(svg):
    return re.sub(r'</svg>\s*$', '', re.sub(r'^<svg\b[^>]*>', '', svg.strip()))
LOGO, LINE = inner(logo), inner(underline)
INK, YELLOW, PAPER, MUTED = '#111b45', '#fff18a', '#fffef7', '#52607a'
FONT = "system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif"
def text(x, y, content, size=16, weight=400, color=INK, anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{escape(content)}</text>'
def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><g font-family="{FONT}">{body}</g></svg>'
def logo_at(x=0, y=0, w=105, h=56):
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="0 0 440 235">{LOGO}</svg>'
def line_at(x, y, w, h):
    return f'<g transform="rotate(-5 {x+w/2} {y+h/2})"><svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="0 0 100 12" preserveAspectRatio="none">{LINE}</svg></g>'
MARK = logo_at() + line_at(4.5, 52, 96, 9)
def mark_at(x, y, w=105):
    return f'<svg x="{x}" y="{y}" width="{w}" height="{w*68/105}" viewBox="0 0 105 68">{MARK}</svg>'
def current_at(x, y):
    # Current visual arrangement; source shapes and system font remain unchanged.
    return f'<g transform="translate({x} {y}) scale(2)">{logo_at()}{line_at(119,34,80,10)}{text(121,34,"语音推理",18,800)}</g>'
def desktop():
    return f'<rect width="1280" height="220" rx="20" fill="{YELLOW}"/>' + mark_at(24,26) + text(668,57,'空盒里的纪念章',30,800,anchor='middle') + text(668,82,'案件背景 ↗',11,color=MUTED,anchor='middle') + text(1256,57,'结束本局',13,color=MUTED,anchor='end') + f'<rect x="695" y="126" width="561" height="94" rx="24" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>' + text(719,164,'沈禾的询问记录',18,700)
def mobile():
    return f'<rect width="391" height="208" rx="18" fill="{YELLOW}"/>' + mark_at(16,16,88) + text(375,40,'结束本局',11,color=MUTED,anchor='end') + text(16,111,'空盒里的纪念章',20,800) + text(375,110,'案件背景 ↗',10,color=MUTED,anchor='end')
(HERE/'brand-mark.svg').write_text(svg(105,68,MARK))
(HERE/'desktop-context.svg').write_text(svg(1280,220,desktop()))
(HERE/'mobile-context.svg').write_text(svg(391,208,mobile()))
board = f'<rect width="1280" height="1280" fill="#f4f1e7"/>'
board += text(32,53,'头部品牌 · 下划线位置调整',28,800)
board += text(32,84,'推荐稿 · 保留原 Logo、配色与手绘笔触',15,color=MUTED)
for x in (32,656):
    board += f'<rect x="{x}" y="112" width="592" height="296" rx="24" fill="{YELLOW}" stroke="{INK}" stroke-opacity=".16"/>'
board += text(56,149,'当前',14,600,color=MUTED)
board += text(680,149,'推荐',14,700)
board += current_at(126,201)
board += mark_at(847,184,210)
board += text(56,379,'Logo 与文字横向组合',14,color=MUTED)
board += text(680,379,'移除右侧文字，下划线贴近 Logo 底部',14,color=MUTED)
board += text(32,453,'放回桌面头部',20,700)
board += f'<svg x="32" y="477" width="1216" height="209" viewBox="0 0 1280 220">{desktop()}</svg>'
board += text(32,735,'窄屏头部',20,700)
board += f'<svg x="32" y="759" width="391" height="208" viewBox="0 0 391 208">{mobile()}</svg>'
board += text(488,793,'同一组合，随原 Logo 尺寸缩放',20,700)
board += mark_at(488,833,315)
board += text(853,870,'原 Logo 图形与比例保留',16,600)
board += text(853,905,'下划线约为 Logo 宽度的 91%',14,color=MUTED)
board += text(853,934,'保持左低右高，收尾略微伸出',14,color=MUTED)
board += text(853,963,'紧贴字形底部，留出轻微空隙',14,color=MUTED)
board += text(32,1033,'尺寸建议',16,700)
board += text(32,1065,'桌面：105 × 68px 组合框；窄屏：88 × 57px 组合框。',14,color=MUTED)
board += text(32,1093,'Logo 字形本身保持现有大小；增加的高度用于容纳下划线。',14,color=MUTED)
board += text(32,1190,'设计效果图 · 待用户确认',16,700)
board += text(32,1221,'头部上下文为静态矢量排版，尚未修改正式组件或上线。',14,color=MUTED)
(HERE/'recommendation.svg').write_text(svg(1280,1280,board))
html = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>LiE 头部品牌设计 · 待确认</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f4f1e7;color:{INK};font:16px/1.6 {FONT}}}main{{max-width:1280px;padding:24px;margin:auto}}h1{{font-size:26px}}.sample{{background:{YELLOW};padding:24px;border-radius:20px}}header{{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:86px}}.brand{{display:block;flex:none;width:105px;height:68px}}.title{{margin:0;text-align:center;font-size:30px;font-weight:800}}small{{display:block;color:{MUTED};font-size:11px;font-weight:400}}button{{border:0;background:transparent;color:{MUTED};font:inherit;white-space:nowrap}}.brand svg{{display:block;width:100%;height:100%}}p{{color:{MUTED}}}@media(max-width:700px){{main{{padding:16px}}.sample{{padding:16px}}header{{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px}}.brand{{width:88px;height:57px}}.title{{grid-row:2;grid-column:1/-1;text-align:left;font-size:20px}}}}
</style><main><h1>头部品牌推荐稿</h1><p>静态设计预览，待用户确认。</p><section class="sample"><header><a class="brand" aria-label="LiE 首页">{svg(105,68,MARK)}</a><h2 class="title">空盒里的纪念章<small>案件背景 ↗</small></h2><button>结束本局</button></header></section><p>使用现有矢量图形与系统字体；本文件不连接服务、不读写草稿。</p></main></html>'''
(HERE/'preview.html').write_text(html)
