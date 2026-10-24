# 2026-10-25 历史与文档整合

**这里的快照是历史证据，不是现行授权或状态。** 原文中的“待review”“未更新8787”“银发仍等用户”等判断可能已被后续本地集成、夜间授权和最新交付覆盖；当前执行先读[项目计划](../../project-plan.md)与[交接登记](../../coordinator-handoff.md)。不得依据旧快照回退状态、重派任务或暂停已授权实施。

## 完整原文保存

基线 reviewed main：`31db7c9f3d4f1224612d1017b37ef27520651fd3`。以下两份 `.txt` 为整合前文档逐字节快照，不改写历史；其中相对链接原本以`docs/`为基准。

| 原文件 | 完整快照 | SHA256 |
| --- | --- | --- |
| docs/project-plan.md | [整合前原文](project-plan.before-consolidation.txt) | `1e617cc7434c58113f43194a8a91cf979594066ccdbd561593e216946b5f9cf1` |
| docs/coordinator-handoff.md | [整合前原文](coordinator-handoff.before-consolidation.txt) | `71eb924597432f9354b18600273af9be149f18cdfaf74f784a09a9caebe81965` |

完整提交链、各轮测试数、当时worktree/候选SHA/限制全部保存在原文快照和链接的专项证据中；未删除任何Git ref或候选目录。快照中的历史服务可能已停止/被重新占用，不能据此操作进程。

## 整合后的保留映射

| 原入口内容 | 当前归位 |
| --- | --- |
| 架构/玩法/数据/预算/指认/转写/视觉/编辑器约定 | 项目计划“已确认约定”，详细规范继续链接原专题，不改变批准结论。 |
| 调查原四提交、UI1—9、Editor10—17/PC复用/草稿/连接线 | 项目计划“已集成本地main”；完整链与各轮检查保留快照及10-24专项记录。原17条“只记录”已解除。 |
| 蓝衣/sunny/Logo/README双语/observer/投稿/home/CJK/作者预览/依赖审计 | 成果表一句＋证据链接，不再混在执行队列；已main但未push，不冒称每次排版已获用户亲验。 |
| silver、gray/plum、指认fan、Editor位置跳动、命名迁移 | 当前队列与handoff owner表。新状态依据本轮root派单；制作/QA/待交均不等于完成。 |
| 真人盲测/耳验/长URL/投稿端到端/出戏/启动延迟/WS既有问题 | 仍在执行或质量队列；fake/ready不等真人。 |
| 两角色主题区分、结果页被指认角色/两态、sunny隐藏恢复/舞台裁切 | 仍保留低优先队列和资源/玩法边界，没有因压缩丢弃。 |
| 夜间08:30、重大决策、仓PRIVATE/投稿权限、访问费用策略、宣传后置 | 当前授权与门禁；历史措辞不覆盖2026-10-25临时授权。 |
| 协调chat/前任/接任、两heartbeat、项目ID、唯一integrator、整项委派/无PR | 当前handoff登记与rotation链接；未修改任何automation或rotation流程。 |
| 8787/8788 launchd、运行时/日志、用户tab与候选预览、旧模板/旧ref | 当前handoff服务区；未知或变更中的资源以最新owner交接确认。 |

本轮当前状态更新的界限：main基线31db7c9；source silver夜间记录79258ad、silver接入5504待IAB，fan5507 QA、Editor5402/5403修复排fan后；home5505由owner确认停止且无监听。后续新交付须由root原位更新当前入口，不能反改这些快照。

## 当日专项证据

- [首页流程去胶囊](home-flow-typography.md)：局部CSS与IAB核验，已本地集成；其中当时“待review”和服务存活描述仅为历史。
- [CJK时长留白](../../cjk-numeric-spacing.md)：官方能力/兼容性及真实测量，已本地集成。
- README双语头图：原交付`bc4b4e23f2b095c1ea7e829d61906182249c56c9`，本地已集成；英文源/PNG新增、中文README/HTML/PNG逐字节保留。IAB原生JPEG转PNG无缩放，未称无损；见[源](../../../design/brand/readme-hero.en.html)及上方完整handoff快照。

## 02:28主协调轮换

[01a16e3d本代交接快照](coordinator-handoff-01a16e3d-d2f9-75e0-a09f-d39d5ab927dd.md)：02:30新鲜核main/dirty工作/候选30链/服务/两旧任务PAUSED。最后文档集成后才正式release；接任者尚未创建，不代表交接已成功。原文快照不改，当前入口由后续协调认领更新。
