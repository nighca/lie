import subprocess,pathlib,tempfile,tarfile,io,json,hashlib,re
from PIL import Image
SOURCES={'mint-puffs':'c18cbdab71fd1107436aff2d7efdaaaeb29100b6','blue-glasses':'fac2d8274c1d2f28b5aa73fc5c45d38706611298','salt-pepper-beard':'4b2b45b3dc288387f06a557b21f470ddf436efb9','ochre-freckles':'2d5976380af1366e350b8ee907cbd9765d46dcfb'};P='73e55f527729417ae5296526cc602aed2ca926ef';B='365269b6185be586b69c0fac2b7ba15defeb7a6f';M=subprocess.check_output(['git','rev-parse','main']).decode().strip()
def blob(s,p):return subprocess.check_output(['git','show',s+':'+p])
def sha(b):return hashlib.sha256(b).hexdigest()
snapshot=pathlib.Path(tempfile.mkdtemp(prefix='lie-final-four-audit-',dir='/private/tmp'))
for ref,paths in [(P,['design/result-reactions']),(B,['design/character-presets/assets']),(M,['packages/character-animation/src'])]:
 with tarfile.open(fileobj=io.BytesIO(subprocess.check_output(['git','archive',ref,*paths]))) as t:t.extractall(snapshot,filter='data')
results=[]
for id,S in SOURCES.items():
 prefix='design/result-reactions/'+id+'/';canonical='design/character-presets/assets/'+id+'/animation/';raw=json.loads(blob(P,prefix+'package.json'));old=json.loads(blob(B,canonical+'package.json'));rec=json.loads(blob(P,prefix+'generation-records.json'));srcRec=json.loads(blob(S,prefix+'generation-records.json'))
 changes=[]
 for path in subprocess.check_output(['git','ls-tree','-r','--name-only',S,prefix]).decode().splitlines():
  if blob(S,path)!=blob(P,path):assert path.endswith(('.md','generation-records.json'));changes.append(path.removeprefix(prefix))
  if path.endswith(('.json','.ts','.mjs','.md','.html')):
   text=blob(P,path).decode();assert not re.search(r'(?:sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9_.-]{20,}|-----BEGIN .*PRIVATE KEY-----)',text)
 if id!='mint-puffs':
  orig=dict(rec);orig.pop('parentAcceptance');orig.pop('parentExportFiles');assert orig==srcRec
 else:
  orig=dict(rec);orig.pop('parentAcceptance');orig.pop('parentExportFiles');assert orig==srcRec
 assert raw['schemaVersion']==2 and raw['canvas']==old['canvas'] and raw['transitions']==old['transitions'];assert raw['nodes'][:len(old['nodes'])]==old['nodes']
 for k,v in old['clips'].items():assert raw['clips'][k]==v
 for k,v in old['states'].items():assert raw['states'][k]==v
 assert len(raw['clips'])==len(old['clips'])+2 and len(raw['states'])==len(old['states'])+2
 pixels=raw['canvas']['width']*raw['canvas']['height'];oldcount=0;files={}
 for key,a in raw['assets'].items():
  assert re.fullmatch(r'parts/[a-z0-9]+(?:-[a-z0-9]+)*\.png',a['src']);b=blob(P,prefix+a['src']);im=Image.open(io.BytesIO(b));assert im.format=='PNG' and im.mode=='RGBA' and im.size==(a['width'],a['height']);pixels+=im.width*im.height
  files[a['src']]={'sha256':sha(b),'width':im.width,'height':im.height,'format':im.format,'mode':im.mode,'alphaExtrema':list(im.getchannel('A').getextrema())}
  if key in old['assets']:assert a==old['assets'][key] and b==blob(B,canonical+a['src']);oldcount+=1
 assert pixels<=32*1024*1024
 if 'states' in rec:
  for r in rec['states']:
   f=files[r['savedPath']];assert r['sha256']==f['sha256'] and r['dimensions']==[f['width'],f['height']] and r['alphaExtrema']==f['alphaExtrema'];assert r['prompt'] and r['file'].endswith('.png')
 else:
  assert json.loads(blob(P,prefix+'prompts.json'))==rec['prompts']
  for file,r in rec['files'].items():assert all(files[file][k]==v for k,v in r.items())
 for file,r in rec['parentExportFiles'].items():
  b=blob(P,prefix+file);im=Image.open(io.BytesIO(b));assert sha(b)==r['sha256'] and im.format==r['format'] and list(im.size)==r['size']
  if file.endswith('.png'):assert im.size==(raw['canvas']['width'],raw['canvas']['height']) and im.mode=='RGBA'
 assert rec['parentAcceptance']['status'].startswith('self-accepted')
 results.append({'id':id,'source':S,'assets':len(raw['assets']),'oldPartsUnchanged':oldcount,'newAssets':len(raw['assets'])-oldcount,'newNodes':len(raw['nodes'])-len(old['nodes']),'pixelsIncludingCanvas':pixels,'sourceToParentTextAdditions':changes,'resultClips':{state:{'duration':raw['clips'][raw['states'][state]]['duration'],'loop':raw['clips'][raw['states'][state]]['loop']} for state in ['accusedCorrectly','accusedWrongly']}})
node='/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node'
for result in results:
 path='design/result-reactions/'+result['id']+'/check.mjs';run=subprocess.run([node,'--experimental-transform-types',path],cwd=snapshot,capture_output=True,text=True);assert run.returncode==0,run.stderr;data=json.loads(run.stdout);assert data['status']=='passed' and data['rigidResultSamples']==242
 stored=snapshot/'design/result-reactions'/result['id']/'checks.json'
 if stored.exists():
  historical=json.loads(stored.read_text());assert all(data['sha256'][k]==v for k,v in historical['sha256'].items())
 result['check']=data
run=subprocess.run([node,'--experimental-transform-types','design/result-reactions/validate.mjs'],cwd=snapshot,capture_output=True,text=True);assert run.returncode==0,run.stderr;unified=json.loads(run.stdout);assert unified==json.loads(blob(P,'design/result-reactions/evidence/all-eight-checks.json'));assert unified['characters']==8 and sum(r['rigidSamples'] for r in unified['results'])==1936
out={'parent':P,'base':B,'runtimeMain':M,'snapshot':str(snapshot),'characters':results,'unified':unified,'limits':['No browser/Canvas raster re-render: terminal PNG identity/dimensions and sampler end hold checked; actual terminal raster equality is parent source evidence','Prior first three source data not independently re-audited; all-eight sampler includes their unchanged candidates for catalog composition only','Parent adds acceptance/export hashes/JPEGs and supersedes original source-only pending text; no activation/services/encoding/Git mutation']}
pathlib.Path('/private/tmp/lie-final-four-animation-audit-result.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k not in ['characters','unified']},indent=2));print(json.dumps([{k:v for k,v in r.items() if k!='check'} for r in results],indent=2));print('PASS independent unified8 /1936 output exactly equals archived all-eight-checks.json')
