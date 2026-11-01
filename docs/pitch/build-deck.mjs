import fs from 'node:fs/promises';import path from 'node:path';import sharp from 'sharp';import {Presentation,PresentationFile} from '@oai/artifact-tool';
const root=process.cwd(),out=root+'/tmp/pitch/output',build=root+'/tmp/pitch/build';
await fs.mkdir(build,{recursive:true});await fs.mkdir(out,{recursive:true});
await sharp(root+'/design/brand/logo.svg').resize(660,353).png().toFile(build+'/logo.png');
const p=Presentation.create({slideSize:{width:1280,height:720}}), C={yellow:'#FFF18A',white:'#FFFEF7',ink:'#111B45',blue:'#075BFA',muted:'#52607A'};
function t(s,str,x,y,w,h,size=30,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',name:str.slice(0,20),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=str;a.text.insets=0;a.text.style={typeface:'Hiragino Sans GB',fontSize:size,color,bold};return a;}
async function im(s,file,x,y,w,h){let b=await fs.readFile(file);s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:path.basename(file),fit:'contain',position:{left:x,top:y,width:w,height:h}});}
async function portrait(id,state){const dest=build+'/'+id+'-'+state+'-trim.png';await sharp(root+'/design/character-presets/assets/'+id+'/'+state+'.png').trim().png().toFile(dest);const m=await sharp(dest).metadata();const upper=dest.replace('-trim.png','-upper.png');await sharp(dest).extract({left:0,top:0,width:m.width,height:Math.floor(m.height*.62)}).png().toFile(upper);return upper;}
p.theme.defaultFont='Hiragino Sans GB';
const coral=await portrait('coral-bob','waiting'),sunny=await portrait('sunny-moustache','listening'),blue=await portrait('blue-glasses','speaking');
{
const s=p.slides.add();s.background.fill=C.yellow;await im(s,build+'/logo.png',64,45,220,118);
t(s,'谁在说谎？',60,225,750,145,106,C.ink,true);t(s,'轻松开口，认真推理。',68,400,720,65,40,C.ink,true);t(s,'AI 语音推理游戏与创作平台',70,537,720,46,29);t(s,'lie.agency',70,627,450,40,29,C.blue,true);
await im(s,build+'/coral-bob-waiting-trim.png',780,66,510,720);s.speakerNotes.text='20秒。开场邀请观众进入判断，而非先讲技术栈。正式字标与原创人物复用。来源：README.zh-CN.md；design/brand/logo.svg；design/character-presets/assets/coral-bob/waiting.png。';
}
{
const s=p.slides.add();s.background.fill=C.white;t(s,'五分钟，纪念章不见了。',60,43,1150,80,62,C.ink,true);
t(s,'18:00 交出装章的盒子',65,154,570,50,30,C.muted);t(s,'18:05 取回时只剩衬垫',695,154,570,50,30,C.muted);
await im(s,sunny,30,288,380,332);await im(s,coral,450,288,370,332);await im(s,blue,865,288,380,332);
t(s,'沈禾',85,222,250,55,37,C.ink,true);t(s,'顾遥',515,222,250,55,37,C.ink,true);t(s,'陈拓',956,222,250,55,37,C.ink,true);
t(s,'你会先问谁？',365,640,600,70,49,C.blue,true);
s.speakerNotes.text='40秒。只讲首案公共背景，不展示角色私设或答案。邀请观众选择询问对象，再口头说明自由语音追问、切人核对、最终指认。人物表情是对话状态，不是测谎信号。来源：content/games/01-empty-medal-box.json；design/character-presets。';
}
{
const s=p.slides.add();s.background.fill=C.ink;t(s,'谁负责真相？',64,44,1150,75,56,C.white,true);
t(s,'程序',64,196,560,150,120,C.yellow,true);t(s,'AI',756,196,450,150,120,'#78DDD7',true);
t(s,'答案与终局',68,368,560,70,46,C.white,true);t(s,'角色与回答',762,368,450,70,46,C.white,true);
t(s,'让判断有确定的结果',70,463,560,50,30,C.white);t(s,'让每次追问自由展开',764,463,470,50,30,C.white);
t(s,'浏览器',72,619,330,50,35,C.yellow,true);t(s,'↔',355,615,80,54,40,C.white);t(s,'薄语音网关',468,619,360,50,35,C.white,true);t(s,'↔',833,615,80,54,40,C.white);t(s,'灵矽 AI',958,619,300,50,35,'#78DDD7',true);
s.speakerNotes.text='60秒。固定答案与指认由程序处理，AI自由表达角色。浏览器负责游戏状态，薄Worker保管连接凭据并转发语音，灵矽负责模型与语音。完整答案可检查是轻量单人游戏的明确取舍。下方只展示语音与规则职责链，分享另有已上线的私有R2快照存储。来源：docs/architecture-design.md；packages/game-core/src/session.ts；apps/gateway/src/index.ts。';
}
// Local authoring only. Copy this source to tmp/pitch/build (with runtime node_modules linked), run from repository root.
const entries=[{id:0,title:'谁在说谎？',seconds:20},{id:1,title:'五分钟，纪念章不见了',seconds:40}];
function page(title,bg=C.white){const s=p.slides.add();s.background.fill=bg;return {s,id:p.slides.items.length-1,title};}
function add(e,seconds,notes){entries.push({id:e.id,title:e.title,seconds});e.s.speakerNotes.text=notes;return e.s;}
function title(s,str,color=C.ink){t(s,str,64,45,1160,86,52,color,true);}
async function asset(s,rel,x,y,w,h){return im(s,path.join(root,rel),x,y,w,h);}
async function trimAsset(rel,name){const dest=build+'/'+name+'.png';await sharp(path.join(root,rel)).trim().png().toFile(dest);return dest;}
async function cropAsset(rel,rect,name){const dest=build+'/'+name+'.png';await sharp(path.join(root,rel)).extract(rect).png().toFile(dest);return dest;}
// Product film page. The local HTML player supplies the already approved film here.
{
const e=page('一局 LIE',C.ink),s=e.s;title(s,'开口之后，故事才开始。',C.white);
await asset(s,'docs/design/character-layout/official-investigation.png',270,158,950,534);
t(s,'问',65,181,180,155,120,C.yellow,true);t(s,'听',65,353,180,155,120,'#78DDD7',true);t(s,'判断',65,546,210,77,55,C.white,true);
add(e,90,'90秒。用户确认现场开口问优先，历史实录备用。打开官网，完成一个问题、一个回答、一次切人核对，控制90秒内回到本地讲稿；不自动开启麦克风。若现场不可用，HTML第3页按R打开28.5秒历史真人mic与角色声备用片（原3:07实录13.5–42.0秒），代替现场环节，不叠加计时；含交接线索与源持帧，未主观听审。按V为53.8秒横版宣传片，只有配乐和音效，无真实问答原声。所有历史画面不作为最新短链UI或声音性能证据。来源：docs/design/character-layout/official-investigation.png（演示模式界面）；docs/promo-video/2026-10-25/combined-demo/README.md；视频owner横v3回执。');
}
{
const e=page('把等待变成角色入场',C.yellow),s=e.s;title(s,'连“等一下”，也在角色里。');
const waiting=await trimAsset('design/character-presets/assets/salt-pepper-beard/waiting.png','beard-waiting');await im(s,waiting,775,172,430,548);
t(s,'正在请 TA 过来…',65,200,760,87,60,C.blue,true);t(s,'搬个椅子…',65,325,680,72,48);t(s,'TA 正在入座…',65,427,730,72,48);t(s,'等 TA 坐稳…',65,529,690,72,48);
t(s,'准备好，再开始计时',65,653,780,41,28,C.muted);
add(e,40,'40秒。这里展示连接等待的四段文字，实际应用会替换角色姓名。等待可取消，ready立即离开；准备阶段不扣游戏询问额度。人物图是已有等待态，文字是实际产品文案示意，不称真实连接平均耗时。再口头点出姓名高亮便于核对、成功揭晓与失败保留悬念。来源：apps/web/src/presentation/VoiceConnectionNotice.vue；CharacterNameText.vue；App.vue。');
}
{
const e=page('你也能写一个案件'),s=e.s;title(s,'下一桩案子，可以由你来写。');
const ed=await cropAsset('docs/character-name-highlights/evidence/editor-background-status.png',{left:0,top:36,width:1004,height:900},'editor-story');await im(s,ed,555,170,660,500);
t(s,'写',65,180,200,160,118,C.blue,true);t(s,'故事、人物、结局',65,336,560,59,35,C.ink,true);t(s,'选好形象，就能试玩',65,437,530,55,32);
t(s,'一个短链，发给朋友。',65,531,510,60,34,C.blue,true);t(s,'改稿不影响已分享的故事',65,602,500,50,27,C.muted);
add(e,80,'80秒，含约45秒编辑器操作。打开lie.agency/editor，使用本人的已有草稿或预先准备的演示案，展示三步设定、预设形象、试玩入口和分享。不要清除用户已有草稿，不在台上完整编写优质剧本。离线版保留产品界面，现场没网络也能讲清流程。截图为既有界面证据裁去测试恢复按钮与拼接移动端区域，不冒充现场实时数据。短链已正式上线98d71fb9ebc2f517010598c4796c8db3014a73c7（总协调2026-11-01回执）：私有R2持久快照，修改后新链接、旧快照不变；默认不过期不是永久服务承诺，持链接者可看全文。原fragment只读兼容。当前截图不作为新短链UI证据。来源：docs/character-name-highlights/evidence/editor-background-status.png；docs/game-editor-implementation.md。');
}
{
const e=page('故事可以继续长出来',C.yellow),s=e.s;title(s,'玩法已备好，故事可以继续长。');
t(s,'4',62,166,260,175,142,C.blue,true);t(s,'官方案件',65,343,370,58,39,C.ink,true);t(s,'8',705,166,260,175,142,C.blue,true);t(s,'套预设形象',709,343,460,58,39,C.ink,true);
const ids=['silver-bun','plum-crop','mint-puffs','ochre-freckles'];
for(let i=0;i<ids.length;i++){const a=await trimAsset('design/character-presets/assets/'+ids[i]+'/default.png','cast-'+ids[i]);await im(s,a,40+i*307,446,290,274);}
add(e,30,'30秒。玩家获得轻量语音推理，作者复用人物、声音、动画与引擎，主要投入故事设计。四个官方案件是当前内容起点，八套形象可以跨案复用。分享和改编支持朋友间传播；没有已形成社区规模或增长数据。商业上可进一步验证精品案件与主题定制，尚未确定付费模式，不在主讲宣布定价。来源：content/games四份JSON；design/character-presets/manifest.json；README.zh-CN.md。');
}
entries.push({id:2,title:'谁负责真相？',seconds:60});
{
const e=page('换个故事，不换引擎'),s=e.s;title(s,'换个故事，不用再造一遍游戏。');
t(s,'01',65,177,180,100,78,C.blue,true);t(s,'02',65,339,180,100,78,C.blue,true);t(s,'03',65,501,180,100,78,C.blue,true);
t(s,'官方案件',245,189,360,60,40,C.ink,true);t(s,'作者试玩',245,351,360,60,40,C.ink,true);t(s,'朋友分享',245,513,360,60,40,C.ink,true);
t(s,'同一份\n内容规格',742,210,440,180,66,C.ink,true);t(s,'同一个运行引擎',742,475,460,65,39,C.blue,true);
const a=s.shapes.add({geometry:'textbox',position:{left:610,top:230,width:80,height:320},fill:'none',line:{fill:'none',width:0}});a.text='}';a.text.insets=0;a.text.style={typeface:'Arial',fontSize:260,color:C.blue};
add(e,50,'50秒。图解展示三条内容入口复用同一内容规格和引擎。新增同玩法官方案只需编号JSON，自动收录首页与开局。人物数可不同，故事姓名与形象ID独立，作者试玩不是另一套简化引擎。统一规格负责结构和引用校验，不自动证明故事可解。形象与动画也通过资源规格复用。来源：apps/web/src/application/bundledCases.ts；content/games/README.md；packages/game-core/src/validation.ts；docs/game-editor-implementation.md。');
}
{
const e=page('每个人只知道自己的经历',C.ink),s=e.s;title(s,'“他这么说” ≠ “我亲眼见过”',C.white);
const listen=await trimAsset('design/character-presets/assets/sunny-moustache/listening.png','sunny-listen-full');await im(s,listen,15,175,480,545);
t(s,'公共背景',550,211,650,65,49,C.yellow,true);t(s,'＋ 本人设定',550,319,650,65,49,C.white,true);t(s,'＋ 本人历史',550,427,650,65,49,C.white,true);
t(s,'给角色信息差，给玩家追问的理由',550,578,650,82,33,'#78DDD7',true);
add(e,60,'60秒。角色上下文只装配公共背景、本人设定与本人历史，不混入其他人的私设与结局。玩家转述他人说法仍是玩家输入，不能自动变成亲历。把语义边界设计与真实模型评估结合，记录失败并修订设定。仍可能出戏或编造，不能说完全解决幻觉、越界或多用户隔离。画面上的等式是设计原则，不是某次真实AI回答。来源：packages/game-core/src/context.ts；apps/web/src/application/liveVoice.ts；docs/case-behavior-validation.md；docs/case-live-followup.md。');
}
{
const e=page('从生成图到会回应的人物',C.white),s=e.s;title(s,'生成一张图，只是起点。');
const base='design/character-presets/assets/coral-bob/animation/parts/';const chosen=['head.png','body.png','fore-left.png','upper-left.png'];
for(let i=0;i<chosen.length;i++){const part=await trimAsset(base+chosen[i],'part-'+i);await im(s,part,45+(i%2)*190,205+Math.floor(i/2)*175,165,155);}
const final=await trimAsset('design/character-presets/assets/coral-bob/accused-correctly.png','coral-result');await im(s,final,820,220,370,360);
t(s,'位图部件',65,611,360,58,39,C.blue,true);t(s,'动画包',440,315,340,70,48,C.ink,true);t(s,'状态与轨道',440,406,350,60,35,C.muted);t(s,'角色回应',840,611,370,58,39,C.blue,true);
t(s,'AI 生成后，继续装配、校验、验证与审查',65,124,1150,48,29,C.muted);
add(e,70,'70秒。左边是仓库实际部件，右边是正式结果态人物。AI参与人物制作后，仍要拆分部件、装配骨骼、修接缝、制作状态、校验资源并接入Canvas播放器。工程也采用独立worktree执行、完整diff审查、串行集成与相关检查；人类负责人决定玩法、架构、视觉和体验。不要量化未统计的工时或提效倍数，不称完全无人开发。来源：design/character-presets/assets/coral-bob/animation/parts；docs/animation/production-workflow.md；packages/character-animation；AGENTS.md。');
}
{
const e=page('你会先问谁？',C.yellow),s=e.s;await im(s,build+'/logo.png',64,42,220,118);
t(s,'你会先问谁？',60,234,1020,140,96,C.ink,true);t(s,'lie.agency',65,425,950,96,75,C.blue,true);t(s,'也欢迎写下你的第一桩案件',68,564,1050,62,40,C.ink,true);
add(e,20,'20秒。邀请听众试玩和创作。停留此页进入问答。网站需要网络和麦克风权限，播放本地文件不自动申请权限。后续备页按问题选用，不计入10分钟主讲。');
}
// Five Q&A pages, not part of the timed main presentation.
{
const e=page('谁会玩，谁会创作？'),s=e.s;title(s,'玩家与作者，各得到什么？');t(s,'玩家',65,193,500,100,76,C.blue,true);t(s,'作者',721,193,500,100,76,C.blue,true);
t(s,'自由追问的轻量推理\n浏览器直接开始\n官方案件提供起点',68,336,540,210,35);t(s,'复用形象、声音和引擎\n写文本即可试玩\n分享、改编自己的故事',726,336,510,210,35);
t(s,'接下来验证：首局完成、复玩意愿、创作与分享成功率',65,631,1160,50,28,C.muted);
add(e,0,'备页。商业价值来自体验与创作门槛的具体降低，尚无真实用户规模、留存、营收、付费意愿或获客成本统计。精品案件和主题定制可作为验证方向，但不是已确定业务或合同。来源：README.zh-CN.md；docs/hackathon/authoring-notes.md。');
}
{
const e=page('浏览器内的取舍',C.ink),s=e.s;title(s,'轻量单人叙事，接受明确取舍。',C.white);
t(s,'少一层游戏服务器',65,190,1150,90,64,C.yellow,true);t(s,'不保存共享局状态，也无需游戏进度数据库',69,307,1120,65,36,C.white);
t(s,'答案可以被检查',65,435,1150,85,64,'#78DDD7',true);t(s,'适合当前玩法；不能宣称强反作弊竞技能力',69,554,1130,65,36,C.white);
add(e,0,'备页。完整游戏包和判定在浏览器，开发者工具可以看答案；供应商管理凭据保留服务端。没有传统游戏状态数据库不等于没有外部服务成本。已上线的分享短链使用私有R2存储内容快照，不改变浏览器游戏核心职责；没有账号云草稿、作者撤回与隐私访问控制。来源：docs/architecture-design.md；apps/gateway/src/index.ts。');
}
{
const e=page('三个时间不是同一件事',C.yellow),s=e.s;title(s,'三个“时间”，三种含义。');
t(s,'8–10 分钟',65,199,600,105,78,C.blue,true);t(s,'各案件共享询问额度',710,218,510,70,36,C.ink,true);
t(s,'600 秒',65,355,600,105,78,C.blue,true);t(s,'中继连接墙钟上限',710,377,510,70,36,C.ink,true);
t(s,'30000 ms',65,511,600,105,78,C.blue,true);t(s,'Worker CPU 执行预算',710,532,530,70,36,C.ink,true);
t(s,'它们都不是账户级费用硬上限',65,655,1150,40,27,C.muted);
add(e,0,'备页。四官方案额度480/600/540/480秒，准备阶段不扣游戏额度；连接timer从relay创建起算包含准备，不保证完整10分钟询问。CPU30000ms只计执行。100ms播放储备也不是端到端延迟。线上近4分钟用户手测和本地16k试听不能泛化为全设备稳定性或SLA。来源：四案JSON；apps/gateway/cloudflare.config.ts；packages/voice/src/player.ts；apps/web/src/application/liveVoice.ts。');
}
{
const e=page('AI 会不会说错？'),s=e.s;title(s,'AI 会失误，检查必须分层。');
t(s,'程序检查',65,199,600,100,70,C.blue,true);t(s,'结构、规则、事件归属',65,321,650,70,35);
t(s,'真实行为评估',65,450,760,100,70,C.blue,true);t(s,'亲历、同义追问、虚假转述与出戏',65,571,1120,70,35);
const a=await trimAsset('design/character-presets/assets/ochre-freckles/waiting.png','ochre-waiting');await im(s,a,855,170,355,360);
add(e,0,'备页。两类检查互不替代。假provider通过不代表真实麦克风、识别、听感或角色可信度。已有真实问答与人工反馈，也保留过失败与内容修订。四案全量盲测、多用户隔离、跨设备与费用硬限制尚未完整覆盖。来源：docs/validation.md；docs/case-behavior-validation.md；docs/case-live-followup.md。');
}
{
const e=page('性能收益的准确范围',C.ink),s=e.s;title(s,'让图片更轻，保留制作源。',C.white);
t(s,'66.49 MB',65,217,650,125,90,C.white,true);t(s,'9.75 MB',65,394,650,125,90,C.yellow,true);
t(s,'PNG 原图',807,245,420,65,39,C.white);t(s,'构建派生 WebP q90',807,423,420,95,35,C.white);
t(s,'81 张历史图片样本，字节减少约 85.34%',65,608,1160,58,35,'#78DDD7',true);
add(e,0,'备页。原始准确字节66,486,773→9,746,332，仅81张历史样本图片集合，不是全站包大小、当前全部新增图片或首屏耗时降幅。原PNG保留，构建检查尺寸/alpha/引用并生成内容哈希。CI验证构建，CD复用同份产物。来源：docs/performance/image-build-optimization/combined-main-verification.md；browser-acceptance.md。');
}
const proto=p.toProto();proto.slides=entries.map((e,i)=>({...proto.slides[e.id],index:i}));const deck=Presentation.load(proto);
await fs.mkdir(out,{recursive:true});
if(!process.env.LIE_EXPORT_ONLY) for(let i=0;i<deck.slides.items.length;i++){const s=deck.slides.items[i];const b=await deck.export({slide:s,format:'png',scale:1.5});await fs.writeFile(out+'/slide-'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await b.arrayBuffer()));const layout=await s.export({format:'layout'});await fs.writeFile(build+'/slide-'+(i+1)+'.layout.json',await layout.text());}
await fs.writeFile(build+'/deck.json',JSON.stringify(deck.toProto()));await fs.writeFile(build+'/entries.json',JSON.stringify(entries));
await (await PresentationFile.exportPptx(deck)).save(build+'/candidate.pptx');
// PDF is assembled from these inspected high-resolution pages by the packaging helper.

console.log('Rendered '+entries.length+' slides, '+entries.reduce((a,e)=>a+e.seconds,0)+' main seconds.');
