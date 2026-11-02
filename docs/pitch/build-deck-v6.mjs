import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const root=process.cwd(),build=root+'/tmp/pitch/revision-06/build',out=root+'/tmp/pitch/revision-06/output';
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
const statsNote='北京时间2026-10-23 00:00至10-26 00:00不含，固定main bb5fe51可达committer日期窗口785提交（author成员同集），含代码/文档/素材/测试。精确本机项目创建记录97个Agent会话=14顶层Chat+83显式子代理（包含递归），排除853审批。同会话followup不增，不是人数或并发。保留运行记录66/97（12顶层+54子代理）635段316643739ms约87.9566 Agent小时，含工具/等待与并行累加，31份缺失未估算，不是全部97总工时或有效劳动时间。来源engineering-evidence-v6.md，源脚本只输出聚合，无私密正文。';
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
const s=await page('让界面帮助玩家推理','01 / 产品',45,'替换时间说明弹窗为调查中的完整界面，含人物导航、角色、真实问答历史和操作区。截图来自获准保存的历史真人/角色实录media/promo-video/lie-demo.mp4第32秒，不是新语音或最新UI验收；内容为另一纪念章案，不混作江苏同局。截图未改对话，仅JPEG格式压缩；不把历史实录当所有设备/当前性能保证。口头解释切人、核对口供、最终指认。来源evidence/revision-06/README.md。');
title(s,'边听，边核对说法。');await img(s,build+'/investigation-dialogue.png',248,220,970,454);txt(s,'切换人物\n回看口供\n再作判断',55,314,220,205,31,C.ink,true);txt(s,'历史真实问答界面',57,658,240,33,18,C.muted);
}
{
const s=await page('写故事试玩分享','01 / 产品',65,'65秒内含45秒自己预置演示稿操作，作者独立写故事、选人物/结局，同引擎试玩与短链分享；不设必须多人讨论。WebMCP是可选支持助手，不替代人工写案，也不等于一次生成优质故事。本页用已有虚构午餐盒验收画面说明编辑器，非新实时工具操作。控制草稿所有权，不清除用户稿。分享快照改变内容新ID、旧快照不变。');
title(s,'写一个故事，让朋友来推理。');
const stages=[['01','写故事'],['02','选人物'],['03','试玩与分享']];for(let i=0;i<3;i++){txt(s,stages[i][0],55+i*400,261,80,55,28,C.blue,true);txt(s,stages[i][1],144+i*400,250,310,75,41,C.ink,true);}
const ed=await crop('docs/pitch/evidence/revision-03/webmcp-entry.jpg',{left:24,top:295,width:1232,height:405},'editor-fields');await img(s,ed,55,356,1170,290);txt(s,'一个人也能完成，从故事到可玩的案件。',55,661,1160,39,27,C.muted);
}
{
const s=await page('玩家与作者的价值','01 / 产品',45,'将原v5六案页与问答玩家/作者价值合并进产品主讲，沿用用户喜欢的最后五页两列大字排版。六正式案件/八预设为内容起点，不是用户规模；人数/时长由内容变化。作者复用人物美术、声音、动画和引擎。商业路径、增长、留存/付费意愿仍待验证，无虚构指标。来源main六JSON/manifest/README。');
title(s,'谁会玩，谁会写？');txt(s,'玩家',55,277,500,96,70,C.blue,true);txt(s,'作者',720,277,500,96,70,C.blue,true);txt(s,'自由追问的轻量推理\n浏览器直接开始',55,409,555,160,36);txt(s,'复用资源与玩法\n让自己的故事可玩、可分享',720,409,510,170,36);txt(s,'6 个官方案件 · 8 套预设形象',55,651,1160,45,30,C.muted);
}
{
const s=await page('浏览器与薄网关架构','02 / 技术',55,'专业原生技术架构图，不用动漫插画。浏览器持有完整案包、局内历史/额度/固定指认；语音经/api/voice WebSocket双向转发，/api/voice/prepare在建relay前HTTP预热设备。Cloudflare Worker保留供应商凭据并转发。分享经/api/shared-games/v1 GET/POST由同Worker写读私有R2，客户端不直连R2。语音服务为灵矽ASR/LLM/TTS。固定规则由程序，模型表达角色。浏览器答案可检查/轻量单人取舍，已合入原v5取舍备页，不另重复。来源bb5fe51 gateway/index.ts、shared-games、architecture/game-core。');
title(s,'规则在浏览器，语音经薄网关。');
box(s,55,246,445,340,'浏览器');box(s,78,320,399,95,'语音与转写','音频输入输出 / 本人历史');box(s,78,447,399,93,'游戏与创作页面','规则 / 指认 / 分享');
box(s,620,246,255,340,'Cloudflare Worker');box(s,641,320,213,95,'语音中继','设备准备 / 凭据');box(s,641,447,213,93,'分享 API','快照读写');
box(s,1000,278,225,140,'语音服务','ASR / LLM / TTS',true);box(s,1000,450,225,120,'R2','内容快照',true);
link(s,'↔',530,342,66,43);txt(s,'WebSocket',507,302,110,35,18,C.muted);link(s,'↔',910,342,65,43);
link(s,'→',530,467,66,43);txt(s,'HTTP',536,531,80,34,18,C.muted);link(s,'↔',910,467,65,43);
txt(s,'模型表达角色，程序维护答案与终局。',55,622,1170,55,34,C.blue,true);txt(s,'轻量单人叙事：完整案情可检查，供应商凭据留在服务端。',55,679,1160,32,23,C.muted);
}
{
const s=await page('轻量骨骼动画','02 / 技术',40,'强调自研的价值为功能有界的轻量2D位图骨骼数据与Canvas播放器。去掉层级/轨道/状态术语串与“动画包→播放器→同一游戏引擎”的混杂层次。现在说明：部件图片+少量动作数据→共享Canvas播放器→角色状态表现。功能按游戏所需实现，没有外部3D引擎依赖；不声称未经测量的体积/内存/性能优势、IK或真实音素口型。实际parser v1/v2与静态回退。来源character-animation/package.json/types/playback/canvas、真实coral部件。');
title(s,'为角色表达，自研轻量动画。');txt(s,'轻量',55,273,470,130,91,C.blue,true);txt(s,'只做游戏需要的角色动作。',60,439,560,65,36,C.ink,true);txt(s,'部件图片＋少量动作数据\n由同一个 Canvas 播放器呈现。',60,544,600,110,30,C.muted);
const base=root+'/design/character-presets/assets/coral-bob/animation/parts/';for(const [i,n] of ['head.png','body.png'].entries()){const f=build+'/lite-'+i+'.png';await sharp(base+n).trim().png().toFile(f);await img(s,f,713,273+i*167,145,150);}link(s,'→',880,387,65,44);await img(s,await portrait('coral-bob','accused-correctly'),985,277,230,326);
}
{
const s=await page('WebMCP技术方案','02 / 技术',45,'技术最后页，专业原生方案图。用户自行选择Agent/模型，支持浏览器的document.modelContext将结构化工具暴露给Agent；工具读规则/轻量版本状态，不返回全文，update按revision局部编辑当前表单并走既有本地保存。表单可人工写，不依赖Agent；没有产品侧创作模型请求/新模型网关，不自动voice/play/share。兼容范围依浏览器/Agent逐项验证，未量化提效。来源useEditorTools、直接编辑文档及官方API已核资料。');
title(s,'用户的 Agent，调用页面能力。');
box(s,55,315,270,170,'用户 Agent','用户自行选择模型',true);link(s,'↔',354,357,76,45);
box(s,465,246,760,350,'浏览器中的 LIE 编辑器');box(s,489,330,220,190,'WebMCP','浏览器提供的\n页面工具接口');link(s,'→',714,360,40,32);
box(s,765,315,434,87,'创作规则 / 状态 / 改稿工具');link(s,'↓',836,400,50,35);box(s,765,459,205,107,'当前表单');link(s,'→',973,477,35,31);box(s,1013,459,185,107,'本地草稿');
txt(s,'不另建创作模型后端，复用现有表单与保存。',55,626,1170,55,34,C.blue,true);txt(s,'面向支持 WebMCP 的浏览器与 Agent，长期适配持续验证。',55,680,1160,32,23,C.muted);
}
{
const s=await page('Router与Worker协作','03 / 工程',55,'Router–Worker是项目职责归纳，非同名SDK。人只对关键目标/方案做决定，Router澄清、设计、任务owner/依赖调度、实际审查与串行集成；Worker独立工作区完成设计/实现/自验并交回完整证据，委派不转移发起者责任。图中三条并行分支仅模块示意，不是只有三个Agent。降低人的逐项管理是机制解释，非已量化效果；不把产品用户Agent混作开发Agent。来源AGENTS。');
title(s,'人定方向，Router 收口协作。');
box(s,55,335,165,110,'人');link(s,'↔',233,356,70,44);box(s,323,290,312,202,'Router','方案 / 调度 / 审查集成',true);
rect(s,663,306,2,180,C.blue);rect(s,635,386,29,2,C.blue);
for(const [i,n] of ['内容与素材','界面与体验','规则与语音'].entries()){rect(s,663,306+i*90,78,2,C.blue);link(s,'→',728,280+i*90,46,33);box(s,785,270+i*90,420,77,n);}
for(let i=0;i<3;i++)rect(s,1205,307+i*90,20,2,C.blue);rect(s,1224,307,2,253,C.blue);rect(s,479,559,747,2,C.blue);rect(s,478,522,2,38,C.blue);link(s,'↑',460,487,50,37);txt(s,'Worker 自验与完整交接',687,583,540,44,27,C.blue,true);
txt(s,'并行执行，串行集成。',55,640,1160,58,41,C.ink,true);
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
const d=[['785','commits'],['97','Agent 会话'],['≈88','可核 Agent 小时']];for(let i=0;i<3;i++){txt(s,d[i][0],55+i*397,299,365,138,91,C.blue,true);txt(s,d[i][1],59+i*397,467,370,65,29,C.ink,true);}
txt(s,'97＝14 个顶层 Chat＋83 个子代理会话。',55,587,1160,48,28,C.ink);txt(s,'时长覆盖 66／97 会话；含工具、等待和并行累加，非有效工时。',55,649,1160,45,24,C.muted);
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
const s=await page('三天统计的口径与覆盖','Q&A / 03',0,statsNote);title(s,'统计到什么，就说明到什么。');const a=[['提交','固定 main 可达，按三天日期筛选'],['会话','顶层 Chat 与递归子代理合计，排除自动审批'],['运行时长','只累计有保留生命周期的片段，缺失不估算']];for(let i=0;i<3;i++){txt(s,a[i][0],55,288+i*121,360,66,40,C.blue,true);txt(s,a[i][1],490,299+i*121,735,78,29,C.ink);}txt(s,'不等于人数、并发、全部有效工时或提效倍数。',55,674,1160,37,25,C.muted);
}
await fs.writeFile(build+'/entries.json',JSON.stringify(entries));await fs.writeFile(build+'/deck.json',JSON.stringify(p.toProto()));
if(!process.env.LIE_EXPORT_ONLY)for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const b=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(out+'/slide-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));const l=await s.export({format:'layout'});await fs.writeFile(build+'/slide-'+(i+1)+'.layout.json',await l.text());}
await (await PresentationFile.exportPptx(p)).save(build+'/candidate.pptx');console.log('Rendered '+entries.length+' slides; '+entries.reduce((a,e)=>a+e.seconds,0)+' seconds.');
