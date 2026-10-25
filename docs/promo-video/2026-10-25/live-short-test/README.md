# 唯一一次真实语音短测：连接未就绪

2026-10-25。用户对真实短测明确说“测吧”；root核对原话后授一次≤60秒、单角色单问、不重试的现有线上device协调turn。一答/错误/超时结束，不接管外部会话，不新增/配置资源、不读取管理凭据，不将60秒称作费用硬上限。用户另确认正式短片只需“几句对话→切换角色再对话→指认”，不耗尽询问上限；正式录制与这次试验分开。

## 实际结果

Chrome专用tab1910329690，线上首页→官方《空盒里的纪念章》→沈禾。实际页面脚本index-BEN7xLYe.js对应已发布8aa7ec967dfad45bf1646cdd27c6d909bebec437的静态归档；不等同本批重新核全资源hash。只读核对5a9a31c..当前main6fc17ae的liveVoice/channel/player/microphone没有diff，界面连接提示已更新。

按现有按钮进入调查并“开启对话”。在录制器中记录到1个真实voice WebSocket构造、1次标准虚拟Mic请求、采集侧GainNode tee。15秒等待检查未观察到“结束对话”就绪状态；最终UI已显示“语音暂时中断”，询问额度仍08:00。没有执行question()，没有转写/角色回答；3轨WAV独立校验全部峰值0。结果为**连接失败，实际有声游戏输入、回答与音画同步未验证**，绝不称该静音短片为通过。

录屏1042帧，约19.185秒；WAV3轨各884736样本/18.432秒/48kHz/mono。恰好一次连接，无重试；从voice-socket-created到最终wrapper停止约14.11秒。页面错误是status提示而非role=alert，原等待器只检查alert/ready，故到15秒时限才归入错误；应用已自行结束语音并回到“开启对话”。后续试录的等待器应同时检查“语音暂时中断”状态，以更早停止，不因此重连。

浏览器warn/error日志只读结果为空，未获得HTTP握手码或上游细分错误；不能据此指认是供应商、网络或录制装置某一环的问题。本轮没有再连一次来诊断，不更改业务超时或供应商配置。

## 异常清理补强与实际检查

新browser-audio-capture-session.js替代历史校准prototype的真实使用：跟踪构造的AudioContext、媒体轨、节点、Worklet端口、Blob URL、音频source和仅本页voice socket；prepare/start/question错误均cleanup，安装错误也清理；单用录音开始后60秒watchdog关闭连接并释放资源；wrapper实际try/finally无论成功/失败都调用cleanup。restore gUM/connect与AudioContext/WebSocket构造器，不改应用源代码、OS设备或权限。保留PCM导出数据直到存盘后关闭页面。

真实连接前做两次不连provider的故障注入：无效音频解码失败；以及已创建第一个Worklet后第二个Worklet前抛错。两次结果均0socket、contextclosed、trackended、4项接口逐引用恢复。没有重跑原离线校准音或覆盖原材料。

本次真实失败后的session-status实际证明：socketCount1、唯一socket readyState3；3个AudioContext全closed、3条ownedtrack全ended；gUM/connect/AudioContext/WebSocket恢复原引用，cleanup errors0。原始3条静音WAV均FFmpeg -xerror解码通过，所有画面帧metadata1280×800。删除本页提示层/捕获对象、清除Emulation并关闭tab。无本地服务/端口/PTY启动，用户新草稿和73.4秒创作分享成片保持原字节。实际费用没有查账，不能称零费用。

root已收到失败事实并释放本次turn；任何真实重试或正式多角色录制需要重新协调窗口，未自动占用。root复核离线RMS的精确窗口/算法已补入offline-audio-verification.json，不重录原校准。

## 留存

本目录留存必要脱敏JSON、清理故障测试和错误截图。完整帧/时戳、静音分轨等原始素材持久保存于：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/live-short-test-20261025`

未保存认证头、管理凭据、WS私有帧或他人的对话。没有供应商声音可交付。此次事实不否定已完成的离线分轨校准，但也不能以离线结果替代真实验证。主协调维护中央计划/排队，后续不擅自追加计费尝试。
