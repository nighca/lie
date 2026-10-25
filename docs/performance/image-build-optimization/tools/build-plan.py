#!/usr/bin/env python3
"""Build-plan experiment only. No writes to source/public/build; does not bypass runtime PNG guards."""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--candidates',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
def sha(b):return hashlib.sha256(b).hexdigest()
def js(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
source=a.root/'design/character-presets';m=json.loads((a.candidates/'measurement.json').read_text());lookup={alias:r for r in m['rows'] for alias in r['aliases']};inputs={};source_hashes={}
for rec in m['inventory']:
 b=(source/'assets'/rec['path']).read_bytes();assert sha(b)==rec['sha256'];source_hashes[rec['path']]=sha(b);v=lookup[rec['path']]['variants']['webp-exact-m4'];candidate=(a.candidates/v['file']).read_bytes();assert sha(candidate)==v['sha256'];assert v['rgbaEqual'] and v['alphaEqual'] and v['sizeEqual']
 inputs['appearances/'+rec['path']]=(rec['path'][:-4]+'.webp',candidate) if len(candidate)<len(b) else (rec['path'],b)
outputs={};urls={};animations={};part_count=0
for raw in json.loads((source/'manifest.json').read_text()):
 id=raw['id'];animation=raw.get('animation')
 if animation is None:continue
 pkg=json.loads((source/animation).read_text());local={}
 for asset in pkg['assets'].values():
  original=f"appearances/{id}/animation/{asset['src']}";path,b=inputs[original];relative=path[len(id+'/animation/'):];assert relative.startswith('parts/') and '..' not in relative;asset['src']=relative;local[f'appearances/{path}']=b;part_count+=1
 packagePath=f'appearances/{id}/animation/package.json';local[packagePath]=js(pkg);h=hashlib.sha256()
 for path,b in sorted(local.items()):h.update(f'{path}\0{len(b)}\0'.encode());h.update(b)
 digest=h.hexdigest();animations[id]={'digest':digest,'package':pkg,'entries':{p:{'bytes':len(b),'sha256':sha(b)} for p,b in local.items()}}
 for path,b in local.items():outputs[f'/static/{digest}/{path}']=b
 urls[f'/{packagePath}']=f'/static/{digest}/{packagePath}'
for original,(path,b) in inputs.items():
 if '/animation/' in original:continue
 url=f'/static/{sha(b)}/appearances/{path}';outputs[url]=b;urls['/'+original]=url
manifest=[]
for raw in json.loads((source/'manifest.json').read_text()):
 item={k:v for k,v in raw.items() if k not in ['avatar','portrait','portraits','animation']}
 for k in ['avatar','portrait','animation']:
  if k in raw:item[k]=urls['/appearances/'+raw[k].removeprefix('assets/')]
 item['portraits']={state:urls['/appearances/'+path.removeprefix('assets/')] for state,path in raw['portraits'].items()};manifest.append(item)
b=js(manifest);manifestUrl=f'/static/{sha(b)}/appearances/manifest.json';outputs[manifestUrl]=b
assert len(manifest)==8 and part_count==46 and len(outputs)==90
for item in manifest:
 for k in ['avatar','portrait','animation']:assert item[k] in outputs
 for url in item['portraits'].values():assert url in outputs
for id,data in animations.items():
 prefix=f"/static/{data['digest']}/appearances/{id}/animation/"
 for asset in data['package']['assets'].values():assert prefix+asset['src'] in outputs
for path,h in source_hashes.items():assert sha((source/'assets'/path).read_bytes())==h
result={'status':'dry-run-only; current production PNG-only validator/loader cannot consume this plan until coordinated change','base':m['base'],'manifestUrl':manifestUrl,'manifest':manifest,'animations':animations,'outputs':{url:{'bytes':len(b),'sha256':sha(b)} for url,b in sorted(outputs.items())},'checks':{'source81Unchanged':True,'source81CandidateHashes':True,'allManifestTargetsExist':True,'eightPackages46LocalPartsExist':True,'allFinalBytesHashedAfterRewrite':True,'runtimeDecoderTested':False},'note':'JSON serialization differs from production; these are candidate plan hashes, not promised deployment URLs. Brand assets excluded.'};a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(f'{len(outputs)} outputs, 8 packages, {part_count} parts, manifest {manifestUrl}')
