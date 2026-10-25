"""Read-only verification of the exact authorized two-row source overlap."""
from pathlib import Path
import json,runpy,hashlib
from unittest import mock
import numpy as np
from PIL import Image
repo=Path(__file__).resolve().parents[3]
here=Path(__file__).resolve().parent
candidate=repo/'design/animation-candidates/silver-bun/package.json'
before=json.loads((here/'before-fix-package.json').read_text())
expected=json.loads(json.dumps(before))
button=next(n for n in expected['nodes'] if n['id']=='waiting-button')
assert button['sprite']['crop']==[592,626,25,42] and button['transform']['y']==626
button['sprite']['crop']=[592,624,25,44];button['transform']['y']=624
assert expected==json.loads(candidate.read_text())
print('PASS exact two-field package delta; all masks, tracks, other nodes and existing pixel mapping unchanged')
image=np.asarray(Image.open(repo/'design/animation-candidates/silver-bun/parts/waiting-source.png'))
strip=image[624:626,592:617].reshape(-1,4)
assert len(strip)==50 and np.all(strip[:,3]>=253)
assert np.all((strip[:,0]>=108)&(strip[:,0]<=132)&(strip[:,1]>=209)&(strip[:,1]<=233)&(strip[:,2]>=205)&(strip[:,2]<=224))
print('PASS added 50 original cloth pixels: RGBA min',strip.min(axis=0).tolist(),'max',strip.max(axis=0).tolist(),'no skin/dark outline or button feature')
outputs={}
def capture(path,text,*args,**kwargs):outputs[str(path)]=text;return len(text)
def unchanged_copy(src,dst,*args,**kwargs):assert Path(src).read_bytes()==Path(dst).read_bytes();return str(dst)
with mock.patch.object(Path,'write_text',capture),mock.patch('shutil.copyfile',unchanged_copy):runpy.run_path(str(repo/'design/animation-candidates/silver-bun/build-package.py'))
assert outputs[str(candidate)].encode()==candidate.read_bytes()
print('PASS actual generator execution with writes captured: exact package output, every native PNG copy byte-identical, provenance/files not rewritten')
hashof=lambda data:hashlib.sha256(data).hexdigest()
baseline=json.loads((here/'baseline-formal-sha256.json').read_text());result={}
for id,digest in baseline.items():
 formal=(repo/f'design/character-presets/assets/{id}/animation/package.json').read_bytes()
 generated=(repo/f'apps/web/public/appearances/{id}/animation/package.json').read_bytes()
 assert formal==generated
 if id=='silver-bun':assert formal==candidate.read_bytes()
 else:assert hashof(formal)==digest
 result[id]=hashof(formal)
print('PASS all eight source/formal-generated packages: silver exact authorized candidate, other seven frozen SHA256 unchanged')
print(json.dumps(result,indent=2))
