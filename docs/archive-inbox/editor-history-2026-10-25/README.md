# 编辑器专项历史设计补存收件箱

2026-10-25，Asia/Shanghai。盘点基线 `b03c9d3f498b738a71f06ce7a3a964f240ebccc5`。本目录由编辑器专项提交给主协调审查；不直接占用 `docs/archive/2026-10-25`，不修改中央计划，不改变任何方案的批准状态。

## 找到的缺失材料

早期 `codex/editor-ux-prototype` 的三个设计版本仍保留在独立分支，最初发现 14 个文本对象与 7 张原型评审图不在盘点基线的完整 Git 历史中。收尾时 root 已在 `75a2e9511bf798c9e2e7eab392ebef4807beada2` 补存其中三版提案正文，本包移除这三份副本，改为链接已有归档。其余 11 个原型交互文本按原始 Git blob 保存，JS/CSS/HTML/测试以 `.txt` 后缀作惰性历史快照，避免被误当成现行应用或自动发现的测试。相同对象只存一次，三个版本的文件映射和原始日期见 [来源清单](source-manifest.json)。未重写原型内相对路径，恢复运行需按原提交目录与其依赖重建；本包不是新的独立可运行版本。

| 原型阶段 | 来源提交 | 原提交时间 | 提案原文 |
| --- | --- | --- | --- |
| v1 初始候选 | `fcb084f7b65e476a94890c7a26734480d7c48925` | 2026-10-24T16:15:48+08:00 | [原文](../../archive/2026-10-25/history-followup/snapshots/fcb084f7/docs/editor-ux-proposal.md.txt) |
| v1 独立 IAB 补充记录 | `36ff3b3afa5b9b14952d5432216c05fd06fe1dd1` | 2026-10-24T16:25:19+08:00 | [原文](../../archive/2026-10-25/history-followup/snapshots/36ff3b3a/docs/editor-ux-proposal.md.txt) |
| v2 形象必选、人物步骤选答案 | `041c74a47ae03a6fd157aca012c10ed402272175` | 2026-10-24T16:33:58+08:00 | [原文](../../archive/2026-10-25/history-followup/snapshots/041c74a4/docs/editor-ux-proposal.md.txt) |

三个原始提案都仍写着“等待用户确认”，归档保留当时状态。后来三步原型获批、进入生产的事实见当前 `docs/game-editor-implementation.md` 的 Approved v2 部分；这不追改早期候选的原文，也不把其 fake 试玩/分享当成真实引擎、语音或线上验收。v1、v2 图的差异及独立浏览器验收来源均保留在原提案中。

另对本专项保留的 46 个 `/private/tmp` 评审截图做了有界收集。它们包括已在原型分支内的同一张图片；通过 Git blob 去重后，整个包共 56 个原文对象（11 交互文本、45 JPEG），约 3.5 MB。未裁切、重画或重新编码截图。每张的原路径、文件 mtime、SHA-256 和历史状态见清单；mtime 不是用户批准日期。`lie-portrait-after-*` 和 `lie-portrait-alignment-391.jpg` 特别标为已舍弃的中间修复证据，不能拿来证明最终版本。最终 iframe 证据也不冒称顶层移动设备验收。

## 已存在材料：不重复复制

| 范围 | 当前 main 或其 Git 历史中的记录 |
| --- | --- |
| 初始编辑器范围、A 文件包/B 链接/C 托管提案及链接容量研究 | `docs/game-editor-proposal.md`；相关旧版本已在 main 历史 |
| 官方投稿方案、OAuth/PAT/手动 GitHub 路径及边界 | `docs/editor-official-submission-proposal.md`；相关旧版本已在 main 历史 |
| 生产编辑器、清除草稿、人物层级、PC 卡复用、状态组、步骤线、投稿排版和动画定位修复 | `docs/game-editor-implementation.md` 及 `docs/history/2026-10-24/editor-feedback-integration.md` |
| 分享有界浏览器验收 | `docs/archive/2026-10-25/share-browser-results.md` 与原 `/private/tmp` 文件逐字节相等，含未测网络捕获限制 |
| 较早未完成的分享边界验收交接 | `docs/archive/2026-10-25/share-boundary-incomplete.md` 与原 `/private/tmp` 文件逐字节相等，未误当作完成验收 |
| 长正文软折行修复 | `docs/history/2026-10-25/share-long-text-wrap.md`；本次仅补存其所引用的保留截图 |
| 17 条反馈及后续独立待办的历史原始记录 | `docs/pending-ui-feedback.md` 等旧路径的 main 历史；未因当前文件已归并而判断丢失 |

[聊天设计回收笔记](chat-design-notes.md) 仅补充保留消息中的设计取舍与来源边界，不复制已有完整提案，不把摘要扩写成未保留的原始全文。

## 有界盘点覆盖

- 19 个保留的 editor/share 专项分支，逐项 HEAD、路径存续和现存工作树 clean/dirty 结果在清单中。覆盖初始提案/实现/路由，链接研究与投稿调研，原型与生产映射，后续控制/样式改动及有界分享修复。
- 比较这些分支全部可达历史中的 `docs/`、`design/` 文本与 reviewed-main 全历史 Git 对象，未仅凭“branch 未合并”判断遗漏；原型交互 JS、模型、测试及截图也纳入，而不仅扫描 `.md`。
- 子 agent 保留的链接容量研究、官方投稿、交互原型与生产映射，按对应分支材料核验；没有重新唤醒 agent 或假称恢复了未保留的完整子 chat。
- 部分早期 checkout 已不存在，但分支仍存续，直接从 Git 读取；现存专项工作树仅只读核状态，未修改/清理它们。
- 临时范围限定为本专项已知设计/评审截图。没有扫描全机器、home、任意忽略目录、未保留的 chat，亦不承诺对所有已删除或不可见材料无遗漏。`lie-portrait-preview.*` 为早期状态绑定运行 fixture，不是本次编辑器设计原文，未混入。
- 排除 Node 转译目录、服务代理/门闩、长随机 JSON、运行 fixture、构建/测试日志和凭据。已有 30 文本 + 3 来源 JSON 以及后续 31 文本的 root 归档目录完全未改；同一来源不再复制。

本次只做来源/字节完整性核验，不重跑历史浏览器、付费语音、构建或测试，不把旧报告中的通过记录写成新采样结果。

## 评审图入口

以下仅用于查看相应历史阶段，批准与未测边界仍以清单/原文为准。

- [v1 人物／桌面](objects/0c40be7297fb1c815309a1cb056c7ba475631b67.jpg)
- [v1 人物／窄屏](objects/bf36ae55b69889a0757e35c0fa7750be3f318c9c.jpg)
- [v2 人物／窄屏](objects/b63503c4cd22859fbee7b64903c10b97c78959c1.jpg)
- [v2 结局只读答案／桌面](objects/9ea2a9c0827b2b842843cb1ec77b113e38fa8702.jpg)
- [已被替代的姓名在上布局](objects/87da046da19e8125d7af5ade89d9e94ae2dda942.jpg)
- [后续图→链接→姓名布局](objects/83190066009f8f54fcb60b641be304bbd814144f.jpg)
- [投稿弹窗独立排版候选](objects/91514bd90b25d9399e3bcd5c51a93540d334858b.jpg)
- [动画定位故障基线](objects/8619d2d3641a9ae5b8f28312ee5dc745726a3567.jpg)
- [被舍弃的中间百分比高度候选](objects/26e570271a4e95e9ed8489a6eecefe54ff489abd.jpg)
- [最终动画定位／iframe CSS视口](objects/0688da792992cd9dd08746aa327152a687a467ce.jpg)
- [长正文软折行／iframe CSS视口](objects/2036e4598726271e2a01733e6ee7531016a945a5.jpg)
