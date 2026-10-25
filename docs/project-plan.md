# LIE — 当前项目计划

2026-10-25，本次整理基线为已审本地main `30822d3779102de249c3daca0800cb4316bff53f`；文档集成会推进HEAD，操作前重读实际仓库。[协调登记](coordinator-handoff.md)管所有权/可恢复交付，[服务台账](development.md#服务登记与生命周期)管端口，[整理前逐字快照](history/2026-10-25/coordinator-state-before-refresh-30822d3/README.md)保留旧状态和审批证据，不能用旧快照覆盖新决定。

## 协调与当前版本

- Active/唯一integrator：`01a17012-fa00-7170-ac0a-21c1900d71cd`。本代`lie`/`lie-2` ACTIVE、target本chat；前代`lie-3`/`lie-4` PAUSED。约10:41按[四小时轮换](coordinator-rotation.md)交接，不能因定时触发夺回已释放的权力。
- 用户重申：大部分实施、调研、环境、排障、浏览器和长检查整项委派；root做分配、接口/决策、实际完整review、隔离候选有序cherry-pick及clean main快进。委派不转移结果责任；内部无PR，只有本批动画有明确单独PR例外。
- 当前本地main已含结果页A、完整三案同步打包、清单失败恢复、姓名唯一校验及语音帧守卫。最后已证远程/部署仍`abb12dbf7a40689be593c2a1e580f23cfcc5611e`（[发布证据](history/2026-10-25/coverage-publication.md)）；本次未fetch，不把本地新功能称线上已部署。既有一次发布授权已完成，不自动再次push/部署。
- 用户已回来。原夜间约00:20–08:30临时授权只是历史，不延长；此前长浏览器等待是待其审批，不据此保证工具无故障。常规已授权工作继续，重大产品/架构/供应商/范围决定及明确后置须确认。
- 批量handoff；实际差异/哈希证明代码、依赖、组合及相关环境身份相同才复用验证。文档批只查文档。所有完成的设计/提案及拒绝/替代方案入库，[归档](archive/README.md)不等于批准。固定端口复用，用完停，保护8787/8788及所有他人dirty/在用WT。

## 已批准的产品与架构

三官方案3/4/4人，询问额度480/600/540秒；通用引擎可变人数，新同玩法案件仅内容与必要呈现配置。浏览器运行故事、会话、指认，薄Worker仅provider传输；纯TS core独立Vue/宿主。故事纯文本，形象以appearanceId分离，完整故事浏览器可查，凭据私密。中文B黄蓝/深蓝卡通、调查A/首页A、既有Logo/头像、有限Canvas与静态回退均已批准，见[架构](architecture.md)。

语音为唯一人物沟通方式，转写只读、按钮指认，无证据DSL。持续多轮可打断；连通准备完成后静音/等待/回答均计额度，停止暂停、切人不重置。耗尽停止语音并允许最终指认；合法错指终局失败不揭真相，正确才揭晓。离开确认，刷新不恢复局内状态。玩家仍final-only回退，不称实时ASR；合成嘴不称真实口型同步。

编辑器三步自由往返、必选预设、唯一答案、同引擎试玩、压缩fragment、本地草稿，无账号/云同步/上传资产/发布版本管理。新编辑草稿姓名trim后唯一，临时未完成草稿仍可保存；旧同名分享可读。三人是作者内容原则，不是core人数硬限制。

## 当前可执行队列

各在制交付的完整base/ordered SHAs/WT见[交接](coordinator-handoff.md)及[恢复清单](history/2026-10-25/coordinator-state-before-refresh-30822d3/active-handoff-refs.json)。下表状态来自root本次完整委派；未root审查、未测、未集成分别保留。

| 优先 | 工作 / owner | 当前状态与下一步 |
| --- | --- | --- |
| P1 | 线上性能/cache / production_performance | clean三提交handoff已交，待root实际review。保留旧fixed89资源原字节，新增92hash输出/46parts，源码hash在Vite前替换、独立hashed manifest；source Web228/Gateway13＋transport3/types/build/cf dry-run通过，IAB同版warm13immutable请求0传输/仅HTML208B属执行者证据。冷首页8PNG7.47MB；PNG压缩仅调查约3.92%，未生成。**跨部署旧hash留存未实现，窄Worker-first冷请求计Worker费用/额度**，不是发布ready保证。5544/自建tab已清。root审查cache报告后决定有限旧hash兼容方案/发布限制，不能擅加新存储或部署。 |
| P1 | 刚性5角色动画 / 动画专项 | 用户已明确验收通过，不重问旧视觉批准；原stretch历史仍拒绝。20链22b正式包不变，d106只修checker/失败证据。AR01 crop审计旧PASS错误已核；gray/plum正确检查PASS，silver phase20/28三unique点FAIL。owner在做t2.5/3.5真实Canvas归因；已见t2.5 alpha127对base255、4×短浅横线，正常约2.48×0.413 CSS px，非P1但不能称无问题。尚未授权改mask/package或给PR turn；先完整新证据/必要修正提议review。5355暂归owner精确QA，不擅停。 |
| P2 | 动画首帧 / character_preset_migration | 从reviewed9316701独立codex/animation-first-render在制，无source handoff。nonnull animation pending直接走动画、不先mount/request静态；srcnull、reduce、能力不足、失败保留回退。独占AnimatedPortrait及独立tests/docs，保留取消/迟到隔离/单RAF/卸载/hidden；不改App/style。5544下一回合归此owner，启动前核监听和真实登记，完整验收/cleanup后交。 |
| P2 | 背景姓名高亮 / 原调查视觉专项 | background-character-names，basee222，首helper d21f5ea；App/style/test仍dirty归owner，未clean交付，不能记PASS/main。仅开场/调查背景，真实姓名字面/最长优先、主题浅底＋字重深蓝字，无preset/同名歧义中性；保留纯文本/换行/复制，禁v-html/NLP，官方/分享/Editor试玩一致。5507按需有界QA，PID待handoff不猜。 |
| P2 | 灰白胡须声音偏年轻 / older_male_voice | 用户否定当前龙楠听感，目标更成熟年长自然；专人已一次只读刷新灵矽目录并核两项可用中文试听：[候选与证据](older-male-voice/available-candidates.md)。龙三叔已有项目样本但与sunny同声；龙天当前未占用、尚未经项目实时/人耳验收。等待用户试听选声，再协调canonical单字段修改；当前映射未改，无新增付费合成/供应商切换。完整初轮及替代方案已归档，root已实际review三提交/公开字段/脚本与样本哈希，文档批无应用改动。 |
| P2 | 专职代码review / architecture_code_review | 两项初始发现及CR01预算调查已审；CR01防御已main，CR02/QA001已main。刚性审查5db3559→10039f4与cache审查0602604新clean报告**待root实际review/入库**，不在本批提前集成或称已审。AR01已即时协调owner。后续按具体缺陷排修，不泛化重构。 |
| P1 | 真人/盲测/多用户质量 / root协调用户＋QA | 整合mic/外放/长会话、三案盲测、固定device多用户隔离、正式费用硬限额未闭环；新增声需耳验，fake/短WAV/配置ready不可替代。保护用户设备，不后台保活mic。 |
| P2 | 分享/投稿后续 / Editor＋root | Node边界及有界IAB539/16000 URL往返、reload/损坏输入已测；跨浏览器、地址栏粘贴、外部传输、离线未验，16k暂定，128KiB仅Node。旧fragment网络捕获失败未补测；投稿受PRIVATE/用户GitHub权限门禁，不新增OAuth/PAT/代理投稿。证据出处保留在整理前快照。 |
| P2 | 角色出戏 / 语音内容owner待排 | [调查](role-immersion-investigation.md)攻击问仍有幕后元话语，候选未解决未生产；停止无限付费叠提示，不擅换模型/供应商/剧情。 |
| P2 | 启动延迟/开发WS / 工程owner待排 | observer已main，无真人阶段加速结论；[开发宿主非101拒绝](dev-websocket-rejection.md)限制仍在，诊断已main，不修vendor/冒称解决。 |
| P3 | Editor返回步骤/主题/动画边界 / 对应owner待排 | QA003试玩返回步骤丢失仍P3建议，未扩大需求；silver/mint同accent的区分方案待定，不全面重画。真实visibility、广泛迟到race、硬件touch未验，1280×720既有舞台裁切保留；合成hidden事件不当真隐藏PASS。 |
| 暂缓 | 邀请码/访问鉴权 | 用户因复杂度明确暂停，chat `01a17076-a9f2-7f11-aaf3-7f7c801fee37`保留。[暂停归档](archive/2026-10-25/invite-access-paused/README.md)及所有候选/ignored资料保留，代码未main；原设计确认不构成当前实施许可。需用户明确重启，root不再推进。 |
| P2 | 结算后改编游戏 / 待排期，编辑器与结果页owner协调 | 用户要求先记需求：成功/失败结算页均提供“改编游戏”，点击进入现有编辑器，以本局完整案件内容预填（故事、人物、形象、答案及结局等），而非新空白模板；官方案、分享案与编辑器试玩沿用当前实际游戏快照。不携带本局转写/计时等运行状态，不修改原案件，后续复用现有编辑、试玩和分享流程。需保护已有本地草稿，至少不能静默覆盖，具体沿现有草稿机制确定；失败结果页本身仍不提前揭真相，主动改编会进入包含答案的作者内容。依赖当前App/style姓名调整及结果/编辑器入口所有权，按全backlog排期，未开始实施，不抢占进行中任务。 |
| P2 | 调查页姓名移至询问记录标题 / 原调查视觉专项 | 用户明确移除大立绘下姓名，将旁侧标题改为“{当前人物姓名}的询问记录”，随切人同步，侧边选择卡姓名保留。已交App/style既有owner，先冻结背景高亮成果，再独立追加commit；检查桌面/391窄屏长姓名、舞台布局及标题语义，相关验证和5507临时服务清理整项交付，root实际review后集成。仅调查页，不扩结果/编辑器，当前待实施。 |

## 已集成与已完成研究

| 成果 | 当前事实及证据 |
| --- | --- |
| 原三案/8人动画/UI/Editor/共享/品牌/命名迁移/README覆盖率 | 已随abb12db发布；详细历史见[索引](history/2026-10-25/README.md)与[整理前计划](history/2026-10-25/coordinator-state-before-refresh-30822d3/project-plan.md)。应用92.08%、脚本91.32%为不同分母的历史采样快照，不是现main重新采样。 |
| 姓名唯一 | 已main10c57c2；用户选定修复QA002，59相关测试/types/build89及root身份review，旧分享兼容；独立浏览器组合未验不冒称。 |
| 上下文帧守卫 | 已main531c721；[实施](context-frame-guard.md)，完整UTF8/RPC envelope守卫和具体提示，原64KiB/故事/历史保留，不解决超限内容续玩政策。 |
| 清单加载恢复 | 已main1f168e3；[证据](preset-loading-recovery.md)，8s fetch＋body deadline/retry/草稿保留；真实候选151组合测试/types/build89通过。 |
| 目录＋完整官方案eager打包 | 已main792e182；[证据](bundled-case-catalog.md)，目录/三案单一源，unknown失败，自编/分享优先，无官方/games请求；46相关测试/types/build89及有界实际浏览器通过，JS gzip增12824B。图片/语音仍运行时，不称整站离线。 |
| 结果页A | 已main7b4d96a；[实施](result-scene-implementation.md)，真实被指认者default/首字回退、wrong终局不泄真相，correct完整经过；组合Web220/24files/types/build89通过，root原图review，B/C未授权。 |
| 稳定探索QA首轮 | [报告11图](qa/stable-exploration-2026-10-25/README.md)：无P1、两P2已按上表修复、P3仍建议。测试固定abb12db/demo；不当真人provider验收。 |
| 宣传准备研究 | [方法/依赖研究](promo-video-production-research.md)已完成，不再排待做。实际视频严格后置；原研究与拒绝/替代设计按[归档](archive/README.md)保留。 |

## 保留门禁与可验证边界

- 默认无内部PR/自动push/deploy；动画单独PR仅此批例外，须先完整rootreview、明确turn及仅动画远程基线，不能夹带local未发布功能。记录、本地集成、push、CI、部署、真人验收分别报告。
- 投稿仓仍PRIVATE，未授权改可见性/代理fork提交；[投稿方案](editor-official-submission-proposal.md)。无应用鉴权语音的既有特定线上授权不扩展到新secret/资源/DB/账号或新的付费试验，[公开方案](public-voice-launch-proposal.md)。
- 宣传脚本/分镜/录屏/旁白音乐/生成媒体/实际制作须用户判断成熟并明确放行；只完成研究不跨门禁。
- 付费复核必须固定矩阵/次数时长费用上限、首FAIL/UNCERTAIN/协议异常即停、只清自建资源。优先IAB；具体任务已有明确unavailable后独立Chrome fallback许可才沿用，不把灵矽控制台特批扩大到所有开发浏览器。
- 本次只做协调文档整理，没有应用测试、端口扫描、远程fetch或服务操作；各PASS仅沿用其原始证据与范围。
