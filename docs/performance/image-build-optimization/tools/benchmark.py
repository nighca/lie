#!/usr/bin/env python3
"""Offline corpus benchmark; canonical sources are read-only. Requires Pillow + cwebp."""
import argparse, hashlib, io, json, os, platform, resource, struct, subprocess, time, zlib
from pathlib import Path
from PIL import Image, ImageChops, ImageStat, __version__ as pillow_version
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--full',action='store_true');a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
root=a.root/'design/character-presets/assets'; paths=sorted(root.rglob('*.png')); groups={}; inventory=[]
assert not a.out.resolve().is_relative_to((a.root/'design').resolve()), 'Output must not modify canonical assets'
assert len(paths)<=128 and sum(p.stat().st_size for p in paths)<=128*1024*1024, 'Corpus budget exceeded'
def sha(b): return hashlib.sha256(b).hexdigest()
def chunks(b):
 out=[]; pos=8
 while pos<len(b):
  n=struct.unpack('>I',b[pos:pos+4])[0]; t=b[pos+4:pos+8]; v=b[pos+8:pos+8+n]; crc=struct.unpack('>I',b[pos+8+n:pos+12+n])[0]
  assert zlib.crc32(t+v)&0xffffffff==crc
  out.append({'type':t.decode(),'bytes':n,'sha256':sha(v)});pos+=n+12
 assert pos==len(b);return out
for path in paths:
 b=path.read_bytes();assert len(b)<=16*1024*1024 and b[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',b[16:24]);assert w*h<=32*1024*1024;im=Image.open(io.BytesIO(b)).convert('RGBA'); alpha=im.getchannel('A'); hist=alpha.histogram(); c=chunks(b); rec={'path':str(path.relative_to(root)),'sha256':sha(b),'bytes':len(b),'size':list(im.size),'mode':Image.open(io.BytesIO(b)).mode,'chunks':c,'rgbaSha256':sha(im.tobytes()),'alphaSha256':sha(alpha.tobytes()),'transparentPixels':hist[0],'partialAlphaPixels':sum(hist[1:255])};inventory.append(rec);groups.setdefault(sha(b),[]).append(rec)
selected=['coral-bob/default.png','silver-bun/default.png','coral-bob/avatar.png','coral-bob/animation/parts/fore-right.png','silver-bun/animation/parts/head.png']
items=list(groups.values()) if a.full else list({next(r['sha256'] for r in inventory if r['path']==s):groups[next(r['sha256'] for r in inventory if r['path']==s)] for s in selected}.values())
rows=[];wall=time.monotonic();start=resource.getrusage(resource.RUSAGE_SELF);child=resource.getrusage(resource.RUSAGE_CHILDREN)
for i,g in enumerate(items):
 assert time.monotonic()-wall<180, 'Batch time budget exceeded'
 rec=g[0];path=root/rec['path'];im=Image.open(path).convert('RGBA'); raw=im.tobytes(); row={'source':rec['path'],'aliases':[r['path'] for r in g],'sha256':rec['sha256'],'sourceBytes':rec['bytes'],'variants':{}}
 variants={'png-optimize':None,'webp-exact-m4':['-lossless','-exact','-m','4','-q','75','-metadata','icc']}
 if not a.full: variants.update({'webp-exact-m6':['-lossless','-exact','-m','6','-q','100','-metadata','icc'],'webp-q95':['-q','95','-m','6','-alpha_q','100','-metadata','icc'],'webp-q90':['-q','90','-m','6','-alpha_q','100','-metadata','icc']})
 for name,flags in variants.items():
  suffix='.png' if flags is None else '.webp';out=a.out/(rec['sha256'][:16]+'-'+name+suffix);t=time.monotonic();cpu0=resource.getrusage(resource.RUSAGE_SELF if flags is None else resource.RUSAGE_CHILDREN)
  if flags is None:
   opts={'optimize':True,'compress_level':9}
   profile=Image.open(path).info.get('icc_profile')
   if profile: opts['icc_profile']=profile
   im.save(out,**opts)
  else: subprocess.run(['cwebp','-quiet',*flags,str(path),'-o',str(out)],check=True,timeout=90)
  cpu1=resource.getrusage(resource.RUSAGE_SELF if flags is None else resource.RUSAGE_CHILDREN);elapsed=time.monotonic()-t;dec=Image.open(out).convert('RGBA');d=ImageChops.difference(im,dec);alpha_equal=im.getchannel('A').tobytes()==dec.getchannel('A').tobytes();rgbdiff=0;visible=0;maxdiff=0;changed=0
  if dec.tobytes()!=raw:
   for src,dst in zip(im.getdata(),dec.getdata()):
    if src[3]:
     diffs=[abs(src[k]-dst[k]) for k in range(3)];rgbdiff+=sum(diffs);visible+=3;maxdiff=max(maxdiff,*diffs);changed+=int(any(diffs))
  row['variants'][name]={'bytes':out.stat().st_size,'sha256':sha(out.read_bytes()),'wallSeconds':elapsed,'cpuSeconds':cpu1.ru_utime+cpu1.ru_stime-cpu0.ru_utime-cpu0.ru_stime,'rgbaEqual':raw==dec.tobytes(),'alphaEqual':alpha_equal,'sizeEqual':im.size==dec.size,'visibleChangedPixels':changed,'visibleRgbMAE':rgbdiff/max(visible,1),'visibleMaxChannelError':maxdiff,'file':out.name}
  assert im.size==dec.size and alpha_equal
  if name in ['png-optimize','webp-exact-m4','webp-exact-m6']: assert raw==dec.tobytes(),(path,name)
 rows.append(row);print(f'{i+1}/{len(items)} {rec["path"]} '+str({k:v['bytes'] for k,v in row['variants'].items()}),flush=True)
result={'base':subprocess.check_output(['git','rev-parse','HEAD'],cwd=a.root,text=True).strip(),'platform':platform.platform(),'python':platform.python_version(),'pillow':pillow_version,'cwebp':subprocess.check_output(['cwebp','-version'],text=True).strip(),'mode':'full' if a.full else 'sample','inventory':inventory,'uniqueCount':len(groups),'rows':rows,'wallSeconds':time.monotonic()-wall};(a.out/'measurement.json').write_text(json.dumps(result,indent=2)+'\n')
