# dcc52a 唯一真实短测只读诊断

审查冻结源 `dcc52a14d6569d124708f4db096221d21d195c96`（父3c81036，完整身份见result.json），producer WT审前/审后clean且HEAD未变。当前main `6fc17ae7bdc536580edb75a557728350da457476`；所读liveVoice/controller/voice src自5a9无diff。实际读12路径完整增量、174行新session harness、旧prototype相关对照、全部失败/清理/离线RMS JSON、失败截图、liveVoice/channel/startup/microphone/player/controller相关完整实现。本批只有本地只读审查与有限WAV/metadata复算，无provider连接、网络推理、配置/凭据/服务/browser/编码或应用build/tests。

结论：唯一真实短测失败/未ready的记录成立；没有足够证据判定失败属于provider、WS握手、协议、播放resume或capture resume中哪一段，也没有已证实的产品bug。严禁以本报告作为重试turn；下一次真实连接仍需新的明确窗口授权。

## 可以确定

- 一次WS构造、一次virtual-mic-request；没有question事件、STT/TTS或真实角色音频。WAV三轨实际各884736样本/18.432秒/48kHz mono PCM16，逐样本峰值0，与JSON相同。1042帧metadata均1280×800；截图UI为“语音暂时中断”、开启对话、08:00和空转写。静音不证明录制链坏了：问题音尚未发送。
- source liveVoice.ts:159–200先取得status ready再建立播放/麦克风/WS；结合未被harness拦截的fetch和这次WS/gUM事件，可推知流程通过status gate，但本次没有保存实际HTTP状态证据，不能报告某个真实响应码或新服务健康证明。
- channel.ts:74–81的ready同时要求hello协商格式与tools/list注册；liveVoice.ts:195–205再等待播放resume、channel.open和micReady后才listen/capturing。WS构造不等于open、open不等于协议ready，当前没有这些分界数据。
- harness:66–78的output-tap对所有非control context连destination进行tee。microphone.ts:104–108正好将零增益GainNode连destination；player.ts:19–24则在实际音频播放时才将AnalyserNode连destination。因此本次GainNode tap可由麦克风静音保活支路解释，不能证明收到TTS或播放链有声；不将此推断当已观察上下文归属。
- controller.ts:153–158把closed/一般error统一显示“语音暂时中断”；channel.ts:232–257有握手超时、connection/protocol/close等多条失败路径。最终UI不能逆推出唯一原因。wrapper15秒等待结束不是应用握手实际耗时；session WS到record-stop约14.11秒只能作为外围时间。

## finally / 清理与RMS修订

新harness cleanup:43–64支持复用cleanupPromise，先恢复4个全局接口，再遍历关闭owned socket/source/port/node/track/URL/context；prepare/start/question均catch后cleanup；安装catch也请求cleanup，start建立60秒watchdog。两份离线注入结果实际为0socket、contextclosed/trackended、4接口恢复；真实失败结束状态1socket readyState3、3contextclosed、3trackended、4接口恢复、context关闭errors0，文件/源声明一致。errors0只统计context close Promise，不是每个try/catch清理点都提供独立成功计数。窗口/tab关闭和Emulation清理由作者记录，本批没有browser重验。

README声称外层wrapper以try/finally调用cleanup；提交174行是安装工厂而不是调用“开启对话→等ready→question→导出”的wrapper，所列持久库文件也没有独立wrapper源码。已有session-status证明本次确实调用了cleanup，但仅凭这个提交不能逐行审外层finally。最小补充：归档实际wrapper（去掉浏览器句柄/非必要工具细节）或明确其为执行记录而非已交源码；不要求为补文档再连一次。

offline-audio-verification.method新增了明确的半开采样窗口、PCM归一化与RMS公式。只读复算现有校准三WAV：question[24048,168048)、tone[250512,279312)，全部RMS与声明误差<1e-12；307968样本mix-input-output最大差0。没有重新采集/播放/覆盖校准。该离线校准属于旧prototype，不是本次新session harness的真实有声验证，不能互相替代。

## 最小下一步提议（未执行）

1. 先补齐并离线审wrapper：将ready、role=status“语音暂时中断”、相关失败提示和终止状态放进同一等待器；检测失败即停止，外层finally只做一次cleanup/导出，保留单连接/60秒总边界，不自行拉长超时或重连。不要仅查role=alert。
2. 在下一次获新turn前，准备局部无正文诊断：status响应分类/耗时；WS created/open/error/close.code/wasClean；hello与tools/list是否到达、channelReady；playback/capture context resume开始/完成/失败。现已有可选onStartup stage接口，但默认live port没有挂observer，不能声称开启日志就已有数据。可先在离线fake验证接线，再由root审查是否需要最小调试入口；不为了诊断修改provider配置或永久放宽错误。
3. 原始frame/body/转写/上下文/token/header不落日志。只留阶段、相对时长、枚举错误类别/关闭码；对WS控制消息至多提取hello/MCP方法类别布尔值，不存payload/sessionId/URL query/close reason。不自动重试；只在明确新单次资源turn后运行同一角色/单问，第一失败即停止并报阶段，成功才question与有声音轨验收。

现有材料没有授权下一次provider调用，也不足以建议换provider、改音色、改网关超时、放宽Origin或重启服务。本批没有生产改动/refs/main/push；报告及audit/result保留ignored目录待下一正常归档，不制造单独发布。
