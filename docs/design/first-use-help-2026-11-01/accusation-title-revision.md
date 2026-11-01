# 指认弹窗标题精简

2026-11-01。用户认为指认弹窗信息层级过多，建议直接用“你认为谁是我们要找的人？”代替“我有答案了”作为标题。主代理已在基线 `44417e388d084d0d507f31fdb8e8901d4123d3de` 的真实App中改标题并删除重复正文，移除失效的 `.accusation-question` 样式，将原移动端18px字号用于弹窗标题；指认后果、人物与返回操作不变。

本记录仅是执行子代理的浏览器验收回执，未修改代码、运行tests/build或stage/commit；目标检查由主代理另行执行。不覆盖旧方案与截图。

主代理回执：在`apps/web` cwd使用正式Node24.22.1执行`node ../../node_modules/vitest/vitest.mjs run App.test.ts result-scene.test.ts --maxWorkers=2`，2文件27项通过。此前从repo根指定config的首次调用因include根目录不符未发现tests，修正cwd后成功；没有改配置或新增测试。本轮文字迁移/删除重复正文与死CSS，未重复types/build。

Chrome专属新tab `1910332592`，只访问 `http://127.0.0.1:5544/?demo=1&game=jiangsu-local`，接案后打开指认。实际检查并保存：

- [1280×800桌面](accusation-title-screenshots/desktop-1280.jpg)：唯一问题标题、后果、两个人物及返回按钮完整可见；scrollWidth=1280，弹窗宽660px，左310/右970。
- [320×844窄屏](accusation-title-screenshots/narrow-320.jpg)：问题标题自然换行，无裁切；后果、人物与返回均可见。scrollWidth=320，弹窗宽282px、左19/右301、顶193/底651，返回操作底627px，处于视口内。

两图均已实际打开查看。原生Escape成功关闭指认，焦点回到“我有答案了”入口；tab console warn/error为空。无真实语音、mic、provider或WS调用，不把模拟与桌面Chromium检查扩大为真人/Safari/移动真机验收。

自建tab已关闭、viewport已reset，未操作用户正常模式tab。既有5544 Web继续由PID64673/原PTY63756提供本WT界面，未重启或另起服务；本轮仅正常HMR。用户本地体验consumer保留，结束后由owner原PTY停止并核监听；其他端口/服务不动。
