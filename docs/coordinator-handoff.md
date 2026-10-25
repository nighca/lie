# 当前主协调交接状态

2026-10-25，08:00 Asia/Shanghai状态核验基线 main `c0ddd791fd98182b5888e986a9aa2b31b7680dc5`。本页登记协调权、未完成交付和保留资源；[项目计划](project-plan.md)列授权/队列，[历史索引](history/2026-10-25/README.md)只供追溯。文档提交会推进main，后续操作须重读实际HEAD。

## 协调权登记（2026-10-25 06:43 Asia/Shanghai接任）

前代已在main `9400686`释放集成权，不再写main。本代经真实chat ID、phase/predecessor及clean main核实后认领唯一协调/集成权；本登记经独立文档review、候选cherry-pick及main快进落地。[接任证据](history/2026-10-25/coordinator-arrival-01a17012-fa00-7170-ac0a-21c1900d71cd.md)记录自动化ID分配差异；[前代快照](history/2026-10-25/coordinator-handoff-01a16f33-082b-78b2-bb32-b6f49fb4850a.md)保留原历史。

| 字段 | 值 |
| --- | --- |
| phase | active |
| coordinator | `01a17012-fa00-7170-ac0a-21c1900d71cd`，LIE 主协调 · 10月25日清晨接任 |
| integrator | `01a17012-fa00-7170-ac0a-21c1900d71cd`，唯一；子agent不得自行集成 |
| predecessor | `01a16f33-082b-78b2-bb32-b6f49fb4850a`，LIE 主协调 · 10月25日夜间接任；已released，不再写main |
| successor | 尚未创建，留待本代四小时轮换，仅创建一次全新chat |
| 本代30分钟heartbeat | `lie`，ACTIVE，target本代chat；本次mode=create，created_at `1792881692759`，每30分钟 |
| 本代4小时heartbeat | `lie-2`，ACTIVE，target本代chat；本次mode=create，created_at `1792881694334`，每4小时 |
| 前代heartbeat | `lie-3` / `lie-4`实际仍PAUSED，保持；旧历史lie/lie-2不能与本次新建同名任务混为一谈 |
| 项目 | `ec01ea33-d2f9-4986-98e0-ed1644ba1772`，本机`/Users/nighca/code/nighca/lie`，root已核 |

本次恰好两次mode=create，工具自动分配历史用过的`lie`/`lie-2` ID；创建前本机对应文件不存在，不能称为mode=update复用或仍PAUSED。当前本代两任务实际ACTIVE/target为本chat；按target＋created_at识别，旧协调不得暂停本代新任务。view仅返回卡片，不构成对历史同名任务状态的重新核验。两任务无实质变化时安静，仅重要进展、完成、失败或所需用户行动通知。

按[轮换流程](coordinator-rotation.md)持续每30分钟推进、每4小时交接；接任成功后旧协调可归档。状态不明先查既有接任者，不重复创建、不双integrator，轮换不等于push/部署授权。

**持续工作模式**：有一定工作量的执行、配置、运维、排障、浏览器和长检查须整项委派；root做调度/接口/决策/review/串行集成/报告且负责结果。隔离worktree、有序cherry-pick、clean main快进、内部无PR，详[AGENTS](../AGENTS.md)。此前一条环境通知因用户停止要求被自动审批拒绝，未重试，不绕道补发；固定环境任务已完成，不由root继续扩展配置。

**已同意的协调优化**：一次完整批量handoff；同一已验代码/资源的差异＋哈希及依赖/组合/相关环境不变可复用验证，变更/冲突只复验受影响项，文档批只核文档。候选仍从最新main构造，实质base变化影响验证才重建；隔离WT/真实review/唯一integrator不变。先用现有执行者，独立任务持续排队再评估专职测试验收，当前不新建chat。

**用户已回来（2026-10-25澄清）**：临时夜间无法回应模式结束，此前有效已授权工作继续；原约00:20至08:30的小修授权作为历史保留，不能再假设用户睡眠或无法审批。重大产品/玩法/架构/供应商/范围决定及宣传后置门禁仍在，不把沉默当通过。

## 仓库与接任第一步

- 06:43接任核验main clean为`940068638b9b8a49f9f1db11451783dd935dcddb`，此基线新增成果均未push；本地origin/main跟踪及最后实际部署证据为`32d89bf91f441168148884593a0f49b816ad7162`。本轮未fetch，不能冒称当前远程/线上最新版本。
- owning main在`/Users/nighca/code/nighca/lie`；前代两个文档工作树`/Users/nighca/.codex/worktrees/coordinator-successor-registration/lie`及`/Users/nighca/.codex/worktrees/integrate-successor-registration/lie`制作前均clean，保留供接任复用或managed归档；重读实际HEAD/status。旧`investigation-review-takeover/lie`已不在worktree清单，不作为现存工作树操作。
- 先核用户最新消息、协调phase、两任务及实际仓库；紧凑wait三专项，取最新clean完整handoff，避免读全历史/重派。三角色正式QA已main，本轮历史归档已完成入库，入口见[归档](archive/README.md)；当前命名迁移完整交付、已review并本地集成main c0ddd791，邀请码核心设计现获用户逐项确认，默认14天、删除续局；到期处理按用户授权选择最简策略，修订review后排期实施、分享软折行已root review/独立验证并本地集成163bd0d；所有待办见[队列](project-plan.md#仍需执行的队列)。
- 旧命名候选`/private/tmp/lie-integrate-text-architecture` / `codex/integrate-preset-voices`保留refs；其中调查/预览改动已有main成果，禁止整批重放。原命名源`cb86dd6e25e22444dc93b892c2d609c0a0d6ac08`已由最新79b5503→354f58b按新main重做，旧ref仅追溯，不再排重审或重放。

本代`share_boundary_audit`已完成代码级只读审计，root已实际review源码/完整探针并以绝对路径Node24.22.1独立执行探针（0.104s、exit0、全部PASS）：sharing＋navigation现有19/19通过，生产codec探针16000 URL与131072 UTF8字节边界、Unicode往返及无效/截断输入拒绝符合契约，未见需修复源码缺陷。19/19现有测试由执行者Node24.17.0运行，低于项目24.22.1，不称要求版本19项测试复验；root的24.22.1复核仅为探针。证据`/private/tmp/lie-share-boundary-audit.mjs`；无代码/服务/浏览器变动。仅Node/jsdom＋源码证据，未验真实reload、地址栏粘贴、network fragment、宿主/play回退或跨浏览器16k；16000仍暂定，且仍加载manifest/catalog，不称完全离线。

## 专项、在制与共享所有权

| Owner / chat | 当前交付与边界 |
| --- | --- |
| 调查共享视觉 `01a16d5c-de69-7452-8d6a-280d15a87e9e` | 已本地集成main `3a677358cc5fc69f215f13c44d51c5a9643eab2c`，source `7dfbba62697320ca9db97450bc7d973d3a5d5823`（base31db7c9，无额外依赖，五文件clean）。root全diff/context/七图review无blocker，candidate以f433834独立Node24.22.1验证Web186/186（17files，base新增7项，区别source179）、类型/构建8形象60资源通过，source patch完全一致，clean main快进。最终单人180/176及四人148.5窄回归通过；临时JSON删除，tab30/31/32关闭且viewport reset。5507/session81667原owner已仅对自有session Ctrl-C，exit130，lsof5507无输出确认停止；source7dfbba6 clean，fixture/tab/viewport已清，无其他进程动作。 |
| 编辑器 `01a16d90-27cc-77c2-9e0a-4b28b1135371` | 已本地集成main `f4338346e3ec20fd742f6a75ea4362f428c18b5b`（base3f52ee5，source60e0ed7/base4fde8d4）。root实际review全diff/context/五图，独立Node24.22.1下28测试/Web类型/构建及8形象60资源通过，候选source两文件树相等，clean main快进；未push/部署。[实施证据](game-editor-implementation.md)。final iframe1004/391冷/ready及反复切人通过，非顶层mobile；MutationObserver非Node来源未证实、console非全清。已清tab17/18、临时壳、停5402/5403，取消topslot并通知fan。 |
| 动画 `01a16d44-aeea-7552-b184-5118072e75f3` | silver/gray/plum完整QA已main a4e9f7d。mint/ochre已source clean交付，同base73ba138，仅各design候选目录；mint ordered `4c213f83`→`b5c08960`→`dbecc26c`，ochre `0e4558ee`→`17fefd8a`。父实视/独立checks已交，命名接口已释放，verify_editor_candidate在final-two-character-game/lie从main c0ddd791整项准备正式候选和5544 demo，后交动画专项实际game QA；root最后审查/集成，当前未正式激活；不重做制作/不改色。 |
| 接入执行 `main_acceptance_environment` / root review | gray/plum正式source HEAD `822e9b5bb8064f10c00178f9c5643dff6f3418dd`，base5968661，12有序提交clean；root已review builder/verify/manifest/docs/图，无源码blocker，sourceowner372测试/类型/构建72资源/strict/hash通过。与18个silver提交合成的角色接入已随最终35链纳入main a4e9f7d，未push。 |
| 开发WS调查 / review_blue_animation | source `929acef88f7f6b09221fa3993f986d2ffb85f54c`完整无凭据network矩阵已过，4自有端口关闭；诊断和[根因记录](dev-websocket-rejection.md)已纳入本地main `0a67498`。开发宿主丢非101仍是未修复限制，无生产/依赖补丁，不重做调查或冒称已修。 |
| 结果投影 / root候选独立验证 | source `6ca375176fa922f9d5bef566277257c810598460`→候选`17fb2ee2f269c7c4d2de03cae2415f5af84a5542`，base345a313，原候选分支`codex/integrate-result-projection`。生产仅controller2行，7项专属测试纳入Web183测试、类型/构建/60资源检查全过，已纳入本地main `0a67498`。仅复制既有被指认者/正误，不改UI/玩法/动画契约；详[实施记录](result-projection-implementation.md)。 |
| 命名迁移 / character_preset_migration＋root review | source `79b55031ec44b0d845330cdf91e81ce033f9e6f3`→`354f58b638f81d3856c38e86ca3dad0fad220e77`，base2982e6a，174文件＋test fixture修复，clean交付。source388全检/79资源字节/真实IAB通过；独立review发现含空格Node shebang问题已修且目标测试通过。root候选 `integrate-character-preset-dawn/lie`从666e9c9有序cherry至 `c0ddd791fd98182b5888e986a9aa2b31b7680dc5`，独立1目标test/79原字节/93链接/生产身份最终核验通过，388/type/build/IAB复用；已本地main c0ddd791，保持appearanceId、/appearances/；用户已明确“允许现在受控切换”，实施owner已完成一次受控切换，服务SHA实返3c54a9e6、8787/8788仅回环、79资源+manifest字节一致、实际私密路径403；记录见[实施验收](character-preset-migration-implementation.md)，其他agent不得停止或重复启动8787/8788。[计划](character-preset-migration-plan.md)。 |

约06:52三专项waiting flags均恢复为空，当时工具侧原因不可见；用户现明确此前数小时浏览器等待是权限申请待其审批，不是已证实工具故障，亦不能推断今后全部工具必然正常。fan已review/独立验证并本地集成，动画三角色已完成QA/本地集成，下一批mint/ochre已clean交付待review及正式game QA；Editor已root review/独立验证并本地集成至f433834。保持未测项目，不重发/绕过权限动作。

08:00 main c0ddd791已含三角色正式QA、邀请码设计、历史归档及命名迁移；邀请码随后已获用户逐项确认（默认14天、删除续局，到期处理授权按简单度选），修订review后排期实施；旧a440/bfb/051c及重建候选仅历史refs，不重放、不再当当前阻塞。完整最终35链、source/candidate review与通过/未测范围见[历史](history/2026-10-25/three-character-dawn-candidate.md#最终正式qa与本地集成)。三角色正式接入记录已在main。

专项接入记录位于main的`docs/animation/silver-bun-game-integration.md`与`gray-plum-game-integration.md`，详细来源按source HEAD取log，不重复长链。

共享窗口：当前无global viewport owner；fan已关tab30/31/32并reset，Editor slot已取消。动画继续独立tab/iframe，不获全局viewport授权。5504已无监听（原因未知），旧5505不恢复，5507/session81667已由原owner停止并核无监听；5402/5403也已清，其他保留preview不变，不新增或停止其他服务。

[结果页提案](result-character-states-proposal.md)已review，最小既有结果投影已完成本轮验证并随main快进纳入；正式结果UI、新素材和动画契约仍待方案，设计/素材授权不扩大。

06:43本代已实际成功向三个专项通知新协调ID，工具返回对应threadId；后续向本代完整批量handoff，保持原所有权、dirty工作、服务和viewport，不重启在制任务、不重发或绕过权限动作。约06:52三专项waiting flags已为空，当时原因不可见；用户现澄清长等待为待其审批；最新实际交付见上表，不推断审批结论。前代root子agent全部completed，其句柄不随chat继承；本代只读审计交付与复核边界如上；保留refs/dirty工作与证据，不清目录。

蓝衣/sunny/Logo/README/observer/投稿/home/CJK均已本地main，已完成链与检查见[当前成果](project-plan.md#已集成本地main的成果)和[归档快照](history/2026-10-25/README.md)，不要沿旧记录再次激活或宣称仍待合入。17条原“只记录”已经解除且完成本地集成，不是后续禁令。

## 必须保留的服务与环境

**当前服务规则与盘点以[development登记](development.md#服务登记与生命周期)为准**：稳定端口优先复用，用完停服；历史端口不再默认永久保留。根侧未新启服务、未发停止信号；18个历史服务＋5358/5359制作入口＋5544正式QA共21个已关闭。保留用户8787/8788进程树；5355仍由动画专项独占，用于用户查看角色，来源切换由该owner登记。5544原owner已在session19829 Ctrl-C退出130并核无监听，不重复操作。证据及未知源码/PTY字段见[清理记录](history/2026-10-25/development-service-cleanup.md)，不交叉操作。以下旧记录只供归属追溯，不覆盖本轮登记。

- 前代约03:37分享边界只读QA自建IAB browser `3` / tab `1`清理未确认：仅打开`http://localhost:8787/play`见缺内容提示，后续CDP调用约272秒未返回被中断；close返回`Browser is not available: 3`，IAB inventory也不可用；04:07一次inventory仍返回`Browser is not available: iab`，之后未重试/reset。浏览器恢复后仅核查/关闭此自建tab，禁止触碰他人tab或reset。无源码、草稿、viewport、mic/provider或服务改动，不推断产品bug/服务离线或其他专项等待原因，无审批/拒绝证据；未得边界/Unicode/refresh/网络结果。临时证据`/private/tmp/lie-share-boundary-qa-20261025/handoff.md`。

- 用户launchd `dev.nighca.lie.main-preview`独立于chat：Vite8787、同源薄Worker8788，owning main每1.5s检查，lock变动先npm ci，失败30s退避；换代/归档不得停止或重复启动。实际SHA查`http://127.0.0.1:8787/__lie/main-status`；ready只证明配置可用，不是真人收音。
- plist：`~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist`；Node24.22.1：`~/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64`；日志：`~/Library/Logs/LIE/main-preview.log`。凭据只在忽略目录，勿输出，维护另派owner。[运行说明](development.md)
- 当前动画历史入口仅5355因用户现有tab18保留；5351/5352/5357及其他旧动画入口本轮已核销，5356/Logo5497未见监听，不按旧“保留”文字继续闲置运行。用户8787测试tab保留；全局viewport按短窗口协调，不动用户会话/mic。
- Editor5402/5403与调查5507当前无监听；旧5398已由调查owner本轮停止。CJK5501/README5499/Logo5503/投稿5401/root5486/5488/5489等历史停止记录只供追溯，不套用到新进程；当前用途/监听以development登记为准，不擅停未知服务。
- 前代sunny只读QA：8787真实游戏单canvas/单RAF与切人正常；3次合成iframe暂停恢复无重复RAF，真实visibility因IAB子agent能力限制仍未验，不当PASS。未用mic/provider，自有tab已清理；临时证据`/private/tmp/lie-sunny-visibility-qa-20261025/handoff.md`及同目录`observations.json`。

覆盖率与双语README badge已本地main `e40a54f777dd7aacc7e9c361f327653b1cc5557f`，root完整13files与计数/原始报告/SFC上下文实际review，候选与source47deba1覆盖源码/collector/依赖完全相同，复用clean4f5ba19真实388测试采样及两轮独立review；独立3脚本语法/45文件分母/SVG及快照逐字/链接通过。应用lines92.08%（1501/1630）、Node脚本91.32%（263/288）另报；[范围/命令与Vue映射限制](coverage/README.md)公开。CI上传14天artifact，不自动改trackedbadge，远程CI未运行，未push/部署；不重做已完成调查/采样。

## 专职代码与架构审查

用户进一步明确要求专职subagent做潜藏bug/架构意图落实/非预期耦合审查，root已spawn `/root/architecture_code_review`。固定main58b416d（应用同已发布abb12db），独立WT/branch，与浏览器探索QA分工；先核批准架构与真实依赖/接口，再以可达触发条件、精确源码行、最小fake验证及影响给结论，未证实疑点单列。allowed仅docs/reviews/architecture-code-review-2026-10-25/**报告/必要probe，不改生产，不开browser/server/端口、不调用provider或读secret，不复活暂停auth。P1立即反馈，其余完整clean batch由root实际review后排修。当前仅启动，不能写审查通过；子agent句柄跨换代不自动继承，届时取可恢复进度，保留其WT/refs/dirty。

## 专职稳定版本探索测试

用户最新明确要求启动专职subagent在稳定环境发现功能/设计/视觉问题；root核全backlog后实际spawn `/root/stable_exploratory_qa`。固定已发布abb12db，独立managed WT/unique branch，根侧不新增server；5544明确转交该QA owner按需启动，保护用户8787/8788、动画5355、设计5507、Editor5402及现有draft/浏览器会话。先隔离或可原样恢复测试draft再写入，做不到则报未测，不删除旧数据。

allowed仅docs/qa/stable-exploration-2026-10-25/**报告/原生截图/必要fixture；系统走三案demo/两种终局、Editor/分享、状态边界、桌面/391与回退/键盘，不调用真实mic/provider，不把fake当真人或新动画验收。报告复现步骤/实际与预期/影响/版本/视口/证据及已知重复，P1立即报，常规完整batch；整项含环境和用后tab/fixture/服务清理。root负责实际review与排修，不准测试者自行改生产/main/push。当前只已启动，在测结果以完整交付为准；app子agent句柄不随四小时换代自动继承，届时取可恢复handoff，保持所有权。

## 最新发布与结果页设计授权

用户授权的普通push已成功：远端32d89bf快进到 `abb12dbf7a40689be593c2a1e580f23cfcc5611e`，ls-remote实返该SHA，本地同SHA且clean。发布完整预检在独立publication-readiness WT通过388项测试、全types、Web/gateway build、8/8动画89assets+manifest90文件；fresh coverage发现生成清单晚于discovery的入口缺陷，唯一fix源fad5d862已实际review后cherry为abb12db。root比对应用/collector/依赖/CI/正式资源身份相同，后续暂停/归档docs不影响验证。CI40147932644与既有自动部署已实际success，root另核headSha/所有步骤；附件summary由独立owner读ZIP确认388/92.08%，远端README/SVG正确。部署版本24e508bf，已确认发布/部署SHA均abb12db，未做真人语音验收；publication turn已释放，后续文档仅本地未再push。[发布记录](history/2026-10-25/coverage-publication.md)说明边界。

结果页设计此前send_message自动审批拒绝（认为缺少明确用户授权），未绕过。用户随后明确选中该拒绝说明并回复“重试一下，我来了”，据此重试向调查视觉专项01a16d5c-de69-7452-8d6a-280d15a87e9e分派成功，紧凑状态实际已开始。仅设计文档/现有素材HTML原型，新paths design/result-scene-proposal/**、docs/result-scene-visual-proposal.md，基abb12db；桌面/391及必要5507 QA/用后停由专项整项承担。root做实际review，应用实现/新素材/契约仍待用户确认，不能据本设计任务开工；auth暂停、新动画修订门禁不变。

## 最新用户决定：暂停鉴权、授权推送

2026-10-25用户明确邀请码/鉴权额外复杂度高，先暂缓实现；chat留待以后讨论，root先推进其他工作。已interrupt原实施agent并只授权其自有5544/tab安全收尾与完整暂停handoff，不继续开发/修复/测试/配置；全部WT/commits/dirty与已有必要证据保存，所有auth实现未main。新chat已通知暂停、不归档，以下早先“继续原整项/待接线”记录被本决定覆盖，不能凭其恢复。需用户明确重启才再实施，费用/provider/secret门禁不变。 原owner完整暂停回执已审查并保存至[暂停归档](archive/2026-10-25/invite-access-paused/README.md)：父3ed266a、Gatewayb16dc18、Web00bf976，源码无dirty、源收件箱4文件untracked保留；最后5544原PTY52545已退出130且lsof无监听，自建tab已关，未触其他服务。auth源码不合，最后proxy未父review、最终全组合未测，保留三WT/refs及ignored材料，不能按已有测试自动恢复。

用户另明确“推送吧，我看看效果”，root持唯一publication turn按AGENTS发布流程推送已main成果（含badge），现有CI包含自动部署步骤；不纳入auth或待验动画修订，不改远程历史、不强推。fetch/普通push真实结果另记，不能把本授权当已发布。

## 邀请码独立专项chat

用户明确要求独立chat跟进，已实际创建 `01a17076-a9f2-7f11-aaf3-7f7c801fee37`，标题“LIE 邀请码与访问鉴权”，local lie项目；不是主协调换代。两问题（8788作用、密钥是否属于gateway环境）与已批14天/公开浏览/play要码/简化到期规则均已交新chat先回答。可恢复执行进度、所有权、Node测试主链、failclosed影响与服务边界已完整转交，见[专项交接](history/2026-10-25/invite-specialist-chat-handoff.md)。

原root/invite_access_design及Gateway/Web子agent继续当前整项至review/组合QA/cleanup/clean批交root；新chat在root明确释放前只读和用户讨论，不改原在制WT或重派。root仍负责实际完整review/串行集成，后续实施/返修/验收协调由新chat承接。主协调两heartbeat/其他专项所有权不变。实际实现在制HEAD会前进，不能把交接采样当冻结最终交付。

## 最新批次交付（8人基线与独立修订）

8/8角色基线已实际main `dd1663853f7e153efb2c977dd74b89b415f0e20c`，clean未push/部署；8787的main-status实际同SHA（默认curl受本机代理影响，no-proxy＋获准本机网络只读查询成功；不据沙箱连接失败猜服务故障）。root候选从772dfa5依序接8个source提交，源72c4a93全部应用/依赖/正式资源身份相同，复用388/type/build/IAB；实际review完整构建器/验证器/来源/正式QA和6图，独立mint1280/ochre960采样、每人100中断、10新正式文件原字节及40链接通过。Ochre验证器首次仅受沙箱写ignored poses.json拒绝，获准同一隔离输出后exit0，不当应用失败；未增新服务。详细有序源链按[接入记录](animation/mint-ochre-game-integration.md)及source72c4a93 log追溯。

已实际读取动画chat用户本轮原文：原8人继续集成；新问题另批处理，silver/salt/plum/mint/ochre waiting、mint default/listening幅度、ochre speaking头大小。动画专项最多2lane、只改各candidate，自验后5355供用户验收。**该新批必须用户确认后才单独PR**，是用户明确的局部例外；不现在开PR，不提前合main/游戏。已通知专项实际基线dd16638，保留在用final-two-character-game WT/5355，不把新问题当原8人阻塞。旧表中“尚未正式激活”已被本节取代。

动画新批现明确**待用户验收**：A WT `animation-breathing-revision/lie`，branch `codex/animation-breathing-revision`，base772dfa5，有序5381633→85329b1→HEAD `c4881b3e21cb7967295545b259329c594bb9f85c`；B WT `animation-mint-ochre-revision/lie`，branch同WT名，basedd16638，有序6a5cf31→73a8420→bb5779e→HEAD `78031e87340fdc0a6d2ada6c8330c8fb17ddc038`。父证据WT `two-character-formal-qa/lie` branch `codex/animation-revision-parent-qa`，basedd16638→HEAD `1bf177ff2f1733fd240bc569fc3d8a785ffe4c1c`，包含14原生图/报告/preview-url.txt。root已实际核三WT/HEAD均clean，仅记录owner交付，不当root视觉通过；**这7个源提交及父证据提交都不得自动集成**，待用户确认后单独PR。保留三WT及source final-two72c4a93和5355：当前原PTY8486，默认页仍旧8人，tab47 query覆盖5修订，48/49由owner关闭。该回执取代旧5355 session82389采样，不按旧session发信号，不动预览或任意资源。

**动画后续反馈覆盖旧“待验”状态**：用户否定增强候选强scaleY导致头部拉伸、与各角色其他动作风格不协调，要求按具体角色设计waiting；专项已撤回A c4881b3/B78031e8作为可验收候选，父证据1bf177f亦仅历史。仍2lane在各自candidate重做，原8人main不受影响；root已通知当前真实协调ID未换，旧7source/父证据不自动集成，新完成仍须用户确认后单独PR。

邀请码核心修订已main772dfa5，实施owner invite_access_design含共享token/离线CLI、隔离Gateway/Web及5544本地QA/服务收尾。root保留package/lock所有权，coverage源47deba1已两轮独立review及root实际全diff审查并本地main e40a54f；邀请码新增Node测试test:access由root在鉴权最终候选集成时串行接npm test和CI，CI已用coverage不能仅改test主链而漏测。源码变动以各owner最终clean handoff为准，不重复派工或擅写其WT。

## 不可丢失的质量与批准边界

真人mic/外放/长会话/三案盲测、新增五声音色耳验、分享长URL跨浏览器、GitHub外部投稿端到端及费用硬限额未闭环；sunny真实隐藏恢复未验/1280×720舞台裁切保留。fake、文本detect、短WAV、ready或专项QA不等于用户/真人验收。

仓仍PRIVATE，未授权改可见性/代建投稿fork或PR；带有效期邀请码访问设计已由用户放行，仅限制玩游戏访问、不限频率，核心设计已获用户本轮逐项确认，默认14天、删除续局，到期处理可按简单度选，修订review后排期实施；费用预算/回收策略仍暂缓，不新增频率/并发限制或授权secret/资源/DB/DO/账号/部署，供应商断连不等硬限额；宣传仅方法研究，实际脚本/分镜/录屏/生成媒体/制作须用户明确放行。重大门禁详[计划](project-plan.md#保留的门禁与外部依赖)，夜间小修权限不覆盖它们。

Editor已交有界IAB分享QA（source main0f73006、share blob7539ab638591ef416eafbfda102a90ed72aa4292，Node24.22.1生产encode）：normal539真实UI Unicode/换行/保留字符逐字相等及actual reload通过；恰16000 ASCII完整URL新blank tab fresh goto/reload intro通过、href16000；16001特定长度错误、损坏gzip错误及reload通过。root已实际review完整报告/四图，无codec blocker，局限保留。network初始fragment捕获因PerformanceAPI missing TypeError一次停止，未重试CDP；跨浏览器/地址栏粘贴/外部传输/离线未验，16k仍暂定、128KiB仍仅Node。证据/private/tmp/lie-share-browser-results.md及同名前缀fixtures/四张jpg；自建tab19/20/21已关，无viewport/draft/voice/mic/provider/服务动作，旧browser3/tab1未动。三角色完整QA已main，详细通过范围/未测边界见最终历史。新组合完整有序链见[历史](history/2026-10-25/three-character-dawn-candidate.md)。

邀请码[设计](invite-access-design.md)已root完整114行及实际契约/官方文档review，本地集成3a1fa417，原版仅文档，用户现已确认核心范围并授权简化到期处理：默认14天、公开浏览创作/所有play需码、删除续局；开局及新WS校验exp，既有WS沿180秒，不新增到期强断计时。invite_access_design修订现行文档并归档旧版，root审查后排期实施；不是生产secret配置/部署授权，固定device多人隔离风险不由邀请码自动解决。分享长正文软折行已本地集成163bd0d，原横溢是独立排版问题，不混codec失败。

历史三角色集成main为a4e9f7d（当前核验main c0ddd791），候选refs仅追溯，不重放。QA源bfb临时壳已由owner删除且status clean、tabs28—33关闭/overrides清；环境回证：PTY77092已失效，Ctrl-C返回Unknown process id；PID24833不存在且5504无监听，原因未知，未发生本次成功Ctrl-C停服。8787 main-status实返a4e9f7d＝当时main，三包HTTP200且同generated、79资源＋manifest共80文件，其他服务未触。分享软折行source c13e6194751334085094a10b773018a998341b01/base73 clean已交，仅.background/.public-background overflow-wrap:anywhere＋history；owner Node24.22.1 Web186/类型/构建60及1280/391 iframe两类文本通过，root已实际full两文件diff/context＋两截图review无blocker，独立候选163bd0deee6899df4a3d77cda562e511edb1a9cf已Node24.22.1 Web186/类型/构建79资源通过并本地main快进，未push/部署；iframe/触屏/跨浏览器及单独长reveal未验边界见专项记录。
