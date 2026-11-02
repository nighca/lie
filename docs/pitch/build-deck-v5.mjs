import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const root=process.cwd(),build=root+'/tmp/pitch/revision-05/build',out=root+'/tmp/pitch/revision-05/output';
await fs.mkdir(build,{recursive:true});await fs.mkdir(out,{recursive:true});
const C={white:'#FFFEF7',yellow:'#FFF18A',ink:'#111B45',blue:'#075BFA',coral:'#FF665B',muted:'#52607A',pale:'#E6EAFF'};
const p=Presentation.create({slideSize:{width:1280,height:720}});p.theme.defaultFont='Hiragino Sans GB';
const entries=[];
function txt(s,text,x,y,w,h,size=30,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',name:text.slice(0,35),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=text;a.text.insets=0;a.text.style={typeface:'Hiragino Sans GB',fontSize:size,color,bold};return a;}
function shape(s,g,x,y,w,h,fill,line='none',lw=0){return s.shapes.add({geometry:g,position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:lw}});}
function rect(s,x,y,w,h,fill){return shape(s,'rect',x,y,w,h,fill);}
async function img(s,file,x,y,w,h){const b=await fs.readFile(file);s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:path.basename(file),fit:'contain',position:{left:x,top:y,width:w,height:h}});}
await sharp(root+'/design/brand/logo.svg').resize(440,235).png().toFile(build+'/logo.png');
for(const name of ['voice-architecture','webmcp-architecture','router-worker'])await sharp(root+'/docs/pitch/evidence/revision-04/'+name+'.jpg').png().toFile(build+'/'+name+'.png');
const portraits={};
async function portrait(id,state='default'){const key=id+'-'+state;if(portraits[key])return portraits[key];const f=build+'/'+key+'.png';await sharp(root+'/design/character-presets/assets/'+id+'/'+state+'.png').trim().png().toFile(f);portraits[key]=f;return f;}
async function crop(rel,area,name){const f=build+'/'+name+'.png';await sharp(root+'/'+rel).extract(area).png().toFile(f);return f;}
async function header(s,section,n){await img(s,build+'/logo.png',48,18,108,58);rect(s,178,49,875,3,C.blue);txt(s,section,1080,29,170,42,23,C.ink,true);txt(s,String(n).padStart(2,'0'),1200,678,50,30,18,C.muted);}
async function page(title,section,seconds,notes,bg=C.white){const s=p.slides.add();s.background.fill=bg;await header(s,section,p.slides.items.length);entries.push({title,section,seconds});s.speakerNotes.text=notes;return s;}
function title(s,a,b=null){txt(s,a,50,118,1175,92,60,C.ink,true);if(b)txt(s,b,54,212,1160,46,28,C.muted);}
function arrow(s,x,y,w=70,color=C.blue){txt(s,'→',x,y,w,75,56,color,true);}
function label(s,a,x,y,w=220){txt(s,a,x,y,w,45,27,C.ink,true);}
const statsNote='冻结统计：Git main bb5fe51c641d65b61593aa5e820072f81d1350f2可达952提交，含docs/tests并受squash/cherry影响。2026-11-02 20:54北京时间，本机精确项目origin/root元数据33顶层Chat（11用户+22创建Chat）与142显式spawn子代理会话，排除1342审批记录。不是全项目任务数、人数、并发或工时，无效率对照。详docs/pitch/engineering-evidence-v4.md。';
{
const s=await page('谁在说谎？','中文路演',10,'10秒。LIE是浏览器中的AI语音推理游戏与创作平台。用户最新决定统一C方向，撤回B开场/转场，正式logo图；旧B稿仅历史保存。正式人物原样复用，表情不是测谎线索。来源：design/brand/logo.svg；design/character-presets/assets。');
txt(s,'?',844,94,400,550,450,C.yellow,true);
txt(s,'谁在\n说谎？',50,148,660,298,102,C.ink,true);
txt(s,'轻松开口，认真推理。',55,495,650,65,37,C.ink,true);
txt(s,'AI 语音推理游戏与创作平台',58,578,650,52,27,C.muted);
txt(s,'lie.agency',58,651,620,43,29,C.blue,true);
await img(s,await portrait('blue-glasses'),650,309,270,365);await img(s,await portrait('plum-crop'),934,198,270,365);

}
{
const s=await page('谁才是江苏人？','01 / 产品',35,'35秒。旅行播客临时主持，两位嘉宾一真一假。只讲公共背景，不显示私设与正确目标。小周男性blue-glasses，小陈女性plum-crop；江苏案2人共享120秒。地域梗是虚构故事，不作为现实身份鉴定。来源：docs/pitch/evidence/jiangsu-public.json，main正式江苏JSON。');
txt(s,'两位嘉宾。\n一位真老乡。',50,138,610,180,67,C.ink,true);txt(s,'你临时接过了播客话筒。',54,351,600,50,31,C.muted);txt(s,'你会先问谁？',54,503,660,80,52,C.blue,true);
await img(s,await portrait('blue-glasses'),650,170,270,470);await img(s,await portrait('plum-crop'),950,170,270,470);label(s,'小周',725,640,180);label(s,'小陈',1025,640,180);
}
{
const s=await page('和两位嘉宾聊聊','01 / 产品',90,'90秒，含连接和切换。《谁才是江苏人》现场开口问优先：先问哪里人，听完切另一人核对，再自然追问。90秒返回，不跑满120秒，不预编模型回答，不揭答案。手动官网/麦克风；介绍页后台prepare不是零provider。不可用时R播放另一历史案件《消失的纪念章》28.5秒真实原声备用，明确另案，替换而非加时；V为53.8秒无问答原声宣传片。未主观听审。本HTML不开mic/WS/模型。统一C正文风格，无B漫画背景。');
title(s,'开口，故事才开始。');
txt(s,'你哪里人？',55,306,750,120,80,C.blue,true);
txt(s,'再追问：具体哪儿？',60,459,720,70,42,C.ink,true);
txt(s,'现场开口 · 90 秒',60,631,680,50,29,C.muted);
txt(s,'?',870,185,370,435,350,C.yellow,true);
await img(s,await portrait('blue-glasses','speaking'),790,287,195,330);await img(s,await portrait('plum-crop','listening'),1010,287,195,330);
label(s,'小周',845,638,180);label(s,'小陈',1065,638,180);

}
{
const s=await page('让界面帮助玩家推理','01 / 产品',45,'45秒。UI围绕听清、核对、决定。等待可解释/取消，准备好才扣游戏额度；姓名高亮便于核对。时间说明提醒共享额度、停顿也计时/查看不暂停；指认先说明点击人物立即结束且选错不揭答案。实际已批准UI截图只裁取相关文案，不冒充真实语音/最新全界面或Safari修复。来源：main首用help acceptance、VoiceConnectionNotice、CharacterNameText；计时说明原件见evidence README。');
title(s,'让界面，帮玩家想清楚。');
txt(s,'每一步，\n知道在发生什么。',55,284,615,180,56,C.ink,true);
const time=await crop('docs/pitch/evidence/revision-03/time-help.jpg',{left:368,top:210,width:544,height:379},'time-full');await img(s,time,695,269,514,358);
txt(s,'等待有解释 · 口供易核对 · 指认有反馈',55,622,620,70,28,C.blue,true);

}
{
const s=await page('讨论好的故事直接进入表单','01 / 产品',65,'65秒内含45秒已准备的本人专用演示稿操作：查看三步、改一处、查看试玩与分享入口；不清除用户现有草稿，不从空白编完整案。WebMCP当前截图是已验收虚构午餐盒案，示意支持助手可把讨论写进同一表单；不是新实时工具成功，不能保证故事质量。后续手动同引擎试玩/分享短链，改稿不改已发快照。来源main useEditorTools、直接编辑验收、分享源码；截图evidence/revision-03/webmcp-entry.jpg。');
title(s,'聊好的故事，直接变成草稿。');
txt(s,'讨论',55,266,260,75,58,C.blue,true);arrow(s,320,270);txt(s,'填写',430,266,260,75,58,C.ink,true);arrow(s,690,270);txt(s,'试玩与分享',800,266,430,75,58,C.ink,true);
const ed=await crop('docs/pitch/evidence/revision-03/webmcp-entry.jpg',{left:24,top:295,width:1232,height:405},'editor-evidence');await img(s,ed,55,376,1170,260);
txt(s,'自己写，或让支持 WebMCP 的助手直接填写。',55,659,1130,36,25,C.muted);
}
{
const s=await page('故事可以继续长出来','01 / 产品',45,'45秒。六官方案与八套预设提供起点，作者复用美术、声音、动画和引擎，主要设计新故事。江苏第一、徒步第二，人数2/3/3/4/4/3，额度120/360/480/600/540/480秒。未有用户增长/留存/营收统计，商业方向留问答。不逐案讲完。来源固定main bb5fe51 content/games六JSON与形象manifest。');
title(s,'玩法已备好，故事继续长。');
txt(s,'6',53,253,250,180,146,C.blue,true);txt(s,'官方案件',61,445,320,55,36,C.ink,true);
const cases=['谁才是江苏人','这条线你真走了吗','消失的纪念章','压轴怎么是鸭叫','盐和糖的小乌龙','这真是今天做的吗'];
for(let i=0;i<cases.length;i++){txt(s,String(i+1).padStart(2,'0'),395+(i%2)*420,281+Math.floor(i/2)*104,55,40,22,C.blue,true);txt(s,cases[i],465+(i%2)*420,275+Math.floor(i/2)*104,350,65,29,C.ink,true);}
rect(s,55,588,1170,2,C.blue);txt(s,'8 套预设形象',55,625,430,52,35,C.ink,true);txt(s,'复用美术、声音与引擎，写你的新案件。',485,630,740,50,29,C.muted);
}
{
const s=await page('AI回答程序判定','02 / 技术',55,'55秒。浏览器负责完整内容、局内状态与固定答案/指认；薄Cloudflare Worker保护供应商凭据、设备准备并转语音，模型表达角色。私有R2只存分享快照，不存局进度。图中两端箭头合起来表示双向语音。浏览器可检查完整答案是当前轻量单人游戏取舍，不能说强反作弊竞技。有限Cookie transport验证不是全部模型隔离/跨设备保证。来源main architecture、game-core/session、gateway、share。');
title(s,'AI 回答，程序判定。');
await img(s,build+'/voice-architecture.png',55,244,1170,350);
txt(s,'语音双向传输；规则在浏览器，凭据在网关，分享快照存 R2。',55,611,1170,58,28,C.ink,true);
txt(s,'游戏答案可检查，是轻量单人玩法的明确取舍。',55,675,1150,35,24,C.muted);
}
{
const s=await page('自研骨骼规格与动画引擎','02 / 技术',40,'40秒。新增同玩法案只加编号JSON；可变人数与appearanceId独立。自研2D位图骨骼动画包/采样状态机/Canvas引擎：parts→父子骨架/轨道/状态→播放器，同一资源契约被UI消费，坏资源/版本等回退静态。实际parser支持v1/v2，旧contract文档标题v1不能覆盖实际版本。不是IK/网格蒙皮/物理或真实音素口型。用真实coral部件与正式人物，不假装生成图就是动画全部工作。来源docs/animation/contract、packages/character-animation/src、manifest、production-workflow。');
title(s,'同一套规格，让人物动起来。');
const base=root+'/design/character-presets/assets/coral-bob/animation/parts/';for(const [i,name] of ['head.png','body.png','fore-left.png','upper-left.png'].entries()){const f=build+'/bone-part-'+i+'.png';await sharp(base+name).trim().png().toFile(f);await img(s,f,55+(i%2)*155,278+Math.floor(i/2)*142,135,135);}
arrow(s,380,367);rect(s,478,277,300,268,C.yellow);txt(s,'自研骨骼规格',505,305,270,60,37,C.ink,true);txt(s,'层级 · 轨道 · 状态',505,398,270,55,27);txt(s,'Canvas 动画引擎',505,465,270,50,26,C.blue,true);arrow(s,810,367);
await img(s,await portrait('coral-bob','accused-correctly'),927,253,280,340);txt(s,'部件资源',55,597,350,50,30,C.ink,true);txt(s,'动画包 → 播放器 → 同一游戏引擎',478,603,730,60,32,C.ink,true);txt(s,'案件换故事，人物复用形象与动画。',55,664,1140,36,25,C.muted);
}
{
const s=await page('WebMCP开放编辑动作','02 / 技术',45,'45秒。用户要求WebMCP放技术最后。用户Agent经页面工具填写当前表单，复用字段规则/本地保存，没有产品侧新创作模型服务，不用为创作再接模型网关/密钥/推理配额。长期适配用户更多支持WebMCP的Agent是方向，不保证全兼容或Agent在线。guide/state无原稿正文，update revision与冲突/结构检查，不自动voice/play/share。没有量化提效或故事质量证明。来源main useEditorTools与已验收直接编辑文档。');
title(s,'产品开放动作，Agent 负责推理。');
await img(s,build+'/webmcp-architecture.png',55,255,1170,340);
txt(s,'复用编辑器，无需另建创作模型服务。',55,618,1160,60,37,C.blue,true);
txt(s,'面向支持 WebMCP 的用户 Agent，长期适配持续验证。',55,680,1150,30,23,C.muted);
}
{
const s=await page('Router与Worker协作','03 / 工程',60,'60秒。Router–Worker是项目职责模型的归纳，不是特定SDK。图中人物作为品牌化Router符号，不是游戏角色运行时参与开发。人定关键方向与范围；Router澄清/方案/调度、明确owner文件接口依赖、实际审查与唯一串行集成；Worker独立worktree承担设计/实现/自验，完整交接回Router。委派不转移发起者责任。人不需逐项当Worker消息中转，减少日常管理是机制解释，未量化对照。关键决策确认不等于每行routine都要审批。'+statsNote);
 title(s,'人定方向，Router 调度协作。');
await img(s,build+'/router-worker.png',55,215,1170,340);
rect(s,55,565,1170,2,C.blue);
for(const [i,[v,l]] of [['952','commits'],['33','项目 Chat'],['142','子代理会话']].entries()){txt(s,v,55+i*395,581,260,80,61,C.blue,true);txt(s,l,235+i*395,614,215,44,23,C.ink,true);}
txt(s,'Git 截至 bb5fe51；会话为本机项目元数据，2026-11-02 20:54，已排除自动审批。',55,685,1150,28,17,C.muted);
}
{
const s=await page('从设计到可维护产品','03 / 工程',60,'60秒。每需求先澄清/方案/影响范围，关键设计确认后落地，再验证与审查反馈。用coral-bob实际资产链串起人批视觉→素材/动画owner依共同契约执行→UI消费播放器→状态/资源检查→组合审查进入产品。中间位图仅真实部件，正式图是实际结果态，不能当同次全流程录屏。独立worktree、接口契约和按层验证支撑并行，替身/离线结果不代表真实语音。没有声称历史每行都做设计稿或人工逐项审批。来源production-workflow、animation contract、actualparts、AGENTS、result UI与集成证据。');
title(s,'先设计，再把结果做成产品。');
const words=['设计确认','独立实现','验证反馈','审查集成'];for(let i=0;i<4;i++){label(s,words[i],55+i*300,247,260);if(i<3)arrow(s,260+i*300,226,50);}
const base=root+'/design/character-presets/assets/coral-bob/animation/parts/';for(const [i,name] of ['head.png','body.png','fore-left.png','upper-left.png'].entries()){const f=build+'/review-part-'+i+'.png';await sharp(base+name).trim().png().toFile(f);await img(s,f,55+(i%2)*148,338+Math.floor(i/2)*124,125,116);}
rect(s,458,336,300,216,C.yellow);txt(s,'共同契约',484,361,260,60,43,C.ink,true);txt(s,'素材 / 动画 / UI',484,445,260,55,29,C.ink);arrow(s,808,394,85);await img(s,await portrait('coral-bob','accused-correctly'),945,315,260,280);
txt(s,'生成图只是起点。规格、审查和验证，让成果可以协作与维护。',55,624,1165,70,31,C.ink,true);
}
{
const s=await page('你会先问谁？','试玩与创作',10,'10秒。停留官网入口，邀请试玩与创作并进入问答。官网实操需网络/用户主动麦克风，离线文件不调用provider。二维码为官网URL，制作时离线解码核验；若无可用核验则不放二维码。');
txt(s,'你会\n先问谁？',50,140,740,230,89,C.ink,true);txt(s,'lie.agency',55,468,1050,105,79,C.blue,true);txt(s,'也欢迎写下你的第一桩案件。',59,617,1040,58,36,C.ink,true);await img(s,await portrait('plum-crop'),900,162,295,375);
}
// Five concise Q&A pages, outside the timed main section.
{
const s=await page('玩家与作者的价值','Q&A / 01',0,'当前无用户规模/留存/营收/付费验证。精品案与主题定制为待验证方向，不能说已形成社区。');title(s,'谁会玩，谁会写？');txt(s,'玩家',55,280,500,95,70,C.blue,true);txt(s,'作者',720,280,500,95,70,C.blue,true);txt(s,'自由追问的轻量推理\n浏览器直接开始',55,414,550,150,36);txt(s,'复用资源与玩法\n让自己的故事可玩、可分享',720,414,510,160,36);txt(s,'下一步验证：首局完成、复玩意愿、创作与分享成功率。',55,655,1150,45,27,C.muted);
}
{
const s=await page('浏览器与分享的取舍','Q&A / 02',0,'完整案包及判定在浏览器，凭据留服务端。R2持久快照、内容变化新ID旧快照不变，持链接全文含真相，默认不过期非永久保证，无撤回/账号云草稿。');title(s,'轻量架构，明确取舍。');txt(s,'浏览器可检查答案',55,278,1160,100,67,C.blue,true);txt(s,'适合轻量单人叙事，接受开放内容包。',59,394,1160,65,34);txt(s,'分享是快照，不是云草稿',55,501,1160,95,60,C.ink,true);txt(s,'持链接可读全文；改稿不改变旧快照。',59,621,1160,65,34,C.muted);
}
{
const s=await page('语音验证与时间边界','Q&A / 03',0,'游戏额度120/360/480/600/540/480秒。600s从relay创建起算，含其后的音频与权限准备；介绍页HTTP prepare发生在此之前，不计入该中继期限，CPU30000ms为执行预算，100ms为播放储备不是延迟。有限Cookie/API/transport已验不代表全模型记忆/跨设备语音保证。Safari诊断不是修复，真人与替身分开。');title(s,'三种时间，三种含义。');const a=[['2–10 分钟','案件共享询问额度'],['600 秒','中继连接墙钟上限'],['30000 ms','Worker CPU 执行预算']];for(let i=0;i<3;i++){txt(s,a[i][0],55,269+i*133,560,90,59,C.blue,true);txt(s,a[i][1],655,296+i*133,550,60,31,C.ink,true);}txt(s,'均非账户费用硬上限；100ms 缓冲也不是端到端时延。',55,677,1160,36,24,C.muted);
}
{
const s=await page('WebMCP工具边界','Q&A / 04',0,'guide rules/appearance/state revision boolean无原稿正文；update按字段保留但characters整列表替换、ending局部合并，revision/storage/busy保护，保存失败可能内存已更新未落盘。无自动试玩/分享/mic；无全Agent兼容或总工时实证。');title(s,'动作开放，边界清楚。');const rows=[['guide / state','创作规则、版本与轻量状态'],['update','局部填稿，复用表单与本地保存'],['仍由作者','检查故事，主动试玩与分享']];for(let i=0;i<3;i++){txt(s,rows[i][0],55,284+i*122,470,65,39,C.blue,true);txt(s,rows[i][1],540,293+i*122,680,70,31,C.ink);}txt(s,'兼容浏览器和 Agent 逐项验证，工具成功不等于剧情质量。',55,675,1160,36,24,C.muted);
}
{
const s=await page('工程数据口径','Q&A / 05',0,statsNote+'项目10月23日至11月2日为可见提交日历跨度，不是实际开始日、有效工时或已结束总工期。PR预览为外部贡献证据，内部Agent开发不以PR为正常路径。81图66,486,773→9,746,332字节只历史样本85.34%非全站。');title(s,'协作规模，不等于效率倍数。');const d=[['952','固定 main 可达提交'],['33','本机项目 Chat'],['142','显式子代理会话']];for(let i=0;i<3;i++){txt(s,d[i][0],55+i*397,281,360,140,92,C.blue,true);txt(s,d[i][1],59+i*397,454,370,65,28,C.ink,true);}txt(s,'含文档与测试；排除自动审批；不代表并发、人数或有效工时。',55,600,1170,70,28,C.ink);txt(s,'固定 Git bb5fe51 / 本机会话截至 2026-11-02 20:54（北京时间）',55,679,1160,34,22,C.muted);
}
await fs.writeFile(build+'/entries.json',JSON.stringify(entries));await fs.writeFile(build+'/deck.json',JSON.stringify(p.toProto()));
if(!process.env.LIE_EXPORT_ONLY)for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];const b=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(out+'/slide-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));const l=await s.export({format:'layout'});await fs.writeFile(build+'/slide-'+(i+1)+'.layout.json',await l.text());}
await (await PresentationFile.exportPptx(p)).save(build+'/candidate.pptx');console.log('Rendered '+entries.length+' slides; '+entries.reduce((a,e)=>a+e.seconds,0)+' seconds.');
