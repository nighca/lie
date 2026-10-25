# 推荐R方向批准与分阶段交付

2026-10-25，主协调已核动画专项chat `01a16d44-aeea-7552-b184-5118072e75f3` 中直接用户消息，turn `01a1712c-32cc-7c70-8fab-a3bc7aa0fc92`：

> 可以的，按这个方向做吧

该答复批准[推荐R](README.md)的结果大图形/纹理及克制的人物反应方向、分阶段制作共16个结果静态终态＋16段一次短动作，先制作珊瑚短发两态样片，再校准后续制作。没有把角色正确被指认理解为庆祝，也不泄错误指认的真正答案，不改游戏规则。

## 当前状态与边界

原提案source **`1c354425d3c90a198318194aa173423933867466`**（原base133cff050e0d4127901d9d3c0d5b3d750a9fa1b5）于批准前完成；其README、handoff及decision-status.json的“待用户确认”是保留原字节的历史快照。本approval补记最新决定，覆盖这些旧状态措辞，不改原文、不倒写批准。集成候选从main33042fdfa1ea12cd0ce55fbafebce1a9c295cd84有序cherry原提案为`edadbb2dde5e88508611cea825ca3e63ab6efcc2`，root已全文review与关键原生图审查。

**样片尚未用户验收，素材未制作完；方向批准不等于全部16＋16生产完成或具体技术接口已经审查通过。** 契约/严格parser、可选状态与静态资源、loader/generator兼容、AnimatedPortrait生命周期和回退仍需实际代码/接口review及验证。原型只用旧默认图占位，保留keyboard NOT PASS和未归因MutationObserver异常，不宣称原型即生产验收。

第一阶段由动画owner独占packages/character-animation、AnimatedPortrait、预设契约/loader/generator必要可选字段与测试及珊瑚样片。App/style/Application/相邻测试仍由调查owner完成notice loading＋preview结果隐藏改编；结果App接入等其释放后再授，不并发抢文件。具体样片/后续阶段用户验收分别记录；已发布48316544不含本方向新实现。

## 本批文档归档校验

独立只读检查：14个Markdown本地链接、6个HTML引用、3个JSON解析、外部scene.js及index内联JS两项Node24语法检查、serve.py AST语法检查通过，未执行server。两默认PNG及历史案件JSON（真实路径`apps/web/public/games/empty-medal-box.json`）当前字节SHA256均匹配[source-identity](source-identity.json)，并与其记录原base对象逐字节一致；动态图片/案件引用与3个historicalSources路径存在。提案20文件仅docs/result-outcome-design路径，无生产diff。未运行应用tests/build、服务/浏览器或素材生成。

预览清理沿原owner[交付](handoff.md)：source1c354425，原PTY15660已exit130、5355无listener、自建tab59关闭且媒体覆盖清；本轮没有采集PID，不编造，也未扫描或重停。此批准记录和中央状态经root审查后本地归档，不自动push/部署。
