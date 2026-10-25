# 连接等待动效与试玩入口组合交付

2026-10-25。用户本专项chat明确要求对静态连接提示认真设计动态反馈；主协调授局部App/style并追加试玩结果隐藏改编入口。无需新产品规则或整体视觉审批；均沿现有准备、取消、预算和结果流程。

连接提示采用品牌青绿色20px环，1.1s持续线性转动，文字稳定，取消降为次级描边但保留操作和焦点；reduce-motion静态。无虚构进度、倒计时、新timer/JS状态/字体资源。收音就绪/失败/取消仍由原controller决定提示生命周期。详见[设计取舍、原生截图和运行时数据](../design/voice-connection-loading/README.md)。

追加试玩修复：通用App allowRemix默认true，只由Application对/editor/preview传false；成功和失败共用结果按钮受该boolean约束。preview remix handler起始return防旁路；不借returnLabel、不仅CSS隐藏。官方与分享两结果保留改编。KeepAlive/草稿替换/存储失败保护不改。子任务源290db0d9bc774c56ac3af62d7e0a35cda18e2195从4831654独立WT完成，父实际全文diff/周边/tests/docs/status审查后cherry为af8141a，随后父补App gate并实际组合回归。不要重放child原与父cherry两份。[路由实现与原测试记录](preview-remix-visibility.md)、[实际六来源结果与原稿保护证据](../design/preview-remix-visibility/README.md)。

最终Web31files288tests、vue-tsc、build8presets89assets全部通过；actual IAB桌面1280×878/窄391×844 loading/reduce/退出，以及preview/official/shared×正确/错误六种真实Application路由检查。每个Editor验收iframe内独立Map替换localStorage，未读写用户真实draft。两个preview返回原稿字节相等；四个普通来源能实际新建改编稿。没有真人语音/供应商或线上部署验证。

原base48316544ea9fd22afbf1eee8db6f81e326026821，WT background-character-names/lie，branch codex/voice-connection-loading。新增父gate为独立d4a1d81，loading仍独立后续commit；ordered full SHAs以git与最终handoff为准。旧已发布483未改、未重放旧批。

5507唯一回合PID30999/原PTY27840已Ctrl-C exit1、核无监听，IAB43/44关、media恢复、四临时入口清理。无全局viewport/network/cache覆盖，8787/8788/其他服务未动。专属证据的source/hash与复验fixture已归档。中央docs/CF/CI/Editor.vue/controller/动画和页面标题未改；完整clean交付后本专项释放App/Application/style接线范围，由唯一root安排后续title/结果动画任务。未main/push/PR/deploy。
