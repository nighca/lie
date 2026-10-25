# LIE — 当前项目计划

更新：2026-10-25，08:36 Asia/Shanghai核验本地main `e40a54f777dd7aacc7e9c361f327653b1cc5557f`；文档提交会推进HEAD，接任时重读实际状态。[交接登记](coordinator-handoff.md)管协调权/服务，[历史索引](history/README.md)管完成证据；旧快照不覆盖最新授权。

## 当前轮换交接

当前仍由`01a17012-fa00-7170-ac0a-21c1900d71cd`（LIE 主协调 · 10月25日清晨接任）担任active协调/唯一integrator，本代`lie`/`lie-2`为ACTIVE且target本chat，前代`lie-3`/`lie-4`保持PAUSED；[登记](coordinator-handoff.md)及[接任证据](history/2026-10-25/coordinator-arrival-01a17012-fa00-7170-ac0a-21c1900d71cd.md)保留创建/通知事实。用户已回来，临时无法回应模式结束；此前数小时浏览器等待经用户澄清为待其审批，不推断后续工具必然正常。Editor定位、fan及银发/灰白/紫发正式QA均已main；历史设计归档已完成本轮收集并入库，入口见[归档](archive/README.md)。当前命名迁移已完整交付，已review并本地集成main c0ddd791，用户批准的一次受控runner切换已完成，8787/8788回环服务及79资源核验通过；mint/ochre已完成正式游戏QA和root实际review，8人基线已本地main dd16638；新微动作/头比例修订独立待用户验收后PR。重大门禁与既有有效授权保留，未push/部署。

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
| 本地main | 08:36核验`e40a54f777dd7aacc7e9c361f327653b1cc5557f`干净，8/8角色基线、邀请码已批设计/独立chat交接、服务规则及覆盖率徽章均已本地集成；实施中的鉴权未合入。以下文档提交会推进HEAD，本代新增成果未push。 |
| 本地试玩 | 用户launchd独立维持[8787](http://127.0.0.1:8787/)，薄Worker8788；自动跟随干净owning main，实际版本看[SHA接口](http://127.0.0.1:8787/__lie/main-status)。轮换不得停止或重复启动。 |
| 远程/线上 | 本地origin/main跟踪及最后实际部署证据均为`32d89bf91f441168148884593a0f49b816ad7162`；本轮未fetch/重验远端，不能冒称最新remote。见[部署证据](deployments/2026-10-24-animation-milestone.md)。 |
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
| 暂缓 | 邀请码与访问鉴权 / 用户明确暂停实施 | 用户因额外复杂度决定先暂缓，root不再推进此项；独立chat `01a17076-a9f2-7f11-aaf3-7f7c801fee37`保留供以后讨论。已interrupt原实施者，仅授权自有5544/tab安全收尾并保留全部WT/commits/dirty/已有证据，不继续开发/QA/配置/集成。设计原批准记录保留但不再构成当前实施许可；所有auth代码未main，不随本轮push发布。待用户明确重启后再排期；rootpackage/CI test:access接线同步后置。[交接](history/2026-10-25/invite-specialist-chat-handoff.md)。 |
| P1 | 新一批动画微动作/头比例修订 / 动画专项两lane | 用户在动画chat明确：silver、salt、plum、mint、ochre waiting动作太小；mint default/listening也小；ochre speaking头大小跳变。现有8人基线继续集成，不被此批阻塞。两lane已clean交付并在5355新tab47供用户验收：A HEADc4881b3（base772dfa5），B HEAD78031e8（basedd16638）；父证据HEAD1bf177f独立保留，root仅核三WT clean/HEAD，未审为通过。**用户确认后才单独提PR并处理main/游戏接入**，这是该批内部无PR规则的明确例外，不现在开PR、不提前合入/发布。已核用户原消息，起点可用已审main dd16638；5355和在用WT由原owner持有。 |
| P2 | CharacterPreset内部命名迁移 / character_preset_migration＋root review | owner已交 `79b5503`→`354f58b`，base2982e6a，174文件迁移＋runner test fixture修复；source388全检、79资源原字节及真实IAB通过。独立review发现含空格Node路径的shebang问题，已修且目标测试通过；root `integrate-character-preset-dawn/lie`从666e9c9有序cherry至候选 `c0ddd791fd98182b5888e986a9aa2b31b7680dc5`，最终独立1目标test/79原字节/93链接/生产身份核验通过，388/type/build/IAB复用；已本地main c0ddd791。保持appearanceId与/appearances/；用户已明确允许现在受控切换，实施owner已完成一次受控切换，服务SHA实返3c54a9e6、8787/8788仅回环、79资源+manifest字节一致、实际私密路径403；记录见[实施验收](character-preset-migration-implementation.md)，不得重复启动8787/8788。[计划](character-preset-migration-plan.md)。 |
| P1 | 真人与盲测质量 / root协调用户＋独立QA | 整合版mic/外放/长会话、三案盲测、多用户隔离未闭环；新增五声待耳验，不能用fake代替。保护用户设备。 |
| P2 | 编辑器分享/投稿端到端 / 编辑器＋root review | Editor已交有界IAB分享QA（source main0f73006、share blob7539ab638591ef416eafbfda102a90ed72aa4292，Node24.22.1生产encode）：normal539真实UI Unicode/换行/保留字符逐字相等及actual reload通过；恰16000 ASCII完整URL新blank tab fresh goto/reload intro通过、href16000；16001特定长度错误、损坏gzip错误及reload通过。root已实际review完整报告/四图，无codec blocker，局限保留。network初始fragment捕获因PerformanceAPI missing TypeError一次停止，未重试CDP；跨浏览器/地址栏粘贴/外部传输/离线未验，16k仍暂定、128KiB仍仅Node。证据/private/tmp/lie-share-browser-results.md及同名前缀fixtures/四张jpg；自建tab19/20/21已关，无viewport/draft/voice/mic/provider/服务动作，旧browser3/tab1未动。 GitHub投稿仍受PRIVATE及用户权限门禁。 |
| P2 | 角色出戏边界 / 语音内容owner | 攻击问仍有幕后元话语，候选未解决且未生产；停止无限付费叠提示，不擅换模型/供应商/剧情。[调查](role-immersion-investigation.md) |
| P2 | 启动延迟与剩余回归 / 语音/工程owner待排 | observer已集成但无真人阶段采样/加速结论；先有界实测，再优化，不跨轮保活mic/连接。开发代理WS问题已独立派下行owner，不混作延迟结论。 |
| P2 | 开发代理完整WS拒绝 / review_blue_animation | [无凭据网络对照](dev-websocket-rejection.md)已定位Cloudflare Vite开发宿主丢弃非101响应；Web代理/Worker HTTP控制保留503/403。诊断脚本与记录已纳入本地main `0a67498`，未修补vendor/生产配置；宿主限制仍未修复，上游或开发适配后置评估。 |
| P3 | 银发/双丸子主题区分 / 视觉owner待排 | 两者accent同`#78DDD7`；先定accent/卡底/服装层级方案，不混waiting返修。若改服装须静态/动画一致，未授权全面重画。 |
| P3 | 结果页被指认角色与正误两态 / 视觉＋动画owner | [结果页提案](result-character-states-proposal.md)已review；[最小结果投影](result-projection-implementation.md)已完成本轮本地集成验证：生产仅controller2行，Web183测试/类型/构建60资源通过，已纳入本地main `0a67498`；复制session.result，不泄wrong真相、原清理语义保持。完整UI/新素材/动画契约仍待方案；用户倾向结果页加被指认者，合并指认页仅备选未定。先局部方案→GameView投影/播放契约→素材与UI联合接入；从result.characterId取人，不用已清空currentCharacterId/真凶替代。正确懊恼/无奈，错误不解/抗议；错指仍不揭真相，一次错误终局。具体新素材授权另核。 |
| P2/P3 | 动画剩余质量 / 动画＋UI owner | sunny前代只读QA：8787真实游戏正常单canvas/单RAF及切人；3次合成iframe暂停/恢复未见重复RAF，仅为合成事件证据。IAB明确子agent不支持真实visibility，真实隐藏恢复仍未验，不能视为PASS；未用mic/provider，自建tab已清理、服务保留。临时证据`/private/tmp/lie-sunny-visibility-qa-20261025/handoff.md`及同目录`observations.json`。1280×720既有舞台裁切保留；按真实问题排期，静态回退及资源取消不退化。 |

## 保留的门禁与外部依赖

- **官方投稿/仓库**：未来公开现`nighca/lie`，不另设投稿仓；目前仍PRIVATE，未授权改可见性或代理建fork/commit/PR。用户本人GitHub确认，无LIE OAuth/PAT；玩家贡献PR不改变内部无PR集成。不要向公开仓发送项目私有正文。[投稿研究](editor-official-submission-proposal.md)
- **公开访问/费用**：临时无应用鉴权语音有特定线上授权，带有效期邀请码核心设计已获用户确认（默认14天、限制游戏、不限频率、不恢复局；到期处理授权按简单度选），**用户现因复杂度明确暂缓实施**，chat保留、代码/证据保存、只做自有服务安全收尾，须明确重启才继续；不授权secret/资源/DB/DO/账号/部署，费用预算/回收策略仍暂缓，本次不新增频率/并发限制；额度不足断连不是即时硬止付。[公开方案](public-voice-launch-proposal.md)、[额度](linx-quota-investigation.md)
- **宣传视频严格后置**：只批准制作方法/工具依赖研究；脚本、分镜、录屏、旁白/音乐、生成媒体和制作必须等用户判断产品成熟并明确放行。空闲或夜间小修授权不替代。
- **实测与费用**：付费模型复核先审脚本/固定矩阵、设单次上限，首FAIL/UNCERTAIN/协议异常即停，只清自建资源。开发优先IAB，Chrome例外仅已授权灵矽控制台。普通测试/类型/构建不读取管理key、不自动发真实推理。

原位维护决定/owner/依赖/下一步；已完成流水移[历史](history/2026-10-25/README.md)。记录、本地集成、push、部署与真人验收分别报告。

分享前轮一次inventory无IAB已停止；后续Editor实际有界QA已交，见队列，root已review。三角色已完整QA交付并main；true hidden/full waiting game400ms/更广race及真机touch未验，fake不等live voice。新组合完整有序链见[历史](history/2026-10-25/three-character-dawn-candidate.md)。
