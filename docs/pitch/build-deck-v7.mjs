import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const root=process.cwd(),build=root+'/tmp/pitch/revision-07/build',out=root+'/tmp/pitch/revision-07/output';
await fs.mkdir(build,{recursive:true});await fs.mkdir(out,{recursive:true});
const C={white:'#FFFEF7',yellow:'#FFF18A',ink:'#111B45',blue:'#075BFA',coral:'#FF665B',muted:'#52607A',pale:'#E6EAFF'};
const p=Presentation.create({slideSize:{width:1280,height:720}});p.theme.defaultFont='Hiragino Sans GB';
const entries=[];
function txt(s,text,x,y,w,h,size=30,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',name:text.slice(0,35),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=text;a.text.insets=0;a.text.style={typeface:'Hiragino Sans GB',fontSize:size,color,bold};return a;}
function shape(s,g,x,y,w,h,fill,line='none',lw=0){return s.shapes.add({geometry:g,position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:lw}});}
function rect(s,x,y,w,h,fill){return shape(s,'rect',x,y,w,h,fill);}
async function img(s,file,x,y,w,h){const b=await fs.readFile(file);s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:path.basename(file),fit:'contain',position:{left:x,top:y,width:w,height:h}});}
await sharp(root+'/design/brand/logo.svg').resize(440,235).png().toFile(build+'/logo.png');
for(const name of ['cover-C','investigation-dialogue','webmcp-before','webmcp-after'])await sharp(root+'/docs/pitch/evidence/revision-06/'+name+'.jpg').png().toFile(build+'/'+name+'.png');
for(const n of ['result-success','result-failure'])await sharp(root+'/docs/pitch/evidence/revision-07/'+n+'.jpg').png().toFile(build+'/'+n+'.png');
const portraits={};
async function portrait(id,state='default'){const key=id+'-'+state;if(portraits[key])return portraits[key];const f=build+'/'+key+'.png';await sharp(root+'/design/character-presets/assets/'+id+'/'+state+'.png').trim().png().toFile(f);portraits[key]=f;return f;}
async function crop(rel,area,name){const f=build+'/'+name+'.png';await sharp(root+'/'+rel).extract(area).png().toFile(f);return f;}
async function header(s,section,n){await img(s,build+'/logo.png',48,18,108,58);rect(s,178,49,875,3,C.blue);txt(s,section,1080,29,170,42,23,C.ink,true);txt(s,String(n).padStart(2,'0'),1200,678,50,30,18,C.muted);}
async function page(title,section,seconds,notes,bg=C.white){const s=p.slides.add();s.background.fill=bg;if(section!=='封面')await header(s,section,p.slides.items.length);entries.push({title,section,seconds});s.speakerNotes.text=notes;return s;}
function title(s,a,b=null){txt(s,a,50,118,1175,92,60,C.ink,true);if(b)txt(s,b,54,212,1160,46,28,C.muted);}
function arrow(s,x,y,w=70,color=C.blue){txt(s,'→',x,y,w,75,56,color,true);}
function label(s,a,x,y,w=220){txt(s,a,x,y,w,45,27,C.ink,true);}
function box(s,x,y,w,h,heading,body=null,accent=false){shape(s,'rect',x,y,w,h,accent?C.pale:C.white,'#AEBAD5',1.5);txt(s,heading,x+18,y+18,w-32,42,heading.length>15?22:27,C.ink,true);if(body)txt(s,body,x+18,y+64,w-32,h-68,21,C.muted);}
function link(s,glyph,x,y,w=60,size=39){txt(s,glyph,x,y,w,60,size,C.blue);}
function node(s,x,y,w,h,heading,body,fill=C.white,color=C.ink,size=27){const a=shape(s,'roundRect',x,y,w,h,fill,fill===C.white?'#C3CAE0':'none',1.3);a.adjustmentList=[{name:'adj',formula:'val 6500'}];txt(s,heading,x+20,y+(h<90?10:16),w-40,h<90?36:46,size,color,true);if(body)txt(s,body,x+20,y+(h<90?43:72),w-40,h<90?22:h-76,h<90?17:24,color===C.white?'#D7DFFF':C.muted);return a;}
function flow(s,from,to,fromSide='right',toSide='left',both=false){const c=s.shapes.connect(from,to,{kind:'straight',fromSide,toSide,line:{fill:C.blue,width:2.5},head:both?{type:'triangle',width:'sm',length:'sm'}:{type:'none'},tail:{type:'triangle',width:'sm',length:'sm'}});c.bringToFront();return c;}
function route(s,pts,color=C.blue,both=false,end=true){for(let i=1;i<pts.length;i++){const [a,b]=[pts[i-1],pts[i]],x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),dx=Math.abs(a[0]-b[0]),dy=Math.abs(a[1]-b[1]);const reverse=b[0]<a[0]||b[1]<a[1];const last=i===pts.length-1,first=i===1;shape(s,'line',x,y,dx||0.01,dy||0.01,'none',color,2.5);if((last&&end)||(first&&both)){const tip=last?b:a;const dir=last?(reverse?-1:1):(reverse?1:-1);const w=8,h=7;const commands=dx?[{moveTo:{x:dir>0?0:w,y:0}},{lineTo:{x:dir>0?w:0,y:h/2}},{lineTo:{x:dir>0?0:w,y:h}},{close:{}}]:[{moveTo:{x:0,y:dir>0?0:h}},{lineTo:{x:w/2,y:dir>0?h:0}},{lineTo:{x:w,y:dir>0?0:h}},{close:{}}];s.shapes.add({geometry:'custom',position:{left:tip[0]-(dx?(dir>0?w:0):w/2),top:tip[1]-(dx?h/2:(dir>0?h:0)),width:w,height:h},fill:color,line:{fill:'none',width:0},customPaths:[{width:w,height:h,commands}]});}}}
const statsNote='北京时间2026-10-23 00:00至10-26 00:00不含，固定main bb5fe51可达committer日期窗口785提交（author成员同集），含代码/文档/素材/测试。精确本机项目创建记录97个Agent会话=14顶层Chat+83显式子代理（包含递归），排除853审批。同会话followup不增，不是人数或并发。保留运行记录66/97（12顶层+54子代理）635段，316643739ms＝5277.39565 Agent分钟，严格大于5277分钟（约87.9566小时），含工具/等待与并行累加，31份缺失未估算，不是全部97总工时或有效劳动时间。来源engineering-evidence-v6.md，源脚本只输出聚合，无私密正文。';
{
const s=await page('谁在说谎？','封面',10,'10秒。按用户原C概念稿的原有构图、字阶和人物握大问号的互动进行小范围衍生，仅移除临时字标/页类标，原样覆盖仓库正式logo。此为品牌图，不是游戏实时画面或测谎表情。来源visual-direction-v4/C-editorial.jpg与evidence/revision-06/cover-prompt.json。');
await img(s,build+'/cover-C.png',0,0,1280,720);await img(s,build+'/logo.png',48,14,111,60);
}
{
const s=await page('谁才是江苏人？','01 / 产品',125,'合并原v5第2/3页，35秒设定+90秒现场操作，时间只在讲稿/备注，不上屏。旅行播客两嘉宾一真一假，小周男blue-glasses/小陈女plum-crop。问“你哪里人”，切人核对再追问，125秒含讲解连接及返回，不揭答案、不预编模型回答。官网手动开mic；介绍页HTTP预热不等于本地文件调用provider。R为另一历史纪念章28.5秒真实声备用，V历史宣传片，无新增实时provider。地域梗非现实身份规则。来源jiangsu-public.json与原实录来源。');
title(s,'谁才是江苏人？');txt(s,'两位嘉宾，一位真老乡。',55,254,680,70,43,C.ink,true);txt(s,'你哪里人？',55,386,700,105,71,C.blue,true);txt(s,'再追问：具体哪儿？',59,548,650,60,37,C.ink);
await img(s,await portrait('blue-glasses','speaking'),777,260,203,350);await img(s,await portrait('plum-crop','listening'),1013,260,203,350);label(s,'小周',831,633,150);label(s,'小陈',1068,633,150);
}
{
const s=await page('让界面帮助玩家推理','01 / 产品',35,'替换时间说明弹窗为调查中的完整界面，含人物导航、角色、真实问答历史和操作区。截图来自获准保存的历史真人/角色实录media/promo-video/lie-demo.mp4第32秒，不是新语音或最新UI验收；内容为另一纪念章案，不混作江苏同局。截图未改对话，仅JPEG格式压缩；不把历史实录当所有设备/当前性能保证。口头解释切人、核对口供、最终指认。来源evidence/revision-06/README.md。');
title(s,'边听，边核对说法。');await img(s,build+'/investigation-dialogue.png',248,220,970,454);txt(s,'切换人物\n回看口供\n再作判断',55,314,220,205,31,C.ink,true);
}
{
const s=await page('指认与结果','01 / 产品',25,'新增游戏闭环：玩家在问答后选择指认，正确揭晓完整经过，错误终局不揭真相，可重试。两张图为既有2026-10-30获批结果页真实应用离线预览，使用纪念章案而非江苏案，不揭现场答案、无新模型请求。只裁桌面卡片，未改角色/文案/按钮，来源docs/design/result-page-ui/success-actions.png与failure-motion-settled.png及README。承接下一页：从破解别人的故事到写自己的案件。');
title(s,'作出指认，迎来你的结局。');
await img(s,build+'/result-success.png',55,249,608,377);await img(s,build+'/result-failure.png',780,249,395,377);
txt(s,'成功：揭晓完整经过',55,650,610,45,30,C.blue,true);txt(s,'失败：保留悬念，再试一局',730,650,520,45,30,C.ink,true);
}
{
const s=await page('写故事试玩分享','01 / 产品',65,'65秒内含45秒自己预置演示稿操作，作者独立写故事、选人物/结局，同引擎试玩与短链分享；不设必须多人讨论。WebMCP是可选支持助手，不替代人工写案，也不等于一次生成优质故事。本页用已有虚构午餐盒验收画面说明编辑器，非新实时工具操作。控制草稿所有权，不清除用户稿。分享快照改变内容新ID、旧快照不变。');
title(s,'写一个故事，让朋友来推理。');
const stages=[['01','写故事'],['02','选人物'],['03','试玩与分享']];for(let i=0;i<3;i++){txt(s,stages[i][0],55+i*400,261,80,55,28,C.blue,true);txt(s,stages[i][1],144+i*400,250,310,75,41,C.ink,true);}
const ed=await crop('docs/pitch/evidence/revision-03/webmcp-entry.jpg',{left:24,top:295,width:1232,height:405},'editor-fields');await img(s,ed,55,356,1170,290);txt(s,'一个人也能完成，从故事到可玩的案件。',55,661,1160,39,27,C.muted);
}
{
const s=await page('玩家与作者的价值','01 / 产品',30,'将原v5六案页与问答玩家/作者价值合并进产品主讲，沿用用户喜欢的最后五页两列大字排版。六正式案件/八预设为内容起点，不是用户规模；人数/时长由内容变化。作者复用人物美术、声音、动画和引擎。商业路径、增长、留存/付费意愿仍待验证，无虚构指标。来源main六JSON/manifest/README。');
title(s,'同一套玩法，连接玩家与创作者。');txt(s,'玩家',55,277,500,96,70,C.blue,true);txt(s,'作者',720,277,500,96,70,C.blue,true);txt(s,'开口追问，\n自己作出判断。',55,409,555,160,36);txt(s,'写下故事，\n让朋友来推理。',720,409,510,170,36);txt(s,'创作者复用人物、音色与动画。',55,651,1160,45,30,C.muted);
}
{
const s=await page('浏览器与薄网关架构','02 / 技术',55,'按本repo README Architecture的关系重绘，展示apps/web、game-core、ui、voice、character-animation五个前端模块及静态内容、gateway、Linx。Web依赖Core/UI/Voice，UI依赖Animation；Content进入Web，Voice经同源WebSocket/client MCP到Gateway，再鉴权转发Linx文本/音频。为保持单页层次，本图不展开分享R2支路，功能未被移除。玩法规则在浏览器，供应商凭据留在服务端。来源README Architecture、docs/architecture-design.md。');
title(s,'模块化前端，薄语音网关。');
shape(s,'roundRect',267,239,684,412,'#F1F3FD','none');txt(s,'BROWSER',290,250,400,32,18,C.muted,true);
const content=node(s,55,282,164,122,'内容资源','案件与人物',C.yellow);
const web=node(s,300,302,250,82,'页面与会话编排','apps/web',C.ink,C.white);
const core=node(s,667,302,250,82,'内容与会话规则','game-core');
const ui=node(s,300,437,250,73,'共享界面','ui');
const voice=node(s,667,437,250,73,'语音输入与播放','voice');
const animation=node(s,300,566,250,65,'动画解析与渲染','character-animation');
const gateway=node(s,1008,437,218,73,'薄语音网关','apps/gateway',C.ink,C.white);
const linx=node(s,1008,566,218,65,'灵矽 Linx','语音与语言模型');
flow(s,content,web);flow(s,web,core);flow(s,web,ui,'bottom','top');flow(s,ui,animation,'bottom','top');
route(s,[[550,362],[609,362],[609,474],[667,474]]);
flow(s,voice,gateway,'right','left',true);txt(s,'WebSocket',921,404,105,28,16,C.muted);
flow(s,gateway,linx,'bottom','top',true);txt(s,'鉴权',1140,529,85,28,16,C.muted);
txt(s,'玩法规则留在前端，供应商凭据留在服务端。',55,675,1150,38,26,C.blue,true);
}
{
const s=await page('轻量骨骼动画','02 / 技术',40,'制作角色素材和消费动画的播放器使用同一骨骼动画数据包规范：图片部件及动作数据按契约交付，运行时校验解析并用共享Canvas播放器呈现。轻量功能按游戏角色动作所需实现。不宣称未测包体/性能或真实音素口型。来源packages/character-animation的package/types/canvas与角色真实部件。');
title(s,'轻量动画，制作与播放共用规格。');
txt(s,'素材制作',55,274,330,57,40,C.ink,true);txt(s,'图片部件与动作设计',55,337,340,42,25,C.muted);
const base=root+'/design/character-presets/assets/coral-bob/animation/parts/';
for(const [i,n] of ['head.png','body.png'].entries()){const f=build+'/lite-'+i+'.png';await sharp(base+n).trim().png().toFile(f);await img(s,f,70+i*155,405,134,173);}
const pack=node(s,465,379,365,184,'骨骼动画数据包','部件图片 ＋ 动作数据',C.ink,C.white,32);
txt(s,'同一份规格',498,507,300,45,26,C.yellow,true);
route(s,[[370,469],[441,469]]);route(s,[[854,469],[918,469]]);
txt(s,'运行时播放',937,274,310,57,40,C.ink,true);txt(s,'共享 Canvas 播放器',937,337,310,42,25,C.muted);await img(s,await portrait('coral-bob','accused-correctly'),968,389,209,255);
txt(s,'制作按规格交付，播放器按规格解析。',55,648,1120,55,34,C.blue,true);
}
{
const s=await page('WebMCP技术方案','02 / 技术',45,'技术最后页。WebMCP是用户Agent与网页工具之间的标准接口/桥梁，非独立模型或远程产品创作服务器。浏览器通过document.modelContext暴露LIE编辑器工具，Agent发现并调用其规则/状态/改稿能力；结果返回Agent。产品侧复用既有编辑能力，用户选择模型。按用户要求不上屏当前表单/本地草稿。已验组合有限，长期兼容仍需逐项验证。来源useEditorTools和既有WebMCP方案证据。');
title(s,'WebMCP，连接用户 Agent 与编辑器。');
const agent=node(s,55,300,296,232,'用户 Agent','用户选择模型\n理解创作意图',C.ink,C.white,34);
const editor=node(s,873,300,352,232,'LIE 编辑器','创作规则\n案件结构\n故事与人物编辑',C.pale,C.ink,34);
const bridge=node(s,453,340,318,152,'WebMCP','发现工具 · 调用能力',C.yellow,C.ink,34);
flow(s,agent,bridge,'right','left',true);flow(s,bridge,editor,'right','left',true);
txt(s,'轻量实现',55,602,280,55,36,C.blue,true);txt(s,'开放已有编辑能力',55,660,520,40,28,C.ink);
txt(s,'长期适配',710,602,300,55,36,C.blue,true);txt(s,'跟随用户自己的 Agent',710,660,520,40,28,C.ink);
}
{
const s=await page('Router与Worker协作','03 / 工程',55,'Router–Worker为职责模型，非同名SDK。用户本轮补充：总协调有每30分钟推进loop，有遗留任务且在人不在时仍推进已授权工作。项目coordinator-rotation/handoff也记录30分钟heartbeat。循环检查待办、派工并review收口；重要产品/架构/供应商决策仍由人确认，不能借loop推断无限授权。并行Workers自验并交完整证据，Router实际审查、串行集成，委派不转移责任。三Worker仅示例。来源AGENTS、docs/coordinator-rotation.md和本轮用户说明。');
title(s,'人定方向，Router 持续推进。');
const human=node(s,55,360,193,120,'人','目标与决策');
const router=node(s,365,343,301,155,'Router','设计 · 派工\n审查 · 串行集成',C.ink,C.white,34);
const pulse=node(s,365,234,301,68,'每 30 分钟','检查待办',C.yellow,C.ink,26);
route(s,[[516,343],[516,302]]);route(s,[[365,268],[319,268],[319,374],[365,374]]);
flow(s,human,router,'right','left',true);
const workers=[];for(const [i,n] of ['内容与素材','界面与体验','规则与语音'].entries())workers.push(node(s,872,257+i*127,352,87,n,'Worker',C.pale,C.ink,28));
route(s,[[666,420],[756,420],[756,301],[872,301]]);route(s,[[756,420],[756,428],[872,428]]);route(s,[[756,428],[756,555],[872,555]]);
for(let i=0;i<3;i++)route(s,[[1224,301+i*127],[1242,301+i*127]],'#A8B3CF',false,false);
route(s,[[1242,301],[1242,635],[516,635],[516,498]],'#A8B3CF');
txt(s,'自验与完整交接',877,603,330,30,19,C.muted);
txt(s,'有待办，自动继续推进；需决策，交回人确认。',55,676,1150,36,26,C.blue,true);
}
{
const s=await page('设计先行的真实迭代','03 / 工程',55,'重新设计工程案例，不复用骨骼图。案例为2026-11-01 WebMCP后续迭代，不属于10/23–25统计窗口。原候选UI先可体验，用户否定独立候选/额外采用步骤，重定为直接编辑当前表单；实现revision/冲突保护，随后入口/说明再收敛，真实验收、实际审查与集成。左旧已替代，右当前验收虚构样例，不读用户原稿。截图只证明当时界面；批准、测试、review与集成证据在engineering-evidence-v6及对应设计文档，不能把截图当一次生成成功。');
title(s,'先设计，再按体验把方案做对。');
txt(s,'方案原型 → 体验反馈 → 实现验证 → 审查集成',55,247,1170,60,33,C.blue,true);
const before=await crop('docs/pitch/evidence/revision-06/webmcp-before.jpg',{left:24,top:207,width:1230,height:500},'before-panel');const after=await crop('docs/pitch/evidence/revision-06/webmcp-after.jpg',{left:24,top:232,width:1230,height:480},'after-panel');
await img(s,before,55,352,550,224);await img(s,after,675,352,550,224);label(s,'旧方案：独立候选稿',55,591,550);label(s,'新方案：直接编辑当前表单',675,591,550);
txt(s,'实例：WebMCP，2026.11.01',55,676,1150,34,23,C.muted);
}
{
const s=await page('三天协作记录','03 / 工程',10,statsNote);
title(s,'2026.10.23—10.25，三天协作记录。');
const d=[['785','commits'],['97','Agents'],['>5,277','Agent 分钟']];for(let i=0;i<3;i++){txt(s,d[i][0],55+i*397,299,365,138,i===2?78:91,C.blue,true);txt(s,d[i][1],59+i*397,467,370,65,29,C.ink,true);}
txt(s,'97＝14 个顶层 Chat＋83 个子代理。',55,587,1160,48,28,C.ink);txt(s,'可核记录已超过 5,277 分钟，覆盖 66／97；含工具、等待与并行累加。',55,649,1160,45,24,C.muted);
}
{
const s=await page('你会先问谁？','试玩与创作',10,'用户喜欢的原v5收束页保留为结束邀请，不混在备页开头。官网需网络/用户主动mic，文件无provider调用。');
txt(s,'你会\n先问谁？',50,140,740,230,89,C.ink,true);txt(s,'lie.agency',55,468,1050,105,79,C.blue,true);txt(s,'也欢迎写下你的第一桩案件。',59,617,1040,58,36,C.ink,true);await img(s,await portrait('plum-crop'),900,162,295,375);
}
// Distinct detailed Q&A only. Value, architecture tradeoffs and headline statistics moved into main narrative.
{
const s=await page('语音验证与时间边界','Q&A / 01',0,'原v5备页保留独有语音时间解释：案件共享额度与relay600秒/CPU30000ms不同；relay从创建起含后续音频/权限准备，介绍页HTTP prepare在此之前。100ms缓冲非端到端时延。有限Cookie/API/transport结果不等于全部模型记忆/全设备兼容，Safari诊断不是修复。');title(s,'三种时间，三种含义。');const a=[['2–10 分钟','案件共享询问额度'],['600 秒','中继连接墙钟上限'],['30000 ms','Worker CPU 执行预算']];for(let i=0;i<3;i++){txt(s,a[i][0],55,269+i*133,560,90,59,C.blue,true);txt(s,a[i][1],655,296+i*133,550,60,31,C.ink,true);}txt(s,'均非账户费用硬上限；100ms 缓冲也不是端到端时延。',55,677,1160,36,24,C.muted);
}
{
const s=await page('改稿时的版本与保存保护','Q&A / 02',0,'与主讲WebMCP接入方式不同，本页仅解释具体冲突/落盘语义。revision过期/外部存储变更拒绝，characters字段整体替换、ending局部合并，保存失败updated_unsaved内存可能已改，不能承诺绝对永不丢稿。具体工具结果以useEditorTools源码为准。');title(s,'改稿时，边界怎样守住？');const a=[['版本保护','过期更新与存储冲突不直接覆盖'],['字段规则','人物列表整体替换，其余按约定更新'],['保存反馈','写入与落盘结果分别返回']];for(let i=0;i<3;i++){txt(s,a[i][0],55,287+i*121,380,64,39,C.blue,true);txt(s,a[i][1],525,298+i*121,690,66,30,C.ink);}txt(s,'作者仍需核对故事，再主动试玩与分享。',55,675,1160,34,24,C.muted);
}
{
const s=await page('三天统计的口径与覆盖','Q&A / 03',0,statsNote);title(s,'统计到什么，就说明到什么。');const a=[['提交','固定 main 可达，按三天日期筛选'],['Agents','顶层 Chat 与递归子代理合计，排除自动审批'],['运行时长','只累计有保留生命周期的片段，缺失不估算']];for(let i=0;i<3;i++){txt(s,a[i][0],55,288+i*121,360,66,40,C.blue,true);txt(s,a[i][1],490,299+i*121,735,78,29,C.ink);}txt(s,'Agents 按顶层 Chat 与子代理实例计，非并发或有效工时。',55,674,1160,37,25,C.muted);
}
await fs.writeFile(build+'/entries.json',JSON.stringify(entries));await fs.writeFile(build+'/deck.json',JSON.stringify(p.toProto()));
if(!process.env.LIE_EXPORT_ONLY)for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const b=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(out+'/slide-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));const l=await s.export({format:'layout'});await fs.writeFile(build+'/slide-'+(i+1)+'.layout.json',await l.text());}
await (await PresentationFile.exportPptx(p)).save(build+'/candidate.pptx');console.log('Rendered '+entries.length+' slides; '+entries.reduce((a,e)=>a+e.seconds,0)+' seconds.');
