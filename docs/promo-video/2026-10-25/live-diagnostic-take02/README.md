# 第二次受限真实短测：WebSocket 打开前失败

2026-10-25。用户说“那你继续吧”，协调者授予新的单角色单问、最多60秒、无重试窗口。自动审批两次拦截进入调查，并明确不接受协调消息作为窗口授权；因此向用户列明线上 lie.agency、一次调用、可能消耗现有额度、回答/错误/超时即停，用户明确回答“确认，按此范围短测”后才执行，没有绕过拦截。

## 结果与边界

《空盒里的纪念章》沈禾，实际脚本仍为 index-BEN7xLYe.js。只有一次真实 WS 构造，未执行 question()、没有 STT/TTS。三个 AudioContext 均已 running，虚拟 getUserMedia 成功提供流；WS 构造后2435毫秒触发 error，无 open、hello、tools/list，随后 code1006、wasClean=false。页面显示语音暂时中断并回到开启对话。这将故障缩小到 WebSocket 打开之前的连接链路，不能据此认定具体是网络、Worker 升级拒绝或供应商故障；没有 HTTP 握手码。不需要硬件麦克风授权；本次未验证真实对话音画同步。

[实际阶段记录及终态](session.json)、[结果与页面状态](outcome.json)、[独立 WAV/画面检查](verification.json)、[失败画面](failure-page.jpg)。3轨各217728样本、48kHz、4.536秒，峰值0且 FFmpeg -xerror 解码通过。268帧、约4.486秒，metadata实际1470×779，未达到1280×800；本次属于失败诊断原片，不可当正式素材或尺寸验收通过。最终73.4秒创作分享视频原字节未动。

## 可检查的完整调用与清理

[实际调用 wrapper](run-live-diagnostic.js)直接保存本次运行函数，包含录屏、点击、就绪/错误检测、单问、finally关闭、3轨导出及结果存盘；[安装 harness](browser-audio-capture-diagnostic.js)追加 AudioContext 状态与 WS open/error/close/协议类型白名单计数，不存原始私有帧、正文、认证头或管理凭据。复用既有 capture-recorder.js；本次安装入口为 Runtime.evaluate 注入 harness，prepare(question.wav的base64)，makeRecorder(page,cap,root,pointer)，之后调用 wrapper；使用的原始问题样本与已交付样本相同。

状态错误立即返回，finally收尾，不重试；唯一 WS readyState3、3个ctx全closed、3条轨全ended、cleanup errors0。接口由harness还原；本次仅直接读回构造器名称，未新增逐引用相等检查，不能把名称核对写成引用相等实测。Emulation已清除，诊断标签1910329698已关闭。没有服务/端口/PTY启动，没有改产品代码、线上配置、设备、草稿或系统权限。

主协调已收到阶段证据及窗口释放，建议由其安排线上 /api/voice 升级/网络诊断，本专项不再重复语音尝试。原始帧、WAV和实际wrapper持久保存在：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/live-diagnostic-take02`
