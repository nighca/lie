import array, collections, hashlib, json, math, subprocess, sys, wave
from pathlib import Path
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent
outcome=json.loads((root/'outcome.json').read_text())
if not outcome['complete']: raise SystemExit('Full flow incomplete; refusing accepted output')
frames=[]
for name in outcome['segments']:
 part=json.loads((root/name/'frames.json').read_text())
 for frame in part: frame['path']=str(root/name/frame['file'])
 frames.extend(part)
frames.sort(key=lambda frame:frame['timestamp'])
end=json.loads((root/outcome['segments'][-1]/'segment.json').read_text())['endTimestamp']
lines=['ffconcat version 1.0'];gaps=[]
for i,frame in enumerate(frames):
 duration=(frames[i+1]['timestamp'] if i+1<len(frames) else end)-frame['timestamp']
 if duration>0.5:gaps.append({'at':frame['timestamp'],'seconds':duration})
 lines.extend(["file '"+frame['path']+"'",'duration '+str(max(0.000001,duration))])
lines.append("file '"+frames[-1]['path']+"'")
(root/'video.ffconcat').write_text('\n'.join(lines)+'\n')
session=json.loads((root/'session.json').read_text())
start=next(e for e in session['events'] if e['type']=='record-start')['at']/1000
offset=frames[0]['timestamp']-start
command=['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(root/'video.ffconcat'),'-i',str(root/'mix.wav'),'-filter_complex',f'[0:v]scale=1280:800:in_range=full:out_range=tv,fps=30[v];[1:a]atrim=start={offset},asetpts=PTS-STARTPTS[a]','-map','[v]','-map','[a]','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-color_range','tv','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',str(root/'lie-play-game-complete.mp4')]
subprocess.run(command,check=True)
subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(root/'lie-play-game-complete.mp4'),'-f','null','-'],check=True)
tracks=[];verification={'audioTrimSeconds':offset,'video':{'frames':len(frames),'sizes':list(map(list,collections.Counter((f['metadata']['deviceWidth'],f['metadata']['deviceHeight'],f['metadata']['pageScaleFactor']) for f in frames).items())),'heldGaps':gaps},'audio':{}}
for name in ['input','output','mix']:
 with wave.open(str(root/(name+'.wav'))) as w:
  samples=array.array('h',w.readframes(w.getnframes()));rate=w.getframerate();tracks.append(samples)
  verification['audio'][name]={'samples':len(samples),'sampleRate':rate,'seconds':len(samples)/rate,'peak':max(map(abs,samples),default=0),'rmsPerSecond':[round(math.sqrt(sum(s*s for s in samples[i:i+rate])/max(1,len(samples[i:i+rate])))/32768,5) for i in range(0,len(samples),rate)]}
verification['mixMaxDifferencePcm16']=max(abs(a+b-c) for a,b,c in zip(*tracks))
verification['mp4']=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,sample_rate,channels:format=duration,size','-of','json',str(root/'lie-play-game-complete.mp4')],text=True))
verification['sha256']=hashlib.sha256((root/'lie-play-game-complete.mp4').read_bytes()).hexdigest();verification['decode']='ffmpeg -xerror passed'
(root/'verification.json').write_text(json.dumps(verification,indent=2))
(root/'render-command.json').write_text(json.dumps(command,indent=2))
print(json.dumps({k:v for k,v in verification.items() if k!='audio'},indent=2))
