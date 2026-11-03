"""Render an unmodified built-in JSON source viewport; no browser screenshot claim."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import re,hashlib,json
root=Path.cwd(); source=root/'content/games/01-empty-medal-box.json'
raw=source.read_text(); W,H=1760,644
im=Image.new('RGB',(W,H),'#F8F9FD');d=ImageDraw.Draw(im)
f=ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc',24)
small=ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc',21)
d.rectangle((0,0,W-1,H-1),outline='#C3CAE0',width=2)
d.rectangle((1,1,W-2,57),fill='#E6EAFF')
d.text((30,14),'content/games/01-empty-medal-box.json',font=f,fill='#111B45')
y=82; first=True
for num,line in enumerate(raw.splitlines(),1):
    if y>=H:break
    tokens=re.split(r'("(?:\\.|[^"\\])*")',line)
    x=92;d.text((24,y),str(num).rjust(2),font=small,fill='#8792AA')
    for token in tokens:
        if not token:continue
        color='#075BFA' if re.fullmatch(r'"[A-Za-z][A-Za-z0-9]*"',token) else '#111B45'
        for ch in token:
            w=d.textlength(ch,font=f)
            if x+w>W-35:x=92;y+=35
            if y>=H:break
            d.text((x,y),ch,font=f,fill=color);x+=w
        if y>=H:break
    y+=35
out=root/'docs/pitch/evidence/revision-11/builtin-game-json.png';im.save(out)
meta={'source':'content/games/01-empty-medal-box.json','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'render':'original source with visual line wrapping and viewport crop; no rewritten fields','imageSha256':hashlib.sha256(out.read_bytes()).hexdigest()}
(root/'docs/pitch/evidence/revision-11/json-source.json').write_text(json.dumps(meta,indent=2))
