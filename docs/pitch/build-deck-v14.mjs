import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Presentation} from '@oai/artifact-tool';
const root=process.cwd(),build=root+'/tmp/pitch/revision-14/build',out=root+'/tmp/pitch/revision-14/output';
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
await sharp(root+'/docs/pitch/evidence/revision-08/webmcp-design-excerpt.jpg').png().toFile(build+'/webmcp-design-excerpt.png');
const portraits={};
async function portrait(id,state='default'){const key=id+'-'+state;if(portraits[key])return portraits[key];const f=build+'/'+key+'.png';await sharp(root+'/design/character-presets/assets/'+id+'/'+state+'.png').trim().png().toFile(f);portraits[key]=f;return f;}
async function crop(rel,area,name){const f=build+'/'+name+'.png';await sharp(root+'/'+rel).extract(area).png().toFile(f);return f;}
async function header(s,section,n){await img(s,build+'/logo.png',48,18,108,58);rect(s,178,49,875,3,C.blue);txt(s,section,1080,29,170,42,23,C.ink,true);txt(s,String(n).padStart(2,'0'),1200,678,50,30,18,C.muted);}
async function page(title,section,seconds,notes,bg=C.white){const s=p.slides.add();s.background.fill=bg;if(section!=='封面')await header(s,section,p.slides.items.length);entries.push({title,section,seconds});s.speakerNotes.text=notes;return s;}
function title(s,a,b=null){txt(s,a.replace(/。$/u,''),50,118,1175,92,60,C.ink,true);if(b)txt(s,b,54,212,1160,46,28,C.muted);}
function arrow(s,x,y,w=70,color=C.blue){txt(s,'→',x,y,w,75,56,color,true);}
function label(s,a,x,y,w=220){txt(s,a,x,y,w,45,27,C.ink,true);}
function box(s,x,y,w,h,heading,body=null,accent=false){shape(s,'rect',x,y,w,h,accent?C.pale:C.white,'#AEBAD5',1.5);txt(s,heading,x+18,y+18,w-32,42,heading.length>15?22:27,C.ink,true);if(body)txt(s,body,x+18,y+64,w-32,h-68,21,C.muted);}
function link(s,glyph,x,y,w=60,size=39){txt(s,glyph,x,y,w,60,size,C.blue);}
function node(s,x,y,w,h,heading,body,fill=C.white,color=C.ink,size=27){const a=shape(s,'roundRect',x,y,w,h,fill,fill===C.white?'#C3CAE0':'none',1.3);a.adjustmentList=[{name:'adj',formula:'val 6500'}];txt(s,heading,x+20,y+(h<90?10:16),w-40,h<90?36:46,size,color,true);if(body)txt(s,body,x+20,y+(h<90?43:72),w-40,h<90?22:h-76,h<90?17:24,color===C.white?'#D7DFFF':C.muted);return a;}
function flow(s,from,to,fromSide='right',toSide='left',both=false,color=C.blue){const c=s.shapes.connect(from,to,{kind:'straight',fromSide,toSide,line:{fill:color,width:2.5},head:both?{type:'triangle',width:'sm',length:'sm'}:{type:'none'},tail:{type:'triangle',width:'sm',length:'sm'}});c.bringToFront();return c;}
function route(s,pts,color=C.blue,both=false,end=true){for(let i=1;i<pts.length;i++){const [a,b]=[pts[i-1],pts[i]],x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),dx=Math.abs(a[0]-b[0]),dy=Math.abs(a[1]-b[1]);const reverse=b[0]<a[0]||b[1]<a[1];const last=i===pts.length-1,first=i===1;shape(s,'line',x,y,dx||0.01,dy||0.01,'none',color,2.5);if((last&&end)||(first&&both)){const tip=last?b:a;const dir=last?(reverse?-1:1):(reverse?1:-1);const w=8,h=7;const commands=dx?[{moveTo:{x:dir>0?0:w,y:0}},{lineTo:{x:dir>0?w:0,y:h/2}},{lineTo:{x:dir>0?0:w,y:h}},{close:{}}]:[{moveTo:{x:0,y:dir>0?0:h}},{lineTo:{x:w/2,y:dir>0?h:0}},{lineTo:{x:w,y:dir>0?0:h}},{close:{}}];s.shapes.add({geometry:'custom',position:{left:tip[0]-(dx?(dir>0?w:0):w/2),top:tip[1]-(dx?h/2:(dir>0?h:0)),width:w,height:h},fill:color,line:{fill:'none',width:0},customPaths:[{width:w,height:h,commands}]});}}}
const statsNote='本轮用户要求删去统计页最下说明，上屏保留97组成，时长按用户指定取整展示；完整覆盖/定义继续在本备注与证据中。 北京时间2026-10-23 00:00至10-26 00:00不含，固定main bb5fe51可达committer日期窗口785提交（author成员同集），含代码/文档/素材/测试。精确本机项目创建记录97个Agent会话=14顶层Chat+83显式子代理（包含递归），排除853审批。同会话followup不增，不是人数或并发。保留运行记录66/97（12顶层+54子代理）635段，316643739ms＝5277.39565 Agent分钟，完整可核记录为87.9565941667小时；本版按用户明确指定的整数展示口径写>88 Agent小时；这是四舍五入展示标签，不是新核出的精确下界，原值不变，含工具/等待与并行累加，31份缺失未估算，不是全部97总工时或有效劳动时间。来源engineering-evidence-v6.md，源脚本只输出聚合，无私密正文。';
{
const s=await page('谁在说谎？','封面',10,'10秒。按用户原C概念稿的原有构图、字阶和人物握大问号的互动进行小范围衍生，仅移除临时字标/页类标，原样覆盖仓库正式logo。此为品牌图，不是游戏实时画面或测谎表情。来源visual-direction-v4/C-editorial.jpg与evidence/revision-06/cover-prompt.json。');
await img(s,build+'/cover-C.png',0,0,1280,720);await img(s,build+'/logo.png',48,14,111,60);
}
{
const s=await page('谁才是江苏人？','01 / 产品',125,'合并原v5第2/3页，35秒设定+90秒现场操作，时间只在讲稿/备注，不上屏。旅行播客两嘉宾一真一假，小周男blue-glasses/小陈女plum-crop。问“你哪里人”，切人核对再追问，125秒含讲解连接及返回，不揭答案、不预编模型回答。官网手动开mic；介绍页HTTP预热不等于本地文件调用provider。另一历史纪念章28.5秒真实声可另行备用，另有历史宣传片，无新增实时provider。地域梗非现实身份规则。来源jiangsu-public.json与原实录来源。');
title(s,'谁才是江苏人？');txt(s,'两位嘉宾，一位真老乡。',55,254,680,70,43,C.ink,true);txt(s,'你哪里人？',55,386,700,105,71,C.blue,true);txt(s,'再追问：具体哪儿？',59,548,650,60,37,C.ink);
await img(s,await portrait('blue-glasses','speaking'),777,260,203,350);await img(s,await portrait('plum-crop','listening'),1013,260,203,350);label(s,'小周',831,633,150);label(s,'小陈',1068,633,150);
}
{
const s=await page('让界面帮助玩家推理','01 / 产品',35,'替换时间说明弹窗为调查中的完整界面，含人物导航、角色、真实问答历史和操作区。截图来自获准保存的历史真人/角色实录media/promo-video/lie-demo.mp4第32秒，不是新语音或最新UI验收；内容为另一纪念章案，不混作江苏同局。截图未改对话，仅JPEG格式压缩；不把历史实录当所有设备/当前性能保证。口头解释切人、核对口供、最终指认。来源evidence/revision-06/README.md。');
title(s,'边听，边核对说法。');await img(s,build+'/investigation-dialogue.png',248,220,970,454);for(const [i,line] of ['切换人物','回看口供','再作判断'].entries())txt(s,line,55,300+i*105,200,60,31,C.ink,true);
}
{
const s=await page('指认与结果','01 / 产品',25,'新增游戏闭环：玩家在问答后选择指认，正确揭晓完整经过，错误终局不揭真相，可重试。两张图为既有2026-10-30获批结果页真实应用离线预览，使用纪念章案而非江苏案，不揭现场答案、无新模型请求。只裁桌面卡片，未改角色/文案/按钮，来源docs/design/result-page-ui/success-actions.png与failure-motion-settled.png及README。承接下一页：从破解别人的故事到写自己的案件。');
title(s,'作出指认，迎来你的结局。');
await img(s,build+'/result-success.png',55,249,608,377);await img(s,build+'/result-failure.png',780,249,395,377);
txt(s,'成功：揭晓完整经过',55,650,610,45,30,C.blue,true);txt(s,'失败：保留悬念，再试一局',730,650,520,45,30,C.ink,true);
}
{
const s=await page('开放创作的游戏平台','01 / 产品',55,'55秒内含45秒自己预置演示稿操作，作者独立写故事、选人物/结局，同引擎试玩与短链分享；不设必须多人讨论。WebMCP是可选支持助手，不替代人工写案，也不等于一次生成优质故事。本页用已有虚构午餐盒验收画面说明编辑器，非新实时工具操作。控制草稿所有权，不清除用户稿。分享快照改变内容新ID、旧快照不变。');
txt(s,'不是一款游戏，而是',50,114,1175,71,49,C.ink,true);txt(s,'开放创作的游戏平台',50,183,1175,78,60,C.blue,true);
const stages=[['01','写故事'],['02','选人物'],['03','试玩与分享']];for(let i=0;i<3;i++){txt(s,stages[i][0],55+i*400,296,80,55,28,C.blue,true);txt(s,stages[i][1],144+i*400,285,310,75,41,C.ink,true);}
const ed=await crop('docs/pitch/evidence/revision-03/webmcp-entry.jpg',{left:24,top:295,width:1232,height:405},'editor-fields');await img(s,ed,55,382,1170,264);txt(s,'一个人也能完成，从故事到可玩的案件。',55,661,1160,39,27,C.muted);
}
{
const s=await page('8 套内置角色形象','01 / 产品',10,'八套形象来自design/character-presets/manifest.json，按用户草图做三层扇形：中心coral-bob默认态最大、内圈五状态向中心收拢并允许局部身体重叠，外圈其他七人各一状态，无连接线，全部使用正式原画，保持比例，不生成或修改原画。仅展示素材库而非游戏角色人数上限。');
title(s,'8 套内置角色形象');
const {drawRoleFan}=await import(root+'/docs/pitch/role-fan-v14.mjs');
await drawRoleFan(s,{img,portrait,txt,shape,C});

}
{
const s=await page('浏览器直连架构','02 / 技术',55,'按用户确定的直连方案完整呈现，不在图内加实现状态或旧relay对照；架构图不是已部署证明。根协调2026-11-03确认的最新合同覆盖专项旧status/per-openfresh条目：案件介绍页POST gateway prepare一次，gateway签Cookie给浏览器隔离的Device/Client，OTA与必要归属绑定后返回transport/DeviceClient/token/期限。本局仅内存持有并复用token，点击开始等同一pending，native WSS直连Linx /v1/ws/，device/client在URL，token仅hello。音频/转写/上下文MCP直接浏览器↔Linx。管理key/签名secret仍服务端，Worker托管资源/prepare/设备管理/分享API→私有R2；游戏状态/判定/计时在浏览器。token够一局为已确认工程假设，手动重试可重prepare、新局新准备，不建复杂TTL状态机。server-only relay为显式运营回滚非自动fallback。直连已于2026-11-03随7ff0824正式上线，同SHA预览获用户确认，CI/CD通过。Gateway是Cloudflare Workers；本页只声明部署形态，不声称未测性能改善。依据docs/releases/2026-11-03-direct-voice.md。');
title(s,'模块化架构，Serverless 部署');
shape(s,'roundRect',55,239,650,412,'#F1F3FD','none');txt(s,'BROWSER',80,250,400,32,18,C.muted,true);
const web=node(s,85,300,230,88,'页面与会话编排','apps/web',C.ink,C.white,26);
const core=node(s,435,300,235,88,'内容与会话规则','game-core',C.white,C.ink,26);
const ui=node(s,85,435,230,88,'共享界面','ui');
const voice=node(s,435,435,235,88,'语音输入与播放','voice',C.white,C.ink,26);
const animation=node(s,85,570,230,65,'动画解析与渲染','character-animation',C.white,C.ink,26);
const gateway=node(s,755,420,225,118,'Gateway',null,C.ink,C.white,29);
txt(s,'Cloudflare Workers，\n设备与凭据管理',775,481,185,47,17,'#D7DFFF');
const store=node(s,1055,358,170,88,'R2','持久化存储');
const linx=node(s,1055,512,170,88,'灵矽 Linx',null,C.white,C.ink,24);
txt(s,'STT/LLM/TTS',1067,555,146,23,14,C.muted);
flow(s,web,core);flow(s,web,ui,'bottom','top');flow(s,ui,animation,'bottom','top');
route(s,[[315,362],[375,362],[375,479],[435,479]]);
flow(s,voice,gateway,'right','left',true,'#6D7EAB');txt(s,'准备凭据',681,451,66,23,14,C.muted);
route(s,[[552.5,523],[552.5,556],[1055,556]],C.blue,true);txt(s,'WSS 直连',750,584,196,29,17,C.blue,true);
route(s,[[980,451],[1017,451],[1017,402],[1055,402]],'#6D7EAB',true);txt(s,'分享 API',980,365,75,24,14,C.muted);
route(s,[[980,509],[1017,509],[1017,530],[1055,530]],'#6D7EAB',true);txt(s,'设备管理',984,480,67,23,14,C.muted);

}
{
const s=await page('开放的游戏规格','02 / 技术',20,'统一游戏内容规格连接创作与消费：作者用编辑器编写故事、人物和真相，内容按GameDefinition契约校验，玩家通过运行端按相同内容规格加载游玩。新案件变化属于数据，不要求改通用引擎/UI；人数与询问时间可配置。开放指仓库公开契约和代码，不宣称兼容任意第三方引擎/行业标准。不在本页展示江苏答案。来源packages/game-core内容契约与schema、packages/game-core/src/content.ts及apps/web编辑器和共享预览实现，精确路径见本轮规格证据。');
title(s,'开放的游戏规格');
txt(s,'创作者',55,274,330,57,40,C.ink,true);txt(s,'写故事 · 设人物 · 定真相',55,337,360,42,25,C.muted);
const editor=await crop('docs/pitch/evidence/revision-03/webmcp-entry.jpg',{left:24,top:295,width:1232,height:405},'spec-editor');await img(s,editor,55,406,305,144);
node(s,465,379,365,184,'游戏内容包','背景 ＋ 人物 ＋ 结局',C.ink,C.white,32);txt(s,'同一份开放规格',485,507,310,45,26,C.yellow,true);
route(s,[[370,469],[441,469]]);route(s,[[854,469],[918,469]]);
txt(s,'玩家',937,274,310,57,40,C.ink,true);txt(s,'按规格加载，开口推理',937,337,310,42,25,C.muted);
await img(s,await portrait('blue-glasses','listening'),966,395,173,227);
txt(s,'创作者与玩家，通过同一份规格连接',55,648,1120,55,34,C.blue,true);
}
{
const s=await page('开放的游戏规格：JSON','02 / 技术',10,'真实内置案件content/games/01-empty-medal-box.json原文视窗渲染，非生成案例、非浏览器UI实拍。截图按源行自动换行，底部只是视窗裁切，无改写JSON；完整源hash和渲染方法见evidence/revision-11。展示非江苏案件，避免泄现场答案。');
title(s,'开放的游戏规格');await img(s,root+'/docs/pitch/evidence/revision-11/builtin-game-json.png',55,229,1170,430);
}
{
const s=await page('自研轻量骨骼动画','02 / 技术',40,'制作角色素材和消费动画的播放器使用同一骨骼动画数据包规范：图片部件及动作数据按契约交付，运行时校验解析并用共享Canvas播放器呈现。轻量功能按游戏角色动作所需实现。不宣称未测包体/性能或真实音素口型。来源packages/character-animation的package/types/canvas与角色真实部件。');
title(s,'自研轻量骨骼动画');
txt(s,'素材制作',55,274,330,57,40,C.ink,true);txt(s,'图片部件与动作设计',55,337,340,42,25,C.muted);
const base=root+'/design/character-presets/assets/coral-bob/animation/parts/';
for(const [i,n] of ['head.png','body.png'].entries()){const f=build+'/lite-'+i+'.png';await sharp(base+n).trim().png().toFile(f);await img(s,f,70+i*155,405,134,173);}
const pack=node(s,465,379,365,184,'骨骼动画数据包','部件图片 ＋ 动作数据',C.ink,C.white,32);
txt(s,'同一份规格',485,507,300,45,26,C.yellow,true);
route(s,[[370,469],[441,469]]);route(s,[[854,469],[918,469]]);
txt(s,'运行时播放',937,274,310,57,40,C.ink,true);txt(s,'基于 Canvas 的播放器',937,337,310,42,25,C.muted);await img(s,await portrait('coral-bob','accused-correctly'),968,389,209,255);
txt(s,'制作按规格交付，播放器按规格解析。',55,648,1120,55,34,C.blue,true);
}
{
const s=await page('WebMCP技术方案','02 / 技术',45,'技术最后页。WebMCP是用户Agent与网页工具之间的标准接口/桥梁，非独立模型或远程产品创作服务器。浏览器通过document.modelContext暴露LIE编辑器工具，Agent发现并调用其规则/状态/改稿能力；结果返回Agent。产品侧复用既有编辑能力，用户选择模型。按用户要求不上屏当前表单/本地草稿。已验组合有限，长期兼容仍需逐项验证。来源useEditorTools和既有WebMCP方案证据。');
title(s,'WebMCP，连接用户 Agent 与编辑器。');
const agent=node(s,55,300,296,232,'用户 Agent','用户选择模型\n理解创作意图',C.ink,C.white,34);
const editor=node(s,873,300,352,232,'LIE 编辑器','创作规则\n案件结构\n故事与人物编辑',C.pale,C.ink,34);
const bridge=node(s,453,340,318,152,'WebMCP','发现工具 · 调用能力',C.yellow,C.ink,34);
flow(s,agent,bridge,'right','left',true);flow(s,bridge,editor,'right','left',true);
txt(s,'长期适配',55,602,296,55,36,C.blue,true);txt(s,'跟随用户自己的 Agent',55,660,520,40,28,C.ink);
txt(s,'轻量实现',873,602,352,55,36,C.blue,true);txt(s,'开放已有编辑能力',873,660,352,40,28,C.ink);
}
{
const s=await page('协调 Agent 与 Worker 协作','03 / 工程',55,'协调 Agent–Worker为职责模型，非同名SDK。用户本轮补充：总协调有每30分钟推进loop，有遗留任务且在人不在时仍推进已授权工作。项目coordinator-rotation/handoff也记录30分钟heartbeat。循环检查待办、派工并review收口；重要产品/架构/供应商决策仍由人确认，不能借loop推断无限授权。并行Workers自验并交完整证据，协调 Agent实际审查、串行集成，委派不转移责任。三Worker仅示例。来源AGENTS、docs/coordinator-rotation.md和本轮用户说明。');
title(s,'人定方向，协调 Agent 持续推进。');
const human=node(s,55,360,193,120,'人','目标与决策');
const router=node(s,365,343,301,155,'协调 Agent','设计 · 派工\n审查 · 串行集成',C.ink,C.white,34);
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
const s=await page('交互与技术设计先行','03 / 工程',55,'本页设计同时包括交互/UI和技术方案，不把先设计简化成先画原型。流程为需求/约束→交互与技术设计→关键取舍确认→实现验证→审查集成；验证反馈可回到设计。WebMCP案例发生2026-11-01，非三天统计窗口。左图为固定main3de59中webmcp-direct-edit设计文档工具合同及保存并发段落的精确原文渲染，不是浏览器截图，也不是重新写造的方案；右为最终获批入口实际旧验收截图。案例取舍包括取消独立候选、用当前编辑能力、revision与白名单更新/保存反馈保护、入口符合产品。技术摘录与UI均为既有证据，不证明一次生成或最新实播。完整字节与生成记录见evidence/revision-08/README.md。');
title(s,'先设计，再按方案实现与验证。');
const steps=['需求与约束','交互／技术设计','确认关键取舍','实现与验证','审查与集成'];for(let i=0;i<5;i++){txt(s,steps[i],55+i*237,249,213,48,25,C.blue,true);if(i<4)txt(s,'→',254+i*237,246,32,45,25,C.blue);}
await img(s,build+'/webmcp-design-excerpt.png',55,330,550,270);
const after=await crop('docs/pitch/evidence/revision-06/webmcp-after.jpg',{left:24,top:232,width:1230,height:480},'after-panel');
await img(s,after,675,330,550,270);label(s,'技术方案：工具合同与版本保护',55,619,585);label(s,'交互落地：融入现有编辑器',675,619,550);
txt(s,'实例：WebMCP，2026.11.01',55,676,1150,34,23,C.muted);
}
{
const s=await page('三天协作记录','03 / 工程',10,statsNote+' 本轮产出主指标改为372份文档产出，替代上轮19份窄范围设计主文档。固定三天首次入库且f8c4e2b5截止树保留的Markdown，386路径/375原字节去重正文，排除2纯导航和1机器摘要后383路径/372正文；含设计71、调研35、实现33、评审验收发布112、协作交接决策历史64、产品模块说明57。不同内容版本可分别计，不是372独立主题或设计、更不是批准设计数；未将额外txt版本快照纳主数字。完整清单/排除/算法见engineering-output-evidence-v11.md。屏上六分类为上述完整有序路径类别的简写：设计规格71含方案资产制作，调研实验35含性能分析，实现集成33含迭代，评审验收112含测试发布，协作交接64含决策历史，产品模块57含其他说明；合372，未重新分类。');
title(s,'2026.10.23—10.25，三天协作记录。');
const d=[['785','commits'],['97','Agents'],['>88','Agent 小时'],['372','文档']];for(let i=0;i<4;i++){txt(s,d[i][0],55+i*295,315,273,124,84,C.blue,true);txt(s,d[i][1],59+i*295,467,275,60,25,C.ink,true);}
txt(s,'14 个顶层 Chat',354,526,274,29,17,C.muted);txt(s,'＋83 个子代理',354,555,274,29,17,C.muted);
const docGroups=[['设计规格 71','调研实验 35'],['实现集成 33','评审验收 112'],['协作交接 64','产品模块 57']];for(let row=0;row<3;row++)for(let col=0;col<2;col++)txt(s,docGroups[row][col],944+col*143,526+row*30,135,29,17,C.muted);
}
{
const s=await page('你会先问谁？','试玩与创作',10,'用户喜欢的原v5收束页保留为结束邀请，不混在备页开头。官网需网络/用户主动mic，文件无provider调用。');
txt(s,'你会\n先问谁？',50,140,740,230,89,C.ink,true);txt(s,'lie.agency',55,468,1050,105,79,C.blue,true);txt(s,'也欢迎写下你的第一桩案件。',59,617,1040,58,36,C.ink,true);await img(s,await portrait('plum-crop'),900,162,295,375);
}
// Only a blank Q&A destination is retained at the user's request.
{
const s=await page('Q&A','Q&A',0,'用户明确删除三张预设问题备页，仅保留本占位页。不连续讲备稿，不自动猜题，按现场问题回应。');
txt(s,'Q&A',55,222,1160,235,154,C.ink,true);txt(s,'谢谢，欢迎提问。',60,534,1100,77,47,C.blue,true);
}
await fs.writeFile(build+'/entries.json',JSON.stringify(entries));await fs.writeFile(build+'/deck.json',JSON.stringify(p.toProto()));
if(!process.env.LIE_EXPORT_ONLY)for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const b=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(out+'/slide-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));const l=await s.export({format:'layout'});await fs.writeFile(build+'/slide-'+(i+1)+'.layout.json',await l.text());}
console.log('Rendered '+entries.length+' slides; '+entries.reduce((a,e)=>a+e.seconds,0)+' seconds.');
