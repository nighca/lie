# 背景高亮姓名左右间距

2026-10-25；用户经主协调明确要求记录后直接实施。基线reviewedmain b59a6f53a75a4ccb95adc5b730cd03934368c815。隔离WT /Users/nighca/.codex/worktrees/background-character-names/lie；新branch codex/background-name-spacing，保留此前source refs。

## 最小实现

仅在 apps/web/src/style.css 的 .background-character-name 加 margin-inline:.12em；当前16px正文左右各1.92px，随字号缩放。使用外边距避免扩大姓名背景块，不加padding、伪元素、真实空格或不可见字符。沿原inline/box-decoration-break:clone和换行策略，不引入nowrap。主题色、字重、匹配算法、最长/歧义规则、原文和复制内容保持。仅公共背景两个既有入口，不改人物卡、App/Application/Editor、结果页或中央文档。

## 实际验证

- IAB42：真实App与官方empty-medal-box/demo；1280×878 before-desktop.png与after-desktop.png前后原生对照、391×844 after-mobile.png。
- punctuation-long-mobile.png：临时legacy gzip分享案件，逗号/分号/问号、重复姓名、长姓名、连续原文及独立换行。背景标记保持，行末正常折行，无横向溢出；人物卡只是原同引擎呈现，未改其样式。
- background-dialog-mobile.png：实际进入调查后打开背景，窄屏姓名跨行仍沿原行内片段装饰，左右间距轻量，弹窗可读。
- checks.json：三个开场实际textContent与Range.toString均逐字等data-text原文、左右margin为1.92px、无横向溢出。不是剪贴板读写测试，未改用户剪贴板。
- 所有5张PNG原生CDP截图、未后处理，已逐张查看。截图前仅逐个显示临时iframe容器于原点，不改AppDOM、不改全局viewport。

只有一项CSS排版变化，实际browser与git diff --check验证，不新增镜像样式tests，不重复无关全suite/types/build。未调用真实麦克风/provider/keys，不触碰draft。source.json记录最终CSS身份。qa-entry.html可复制为apps/web/__background_name_spacing_qa.html于既定5507重放；已清临时入口，归档fixture不进入生产入口。

## 服务与交付

owner调查视觉chat01a16d5c-de69-7452-8d6a-280d15a87e9e；5507启动前lsof无监听，source b59a6f5+本CSS，PID97700/原PTY27003，消费者自建IAB42。原PTY Ctrl-C exit1，后lsof核无监听；tab42关闭、临时HTML已删。无viewport/network/cache/media override，8787/8788及其他服务/标签未动。未main/PR/push/deploy，交唯一主协调实际review/候选集成；中央dashboard/registry由root批量更新。本专项没有主动跨chat发消息。
