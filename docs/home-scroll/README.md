# 首页 PC 滚动边界修复

日期：2026-10-25。来源：用户反馈新增第四案后，首页外层和列表均可滚动；PC 预期只有案件列表滚动。状态：实现及隔离 IAB 验收完成，交 root 审查，尚未合入或发布。

基线：`0abc82d1acdfbaedab19888cd94ac5eaad166ab1`。运行变更仅 `apps/web/src/style.css` 的首页专属桌面媒体规则，不修改案件、Header、公共 body、调查页、编辑器或结果页。

## 根因与处理

基线桌面 `.home-shell`、`.home-content`、`.home-cases` 没有视口高度约束，右列随卡片内容增高。1280×800 的真实 IAB 中 document 高 1291，案件列表高 1095、overflow visible；此基线没有复现独立列表滚动，不能据此推断用户另一运行环境的来源。

沿已有 620px 单列断点，在宽度至少 621px 时让首页 shell 高 100dvh，Header 不收缩，内容区占剩余空间。grid/flex 层显式允许 `min-height: 0`，只有案件列表 `overflow-y: auto`。卡片保持自然内容高度，不硬编码数量/列表像素高度；列表留少量内边距容纳边框、阴影和焦点轮廓。左侧插画在短屏可收缩，文本与流程提示保留。移动端维持原单列页面自然滚动。

## 验证

- 真实 Codex IAB，自己的临时 tab，Vite 实际 Vue 页面、正式四案 JSON，未使用模拟 DOM 作为滚动证据。
- 1280×800、1440×900、1280×600、900×600、621×600、1280×400、621×400：document 高等于视口、无横向溢出（400px 短屏另测高度）；列表可内部滚动。621px 窄双列包含自然换行标题。
- 1280×600 在列表区域实际向下滚动，页面 scrollY 仍 0，列表 scrollTop 701；最后案件按钮 bottom 540.3125，处于列表 bottom 576 内，第四案可达。
- 620×800、391×844：页面正常延展，列表 overflow visible，没有额外嵌套滚动。
- 已目视 1280×600 短屏实际截图：Header、左侧文字、插画、流程均在视口内。原始测量见 [measurements.json](measurements.json)；[PC 列表底部截图](desktop-list-bottom.png)、[移动端截图](mobile.png)。
- `git diff --check` 通过。CSS 由 Vite 实际加载并应用；没有新增镜像 CSS 断言的低价值单测，没有重跑与本次首页 CSS 无关的全应用测试或正式资源压缩构建。
- 未做真实语音、供应商、手机真机或无限极小窗口验收。浏览器页已关闭，viewport 已 reset；未访问其他人的 Chrome tab/草稿。

## 临时服务

owner：`/root/home_scroll`；WT：`/Users/nighca/.codex/worktrees/home-scroll/lie`；branch：`codex/home-scroll`，服务起点 SHA 为上述基线（随后 CSS 工作区修改由 HMR 应用）。端口 5544 起前无监听，Vite PID 42659，原 session/PTY 85261；唯一 consumer 是本任务 IAB tab 1，stop 条件为本批验收结束。先因缺少忽略的生成素材触发 import 错误，运行既有 `scripts/character-presets.mjs` 生成 8 预设/121 资源后 reload 恢复，再进行所有测量。服务已在原 session Ctrl-C，exit 130，`lsof -nP -iTCP:5544 -sTCP:LISTEN` 无输出。没有启动其他服务或改变 8787/8788/5355。
