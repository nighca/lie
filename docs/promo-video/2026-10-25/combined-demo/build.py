import argparse
import hashlib
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('gameplay', type=Path)
parser.add_argument('creation', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
filters = (
    '[0:v]fps=30,tpad=stop=2:stop_mode=clone,format=yuv420p,setsar=1,setpts=N/(30*TB)[v0];'
    '[0:a]aresample=48000,apad=whole_len=5473600,atrim=end_sample=5473600,asetpts=PTS-STARTPTS[a0];'
    '[1:v]fps=30,format=yuv420p,setsar=1,setpts=N/(30*TB)[v1];'
    '[2:a]atrim=end_sample=3523200,asetpts=PTS-STARTPTS[a1];'
    '[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
)
command = [
    'ffmpeg', '-v', 'error', '-y', '-i', str(args.gameplay), '-i', str(args.creation),
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-filter_complex', filters,
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
    '-r', '30', '-fps_mode', 'cfr', '-pix_fmt', 'yuv420p', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '1',
    '-movflags', '+faststart', str(args.output),
]
subprocess.run(command, check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(args.output), '-f', 'null', '-'], check=True)
probe = json.loads(subprocess.check_output([
    'ffprobe', '-v', 'error', '-show_entries',
    'stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,sample_rate,channels,duration,nb_frames:format=duration,size',
    '-of', 'json', str(args.output),
], text=True))
video = next(stream for stream in probe['streams'] if stream['codec_name'] == 'h264')
assert video['nb_frames'] == '5623', video
metadata = {
    'inputs': [{'name': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in [args.gameplay, args.creation]],
    'gameplayBoundarySeconds': 3421 / 30,
    'creationDurationSeconds': 2202 / 30,
    'gameplayAudioSamples': 5473600,
    'creationSilentSamples': 3523200,
    'probe': probe,
    'outputSha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
    'decode': 'ffmpeg -xerror passed',
    'command': command,
}
(Path(__file__).resolve().parent / 'build-verification.json').write_text(json.dumps(metadata, indent=2))
print(json.dumps({key: value for key, value in metadata.items() if key != 'command'}, indent=2))
