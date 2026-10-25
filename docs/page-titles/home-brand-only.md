# 首页仅使用品牌标题

2026-10-25，用户明确要求首页 `document.title` 精确为 `LIE · 语音推理`，不加“首页”。实现基线 `57ff7d5984126932ba0367c6b47bfe911d03a480`。

仅将 `getPageTitle` 现有 homepage/fallback-home 分支返回值改为 `BRAND_TITLE`，保持原有首页判断条件。Editor、案件介绍、调查、结果、分享、试玩、错误/加载和动态案件名称规则未改。初始 `apps/web/index.html` 已是 `<title>LIE · 语音推理</title>`，原来的差异来自挂载后同步的 router 标题；因此HTML无需改动，初始与挂载后首页现在一致。

读取AGENTS及nighca-fe general后实施。同步两个现有测试文件中的首页期望，不新增镜像测试。Node24.22.1：`npm test --workspace @lie/web -- page-title`，2 suite / 27 tests PASS，1.22s Vitest。既有测试覆盖初始HTML、首页、未知路由回首页、返回案件列表、原生history模型往返、Editor/分享/试玩/案件阶段的其他标题、迟到请求隔离；这些为jsdom自动测试，不是本次原生浏览器验收。相关源搜索无残余旧首页前缀；`git diff --check`通过。

未改中央计划/交接、未运行全suite/build/browser/server/provider，无用户状态、服务端口或外部操作。root唯一review/integrator，本分支不main/push。
