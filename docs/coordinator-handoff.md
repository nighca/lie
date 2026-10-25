# 当前主协调交接状态

2026-10-25，整理基线为已审main `30822d3779102de249c3daca0800cb4316bff53f`。这是当前状态，不是新的轮换/发布授权。整理前整页及相关计划/服务原文已[逐字归档](history/2026-10-25/coordinator-state-before-refresh-30822d3/README.md)，完整在制提交refs见[恢复清单](history/2026-10-25/coordinator-state-before-refresh-30822d3/active-handoff-refs.json)。历史检查不升级成新PASS；文档提交推进HEAD，先读实际Git状态。

## 唯一协调权与定时任务

| 字段 | 当前登记 |
| --- | --- |
| phase | active |
| coordinator / integrator | `01a17012-fa00-7170-ac0a-21c1900d71cd`，LIE 主协调 · 10月25日清晨接任；唯一integrator，子agent无自行集成权 |
| predecessor | `01a16f33-082b-78b2-bb32-b6f49fb4850a`，已released；旧chat不得恢复main写权 |
| successor | 尚未创建；约10:41按四小时流程在安全边界仅创建一次全新chat |
| 30分钟heartbeat | `lie`，ACTIVE，target=`01a17012-fa00-7170-ac0a-21c1900d71cd`，mode=create，created_at=`1792881692759` |
| 4小时heartbeat | `lie-2`，ACTIVE，target同上，mode=create，created_at=`1792881694334` |
| 前代任务 | `lie-3` / `lie-4` PAUSED；ID可能历史重用，按target＋created_at区分，不能误停本代新任务 |
| 项目/owning main | `ec01ea33-d2f9-4986-98e0-ed1644ba1772`；`/Users/nighca/code/nighca/lie` |

这是已有登记的保留，不是本次重新检查或修改automation。接任依据[接任证据](history/2026-10-25/coordinator-arrival-01a17012-fa00-7170-ac0a-21c1900d71cd.md)与[轮换流程](coordinator-rotation.md)：先完整handoff、安全释放唯一集成权/暂停本代两任务，再创建接任者；核其认领和两新任务target后旧chat才归档。失败不重复创建、不双integrator、不凭旧heartbeat夺回权力。

Root仅调度、接口/决策、实际完整review、隔离候选有序cherry-pick/clean main快进及报告；有一定工作量的执行/配置/浏览器/长检查整项委派。批量handoff、按真实diff/hash复用验证，不保留耗时执行尾巴。用户已回来；原夜间00:20–08:30无法回应模式已结束，不延长或将沉默当批准。

## 版本、交付顺序与下一步

本地基线30822已含结果页A（7b4d96a）、完整三案/目录打包（792e182）、清单恢复（1f168e3）、帧守卫（531c721）、姓名唯一（10c57c2）。最后已证origin/部署是`abb12dbf7a40689be593c2a1e580f23cfcc5611e`，[CI/部署证据](history/2026-10-25/coverage-publication.md)；此次未fetch，不声称远端仍未变化或本地新代码已部署。runner真实版本读8787的`/__lie/main-status`，不根据owning main SHA猜服务已跟上。

下一可执行：root审性能clean完整交付及两份专职review报告；动画先等AR01 Canvas归因完整handoff，不能越过mask/PR gate；姓名高亮/首帧/年长声各在制，不重复启动。所有实施候选仍从实际最新reviewed main构造，按影响检查组合；不把source summary代替root实际review。优先级及保留后续见[项目计划](project-plan.md#当前可执行队列)。

## 活跃所有权与可恢复交付

所有WT均在`/Users/nighca/.codex/worktrees/`下，以下名字后接`/lie`。**保护全部在用WT、refs、dirty/ignored必要材料，不自动清理**；先核实际status再操作。完整已交SHA及原20链存[refs清单](history/2026-10-25/coordinator-state-before-refresh-30822d3/active-handoff-refs.json)。

| owner / chat | WT / branch / base | 当前事实与下一步 |
| --- | --- | --- |
| `/root/production_performance` | production-performance；codex/production-performance-build；basee6cc3aa | ordered `cba8cf073f2b088bc52d47d2211346983fcc8085`→`d6700a757111f1eb57c6037211925ca1ad276ac6`→`bd724954e4ff8e518730fe8e0a0f15c712286424`，clean完整handoff待rootreview。原fixed89字节、92hash输出/46parts；source Web228/Gateway13＋transport3、types/build/cf dryrun通过，IABwarm13immutable0transfer/HTML208B；不是root独立复测。PNG只调查约3.92%未生成；跨deploy旧hash保留未实现，Worker-first冷计费/额度风险保留。5544/PID43122/PTY53366退出130、无监听/tab1已关。 |
| 动画 `01a16d44-aeea-7552-b184-5118072e75f3` | approved-animation-rigid-batch；codex/approved-animation-rigid-batch；base8be6d03 | 原20链final22b2ee8；追加`d1063a97cf8a185cb067a293fba1add003b27bb1`只修checker/失败证据。用户新刚性5人视觉已通过，旧stretch仍拒绝。AR01 crop伪PASS root/独立review均核：gray/plum correctedPASS；silver phase20/28三unique点FAIL。owner整项Canvas t2.5/3.5归因在制，已见t2.5 alpha127vsbase255/4×短浅横线、正常约2.48×0.413 CSS px，不能称无问题。**无mask/package写turn，无PR turn**；不改变原批准包追PASS。5355目前精确QA，等待完整cleanup，见服务表。 |
| 调查视觉 `01a16d5c-de69-7452-8d6a-280d15a87e9e` | background-character-names；codex/background-character-names；basee222503 | helper d21f5ea已提交，App/style/test仍dirty归owner，未cleanhandoff。仅背景安全字面分段高亮/主题中性回退；不抢Application/main/loader/perf。5507按需QA，PID/PTY等完整回执，不猜监听。旧结果source d97a13b已main，不重放。 |
| `/root/character_preset_migration` | 新codex/animation-first-render；base9316701433ba21017286c7023af5470275c23a28 | AnimatedPortrait首帧loading/failure分离＋独立UI/tests/docs整项在制，无source handoff。nonnull pending不先static，reduce/failure仍回退，快速切换/取消/单RAF保持；不碰App/style。5544下一回合归此owner，实际启动前核监听并登记WT/SHA/PID/PTY/消费者/停止条件。 |
| `/root/older_male_voice` | older-male-voice；codex/older-male-voice；base30822 | 只读repo catalog/官方公开demo筛1–2年长男声，docs/older-male-voice；当前salt voiceId=`a42e04fcefac4e9492581fbc95f3fce3`（睿智青年男/龙楠）未改。无manifest写turn、付费生成、管理device/agent/secret许可；不动首案声。需要中文样本先交≤2候选/同短句/次数时长费用上限/首FAIL停/cleanup方案，真实自然度等用户耳验。 |
| `/root/architecture_code_review` | animation-rigid-code-review；报告分支分别codex/animation-rigid-code-review、codex/cache-delivery-review | 刚性report ordered`5db35590e159fd55061cfdf686d29ff6b050cc5e`→`10039f40f4b63e535665020e04da5c924dea9cc9`；cache report`06026043ffc548b61efd7220ee622ace1d68b4d5`，均clean已交，**待root实际review/入库**。不要当本docs批依赖或预先cherry报告；refs保留。初始code review/帧守卫已main不重做。 |
| Editor `01a16d90-27cc-77c2-9e0a-4b28b1135371` / stable_exploratory_qa | 旧Editor/稳定QA/目录打包WT refs保留 | 已main的定位/姓名唯一/目录三案/稳定QA成果不重派。分享真实浏览器范围与剩余未知见计划；QA003仅P3改进。无当前新的服务启动许可。 |

## 服务与浏览器保留

[development当前登记](development.md#服务登记与生命周期)为唯一现行端口表；历史PID/PTY不是可重复操作的对象。

- 8787/8788：用户launchd `dev.nighca.lie.main-preview`及内部子监听独立常驻，换代不得停/重复启动。维护需要明确服务turn；本次没有服务动作。
- 5355：动画owner精确Canvas QA，当前PID52630/PTY23642，自建tabs56/57，source d106＋inspect，完成回执待owner；不要按旧70007/8486或72022/72487启停。保留approved-animation-rigid-batch、final-two-character-game、animation-breathing-revision、animation-mint-ochre-revision、two-character-formal-qa等依赖WT及refs，直到消费者/审查/PR解除；不要改别人的tab。
- 5544：性能上一回合已停；下一turn首帧owner，分配不等于监听，启动/结束均须实际核。5507：姓名owner按需；5402/5403 Editor固定分配无新增常驻要求。未知PID明确未知，不扫停或猜测。
- 前代分享QA自建browser3/tab1曾清理未确认，记录在原handoff快照；后来同编号可能复用，不能据旧ID盲关用户/其他owner tab。真实hidden能力限制、旧临时探针路径等完整历史保留，不把遗留unknown改写成已清理。

## 必须继承的门禁与证据限制

1. 邀请码/访问鉴权明确暂缓，独立chat `01a17076-a9f2-7f11-aaf3-7f7c801fee37`留供用户讨论；三候选WT/提交/ignored资料见[暂停归档](archive/2026-10-25/invite-access-paused/README.md)，不得恢复实施/QA/接CI/部署。旧设计确认不等于当前许可。
2. 无自动push/main发布或新部署。动画用户单独PR是唯一例外，但须root完整review、明确remote基线与turn，仅动画delta，不夹带local未发布修复；当前AR01还未闭环，不能开PR。新secret/资源/付费预算亦不由普通实现许可推导。
3. 视频研究已完成，实际脚本/分镜/录屏/配音音乐/生成媒体/制作仍后置用户成熟判断＋明确授权。投稿仓PRIVATE/代理fork提交/公开可见性未授权。
4. fake/demo/文本detect/短WAV/ready不等真人mic/外放/长对话/三案盲测或固定device多人隔离；新增声需耳验。真实visibility、硬件mobile/touch、广泛race未测，16k分享仍暂定，128KiB边界仅Node。开发宿主非101未修，不冒称已解决。
5. root审查完整diff/上下文/必要证据，不靠agent摘要PASS；真实相同代码/资源/依赖/组合/环境身份才复用验证。所有完成设计/提案/失败方案入库后才清理必要WT；保护别人的dirty、草稿、进程和权限动作，不重复或绕过审批。
