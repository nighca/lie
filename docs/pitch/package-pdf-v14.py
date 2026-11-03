"""Package the reviewed slide renders as PDF only, per user delivery preference."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
root=Path.cwd(); build=root/'tmp/pitch/revision-14/build'; out=root/'tmp/pitch/revision-14/output'
entries=json.loads((build/'entries.json').read_text());out.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(out/'LIE-roadshow-v14.pdf'),pagesize=(960,540))
c.setTitle('LIE 中文路演');c.setAuthor('LIE')
for n in range(1,len(entries)+1):
    c.drawImage(ImageReader(str(out/f'slide-{n:02}.png')),0,0,960,540)
    if n==15:c.linkURL('https://lie.agency/',(38,105,900,195),relative=0)
    c.showPage()
c.save()
print(f'PDF only: {len(entries)} pages, {(out/"LIE-roadshow-v14.pdf").stat().st_size} bytes')
