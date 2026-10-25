import subprocess,json,pathlib,hashlib,io,math,posixpath
from collections import defaultdict
from PIL import Image,ImageChops
S='d3d71a70cb95005e3e9f63c1c40aa8ee82c20dca';M=subprocess.check_output(['git','rev-parse','main']).decode().strip();P='docs/performance/image-build-optimization/';D=pathlib.Path('/Users/nighca/.codex/worktrees/image-q90-build/lie/apps/web/dist')
def blob(p,ref=S):return subprocess.check_output(['git','show',ref+':'+p])
def sha(b):return hashlib.sha256(b).hexdigest()
jsonpaths=subprocess.check_output(['git','ls-tree','-r','--name-only',S,P]).decode().splitlines();names=['measurement-q90.json','native-cold-81.json','native-warm-81.json','summary-q90.json','built-identity.json']+[p.removeprefix(P) for p in jsonpaths if '/browser/' in p and p.endswith('.json')]
J={n:json.loads(blob(P+n)) for n in names};m=J['measurement-q90.json'];summary=J['summary-q90.json'];identity=J['built-identity.json'];cold=J['native-cold-81.json'];warm=J['native-warm-81.json'];inv={r['path']:r for r in m['inventory']};groups=defaultdict(list);images={}
assert len(inv)==81
for p,r in inv.items():
 b=blob('design/character-presets/assets/'+p);assert b==blob('design/character-presets/assets/'+p,M);assert sha(b)==r['sha256'] and len(b)==r['bytes'];im=Image.open(io.BytesIO(b)).convert('RGBA');assert list(im.size)==r['size'] and sha(im.tobytes())==r['rgbaSha256'];a=im.getchannel('A');assert sha(a.tobytes())==r['alphaSha256'];h=a.histogram();assert h[0]==r['transparentPixels'] and sum(h[1:255])==r['partialAlphaPixels'];groups[r['sha256']].append(p);images[p]=im
assert len(groups)==m['uniqueCount']==len(m['rows'])==50
lookup={}
for row in m['rows']:
 assert row['aliases']==groups[row['sha256']] and inv[row['source']]['bytes']==row['sourceBytes'];assert set(row['variants'])=={'webp-q90'}
 v=row['variants']['webp-q90'];assert v['alphaEqual'] is True and v['sizeEqual'] is True and v['rgbaEqual'] is False
 for p in row['aliases']:assert p not in lookup;lookup[p]=v
for k,r in summary.items():
 if k=='cost':continue
 assert len(set(r['paths']))==len(r['paths']);src=sum(inv[p]['bytes'] for p in r['paths']);out=sum(lookup[p]['bytes'] for p in r['paths']);assert (src,out)==(r['sourceBytes'],r['q90Bytes']);assert abs(r['savingPercent']-(1-out/src)*100)<1e-10
assert set(summary['all81']['paths'])==set(inv);assert len(summary['unique50']['paths'])==50 and len({inv[p]['sha256'] for p in summary['unique50']['paths']})==50
assert abs(summary['cost']['encodeWallSeconds']-sum(r['variants']['webp-q90']['wallSeconds'] for r in m['rows']))<1e-9
assert abs(summary['cost']['encodeCpuSeconds']-sum(r['variants']['webp-q90']['cpuSeconds'] for r in m['rows']))<1e-9
assert summary['cost']['totalWallSeconds']==m['wallSeconds']
files={str(p.relative_to(D)):p.read_bytes() for p in D.rglob('*') if p.is_file()};assert {p:sha(b) for p,b in files.items()}==identity['allFiles'];assert sum(map(len,files.values()))==identity['totalDistBytes']
for p,r in inv.items():assert sha(files['appearances/'+p])==r['sha256']
webps={p:b for p,b in files.items() if p.startswith('static/') and p.endswith('.webp')};assert len(webps)==81 and sum(map(len,webps.values()))==identity['webpBytes']==summary['all81']['q90Bytes'];seen=set()
for p,b in webps.items():
 src=p.split('/appearances/')[1][:-5]+'.png';v=lookup[src];assert sha(b)==v['sha256'] and len(b)==v['bytes'];im=images[src];out=Image.open(io.BytesIO(b)).convert('RGBA');assert out.size==im.size and out.getchannel('A').tobytes()==im.getchannel('A').tobytes() and out.tobytes()!=im.tobytes()
 if v['sha256'] not in seen:
  diff=ImageChops.difference(im,out);mask=im.getchannel('A').point(lambda x:255 if x else 0);hist=diff.convert('RGB').histogram(mask=mask);visible=sum(mask.histogram()[1:]);mae=sum((i%256)*n for i,n in enumerate(hist))/(visible*3);maxerr=max(i%256 for i,n in enumerate(hist) if n);changed=ImageChops.lighter(ImageChops.lighter(*diff.split()[:2]),diff.split()[2]).histogram(mask=mask)
  assert abs(mae-v['visibleRgbMAE'])<1e-10 and maxerr==v['visibleMaxChannelError'] and sum(changed[1:])==v['visibleChangedPixels'];seen.add(v['sha256'])
 if '/animation/' not in p:assert sha(b)==p.split('/')[1]
manifestpath=identity['manifestUrl'][1:];assert sha(files[manifestpath])==manifestpath.split('/')[1];manifest=json.loads(files[manifestpath]);parts=0
for preset in manifest:
 for url in [preset['avatar'],preset['portrait'],*preset['portraits'].values()]:assert url[1:] in files
 ap=preset['animation'][1:];prefix=posixpath.dirname(ap);pkg=json.loads(files[ap]);original=json.loads(blob('design/character-presets/assets/'+preset['id']+'/animation/package.json'))
 for asset in original['assets'].values():asset['src']=asset['src'][:-4]+'.webp'
 assert pkg==original
 digest=hashlib.sha256()
 for path in sorted(p for p in files if p.startswith(prefix+'/')):
  local=path[path.index('appearances/'):];b=files[path];digest.update((local+'\0'+str(len(b))+'\0').encode());digest.update(b)
 assert digest.hexdigest()==ap.split('/')[1]
 for asset in pkg['assets'].values():
  rel=asset['src'];assert rel.startswith('parts/') and '..' not in rel and posixpath.normpath(rel)==rel;value=files[prefix+'/'+rel];im=Image.open(io.BytesIO(value));assert im.size==(asset['width'],asset['height']);parts+=1
assert len(manifest)==identity['presets']==8 and parts==identity['animationParts']==46
native={r['path']:r['bytes'] for r in cold['outputs']};assert len(native)==len(cold['outputs'])==warm['outputCount']==92
assert native=={p:len(b) for p,b in files.items() if p.startswith('static/')};assert cold['manifestUrl']==warm['manifestUrl']==identity['manifestUrl'];assert cold['stats']=={'encoded':50,'cached':0,'preserved':0} and warm['stats']=={'encoded':0,'cached':50,'preserved':0} and warm['matchedIndependentQ90']==50
from urllib.parse import urlparse
network=0
for name in ['browser/home-network.json','browser/sunny-network.json','browser/switch-results-network.json']:
 for row in J[name]:
  u=urlparse(row['url']);assert u.hostname=='127.0.0.1' and u.port==5356;p=u.path[1:]
  if p in files:
   assert row['status']==200
   if 'length' in row:assert int(row['length'])==len(files[p])
   if p.endswith('.webp'):assert row['mime']=='image/webp'
  else:assert row['url'].startswith('blob:')
  network+=1
assert J['browser/browser-logs.json']==[] and J['browser/request-summary.json']['hasMore'] is False and J['browser/request-summary.json']['truncated'] is False
for row in J['browser/request-summary.json']['rows']:
 u=urlparse(row['url']);assert row['url'].startswith('blob:http://127.0.0.1:5356/') or u.path=='/' or u.path[1:] in files
for row in J['browser/fallback-dom.json']['visibleImages']:
 p=urlparse(row['url']).path[1:];im=Image.open(io.BytesIO(files[p]));assert im.size==(row['width'],row['height'])
result={'source':S,'canonicalMain':M,'jsonFilesFullyParsed':len(J),'paths':81,'uniqueSources':50,'allDistFiles':len(files),'bytes':identity['totalDistBytes'],'webpBytes':identity['webpBytes'],'savingPercent':summary['all81']['savingPercent'],'packages':len(manifest),'parts':parts,'networkRecords':network,'checks':'PASS: all source SHA/size/RGBA/alpha, every output hash/dimensions/alpha, all 50 lossy metrics, summary arithmetic, 190 file identities, 92 final hashed outputs/8 directory digests/manifest/static target closure, native cold/warm metadata and browser URL/size/MIME consistency','limits':'Read-only current source WT dist verified via allFiles190; no re-encode/runtime parser/browser/network/service performed; timings/cache/browser DOM observations remain source-owner evidence, metadata does not independently repeat them'}
pathlib.Path('/private/tmp/lie-q90-audit-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
