import pathlib,subprocess,json,hashlib,wave,array,re
wt=pathlib.Path('/Users/nighca/.codex/worktrees/promo-video-production/lie');sha='736fae1ac67b7a27f2fc64dbbb2400734e53b293';prefix='docs/promo-video/2026-10-25/full-gameplay-take02/';root=pathlib.Path('/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/full-gameplay-take02');out=pathlib.Path('/private/tmp/lie-736fa-review')
def raw(p,ref=sha):return subprocess.check_output(['git','show',ref+':'+p],cwd=wt)
files=subprocess.check_output(['git','diff','--name-only',sha+'^',sha],cwd=wt,text=True).splitlines();assert len(files)==11
for p in files:
 b=raw(p)
 if p.endswith('.json'):json.loads(b)
 if p.endswith(('.js','.mjs')):
  (out/pathlib.Path(p).name).write_bytes(b);r=subprocess.run(['node','--check','--input-type=module'],input=b,capture_output=True);assert r.returncode==0,(p,r.stderr)
 if p.endswith('.jpg'):(out/'failure.jpg').write_bytes(b)
 if p.endswith('.md'):
  for link in re.findall(r'\]\(([^)]+)\)',b.decode()):assert (wt/pathlib.Path(p).parent/link).exists()
 if p.endswith(('.md','.js','.mjs','.json')):assert not re.search(rb'gh[pousr]_[A-Za-z0-9]{10,}|github_pat_|Authorization:|Bearer [A-Za-z0-9]|[?&]sig=',b),p
flow=raw(prefix+'capture-flow.mjs').decode();old=raw('docs/promo-video/2026-10-25/full-gameplay-take01/capture-flow.js').decode();assert flow.strip()==old.strip()+'\nexport { makeFullGameCapture };'
network=json.loads(raw(prefix+'network.json'));assert network['connections']==1;assert [e['kind'] for e in network['events']]==['created','frame-error','closed'];assert network['events'][0]['elapsedMs'] is None;assert network['events'][1]['category']=='empty' and network['events'][2]['elapsedMs']==4;assert not any(k in json.dumps(network) for k in ['requestId','wss://','headers','token','payloadData'])
verification=json.loads(raw(prefix+'failure-verification.json'));tracks={}
for name in ['input','output','mix']:
 with wave.open(str(root/(name+'.wav')),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate(),f.getnframes())==(1,2,48000,402944);samples=array.array('h',f.readframes(f.getnframes()));assert max(map(abs,samples))==0
 tracks[name]={'samples':402944,'sampleRate':48000,'seconds':402944/48000,'peak':0}
assert tracks==verification['audio']
folders=[p for p in root.iterdir() if p.is_dir() and (p/'frames.json').exists()];assert len(folders)==1;folder=folders[0];frames=json.loads((folder/'frames.json').read_text());assert len(frames)==520;assert {(f['metadata']['deviceWidth'],f['metadata']['deviceHeight'],f['metadata']['pageScaleFactor']) for f in frames}=={(1280,800,1)}
def size(p):
 b=p.read_bytes();i=2
 while i<len(b):
  if b[i]!=255:i+=1;continue
  while b[i]==255:i+=1
  m=b[i];i+=1
  if m in [0xd8,0xd9] or 0xd0<=m<=0xd7:continue
  n=int.from_bytes(b[i:i+2],'big')
  if m in [0xc0,0xc1,0xc2]:return (int.from_bytes(b[i+5:i+7],'big'),int.from_bytes(b[i+3:i+5],'big'))
  i+=n
 raise ValueError(p)
assert all(size(folder/f['file'])==(1280,800) for f in frames)
session=json.loads(raw(prefix+'session.json'));assert not any(e['type']=='question' for e in session['events']);assert session['status']['contexts']==['closed']*3 and session['status']['tracks']==['ended']*3;outcome=json.loads(raw(prefix+'outcome.json'));assert outcome['completed'] is False and outcome['dialogs'][0]['questionAt'] is None
for name in ['session.json','outcome.json','network.json','capture-flow.mjs','recorder.mjs']:assert (root/name).read_bytes()==raw(prefix+name),name
assert raw('media/promo-video/lie-create-preview-share.mp4')==raw('media/promo-video/lie-create-preview-share.mp4','bb1834f');assert raw('media/promo-video/lie-gameplay-audio-test.mp4')==raw('media/promo-video/lie-gameplay-audio-test.mp4','bb1834f')
r={'source':sha,'parent':subprocess.check_output(['git','rev-parse',sha+'^'],cwd=wt,text=True).strip(),'scope':files,'sourceSha256':{p:hashlib.sha256(raw(p)).hexdigest() for p in files},'jsSyntaxAndJsonLinks':'PASS','flowBodyIdentityWithPriorFactory':True,'whitelistSnapshot':'1created(no timestamp),emptyframe-error0ms,closed4ms; no status/private data','rawFrames':520,'metadataAndActualJpegSize':[1280,800],'wavTracks':tracks,'questionSent':False,'cleanup':'3contextsclosed3tracksended; api native/name checks not reference equality','persistentSourceIdentity':'matched session/outcome/network/recorder/flow','oldVideosIdentical':True,'limitations':['No provider/browser/CF/service or recording script execution','No observed handshakeHTTP status or root cause','Cleanup API/native-string observation cannot prove prior reference equality','Outer post-failure export/Network-disable sequence lacks comprehensive finally; current evidence complete, future fault-path concern only']};(out/'result.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:r[k] for k in ['source','rawFrames','flowBodyIdentityWithPriorFactory','oldVideosIdentical']},indent=2))
