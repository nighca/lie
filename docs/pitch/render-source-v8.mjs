import fs from 'node:fs/promises';
import {Presentation} from '@oai/artifact-tool';
const root=process.cwd(),source=await fs.readFile(root+'/docs/pitch/evidence/revision-08/webmcp-direct-edit-source.md','utf8');
const p=Presentation.create({slideSize:{width:1280,height:720}}),s=p.slides.add();s.background.fill='#FFFFFF';
function text(t,x,y,w,h,size=21,bold=false,color='#17223D'){const q=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});q.text=t;q.text.insets=0;q.text.style={typeface:'Hiragino Sans GB',fontSize:size,bold,color};}
function rule(y){s.shapes.add({geometry:'rect',position:{left:42,top:y,width:1196,height:1.5},fill:'#D8DFEC',line:{fill:'none',width:0}});}
text(source.split('\n')[0].replace(/^# /,''),42,28,1196,53,37,true);
text('2026-11-01 · 原技术方案摘录',42,91,1196,32,19,false,'#657084');
text('工具合同',42,146,1196,41,29,true);
const rows=source.split('\n').filter(l=>l.startsWith('| `lie_')).map(l=>l.split('|').slice(1,-1).map(t=>t.trim().replaceAll('`','')));
const xs=[42,357,739],widths=[290,355,497];
['工具','作用','输出及副作用'].forEach((t,i)=>text(t,xs[i],206,widths[i],35,22,true));rule(247);
rows.forEach((r,i)=>{r.forEach((t,j)=>text(t,xs[j],268+i*94,widths[j],79,j===0?20:19,j===0));rule(351+i*94);});
text('保存、并发和外发边界',42,565,1196,37,26,true);
const paragraph=source.split('\n').find(l=>l.startsWith('- 写入前验证')).slice(2);
text(paragraph,42,618,1196,85,21);
const out=await p.export({slide:s,format:'png',scale:1.5});
await fs.writeFile(root+'/tmp/pitch/revision-08/build/webmcp-design-excerpt.png',new Uint8Array(await out.arrayBuffer()));
console.log('Rendered exact-source technical excerpt; not a browser screenshot.');
