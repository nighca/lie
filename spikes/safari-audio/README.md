# 独立 Safari 外放诊断工具

2026-11-01。**v1已随730ba84上线并取得用户手动iPad/iPhone样本，v2分时统计已随6bd6426上线。当前追加用户要求的一键复制按钮，待review/发布；实际游戏STT自打断根因未定，没有产品语音修复。** 调查与设备对照见[专项记录](../../docs/reviews/safari-self-interruption-2026-11-01/README.md)。用户明确批准独立诊断入口，并要求不影响其他线上功能。本批继续只改独立HTML及必要档案，无应用入口/常规流程链接；由协调者 review/集成/发布。

## 有依据的实验

当前 WebKit upstream 的 iOS [WebAudio output](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/platform/audio/ios/AudioOutputUnitAdaptorIOS.cpp) 使用 RemoteIO；[AEC capture](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/platform/mediastream/cocoa/CoreAudioCaptureUnit.cpp) 选择 VoiceProcessingIO。另一方面，[MediaStream renderer](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebKit/GPUProcess/webrtc/RemoteAudioMediaStreamTrackRendererInternalUnitManager.cpp) 在默认输出/最近 capture connection 等条件下能注册 speaker samples producer，让 capture unit 渲染播放。这给输出路径对照提供了具体机制；不能等同于用户 iPadOS26.7.1 的实际二进制，亦不能断言 WebAudio 永远不做 AEC。

| 组 | 播放 context | 唯一有声输出路径 | 所隔离的变量 |
| --- | --- | --- | --- |
| A | 16k | BufferSource → destination | 当前链路的最小模型 |
| B | 默认实际采样率 | BufferSource → destination | 仅 playback context 采样率 |
| C | 16k | BufferSource → MediaStreamDestination → audio.srcObject | 仅输出路径 |

所有组使用同一测试信号，保留真实 `openMicrophone()` 的原 constraints、独立默认采样率 capture context/worklet、零增益和 PCM encoder。playback context 仍先创建，mic 与 resume 同轮准备。不更改产品 mic/VAD/打断。不是实际 PCM player/网络分片调度的完整复刻：测试信号是本机生成、4秒、16k 单buffer 的弱多频包络信号，不是人物TTS或真实语音。

三组统一先用 `ConstantSourceNode(offset=0)` 提供静音，再开始 2秒静默→4秒信号→2秒静默。空 MediaStreamDestination 在无输入渲染连接时不保证产帧；否则 C 的 play() 可能等数据，而测试 source 又在等待 play() 完成，形成互锁。依据：[AudioBasicInspectorNode automatic pull](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/Modules/webaudio/AudioBasicInspectorNode.cpp)、[MediaStream destination consume](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/Modules/webaudio/MediaStreamAudioDestinationNode.cpp)。因此本工具衡量静音预热后的稳定路径，不覆盖首次播放瞬态；C 的媒体缓冲还可能延后声学尾音，quiet-after 不是精确声学分界。

## 权限和数据边界

- 初次加载不创建 AudioContext、不请求 mic、不播放声音。每次点击开始才请求 mic 并开始单次测试；结束才允许下一组，不自动重试或遍历。
- 每次只在本机短时处理麦克风 PCM，算 RMS/peak/完整帧数后丢弃，不保留 raw PCM 数组、不录音、不回放麦克风、不做 ASR。
- 格式v2保留旧aggregate，新增每10帧（约200ms）音量窗口；每阶段最多50个窗口，超出置`timelineTruncated`但aggregate继续累计。每窗口只有frame位置/帧数、RMS/peak和相对阶段的首末帧主线程到达时间；没有音频样本或绝对时间。这些到达时间包含主线程调度，不能当实际声学采样时间。目的是分离启播瞬态/持续输入，并看首帧延迟，不自动作AEC/ASR结论。
- 只输出 A/B/C、phase、三个阶段聚合音量、实际 capture/playback sampleRate/state、各阶段 actual track settings（AEC/NS/AGC/sampleRate/channelCount/latency；未报告为null）、清理终态、有限错误码。设置在采集resume后、阶段切换及每10帧重新读取。结果没有 deviceId/groupId/设备label/UA/会话ID/原话；不会打印异常原文。
- 无 fetch/WebSocket/上传 API，无 Cookie 读写、local/sessionStorage、IndexedDB、MediaRecorder、第三方脚本或统计。页面请求本身仍会经过正常 HTTPS 主机，与“上传麦克风音频”不同；不扩展账号、Cloudflare权限、凭据或账单。
- 最多6份完成结果存在页面内存，刷新/关闭即丢弃。用户明确要求一键复制后，增加“复制全部结果”：仅在测试停止且有结果时可用，显式点击才将当前显示的完整JSON（含历史结果）写入系统剪贴板，不读取剪贴板、不后台复制/上传。成功、拒绝/不支持、复制期间又开始新测试均给如实反馈，不覆盖音频状态；失败保留原结果供手动复制。没有下载/提交或新网络接口。
- 自动结束、停止按钮和 pagehide 都释放自有 mic tracks、capture graph、worklet port、module Blob URL、contexts、信号与静音source，以及 C 的audio元素/stream tracks。权限迟到也释放；权限框未决定时停止会等待其结束，页面明确提示。关闭context失败如实显示未清理并禁止下一组，不假称成功。
- CSP：`default-src 'none'` / `connect-src 'none'`，脚本/样式用本地来源或单文件内容hash；仅为自有 AudioWorklet 允许 script/worker `blob:`，媒体只允许blob/srcObject。不移除或放宽产品页面的全局安全策略。

## 构建和离线检查

从仓库根目录用Node24.22.1/npm11执行，使用本WT依赖：

```sh
node node_modules/typescript/bin/tsc -p spikes/safari-audio/tsconfig.json
node node_modules/vitest/vitest.mjs run --config spikes/safari-audio/vitest.config.ts
node spikes/safari-audio/build.mjs
```

首版13项fake通过：三组实际采集模块+合成stream/context/worklet的设置、音量计算/唯一输出、正常和多次停止、迟到权限、play拒绝、播放timeout、start/stop双失败仍清理、阶段设置变化、context清理失败，以及UI显式开始/禁止重叠/HTTP拒绝/pagehide。TypeScript通过。

用户首轮[iPad六组](../../docs/reviews/safari-self-interruption-2026-11-01/ipad-first-pass/README.md)和[iPhone三组](../../docs/reviews/safari-self-interruption-2026-11-01/iphone-first-pass/README.md)已保全。C对Safari iPad不是一致收益，iPhone C还有明确响度/出声差异；不按C修产品。为避免反复只看整体RMS，格式v2新增瞬态/稳定段窗口及到达延迟，另加2项fake验证短峰/稳定输入、partial window、到达时间与窗口内存边界；当前共15项。下一手动窗口仅少量Safari B→A→A→B，而非重跑所有组。

一键复制追加3项检查（共18项fake）：只有点击才复制完整历史/current、拒绝不伪称成功且保留原文、迟到clipboard结果不重开采集中复制按钮。工具tsc/独立build通过；不动probe音频代码、v2数据格式或产品语音。

review补修：每次真正开始测试递增本机轮次，复制记录点击时轮次；即使新测试还在等待首次update、textarea内容未变，迟到成功也明确为上一份。新增这一场景的fake，当前共19项；不持久化轮次、不触发新采集。

Vite独立配置，不读取应用vite.config、不导入应用main/controller，不会调用prepare/status/voice。产物在ignored `tmp/safari-audio-probe/`：普通index/assets与单文件`safari-audio.html`；后者将脚本和CSS内联并精确写入SHA256 CSP，无外部资源/导入请求。构建产物扫描已核对CSP hash、无网络/存储API引用、无provider入口；不因扫描通过声称已验证浏览器CSP或真实设备音频。

首轮IAB对file://预览的唯一尝试被浏览器URL协议策略拒绝，仅允许http/https。没有换浏览器、原始CDP、注入或服务器绕过。v1及v2正式HTTPS发布后，均已用正常IAB自有tab完成不开mic的初始控件/inlineJS/自有样式验收并关闭tab；边缘beacon和工具style被CSP拦截的告警与页面自身功能分开保留，详见[专项记录](../../docs/reviews/safari-self-interruption-2026-11-01/README.md)。一键复制当前仅fake验证，仍待发布后的明确合成文本clipboard验收，不调用真实mic。

## 已批准的线上入口范围

用户已同意的范围：只将单文件产物作为同域可信HTTPS上的隐藏独立静态页面 `/_diagnostics/safari-audio.html`，不链接常规流程，不接gateway API，不改产品音频。Web postbuild在原校验之后调用本目录`build.mjs --publish`，仅向已有Web dist写这一文件；中间assets保留ignored tmp，不发布。普通Web测试/类型检查同时覆盖诊断工具。未改Worker/路由/CSP全局配置/部署workflow/锁文件或依赖。v1于730ba84发布，平台将.html正常307到canonical [诊断入口](https://lie.agency/_diagnostics/safari-audio)；v2已随6bd6426沿用同入口上线，本次复制按钮也沿用它。普通HTTP局域网不能代替iPad可信HTTPS开麦，不开新隧道/改DNS/增加服务账号。

用户手动在同iPad的Safari和Chrome保持相同音量/位置，每浏览器各跑A/B/C，第一轮本人不说话且确认每组均能听到信号。无音频、frames为0、初始化错误、context未running或清理失败的组不用于能量比较；设置null仅代表未报告。可再正常说话做一轮观察自己声音是否同样被抑制，但RMS不能区分真人/回声，合成信号也不能直接代替真实TTS/ASR验收。先看结果能否隔离输出路径/采样率，再决定最小产品改动，最后才由用户在真实玩法里复测。

同一系统音量档不保证三条路径的实际声压相同；若某组外放变轻或切到听筒，mic能量降低可能来自路由/音量而非更强AEC。页面要求用户注明听感变化，不用单一RMS比值自动宣布修复。

## 服务与交付

本轮新增服务0、真实mic/录音/用户音频上传/Linx请求0；保留所有其他owner端口和launchd。范围仅本目录、专项调查文档和`apps/web/package.json`构建/检查接入，不改产品采集/播放器接口、UI、主工作区或main。构建输出可再生且不入Git，必要方法与权限/证据在本目录保留。用户批准独立入口不授权真实自动音频测试；发布仍由协调者实际review和串行集成负责。

### 接入后的不影响其他功能检查

同一clean SHA `34b0735ac4ce95e4b5259eef753c745df26dc350`、同WT/Node/工具/环境，对比“直接Vite构建普通Web、不运行新增postbuild”与“正常npm Web构建含新增postbuild”，然后分别用相同`cf build`生成Worker产物。[逐字哈希对比结果](../../docs/reviews/safari-self-interruption-2026-11-01/isolation-results.json)：

- 原Web **251个文件**的路径和SHA256全相同；无删除/修改，仅多`_diagnostics/safari-audio.html`，总252个。
- 原Cloudflare output **256个文件**全相同，包括Worker JS、sourcemap、Vite manifest、worker config及原Web assets；仅多`v0/workers/default/assets/_diagnostics/safari-audio.html`，总257个。
- 新HTML 11437B、SHA256 `37d189b15dbf592b20d61775e56c8c9a660d171dd0b6a45a75d1c40dd78428ad`，Web与Worker assets逐字相同。所有旧首页/游戏/编辑器/素材保持原构建字节，未增加诊断导入或链接。对比基准是相同源码SHA的普通构建，不将不同提交的版本信息变化误算成业务变化。
- 正常Web测试 **432**、诊断工具 **13**、Web+工具typecheck通过；gateway static-cache/frame-budget/session-limit纯离线 **19**通过，不启动Miniflare服务或provider。
- Gateway源码/配置/锁文件/部署workflow零diff。现有`runWorkerFirst`仍仅`/api/*`、`/games/*`、`/static/*`、`/assets/*`；新增文件走既有精确静态匹配，不改SPA fallback、未知路径和已知资源的规则。原资产/普通index字节完全相同，原API及错误路径处理代码完全相同。此为构建/源码路由核查，线上GET及原生浏览器检查仍需发布后执行；不把fake Assets绑定当平台实际路由证明。
- 此次构建检查的独立HTML脚本/样式CSP hash精确对应内容，无外部资源/导入、upload/storage API或provider入口；首次加载无音频初始化由source和UI fake验证。后续v1 HTTPS原生验收已完成并在本次必要证据中补存；实际边缘DOM包含被阻beacon注入，与构建源字节区别记录。

环境失败分开记录：首次Web build因sandbox DNS失败不能下载项目固定SHA256的官方libwebp；经正常工具审批下载至owned ignored缓存后成功。首次cf build因内部127.0.0.1 listener被sandbox EPERM拒绝；dry-run只证明参数，随后两次同一明确本地build经审批均exit0，original exec sessions `58520`/`83471`，非dev/deploy。插件的短时内部port/PID未抓取，不补造。构建后按cwd和启动时间核查：同WT剩余Node均为更早启动的MCP/CUA工具进程，精确PID listener检查无TCP监听，未发现本轮build运行时残留；未停止任何未知进程。没有新增应用服务或占用登记端口。
