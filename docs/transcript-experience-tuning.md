# 转写展示节奏

2026-10-24，本轮基于review main `30be593e4e6501917270cc55b4d10b6239b7654c`。落实用户已授权的“角色再慢一些”和玩家仅收到final时的逐字回退，不增加ASR服务、协议事件或部分识别能力，不修改会话状态、计时和对话布局。

## 当前节奏

`packages/ui/src/presentation/transcriptReveal.ts`对新到文字按字素固定间隔展示：

- 玩家：70ms/字素，50个字素约3.5秒。当前供应商输入按每个stt整条追加；这只是收到整句后的展示动画，**不是实时ASR partial**，不应向玩家声称新增了边说边识别能力。
- 角色：100ms/字素，50个字素约5秒，允许浏览器定时调度带来的额外误差。移除旧2400ms追赶deadline，不因为流式追加变长而加速，也不为每个块重算deadline。
- 只对最新一条未完成消息保留一个计时器。每次推进一个完整字素，家族emoji、旗帜和组合音标不拆开。同一流式pending转final沿用行与进度，不重新播放。
- 下一条问答到达时补齐上一条已收到的文本，随后按新消息自己的间隔开始；不把旧轮排进无限动画队列。因此角色很快回应时，尚未打完的玩家句子可被立即补齐，而不会延迟角色回答。

首次挂载历史、切人后的回看立即完整展示，不重复动画。停止、打断、隐藏页面导致的现有停止流程，以及reduced-motion均沿原契约补齐已收到的文字；销毁清除计时器，文字修正不按新回复重播。无Intl.Segmenter时继续退化为完整文本，避免拆坏字符。原有ARIA与自动滚动策略不变。

现App只在`view.conversationActive && !view.busy`时启用动画。已核controller：`userText`只追加玩家历史并置waiting，准备连接结束后busy仍为false、连接仍active；所以玩家final抵达而角色尚未回答时，既有接口足以显示动画。无需改动controller生命周期、App animate条件或供应商层。

## 自动验证

UI 27项测试通过，假时钟覆盖40/50/60字的固定100ms间隔、玩家final固定70ms、同条240次流式更新不加速或重置间隔、pending→final幂等、下一轮补齐旧玩家/角色、字素边界、停止/打断/历史/修正/销毁、reduced-motion和自动跟随滚动。新增Web集成测试用真实controller/App与fake VoicePort，确认waiting状态下玩家final实际逐字、角色到达后旧句补齐、停止全文保留与切人历史不重播；不把fake VoicePort当真实供应商验收。

完整Web 151项测试、UI/Web类型检查、Web构建和35图输出检查通过。本轮不改Transcript布局、左右头像、侦探素材或调查页设计。此前左右排布与头像检查仍属于旧轮证据；旧40/60字约2.1/2.3秒的计时也只描述2400ms方案，不能作为本轮固定速度的验收值。

## 独立浏览器入口

ignored fixture：`apps/web/tmp/transcript-pacing.html`、`.ts`与`TranscriptPacing.vue`，导入真实Transcript组件和应用CSS，仅用假文本提供玩家50字、角色50字、停止、打断和回看按钮。完成值由DOM MutationObserver与performance.now记录。该fixture不纳入产品或部署，不调用麦克风、语音或真实供应商。正式参数仍可在后续试玩后调整，不把本轮调参说成实时识别能力。

## 本轮独立IAB验收

测试owner在隔离5394页面使用真实Transcript组件，未改生产源码，实际结果：

| 真实CSS viewport | document scrollWidth | 玩家50字 | 角色50字 |
| --- | --- | --- | --- |
| 1280×800 | 1280 | 3579ms | 5082ms |
| 391×844 | 391 | 3579ms | 5077ms |

角色刚开始仅逐步出现2字，不在旧2400ms窗口赶完。停止后立即补齐50/50（桌面269ms/窄屏260ms时触发），打断261ms时全文并显示“回答被打断”；回看历史立即完整。没有新增console warning/error。以上只证明本地收到final后的展示回退与角色文字节奏，不是ASR partial、真人麦克风或真实供应商验收。

夹具初版误用了Vue运行时模板，导致空页及runtime compilation警告；改成ignored预编译SFC后重新检查。夹具曾在回看历史时残留测量status，实际Transcript已经立即完整；已修测量状态重置，不改生产reveal。窄屏有一轮被该fixture HMR重置，已作废并重跑，表格只记录完成轮次。测试owner最终reset viewport并关闭自己的tab，未操作8787、外部Chrome、麦克风或付费服务。

原始截图：`/private/tmp/lie-transcript-readable-desktop.jpg`、`/private/tmp/lie-transcript-readable-narrow.jpg`；实施owner已查看真实窄屏图。夹具文件保留在ignored tmp供复查，不进入正式产品。
