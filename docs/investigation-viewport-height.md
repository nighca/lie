# 调查页多余外层滚动

2026-10-25，用户经主协调要求整项定位/修复。真实测量确认：main固定100dvh−132px，但实际header约85而非预算64，加上下padding48、margin20，多约21px；长标题可多70px。桌面改实际header占位的纵向flex剩余高度，保留main480最低内容高度与自然必要滚动。

同时保护短窄屏：原overflow:hidden在391×430将记录压到4px；现在shell可自然增高，main最低360/短屏326，为记录面板保留180，实际log110px。普通391×844保持无外层滚动；极短屏可实际滚到记录区、底栏仍可操作，安全区padding不改。

所需1280×878、1289×878、1280×720、391×844及长标题/四人物、连接notice/背景modal、48条长记录均实测；正常场景document高度等于innerHeight、转写和列表内部滚动保留。补充853×585缩放等效CSS视口、1280×480、391×430保留必要滚动与可达。没有修改真实浏览器zoom，未声称真实设备安全区/键盘验证。

[完整测量、原生截图、断言、重放入口和清理回执](../design/investigation-viewport-height/README.md)。本轮只动style.css调查高度规则，不动共享ProductHeader/App/Application/Editor/动画资源；纯CSS实际浏览器矩阵+DOM断言+diffcheck，不重跑无关全套tests/types/build。无真实语音/供应商/keys/用户draft操作。

基线0621804a86806507878e4b3233268645d1481fbb；WT background-character-names/lie，新branch codex/investigation-viewport-height，旧来源refs冻结。5507 PID29602/原PTY38417已Ctrl-C exit1并核无监听，IAB45/46/47关、两临时HTML/TS清，无全局覆盖残留。未main/push/deploy/PR。clean交付后本专项释放global style布局turn给root（背景旧rule由其独立候选删），App/Application/路由测试仍交标题owner，接下来的写入需root重新分配。
