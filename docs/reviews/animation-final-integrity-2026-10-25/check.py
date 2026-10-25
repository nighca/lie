from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[3]
git=lambda *args:subprocess.check_output(['git','-C',str(root),*args])
base='8be6d0315a393281484d65fa903353d4ea666739';head='a432b72bd9d7742c5b2d49306725be0fcd74e0d5'
ids=['silver-bun','salt-pepper-beard','plum-crop','mint-puffs','ochre-freckles']
commits=git('rev-list','--reverse',base+'..'+head).decode().splitlines();assert len(commits)==23
files=git('diff','--name-only',base,head).decode().splitlines()
assert all(p.startswith(('design/animation-candidates/','design/character-presets/assets/','docs/animation/')) for p in files)
assert sorted(p for p in files if p.startswith('design/character-presets/'))==sorted(f'design/character-presets/assets/{id}/animation/package.json' for id in ids)
assert not git('diff',base,head,'--','apps','packages','scripts','package.json','package-lock.json','design/character-presets/manifest.json')
assert not [p for p in files if p.endswith('.png') and not p.startswith('docs/animation/')]
hashof=lambda b:hashlib.sha256(b).hexdigest()
for id in ids:
 p=f'design/animation-candidates/{id}/package.json';data=(root/p).read_bytes();formal=(root/f'design/character-presets/assets/{id}/animation/package.json').read_bytes();assert data==formal
 if id!='silver-bun':assert data==git('show','22b2ee8:'+p)
 value=json.loads(data)
 for asset in value['assets'].values():
  part=f'design/animation-candidates/{id}/'+asset['src'];assert (root/part).read_bytes()==git('show',base+':'+part)
  assert (root/part).read_bytes()==(root/f'design/character-presets/assets/{id}/animation'/asset['src']).read_bytes()
 print(id,hashof(data),'candidate=formal; native parts unchanged')
for sha in commits[-3:]:
 changed=git('diff-tree','--no-commit-id','--name-only','-r',sha).decode().splitlines()
 for p in changed:
  if p.endswith('.json'):json.loads(git('show',sha+':'+p))
 print('commit',sha,'files',len(changed))
# Execute only the verifier's package/native/generator checks, stopping before generated-output claims.
p=root/'docs/animation/2026-10-25-silver-seam-fix/verify-fix.py'
text=p.read_text().split('hashof=lambda')[0]
exec(compile(text,str(p),'exec'),{'__file__':str(p),'__name__':'__main__'})
print('PASS full23 scope/formal/native identity and bounded generator checks; no generated outputs synthesized')
