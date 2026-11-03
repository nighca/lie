// Unapproved architecture-only layout preview; does not rebuild the roadshow.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Presentation} from '@oai/artifact-tool';
const root=process.cwd(),out=root+'/tmp/pitch/architecture-v10';
await fs.mkdir(out,{recursive:true});
const C={white:'#FFFEF7',yellow:'#FFF18A',ink:'#111B45',blue:'#075BFA',coral:'#FF665B',muted:'#52607A',pale:'#E6EAFF'};
const p=Presentation.create({slideSize:{width:1280,height:720}});p.theme.defaultFont='Hiragino Sans GB';
function txt(s,text,x,y,w,h,size=30,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',name:text.slice(0,35),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=text;a.text.insets=0;a.text.style={typeface:'Hiragino Sans GB',fontSize:size,color,bold};return a;}
function shape(s,g,x,y,w,h,fill,line='none',lw=0){return s.shapes.add({geometry:g,position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:lw}});}
function rect(s,x,y,w,h,fill){return shape(s,'rect',x,y,w,h,fill);}
async function img(s,file,x,y,w,h){const b=await fs.readFile(file);s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:path.basename(file),fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function node(s,x,y,w,h,heading,body,fill=C.white,color=C.ink,size=27){const a=shape(s,'roundRect',x,y,w,h,fill,fill===C.white?'#C3CAE0':'none',1.3);a.adjustmentList=[{name:'adj',formula:'val 6500'}];txt(s,heading,x+20,y+(h<90?10:16),w-40,h<90?36:46,size,color,true);if(body)txt(s,body,x+20,y+(h<90?43:72),w-40,h<90?22:h-76,h<90?17:24,color===C.white?'#D7DFFF':C.muted);return a;}
function flow(s,from,to,fromSide='right',toSide='left',both=false,color=C.blue){const c=s.shapes.connect(from,to,{kind:'straight',fromSide,toSide,line:{fill:color,width:2.5},head:both?{type:'triangle',width:'sm',length:'sm'}:{type:'none'},tail:{type:'triangle',width:'sm',length:'sm'}});c.bringToFront();return c;}
function route(s,pts,color=C.blue,both=false,end=true){for(let i=1;i<pts.length;i++){const [a,b]=[pts[i-1],pts[i]],x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),dx=Math.abs(a[0]-b[0]),dy=Math.abs(a[1]-b[1]);const reverse=b[0]<a[0]||b[1]<a[1];const last=i===pts.length-1,first=i===1;shape(s,'line',x,y,dx||0.01,dy||0.01,'none',color,2.5);if((last&&end)||(first&&both)){const tip=last?b:a;const dir=last?(reverse?-1:1):(reverse?1:-1);const w=8,h=7;const commands=dx?[{moveTo:{x:dir>0?0:w,y:0}},{lineTo:{x:dir>0?w:0,y:h/2}},{lineTo:{x:dir>0?0:w,y:h}},{close:{}}]:[{moveTo:{x:0,y:dir>0?0:h}},{lineTo:{x:w/2,y:dir>0?h:0}},{lineTo:{x:w,y:dir>0?0:h}},{close:{}}];s.shapes.add({geometry:'custom',position:{left:tip[0]-(dx?(dir>0?w:0):w/2),top:tip[1]-(dx?h/2:(dir>0?h:0)),width:w,height:h},fill:color,line:{fill:'none',width:0},customPaths:[{width:w,height:h,commands}]});}}}

const s=p.slides.add();s.background.fill=C.white;
await sharp(root+'/design/brand/logo.svg').resize(440,235).png().toFile(out+'/logo.png');
await img(s,out+'/logo.png',48,18,108,58);rect(s,178,49,875,3,C.blue);txt(s,'02 / 技术',1080,29,170,42,23,C.ink,true);txt(s,'07',1200,678,50,30,18,C.muted);
txt(s,'模块化前端，语音直连',50,118,1175,92,60,C.ink,true);
shape(s,'roundRect',55,239,650,412,'#F1F3FD','none');txt(s,'BROWSER',80,250,400,32,18,C.muted,true);
const web=node(s,85,300,230,88,'页面与会话编排','apps/web',C.ink,C.white,26);
const core=node(s,435,300,235,88,'内容与会话规则','game-core',C.white,C.ink,26);
const ui=node(s,85,435,230,88,'共享界面','ui');
const voice=node(s,435,435,235,88,'语音输入与播放','voice',C.white,C.ink,26);
const animation=node(s,85,570,230,65,'动画解析与渲染','character-animation',C.white,C.ink,26);
const gateway=node(s,755,420,225,118,'Gateway',null,C.ink,C.white,29);
txt(s,'Cloudflare Workers，\n设备与凭据管理',775,481,185,47,17,'#D7DFFF');
const store=node(s,1055,358,170,88,'R2','分享快照');
const linx=node(s,1055,512,170,88,'灵矽 Linx',null,C.white,C.ink,24);
txt(s,'STT/LLM/TTS',1067,555,146,23,14,C.muted);
flow(s,web,core);flow(s,web,ui,'bottom','top');flow(s,ui,animation,'bottom','top');
route(s,[[315,362],[375,362],[375,479],[435,479]]);
flow(s,voice,gateway,'right','left',true,'#6D7EAB');txt(s,'准备凭据',681,451,66,23,14,C.muted);
route(s,[[552.5,523],[552.5,556],[1055,556]],C.blue,true);txt(s,'原生 WSS 直连',750,584,196,29,17,C.blue,true);
route(s,[[980,451],[1017,451],[1017,402],[1055,402]],'#6D7EAB',true);txt(s,'分享 API',980,365,75,24,14,C.muted);
route(s,[[980,509],[1017,509],[1017,530],[1055,530]],'#6D7EAB',true);txt(s,'设备管理',984,480,67,23,14,C.muted);
const png=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(out+'/architecture-preview.png',new Uint8Array(await png.arrayBuffer()));
await fs.writeFile(out+'/layout.json',await (await s.export({format:'layout'})).text());
console.log('Rendered one unapproved architecture image only; roadshow files unchanged.');
