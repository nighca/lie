# 完整游戏录制方案与首次失败证据

2026-10-25用户验收双向试片后，明确要求复用其标签页完成“首页→进入游戏→对话→切角色→指认→结局→回首页”。本轮正式范围为两位角色各一句合成提问，真实供应商回答完整播放；不上8分钟询问上限。原生WS、双向声音、1280×800，5分钟总上限，无自动重试。用户另对自动审批拦下的旧局进度清除明确回答“确认结束当前这局并录制”，之后才点结束本局/确认结束/返回案件列表。

## 确认方案及实际准备

- 沈禾：你交盒子时，纪念章还在里面吗？请简单回答。
- 顾遥：盒子交给陈拓之前，你做了什么？请简单回答。

本地macOS Tingting/rate175合成，问题WAV为16k mono PCM16，分别5.5391875/5.536875秒；不使用硬件mic或付费TTS。录制script不改产品内容或语音参数。按用户授权做简短流程展示，指认顾遥显示正确结局；不是盲测破案的证据。

[完整flow](capture-flow.js)分工具调用捕获，但保留同一游戏会话与连续PCM；先结束旧角色再切人，防active切人自动重连。就绪检查同步短轮询，角色回答从speaking到recording且新增两条转写稳定650ms才继续；提问最多95秒、回答最多75秒、全程5分钟。每个调用统一safeStep保留首错并立即清理，成功收尾finally；取消按钮限定语音对话region。[harness](audio-harness.js)用原生WS，仅虚拟mic/输出tee/AudioContext跟踪，最终清理结束本次UI会话，恢复API、关闭所有owned音轨/上下文。[rebuild](rebuild.py)按原始epoch保留段间hold时长，不把拼接视频配连续音轨造成后段漂移；不完整outcome拒绝导出正式成片。

只读subagent审查指出原按钮新旧名称、外层异常清理、段间时间轴风险后已修正；没有让subagent使用browser/provider。语法检查通过，未以这些离线检查冒充真实有声完成。

## 发布窗口及实际失败

root要求等待纠正发布后再录，并暂停下一次push保留窗口。收到其报告2f5496d61fca524dca04cf23da4ade8778513924的CI40183820150/CD40183972202成功后，刷新用户tab1910329655回首页；实际读到script /assets/index-DLYlxLKt.js。版本发布/hash核验来自协调者，本专项只直接核页面script路径。

首页→案件背景→接案→沈禾开启对话；连接未ready即UI语音暂时中断。没有发送提问，未观察到STT/TTS结果；供应商侧是否创建资源及计费仍待独立诊断。没有切角色/指认/结局/最终首页，因此**本轮完整视频未完成**，也没有把37秒旧试片或静音失败段当成新成片。

[Network](network.json)只有一条wss://lie.agency/api/voice创建→FrameError（空错误文本）→closed，没有握手response101；[outcome](outcome.json)首错Voice failed before ready，questionAt=null；[session](session.json)记录虚拟mic及采集侧零增益GainNode，不将此当作角色输出；[独立校验](failure-verification.json)3轨各888064样本/48k/18.501333秒，峰0、FFmpeg -xerror解码通过；1530帧metadata全1280×800scale1。capture失败仍留原始帧，但outcome.segments不加入失败段，这是预期非接受结果，不是没有捕获画面。

[失败页面](failure.jpg)。只读git核8aa7ec9..2f5496d的apps/gateway/src、packages/voice、apps/web/src/application/liveVoice.ts无差异；不能据一次失败归因于新发布，更不能排除网络、环境、设备冲突或录制harness差异。未获得HTTP拒绝码，不做根因断言。

## 清理与下一步

错误立即停止，不重试；3ctx全closed、3tracks全ended、cleanup errors0。WS未代理故harness的socketCount0不代表未建WS；以被动closed事件及页面inactive为本次连接停止证据。最终删除临时API/指针、Network.disable、Emulation清除和viewport reset，保留用户tab的失败新局08:00/空转写，不擅自清除另一份草稿。没有新服务/端口/进程；73.4秒创作分享视频和37.53秒双向试片原字节保持。

已立即向root交还窗口，要求进一步诊断同标签页新连接间歇失败，暂未开展更多计费尝试。用户完整录制目标仍未实现。正式原始素材/问题WAV/分轨等持久目录：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/full-gameplay-take01`

未存私有WS正文、认证头或管理凭据。此方案与失败证据一起归档，不能只保留聊天或/tmp。
