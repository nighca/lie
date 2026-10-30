# 连续调度修复与本地诊断

2026-10-30；用户明确批准第一步：修连续调度、可关闭的本地诊断。预缓冲、淡出、AudioWorklet播放架构、provider/配置变更均未实施。源基线 `60c11f72b71ead4b8e744f2281d5dbecb796d11a`，分支 `codex/lie-voice-smoothness`，worktree `/Users/nighca/.codex/worktrees/lie-voice-smoothness/lie`。本报告是源交付，整合/发布状态由root报告，不把本报告当作已上线证明。

## 行为

正常播放队列的`nextTime > currentTime`时，新分片直接紧接nextTime。首块或队列已耗尽时，仍采用当前时刻+20ms起播，并从这个实际起播点累积后续时长。避免每块强制20ms下限制造空隙，也避免将过去时刻直接给start而把后续时间轴排在过去。普通TTS stop保持自然drain；stop/close的即刻停止、meter与onIdle语义保留。没有引入预缓冲、增益或淡出。

`createPcmPlayer(context, onIdle?, onLevel?, onPlayback?)`新增可选第四个observer参数，既有调用仍有效。`stop(reason = 'manual')`记录固定枚举原因：manual/stt/tts-aborted/new-answer/close/overflow。播放器observer和web的answer边界observer异常均隔离。

诊断事件：schedule记录enqueue入口的performance时钟间隔、sample数量、音频时钟、context状态、queueAhead前后、start/end/gap及queueExhausted；stop记录原因、剩余队列/已排source数；context-state记录音频上下文状态；answer记录start/stop/aborted，无回答文本。**除arrivalIntervalMs以毫秒计外，其余时间/时长均为秒**；sampleCount除16000得到PCM秒数。

arrivalIntervalMs是主线程enqueue回调的入口间隔，包含网络/上游与主线程调度延迟，不能称为网络包到达时间。queueExhausted也不是声卡underrun计数；自然回答结束后下一回答同样可能看到队列已耗尽，需要结合answer stop/start边界区分轮间静默。gap指排程上的空隙，包括正常静默。onended仅承担自然drain反馈，未用其迟到推断声卡断流。

有observer时监听statechange；AudioContext closed后移除监听，构造时已closed则不添加。stop允许同一player继续使用，所以保留状态监听直到context关闭。实际应用本来就由conversation.close关闭context，不延长其存活。

## 开发浏览器启用与读取

应用默认仅在Vite DEV环境注入本地collector；**默认不保留事件**。DEV关闭采集时仍存在observer路径和context监听，生产默认没有observer/collector。没有window全局、storage、自动上传、PCM/转写/URL/身份字段。

在开发页面DevTools Console执行，模块路径来自现有Vite源工程：

```js
const playback = await import('/src/application/voicePlaybackDiagnostics.ts')
playback.enableVoicePlaybackDiagnostics()
// 再开启一段对话并复现；所有记录仅在当前页面内存
playback.readVoicePlaybackDiagnostics()
// 完成后禁用并清空
playback.disableVoicePlaybackDiagnostics()
```

enable清空既有事件；最多保留最近2000条；read返回分离的浅拷贝；disable清空。可注入`createLiveVoicePort({ ...dependencies, onPlayback })`用于其他受控本地采集。生产默认关闭不阻止显式依赖注入，但没有生产的全局开启入口。

实际生产JS检查未包含DEV入口/函数名、模块路径、QA按钮或fixture路径；默认liveVoice对象无onPlayback。归档fixture不在web构建入口中。

## 环境与检查

专用WT独立`npm ci`，未复制或链接主checkout的node_modules。最初误以为已有`/tmp/lie-toolchain-node/node-v24.22.1-darwin-arm64`完整，但其node可执行文件缺失，第一遍install落到24.17并发engine警告；随后下载官方Node24.22.1并验证发布的SHA256 `654ba79de6155647e22321932b45f2a1ccb705976cc337c9b8e278beb085a628`，在合规runtime下重新clean install及完整验证。runtime独立保留于`/private/tmp/lie-voice-audit-20261030/node-v24.22.1-darwin-arm64`，未改全局Node。最终npm11.19.1（初轮24.17搭配npm11.13.0）；安装没有改变lock文件。后一次npm ci提示三个包install scripts未获默认allowScripts，未扩大批准；已安装的工具仍完成以下实际检查。

| 最终检查 | 结果 |
| --- | --- |
| 根`npm run typecheck` | 通过，所有workspace |
| 根`npm test` | 通过；scripts 9+24，gateway16、web361、animation80、core52、UI59、voice45 |
| 根`npm run build` | 通过；web＋cf gateway，strict8预设121资源 |
| 随后新增overflow原因测试的voice目标复验 | 4文件46项通过；voice types通过（只测试文件新增，生产源码未变） |
| 历史schedule-repro与原results cmp | 相同；脚本固定git show基线，未来改源码仍可复现原10ms空隙 |
| 源文件diff whitespace/复现脚本Node syntax | 通过 |

初轮新增测试曾因浮点严格相等失败（0.01与0.010000000000000002）；后续一次Web types发现vi.fn零参推断导致读取calls类型错误；两者已修正并在上述完整检查中通过。未将这些初轮失败隐去，也没有用最初24.17审计检查充当实施验收。

新增测试覆盖连续衔接、真正耗尽后重锚和后续连续、stop重置与原因、observer抛错隔离、正常drain/close与STT/new-answer/aborted原因、closed listener清理、collector默认禁用/有界/快照，以及overflow清队列与原因。既有完整Web测试保留会话状态隔离和普通TTS stop等待drain。

## 原生浏览器证据与新边界

IAB入口实际返回不可用（Browser is not available: iab），故使用自建Chrome tab。归档[fixture](browser-qa.html)、[完整结果](browser-results.json)、[截图](browser-qa.png)及[source hashes](source-hashes.json)。fixture使用真实Chrome OfflineAudioContext和当前源码，synthetic enqueue时钟，纯合成固定+0.25 PCM，没有mic、扬声器、真实网络voice、用户草稿或账号数据。

16kHz输出的连续与迟到重锚两场景逐sample对照预期，均0 mismatch；idle各一次，context均closed。连续安排20–40/40–60ms，迟到场景20–40/120–140/140–160ms。这里的performance入口间隔与synthetic audio时刻是两个不同计时量，不可把fixture入口间隔解释为真实网络间隔。

48kHz输出下，两块16k PCM仍按20–40/40–60ms安排，接缝±32输出sample没有静默；**但不等同单source音频**。对照同样640个+0.25样本由单source播放，在接缝offset0观察到一个输出样本额外+0.25：双source峰0.5，单source0.25；64sample局部其余差异低于1e-6。结果明确`seamMatchesSingleSource: false`。fixture的`passed`仅代表本轮排程无静默和drain条件，不代表声学完全一致。

这说明跨source重采样边缘也可能贡献click，仍不是实际用户硬件爆音根因证明。旧播放器在分片早到时原本也会把两source安排在同一40ms边界，所以本次差异不能称为这次改动新增；本轮没有对旧版本另做native重采样对照。本轮按已批准范围保留证据，未擅自更换架构或修改PCM；未来可以针对真实音频/设备评估边缘处理或连续流播放。浏览器无error/warn日志；未做真实外放试听、声卡实时deadline、手机Chrome、回声误打断或生产网络验收。

## 临时服务回执

两轮均先核5176空闲，限定`127.0.0.1:5176`，owner `/root/voice_audit`，源worktree同上/HEAD60c11f7＋本任务未提交diff，消费者仅自建offline QA tab，用完即停。没有触碰8787/8788或其他服务。

- 首轮Vite PID6899，原exec/session15286，消费者Chrome1910331727。读取并存初轮证据后关tab；原session Ctrl-C退出130，lsof5176无listener。
- 最终轮Vite PID13131，原exec/session56862，消费者Chrome1910331732。最终三场景证据已保存、console error/warn为空，关tab；原session Ctrl-C退出130，停后lsof5176无listener。

无保留服务、未知owner进程操作、浏览器覆盖或持久页面状态改动。fixture留在docs是可复验产物，未复制至应用入口。最终仅交root review，不commit/main整合/push；中央project-plan由root所有，本执行者未修改。

## Root 交付审查

root 已完整审查生产代码与相关测试的实际差异、既有桥接生命周期、历史复现脚本、原生 fixture/JSON 和截图，核对 8 个源码/fixture SHA256 全部相等。合规 Node24.22.1 下独立复验 voice 全部46项，以及 liveVoice/本地collector两文件26项通过；`git diff --check`通过。默认起播、正常drain、立即中断不变。

当前待集成：持有 main 的工作区仍有任务开始前即存在的未跟踪视频目录，root 保留原样，未 stash、移动或纳入提交。依据 AGENTS.md 对干净 main 工作区的要求，尚未更新或发布 main；待与其 owner 协调后走独立候选的有序 cherry-pick、验证和快进流程。
