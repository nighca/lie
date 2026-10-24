# LIE — 当前项目计划

更新：2026-10-25，依据07:03:31 Asia/Shanghai核验本地 main `3a677358cc5fc69f215f13c44d51c5a9643eab2c`；文档提交会推进HEAD，接任时重读实际状态。[交接登记](coordinator-handoff.md)管协调权/服务，[历史索引](history/README.md)管完成证据；旧快照不覆盖最新授权。

## 当前轮换交接

2026-10-25 06:43 Asia/Shanghai，新协调`01a17012-fa00-7170-ac0a-21c1900d71cd`（LIE 主协调 · 10月25日清晨接任）核实前代release及clean main后认领active/唯一integrator，已实际通知三个专项保持owner并向本代完整批量交付。本代恰好两次mode=create产生`lie`/`lie-2`，ACTIVE且target本chat，每30分钟/4小时；工具自动分配历史ID，以target＋created_at区分，不能按旧快照暂停它们。前代`lie-3`/`lie-4`仍PAUSED。详[登记](coordinator-handoff.md)、[接任证据](history/2026-10-25/coordinator-arrival-01a17012-fa00-7170-ac0a-21c1900d71cd.md)。本代已本地集成Editor定位修复与fan扇卡至`3a67735`，未push/部署。约06:52三专项waiting flags均恢复为空，原因不可见，不代表审批批准或拒绝；fan已review/独立验证并本地集成、Editor已review/独立验证并本地集成、动画正式游戏QA仍未完整交付。保留owner/dirty工作/候选refs/服务；17条不重做。08:30截止不延长，重大门禁与队列不变。

## 授权与执行方式

- **夜间临时授权**：2026-10-25约00:20至当日08:30，用户无法回应，当前及接任协调继续待办/新问题，小实现、排版、局部视觉修复自行决定，经实际review验证后推进，不等待常规验收。重大产品/玩法/架构/供应商/范围决定及明确后置工作仍需确认；沉默不是批准。08:30不因轮换延长，用户会主动告知回来，不另建提醒。
- **整项委派**：有一定工作量即交subagent/专项，含环境、配置、排障、浏览器验收与长检查；root负责接收、排期、接口/用户决策、实际review、串行集成与报告，仍对结果负责。
- **协作**：[AGENTS](../AGENTS.md)规定隔离worktree、唯一integrator、完整clean handoff、实际diff review及候选cherry-pick验证后main快进；内部不建PR，不自动push/部署。反馈批量交付，冲突/接口/共享viewport即时协调。
- 每30分钟推进、每4小时写交接并建全新接任chat；核实接任成功后停旧任务/归档旧chat，失败不盲退、不双integrator。具体ID与[轮换流程](coordinator-rotation.md)见交接登记。

## 当前版本与可验证边界

| 入口 | 当前事实 |
| --- | --- |
| 本地main | 当前main `3a1fa41780b00806c27f646dba715eab0065121b`已含下表成果；本轮文档提交推进HEAD，后续候选另列；这些新增改动均未push。 |
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
| 银发/灰白/紫发三角色动画正式接入 | main `a4e9f7d1e04a8c0d58f0f7cbec335e686913d36c`，完整clean QA/root实际图及trace review、382测试/Web186及类型/构建79/strict通过；[最终35链及实测边界](history/2026-10-25/three-character-dawn-candidate.md)。未push/部署。 |
| 顾遥/蓝衣/阳光小胡子动画与多候选作者预览 | [顾遥](animation/coral-game-integration.md)、[蓝衣](animation/blue-glasses-game-integration.md)、[小胡子](animation/sunny-moustache-game-integration.md) |
| Logo红点彩蛋、README双语头图 | [Logo记录](../design/brand/logo-easter-egg/README.md)、[双语头图及详细集成快照](history/2026-10-25/README.md) |
| 首页流程去胶囊、开局时长CSS中西文留白 | [首页](history/2026-10-25/home-flow-typography.md)、[CJK实测](cjk-numeric-spacing.md) |
| 默认关闭的本地语音启动observer、Node24.22.1依赖修补、main常驻验收服务 | [启动审计与observer](voice-startup-audit.md)、[本地运行](development.md) |

## 仍需执行的队列

同优先级按依赖/空闲owner调度，不重派已在制工作；专项chat ID及当代执行者在交接登记。约06:52三专项waiting flags均为空，原因不可见，不推断审批结论；按下表实际交付推进，未测项保持。

| 优先 | 工作 / owner | 当前状态与下一步 |
| --- | --- | --- |
| P1 | 带有效期邀请码访问设计 / 待用户确认 | [方案](invite-access-design.md)已root完整review并本地集成3a1fa417，仅文档：推荐可复用/多人转发、统一绝对exp默认7天可指定；到期停voice暂停actions保留页内局，新码continue；home/intro/editor/share公开、所有play入口需码。均为建议待用户确认，未授权实现/secret/资源/DB/DO/账号/部署，预算/回收及多人隔离风险仍独立保留。 |
| P2 | mint/ochre动画候选 / 动画专项 | 两人已并行在制，WT mint-puffs-animation/ochre-freckles-animation、同名分支base73ba138；仅各design候选，5358/5359作者预留（监听未核），按原canonical、不改色、不起第三人。 |
| P2 | CharacterPreset内部命名迁移 / root待整项排owner | fan/Editor/silver依赖均已main释放，现eligible但尚未执行；按最新main统一迁移，保留appearanceId及/appearances/，纳入runner命令与环境owner受控重启。[落地提案](character-preset-migration-plan.md)。 |
| P1 | 真人与盲测质量 / root协调用户＋独立QA | 整合版mic/外放/长会话、三案盲测、多用户隔离未闭环；新增五声待耳验，不能用fake代替。保护用户设备。 |
| P2 | 编辑器分享/投稿端到端 / 编辑器＋root review | Editor已交有界IAB分享QA（source main0f73006、share blob7539ab638591ef416eafbfda102a90ed72aa4292，Node24.22.1生产encode）：normal539真实UI Unicode/换行/保留字符逐字相等及actual reload通过；恰16000 ASCII完整URL新blank tab fresh goto/reload intro通过、href16000；16001特定长度错误、损坏gzip错误及reload通过。root已实际review完整报告/四图，无codec blocker，局限保留。network初始fragment捕获因PerformanceAPI missing TypeError一次停止，未重试CDP；跨浏览器/地址栏粘贴/外部传输/离线未验，16k仍暂定、128KiB仍仅Node。证据/private/tmp/lie-share-browser-results.md及同名前缀fixtures/四张jpg；自建tab19/20/21已关，无viewport/draft/voice/mic/provider/服务动作，旧browser3/tab1未动。 GitHub投稿仍受PRIVATE及用户权限门禁。 |
| P2 | 分享intro长连续文本软折行 / 原Editor专项＋root review | 15473无空格ASCII解码成功但intro横溢已确认。clean source c13e619/base73仅.background/.public-background overflow-wrap:anywhere＋history；owner Node24.22.1 Web186/类型/构建60及1280/391 iframe两类文本实测通过。root已实际full两文件diff/context＋两截图review无blocker，最新三角色79资源候选由verify_editor_candidate独立验证在制，review-share-wrap-dawn基3a1fa41，未main。 |
| P2 | 测试覆盖率统计与README badge / owner待排 | 已记录待执行，非抢占，无用户限定开始条件；覆盖现有多workspace Vitest与Node原生测试，先明确统计范围/汇总口径，再按真实结果为README.md及README.zh-CN.md添加badge、报告入口/更新路径。不伪造百分比、不擅设门槛；依赖现有CI/README约定，外部服务/权限另确认，PRIVATE仓main push会部署，本任务不授权push/部署。 |
| P2 | 角色出戏边界 / 语音内容owner | 攻击问仍有幕后元话语，候选未解决且未生产；停止无限付费叠提示，不擅换模型/供应商/剧情。[调查](role-immersion-investigation.md) |
| P2 | 启动延迟与剩余回归 / 语音/工程owner待排 | observer已集成但无真人阶段采样/加速结论；先有界实测，再优化，不跨轮保活mic/连接。开发代理WS问题已独立派下行owner，不混作延迟结论。 |
| P2 | 开发代理完整WS拒绝 / review_blue_animation | [无凭据网络对照](dev-websocket-rejection.md)已定位Cloudflare Vite开发宿主丢弃非101响应；Web代理/Worker HTTP控制保留503/403。诊断脚本与记录已纳入本地main `0a67498`，未修补vendor/生产配置；宿主限制仍未修复，上游或开发适配后置评估。 |
| P3 | 银发/双丸子主题区分 / 视觉owner待排 | 两者accent同`#78DDD7`；先定accent/卡底/服装层级方案，不混waiting返修。若改服装须静态/动画一致，未授权全面重画。 |
| P3 | 结果页被指认角色与正误两态 / 视觉＋动画owner | [结果页提案](result-character-states-proposal.md)已review；[最小结果投影](result-projection-implementation.md)已完成本轮本地集成验证：生产仅controller2行，Web183测试/类型/构建60资源通过，已纳入本地main `0a67498`；复制session.result，不泄wrong真相、原清理语义保持。完整UI/新素材/动画契约仍待方案；用户倾向结果页加被指认者，合并指认页仅备选未定。先局部方案→GameView投影/播放契约→素材与UI联合接入；从result.characterId取人，不用已清空currentCharacterId/真凶替代。正确懊恼/无奈，错误不解/抗议；错指仍不揭真相，一次错误终局。具体新素材授权另核。 |
| P2/P3 | 动画剩余质量 / 动画＋UI owner | sunny前代只读QA：8787真实游戏正常单canvas/单RAF及切人；3次合成iframe暂停/恢复未见重复RAF，仅为合成事件证据。IAB明确子agent不支持真实visibility，真实隐藏恢复仍未验，不能视为PASS；未用mic/provider，自建tab已清理、服务保留。临时证据`/private/tmp/lie-sunny-visibility-qa-20261025/handoff.md`及同目录`observations.json`。1280×720既有舞台裁切保留；按真实问题排期，静态回退及资源取消不退化。 |

## 保留的门禁与外部依赖

- **官方投稿/仓库**：未来公开现`nighca/lie`，不另设投稿仓；目前仍PRIVATE，未授权改可见性或代理建fork/commit/PR。用户本人GitHub确认，无LIE OAuth/PAT；玩家贡献PR不改变内部无PR集成。不要向公开仓发送项目私有正文。[投稿研究](editor-official-submission-proposal.md)
- **公开访问/费用**：临时无应用鉴权语音有特定线上授权，带有效期邀请码访问设计现已放行（限制玩游戏功能、不限频率），实施待设计完成后用户确认；不授权secret/资源/DB/DO/账号/部署，费用预算/回收策略仍暂缓，本次不新增频率/并发限制；额度不足断连不是即时硬止付。[公开方案](public-voice-launch-proposal.md)、[额度](linx-quota-investigation.md)
- **宣传视频严格后置**：只批准制作方法/工具依赖研究；脚本、分镜、录屏、旁白/音乐、生成媒体和制作必须等用户判断产品成熟并明确放行。空闲或夜间小修授权不替代。
- **实测与费用**：付费模型复核先审脚本/固定矩阵、设单次上限，首FAIL/UNCERTAIN/协议异常即停，只清自建资源。开发优先IAB，Chrome例外仅已授权灵矽控制台。普通测试/类型/构建不读取管理key、不自动发真实推理。

原位维护决定/owner/依赖/下一步；已完成流水移[历史](history/2026-10-25/README.md)。记录、本地集成、push、部署与真人验收分别报告。

分享前轮一次inventory无IAB已停止；后续Editor实际有界QA已交，见队列，root已review。三角色已完整QA交付并main；true hidden/full waiting game400ms/更广race及真机touch未验，fake不等live voice。新组合完整有序链见[历史](history/2026-10-25/three-character-dawn-candidate.md)。
