import subprocess,json,hashlib,math
from pathlib import Path
import numpy as np
root=Path('/private/tmp/lie-demo-qa')
out=Path('/Users/nighca/.codex/worktrees/promo-demo-merge/lie/media/promo-video/lie-demo.mp4')
game=Path('/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/joint-gameplay-take03/lie-gameplay-complete-preview.mp4')
creation=Path('/Users/nighca/.codex/worktrees/promo-video-production/lie/media/promo-video/lie-create-preview-share.mp4')
def run(cmd): return subprocess.check_output(cmd)
def audio(path):return np.frombuffer(run(['ffmpeg','-v','error','-i',str(path),'-map','0:a:0','-ac','1','-ar','48000','-f','f32le','-']),dtype='<f4').astype('float64')
def rms(x):return float(np.sqrt(np.mean(x*x))) if len(x) else 0
x=audio(game);y=audio(out)
n=min(len(x),5473600,len(y));a=x[:n];b=y[:n]
windows=[]
for sec in range(math.ceil(n/48000)):
 p=sec*48000;q=min(p+48000,n);aa=a[p:q];bb=b[p:q];rr=rms(aa)
 windows.append({'startSeconds':sec,'sourceRms':rr,'outputRms':rms(bb),'correlation':float(np.corrcoef(aa,bb)[0,1]) if rr>1e-4 and rms(bb)>1e-4 else None})
voiced=[w for w in windows if w['sourceRms']>.005]
boundary=5473600
silence=y[boundary:boundary+3523200]
# PTS in encoded packet order may be reordered with B frames; DTS must remain strict.
pack=json.loads(run(['ffprobe','-v','error','-show_packets','-show_entries','packet=stream_index,pts,dts,duration','-of','json',str(out)]))['packets']
packet_checks=[]
for stream in (0,1):
 ps=[p for p in pack if p['stream_index']==stream];ds=[int(p['dts']) for p in ps if 'dts'in p];pt=[int(p['pts']) for p in ps if 'pts'in p]
 packet_checks.append({'stream':stream,'packets':len(ps),'dtsStrictlyIncreasing':all(a<b for a,b in zip(ds,ds[1:])),'ptsUnique':len(pt)==len(set(pt)),'dtsFirst':ds[0],'dtsLast':ds[-1]})
frames=json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp','-of','json',str(out)]))['frames']
fts=[int(z['best_effort_timestamp'])for z in frames]
# Selected decoded grayscale frames compare source content, while allowing lossy re-encode.
def selected(path,indices,label):
 filt='select='+ '+'.join('eq(n\\,%d)'%i for i in indices)
 raw=run(['ffmpeg','-v','error','-i',str(path),'-vf',filt,'-fps_mode','passthrough','-pix_fmt','gray','-f','rawvideo','-'])
 data=np.frombuffer(raw,dtype=np.uint8).reshape(-1,800,1280)
 assert len(data)==len(indices),(label,len(data),indices)
 # PNG evidence is exact extracted output, not a synthetic reconstruction.
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-vf',filt,'-fps_mode','passthrough',str(root/(label+'-%02d.png'))],check=True)
 return dict(zip(indices,data))
gf=selected(game,[0,3418],'source-game')
cf=selected(creation,[0,3,2201],'source-creation')
of=selected(out,[0,3418,3419,3420,3421,3424,5622],'output')
pairs=[(0,gf[0],'game first'),(3418,gf[3418],'game last'),(3419,gf[3418],'game padded last 1'),(3420,gf[3418],'game padded last 2'),(3421,cf[0],'creation first'),(3424,cf[3],'creation 0.1 seconds'),(5622,cf[2201],'creation last')]
comparisons=[]
for frame,source,label in pairs:
 diff=of[frame].astype(float)-source.astype(float);mse=float(np.mean(diff*diff))
 comparisons.append({'frame':frame,'label':label,'grayPsnrDb':10*math.log10(255**2/mse) if mse else None,'meanAbsGrayDifference':float(np.mean(np.abs(diff))),'outputMean':float(np.mean(of[frame]))})
decode=subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(out),'-f','null','-'],capture_output=True,text=True)
result={'output':str(out),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'bytes':out.stat().st_size,'decodeExitCode':decode.returncode,'decodeStderr':decode.stderr,'sourceAudioSamples':len(x),'outputAudioDecodedSamples':len(y),'firstSegmentCorrelation':float(np.corrcoef(a,b)[0,1]),'sourcePeak':float(np.max(np.abs(a))),'outputFirstPeak':float(np.max(np.abs(b))),'sourceLastAbsAbove001Seconds':float((np.flatnonzero(np.abs(a)>.001)[-1]+1)/48000),'outputLastAbsAbove001Seconds':float((np.flatnonzero(np.abs(y)>.001)[-1]+1)/48000),'voicedWindowCount':len(voiced),'voicedWindowMinimumCorrelation':min(w['correlation']for w in voiced),'voicedWindowMinimumOutputToSourceRmsRatio':min(w['outputRms']/w['sourceRms']for w in voiced),'voicedWindowMaximumOutputToSourceRmsRatio':max(w['outputRms']/w['sourceRms']for w in voiced),'creationSilenceSamples':len(silence),'creationSilencePeak':float(np.max(np.abs(silence))),'creationSilenceRms':rms(silence),'seamOneSecondRms':rms(y[boundary-24000:boundary+24000]),'packetChecks':packet_checks,'videoDecodedFrames':len(fts),'videoPtsStrictlyIncreasing':all(a<b for a,b in zip(fts,fts[1:])),'videoPtsDeltaUnique':sorted(set(b-a for a,b in zip(fts,fts[1:]))),'frameComparisons':comparisons,'perSecondAudioWindows':windows}
(root/'independent-qa.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items()if k!='perSecondAudioWindows'},indent=2))
