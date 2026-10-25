import json, pathlib, subprocess, sys
root=pathlib.Path(sys.argv[1])
lines=['ffconcat version 1.0']
segments=[]
for name in ['01-home-story','02-first-character','03-second-character','04-ending-preview']:
 folder=root/name
 frames=json.loads((folder/'frames.json').read_text())
 meta=json.loads((folder/'segment.json').read_text())
 segments.append({**meta,'firstTimestamp':frames[0]['timestamp']})
 for i,frame in enumerate(frames):
  end=frames[i+1]['timestamp'] if i+1<len(frames) else meta['endTimestamp']
  duration=max(.001,end-frame['timestamp'])
  lines.extend([f"file '{folder/frame['file']}'",'option framerate 1000',f'duration {duration:.6f}'])
lines.extend([lines[-3],'option framerate 1000'])
(root/'recording.ffconcat').write_text('\n'.join(lines)+'\n')
(root/'segments.json').write_text(json.dumps(segments,indent=2)+'\n')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(root/'recording.ffconcat'),'-vf','fps=30,scale=in_range=full:out_range=tv,format=yuv420p,setsar=1','-c:v','libx264','-preset','fast','-crf','18','-color_range','tv','-movflags','+faststart',str(root/'lie-home-create-game.mp4')],check=True)
