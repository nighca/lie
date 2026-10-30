# 项目协调与收尾交接

2026-10-30：用户指定总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 接任，持有唯一 integration turn。总协调主要负责与用户沟通、专项协调、审查、串行合入 main 和 push；具体实施、运行配置和耗时验证由专项执行，交付责任仍由总协调承担。四个专项及当前门禁见[项目计划文首队列](project-plan.md#当前执行队列与门禁)。所有专项改动须经总协调审查，不能自行更新 main 或 push。

用户要求全部专项在独立 worktree 工作，临时文件、设计草稿和生成产物均留在专项 worktree，主工作区仅作审查后的集成。视频 owner 已核对13个文件归属、完整副本和逐文件哈希，将主目录两个未跟踪视频目录迁入专项 worktree；总协调独立确认主工作区干净，文件内容保留。视频“不提交、不推送”的专项约束继续有效。

语音上限已获用户批准采用可配置600秒默认值，source `2886bd90`→`597d7635` 已交付；候选 `dc6a6ad` 已完成实际审查与独立组合复验，随本批集成；网关34项、类型检查和离线构建通过，生产 text binding 核为字符串600，见[复验记录](voice-session-limit/integration-verification.md)。普通 push/CI/CD 结果另核，不把替身测试视为真实10分钟语音验证。语音播放修复另有 source `5e97cda` 待审；等待提示和新入门案仍处讨论阶段。8787/8788继续停用，没有新服务启动授权。当前集成完成后按既定 reviewed integration 普通 push 流程发布，区别于下述2026-10-27仅本地收尾的特例。

## 2026-10-27收尾快照

用户当时自行archive旧协调chat，新增工作另开chat；当时无 active coordinator / integrator、无在制任务，收尾仅提交本地main、不push远端。旧root `01a17012-fa00-7170-ac0a-21c1900d71cd` 不再自动推进、轮换或建立接任chat。本节及以下历史资源、发布记录保留原收尾事实，不能覆盖上面的新任协调和专项任务。

## 新 chat 先读

[收尾记录与恢复入口](history/2026-10-27/project-closeout/README.md) · [项目计划](project-plan.md) · [架构规格](architecture-design.md) · [架构决策](architecture.md) · [开发与停服说明](development.md)。先核实际 `git status` / `git log`，不要把旧交接历史当当前任务或新批准。

## 收尾时版本与发布状态

- 正式站点：https://lie.agency/ 。[v1.0.0](https://github.com/nighca/lie/releases/tag/v1.0.0)标签指向 `f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`。
- 最近已推送main：`ca7f37f9c04530e124ade2e38c4f3f8d9bcab7df`，CI40444791243 / CD40444941027均attempt1/success，Worker `43f0991b-333a-4feb-b09b-3bb99a0f4e3d`。[证据](releases/2026-10-27-cleanup-archive/README.md)。与v1运行输入相同，仅增加历史文档。
- 本次收尾提交在上述版本之上，仅本地；没有触发CI/CD，没有推送、移动tag或手工部署。具体本地SHA以Git为准。

## 已完成和未决事项

四官方案、八人物动画与音色、结果成功/失败呈现、单编号JSON新增案件、三步Editor/草稿/试玩/分享/改编、姓名高亮、标题/favicon、缓存与构建期WebP均已入库发布；README有桌面与移动演示。完整证据与限制见项目计划，不重复已main成果。

| 事项 | 保留状态 |
| --- | --- |
| 邀请码/访问鉴权 | 用户明确暂停，[设计及代码来源归档](archive/2026-10-25/invite-access-paused/README.md)；不自动恢复。 |
| PR合入前CI与逐PR预览 | [方案](pr-ci-preview-proposal.md)待用户确认，尚无新增workflow/Worker/token/权限；先确认后实施。 |
| 角色切换连接耗时 | [研究](voice-connection-latency/README.md)三次本地样本2.536/1.800/1.688秒；不是线上p95，未实施加速。预连接/路由/上下文隔离与成本仍需方案，不复用跨角色记忆。 |
| 贺宁/Hackathon真实模型短测 | 用户自行负责，未提供新结论；不再自动安排provider调用。 |
| 真实边界 | 出戏、多人隔离/费用硬上限、Safari/iOS跨设备与全硬件/长会话未全面闭环。已有有限QA/fake测试不替代。 |

## 本地资源和恢复

2026-10-27收尾时，58个旧工作树全部清掉，只保留main；旧分支/HEAD与官方恢复快照仍在。本轮新专项工作树不在该历史清理范围内。[清理回执和私密恢复位置](history/2026-10-27/project-closeout/README.md)。本批临时交接WT完成审验/合入后也归档，不长期留存。不要按旧路径继续工作或批量restore。

8787/8788已disabled/unloaded；5355旧PID/监听清理时均不存在。无在用LIE开发server需要保留或自动启动。`.dev.vars`等私密文件仍留main/私密备份，不入Git。`lie`、`lie-2`实读均PAUSED；不自动恢复旧定时任务或四小时轮换。

早期所有权/完整来源/门禁历史保留在Git及docs/history、docs/archive；chat归档不删除它们。未来由用户的新任务明确范围，再按AGENTS隔离审查、单integrator流程执行。
