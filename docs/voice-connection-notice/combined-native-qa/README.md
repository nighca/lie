# 组合原生验收记录与可复用 DEV 夹具

2026-10-25；owner `/root/home_scroll`。冻结运行基线 `2188f59f250b2e4472a0d815b654c13cec254e29`（首页滚动修复 + 用户批准语音提示 A）。此记录状态为 **NOT RUN：当前轮没有可用 IAB surface**，不是 PASS。

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
