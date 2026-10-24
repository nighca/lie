# 语音启动等待：当前实现审计与最小测量方案

2026-10-24；审计基线 `0adf883487e9b7b8cd9d61a06a5896793ff5d580`。仅离线源码/测试调查，没有开启服务、麦克风、供应商连接或付费调用，没有改生产代码。以下阶段模型不能推出真实耗时或p95。

## 相比既有文档的新结论

[原方案](voice-conversation-proposal.md#连接等待与回声)第49行描述的“播放resume→WS/hello→权限→worklet”是历史串行路径，不能用于当前优化排期：当前已经并行准备。此前[能力实验](realtime-voice-validation.md)记录的是独立协议实验，TTS start不是用户听到首音，也未分解当前浏览器启动阶段。

当前可压缩空间需要先测，不能再次安排“把WS和麦克风并行”这种已完成的工作。新发现的必经前置为每次启动的availability HTTP检查；channel ready还等待MCP tools/list，只有hello不够。

## 当前关键路径与精确代码证据

行号均相对本审计基线。

| 阶段 | 当前行为与证据 | 计时边界 |
| --- | --- | --- |
| 用户点击/控制器 | `apps/web/src/App.vue:67`调用startConversation；`application/controller.ts:203–228`建立epoch/signal，busy=true后await open | click→open开始；准备期间未扣审问预算，成功后232–233才开始计时 |
| availability前置 | `apps/web/src/application/liveVoice.ts:125–133` await fetchStatus、response.json、校验ready；12行请求same-origin/no-store，组合用户abort和10秒timeout | status请求→响应头→JSON解析完成；失败不准备设备/WS |
| 三支并行 | `liveVoice.ts:134–144`创建播放器/其AudioContext，先调用openMic，随后Promise.all求值context.resume、channel.open、micReady | 调用顺序不是串行等待；最终由最慢支决定 |
| 播放准备支 | `liveVoice.ts:134–144` context.resume；createPlayer当下只建立对象，`packages/voice/src/player.ts:19–30,58–70`首次enqueue才创建buffer/source/可选analyser并排程 | playback resume开始/完成，不能把它当“已经听到声音” |
| 连接准备支 | `packages/voice/src/channel.ts:212–239`建立socket并启动10秒握手超时；onopen发送hello；64–68要求negotiatedFormat和toolsRegistered；175–190接hello，117–120发tools/list答复 | socket创建→open→hello→tools/list回复→channel ready；hello/list支持任意顺序，并非固定串行 |
| Worker/上游 | `apps/gateway/src/index.ts:35–67`先校验Origin/配置，await上游upgrade（10秒），再返回浏览器101 | 浏览器WS open已包含这段上游upgrade，不能当成纯浏览器→Worker RTT；不可与上游10秒相加冒称总超时 |
| 采集准备支 | `packages/voice/src/microphone.ts:34,70–95` await getUserMedia→新采集AudioContext→Blob worklet addModule→连接静音gain图→context.resume | 权限/设备启动、addModule、capture resume各自记录；gUM返回时间不能分解为用户决定时间和设备时间 |
| 全部完成→上传 | `liveVoice.ts:140–147`准备时帧丢弃；三支完成且current后startInput，再capturing=true；`channel.ts:241–253`先listen.start后PCM | listen.start已发送、首个forwarded PCM、controller recording分别记；无独立服务端listen就绪ack |

可解释的启动模型是：`Tstatus + 本地对象构建 + max(TplaybackResume, TchannelReady, TmicrophoneReady) + 结束发布`。它是依赖关系，不是性能预测；并行分支会争用浏览器资源，不能从单独测量机械相加/相减。首帧PCM还受worklet调度和编码器20ms成帧影响（`packages/voice/src/pcm.ts:10–21`）；准备阶段丢弃已有帧，不预录/补发，不能说零首帧延迟。

## 取消、错误及权限边界

- status未通过时不申请mic、不建AudioContext/WS。这是目前可观察的行为边界。把gUM或WS移到status前会让不可用环境也提示权限/建立供应商连接，不属于零行为变化的并行优化；须先提交明确方案并获用户确认。
- controller用epoch/当前人物/session/abort隔离结果（212–220）；切人/结束/指认/隐藏等既有停止流程仍适用。`liveVoice.ts:108–119,140–151`关闭WS、采集、播放器与context；迟到mic立即stop。gUM本身没有本实现可调用的取消接口：用户未处理权限时Promise可悬挂，取消意味着未来返回即停，不意味着浏览器权限弹窗立即消失。
- `microphone.ts:68–99`在stream返回后检查abort；worklet模块失败、resume失败回收tracks/节点/context；34行gUM拒绝时尚无成功stream可回收。并行Promise.all失败先关闭其余已取得资源，未完成的mic仍由scope abort及迟到stop覆盖；不得删除current检查以追求更快显示ready。
- WS握手超时与权限等待并行；权限弹窗很慢时，WS可能先ready或先失败。ready后的网关3分钟限制从relaySockets创建开始（gateway:73），不是从用户真正准备好开始；目前没有重新分配等待预算的机制。记录这种情况，不擅自延长限制或跨轮保活。
- 当前同一显式开启的realtime会话已经复用WS/mic，多轮普通TTS stop不重开（liveVoice:92–98）。结束/切人后重建是既定隐私与隔离边界，不能再将跨开启持有作为优化。
- AudioContext在status异步完成后才创建/resume。不同浏览器如何处理该时刻的用户激活/播放权限需真浏览器测量；源码不能证明一定被阻止，也不能证明所有浏览器保留激活。若要在click同步预解锁context，需单独确认不可用环境的设备准备行为及cleanup。

## 已有检查与本次离线实验

已读 `apps/web/test/liveVoice.test.ts:139–189`：已有并行启动、early PCM丢弃、晚权限取消、连接失败后迟到mic回收测试；`packages/voice/test/microphone.test.ts:70–101`覆盖权限拒绝/取消迟到stream/worklet失败；`packages/voice/test/channel.test.ts:79–94`覆盖hello/tools-list任意顺序。没有为重复这些断言新增生产测试。

本次Node24.22.1将实际liveVoice源码strip为内存模块，仅注入fake status/mic/channel/resume依赖，以手动deferred Promise逐段释放：status pending时无设备/WS准备；status ready后3支都pending；early frame没有上传；只完成mic/resume仍不startInput；channel最后完成后listen.start先于首个upload。输出为：`status-start > mic-start > playback-start > channel-start > listen-start > upload > channel-close`。**这是fake控制流证据，没有真实时间、设备、网络、权限UI或供应商证明。** 未运行真人/付费能力实验。

## 最小测量契约（拟议，未实施）

先加开发/受控验收可用的本地observer，不默认上报/持久化。每次显式开启用本地递增attempt标记，记录`performance.now()`相对同一浏览器起点，事件只含阶段、结果、有限错误类别及当前/已取消标记；不保存人声、转写、profile、供应商地址/token、角色或session真实ID。Observer不是业务状态来源，不得改变ready/错误顺序。

最少事件：`click/open/status-start/status-headers/status-ready`；`playback-resume-start/end`；`mic-request/granted/worklet-start/end/capture-resume-start/end`；`ws-create/open/hello/tools-list-replied/channel-ready`；`listen-start/first-forwarded-pcm/controller-recording`；`cancel/failure/cleanup-complete`。权限未响应样本作为pending/cancelled，不能只统计成功样本后宣布快。失败后cleanup仍记录，不能把用户取消混进网络慢。

回答延迟单独记录`STT/tool-start/end/TTS-start/first-audio-received/first-source-scheduled`；目前player在context.currentTime+20ms和已有队列两者较大处排程（player:69），scheduled不等于扬声器实际首音，硬件/系统输出延迟需另外方法。inputActive含120ms/350ms防抖，仅用于UI（liveVoice:40–45），不能当真实说话起止或供应商VAD时刻。

浏览器单边不能分离上游upgrade与本地RTT。首轮不改网关日志，先取浏览器WS包络；若其为长支，再提Worker内同请求相对时长（入站→上游响应）的无标识指标方案。两端时钟不直接相减，不把串联timeout当成功时长。

受控采样矩阵：首次权限/已授予权限分开；首次设备冷启动/本页重新开启分开；至少记录浏览器、耳机/外放及网络条件；失败/拒绝/未决取消单列。先报原始阶段记录与样本数、分支关键路径占比；样本不足不报p95。具体真人采样仍需专用环境/用户明确授权，不能占用现用设备。

## 下一步优先级（建议，非执行授权）

| 顺序 | 最小工作 | 收益条件/风险 | 决策边界 |
| --- | --- | --- | --- |
| 1 | 先实现上述本地阶段observer和fake clock/取消顺序验证；一批受控真实样本 | 最直接消除归因盲点；无宣称加速。低风险，但observer须不含内容/不阻塞业务 | 本地观测常规实现可排期；真实mic/provider采样另获明确授权，外部遥测/存储需用户决定 |
| 2 | 按样本区分status长、WS/list长、权限长、worklet/resume长 | 避免将用户权限等待当服务器慢；无行为变化 | 不需要先选新架构/provider |
| 3 | 只有status显著时，提议减少/提前做只读status探测；保留启动时失败闭合 | 去一次前置网络往返的上界取决于实测；缓存会过期，当前no-store不是偶然，不能悄悄永久复用ready | 去gate/缓存TTL/不可用时是否提前请求权限或连WS须用户确认；本审计不实施 |
| 4 | 只有WS/list长时，依据分阶段证据检查网络/供应商发现流程 | ready必须含工具发现，不能为速度先上传缺角色上下文的音频。无证据不改握手顺序 | 供应商/模型/VAD/协议或超时改变须确认；先保持现契约 |
| 5 | 只有worklet/resume长时，最小验证同次启动的图构建/模块加载改进 | 当前gUM必须先成功才有stream。每次采集context独立，addModule不能视为跨新context已缓存；跨开启复用context/module仍有生命周期代价 | 同次内不改语义的局部优化可review；共享播放/采集context、预解锁或跨开启持有先讨论 |

没有真实阶段数据前，不承诺毫秒收益、不定p95目标、不把两个AudioContext或Blob模块直接认定为性能问题；不换VAD/provider/模型，不扩大mic/WS保活，不改变隐私与结束语义。


## 最小observer实现（本地候选，2026-10-24）

`createLiveVoicePort`的依赖对象现在可选接受同步`onStartup(event)`和`now(): number`；不传observer时不记录、不输出、不持久化、不联网，也不建立诊断计时器。应用默认调用方未配置它。每次`Conversation.open()`以所注入时钟（默认performance.now）建立独立相对原点，事件仅`{stage,result,elapsedMs}`。底层channel/openMicrophone接受可选`onStartup({stage,result})`，由adapter补同一时间基准；`packages/voice/src/startup.ts`集中有限字符串类型和安全调用。observer同步抛错以及注入时钟异常被隔离，不改变业务异常/ready顺序。

阶段为startup/status/statusHeaders/playbackResume/microphone/worklet/captureResume/socket/socketOpen/hello/toolsList/channelReady/listenStart/firstForwardedPcm/cleanup；result仅started/completed/cancelled/failed。不是每个阶段均有开始/结束对：socket为创建请求，socketOpen/hello/toolsList是协议里程碑；statusHeaders指响应头到达，status完成包含解析及ready校验；microphone完成是gUM返回，非完整采集就绪；listenStart是本地发送，不是供应商ack。只记录首个真正forward的PCM，不存其字节/能量/转写或任何身份字段。未加入click/controller-recording事件，因为本批范围不改UI/controller；相对零点为open入口，不冒称DOM点击时刻。

cleanup started仅表示关闭已请求；completed必须等adapter可见mic准备Promise（包括迟到授权即stop）、已取得mic.stop及播放context.close全部settle且无拒绝。gUM未决期间不会发completed。任一相关Promise拒绝则保守报failed，表示无法凭这组Promise确认清理完成，不能据此推断实际资源泄漏；权限拒绝导致mic准备Promise拒绝亦属此类。它不确认操作系统硬件灯、权限弹窗消失或远端WS关闭ack。取消之后仍允许资源准备/清理的迟到事件，分别按结果记录，不写回游戏；数据分析不能把迟到阶段完成算成startup成功。错误consumer同步取消时，startup/channelReady仍记录原始failed，不误记为用户cancelled。

仅接口和离线fake验证完成，未做真实阶段采样或任何加速承诺；status gate/权限时机/并行次序/hello+tools-list ready/内容隔离及资源生命周期保持现有行为。回答延迟和实际首音指标未加入。验收应包括相对clock重置、并发/early PCM/首帧只记一次、取消后迟到grant与异步stop、握手门槛、observer抛错及错误回调同步取消；现有生命周期测试仍保留。本批没有开启产品服务、浏览器、mic或provider。

握手阶段的远端close（包括1000正常关闭码、1013拒绝/暂不可用）表示本次启动失败，channelReady记failed；仅调用方close或scope abort记cancelled。该区分不改变底层原close/error事件与open拒绝语义。
