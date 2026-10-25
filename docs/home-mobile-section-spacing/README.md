# 移动首页章节间距

2026-10-25 用户截图反馈：玩法流程与“选择案件”标题紧贴，章节层级不清。实现基线 `6fc17ae7bdc536580edb75a557728350da457476`，自有分支 `codex/home-mobile-section-spacing`。

仅在现有 `@media (max-width: 620px)` 中为 `.home-cases` 增加 `margin-top: 32px`。间距加在案件区整体前，标题与下属列表的既有距离不变；621px 以上不匹配此规则，PC 列表内部滚动及移动自然文档滚动规则不变。未修改品牌、组件、路由、内容或逻辑。

已读取 nighca-fe general 与首页全部相关媒体规则。PostCSS 完整解析通过；移除新增这一条规则后，CSS 与基线逐字节相同；`git diff --check` 通过。按本次一条 CSS 影响范围，不新增镜像测试、不运行应用套件或重复图片构建。

原生检查与服务生命周期待 5544 owner 释放后的受控窗口补记。当前本会话一次 `cua.getState()` 仅返回 Chrome extension，无 IAB；本任务已明确允许这种情况下使用独立 Chrome 自建本地标签。尚未启动服务/打开标签，不占用 UI owner 当前窗口。
