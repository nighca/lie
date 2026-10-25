import subprocess,json,hashlib,io,struct,zlib,math,posixpath
from collections import Counter,defaultdict
from PIL import Image,ImageChops
S='56b2adad7c0ec02c37d9e614f8bb37d37145629f'; P='docs/performance/image-build-optimization/'
def blob(p,ref=S): return subprocess.check_output(['git','show',ref+':'+p])
def sha(b): return hashlib.sha256(b).hexdigest()
def js(v): return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def check(ok,label):
 if not ok: raise AssertionError(label)
checks=[]
def note(label): checks.append(label)
J={n:json.loads(blob(P+n+'.json')) for n in ['measurement-full','measurement-sample','summary','build-plan','http-identity','network-evidence']}
f=J['measurement-full'];s=J['measurement-sample'];summary=J['summary'];plan=J['build-plan'];base=f['base']
check(s['base']==plan['base']==base,'base consistency')
check(s['inventory']==f['inventory'],'sample inventory identity')
inv={r['path']:r for r in f['inventory']};check(len(inv)==81,'inventory cardinality')
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',S,'design/character-presets/assets']).decode().splitlines();paths=[p.removeprefix('design/character-presets/assets/') for p in paths if p.endswith('.png')]
check(set(paths)==set(inv),'all source PNG paths covered')
groups=defaultdict(list); images={};chunktypes=Counter();chunkbytes=Counter();sizes=Counter()
for p,r in inv.items():
 b=blob('design/character-presets/assets/'+p); check(b==blob('design/character-presets/assets/'+p,base),'declared base source identity '+p)
 check(sha(b)==r['sha256'] and len(b)==r['bytes'],'source identity '+p)
 check(b[:8]==b'\x89PNG\r\n\x1a\n','PNG magic');pos=8;chunks=[]
 while pos<len(b):
  check(pos+12<=len(b),'chunk bound');n=struct.unpack('>I',b[pos:pos+4])[0];t=b[pos+4:pos+8];v=b[pos+8:pos+8+n]
  check(pos+n+12<=len(b),'payload bound');crc=struct.unpack('>I',b[pos+8+n:pos+12+n])[0];check(zlib.crc32(t+v)&0xffffffff==crc,'CRC')
  chunks.append({'type':t.decode(),'bytes':n,'sha256':sha(v)});chunktypes[t.decode()]+=1;chunkbytes[t.decode()]+=n;pos+=n+12
 check(pos==len(b) and chunks==r['chunks'],'chunk records '+p)
 im=Image.open(io.BytesIO(b));check(im.mode==r['mode'] and list(im.size)==r['size'],'mode/dimensions '+p);im=im.convert('RGBA');a=im.getchannel('A');h=a.histogram()
 check(sha(im.tobytes())==r['rgbaSha256'] and sha(a.tobytes())==r['alphaSha256'],'decoded hashes '+p)
 check(h[0]==r['transparentPixels'] and sum(h[1:255])==r['partialAlphaPixels'],'alpha counts '+p)
 sizes[str(im.size)]+=1;groups[r['sha256']].append(p);images[p]=im
check(len(groups)==f['uniqueCount']==s['uniqueCount']==50,'unique hashes')
note('81/81 source bytes, base identity, dimensions, mode, PNG CRC/chunks, RGBA/alpha SHA and pixel counts independently verified')
lookup={}
for rows,full in [(f['rows'],True),(s['rows'],False)]:
 check(len(rows)==(50 if full else 5),'rows count')
 for row in rows:
  r=inv[row['source']];check(row['sourceBytes']==r['bytes'] and row['sha256']==r['sha256'],'row source')
  check(row['aliases']==groups[r['sha256']],'complete aliases')
  check(set(row['variants'])==({'png-optimize','webp-exact-m4'} if full else {'png-optimize','webp-exact-m4','webp-exact-m6','webp-q95','webp-q90'}),'variant set')
  for name,v in row['variants'].items():
   check(v['bytes']>0 and len(v['sha256'])==64 and all(c in '0123456789abcdef' for c in v['sha256']),'variant shape')
   check(all(isinstance(v[k],(int,float)) and math.isfinite(v[k]) and v[k]>=0 for k in ['wallSeconds','cpuSeconds','visibleChangedPixels','visibleRgbMAE','visibleMaxChannelError']),'variant numerics')
   check(v['sizeEqual'] is True and v['alphaEqual'] is True,'variant alpha/size flag')
   exact=name in ['png-optimize','webp-exact-m4','webp-exact-m6'];check(v['rgbaEqual'] is exact,'exact/lossy flag')
   if exact:check(v['visibleChangedPixels']==v['visibleRgbMAE']==v['visibleMaxChannelError']==0,'exact metrics')
   check(v['file']==r['sha256'][:16]+'-'+name+('.png' if name=='png-optimize' else '.webp'),'candidate name')
  if full:
   for alias in row['aliases']:check(alias not in lookup,'duplicate full alias');lookup[alias]=row
  else:
   for name in ['png-optimize','webp-exact-m4']:
    expected=lookup[row['source']]['variants'][name]
    check(all(row['variants'][name][k]==expected[k] for k in expected if k not in ['wallSeconds','cpuSeconds']),'full/sample output identity')
check(set(lookup)==set(inv),'full alias coverage')
check(len(set(r['sha256'] for r in s['rows']))==4,'sample repeated source declared')
note('50 full variant rows/81 aliases and 5 sample rows/4 unique sources structurally consistent; repeated sample outputs equal, independent timing retained')
for key,rec in summary.items():
 if key in ['cost','totalWallSeconds']:continue
 check(len(rec['paths'])==len(set(rec['paths'])) and all(p in inv for p in rec['paths']),'summary paths '+key)
 expected={'source':sum(inv[p]['bytes'] for p in rec['paths'])}
 for v in ['png-optimize','webp-exact-m4']:expected[v]=sum(lookup[p]['variants'][v]['bytes'] for p in rec['paths'])
 check(rec['bytes']==expected,'summary sums '+key);check(abs(rec['webpSavingPercent']-(1-expected['webp-exact-m4']/expected['source'])*100)<1e-10,'saving percent '+key)
check(set(summary['all81']['paths'])==set(inv),'all81 summary');check(set(summary['parts46']['paths'])=={p for p in inv if '/animation/' in p},'parts46 summary')
check(len(summary['unique50']['paths'])==50 and len({inv[p]['sha256'] for p in summary['unique50']['paths']})==50,'unique50 summary')
for variant,rec in summary['cost'].items():
 for field,srcfield in [('encodeWallSeconds','wallSeconds'),('encodeCpuSeconds','cpuSeconds')]:check(abs(rec[field]-sum(r['variants'][variant][srcfield] for r in f['rows']))<1e-10,'cost sum')
check(summary['totalWallSeconds']==f['wallSeconds'],'total time')
note('all 8 summary path groups, source/variant byte totals, savings, variant CPU/wall sums and batch time match full measurement')
# Plan closure is metadata-verifiable; absent corpus candidate bytes cannot rederive directory digest.
outputs=plan['outputs'];check(len(outputs)==90 and len(plan['animations'])==len(plan['manifest'])==8,'plan cardinality')
sourceManifest=json.loads(blob('design/character-presets/manifest.json'));expectedManifest=[];imageoutputs={};packageoutputs={};urls={};parts=0
for raw in sourceManifest:
 id=raw['id'];a=plan['animations'][id];pkg=json.loads(blob('design/character-presets/'+raw['animation']));entries={}
 for asset in pkg['assets'].values():
  p=id+'/animation/'+asset['src'];v=lookup[p]['variants']['webp-exact-m4'];new=p[:-4]+'.webp' if v['bytes']<inv[p]['bytes'] else p
  asset['src']=new[len(id+'/animation/'):];check(asset['src'].startswith('parts/') and posixpath.normpath(asset['src'])==asset['src'] and '..' not in asset['src'].split('/'),'safe relative path');parts+=1
  entries['appearances/'+new]={'bytes':v['bytes'],'sha256':v['sha256']};imageoutputs['/static/'+a['digest']+'/appearances/'+new]=entries['appearances/'+new]
 check(pkg==a['package'],'package change limited to src '+id)
 packagepath='appearances/'+id+'/animation/package.json';pbytes=js(pkg);entries[packagepath]={'bytes':len(pbytes),'sha256':sha(pbytes)}
 check(entries==a['entries'],'package entry closure '+id);packageoutputs['/static/'+a['digest']+'/'+packagepath]=entries[packagepath];urls['/appearances/'+id+'/animation/package.json']='/static/'+a['digest']+'/'+packagepath
for p,r in inv.items():
 if '/animation/' in p:continue
 v=lookup[p]['variants']['webp-exact-m4'];new=p[:-4]+'.webp';url='/static/'+v['sha256']+'/appearances/'+new;imageoutputs[url]={'bytes':v['bytes'],'sha256':v['sha256']};urls['/appearances/'+p]=url
for raw in sourceManifest:
 rec={k:v for k,v in raw.items() if k not in ['avatar','portrait','portraits','animation']}
 for k in ['avatar','portrait','animation']:
  if k in raw:rec[k]=urls['/appearances/'+raw[k].removeprefix('assets/')]
 rec['portraits']={state:urls['/appearances/'+p.removeprefix('assets/')] for state,p in raw['portraits'].items()};expectedManifest.append(rec)
check(expectedManifest==plan['manifest'],'manifest preserves contract/voice/name and exact target rewrite');mb=js(expectedManifest);mu='/static/'+sha(mb)+'/appearances/manifest.json';check(mu==plan['manifestUrl'],'manifest final bytes URL')
expected={**imageoutputs,**packageoutputs,mu:{'bytes':len(mb),'sha256':sha(mb)}};check(outputs==expected and parts==46,'all 90 outputs / 46 parts closure')
check(plan['checks']['runtimeDecoderTested'] is False and 'dry-run' in plan['status'],'runtime untested explicit')
note('90-output metadata closure: 81 candidate image identities, 8 serialized package SHA/size, 46 safe relative parts, serialized manifest SHA/size/URL, preserved all non-asset fields; runtimeDecoderTested=false')
samplechecks=[]
for prefix,p in [('coral-bob','coral-bob/default.png'),('silver-bun','silver-bun/animation/parts/head.png')]:
 row=next(r for r in s['rows'] if p in r['aliases']);im=images[p]
 for variant in ['webp-exact-m4','webp-q95','webp-q90']:
  b=blob(P+'samples/'+prefix+'-'+variant+'.webp');v=row['variants'][variant];check(sha(b)==v['sha256'] and len(b)==v['bytes'],'sample binary SHA/size')
  dec=Image.open(io.BytesIO(b)).convert('RGBA');check(dec.size==im.size and dec.getchannel('A').tobytes()==im.getchannel('A').tobytes(),'sample alpha/size')
  check((im.tobytes()==dec.tobytes())==v['rgbaEqual'],'sample RGBA equality')
  if variant!='webp-exact-m4':
   diff=ImageChops.difference(im,dec);mask=im.getchannel('A').point(lambda n:255 if n else 0);hist=diff.convert('RGB').histogram(mask=mask);n=sum(mask.histogram()[1:]);mae=sum((i%256)*v for i,v in enumerate(hist))/(n*3);maxerr=max(i%256 for i,n in enumerate(hist) if n)
   changed=ImageChops.lighter(ImageChops.lighter(*diff.split()[:2]),diff.split()[2]).histogram(mask=mask);check(abs(mae-v['visibleRgbMAE'])<1e-10 and maxerr==v['visibleMaxChannelError'] and sum(changed[1:])==v['visibleChangedPixels'],'sample RGB metrics')
  samplechecks.append({'file':prefix+'-'+variant+'.webp','bytes':len(b),'sha256':sha(b)})
comparison=blob(P+'samples/comparison.png');ci=Image.open(io.BytesIO(comparison));check(ci.size==(1360,1550),'comparison dimensions')
note('all 6 retained WebP binaries SHA/bytes/dimensions/alpha/exact-or-lossy metrics independently verified; comparison PNG opens 1360x1550')
network=J['network-evidence'];http=J['http-identity'];check(network['version']=='48316544ea9fd22afbf1eee8db6f81e326026821' and network['providerActions'] is False,'network declared scope')
for stage,paths in network['stages'].items():check(paths==summary[stage]['paths'],'network stage summary')
for rec in http['records']:
 check(str(rec['bytes'])==rec['headers']['content-length'],'HTTP declared length');check(rec['url'].split('/static/')[1].split('/')[0]==rec['sha256'],'HTTP URL digest')
 if rec['kind']=='avatar':check((rec['sha256'],rec['bytes'])==(inv['sunny-moustache/avatar.png']['sha256'],inv['sunny-moustache/avatar.png']['bytes']),'HTTP avatar source')
note('network stage-to-summary mapping and HTTP record internal length/URL hash/avatar canonical identity consistent; observations remain relayed, not re-collected')
result={'source':S,'declaredBase':base,'checks':checks,'counts':{'paths':len(inv),'unique':len(groups),'fullRows':len(f['rows']),'sampleRows':len(s['rows']),'sampleUnique':4,'outputs':len(outputs),'packages':len(plan['animations']),'parts':parts},'chunks':dict(chunktypes),'chunkBytes':dict(chunkbytes),'dimensions':dict(sizes),'samples':samplechecks,'comparison':{'bytes':len(comparison),'sha256':sha(comparison)},'limits':['No re-encoding/network/runtime/browser performed','Absent full candidate binaries: all 100 variant binary hashes/decoded-equality claims and 8 directory digests cannot be independently recomputed from metadata alone; 6 retained binaries independently decoded','No raw HAR: specialist-team-root IAB observations are relayed provenance, not this auditor/root direct measurement','Old strict-lossless proposal is historical and superseded by subsequent user q90 approval; audit does not reinstate proposal gate']}
open('/private/tmp/lie-image-research-audit-result.json','w').write(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
