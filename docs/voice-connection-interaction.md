# 语音连接提示与切人自动接续

2026-10-25。按用户经主协调明确委派的两个小交互要求实施；待唯一主协调实际review及候选集成。本专项不改main、不推送/部署/开PR。

## 已实现

点击开启后，桌面/窄屏在底栏上方出现醒目的全局提示：“正在连接语音 / {人物姓名} · 连接成功后再说话”，有取消按钮，原底栏取消仍可用。提示不使用模态遮罩，因此连接期间仍能切换人物、查看背景、离开或最终指认；不引入新的完成倒计时、成功延时或额外状态。实际 Conversation.open() 完成后提示立即退出，现有结束按钮/玩家波形反映可收音。

连接成功以现有 liveVoice.open 的 transport + playback + microphone 全部完成、startInput 为界，而非WebSocket open。准备期间普通转写/音量/listening事件被忽略，error/closed仍立即结束；准备时间不扣询问预算。

原对话仍active（包括准备中）切换新人物时，先abort/close旧scope再创建新scope；相同人物点击不重连。原对话已结束或从未开启则仅切换。每个人历史保持，未完成回答在切换前记回原人物，共享预算结算但不重置。沿现epoch/session/character/signal拒绝迟到事件和迟到open完成；快速切换只保留最后有效目标。失败不重试，当前人物保留供手动再开。取消/背景/指认/离开/终局/load/restart/dispose都撤销待连接意图，耗尽预算不再接续。

## 取舍

复用 busy && conversationActive 和已有 open/close 合同，无新GameView状态、provider事件、重试队列、计时延迟或新依赖。UI仅App及一组局部CSS，未改共用VoiceControl以免编辑器等入口受到无关影响。全局提示深蓝底白字，位于底栏之上，长目标名可换行；不阻断侧卡/顶部操作。保留已有错误提示、预算规则和无输入时静止波形。控制器顺序保证当前scope唯一，不宣称真实硬件异步释放零时延。

## 验证

- 最终Web31files266tests通过；Web vue-tsc通过；组合生产源码build通过，8presets89assets检查通过。
- child新增16个deferred场景，覆盖A→B→C、历史/预算、同人/未开/已结束、早期事件、六种停止路径、同步create异常/异步open失败/服务不可用/额度耗尽。父实际全文diff/周边/状态review后cherry-pick。
- App新增4个交互检查：提示与真实ready边界、取消迟到、失败退出无重试、切人目标与背景停止。
- 独立适配器组合测试真实createLiveVoicePort+controller，以延迟mic证明transport打开仍busy且不扣时，mic完成才startInput并开始计时。
- IAB1280×878/391×844实际页面：醒目提示无横溢、准备不扣时、就绪清除、取消后迟到无恢复、快速切人最终目标、错误无循环、停止后切人不开、背景停止后迟到不恢复。均离线替身，无真实麦克风/供应商/keys。

[完整原生图、DOM结果、可重放fixture和服务回执](../design/voice-connection-interaction/README.md)。用户草稿、Editor、Application/main、性能、案件、动画素材、声线和CF/CI未改。

## 失败记录

父首次组合测试265项通过但类型检查发现新测试误用 wrapper.get(...).exists()（get返回类型不含exists）；改为find，新增适配器测试后最终266项及types通过，无生产source变更。Vite构建保留既有静态hash下划线URL构建时不解析的warning，生成的对应SVG存在，未改性能管线。child初次直跑缺资源生成hook，正常npm pretest生成后通过，详见其专属文档。浏览器一次无URL MutationObserver错误来源未定，未据此声称console PASS。

## 提交与服务

基线7249a6f94106ce9fa7aaefdf640222f77ff70188；复用本专项已交清洁WT创建codex/voice-connection-interaction，保留背景高亮/标题旧refs，不重放旧批。child源854dbcf40ddeba98620dee787bc0174dd6855db4已父review/cherry为fc635b5（交付仅重放父序列）。UI/证据以独立后续commit交付。5507 PID50346/原PTY39627已Ctrl-C exit1并核无监听，IAB39与临时入口清理，未动其他服务。
