# 改编入口复用投稿按钮

2026-10-25 用户补充截图：以编辑器“投稿给官方”的既有quiet按钮视觉为准。此次取代[蓝色下划线方案](link-refinement.md)的视觉部分；旧方案保留为已被替代的验收记录。

在88ab14d之后追加，不修改既有提交。App直接使用UiButton variant=quiet，保留“我要改编”及最右顺序，删除三个自定义蓝色链接/hover/focus规则，键盘/hover/active/focus复用组件。只保留mobile下auto宽+align-self:end，避免默认全宽。Application“改编案件”文案不变，未改流程。

Web相邻3文件47项通过，Web typecheck通过。实际IAB专项5402 origin：1004×800正确结果与391×844错误结果iframe，不修改共享viewport。桌面computed class为lie-button lie-button--quiet remix-link，透明底/深蓝文字/无下划线；窄屏入口118×52.39px右缘353，与主要按钮对齐，scrollWidth=innerWidth=391。共享quiet规则提供hover底色；未新增或变更全局按钮样式，未单独模拟hover。

[实际桌面和391px截图](evidence/remix-quiet-layout.png)。无真实麦克风/provider/付费调用，未操作用户8787草稿。自建tab已关闭，临时fixture删除，原exec54417 Ctrl-C、5402释放。
