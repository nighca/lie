import subprocess,pathlib,tempfile,tarfile,io,json,hashlib,re
from PIL import Image
SOURCES={'sunny-moustache':'e362243bc600c1443451503ec79d422b4285c149','silver-bun':'6f83ce9cf661c13610d052c919a783eab4e724d4','plum-crop':'4fa81cacf2a78bf3dc7f77087ffee4b9d3f4f14f'};PARENT=subprocess.check_output(['git','rev-parse','458aaf8']).decode().strip();BASE='365269b6185be586b69c0fac2b7ba15defeb7a6f';MAIN=subprocess.check_output(['git','rev-parse','main']).decode().strip()
def blob(s,p):return subprocess.check_output(['git','show',s+':'+p])
def sha(b):return hashlib.sha256(b).hexdigest()
snapshot=pathlib.Path(tempfile.mkdtemp(prefix='lie-first-batch-audit-',dir='/private/tmp'))
for ref,paths in [(PARENT,['design/result-reactions']),(BASE,['design/character-presets/assets']),(MAIN,['packages/character-animation/src'])]:
 with tarfile.open(fileobj=io.BytesIO(subprocess.check_output(['git','archive',ref,*paths]))) as t:t.extractall(snapshot,filter='data')
results=[]
for id,S in SOURCES.items():
 prefix='design/result-reactions/'+id+'/';canonical='design/character-presets/assets/'+id+'/animation/';raw=json.loads(blob(S,prefix+'package.json'));old=json.loads(blob(BASE,canonical+'package.json'));records=json.loads(blob(S,prefix+'generation-records.json'))
 for path in subprocess.check_output(['git','ls-tree','-r','--name-only',S,prefix]).decode().splitlines():
  if blob(S,path)!=blob(PARENT,path):
   assert path.endswith('generation-records.json'),path+' differs at parent'
   before=json.loads(blob(S,path));after=json.loads(blob(PARENT,path));after['service'].pop('status',None);after['service'].pop('stopEvidence',None);assert before==after,path+' non-service delta'
  if path.endswith(('.json','.ts','.mjs','.md','.html')):
   text=blob(S,path).decode();assert not re.search(r'(?:sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9_.-]{20,}|-----BEGIN .*PRIVATE KEY-----)',text), 'credential pattern'
 assert raw['schemaVersion']==2 and raw['canvas']==old['canvas'] and raw['transitions']==old['transitions'] and raw['nodes'][:len(old['nodes'])]==old['nodes']
 for k,v in old['clips'].items():assert raw['clips'][k]==v
 for k,v in old['states'].items():assert raw['states'][k]==v
 oldpngs=0;pixels=raw['canvas']['width']*raw['canvas']['height'];assetchecks={}
 for key,a in raw['assets'].items():
  assert re.fullmatch(r'parts/[a-z0-9]+(?:-[a-z0-9]+)*\.png',a['src']);b=blob(S,prefix+a['src']);im=Image.open(io.BytesIO(b));assert im.format=='PNG' and im.size==(a['width'],a['height']) and im.mode=='RGBA';pixels+=im.width*im.height;alpha=im.getchannel('A').getextrema();assetchecks[a['src']]={'sha256':sha(b),'width':im.width,'height':im.height,'mode':im.mode,'alphaExtrema':list(alpha),'format':im.format}
  if key in old['assets']:
   assert a==old['assets'][key] and b==blob(BASE,canonical+a['src']);oldpngs+=1
 assert pixels<=32*1024*1024
 for name in ['accused-correctly.png','accused-wrongly.png']:
  b=blob(S,prefix+name);im=Image.open(io.BytesIO(b));assert im.format=='PNG' and im.size==(raw['canvas']['width'],raw['canvas']['height']);assetchecks[name]={'sha256':sha(b),'width':im.width,'height':im.height,'mode':im.mode,'alphaExtrema':list(im.getchannel('A').getextrema()),'format':im.format}
 if id=='sunny-moustache':
  for rec in records['states']:
   actual=assetchecks[rec['savedPath']];assert rec['sha256']==actual['sha256'] and rec['dimensions']==[actual['width'],actual['height']] and rec['alphaExtrema']==actual['alphaExtrema'];assert rec['prompt'] and rec['file'].endswith('.png')
 else:
  prompts=json.loads(blob(S,prefix+'prompts.json'));assert prompts==records['prompts'];assert records['base']==BASE
  for file,rec in records['files'].items():
   b=blob(S,prefix+file);im=Image.open(io.BytesIO(b));actual={'sha256':sha(b),'width':im.width,'height':im.height,'mode':im.mode,'format':im.format,'alphaExtrema':list(im.getchannel('A').getextrema()) if im.mode=='RGBA' else None}
   assert all(actual[k]==v for k,v in rec.items()),file
 results.append({'id':id,'source':S,'assets':len(raw['assets']),'oldPNGsUnchanged':oldpngs,'newAssets':len(raw['assets'])-oldpngs,'oldNodes':len(old['nodes']),'newNodes':len(raw['nodes'])-len(old['nodes']),'pixelsIncludingCanvas':pixels,'resultClips':{state:{'clip':raw['states'][state],'duration':raw['clips'][raw['states'][state]]['duration'],'loop':raw['clips'][raw['states'][state]]['loop']} for state in ['accusedCorrectly','accusedWrongly']}})
node='/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node'
for result in results:
 path='design/result-reactions/'+result['id']+'/check.mjs';run=subprocess.run([node,'--experimental-transform-types',path],cwd=snapshot,capture_output=True,text=True);assert run.returncode==0,run.stderr;data=json.loads(run.stdout)
 checks=snapshot/'design/result-reactions'/result['id']/'checks.json'
 if checks.exists():assert data==json.loads(checks.read_text())
 result['check']=data
run=subprocess.run([node,'--experimental-transform-types','design/result-reactions/validate.mjs'],cwd=snapshot,capture_output=True,text=True);assert run.returncode==0,run.stderr;unified=json.loads(run.stdout);assert unified['characters']==4
out={'parent':PARENT,'base':BASE,'runtimeMain':MAIN,'snapshot':str(snapshot),'characters':results,'unified':unified,'limits':['No browser/Canvas raster re-render: terminal PNG file identity/dimensions and sampled end pose verified; actual component endpoint-to-PNG pixel equality remains source-parent458 browser evidence','No artwork edits, encoding, activation, credentials or services; provenance paths/prompts are records, not authenticated imagegen attestations','Recorded lane service statuses are historical; parent first-batch-review supersedes temporary retained-lane wording; no scan performed']}
pathlib.Path('/private/tmp/lie-first-batch-animation-audit-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='characters'},ensure_ascii=False,indent=2));print(json.dumps([{k:v for k,v in r.items() if k!='check'} for r in results],indent=2))
