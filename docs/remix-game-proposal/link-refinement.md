# 结果页改编入口调整

日期：2026-10-25。来源：用户验收反馈。状态：已实施及专项验收，待主协调审查集成。

- 原始基线：`14ca8cc2229eef9317bdaf98fbde3c960df18b05`；分支 `codex/remix-action-link`；复用 clean 专项工作树，原实现提交不变。
- 用户要求：“改编游戏”改为“我要改编”，文字链接视觉，放操作行最右。结果页顺序现在是“重新开始一局 / 返回案件列表 / 我要改编”。确认标题同步为“改编案件”。
- 使用原生 type=button 承载动作语义，去掉边框/底色/按钮形状，蓝色下划线链接视觉，44px 点击高度和清楚的 focus-visible。未改变改编快照/存储确认/路由/语音逻辑。
- 桌面同一操作行最右，391px 两个主要按钮下方靠右，不铺满为第三个按钮。

验证：Web 31 文件281项通过，Web typecheck/build及8 presets/89assets检查通过。既有 underline.svg构建提示未变。相邻测试更新动作顺序/文案，以实际文字定位返回，验证改编与返回事件各自正确。

实际IAB：专项5402 origin，同源1004×800与391×844 iframe；不是实际触屏设备，不改共享viewport。1004下改编入口x865..937、72×44px、透明背景/0px边框，返回x699..849，互不重叠。391下文字入口x281..353、72×44px，右缘与按钮353一致，scrollWidth=innerWidth=391。桌面Enter和窄屏Space均打开“改编案件”确认；取消后返回结果，焦点恢复到文字入口，outline为3px蓝色。控制台warn/error为空。未使用mic/provider/付费或用户8787草稿。

[桌面与391px实际截图](evidence/remix-link-layout.png)。图中上下是两个自建iframe，分别成功和失败结果。

已关闭自建tab，删除临时public/remix-link-qa.html，原exec84386 Ctrl-C；5402无listener。未动其他服务；仅保留专项origin此前测试草稿。
