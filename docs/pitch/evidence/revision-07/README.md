# V7 结果页素材与技术图来源

2026-11-03。仅新增两张轻量JPEG裁图，原始结果页附件全部保留。精确裁切坐标、输入/输出SHA256见[sources.json](sources.json)。两份源文件扩展名为.png，实际JPEG，记录不把它们误称无损PNG。

- `result-success.jpg`：取自[已确认按钮层级的真实应用离线预览](../../../design/result-page-ui/success-actions.png)，成功页主操作返回案件列表，次操作重玩。未使用较早success-motion-settled的重玩优先版本。
- `result-failure.jpg`：取自[失败动效结束后的真实应用预览](../../../design/result-page-ui/failure-motion-settled.png)。桌面卡片的焦点描边属于原截屏，未重绘或消除。
- 两图裁去外层QA工具栏与手机iframe，不改正文/人物/按钮。展示《消失的纪念章》，与现场《谁才是江苏人》分开，不泄江苏答案。没有新增语音、模型、麦克风或线上页面操作。素材验收身份/时间见[原说明](../../../design/result-page-ui/README.md)，不是本轮生产实录或性能证据。
- 架构图按[仓库README](../../../../README.md#architecture)的五个前端模块、静态资源、gateway和Linx依赖重绘；单页不展开分享/R2支路，功能并未移除。
- 动画图按`packages/character-animation`契约说明制作/消费同包规范；WebMCP图为Agent与编辑器页面能力的桥梁，不是新模型服务。Router图30分钟loop来自本轮用户说明，并有`docs/coordinator-rotation.md`历史依据；没有查询/恢复/创建自动化，不声称现时任务状态已核。
- 原C首页、正式logo、调查/编辑器截屏、人物部件与两段离线视频继续用此前来源，无新增AI插画。
