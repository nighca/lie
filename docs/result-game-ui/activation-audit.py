import subprocess,json,pathlib,tempfile,tarfile,io,hashlib,re,ast
from PIL import Image
S='51d9bdbd2a9ed34d54b31d27df65ab948cbd8c82';B='870cbd524ab21e243e072866ce70288932192834';D='73e55f527729417ae5296526cc602aed2ca926ef'
def blob(s,p):return subprocess.check_output(['git','show',s+':'+p])
def sha(b):return hashlib.sha256(b).hexdigest()
manifest=json.loads(blob(S,'design/character-presets/manifest.json'));oldmanifest=json.loads(blob(B,'design/character-presets/manifest.json'));identity=json.loads(blob(S,'design/result-reactions-activation/source-identity.json'));checks=json.loads(blob(S,'design/result-reactions-activation/checks.json'))
assert identity['base']==checks['base']==B and identity['source']==checks['source']==D
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',B,'design/character-presets/assets']).decode().splitlines();pngs=[p for p in paths if p.endswith('.png')];assert len(pngs)==81
for p in pngs:assert blob(S,p)==blob(B,p)
assert len(manifest)==len(oldmanifest)==len(identity['characters'])==8
rows=[];copied={}
for entry,oldentry,record in zip(manifest,oldmanifest,identity['characters'],strict=True):
 id=entry['id'];prefix='design/character-presets/assets/'+id+'/';candidate='design/result-reactions/'+id+'/';new=json.loads(blob(S,prefix+'animation/package.json'));old=json.loads(blob(B,prefix+'animation/package.json'));assert new['schemaVersion']==2
 assert new['nodes'][:len(old['nodes'])]==old['nodes'] and new['transitions']==old['transitions'] and new['canvas']==old['canvas']
 for k in ['assets','clips','states']:
  for key,v in old[k].items():assert new[k][key]==v
 raw=blob(S,prefix+'animation/package.json');assert raw==blob(D,candidate+'package.json');expected={prefix+'animation/package.json':sha(raw)}
 compare=json.loads(json.dumps(entry))
 for state,file in [('accusedCorrectly','accused-correctly.png'),('accusedWrongly','accused-wrongly.png')]:
  assert entry['portraits'][state]=='assets/'+id+'/'+file;b=blob(S,prefix+file);assert b==blob(D,candidate+file);im=Image.open(io.BytesIO(b));assert im.format=='PNG' and im.mode=='RGBA' and im.size==(new['canvas']['width'],new['canvas']['height']);expected[prefix+file]=sha(b);assert new['clips'][new['states'][state]]['loop'] is False;del compare['portraits'][state]
 assert compare==oldentry
 added={k:a for k,a in new['assets'].items() if k not in old['assets']};assert len(added)==2
 for a in added.values():
  path=prefix+'animation/'+a['src'];b=blob(S,path);assert b==blob(D,candidate+a['src']);expected[path]=sha(b)
 pixels=new['canvas']['width']*new['canvas']['height']
 for a in new['assets'].values():
  assert re.fullmatch(r'parts/[a-z0-9]+(?:-[a-z0-9]+)*\.png',a['src']);im=Image.open(io.BytesIO(blob(S,prefix+'animation/'+a['src'])));assert im.size==(a['width'],a['height']) and im.mode=='RGBA';pixels+=im.width*im.height
 assert pixels<=32*1024*1024
 assert record['id']==id and record['sourceIdentical']==expected and record['oldClipsNodesStatesAssetsTransitionsUnchanged'] is True;copied.update(expected)
 rows.append({'id':id,'assetCount':len(new['assets']),'pixelsIncludingCanvas':pixels,'copiedFiles':len(expected),'nonLoopResults':2})
assert len(copied)==40
assert checks['oldPngFilesUnchanged']==81 and checks['productionResultStaticWebP']==16 and checks['productionNewPartWebP']==16 and checks['productionAllAnimationPartReferences']==62
assert all(r=={'id':m['id'],'allSourceFilesIdentical':True,'oldPackageRecordsIdentical':True} for r,m in zip(checks['characters'],manifest,strict=True))
assert subprocess.check_output(['git','diff','--name-only',B,S,'--','apps','packages','scripts','.github','package.json','package-lock.json']).decode()==''
textpaths=['design/result-reactions-activation/'+f for f in ['verify.py','README.md','checks.json','source-identity.json']]
for p in textpaths:
 text=blob(S,p).decode();assert not re.search(r'(?:sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9_.-]{20,}|-----BEGIN .*PRIVATE KEY-----)',text)
ast.parse(blob(S,'design/result-reactions-activation/verify.py').decode())
snapshot=pathlib.Path(tempfile.mkdtemp(prefix='lie-activation-audit-',dir='/private/tmp'))
with tarfile.open(fileobj=io.BytesIO(subprocess.check_output(['git','archive',S,'design/character-presets','packages/character-animation/src','scripts/character-presets.mjs']))) as t:t.extractall(snapshot,filter='data')
node='/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node';runs=[]
for args in [[],['--check']]:
 run=subprocess.run([node,'scripts/character-presets.mjs',*args],cwd=snapshot,capture_output=True,text=True);assert run.returncode==0,run.stderr;assert '8 character presets (121 assets)' in run.stdout;runs.append(run.stdout.strip())
output=list((snapshot/'apps/web/public/appearances').rglob('*'));assert len([p for p in output if p.is_file()])==122
out={'source':S,'base':B,'artworkSource':D,'oldPNGsUnchanged':81,'copiedFiles':copied,'characters':rows,'strictRuns':runs,'snapshot':str(snapshot),'checksJSONInternallyConsistent':True,'limits':['No re-encoding or build/browser/service; only temporary PNG copy generation and strict output check','verify.py built-dist section reviewed but not rerun: its historical WebP16/16/62 and manifest hash remain source-owner build evidence','40 exact design-source file identity permits reuse of prior8/1936 audit; not repeated','No sourceWT/dist/deps accessed or modified; no visual or Canvas terminal re-render']}
pathlib.Path('/private/tmp/lie-result-activation-audit-result.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='copiedFiles'},indent=2))
