"""Read-only identity and production-closure audit; run from repository root."""
import hashlib,json,pathlib,subprocess
ROOT=pathlib.Path.cwd()
BASE='870cbd524ab21e243e072866ce70288932192834'
SOURCE='73e55f527729417ae5296526cc602aed2ca926ef'
def blob(ref,path):return subprocess.check_output(['git','show',f'{ref}:{path}'])
def digest(data):return hashlib.sha256(data).hexdigest()
manifest=json.loads((ROOT/'design/character-presets/manifest.json').read_bytes())
old_manifest=json.loads(blob(BASE,'design/character-presets/manifest.json'))
old_pngs=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'design/character-presets/assets']).decode().splitlines()
old_pngs=[p for p in old_pngs if p.endswith('.png')]
assert all((ROOT/p).read_bytes()==blob(BASE,p) for p in old_pngs)
rows=[]
for entry,old_entry in zip(manifest,old_manifest,strict=True):
 id=entry['id']; prefix=f'design/character-presets/assets/{id}'; candidate=f'design/result-reactions/{id}'
 old=json.loads(blob(BASE,f'{prefix}/animation/package.json'));new=json.loads((ROOT/f'{prefix}/animation/package.json').read_bytes())
 assert new['schemaVersion']==2
 for k in ['assets','clips','states']:
  assert all(new[k][key]==value for key,value in old[k].items())
 assert new['nodes'][:len(old['nodes'])]==old['nodes']
 assert new['transitions']==old['transitions']
 assert (ROOT/f'{prefix}/animation/package.json').read_bytes()==blob(SOURCE,f'{candidate}/package.json')
 compare=json.loads(json.dumps(entry))
 for state,filename in [('accusedCorrectly','accused-correctly.png'),('accusedWrongly','accused-wrongly.png')]:
  assert entry['portraits'][state]==f'assets/{id}/{filename}'
  assert (ROOT/f'{prefix}/{filename}').read_bytes()==blob(SOURCE,f'{candidate}/{filename}')
  assert new['clips'][new['states'][state]]['loop'] is False
  del compare['portraits'][state]
 assert compare==old_entry
 added={k:v for k,v in new['assets'].items() if k not in old['assets']}
 assert len(added)==2
 for asset in added.values():assert (ROOT/f'{prefix}/animation/{asset["src"]}').read_bytes()==blob(SOURCE,f'{candidate}/{asset["src"]}')
 rows.append({'id':id,'allSourceFilesIdentical':True,'oldPackageRecordsIdentical':True})
dist=ROOT/'apps/web/dist'; manifests=list(dist.glob('static/*/appearances/manifest.json'));assert len(manifests)==1
built=json.loads(manifests[0].read_bytes());result_static=0;new_parts=0;all_refs=0
for entry in built:
 for key in ['accusedCorrectly','accusedWrongly']:
  url=entry['portraits'][key];assert url.endswith('.webp');assert (dist/url.lstrip('/')).is_file();result_static+=1
 packagepath=dist/entry['animation'].lstrip('/');p=json.loads(packagepath.read_bytes())
 for key,asset in p['assets'].items():
  assert asset['src'].endswith('.webp');assert (packagepath.parent/asset['src']).is_file();all_refs+=1
 original=json.loads(blob(BASE,f'design/character-presets/assets/{entry["id"]}/animation/package.json'))
 new_parts+=sum(k not in original['assets'] for k in p['assets'])
assert result_static==16 and new_parts==16
print(json.dumps({'base':BASE,'source':SOURCE,'oldPngFilesUnchanged':len(old_pngs),'characters':rows,'productionResultStaticWebP':result_static,'productionNewPartWebP':new_parts,'productionAllAnimationPartReferences':all_refs,'productionManifest':str(manifests[0].relative_to(ROOT))},indent=2))
