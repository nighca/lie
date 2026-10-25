# LIE — 当前项目计划

更新：2026-10-25，08:46 Asia/Shanghai核验本地及远端main均为`abb12dbf7a40689be593c2a1e580f23cfcc5611e`；文档提交会推进HEAD，接任时重读实际状态。[交接登记](coordinator-handoff.md)管协调权/服务，[历史索引](history/README.md)管完成证据；旧快照不覆盖最新授权。

## 当前轮换交接

当前仍由`01a17012-fa00-7170-ac0a-21c1900d71cd`（LIE 主协调 · 10月25日清晨接任）担任active协调/唯一integrator，本代`lie`/`lie-2`为ACTIVE且target本chat，前代`lie-3`/`lie-4`保持PAUSED；[登记](coordinator-handoff.md)及[接任证据](history/2026-10-25/coordinator-arrival-01a17012-fa00-7170-ac0a-21c1900d71cd.md)保留创建/通知事实。用户已回来，临时无法回应模式结束；此前数小时浏览器等待经用户澄清为待其审批，不推断后续工具必然正常。Editor定位、fan及银发/灰白/紫发正式QA均已main；历史设计归档已完成本轮收集并入库，入口见[归档](archive/README.md)。当前命名迁移已完整交付，已review并本地集成main c0ddd791，用户批准的一次受控runner切换已完成，8787/8788回环服务及79资源核验通过；mint/ochre已完成正式游戏QA和root实际review，8人基线已本地main dd16638；新微动作/头比例修订独立待用户验收后PR。已按用户授权发布abb12db且CI/自动部署成功；后续状态文档仅本地更新，重大门禁与暂停项保留。

## 授权与执行方式

- **用户已回来（2026-10-25澄清）**：临时夜间无法回应模式结束，原定约00:20至08:30的历史授权不再作为当前等待用户的假设；此前有效已授权工作继续。重大产品/玩法/架构/供应商/范围决定及明确后置仍需确认，沉默不是批准。
- **整项委派**：有一定工作量即交subagent/专项，含环境、配置、排障、浏览器验收与长检查；root负责接收、排期、接口/用户决策、实际review、串行集成与报告，仍对结果负责。
- **协调优化（用户同意）**：优先调度现有执行者，独立任务持续排队才考虑专职测试验收，不新建chat；常规handoff一次完整批量交付。root以实际差异＋哈希证明同一已验代码/资源身份及依赖/组合/相关环境未变后复用验证，仅实质变化/冲突重跑相关检查；文档批只核文档。候选仍基于最新main，main实质变化影响结果才重建/复验；隔离WT、实际review及唯一integrator不变。
- **协作**：[AGENTS](../AGENTS.md)规定隔离worktree、唯一integrator、完整clean handoff、实际diff review及候选cherry-pick验证后main快进；内部不建PR，不自动push/部署。反馈批量交付，冲突/接口/共享viewport即时协调。
- **本轮发布授权（2026-10-25）**：用户明确“推送吧，我看看效果”，授权发布已集成main的覆盖率badge等成果；root按fetch/祖先核验、实际review/验证、clean main普通push流程执行，现有CI包含自动部署步骤。邀请码实现暂缓、动画新修订待用户验收，二者未main，不随本次发布。远程确认SHA/CI结果另据实际记录，不把push当部署成功。
- **开发服务生命周期（用户明确要求）**：各owner复用稳定端口、同源路径/多root预览并在用完后停止；启动登记owner/chat/WT/SHA/端口/PID/PTY/消费者/停止条件，根协调维护[当前服务登记](development.md#服务登记与生命周期)。本轮18个旧服务、5358/5359制作入口及5544正式QA共21个已关闭，证据见[清理记录](history/2026-10-25/development-service-cleanup.md)；保留用户8787/8788进程树；5355由动画专项复用供用户查看角色，来源切换由该owner登记。5544原session19829已Ctrl-C退出130并核无监听，不重复启停或按进程名批杀。
- **设计文档入库（2026-10-25用户明确要求）**：所有完成的design/proposal及重要评审/决定必须纳入默认仓库历史；现行文档原位，备选/未采用/被替代材料可归档，入库不代表批准。[归档入口](archive/README.md)及[本次盘点](archive/2026-10-25/README.md)列补存与待owner交付范围；在制文档须随clean handoff交付，review/集成后才清理WT。
- 每30分钟推进、每4小时写交接并建全新接任chat；核实接任成功后停旧任务/归档旧chat，失败不盲退、不双integrator。具体ID与[轮换流程](coordinator-rotation.md)见交接登记。

## 当前版本与可验证边界

| 入口 | 当前事实 |
| --- | --- |
| 本地main | `abb12dbf7a40689be593c2a1e580f23cfcc5611e`已普通push并由ls-remote确认；含8人原动画基线、覆盖率badge及fresh coverage顺序修复。后续状态文档提交会推进本地HEAD，不等于再次发布；auth和新动画修订未进入main。 |
| 本地试玩 | 用户launchd独立维持[8787](http://127.0.0.1:8787/)，薄Worker8788；自动跟随干净owning main，实际版本看[SHA接口](http://127.0.0.1:8787/__lie/main-status)。轮换不得停止或重复启动。 |
| 远程/线上 | GitHub及已确认自动部署均为`abb12dbf7a40689be593c2a1e580f23cfcc5611e`；[CI40147932644](https://github.com/nighca/lie/actions/runs/40147932644)全步骤success，coverage artifact已核388测试/92.08%，deploy版本24e508bf。后续本地状态文档不自动再push，不把部署当真人语音验收。[发布证据](history/2026-10-25/coverage-publication.md)。 |
| 质量边界 | fake、文本detect、短WAV、配置ready均不替代整合版真人麦克风/外放/长会话/盲测；多用户隔离与正式费用硬限额未闭环。 |

## 已确认的产品与技术约定

- 中文单人语音推理：声聊、只读转写、UI操作和按钮指认；无证据搜集/出示/证明组合/规则DSL。三官方案人数3/4/4、时限480/600/540秒；通用引擎不固定人数，新增同玩法案件只增内容与必要呈现配置。自编至少3人是内容原则，不是引擎硬限制。
- Vue+TypeScript；浏览器运行内容、会话、指认；薄Cloudflare Worker仅供应商传输，不默认添DB/DO/账号。故事/人物纯文本，形象以ID分离复用；完整案件可在浏览器检视，管理凭据必须私密，选依赖先核宿主实际Node兼容性。见[架构](architecture.md)、[玩法](gameplay-proposal.md)。
- 一键持续多轮、可打断；语音连通期间累计预算（静音/等待/回答也计），准备不计、停止暂停、切人不重置。耗尽停止语音进入选人，不自动失败/揭晓。一次合法错指即失败且不揭真相；正确才显示完整经过。离开/主动结束先确认，刷新不恢复局内进度。
- 转写常显只读，历史保留/内部滚动，玩家头像右/NPC左，中断有标记；NPC100ms/玩家70ms每字素，玩家仍final-only回退，不称实时ASR。连通后玩家波形持续、静音平线，无角色输出波形；普通状态文案留空，连接/错误另示。
- 中文B黄蓝/深蓝轻松卡通、调查A舞台与首页A、B微调`shorter.svg` Logo、A帽檐侦探头像已批，不重问旧批准。有限Canvas动画与静态回退已批，合成嘴不是实时口型同步；不从外貌推断罪责。
- 编辑器已授权：三步自由往返、纯文本、必选预置形象、唯一答案、同引擎试玩、压缩fragment链接、本地草稿；无账号云同步/上传素材/作品版本管理。人物答案可暂空但试玩/分享须唯一，删除人物清引用；结局只读摘要，分享主/试玩次/投稿弱。PC人物卡共用，移动各自表现。

## 已集成本地main的成果

只留结果及证据，详细提交链和当时检查见链接；本地集成不等于发布或用户亲自验收每次新排版。

| 成果 | 证据 |
| --- | --- |
| 三案引擎、持续语音、调查v3/v4、共享品牌、逐字转写与静态回退 | [组合验收](history/2026-10-24/combined-ui-animation.md)、[真实语音边界](realtime-voice-validation.md) |
| 调查输入反馈及UI1—9（人数头像/扇卡/笔触/标签/静音波形/通知/分段） | [输入反馈](history/2026-10-24/coordinator-takeover.md)、[1—9](history/2026-10-24/ui-polish-acceptance.md)；17条旧“只记录”已解除 |
| 编辑器10—17、PC卡复用、草稿状态组、窄屏步骤连接线、投稿弹窗局部排版 | [编辑器验收](history/2026-10-24/editor-feedback-integration.md)、[实施文档](game-editor-implementation.md) |
| 指认可变人数扇卡 | main `3a67735`；root实际review七图/完整diff，独立Node24.22.1 Web186/类型/构建8形象60资源通过；1/4/7人数及键盘/窄屏回归见[验收记录](history/2026-10-25/accusation-fan-layout.md)。 |
| 编辑器大形象定位稳定 | main `f433834`；root全diff/context/五图review，Node24.22.1独立28测试/Web类型/构建及8形象60资源通过；[实施记录](game-editor-implementation.md)。iframe验收限制见交接。 |
| 分享长连续正文软折行 | main `163bd0d`；保留完整文本和显式换行，1280/391 iframe无横溢；root全diff/两图review及独立Node24.22.1 Web186/类型/构建79资源通过。[记录](history/2026-10-25/share-long-text-wrap.md)。 |
| CharacterPreset内部命名迁移 | 已main c0ddd791并随abb12db发布；174文件＋runner fixture修复，保留appearanceId与/appearances/，79旧资源原字节不变。用户批准的一次常驻runner切换已完成并核验，后续禁止重复启停。[实施验收](character-preset-migration-implementation.md)。 |
| 测试覆盖率统计与双语README badge | main `e40a54f777dd7aacc7e9c361f327653b1cc5557f`；[范围/命令/限制](coverage/README.md)、[采样计数](coverage/summary.json)。clean source4f5ba19实测应用45文件/358测试，lines1501/1630=92.08%；Node脚本30测试另报263/288=91.32%，不混分母；AnimatedPortrait模板分支映射0限制公开。root完整13files/上下文/快照/计数review，源与候选collector/依赖/所有覆盖源码身份相同，复用真实采样及独立两轮review；独立3脚本语法、45生产源码/原始报告/快照/SVG/链接一致通过。CI上传14天artifact、不自动改tracked badge，未远程执行、未push/部署。 |
| 最后两人正式接入，8/8角色动画基线 | main `dd1663853f7e153efb2c977dd74b89b415f0e20c`；[接入](animation/mint-ochre-game-integration.md)、[正式游戏QA及18图](animation/mint-ochre-formal-game-qa/README.md)。root全source/context/6代表图审查，候选代码/依赖/正式资产与source72c4a93身份相同，复用388测试/types/build/IAB；独立两包采样/100中断及10新增runtime原字节/40链接通过。8787实际状态返回dd16638，旧79资源保留；新视觉问题独立修订，不称已获用户最终视觉通过。未push/部署。 |
| 银发/灰白/紫发三角色动画正式接入 | main `a4e9f7d1e04a8c0d58f0f7cbec335e686913d36c`，完整clean QA/root实际图及trace review、382测试/Web186及类型/构建79/strict通过；[最终35链及实测边界](history/2026-10-25/three-character-dawn-candidate.md)。未push/部署。 |
| 顾遥/蓝衣/阳光小胡子动画与多候选作者预览 | [顾遥](animation/coral-game-integration.md)、[蓝衣](animation/blue-glasses-game-integration.md)、[小胡子](animation/sunny-moustache-game-integration.md) |
| Logo红点彩蛋、README双语头图 | [Logo记录](../design/brand/logo-easter-egg/README.md)、[双语头图及详细集成快照](history/2026-10-25/README.md) |
| 首页流程去胶囊、开局时长CSS中西文留白 | [首页](history/2026-10-25/home-flow-typography.md)、[CJK实测](cjk-numeric-spacing.md) |
| 默认关闭的本地语音启动observer、Node24.22.1依赖修补、main常驻验收服务 | [启动审计与observer](voice-startup-audit.md)、[本地运行](development.md) |
| 历史设计/proposal与专项原文补存 | [归档入口](archive/README.md)包含原位文档、旧中间版本、动画来源、Editor/调查专项材料及来源manifest；入库不改变提案/批准状态，不作为全机器或不可见chat无遗漏证明。 |

## 仍需执行的队列

同优先级按依赖/空闲owner调度，不重派已在制工作；专项chat ID及当代执行者在交接登记。约06:52三专项waiting flags均为空，当时原因不可见；用户现澄清此前长等待为权限申请待其审批，未据此保证后续工具均正常；按下表实际交付推进，未测项保持。

| 优先 | 工作 / owner | 当前状态与下一步 |
| --- | --- | --- |
| 暂缓 | 邀请码与访问鉴权 / 用户明确暂停实施 | 用户因额外复杂度决定先暂缓，root不再推进此项；独立chat `01a17076-a9f2-7f11-aaf3-7f7c801fee37`保留供以后讨论。已interrupt原实施者，仅安全收尾：最后原PTY52545 Ctrl-C退出130、5544无监听，自建tab已关，WT/commits/ignored测试材料原处保留；[完整暂停handoff与三图](archive/2026-10-25/invite-access-paused/README.md)已审查存档，不继续开发/QA/配置/集成。设计原批准记录保留但不再构成当前实施许可；所有auth代码未main，不随本轮push发布。待用户明确重启后再排期；rootpackage/CI test:access接线同步后置。[交接](history/2026-10-25/invite-specialist-chat-handoff.md)。 |
| P1 | 已验收动画刚性修订正式接入与单独PR / 动画专项 | 用户专项最新明确“我验收过了，没问题了”，root已read_thread核原话，视觉门禁通过。旧stretch稿仍撤回历史；新版A final76dfc7a（旧3＋追加6）、B final26bed1b（旧4＋追加3）、父QA b2abf6f均clean，仅candidate/证据。已给专项整项聚合最终delta/正式资源生成/检查/真实game QA/cleanup，App/style/入口/voice/controller不得改。root唯一integrator先完整review；单独PR为用户明确例外，但远程abb12db与local未发布变化不同，先冻结候选交审，后root明确发布turn再构造仅动画PR分支，禁止无关localmain提交混入或现在push/createPR。5355原owner/用户在用保留。 |
| P1 | 线上性能与缓存优化 / production_performance | 用户明确重要任务：审计lie-game.nighca.workers.dev，构建期静态资源hash URL＋正式长期缓存、图片可无损压缩，已spawn专职/root/production_performance整项负责。起点reviewed d2a4eff，线上已知abb12db与本地优化分清；先只读真实冷/暖请求/响应头/trace与源/构建核验，在docs/performance/2026-10-25/**给优先问题及最小生产文件turn申请，root协调后原owner继续实施/检查/浏览器/cleanup。JS/CSS现有hash、public形象/animation package/parts/manifest与入口更新链均核；immutable只给内容寻址资源，HTML/可变manifest重验证，API/WS不静态缓存。无损需RGBA/alpha与色彩元数据/实际外观证明，不改canonical原图，不与动画正式生成/结果App/style抢写。只读线上不启语音/provider；部署/资源配置另走已授权发布流程，不自动push/deploy。 |
| 完成 | 首页目录及完整官方案构建打包 / stable_exploratory_qa＋root review | [实施与证据](bundled-case-catalog.md)，source d494e43→候选792e182；目录原字节移至content/case-catalog，三案canonical JSON eager打包，首页首次render有卡、官方案无/games/*请求，unknown明确失败，Editor/分享快照优先。root完整21文件/上下文/三代表图review，候选与source全部生产/测试/依赖身份同，复用46测试/types/build89及真实阻断三案/直达reload验收；独立hash/目录字节/实际JS体积核验通过。JS gzip增12824字节；5544原73441退出130/PID49549消失、tab/draft/覆盖已恢复。未push/部署。 |
| P2 | 宣传视频准备研究 / 已完成本轮复核 | [现行方法与依赖简报](promo-video-production-research.md)已完成，source b8912bb；原9cf490af归档保持原字节。root全篇/来源/八预设/Node前提review，另核OBS、Remotion字幕与许可官方资料。建议真实录制＋本地剪辑，多版本再评估独立Remotion；仅建议，无录屏/生成/安装/制作。研究不再排待做，实际制作仍等用户明确放行。 |
| P2 | 代码与架构审查 / 首轮完成，防御修复在制 | [两项发现及探针](reviews/architecture-code-review-2026-10-25/README.md)、[上下文预算调查](reviews/context-budget-2026-10-25/README.md)已root实际源码/完整diff review，独立Node24.22.1复现。CR01合法三人自编案72905字节超64KiB，历史亦可增长超限；source bb947d0精确帧守卫＋特定错误已root完整12文件diff/context/tests review并纳入候选，不提高上限/删历史/新增内容硬门槛。CR02与QA001加载恢复已main1f168e3，root实际全diff/源码/三原图review，候选151组合测试/类型/构建89资源通过；保留8s fetch+body deadline/显式retry与原草稿。两任务不改core规则，不用真实provider。 |
| P2 | 稳定版本探索QA / 首轮完成，发现已分派 | [报告与11张原生图](qa/stable-exploration-2026-10-25/README.md)，source0a25d05。root实际报告/fixture/代表图review；三案demo、终局/计时/Editor分享/391/键盘/回退已测，不代表真人语音或全覆盖。QA001清单失败重开不恢复已随1f168e3修复；QA002同名同形象指认歧义，用户明确选择编辑器姓名唯一，已root完整diff/context review并候选集成10c57c2：draft校验＋UI通路59测试/类型/构建89资源，候选全部生产/测试/依赖同source dfd89c4复用验证，暂存草稿保留；真实浏览器组合未验。QA003试玩返回丢步骤为P3改进建议，未据此扩大需求。原5544 PTY26270已退出130、PID14248消失/无监听，tabs1/2及测试存储已恢复；新5544回合只归清单修复owner。 |
| P1 | 真人与盲测质量 / root协调用户＋独立QA | 整合版mic/外放/长会话、三案盲测、多用户隔离未闭环；新增五声待耳验，不能用fake代替。保护用户设备。 |
| P2 | 编辑器分享/投稿端到端 / 编辑器＋root review | Editor已交有界IAB分享QA（source main0f73006、share blob7539ab638591ef416eafbfda102a90ed72aa4292，Node24.22.1生产encode）：normal539真实UI Unicode/换行/保留字符逐字相等及actual reload通过；恰16000 ASCII完整URL新blank tab fresh goto/reload intro通过、href16000；16001特定长度错误、损坏gzip错误及reload通过。root已实际review完整报告/四图，无codec blocker，局限保留。network初始fragment捕获因PerformanceAPI missing TypeError一次停止，未重试CDP；跨浏览器/地址栏粘贴/外部传输/离线未验，16k仍暂定、128KiB仍仅Node。证据/private/tmp/lie-share-browser-results.md及同名前缀fixtures/四张jpg；自建tab19/20/21已关，无viewport/draft/voice/mic/provider/服务动作，旧browser3/tab1未动。 GitHub投稿仍受PRIVATE及用户权限门禁。 |
| P2 | 角色出戏边界 / 语音内容owner | 攻击问仍有幕后元话语，候选未解决且未生产；停止无限付费叠提示，不擅换模型/供应商/剧情。[调查](role-immersion-investigation.md) |
| P2 | 启动延迟与剩余回归 / 语音/工程owner待排 | observer已集成但无真人阶段采样/加速结论；先有界实测，再优化，不跨轮保活mic/连接。开发代理WS问题已独立派下行owner，不混作延迟结论。 |
| P2 | 开发代理完整WS拒绝 / review_blue_animation | [无凭据网络对照](dev-websocket-rejection.md)已定位Cloudflare Vite开发宿主丢弃非101响应；Web代理/Worker HTTP控制保留503/403。诊断脚本与记录已纳入本地main `0a67498`，未修补vendor/生产配置；宿主限制仍未修复，上游或开发适配后置评估。 |
| P3 | 银发/双丸子主题区分 / 视觉owner待排 | 两者accent同`#78DDD7`；先定accent/卡底/服装层级方案，不混waiting返修。若改服装须静态/动画一致，未授权全面重画。 |
| 完成 | 结果页A设计与实施 / 原调查专项＋root review | [实施](result-scene-implementation.md)、[原生QA](../design/result-scene-implementation/README.md)，用户已明确批准当前版实施。source d97a13b→候选7b4d96a，correct实际被指认人＋左右完整经过，wrong760居中短说明/不泄真相，静态default/首字回退、标题焦点、391正常流按钮、原restart/returnLabel保留；无B/C新素材。root完整18文件/源码/tests/3图review，候选组合Web220/24files、类型/build89strict通过；同步catalog挂载与wrong新标签均保留。5507原30600退出1/无监听，tab35/36及网络/媒体覆盖已清，源/图/设计入库，未push/部署。 |
| P2/P3 | 动画剩余质量 / 动画＋UI owner | sunny前代只读QA：8787真实游戏正常单canvas/单RAF及切人；3次合成iframe暂停/恢复未见重复RAF，仅为合成事件证据。IAB明确子agent不支持真实visibility，真实隐藏恢复仍未验，不能视为PASS；未用mic/provider，自建tab已清理、服务保留。临时证据`/private/tmp/lie-sunny-visibility-qa-20261025/handoff.md`及同目录`observations.json`。1280×720既有舞台裁切保留；按真实问题排期，静态回退及资源取消不退化。 |

## 保留的门禁与外部依赖

- **官方投稿/仓库**：未来公开现`nighca/lie`，不另设投稿仓；目前仍PRIVATE，未授权改可见性或代理建fork/commit/PR。用户本人GitHub确认，无LIE OAuth/PAT；玩家贡献PR不改变内部无PR集成。不要向公开仓发送项目私有正文。[投稿研究](editor-official-submission-proposal.md)
- **公开访问/费用**：临时无应用鉴权语音有特定线上授权，带有效期邀请码核心设计已获用户确认（默认14天、限制游戏、不限频率、不恢复局；到期处理授权按简单度选），**用户现因复杂度明确暂缓实施**，chat保留、代码/证据保存、只做自有服务安全收尾，须明确重启才继续；不授权secret/资源/DB/DO/账号/部署，费用预算/回收策略仍暂缓，本次不新增频率/并发限制；额度不足断连不是即时硬止付。[公开方案](public-voice-launch-proposal.md)、[额度](linx-quota-investigation.md)
- **宣传视频制作后置，准备研究可推进**：制作方法/工具依赖研究已授权，初步研究及本轮增量复核均已完成；不能把制作gate当研究阻塞。脚本、分镜、录屏、旁白/音乐、生成媒体和实际制作仍须用户判断产品成熟并明确放行，研究完成/空闲不替代。
- **实测与费用**：付费模型复核先审脚本/固定矩阵、设单次上限，首FAIL/UNCERTAIN/协议异常即停，只清自建资源。开发优先IAB，Chrome例外仅已授权灵矽控制台。普通测试/类型/构建不读取管理key、不自动发真实推理。

原位维护决定/owner/依赖/下一步；已完成流水移[历史](history/2026-10-25/README.md)。记录、本地集成、push、部署与真人验收分别报告。

分享前轮一次inventory无IAB已停止；后续Editor实际有界QA已交，见队列，root已review。三角色已完整QA交付并main；true hidden/full waiting game400ms/更广race及真机touch未验，fake不等live voice。新组合完整有序链见[历史](history/2026-10-25/three-character-dawn-candidate.md)。
