# 页面口供：版本弹窗

2026-10-30；owner：本专项 Chat（85bb worktree）；来源：总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 的用户授权任务。

状态：第一版实现与原生浏览器检查完成，供用户审看；尚未获得用户对具体文案/造型的反馈，未合 main、未 push、未部署。既定俏皮中文 B 方向已批准，本页不重开整体视觉审批。

## 设计

把版本信息做成一张小“页面口供”：标题“报上版本。”、奶油档案卡、短版本编号、歪盖的“只认本页”印章。完整 Git SHA 保留可选择且可键盘聚焦；复制按钮成功提示“已复制，口供带走。”，权限失败则提示手动选择复制。印章为装饰，读屏不重复朗读，下面文字保留版本只代表当前页面的实用说明。

开发版、未知构建、含本地改动如实标注。未加入动画、假时间、假版本、刷新按钮或服务正常的暗示。入口、路由与父级焦点管理不修改。

[桌面截图](desktop.png) / [391与320px截图](mobile.png)：均为 IAB 中真实组件渲染，示例 SHA 来自本任务真实基线，并明确标作示例；不是预览服务构建身份、生产部署或真机证明。

## 复现

`preview.html` + `preview.js` 直接加载正式 `PageVersion.vue`，可切换正式构建示例、dirty、dev、unknown；`viewports.html` 用真实391/320px iframe做窄屏检查，不修改浏览器全局视口。

在项目批准的 Vite 端口运行后，从 `apps/web/tmp/page-version-design` 建立指向 `../../../docs/design/page-version` 的临时符号链接，可访问 `/tmp/page-version-design/preview.html` 和 `/tmp/page-version-design/viewports.html`。临时链接处于忽略目录，不作为产品入口或构建产物。HTML/JS本体与必要截图均入库。

## 检查

- Web `page-version.test.ts` 6项、`home-presentation.test.ts` 4项，共10项通过。包含实际build读取、缺Git、默认关闭/展开/关闭、dev/unknown/dirty、完整SHA复制、复制失败手动选择、重新打开反馈清理与cancel事件。
- `npm run typecheck --workspace @lie/web` 通过；先运行项目自带preset生成步骤，依赖本WT的`@lie/*`源码，未改共享node_modules。直接裸跑vue-tsc曾因未生成manifest失败，按正式脚本生成后通过。
- `npm run build --workspace @lie/web` 通过，8 presets/121 assets检查通过。首次sandbox网络失败，获准重试取得项目固定官方图片编码器后完成；构建保留既有Vite扩展名及underline runtime路径提示。
- IAB：实际首页默认隐藏，红点打开不导航，ESC关闭后焦点回到红点；开发版实际App。示例页完整SHA、unknown、dirty原生显示，关闭按钮可用。
- IAB iframe：391px时document scrollWidth=391、dialog约353×533；320px dirty时scrollWidth=320、dialog约282×623，760px高视口内完整可达；无横向溢出。desktop为1280×720。完整SHA可选择规则保留。
- 剪贴板成功/拒绝通过mock组件测试；未读写用户真实剪贴板。未调用provider/mic/Worker，未测试真实语音、Safari或真机。

## 服务与交付边界

总协调正式分配5177并行预览turn。owner：版本弹窗专项；WT `/Users/nighca/.codex/worktrees/85bb/lie`；分支 `codex/playful-page-version`；原base `fd0493773e3b47ee934b2a391e8f69b49f632c58`；无依赖提交。

服务严格127.0.0.1:5177，起前lsof无监听；Node PID77249，原exec/session5085。启动身份为上述base加本任务未提交组件/tests/设计资料（Vite热更新），不是clean build。消费者为本Chat IAB tab1及用户审看，保留服务供用户反馈；用户审看结束/明确交还后owner原session Ctrl-C并核PID/监听退出。当前无停止回执，保护其他端口不操作。初次sandbox listen EPERM未启动监听，获准同端口重试后启动。

实际产品修改仅PageVersion.vue和其专属test。Application.vue、ProductHeader、共享UI、runtime/provider均未改。总协调持唯一main集成/push turn，实际审查后处理；不创建PR。
