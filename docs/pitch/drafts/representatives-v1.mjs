import fs from 'node:fs/promises';
import path from 'node:path';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
import sharp from 'sharp';
const root='/Users/nighca/.codex/worktrees/e6ff/lie';
const build=path.join(root,'tmp/pitch/build');
const out=path.join(root,'tmp/pitch/output');
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={yellow:'#FFF18A',white:'#FFFEF7',ink:'#111B45',blue:'#075BFA',muted:'#52607A',aqua:'#78DDD7'};
function text(s,str,x,y,w,h,size=30,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',name:str.slice(0,22),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=str;a.text.insets=0;a.text.style={fontFamily:'Heiti SC',fontSize:size,color,bold};return a;}
function box(s,x,y,w,h,fill=C.white){return s.shapes.add({geometry:'roundRect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:C.ink,width:3},borderRadius:22});}
async function img(s,file,x,y,w,h,alt){const b=await fs.readFile(path.join(root,file));s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:file.endsWith('.svg')?'image/svg+xml':'image/png',alt,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
await sharp(path.join(root,'design/brand/logo.svg')).resize(660,353).png().toFile(path.join(build,'logo.png'));
const logo=path.relative(root,path.join(build,'logo.png'));
{
const s=p.slides.add();s.background.fill=C.yellow;
await img(s,logo,72,48,255,136,'LIE正式字标');
text(s,'轻松开口，\n认真推理。',76,235,640,190,76,C.ink,true);
text(s,'AI 语音推理游戏与创作平台',80,477,620,56,32,C.ink,true);
text(s,'lie.agency',80,612,420,40,26,C.blue,true);
await img(s,'design/character-presets/assets/coral-bob/default.png',660,134,625,585,'LIE珊瑚短发原创人物');
s.speakerNotes.text='20秒。今天介绍LIE。玩家可以自由询问AI角色、核对说法并作出指认，也可以创作自己的案件分享给朋友。来源：README.zh-CN.md；design/brand/logo.svg；design/character-presets/assets/coral-bob/default.png。原始品牌与人物未改色变形。';
}
{
const s=p.slides.add();s.background.fill=C.white;
text(s,'问什么、先问谁，由玩家决定',64,48,1130,75,48,C.ink,true);
await img(s,'docs/design/character-layout/official-investigation.png',58,164,850,478,'游戏调查界面演示模式截图');
text(s,'自由追问',954,189,270,55,36,C.blue,true);
text(s,'沿着细节继续问',954,248,270,50,25);
text(s,'换人核对',954,332,270,55,36,C.blue,true);
text(s,'比较各自的经历',954,391,270,50,25);
text(s,'作出指认',954,475,270,55,36,C.blue,true);
text(s,'选对才揭晓经过',954,534,270,50,25);
text(s,'4 个官方案件，人物与询问时长各不相同',64,662,900,35,25,C.muted);
s.speakerNotes.text='40秒。这张图展示界面，截图来自演示模式，不作为真实模型回答证据。角色交流只有语音，转写只读；玩家可切换人物核对。询问时间共享；正确指认揭完整经过，错误结束且不揭真相。来源：docs/design/character-layout/official-investigation.png；README.zh-CN.md；content/games。下一张在全稿中衔接真实声音演示，现有宣传片没有真实问答原声。';
}
{
const s=p.slides.add();s.background.fill=C.yellow;
text(s,'浏览器运行游戏，AI 表达角色',64,48,1160,74,48,C.ink,true);
text(s,'固定规则与自由对话各有职责',66,131,1080,46,28,C.muted);
const browser=box(s,64,240,430,275); const worker=box(s,584,285,255,185); const ai=box(s,929,285,287,185);
text(s,'浏览器',94,269,350,50,36,C.ink,true);
text(s,'案件与人物设定\n会话、历史和询问额度\n固定答案与指认结果',94,340,355,140,27);
text(s,'薄语音网关',608,319,215,50,31,C.ink,true);
text(s,'保管连接凭据\n转发语音协议',608,382,215,80,25);
text(s,'灵矽 AI 服务',954,319,240,50,31,C.ink,true);
text(s,'理解玩家的问题\n组织角色的回答',954,382,240,80,25);
s.shapes.connect(browser,worker,{kind:'straight',fromSide:'right',toSide:'left',line:{fill:C.blue,width:4},head:{type:'arrow'},tail:{type:'arrow'}});
s.shapes.connect(worker,ai,{kind:'straight',fromSide:'right',toSide:'left',line:{fill:C.blue,width:4},head:{type:'arrow'},tail:{type:'arrow'}});
text(s,'规则由程序判定，角色回答由 AI 生成',64,565,1140,60,36,C.blue,true);
text(s,'游戏内容在浏览器可检查；供应商凭据保留在服务端',64,648,1140,37,24,C.muted);
s.speakerNotes.text='60秒。架构图为原生可编辑对象。游戏状态与固定答案留在浏览器，AI负责角色表达，薄Worker保管凭据并传输协议。无需常驻游戏服务器或游戏状态数据库；不意味着语音AI无成本，也不证明多人并发与费用硬限额已解决。来源：docs/architecture-design.md；packages/game-core/src/session.ts；apps/gateway/src/index.ts；README.zh-CN.md。';
}
await fs.mkdir(out,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const png=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(out,`representative-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));}
await (await PresentationFile.exportPptx(p)).save(path.join(build,'representatives-draft.pptx'));
await fs.writeFile(path.join(build,'representatives.json'),JSON.stringify(p.toProto()));
console.log('Rendered 3 representative pages.');
