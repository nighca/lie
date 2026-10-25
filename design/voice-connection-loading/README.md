# 连接提示的动态等待反馈

2026-10-25，用户直接标注原静态提示，要求认真设计一个能表达系统正自动准备的动态元素。已批准B方向内局部实现；主协调授notice markup/style turn。基线已发布main48316544ea9fd22afbf1eee8db6f81e326026821，隔离branch codex/voice-connection-loading。

## 设计与实现

保持页面55%高度的稳定提示框与原提示文字。在标题左侧增加20px青绿色半环，柔和轨道配连续1.1秒线性旋转；青绿色沿用现品牌aqua。只有图标转动，文字和布局固定。取消按钮从实心白色改为深底细描边，减少被误认为必须点击的主要操作；保留明确文本、42px最小高度、键盘焦点与原取消回调。

环形loading表达不定时自动准备，不写百分比/倒计时，不暗示已完成进度或承诺立即成功；不模拟玩家音量。纯CSS动效，不增加JS状态/RAF/timer或资源。aria-hidden装饰图标不造成重复播报；原role=status文字保持。prefers-reduced-motion时animation:none，仍保留静态环和提示。

原静态版作为历史保留于voice-connection-interaction/position-revision。考虑过跳动省略点、全卡呼吸；选择单一环形motion使字面提示与取消保持稳定。没有制作额外位图或引入字体。

## 实际验证

IAB43，实际App和controller加原离线deferred transport：desktop.png 1280×878、mobile.png 391×844、mobile-reduced-motion.png。三张原生PNG已逐张查看，未后处理。checks.json记录两相位不同transform、1.1s动画、每提示1个active animation、装饰aria-hidden、55%位置、无横溢、准备期08:00；reduce为animationName=none且0animation。收音就绪、取消后迟到就绪、失败均提示移除且图标0个，不新增重试。

截图不能呈现连续运动；运行时计算样式/animation及相位数据提供动效证据。抓图时只逐帧显示fixture并隐藏其工具按钮，不改应用DOM/globalviewport。loading截图发生在独立allowRemix prop/result按钮修改前，后者仅影响结果区；notice subtree与CSS/controller/依赖完全相同，最终组合全套测试另行通过。source.json分别标记最终App与不变notice/CSS身份，不冒充截图来自修改后的整文件字节。

原生收音就绪仍由现liveVoice transport+mic+playback/startInput完成决定；未改行为或准备免费规则。没有真实mic/provider/keys调用；系统权限提示本身沿原流程，不通过文案承诺用户一定无需授权。无性能/动画素材/标题实现变更。

## 组合检查与服务清理

主协调追加的试玩入口修复同批完成，独立文档preview-remix-visibility.md与对应native证据。最终Web31files288tests PASS、types PASS、build8presets89assets PASS；最初loading局部2files5tests亦通过。保留既有underline hash URL构建warning，生成SVG存在；不回退性能管线。

5507启动前无监听，owner本调查视觉chat；WT /Users/nighca/.codex/worktrees/background-character-names/lie，source4831654+本批，PID30999/原PTY27840；仅IAB43（loading）/44（preview）消费。原PTY Ctrl-C exit1，lsof核无监听，两个tab关。Emulation reduce恢复features=[]；无viewport/network/cache覆盖。四个临时HTML/TS已删，重放副本仅归档design目录不入dist；8787/8788与其他服务/用户draft未动。此批不main/PR/push/deploy，交唯一root实际审查后本地集成。源refs/文档保持，App/Application/title接线范围于clean handoff后释放给root调度。
