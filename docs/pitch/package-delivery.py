"""Build a self-contained offline player and static archive from rendered slides.

Run with bundled Python from repository root after build-deck.mjs.
No service, external media, or network dependency is introduced.
"""
from pathlib import Path
import base64, json, html, subprocess
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
root=Path.cwd(); build=root/'tmp/pitch/build'; out=root/'tmp/pitch/output'
entries=json.loads((build/'entries.json').read_text())
proto=json.loads((build/'deck.json').read_text())
images=[]
for i in range(1,len(entries)+1):
    b=(out/f'slide-{i:02}.png').read_bytes()
    images.append('data:image/png;base64,'+base64.b64encode(b).decode())
video=Path('/Users/nighca/.codex/worktrees/lie-promo-production/lie/media/promo-video/2026-10-30-landscape-v3/lie-landscape-v3.mp4')
video_data='data:video/mp4;base64,'+base64.b64encode(video.read_bytes()).decode()
# Stable PDF pages match inspected 1920x1080 renders. Editable text remains in PPTX.
c=canvas.Canvas(str(out/'LIE-roadshow-v1.pdf'),pagesize=(960,540))
c.setTitle('LIE 中文路演'); c.setAuthor('LIE')
for i in range(1,len(entries)+1):
    c.drawImage(ImageReader(str(out/f'slide-{i:02}.png')),0,0,960,540)
    if i==11:c.linkURL('https://lie.agency/',(40,140,530,225),relative=0)
    c.showPage()
c.save()
notes=[]
for i,e in enumerate(entries):
    # Plain language cue sheet is maintained separately from source metadata.
    notes.append(f"{i+1}. {e['title']} ({e['seconds']}秒)" if e['seconds'] else f"备页{i-10}. {e['title']}")
backup=out/'LIE-voice-backup-28.5s.mp4'
if not backup.exists():
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-ss','13.5','-i',str(root/'media/promo-video/lie-demo.mp4'),'-t','28.5','-c:v','libx264','-crf','18','-preset','fast','-c:a','aac','-b:a','128k','-movflags','+faststart',str(backup)],check=True)
record='data:video/mp4;base64,'+base64.b64encode((out/'LIE-voice-backup-28.5s.mp4').read_bytes()).decode()
settings={'record':record,'images':images,'titles':[e['title'] for e in entries],'video':video_data}
script=r'''
const data=__DATA__;let index=0,videoOpen=false,helpOpen=false;const mainCount=11;
const screen=document.getElementById('screen'),film=document.getElementById('film'),status=document.getElementById('status');
film.src='';
function closeVideo(){film.pause();film.hidden=true;videoOpen=false;screen.hidden=false;}
function show(n){closeVideo();index=Math.max(0,Math.min(data.images.length-1,n));screen.src=data.images[index];screen.alt=data.titles[index];status.textContent=index<mainCount?`${index+1} / ${mainCount}`:`问答 ${index-mainCount+1} / ${data.images.length-mainCount}`;document.title=`LIE · ${index+1} · ${data.titles[index]}`;document.getElementById('play').hidden=index!==2;document.getElementById('record').hidden=index!==2;}
function forward(){show(index===10?10:index+1);}
function movie(kind='promo'){if(videoOpen){closeVideo();return;}videoOpen=true;screen.hidden=true;film.src=kind==='record'?data.record:data.video;film.hidden=false;film.currentTime=0;film.play().catch(()=>{});}
function full(){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();}
function help(){helpOpen=!helpOpen;document.getElementById('help').hidden=!helpOpen;}
document.getElementById('prev').onclick=()=>show(index-1);document.getElementById('next').onclick=forward;document.getElementById('full').onclick=full;document.getElementById('play').onclick=()=>movie('promo');document.getElementById('record').onclick=()=>movie('record');document.getElementById('qa').onclick=()=>show(11);document.getElementById('guide').onclick=help;
film.onended=closeVideo;screen.onclick=forward;
document.onkeydown=e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const key=e.key.toLowerCase();if(key==='escape'){closeVideo();if(helpOpen)help();return;}if(helpOpen){if(key==='h'||key==='?')help();return;}if(videoOpen&&key===' '){e.preventDefault();if(film.paused)film.play().catch(()=>{});else film.pause();return;}if(['arrowright','pagedown',' '].includes(key)){e.preventDefault();forward();}else if(['arrowleft','pageup'].includes(key)){e.preventDefault();show(index-1);}else if(key==='home')show(0);else if(key==='end')show(10);else if(key==='v'&&index===2)movie('promo');else if(key==='r'&&index===2)movie('record');else if(key==='f')full();else if(key==='b')show(11);else if(key==='h'||key==='?')help();};show(0);
'''.replace('__DATA__',json.dumps(settings,ensure_ascii=False))
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LIE 路演</title><style>
*{box-sizing:border-box}body{margin:0;background:#111b45;color:#fffef7;font:16px system-ui}main{width:100vw;height:100vh;display:grid;place-items:center}#screen,#film{display:block;max-width:100vw;max-height:100vh;width:min(100vw,177.777vh);aspect-ratio:16/9;object-fit:contain}#film[hidden],#screen[hidden],[hidden]{display:none!important}nav{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:8px 12px;background:#111b45eb;border-radius:10px;opacity:0;transition:opacity .2s}nav:hover,nav:focus-within,body.show-controls nav{opacity:1}button,a{font:inherit;color:inherit;background:transparent;border:1px solid #fffef75a;padding:7px 12px;border-radius:6px;cursor:pointer;text-decoration:none}button:hover,a:hover{background:#075bfa}#status{min-width:80px;text-align:center}#help{position:fixed;inset:10vh 12vw;padding:32px 40px;overflow:auto;background:#fffef7;color:#111b45;border:4px solid #075bfa;border-radius:18px;line-height:1.9}#help h1{margin:0 0 16px}#help button{color:#075bfa;border-color:#075bfa}.hint{position:fixed;top:16px;right:20px;background:#111b45eb;padding:9px 14px;border-radius:6px;animation:hide 5s forwards;pointer-events:none}@keyframes hide{0%,65%{opacity:1}100%{opacity:0}}
</style><main><img id="screen" alt=""><video id="film" controls preload="metadata" hidden playsinline></video></main><nav aria-label="放映控制"><button id="prev">上一页</button><span id="status"></span><button id="next">下一页</button><button id="record" hidden>实录备用 R</button><button id="play" hidden>宣传片 V</button><button id="qa">问答 B</button><button id="full">全屏 F</button><button id="guide">帮助 H</button></nav><div class="hint">方向键翻页 · F 全屏 · H 帮助</div><section id="help" hidden><h1>LIE 本地放映</h1><p>方向键 / 空格翻页；F 全屏；Home 回到开场；End 回到试玩入口；B 打开问答备页。鼠标移到下方可见操作栏。</p><p>第 3 页优先切到官网，现场完成一问一答与一次切人核对，约 90 秒后返回。按 R 播放或收起历史真人问答备用片段（28.5 秒，取自原片 13.5–42.0 秒，保留真实玩家与角色声音）。按 V 切换约 54 秒宣传短片。声音由浏览器在主动播放后输出，可用视频控件调音量。宣传片含历史界面、BGM 与音效，无真实玩家或 AI 问答原声；R 实录则保留原声。两者不是最新版本的性能证据。Esc 收起短片或帮助。</p><p>主讲 11 页，预算 9 分 20 秒，包含约 90 秒现场问答和约 45 秒编辑器操作。备用实录或宣传片用于替换现场环节，不叠加计时。后 5 页为问答备页。实际产品演示另开官网；本文件不会开启麦克风、语音服务或上传数据。</p><p><a href="https://lie.agency/" target="_blank" rel="noopener">打开产品</a> <a href="https://lie.agency/editor" target="_blank" rel="noopener">打开编辑器</a></p><p>视频画面含 AI 生成人物素材，视频由程序合成。BGM：Cat Walk — Arulo（Mixkit）。</p><button onclick="help()">关闭帮助</button></section><script>__SCRIPT__</script></html>'''.replace('__SCRIPT__',script)
(out/'LIE-roadshow-v1.html').write_text(page)
print(f'Packaged {len(entries)} pages; PDF {(out/"LIE-roadshow-v1.pdf").stat().st_size}; HTML {(out/"LIE-roadshow-v1.html").stat().st_size}')
