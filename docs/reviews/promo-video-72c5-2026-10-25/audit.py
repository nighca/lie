import pathlib,json,hashlib,subprocess,re,struct,base64,gzip,urllib.parse,tempfile
wt=pathlib.Path('/Users/nighca/.codex/worktrees/promo-video-production/lie');sha='72c5b49a2a3f913bbb725abbaaa655d14bd84b59'
def obj(p):return subprocess.check_output(['git','show',f'{sha}:{p}'],cwd=wt)
meta=json.loads(obj('docs/promo-video/2026-10-25/complete-metadata.json'));root=pathlib.Path(meta['rawLibrary']);expected=[];segments=[];dimensions=set();count=0;clamps=[];nonpositive=[];duration=0
# Inspect actual JPEG SOF headers, no resampling/re-encoding.
def jpgsize(p):
 b=p.read_bytes();assert b[:2]==b'\xff\xd8';i=2
 while i<len(b):
  if b[i]!=255:i+=1;continue
  while b[i]==255:i+=1
  marker=b[i];i+=1
  if marker in [0xd8,0xd9] or 0xd0<=marker<=0xd7:continue
  n=int.from_bytes(b[i:i+2],'big')
  if marker in [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]:return (int.from_bytes(b[i+5:i+7],'big'),int.from_bytes(b[i+3:i+5],'big'))
  i+=n
 raise ValueError(p)
lines=['ffconcat version 1.0']
for sm in meta['segments']:
 name=sm['name'];folder=root/name;frames=json.loads((folder/'frames.json').read_text());s=json.loads((folder/'segment.json').read_text());assert len(frames)==sm['frames']==s['frames'];assert s['endTimestamp']==sm['endTimestamp'] and frames[0]['timestamp']==sm['firstTimestamp'];assert len({f['file'] for f in frames})==len(frames)
 assert set(f['file'] for f in frames)==set(p.name for p in folder.glob('frame-*.jpg'))
 for i,f in enumerate(frames):
  assert pathlib.Path(f['file']).name==f['file'];assert f['timestamp']==f['metadata']['timestamp'];assert (f['metadata']['deviceWidth'],f['metadata']['deviceHeight'],f['metadata']['pageScaleFactor'])==(1280,800,1)
  size=jpgsize(folder/f['file']);dimensions.add(size);assert size==(1280,800)
  end=frames[i+1]['timestamp'] if i+1<len(frames) else s['endTimestamp'];delta=end-f['timestamp']
  if delta<.001:clamps.append({'segment':name,'frame':i,'delta':delta})
  if delta<=0:nonpositive.append({'segment':name,'frame':i,'delta':delta})
  dt=max(.001,delta);duration+=dt
  lines.extend([f"file '{folder/f['file']}'",'option framerate 1000',f'duration {dt:.6f}']);count+=1
 segments.append({**s,'firstTimestamp':frames[0]['timestamp']})
lines.extend([lines[-3],'option framerate 1000']);assert count==3070;assert segments==json.loads((root/'segments.json').read_text())==meta['segments']
# Original concat stores temporary-root absolute references; relocation to persistent input is exact.
original=(root/'recording.ffconcat').read_text();relocated=original.replace('/private/tmp/lie-promo-complete-20261025',str(root));assert relocated=='\n'.join(lines)+'\n'
assert all(pathlib.Path(x[6:-1]).is_file() for x in lines if x.startswith("file '"))
video=obj('media/promo-video/lie-create-preview-share.mp4');assert len(video)==3751699;assert hashlib.sha256(video).hexdigest()==meta['sha256'];assert (root/'lie-create-preview-share.mp4').read_bytes()==video
with tempfile.TemporaryDirectory(prefix='lie-video72-probe-') as directory:
 frozen=pathlib.Path(directory)/'frozen.mp4';frozen.write_bytes(video)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(frozen)]))
assert probe['streams']==meta['probe']['streams'];assert {k:v for k,v in probe['format'].items() if k!='filename'}=={k:v for k,v in meta['probe']['format'].items() if k!='filename'}
url=obj('docs/promo-video/2026-10-25/complete-share-link.txt').decode().strip();assert len(url)==1349;assert url==(root/'share-link.txt').read_text().strip();payload=urllib.parse.urlsplit(url).fragment.removeprefix('game=');game=json.loads(gzip.decompress(base64.urlsafe_b64decode(payload+'='*(-len(payload)%4))));assert game==json.loads(obj('docs/promo-video/2026-10-25/complete-demo-case.json'));assert meta['identity']==json.loads((root/'recording-identity.json').read_text())
for p in ['docs/promo-video/2026-10-25/complete-metadata.json','docs/promo-video/2026-10-25/complete-demo-case.json']:json.loads(obj(p))
compile(obj('docs/promo-video/2026-10-25/rebuild-complete.py'),'rebuild-complete.py','exec')
result={'source':sha,'videoSha256':meta['sha256'],'videoBytes':len(video),'duration':probe['format']['duration'],'acceptedFrames':count,'actualJpegDimensions':sorted(dimensions),'concatDurationSum':duration,'clampedIntervals':len(clamps),'nonpositiveIntervals':len(nonpositive),'clampExamples':clamps[:4],'segments':segments,'concatRelocation':'exact after replacing original temporary root with persistent rawLibrary; no original files written','shareCharacters':len(url),'decodedShareMatchesDemo':True,'mediaMetadataMatches':True,'rawLibraryVideoMatches':True,'limitations':['No encoding/re-recording or overwrite of source library','No independent proof of OS clipboard/new-tab URL runtime; scope verified from user record, media, metadata and saved link','Contact sheet/endpoints inspected; not all video frames manually viewed']};print(json.dumps(result,indent=2))
