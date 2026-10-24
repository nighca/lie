# 当前主协调交接状态

2026-10-25，as-of reviewed main `31db7c9f3d4f1224612d1017b37ef27520651fd3`及本轮root派单。本页精简登记协调权、未完成交付和保留资源；[项目计划](project-plan.md)列授权/队列，[完整旧快照](history/2026-10-25/README.md)只供追溯，不能覆盖新决定。接任前重读实际HEAD和最新专项交付，文档自身会推进main。

## 协调权登记（本代最后确认）

| 字段 | 值 |
| --- | --- |
| phase | active |
| coordinator / 唯一integrator | `01a16e3d-d2f9-75e0-a09f-d39d5ab927dd` |
| predecessor | `01a1677a-5eff-7f22-87c6-d2c382569aee`，不依赖旧chat运行 |
| successor | 尚未创建，四小时轮换时只建一次 |
| 30分钟heartbeat | ID `lie`，ACTIVE，target本代coordinator |
| 4小时heartbeat | ID `lie-2`，ACTIVE，target本代coordinator；2026-10-24约22:26建立，尚未实际轮换 |
| 项目 | `ec01ea33-d2f9-4986-98e0-ed1644ba1772`，本机`/Users/nighca/code/nighca/lie`；创建接任者前list_projects复核 |

按[轮换流程](coordinator-rotation.md)先保存状态、安全释放集成权、停本代两任务，再创建全新chat；核实其active认领/两新任务/专项接手后归档旧chat。失败查既有successor状态，不重复创建、不双integrator；轮换不等于push授权。

**持续工作模式**：有一定工作量的执行、配置、运维、排障、浏览器和长检查须整项委派；root做调度/接口/决策/review/串行集成/报告且负责结果。隔离worktree、有序cherry-pick、clean main快进、内部无PR，详[AGENTS](../AGENTS.md)。此前一条环境通知因用户停止要求被自动审批拒绝，未重试，不绕道补发；固定环境任务已完成，不由root继续扩展配置。

**临时夜间授权**：2026-10-25约00:20至08:30，小实现/排版/局部视觉修复可经实视/review自行推进，银发waiting也属此小修；不把旧候选或沉默写成通过。重大产品/玩法/架构/供应商/范围决定及宣传后置等门禁仍在。08:30不随换代延期，不新增提醒，用户会主动告知回来；过期后继续原有常规权限。

## 仓库与接任第一步

- 核验基线main为`31db7c9f3d4f1224612d1017b37ef27520651fd3`，此基线新增成果均未push；本地origin/main跟踪及最后实际部署证据为`32d89bf91f441168148884593a0f49b816ad7162`。本轮未fetch，不能冒称当前远程/线上最新版本。
- owning main在`/Users/nighca/code/nighca/lie`；root review/integration工作树为`/Users/nighca/.codex/worktrees/investigation-review-takeover/lie`，候选分支随集成变动，先查实际status/branch，不按旧分支名操作。
- 先核用户最新消息、协调phase、两任务及实际仓库；紧凑wait三专项，取最新clean完整handoff，避免读全历史/重派。当前优先接silver、fan、Editor结果并协调命名依赖；所有待办见[队列](project-plan.md#仍需执行的队列)。
- 旧命名候选`/private/tmp/lie-integrate-text-architecture` / `codex/integrate-preset-voices`保留refs；其中调查/预览改动已有main成果，禁止整批重放。原命名源`cb86dd6e25e22444dc93b892c2d609c0a0d6ac08`仅待按新main重新审阅。

## 专项、在制与共享所有权

| Owner / chat | 当前交付与边界 |
| --- | --- |
| 调查共享视觉 `01a16d5c-de69-7452-8d6a-280d15a87e9e` | 1—9/home已main；新`codex/accusation-fan-layout` WT同名，从`31db7c9`实施指认可变人数扇卡，5507/session81667 waitingOnApproval，仍持viewport未释放。拥有相关App/专属CSS，需先协调新共享接口；结果页两态尚在方案队列。 |
| 编辑器 `01a16d90-27cc-77c2-9e0a-4b28b1135371` | 10—17/草稿组/连接线/投稿已main；新`codex/editor-portrait-alignment` WT同名，局部absolute/100%/contain/center候选28测试/类型/构建60资源通过；5402/5403保留，等391/1004实际末回归，未集成。Editor/helper/editor测试/共享CharacterChoice边界保持，若改AnimatedPortrait须协调动画/UI。 |
| 动画 `01a16d44-aeea-7552-b184-5118072e75f3` | gray `33e7e2670317b9b0d65a847cbcb52b6edaa4c554`、plum `b91dfccec7dee2996687eed154313927cf8cebe8`各4提交完整source clean，root子agent只读预审通过；实际391 iframe四态QA进行中、尚未完成，尚非正式资产，最多2角色；保留独立制作/实视权。银发之后自验+clean+rootreview可集成，不逐人等用户、不自动发布。 |
| root子agent `main_acceptance_environment` | 新WT `/Users/nighca/.codex/worktrees/silver-bun-activation/lie` 从`31db7c9`准备接入；源候选14提交到`e46f6ccf3fa19d0627aa01b45530eeccd70f38eb`，追加无源改动夜间记录`79258ad5f51582aed981a1596e7bedcbfd5e7255`；activation clean `0404805bb30e8c9f7b2599a3ad542f052c8f03f7`已交；root新候选`e6c12da9c59bf56a9963c373bde101ca6cae6599`（base08cf274），与已全检`28c2c922fa7ecd1ee824a11c14f33de535328179`仅中央docs差异，372测试/类型/构建67资源/strictcheck/重建hash证据沿用，5504/session64148仍待真实IAB，未集成。 |
| 命名迁移执行owner待排 | `CharacterPreset`/`@lie/character-animation`已批，`cb86dd6`未集成；保持appearanceId和公开`/appearances/`。待fan＋Editor＋silver合main后，按[落地计划](character-preset-migration-plan.md)统一迁移；含runner命令与环境owner受控重启，不能覆盖新代码。 |

共享窗口：fan5507尚未释放 → Editor5402/5403最终391/1004 → silver5504。gray/plum改做不改共享viewport的实际391 iframe QA，原顶层391预留仍待root明确取消；后续窗口均由root显式转授，排队不是已持有。

[结果页只读提案](result-character-states-proposal.md)已review，当前未改contract或实现，设计/素材授权不扩大。

新协调须向三个专项通知新ID；root子agent句柄不随新chat自动继承，保留worktree、依赖refs和交付来源再接续。常规反馈批量handoff，冲突/接口/viewport及时协调。

蓝衣/sunny/Logo/README/observer/投稿/home/CJK均已本地main，已完成链与检查见[当前成果](project-plan.md#已集成本地main的成果)和[归档快照](history/2026-10-25/README.md)，不要沿旧记录再次激活或宣称仍待合入。17条原“只记录”已经解除且完成本地集成，不是后续禁令。

## 必须保留的服务与环境

- 用户launchd `dev.nighca.lie.main-preview`独立于chat：Vite8787、同源薄Worker8788，owning main每1.5s检查，lock变动先npm ci，失败30s退避；换代/归档不得停止或重复启动。实际SHA查`http://127.0.0.1:8787/__lie/main-status`；ready只证明配置可用，不是真人收音。
- plist：`~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist`；Node24.22.1：`~/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64`；日志：`~/Library/Logs/LIE/main-preview.log`。凭据只在忽略目录，勿输出，维护另派owner。[运行说明](development.md)
- 保留动画作者预览5351/5352/5355、plum5356/gray5357及Logo探索5497，不重启旧模板。用户8787测试tab保留；全局viewport只按短窗口协调，释放时reset并关自建tab，不动用户会话/mic。
- 旧CJK5501、README5499、Logo正式5503、投稿5401、home5505/session40547及root5486/5488/5489已由owner停止，5505另核无监听；不擅停未知进程。5398历史服务用途有变，需问最新owner，不按旧记录占用；5397编辑器旧服务已停。

## 不可丢失的质量与批准边界

真人mic/外放/长会话/三案盲测、新增五声音色耳验、分享长URL跨浏览器、GitHub外部投稿端到端及费用硬限额未闭环；sunny真实隐藏恢复未验/1280×720舞台裁切保留。fake、文本detect、短WAV、ready或专项QA不等于用户/真人验收。

仓仍PRIVATE，未授权改可见性/代建投稿fork或PR；正式访问/并发/费用/回收策略暂缓，供应商断连不等硬限额；宣传仅方法研究，实际脚本/分镜/录屏/生成媒体/制作须用户明确放行。重大门禁详[计划](project-plan.md#保留的门禁与外部依赖)，夜间小修权限不覆盖它们。
