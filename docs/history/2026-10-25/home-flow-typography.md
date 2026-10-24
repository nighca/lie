# 首页流程去胶囊样式

用户指出人物插画下的三枚浅蓝胶囊与首页不协调。主协调授权在已批准黄蓝方向内做局部常规排版优化，范围只限首页home-flow，不扩展到介绍页或插画。

考虑纯文字箭头与轻量编号两种表现，选择沿用已有文字箭头：无需新增数字层级或DOM，仍可直接读出顺序。取消浅蓝底色、圆角和撑满整行的布局；14px半粗文字左对齐，箭头用既有muted色，与产品介绍/插画共享左侧起点。保留三段原文、顺序、语义列表及插画。

生产diff仅`apps/web/src/style.css`的3条home-flow选择器。未改Application.vue结构或介绍页flow-hint默认规则，也未改Editor、Logo、App时长样式或玩法。

## 验证

- Node24.22.1：现有首页presentation4项通过，Web类型检查、生产构建及8形象/60资源检查通过。未增加镜像CSS实现的测试。
- 独立IAB5505：实际1280×878、391×844，文档scrollWidth分别1280、391。首页三个li背景透明、圆角0、字号14；391时左右范围16—72、100—156、184—240，文字与箭头完整且无水平溢出。
- 原案件介绍页首个flow-hint li背景仍rgb(234,242,255)、圆角99px，证实局部规则未影响介绍页。通过查看案件/返回列表检查原导航，未点开始或语音。
- browser warn/error[]；viewport已reset，自建tab关闭，未触碰用户tab。
- 截图：`/private/tmp/lie-home-flow/desktop.png`、`mobile.png`；独立预览`http://127.0.0.1:5505/`（session40547）。

分支`codex/home-flow-typography`，worktree`/Users/nighca/.codex/worktrees/home-flow-typography/lie`，原base`fe478c24efd8370b38babd02c1ed0c34acec7b3f`。无外部提交依赖。由主协调review/集成/发布；本记录为专项自验，不代表用户已批准最终排版，也不宣称已更新main或部署。

中央计划状态建议：首页流程局部去胶囊实现、自验及干净交付完成，待root审查集成；相邻的指认弹窗/结果页人物状态仍是独立后续任务。
