
const sizes = [[320,700],[391,844],[620,900],[621,900],[700,900],[701,900],[850,900],[851,900],[900,900],[901,900],[1150,900],[1151,900],[900,600],[1136,835],[1280,600],[1280,720],[1440,900],[1920,1400],[2272,1670]]
const size = document.querySelector('#size'),scene=document.querySelector('#scene'), frame=document.querySelector('iframe'),stage=document.querySelector('#stage'),label=document.querySelector('#label')
for(const [w,h] of sizes) size.add(new Option(`${w} × ${h}`,`${w},${h}`,false,w===1920))
function resize(){const [w,h]=size.value.split(',').map(Number);const scale=Math.min(1,(innerWidth-32)/w,(innerHeight-80)/h);frame.width=w;frame.height=h;frame.style.transform=`scale(${scale})`;stage.style.width=`${w*scale}px`;stage.style.height=`${h*scale}px`;label.textContent=`${w} × ${h}，${Math.round(scale*100)}%展示`}
function load(){frame.src=scene.value==='home'?'/?demo=1':`scene.html?count=${scene.value==='three'?3:scene.value==='four'?4:8}${scene.value==='static'?'&static=1':''}`}
size.onchange=resize;scene.onchange=load;window.onresize=resize;resize();load()
