# 当前主协调交接状态

2026-10-25，as-of reviewed main `0a67498cb58f0dd8403a57556bd786c854150276`及本轮root派单。本页精简登记协调权、未完成交付和保留资源；[项目计划](project-plan.md)列授权/队列，[完整旧快照](history/2026-10-25/README.md)只供追溯，不能覆盖新决定。接任前重读实际HEAD和最新专项交付，文档自身会推进main。

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

- 核验基线main为`0a67498cb58f0dd8403a57556bd786c854150276`，此基线新增成果均未push；本地origin/main跟踪及最后实际部署证据为`32d89bf91f441168148884593a0f49b816ad7162`。本轮未fetch，不能冒称当前远程/线上最新版本。
- owning main在`/Users/nighca/code/nighca/lie`；root review/integration工作树为`/Users/nighca/.codex/worktrees/investigation-review-takeover/lie`，候选分支随集成变动，先查实际status/branch，不按旧分支名操作。
- 先核用户最新消息、协调phase、两任务及实际仓库；紧凑wait三专项，取最新clean完整handoff，避免读全历史/重派。当前优先接silver、fan、Editor及gray/plum接入结果并协调命名依赖；所有待办见[队列](project-plan.md#仍需执行的队列)。
- 旧命名候选`/private/tmp/lie-integrate-text-architecture` / `codex/integrate-preset-voices`保留refs；其中调查/预览改动已有main成果，禁止整批重放。原命名源`cb86dd6e25e22444dc93b892c2d609c0a0d6ac08`仅待按新main重新审阅。

## 专项、在制与共享所有权

| Owner / chat | 当前交付与边界 |
| --- | --- |
| 调查共享视觉 `01a16d5c-de69-7452-8d6a-280d15a87e9e` | 1—9/home已main；新`codex/accusation-fan-layout` WT同名，从`31db7c9`实施指认可变人数扇卡，5507/session81667 waitingOnApproval，仍持viewport未释放。拥有相关App/专属CSS，需先协调新共享接口；结果页两态尚在方案队列。 |
| 编辑器 `01a16d90-27cc-77c2-9e0a-4b28b1135371` | `codex/editor-portrait-alignment`局部候选28测试/类型/构建60资源通过。自有同源iframe初轮1004=216.23×285、391=317×160居中通过；多角色反复切换/cleanup及完整handoff尚待，当前waitingOnApproval，顶层slot未取消，5402/5403保留。若改共享AnimatedPortrait先协调。 |
| 动画 `01a16d44-aeea-7552-b184-5118072e75f3` | 5504银发/5505灰紫正式游戏IAB未交付，01:28实际waitingOnApproval；候选391同源iframe四态/8图已过，非顶层设备。临时壳已删/最终记录已交，壳MutationObserver异常来源待正式页复核。完成游戏QA后制mint/ochre，保留原canonical，最多2角色；自验/clean/rootreview后可集成，不自动发布。 |
| 接入执行 `main_acceptance_environment` / root review | gray/plum正式source HEAD `822e9b5bb8064f10c00178f9c5643dff6f3418dd`，base5968661，12有序提交clean；root已review builder/verify/manifest/docs/图，无源码blocker，sourceowner372测试/类型/构建72资源/strict/hash通过。与18个silver提交合成下述30提交候选，未main/push。 |
| 开发WS调查 / review_blue_animation | source `929acef88f7f6b09221fa3993f986d2ffb85f54c`完整无凭据network矩阵已过，4自有端口关闭；诊断和[根因记录](dev-websocket-rejection.md)已纳入本地main `0a67498`。开发宿主丢非101仍是未修复限制，无生产/依赖补丁，不重做调查或冒称已修。 |
| 结果投影 / root候选独立验证 | source `6ca375176fa922f9d5bef566277257c810598460`→候选`17fb2ee2f269c7c4d2de03cae2415f5af84a5542`，base345a313，原候选分支`codex/integrate-result-projection`。生产仅controller2行，7项专属测试纳入Web183测试、类型/构建/60资源检查全过，已纳入本地main `0a67498`。仅复制既有被指认者/正误，不改UI/玩法/动画契约；详[实施记录](result-projection-implementation.md)。 |
| 命名迁移执行owner待排 | `CharacterPreset`/`@lie/character-animation`已批，`cb86dd6`未集成；保持appearanceId和公开`/appearances/`。待fan＋Editor＋silver合main后，按[落地计划](character-preset-migration-plan.md)统一迁移；含runner命令与环境owner受控重启，不能覆盖新代码。 |

01:28状态：fan、Editor、动画三专项均actual waitingOnApproval，正式游戏QA无新交付；这不是拒绝结论，原因不猜测。只读排查已结束：等待状态原因不可见，保留未测项目，未重发/绕过/变更权限。

三角色新候选：`a440ec99cc0b5fab81ec0fb17278df5b2eb847ef`，WT `/Users/nighca/.codex/worktrees/investigation-review-takeover/lie`，`codex/integrate-three-characters-current`，base `0a67498cb58f0dd8403a57556bd786c854150276`；30有序角色提交clean。已按结果投影新基线重建，独立全仓379测试/全类型/Web＋gateway构建/79资源strict通过；3包＋16PNG哈希与已review旧候选相同，35份旧静态/头像source/public/dist逐字节不变。与旧d4b058仅差新main已有8文件，design/packages树一致；先前完整source review/有界父链检查证据保留。当前仅缺正式游戏IAB，三个专项等待原因不可见；不能将自动检查当视觉验收。main若再有功能变更须重建影响审查，不能盲合旧hash。

专项接入记录位于该候选的`docs/animation/silver-bun-game-integration.md`与`gray-plum-game-integration.md`（尚不在main），详细来源按source HEAD取log，不重复长链。

共享窗口：fan5507仍waitingOnApproval并持有 → Editor5402/5403（条件保留，初轮iframe不等于完整交付）。silver5504/gray-plum5505由动画专项独立tab/同源391 iframe验游戏，不改全局viewport；gray/plum顶层slot已取消，Editor尚未取消。后续由root显式转授。

[结果页提案](result-character-states-proposal.md)已review，最小既有结果投影已完成本轮验证并随main快进纳入；正式结果UI、新素材和动画契约仍待方案，设计/素材授权不扩大。

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
