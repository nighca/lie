# 当前主协调交接状态

2026-10-25，整理基线为已审main `30822d3779102de249c3daca0800cb4316bff53f`。追加事实同步截至main `22b0b9391215210d1fb4f160a70a4f859b0a2631`；这是当前状态，不是新的轮换/发布授权。整理前整页及相关计划/服务原文已[逐字归档](history/2026-10-25/coordinator-state-before-refresh-30822d3/README.md)，完整在制提交refs见[最新恢复清单](history/2026-10-25/coordinator-state-before-refresh-30822d3/active-handoff-update-22b0b93.json)。历史检查不升级成新PASS；文档提交推进HEAD，先读实际Git状态。

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

下一可执行：性能/首帧/背景高亮/调查标题及两份review报告已完成root实际review与本批组合验证，见[最终组合](performance/2026-10-25/combined-visual-verification.md)。本批经干净main快进后仍不自动push；后续生产发布兼容由production_release_compatibility在独立WT执行。动画23链仍待完整final review/PRturn。改编仅backlog，年长声等用户选声。

## 活跃所有权与可恢复交付

所有WT均在`/Users/nighca/.codex/worktrees/`下，以下名字后接`/lie`。**保护全部在用WT、refs、dirty/ignored必要材料，不自动清理**；先核实际status再操作。完整已交SHA及原20链存[最新refs](history/2026-10-25/coordinator-state-before-refresh-30822d3/active-handoff-update-22b0b93.json)。

| owner / chat | WT / branch / base | 当前事实与下一步 |
| --- | --- | --- |
| `/root/production_performance` | production-performance；codex/production-performance-build；basee6cc3aa | ordered `cba8cf073f2b088bc52d47d2211346983fcc8085`→`d6700a757111f1eb57c6037211925ca1ad276ac6`→`bd724954e4ff8e518730fe8e0a0f15c712286424`，已root完整review，纳入代码候选d9d3e93并组合验证。原fixed89字节、92hash输出/46parts；source Web228/Gateway13＋transport3、types/build/cf dryrun通过，IABwarm13immutable0transfer/HTML208B；不是root独立复测。PNG只调查约3.92%未生成；跨deploy旧hash保留未实现，Worker-first冷计费/额度风险保留。5544/PID43122/PTY53366退出130、无监听/tab1已关。 |
| 动画 `01a16d44-aeea-7552-b184-5118072e75f3` | approved-animation-rigid-batch；codex/approved-animation-rigid-batch；base8be6d03 | 原20链22b→d106审计→`6ed94a059d4539add866b0f2dcd28f83c0b9b15d`精确Canvas→`a432b72bd9d7742c5b2d49306725be0fcd74e0d5`最小修复，共23链clean交。root已明确授权silver button crop[592,624,25,44]/transform.y624，未授其他mask/包扩改。旧crop伪PASS/grayplum correctedPASS/silver旧phase20/28失败保留；新完整source未root fullreview、无PR turn。5355 PID99890/PTY38260退出130、无监听、tab58关。 |
| 调查视觉 `01a16d5c-de69-7452-8d6a-280d15a87e9e` | background-character-names；codex/background-character-names；basee222503 | 背景批冻结`d21f5ea8c0207f0c550b97486e89718f539cb61f`→`19fed70566951ad66fda49d7b61bf6f0923534b6`，source Web236/types/build89、IAB1280/391；root已完整review并纳入代码候选；09b10a4973d76da325f0cbb1a3204f11a11f68ba追加标题同批交付，最终Web245。5507 PID95357/32844退出1、无监听/tab37关。标题已clean完成；5507第二回合PTY97605退出1/无监听、tab38关，PID未记录。 |
| `/root/character_preset_migration` | animation-first-render；codex/animation-first-render；base9316701433ba21017286c7023af5470275c23a28 | clean`574cf3ac38b8fd40a0fdec2f1efa8d0a203ab54a`已交，root已完整review并纳入代码候选d9d3e93。最终组合Web245/types/build89；源阶段UI43＋Web35/types/build89及最终单watch另Web2范围另存。5544 PID69515/PTY74321最终shell退出1（不是130）、端口/PID消失，Chrome1910329550关/覆盖清理；无保留服务。 |
| `/root/older_male_voice` | older-male-voice；codex/older-male-voice；base30822 | 三提交调查已root实际review并main`8ac8a7eb64a257d3aca320762bf1872fe401c1c5`；[候选入口](older-male-voice/available-candidates.md)。龙天未占用/龙三叔与sunny同声公开试听已交用户，等待选声；当前龙楠voiceId a42e04fcefac4e9492581fbc95f3fce3未改。无manifest写turn或新增付费/管理资源许可；先真人耳验再配置。 |
| `/root/architecture_code_review` | animation-rigid-code-review；报告分支分别codex/animation-rigid-code-review、codex/cache-delivery-review | 刚性report ordered`5db35590e159fd55061cfdf686d29ff6b050cc5e`→`10039f40f4b63e535665020e04da5c924dea9cc9`；cache report`06026043ffc548b61efd7220ee622ace1d68b4d5`，均已root实际review并纳入本批候选；原报告冻结历史结论保留，不能代替23链动画final review。refs保留。初始code review/帧守卫已main不重做。 |
| `/root/production_release_compatibility` | production-release-compatibility；codex/production-release-compatibility；明确依赖be83810 | 实施CI有限旧hash保留及安全清单验证，current＋最多2旧代、每代80MiB/512files/合并240MiB上限、artifact TTL14天，不承诺14天在线页寿命；source dirty/候选未交，保护WT。不启服务/远程workflow/上传/部署。cf auth只读未登录，套餐预算未知。 |
| Editor `01a16d90-27cc-77c2-9e0a-4b28b1135371` / stable_exploratory_qa | 旧Editor/稳定QA/目录打包WT refs保留 | 已main的定位/姓名唯一/目录三案/稳定QA成果不重派。分享真实浏览器范围与剩余未知见计划；QA003仅P3改进。无当前新的服务启动许可。 |

## 服务与浏览器保留

[development当前登记](development.md#服务登记与生命周期)为唯一现行端口表；历史PID/PTY不是可重复操作的对象。

- 8787/8788：用户launchd `dev.nighca.lie.main-preview`及内部子监听独立常驻，换代不得停/重复启动。维护需要明确服务turn；本次没有服务动作。
- 5355：最新最小修复QA PID99890/PTY38260已exit130、无监听、tab58关闭，无服务保留；此前52630/23642、70007/8486等为历史，不据旧PID操作。保留approved-animation-rigid-batch、final-two-character-game、animation-breathing-revision、animation-mint-ochre-revision、two-character-formal-qa等依赖WT及refs，直到消费者/审查/PR解除；不要改别人的tab。
- 5544：最终组合Node35404/workerd35876/PTY13186退出130、PID及监听消失，独立Chrome1910329555已关闭/覆盖清除；69515与43122是历史。5507：背景95357/32844及标题PTY97605均exit1/无监听、tabs37/38关闭，标题PID未记录；5402/5403无新增常驻要求。不得把关闭证据外推到未来新进程。
- 前代分享QA自建browser3/tab1曾清理未确认，记录在原handoff快照；后来同编号可能复用，不能据旧ID盲关用户/其他owner tab。真实hidden能力限制、旧临时探针路径等完整历史保留，不把遗留unknown改写成已清理。

## 新intake与配置指导

main dea290480b4ae8cab9d675cb95d1af4daad79c20已登记姓名位置需求：调查大图下姓名移除，标题“{当前姓名}的询问记录”，侧卡不变，已由09b10a4独立完成并纳入本批review候选。main22b0b93新增改编游戏仅记录：成功/失败结算均可进入编辑器并预填当前完整案件（含官方/分享/试玩快照）；不携运行状态、不改原案、不静默覆盖已有草稿，失败结果仍不揭真相，主动改编会进入含答案作者内容。按全backlog排期，尚未实施、不抢App/style。用户问lie.nighca.me，已给Workers Custom Domain步骤，仅指导、未操作账号/DNS。

## 必须继承的门禁与证据限制

1. 邀请码/访问鉴权明确暂缓，独立chat `01a17076-a9f2-7f11-aaf3-7f7c801fee37`留供用户讨论；三候选WT/提交/ignored资料见[暂停归档](archive/2026-10-25/invite-access-paused/README.md)，不得恢复实施/QA/接CI/部署。旧设计确认不等于当前许可。
2. 无自动push/main发布或新部署。动画用户单独PR是唯一例外，但须root完整review、明确remote基线与turn，仅动画delta，不夹带local未发布修复；AR01最小修复23链仍待root fullreview，尚未给PR turn。新secret/资源/付费预算亦不由普通实现许可推导。
3. 视频研究已完成，实际脚本/分镜/录屏/配音音乐/生成媒体/制作仍后置用户成熟判断＋明确授权。投稿仓PRIVATE/代理fork提交/公开可见性未授权。
4. fake/demo/文本detect/短WAV/ready不等真人mic/外放/长对话/三案盲测或固定device多人隔离；新增声需耳验。真实visibility、硬件mobile/touch、广泛race未测，16k分享仍暂定，128KiB边界仅Node。开发宿主非101未修，不冒称已解决。
5. root审查完整diff/上下文/必要证据，不靠agent摘要PASS；真实相同代码/资源/依赖/组合/环境身份才复用验证。所有完成设计/提案/失败方案入库后才清理必要WT；保护别人的dirty、草稿、进程和权限动作，不重复或绕过审批。

发布兼容待决策：累计兼容artifact 256MiB硬门槛只是提案。自动审批拒绝将其写为现行策略，理由会影响发布可用性、须用户确认；未启用该门槛，不重复或绕过审批。专人可完成未接线预算选项/安全资源校验与离线证据，root先完整review再交用户确认，不自动发布。
