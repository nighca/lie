# 设计与提案归档

2026-10-25用户要求：所有design文档/proposal最终入库。适用于架构、玩法、交互、视觉方向、技术调查、备选/未采用/被替代方案，以及必要的评审和决定证据。归档不代表批准，也不覆盖最新确认的决定。

现行文档继续在原位维护，不为归档复制整个仓库或改动活跃作者路径：

| 分类 | 原位入口 |
| --- | --- |
| 产品与架构 | [架构](../architecture.md)、[玩法提案](../gameplay-proposal.md)、[技术调查](../technical-discovery.md) |
| 交互与编辑器 | [首页流程](../home-case-flow-proposal.md)、[编辑器提案](../game-editor-proposal.md)、[指认结果提案](../result-character-states-proposal.md) |
| 视觉与动画 | [视觉方向](../visual-direction.md)、[形象制作](../../design/appearances/README.md)、[动画契约](../animation/contract.md)、[制作流程](../animation/production-workflow.md) |
| 待确认方案 | [邀请码设计](../invite-access-design.md)、[投稿研究](../editor-official-submission-proposal.md)、[公开语音方案](../public-voice-launch-proposal.md) |
| 宣传视频研究 | [现行方法/依赖简报](../promo-video-production-research.md)（2026-10-25复核，仅研究）；[2026-10-24原文](2026-10-25/history-followup/snapshots/9cf490af/docs/promo-video-production-research.md.txt)（历史前提保留） |
| 决策与完成证据 | [历史索引](../history/README.md)、[当前计划与门禁](../project-plan.md) |
| 归档补存 | [2026-10-25盘点、原文与待交付范围](2026-10-25/README.md) |
| 历史提交与chat补查 | [第二轮31份中间版本、chat范围及旧dirty映射](2026-10-25/history-followup/README.md) |
| 未采用 发布兼容 | [旧版本资源保留方案、修正原文与完整代码来源](2026-10-25/release-retention-not-adopted/README.md)：用户明确不需要旧版本兼容，取消14天/256MiB政策确认与实施，不接CI；未实际线上删除。 |
| 暂停实现保存 | [邀请码完整暂停handoff、来源与三张必要截图](2026-10-25/invite-access-paused/README.md)，代码未合入，恢复须用户明确重启。 |
| 专项历史补交 | [动画研究README、来源与失败证据](2026-10-25/animation-history-followup/README.md)；[编辑器原型与聊天设计回收](../archive-inbox/editor-history-2026-10-25/README.md)；[调查页、品牌与移动端历史设计](../archive-inbox/investigation-visual-history/README.md) |

完成交付时，作者列出文档、必要附件及未完成草稿；标注日期、来源、提案/已批准/已否决/被替代/未验证状态和替代关系。发起者实际review并集成默认分支，确认文档可追溯后再清理worktree。进行中的材料仍由原owner完整交付。

失效或备选文档可放`docs/archive/YYYY-MM-DD/`；已有`docs/history/`和`design/`内的版本化资料不必搬家。可保留原文快照并由索引解释状态；旧快照中的相对路径、服务地址和“当前”措辞只表示历史上下文。单一chat、临时路径、忽略目录或待清理worktree不是最终存档。

仅保留解释设计/判断所需的附件；运行缓存和普通执行日志不全量入库。凭据、认证头及个人敏感信息排除，必要材料脱敏并注明缺失。原始材料找不到时列明missing/仅存摘要，不补造证据。

2026-10-25历史补存交付已由root实际审查，纳入本地main，尚未push。来源提交按批次为`83b2bead0e6c0bf5cb963ad5b26fba6860b12972`；Editor `0788c19801ac5e59b04339a3b84aff4c2579692d` → `df9996282f66285387bdaee0d83b5bf893699762`；动画 `8a42a283ff4c93350156b6e836c0341a5f40f2d6`；调查 `1395873e1603f04e95c1e817cd477b72c6df17d9`。已核对来源字节/哈希、状态、索引与必要图片；各收件箱保持作者原路径并纳入本入口，不再重复搬运。

2026-10-27用户明确清理已归档chat的旧工作树：[清理前必要资料补存](2026-10-27/worktree-cleanup/README.md)保存早期交互原型、旧dirty原文、必要设计图片与review原文。私密配置和非再生ignored材料另留本地Git私密目录，不入库。
