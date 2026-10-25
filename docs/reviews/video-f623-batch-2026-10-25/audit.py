import pathlib,subprocess,json,hashlib,wave,array,math,re,tempfile
wt=pathlib.Path('/Users/nighca/.codex/worktrees/promo-video-production/lie');sha='f62309c89ca32a7417a2f32eb0658eee8d7546d4';parent=subprocess.check_output(['git','rev-parse','3c81036'],cwd=wt,text=True).strip();doc='docs/promo-video/2026-10-25/user-tab-recording-take01/'
def raw(p,ref=sha):return subprocess.check_output(['git','show',f'{ref}:{p}'],cwd=wt)
scratch=tempfile.TemporaryDirectory(prefix='lie-f623-audit-');temporary=pathlib.Path(scratch.name);frozen=temporary/'frozen.mp4';frozen.write_bytes(raw('media/promo-video/lie-gameplay-audio-test.mp4'))
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(frozen)]))
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-xerror','-i',str(frozen),'-vn','-c:a','pcm_s16le',str(temporary/'decoded.wav')],check=True)
root=pathlib.Path('/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/user-tab-recording-take01');v=json.loads(raw(doc+'verification.json'));session=json.loads(raw(doc+'session.json'));outcome=json.loads(raw(doc+'outcome.json'));command=json.loads(raw(doc+'render-command.json'));pcm={}
for name in ['input','output','mix']:
 with wave.open(str(root/(name+'.wav')),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate(),f.getnframes())==(1,2,48000,1805056);a=array.array('h',f.readframes(f.getnframes()));pcm[name]=a
 assert max(map(abs,a))==v[name]['peak']
 rms=[round(math.sqrt(sum((x/32768)**2 for x in a[i:i+48000])/len(a[i:i+48000])),4) for i in range(0,len(a),48000)]
 assert rms==v[name]['rmsPerSecond'],name
assert max(abs(m-i-o) for m,i,o in zip(pcm['mix'],pcm['input'],pcm['output']))==v['mixMaxDifferencePcm16']==0
frames=json.loads((root/'voice/frames.json').read_text());assert len(frames)==3030
assert {(f['metadata']['deviceWidth'],f['metadata']['deviceHeight'],f['metadata']['pageScaleFactor']) for f in frames}=={(1280,800,1)}
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
assert len({f['file'] for f in frames})==len(frames)
assert all(size(root/'voice'/f['file'])==(1280,800) for f in frames)
concat=(root/'voice.ffconcat').read_text();references=re.findall(r"^file '([^']+)'$",concat,re.M);assert all(pathlib.Path(p).is_file() for p in references);assert set(references)=={str(root/'voice'/f['file']) for f in frames}
record=next(e for e in session['events'] if e['type']=='record-start');assert command['audioTrimSeconds']==frames[0]['timestamp']-record['at']/1000
assert session['status']['contexts']==['closed']*3 and session['status']['tracks']==['ended']*4;assert outcome['initial']['articles']==2 and outcome['finalState']['articles']==4 and outcome['ready'] and outcome['questionSent'] and not outcome['answerComplete'];assert outcome['errors']==['回答未在30秒内完成']
video=raw('media/promo-video/lie-gameplay-audio-test.mp4');assert hashlib.sha256(video).hexdigest()==v['sha256'] and len(video)==4181726;assert (root/'lie-gameplay-audio-test.mp4').read_bytes()==video
assert probe['format']['duration']=='37.533333' and probe['streams'][0]['r_frame_rate']=='30/1';assert [(s['codec_name'],s.get('pix_fmt'),s.get('sample_rate'),s.get('channels')) for s in probe['streams']]==[('h264','yuv420p',None,None),('aac',None,'48000',1)]
with wave.open(str(temporary/'decoded.wav'),'rb') as f:
 decoded=array.array('h',f.readframes(f.getnframes()));rate=f.getframerate();encodedRms={str(t):math.sqrt(sum((x/32768)**2 for x in decoded[int(t*rate):int((t+1)*rate)])/rate) for t in [0,6,18,30]}
assert encodedRms['0']<.001 and encodedRms['6']>.01 and encodedRms['18']>.01 and encodedRms['30']>.01
assert raw('media/promo-video/lie-create-preview-share.mp4')==raw('media/promo-video/lie-create-preview-share.mp4',parent)
files=subprocess.check_output(['git','diff','--name-only',parent,sha],cwd=wt,text=True).splitlines();textCount=0
for p in files:
 b=raw(p)
 if p.endswith('.json'):json.loads(b)
 if p.endswith(('.md','.json','.js','.txt')):
  textCount+=1;assert not re.search(rb'gh[pousr]_[A-Za-z0-9]{10,}|github_pat_|Authorization:|Bearer [A-Za-z0-9]|[?&]sig=',b),p
  if p.endswith('.md'):
   for link in re.findall(r'\]\(([^)]+)\)',b.decode()):
    if '://' not in link and not link.startswith('#'):assert (wt/pathlib.Path(p).parent/link.split('#')[0]).exists(),(p,link)
  if p.endswith('.js'):
   r=subprocess.run(['node','--check','--input-type=module'],input=b,capture_output=True);assert r.returncode==0,p
for name in ['audio-harness.js','record-once.js','session.json','outcome.json','network.json']:assert (root/name).read_bytes()==raw(doc+name),name
scratch.cleanup()
print(json.dumps({'source':sha,'base':parent,'newScopeFiles':len(files),'newTextFilesChecked':textCount,'videoSha256':v['sha256'],'videoBytes':len(video),'durationSeconds':probe['format']['duration'],'rawFrames':len(frames),'rawJpegDimensions':[1280,800],'frameReferences':len(references),'audioTrimSeconds':command['audioTrimSeconds'],'wavSamplesEach':1805056,'wavPeaks':{n:v[n]['peak'] for n in pcm},'allRmsPerSecondRecomputed':True,'mixMaxDifferencePcm16':0,'encodedAudioRmsAtSeconds':encodedRms,'old73SecondVideoIdentical':True,'outcome':'new question and real answer present, answerComplete false; stopped while speaking after30s','cleanup':'3contextsclosed4tracksended; socketCount0 means not instrumented','sourceFilesMatchPersistentLibrary':True,'limits':['Previous dcc/3ee checks reused by Git identity, not provider rerun','Numeric alignment and sampled frames, no subjective listening or precise mouth-sync proof','No browser/network/provider/service/reencoding/Git or raw writes']},indent=2))
