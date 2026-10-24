# LIE — 当前项目计划

更新：2026-10-25，依据本地 reviewed main `0a67498cb58f0dd8403a57556bd786c854150276`及本轮协调派单；文档提交会推进HEAD，接任时重读实际状态。[交接登记](coordinator-handoff.md)管协调权/服务，[历史索引](history/README.md)管完成证据；旧快照不覆盖最新授权。

## 授权与执行方式

- **夜间临时授权**：2026-10-25约00:20至当日08:30，用户无法回应，当前及接任协调继续待办/新问题，小实现、排版、局部视觉修复自行决定，经实际review验证后推进，不等待常规验收。重大产品/玩法/架构/供应商/范围决定及明确后置工作仍需确认；沉默不是批准。08:30不因轮换延长，用户会主动告知回来，不另建提醒。
- **整项委派**：有一定工作量即交subagent/专项，含环境、配置、排障、浏览器验收与长检查；root负责接收、排期、接口/用户决策、实际review、串行集成与报告，仍对结果负责。
- **协作**：[AGENTS](../AGENTS.md)规定隔离worktree、唯一integrator、完整clean handoff、实际diff review及候选cherry-pick验证后main快进；内部不建PR，不自动push/部署。反馈批量交付，冲突/接口/共享viewport即时协调。
- 每30分钟推进、每4小时写交接并建全新接任chat；核实接任成功后停旧任务/归档旧chat，失败不盲退、不双integrator。具体ID与[轮换流程](coordinator-rotation.md)见交接登记。

## 当前版本与可验证边界

| 入口 | 当前事实 |
| --- | --- |
| 本地main | `0a67498`已含下表成果，后续候选另列；这些新增改动均未push。 |
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
| 顾遥/蓝衣/阳光小胡子动画与多候选作者预览 | [顾遥](animation/coral-game-integration.md)、[蓝衣](animation/blue-glasses-game-integration.md)、[小胡子](animation/sunny-moustache-game-integration.md) |
| Logo红点彩蛋、README双语头图 | [Logo记录](../design/brand/logo-easter-egg/README.md)、[双语头图及详细集成快照](history/2026-10-25/README.md) |
| 首页流程去胶囊、开局时长CSS中西文留白 | [首页](history/2026-10-25/home-flow-typography.md)、[CJK实测](cjk-numeric-spacing.md) |
| 默认关闭的本地语音启动observer、Node24.22.1依赖修补、main常驻验收服务 | [启动审计与observer](voice-startup-audit.md)、[本地运行](development.md) |

## 仍需执行的队列

同优先级按依赖/空闲owner调度，不重派已在制工作；专项chat ID及当代执行者在交接登记。01:28 fan/Editor/动画三个专项均实际waitingOnApproval，正式游戏QA无新交付；flag不等于拒绝，原因不推测。只读排查结论：等待状态原因不可见，保留未测项目，未重发/绕过/变更权限。

| 优先 | 工作 / owner | 当前状态与下一步 |
| --- | --- | --- |
| P1 | 银发waiting接入 / 动画专项＋root review | 三角色新候选`a440ec9`（base0a67498）已重建并过全仓379/类型/构建79资源；原素材review/哈希保持，5504正式游戏IAB仍待交，角色未main。完整来源见交接候选登记，不复制旧链。 |
| P1 | gray/plum接入与扩人 / 动画专项＋main_acceptance_environment | 正式activation source HEAD `822e9b5` clean（base5968661，12有序提交）已root实际源码/图review；纳入同一新候选a440ec9，含结果投影的组合检查已通过，5505正式游戏IAB未交付；01:28动画专项实际waitingOnApproval，未main。之后按原canonical制mint/ochre，最多2角色并行。 |
| P2 | 指认弹窗可变人数扇卡 / 调查专项 | 从`31db7c9`新WT accusation-fan-layout实施，5507 waitingOnApproval，仍持viewport未释放；修4人换行裁切，hover/focus上移、触屏/窄屏可选，不硬人数、不靠hover提交，点击具体人才指认。与结果页设计独立。 |
| P2 | 编辑器大形象位置跳动 / 编辑器专项 | 局部CSS候选28测试/类型/构建60资源通过；自有同源iframe初轮1004下216.23×285、391下317×160居中通过，尚需多角色反复切换/cleanup完整handoff。当前waitingOnApproval，顶层slot未取消，未集成；不改共享组件或资产掩盖。 |
| P2 | CharacterPreset内部命名迁移 / root排执行owner | 已批`CharacterPreset`/`@lie/character-animation`，原`cb86dd6`尚未集成。保留appearanceId键及`/appearances/`；等fan＋Editor＋silver合main后按最新基线一个owner统一执行，纳入runner命令及环境owner受控重启。[落地提案](character-preset-migration-plan.md)，本轮未实施。 |
| P1 | 真人与盲测质量 / root协调用户＋独立QA | 整合版mic/外放/长会话、三案盲测、多用户隔离未闭环；新增五声待耳验，不能用fake代替。保护用户设备。 |
| P2 | 编辑器分享/投稿端到端 / 编辑器＋用户 | 完整URL16000暂定上限待跨浏览器；GitHub待IAB登录、公开及无上游写权限身份实测，长query失败不等于短预填不支持。 |
| P2 | 角色出戏边界 / 语音内容owner | 攻击问仍有幕后元话语，候选未解决且未生产；停止无限付费叠提示，不擅换模型/供应商/剧情。[调查](role-immersion-investigation.md) |
| P2 | 启动延迟与剩余回归 / 语音/工程owner待排 | observer已集成但无真人阶段采样/加速结论；先有界实测，再优化，不跨轮保活mic/连接。开发代理WS问题已独立派下行owner，不混作延迟结论。 |
| P2 | 开发代理完整WS拒绝 / review_blue_animation | [无凭据网络对照](dev-websocket-rejection.md)已定位Cloudflare Vite开发宿主丢弃非101响应；Web代理/Worker HTTP控制保留503/403。诊断脚本与记录已纳入本地main `0a67498`，未修补vendor/生产配置；宿主限制仍未修复，上游或开发适配后置评估。 |
| P3 | 银发/双丸子主题区分 / 视觉owner待排 | 两者accent同`#78DDD7`；先定accent/卡底/服装层级方案，不混waiting返修。若改服装须静态/动画一致，未授权全面重画。 |
| P3 | 结果页被指认角色与正误两态 / 视觉＋动画owner | [结果页提案](result-character-states-proposal.md)已review；[最小结果投影](result-projection-implementation.md)已完成本轮本地集成验证：生产仅controller2行，Web183测试/类型/构建60资源通过，已纳入本地main `0a67498`；复制session.result，不泄wrong真相、原清理语义保持。完整UI/新素材/动画契约仍待方案；用户倾向结果页加被指认者，合并指认页仅备选未定。先局部方案→GameView投影/播放契约→素材与UI联合接入；从result.characterId取人，不用已清空currentCharacterId/真凶替代。正确懊恼/无奈，错误不解/抗议；错指仍不揭真相，一次错误终局。具体新素材授权另核。 |
| P2/P3 | 动画剩余质量 / 动画＋UI owner | sunny真实隐藏恢复未验，1280×720既有舞台裁切保留；按真实问题排期，静态回退及资源取消不退化。 |

## 保留的门禁与外部依赖

- **官方投稿/仓库**：未来公开现`nighca/lie`，不另设投稿仓；目前仍PRIVATE，未授权改可见性或代理建fork/commit/PR。用户本人GitHub确认，无LIE OAuth/PAT；玩家贡献PR不改变内部无PR集成。不要向公开仓发送项目私有正文。[投稿研究](editor-official-submission-proposal.md)
- **公开访问/费用**：临时无应用鉴权语音有特定线上授权，正式访问/并发/限额/回收方案按用户要求暂缓，邀请/DO/DB未批；额度不足断连不是即时硬止付。[公开方案](public-voice-launch-proposal.md)、[额度](linx-quota-investigation.md)
- **宣传视频严格后置**：只批准制作方法/工具依赖研究；脚本、分镜、录屏、旁白/音乐、生成媒体和制作必须等用户判断产品成熟并明确放行。空闲或夜间小修授权不替代。
- **实测与费用**：付费模型复核先审脚本/固定矩阵、设单次上限，首FAIL/UNCERTAIN/协议异常即停，只清自建资源。开发优先IAB，Chrome例外仅已授权灵矽控制台。普通测试/类型/构建不读取管理key、不自动发真实推理。

原位维护决定/owner/依赖/下一步；已完成流水移[历史](history/2026-10-25/README.md)。记录、本地集成、push、部署与真人验收分别报告。
