# 用户确认方向后的连接提示位置调整

2026-10-25，用户直接反馈“放在整个页面垂直方向上的中间（偏下一点点）更容易注意到”。本次仅位置CSS：从底栏上方改为 top:55dvh、translate(-50%,-50%)；移动端移除独立bottom锚点，统一使用视口55%中心。文案、颜色、尺寸、取消与连接行为不变。取代本目录上一级截图的位置方案，保留原证据，不覆盖PNG。

真实App IAB40 /既有离线deferred fixture：desktop.png 1280×878、mobile.png 391×844；两图均原生CDP捕获，无后处理。checks.json实测中心比例0.54999，取消按钮完整位于视口内，无水平溢出；移动端实际按取消后回到“开启对话”。截图只隐藏临时fixture控制区并逐帧显示，不改AppDOM或全局viewport。没有真实麦克风/供应商调用。

源码：在父已交dba2d641ff9ac9020185eb18413b6718ee1c34d9后独立追加；旧两提交已由主协调审查集成main9b17538ba93fb9c388851a6882f1deb9954a304e，此补丁不重放它们。CSS最终SHA256见source.json。其余App/controller/Application/draft文件没有改动，仍由Editor专项独占。仅CSS布局复核与diffcheck，不重跑无关全量逻辑测试。

5507启动前lsof无监听；PID85753/原PTY22271，owner原调查视觉chat；source为dba2d641加本CSS。消费IAB40；完成后原PTYCtrl-C exit1、lsof核无监听，tab40关，临时HTML/TS清理。无viewport/network/cache/media override；保护8787/8788/5544/其他tabs和服务。
