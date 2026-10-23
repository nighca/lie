from pathlib import Path

BASE = Path(__file__).parent
INK = '#111B45'
BLUE = '#075BFA'
YELLOW = '#FFF18A'
CORAL = '#FF665B'
AQUA = '#78DDD7'
WHITE = '#FFFEF7'

def svg(body, title, box='0 0 480 180'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'

def letters(x=0,y=0,scale=1,color=INK):
    return f'<g transform="translate({x} {y}) scale({scale})" fill="none" stroke="{color}" stroke-width="23" stroke-linejoin="round" stroke-linecap="round"><path d="M15 15v83h59M111 15v83M164 15v83h61M164 15h61M164 57h49"/></g>'

for name in ['a-talking-type','b-double-bubble','c-talk-buddy','d-tilted-blocks']:
    (BASE/name).mkdir(exist_ok=True)

# A: broad rounded letters, the i dot carries a tiny friendly face.
a_icon=f'<rect x="8" y="8" width="112" height="112" rx="38" fill="{CORAL}"/><circle cx="49" cy="41" r="5" fill="{INK}"/><circle cx="79" cy="41" r="5" fill="{INK}"/><path d="M48 57q16 12 32 0" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/><path d="M64 82v19" stroke="{INK}" stroke-width="16" stroke-linecap="round"/>'
a=f'<g transform="rotate(-3 230 90)"><path d="M45 42v96h84" fill="none" stroke="{INK}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/><rect x="174" y="68" width="40" height="88" rx="20" fill="{BLUE}"/><rect x="164" y="6" width="60" height="46" rx="23" fill="{CORAL}"/><circle cx="184" cy="24" r="4" fill="{INK}"/><circle cx="204" cy="24" r="4" fill="{INK}"/><path d="M184 35q10 8 20 0" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><path d="M364 43h-88v95h88M276 90h69" fill="none" stroke="{INK}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path d="M416 55l11-16M425 79l19-4" fill="none" stroke="{BLUE}" stroke-width="9" stroke-linecap="round"/></g>'
(BASE/'a-talking-type/logo.svg').write_text(svg(a,'A 会说话的字标'))
(BASE/'a-talking-type/icon.svg').write_text(svg(a_icon,'A 小尺寸图标','0 0 128 128'))
# Monochrome retains eye/mouth cutouts on the dot.
a_mono=a.replace(BLUE,INK).replace(CORAL,INK).replace(f'cx="184" cy="24" r="4" fill="{INK}"',f'cx="184" cy="24" r="4" fill="{WHITE}"').replace(f'cx="204" cy="24" r="4" fill="{INK}"',f'cx="204" cy="24" r="4" fill="{WHITE}"').replace('M184 35q10 8 20 0" fill="none" stroke="'+INK,'M184 35q10 8 20 0" fill="none" stroke="'+WHITE)
(BASE/'a-talking-type/mono.svg').write_text(svg(a_mono,'A 单色字标'))

# B: dialogue, two voices whose bubbles face each other.
b_icon=f'<path d="M27 18h55q18 0 18 18v24q0 18-18 18H51L29 97V78H27Q9 78 9 60V36q0-18 18-18Z" fill="{YELLOW}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/><path d="M73 49h26q20 0 20 20v22q0 18-18 18h-1v13l-20-13H68q-18 0-18-18V69q0-20 23-20Z" fill="{BLUE}" stroke="{INK}" stroke-width="7" stroke-linejoin="round"/><circle cx="74" cy="79" r="4" fill="{WHITE}"/><circle cx="96" cy="79" r="4" fill="{WHITE}"/>'
b=f'<g transform="translate(6 14) scale(1.13)">{b_icon}</g>'+letters(201,38,.98)
(BASE/'b-double-bubble/logo.svg').write_text(svg(b,'B 对话碰碰'))
(BASE/'b-double-bubble/icon.svg').write_text(svg(b_icon,'B 小尺寸图标','0 0 128 128'))
# Outline the rear bubble in mono so the overlapping voices remain distinct.
b_mono=b.replace(YELLOW,WHITE).replace(BLUE,INK)
(BASE/'b-double-bubble/mono.svg').write_text(svg(b_mono,'B 单色字标'))

# C: an original round speech creature; its tail is a speech-bubble tail, not an animal.
c_icon=f'<path d="M29 21Q64 3 99 21q21 13 18 48-2 30-32 36H65l-21 18 1-21Q13 98 10 69 6 36 29 21Z" fill="{YELLOW}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/><ellipse cx="43" cy="57" rx="8" ry="12" fill="{INK}"/><ellipse cx="85" cy="57" rx="8" ry="12" fill="{INK}"/><path d="M48 81q16 14 32 0" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/><path d="M24 29l-8-10M104 29l9-11" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>'
c=f'<g transform="translate(8 10) scale(1.14)">{c_icon}</g>'+letters(204,38,.98,BLUE)
(BASE/'c-talk-buddy/logo.svg').write_text(svg(c,'C 小话团'))
(BASE/'c-talk-buddy/icon.svg').write_text(svg(c_icon,'C 小尺寸图标','0 0 128 128'))
c_mono=c.replace(YELLOW,WHITE).replace(BLUE,INK)
(BASE/'c-talk-buddy/mono.svg').write_text(svg(c_mono,'C 单色字标'))

# D: three independently tilted tile letters, enough separation for one-color use.
def block(x,y,rotation,color,kind,mono=False):
    foreground=WHITE if mono or color==BLUE else INK
    bg=INK if mono else color
    glyph={'L':'M32 30v65h45','I':'M54 30v65','E':'M80 30H30v65h50M30 62h40'}[kind]
    return f'<g transform="translate({x} {y}) rotate({rotation} 54 62)"><rect x="4" y="8" width="108" height="126" rx="23" fill="{INK}"/><rect width="108" height="126" rx="23" fill="{bg}" stroke="{INK}" stroke-width="7"/><path d="{glyph}" fill="none" stroke="{foreground}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/></g>'
d=block(36,19,-9,YELLOW,'L')+block(184,22,7,BLUE,'I')+block(326,16,-5,AQUA,'E')
dmono=block(36,19,-9,YELLOW,'L',True)+block(184,22,7,BLUE,'I',True)+block(326,16,-5,AQUA,'E',True)
dicon=f'<g transform="translate(9 7) rotate(-7 54 54)"><rect x="4" y="6" width="102" height="102" rx="25" fill="{INK}"/><rect width="102" height="102" rx="25" fill="{BLUE}" stroke="{INK}" stroke-width="7"/><path d="M30 22v58h44" fill="none" stroke="{WHITE}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></g>'
(BASE/'d-tilted-blocks/logo.svg').write_text(svg(d,'D 字母碰碰乐'))
(BASE/'d-tilted-blocks/icon.svg').write_text(svg(dicon,'D 小尺寸图标','0 0 128 128'))
(BASE/'d-tilted-blocks/mono.svg').write_text(svg(dmono,'D 单色字标'))
