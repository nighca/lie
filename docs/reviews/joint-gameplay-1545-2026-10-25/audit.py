import subprocess,json,pathlib,hashlib,wave,array,math,ast,re
wt='/Users/nighca/.codex/worktrees/promo-video-production/lie'; sha='1545c1f0aeabe7e3e2af310eb53b4e1a674af790'; base='736fae1ac67b7a27f2fc64dbbb2400734e53b293'; pre='docs/promo-video/2026-10-25/joint-gameplay-recording/'
out=pathlib.Path('/private/tmp/lie-joint-1545-review'); paths=subprocess.check_output(['git','diff','--name-only','-z',base,sha],cwd=wt,text=True).strip('\0').split('\0'); data={p:subprocess.check_output(['git','show',sha+':'+p],cwd=wt) for p in paths}; result={'sha':sha,'base':base,'files':{},'media':{}}
for p,b in data.items():
 s=b.decode(); entry={'sha256':hashlib.sha256(b).hexdigest()}
 if p.endswith('.json'): json.loads(s);entry['json']='pass'
 if p.endswith(('.js','.mjs')):
  r=subprocess.run(['node','--check','--input-type='+('module' if p.endswith('.mjs') else 'commonjs')],input=s,text=True,capture_output=True);entry['syntax']=r.returncode;assert r.returncode==0,r.stderr
 if p.endswith('.py'):ast.parse(s);entry['syntax']='pass'
 assert not re.search(r'(?i)(authorization\s*[:=]\s*["\x27]?bearer|cookie\s*[:=]\s*["\x27][^"\x27]+|-----BEGIN .*PRIVATE KEY)',s),p
 result['files'][p]=entry
 if p.endswith(('session.json','outcome-sanitized.json','outcome.json','outer-cleanup.json','network.json')):entry['summary']=json.loads(s)
root=pathlib.Path('/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/joint-gameplay-take03')
ver=json.loads(data[pre+'verification.json']); pv=json.loads(data[pre+'preview-verification.json']); result['verificationKeys']=list(ver)
for name in ['lie-play-game-complete.mp4','lie-gameplay-complete-preview.mp4']:
 p=root/name; probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,sample_rate,channels:format=duration,size','-of','json',str(p)],text=True));digest=hashlib.sha256(p.read_bytes()).hexdigest(); assert digest==(ver['sha256'] if name.startswith('lie-play') else pv['sha256']);r=subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(p),'-f','null','-'],capture_output=True); assert r.returncode==0,r.stderr;result['media'][name]={'sha256':digest,'probe':probe,'fullDecode':'pass'}
tracks=[]
for name in ['input','output','mix']:
 with wave.open(str(root/(name+'.wav'))) as w:
  a=array.array('h',w.readframes(w.getnframes()));rate=w.getframerate();assert w.getnchannels()==1 and w.getsampwidth()==2;tracks.append(a); calc={'samples':len(a),'sampleRate':rate,'seconds':len(a)/rate,'peak':max(map(abs,a)),'rmsPerSecond':[round(math.sqrt(sum(s*s for s in a[i:i+rate])/max(1,len(a[i:i+rate])))/32768,5) for i in range(0,len(a),rate)]};assert calc==ver['audio'][name];result['media'][name+'.wav']={k:v for k,v in calc.items() if k!='rmsPerSecond'}
assert len(set(map(len,tracks)))==1
result['mixMaxDifferencePcm16']=max(abs(a+b-c) for a,b,c in zip(*tracks));assert result['mixMaxDifferencePcm16']==ver['mixMaxDifferencePcm16']
start,end=pv['removedSilentIntervalSeconds'];offset=ver['audioTrimSeconds'];interval=tracks[2][int((start+offset)*rate):int((end+offset)*rate)];result['removedGapPcmPeak']=max(map(abs,interval),default=0);assert result['removedGapPcmPeak']==0
# Parse only frame metadata, never display transcripts or frame pixels.
segments=['01-home-entry','02-human-play','03-human-play','04-result-home'];frames=[]
for seg in segments:
 part=json.loads((root/seg/'frames.json').read_text());assert all((root/seg/f['file']).is_file() for f in part);frames+=part
frames.sort(key=lambda f:f['timestamp']);assert len(frames)==ver['video']['frames'];assert all((f['metadata']['deviceWidth'],f['metadata']['deviceHeight'],f['metadata']['pageScaleFactor'])==(1280,800,1) for f in frames)
session=json.loads(data[pre+'session.json']);epoch=next(e['at'] for e in session['events'] if e['type']=='record-start')/1000;assert abs(frames[0]['timestamp']-epoch-offset)<1e-9
last=json.loads((root/segments[-1]/'segment.json').read_text())['endTimestamp'];gaps=[{'at':f['timestamp'],'seconds':(frames[i+1]['timestamp'] if i+1<len(frames) else last)-f['timestamp']} for i,f in enumerate(frames) if (frames[i+1]['timestamp'] if i+1<len(frames) else last)-f['timestamp']>.5];assert gaps==ver['video']['heldGaps'];result['frames']={'count':len(frames),'sizes':'1280x800 scale1','offsetSeconds':offset,'gaps':gaps}
result['status']=subprocess.check_output(['git','status','--short'],cwd=wt,text=True)
(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({'files':len(paths),'media':result['media'],'frames':result['frames'],'mixDifference':result['mixMaxDifferencePcm16'],'removedGapPeak':result['removedGapPcmPeak'],'status':result['status']},ensure_ascii=False))
