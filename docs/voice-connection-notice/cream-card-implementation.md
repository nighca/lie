# 语音连接提示 A：奶油色小卡

2026-10-25，用户明确批准 A 方案，由 root 分派实施。实现基线：`0abc82d1acdfbaedab19888cd94ac5eaad166ab1`。设计来源为 UI owner 的 `design/voice-connection-notice-options/{a-card.svg,a-mobile.svg,a-desktop.svg,options.json,preview.html}`；读取时仍是待提交设计，文件内旧 proposal 状态不代表最新用户决定。设计文件由原 owner 独立归档，本批不修改其工作树。

## 实现

仅调整 App 既有连接提示模板及其专属 CSS：奶油底 `#fffef7`、2px 深蓝边、细阴影、18px 蓝色等待环，双行“正在连接…” / “连好后再说话”。桌面声明宽度 360px、最小高度 72px；700px 以下宽度 312px、最小高度 68px，均受视口两侧各 16px 留白约束。内容可增高，取消按钮宽 56px、最小高 44px；可见“取消”，可访问名称“取消连接”。保留键盘焦点样式和减少动态时停止旋转。

原 `interrogating && conversationActive && busy` 条件、55dvh 居中位置、z-index 6、`role=status`、取消调用 `endConversation()` 全部不变。未增加状态、请求、计时器、遮罩或确认步骤；VoiceControl、人物 loading、首页及其他页面未改。

## 检查

正式 Node 24.22.1 / npm 11.19.1，沿工作树既有依赖，无新 npm 依赖安装。

- 连接提示 / 切人 / capture readiness：3 suite，21/21 PASS，含原 4 项提示测试；1.75s wall。
- Web 全部：37 suite，357/357 PASS；5.21s wall。本批新增测试用例 0，增强既有提示测试断言，覆盖新文案、status、装饰隐藏、取消名称及切换到新角色；原取消迟到、准备失败、后台取消测试继续通过。全部是 fake / jsdom，不能证明真实语音或原生布局。
- Web typecheck PASS，2.38s wall。
- Web build / postbuild strict PASS，8 预设 / 121 资源；117.46s wall（冷构建 82 unique PNG 编码，0 cache hits，0 PNG preserved；沿原构建器获取校验固定 libwebp 工具到 ignored cache）。Vite 既有 native config 扩展名及 underline.svg 解析警告，构建成功。
- PostCSS 解析 PASS，剔除本提示专属规则后其余 CSS 与基线逐规则文本一致；未改首页选择器。
- `git diff --check` PASS。

## 原生边界与服务

本会话按要求仅一次 `cua.getState()`，返回 browser inventory 只有 `Chrome / type=extension`，没有 `type=iab` 入口。未推断其他会话 browser ID，未回退 Chrome。因此桌面、391 窄屏、短屏、实际 44px 目标及 reduced-motion 渲染均未进行原生验收；CSS 声明尺寸不能替代浏览器测量。取消、失败、快切和迟到响应仅上述自动测试验证。

root 在首页 owner 释放后授予 5544 服务窗口，但因本会话没有 IAB consumer，本批未启动任何服务，PID/PTY/tab 均无；未修改 viewport、storage、用户草稿、其他标签。8787/8788/5355 未操作，无 microphone/provider/API/WS 调用。共享 style.css 的首页规则保持基线原样，交 root 串行组合。
