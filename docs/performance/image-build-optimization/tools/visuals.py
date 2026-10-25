import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--candidates',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();src=a.root/'design/character-presets/assets';out=a.out;out.mkdir(exist_ok=True);m=json.loads((a.candidates/'measurement.json').read_text());lookup={a:r for r in m['rows'] for a in r['aliases']}
font=ImageFont.load_default(size=15);small=ImageFont.load_default(size=12)
cols=['Source PNG','WebP lossless EXACT','WebP lossy q95','WebP lossy q90'];variants=[None,'webp-exact-m4','webp-q95','webp-q90'];W=1360;H=1550;sheet=Image.new('RGB',(W,H),'#e9e9ed');d=ImageDraw.Draw(sheet);d.text((20,10),'LIE / build image experiment / no resizing of encoded assets',font=font,fill='black');d.text((20,32),'Only this preview scales whole figures; detail crops shown at native 1 image pixel = 1 preview pixel.',font=small,fill='black')
for c,name in enumerate(cols):d.text((c*340+20,62),name,font=font,fill='black')
rows=[('Coral whole (display preview)', 'coral-bob/default.png',None,'checker',100,350),('Coral face / native detail','coral-bob/default.png',(450,100,750,300),'white',460,230),('Silver head / native detail','silver-bun/animation/parts/head.png',(470,340,770,540),'white',730,230),('Coral alpha edge / native detail','coral-bob/default.png',(290,370,590,570),'dark',1000,230),('Coral same edge / checker','coral-bob/default.png',(290,370,590,570),'checker',1270,230)]
for label,path,crop,bg,y,h in rows:
 d.text((20,y-22),label,font=font,fill='black');row=lookup[path]
 for c,v in enumerate(variants):
  im=Image.open(src/path if v is None else a.candidates/row['variants'][v]['file']).convert('RGBA')
  if crop:im=im.crop(crop)
  else:im.thumbnail((300,300),Image.Resampling.LANCZOS)
  tile=Image.new('RGB',(320,h),'white' if bg=='white' else '#182435');td=ImageDraw.Draw(tile)
  if bg=='checker':
   for x in range(0,320,16):
    for yy in range(0,h,16):td.rectangle((x,yy,x+15,yy+15),fill='#dedee5' if (x//16+yy//16)%2 else '#ffffff')
  tile.paste(im,((320-im.width)//2,0),im);sheet.paste(tile,(c*340+10,y))
  if crop is None:
   size=(src/path).stat().st_size if v is None else row['variants'][v]['bytes'];d.text((c*340+20,y+310),f'{size:,} bytes',font=small,fill='black')
sheet.save(out/'comparison.png',optimize=True)
# Native transparent candidates retained as files for direct browser/desktop visual comparison.
for path in ['coral-bob/default.png','silver-bun/animation/parts/head.png']:
 row=lookup[path]
 for v in ['webp-exact-m4','webp-q95','webp-q90']:
  b=(a.candidates/row['variants'][v]['file']).read_bytes();(out/(path.split('/')[0]+'-'+v+'.webp')).write_bytes(b)
