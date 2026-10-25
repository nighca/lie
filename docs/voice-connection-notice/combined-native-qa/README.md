# 组合原生验收记录与可复用 DEV 夹具

2026-10-25；owner `/root/home_scroll`。冻结运行基线 `2188f59f250b2e4472a0d815b654c13cec254e29`（首页滚动修复 + 用户批准语音提示 A）。首次尝试为 **NOT RUN：当轮没有可用 IAB surface**；之后 root 明确允许独立 Chrome 本地验收，已完成下述补验，首次边界作为历史保留。

本轮一次 `cua.getState()` 仅返回 Chrome extension；前一轮首页任务曾可用的 IAB 没出现在本轮 inventory。没有猜测原因，没有借其他 chat 的浏览器 ID、重复重试或回退到 Chrome。5544 起前 `lsof` 无监听；没有服务、PID、PTY、浏览器页或 viewport 操作，8787/8788/5355 未动。

## 待执行矩阵

- 1280×800 / 391×844 / 320×400：奶油底提示的实际宽高、按钮 56×至少44、文字无裁切、圆环可辨；文案“正在连接… / 连好后再说话”，可访问名称“取消连接”。
- reduced motion：等待标记保留，圆环 computed animation 为 none。
- 真实 App + controller，受控 fake transport 的 pending / ready / fail / cancel / canceled late-ready。ready/failed/cancel 后提示退出，取消后迟到 ready 不重开。
- 同组合普通首页 1280×600：document 高等于 viewport，列表可滚至第四案。

## DEV 夹具

[fixture.ts](fixture.ts) 直接导入真实 App/controller、正式案件源与产品 CSS；没有真实麦克风、供应商、网络语音。点 App 的开启模拟对话进入 pending；右下 QA ready/fail 分别完成/拒绝当前 promise；App 的取消按钮沿真实 controller 关闭。取消后再点 QA ready 可验迟到完成。使用空预设仅为了不把角色资源加载混入此提示验证，不能证明角色动画或真实语音。

准备好可用 IAB 后，在独立 WT 的 `apps/web/` 临时创建 HTML（`<div id="app"></div>`，module src 使用 Vite `/@fs/<绝对仓库路径>/docs/voice-connection-notice/combined-native-qa/fixture.ts`）；仅通过已登记临时 Vite 服务访问。此文件没有被正式 index、产品或 build 引入；没有提交 public 临时入口。夹具顶部 DEV guard 防止将其当生产页面运行。临时入口验收结束必须删除，关闭自建页、reset viewport，并从原 PTY 停服务核监听为空。

夹具只是后续验收准备，**本轮未运行该夹具、未捕获截图，未声称编译/浏览器通过**。此前首页真实 IAB 矩阵保存在 `docs/home-scroll/`，不将其冒充本次组合语音验收。


## Chrome 原生补验完成

root 明确说明优先 IAB 不等于禁止其他浏览器，并给本任务 Chrome 专用 tab / 5544 的完整服务 turn 后执行。实际浏览器是本 chat inventory 内 Chrome extension，自建 tab `1910329686`，没有使用视频或用户 tab。源码基线仍为 `2188f59f250b2e4472a0d815b654c13cec254e29`；当前 main `8aa7ec9` 与此 runtime 相同由 root 核对，未更改产品文件。

- 1280×800：卡片360×72，按钮56×44，卡片x460..820、y404..476。
- 391×844：卡片312×68，按钮56×44，x39.5..351.5、y430.195..498.195。
- 320×400：卡片288×68，按钮56×44，x16..304、y186..254。三种尺寸 document scrollWidth 等于 viewport，提示无水平裁切。实际截图已逐张打开检查；320×400 下调查页其余区域本身很挤，但此提示完整可用，不将其当其他布局全部通过。
- 背景 computed `rgb(255,254,247)`，正文 `rgb(17,27,69)`，文案“正在连接… / 连好后再说话”，button aria-label“取消连接”；默认圆环 animation `voice-connection-spin`。实际 reduced-motion 模拟后 matchMedia true、animation none，18×18 圆环仍存在。
- 真实点击 App 开始按钮后 pending 提示出现；点提示取消后消失，voice inactive、按钮恢复开启；随后点 QA late-ready 仍不恢复。另一次 ready 后提示消失、voice active、按钮结束对话；结束再开并 fail 后提示消失、voice inactive、原中断反馈出现。仅人工受控 fake transport，不能证明真实麦克风/供应商连接。
- 同一组合普通首页1280×600，实际列表滚动后 document高600/宽1280、pageY0、listY701.5，第四案按钮bottom539.875小于列表bottom576，四张卡均存在。
- [原始提示测量](results/metrics.json)、[首页测量](results/home.json)、[桌面图](results/desktop.png)、[手机图](results/mobile.png)、[窄短屏图](results/narrow-short.png)、[首页列表底部](results/home-bottom.png)。截图在 viewport 切换后取得稳定状态，再保存，已查看实际像素。

本轮服务：WT `/Users/nighca/.codex/worktrees/home-scroll/lie`，branch `codex/combined-home-voice-native-qa`，启动 source SHA `1973ee588ed50e3e0ad9a26f71db7e8127accbc3`（只有已归档夹具/文档追加），Vite PID10172 / 原session45505 / 端口5544；起前无监听，唯一consumer上述专用Chrome页，stop条件本批完成。原session Ctrl-C exit130，收尾lsof无监听。临时 `apps/web/voice-notice-qa.html`、本任务依赖符号链接均已删除，tab已关闭、viewport reset、CDP reduced-motion清空；未改用户草稿、其他tab、8787/8788/5355、provider或生产。未重复全套自动测试或资源构建。
