# 项目收尾交接

2026-10-27。用户将自行archive当前chat，新增工作另开chat。**当前无active coordinator / integrator，无在制任务；本次交接仅提交本地main，不push远端。** 旧root `01a17012-fa00-7170-ac0a-21c1900d71cd` 不再自动推进、轮换或建立接任chat。

## 新 chat 先读

[收尾记录与恢复入口](history/2026-10-27/project-closeout/README.md) · [项目计划](project-plan.md) · [架构规格](architecture-design.md) · [架构决策](architecture.md) · [开发与停服说明](development.md)。先核实际 `git status` / `git log`，不要把旧交接历史当当前任务或新批准。

## 最后版本与发布状态

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

58个旧工作树全部清掉，只保留main；旧分支/HEAD与官方恢复快照仍在。[清理回执和私密恢复位置](history/2026-10-27/project-closeout/README.md)。本批临时交接WT完成审验/合入后也归档，不长期留存。不要按旧路径继续工作或批量restore。

8787/8788已disabled/unloaded；5355旧PID/监听清理时均不存在。无在用LIE开发server需要保留或自动启动。`.dev.vars`等私密文件仍留main/私密备份，不入Git。`lie`、`lie-2`实读均PAUSED；不自动恢复旧定时任务或四小时轮换。

早期所有权/完整来源/门禁历史保留在Git及docs/history、docs/archive；chat归档不删除它们。未来由用户的新任务明确范围，再按AGENTS隔离审查、单integrator流程执行。
