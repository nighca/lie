# 语音播放流畅性：当前审计与待确认方案

2026-10-30实施前审计快照。用户随后已批准并完成第一步“连续调度修复＋可关闭本地诊断”，见[实施与验证](implementation.md)；本文的预缓冲、淡出与架构候选仍未实施。用户报告：MacBook、手机，通常Chrome外放，AI语音偶尔卡顿或“爆”一下。

## 当前身份与结论

审计基线 `60c11f72b71ead4b8e744f2281d5dbecb796d11a`，专用分支 `codex/lie-voice-smoothness`。相对历史 `f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`，`packages/voice/`、`apps/web/src/application/liveVoice.ts`、`apps/web/src/application/voice.ts` 的Git diff为空。历史线索仍适用于当前源码；这不证明已部署线上版本或用户设备行为相同。

**已证实的调度缺陷**：`packages/voice/src/player.ts:69` 对每个分片取 `max(currentTime + 0.02, nextTime)`。队列还没耗尽、下块已到达时，也会把它向后推迟，插入本可避免的空隙。受控复现直接转译当前源码，没有重写播放器；不是用户设备的爆音复现。

| 第2块到达时刻 | 第1块播放 | 第2块开始 | 空隙 |
| --- | --- | --- | --- |
| 10ms | 20–40ms | 40ms | 0ms |
| 20ms | 20–40ms | 40ms | 0ms |
| 30ms | 20–40ms | 50ms | 10ms |
| 40ms | 20–40ms | 60ms | 20ms |
| 50ms | 20–40ms | 70ms | 30ms |

最后一行已有10ms真实到达迟滞，另加20ms重新起播等待；不能把30ms全部算人为缺陷。每块640bytes/320samples/20ms。首块未来20ms安排本身是有限ahead；当前没有按抖动重建的jitter buffer。

`player.ts:35–44` 停止时直接stop/disconnect，无淡出。`liveVoice.ts:83–89,107–123,135–147` 的强停来源是STT插话、TTS aborted、新TTS start遇上一回答未drain，以及关闭/失效。普通TTS stop只标记回答结束，等待已排音频自然drain，**不是强停**。外放回声是否触发误STT/aborted、硬切是否造成实际爆音仍未验证。

PCM解码 `pcm.ts:53–58` 是signed int16 little-endian除32768，无客户端增益放大/叠加证据。相邻片段的样本边缘跳变、源PCM自带削波、音频设备负载和到包抖动均未实测。播放器meter采样20Hz，不足以定位瞬时爆点。当前收音使用AudioWorklet（`microphone.ts:5–20,93–102`），没有ScriptProcessor路径；但其message回主线程做重采样/编码，播放enqueue、WebSocket回调与meter也在主线程。动画/布局/GC或CPU压力导致回调迟到，与网络/上游到包抖动都可能减少播放ahead；本轮未做trace，不能把观察到的间隔全部归为网络，更不能断言现有动画已造成卡顿。麦克风已请求echoCancellation与noiseSuppression（`microphone.ts:38`），请求不证明硬件实际效果。

## 协议与生命周期边界

- `channel.ts:180–184` 仅ready且speaking且非interrupted时收PCM；`212–223` 处理TTS start/stop。STT本身不改channel speaking，但web桥接将answerInProgress清false，旧PCM/文本会被丢弃直至新TTS start。现有liveVoice测试覆盖了这一范围。
- 中止后直到新start的旧包有保护；协议没有回答token，跨新start之后的迟到二进制无法凭空判定归属。不能承诺彻底消除所有跨回答残包。
- `player` 的onIdle当前表示所有source结束；有预缓冲后，待排PCM也必须算占用。不能在buffer未flush时误报listening。
- `liveVoice.ts:146–147` close立即stop并close AudioContext。只给stop增加5ms淡出、随后立刻close，会截断淡出；关闭策略需独立设计，保持UI立即失效和资源有界释放。
- 当前未监听播放AudioContext的statechange；只是open时resume。真实suspend/interrupted是否相关待查。页面隐藏已有生命周期处理，不可由此推导音频设备中断已覆盖。
- 网关 `index.ts:93–100` 直接转发消息，没有PCM解码、重排或主动分片。未检查生产网络/供应商内部缓冲。

## 建议的最小分阶段方案

建议先做**诊断与连续调度修复**：保留首次20ms安全ahead，正常连续队列在nextTime衔接；真正落后当前音频时钟时记录underrun并明确重启策略。不能简单把过去的nextTime交给start而继续按过去时间累计：浏览器会立即播放，后续排程可能重叠。应重新锚定实际起播时间。边界接近currentTime时也要记录余量，真实渲染线程是否来得及需设备验证。

诊断采用可关闭的本地数值事件/有界环形记录，回调异常不能影响播放，不记录PCM、转写、URL、session/device ID或凭据，不自动上报。记录到包间隔、sample数量和时长、enqueue前/后queueAhead、计划start/end/gap、初次启动与重启区分、underrun计数/持续时间、AudioContext state、stop原因（stt/tts-aborted/new-answer/close/overflow）。onended回调在主线程执行有延迟，不能独自当作真实声卡underrun计数；以音频时钟与排程判断并标明其观测边界。可增加PCM peak及边界差值的数值摘要，不能把高峰本身称为削波证据。

**待用户确认的体验权衡**：试验约100ms（80–150ms起点）的初始预缓冲，以及短暂耗尽后的重新预缓冲。与现有20ms起播相比，理想情况下约增加80ms首音排程延迟；按真实到包速度计算，不承诺固定延迟或一定消除卡顿。缓冲是有限抗抖，不能填补无限断流。

若采用预缓冲，建议按累计音频时长决定开始，并提供回答结束flush：不足阈值的短回答/最后短尾在普通TTS stop后仍须播完，不能一直等阈值。若断流后没有stop，等待必须有明确有界timer策略；定时器迟延与后台暂停需要纳入验证。普通stop继续drain；interrupt清待排与未来队列；新一代播放不受旧回调和旧gain淡出影响。

**待用户确认的中断权衡**：试验约5ms gain短淡出，仅用于当前可听source，未来source应立即取消。避免对每个分片交叉淡入淡出改变原PCM；可用每一轮独立gain保证旧fade不压低新回答。onIdle仍需恰当一次，旧ended/timer不能污染新队列。close保留立即硬关还是允许≤5ms有界尾清理需单独确认；不应为淡出延长mic/WS存活。

AudioWorklet/环形buffer作为第二阶段备选；当前可以先修确定缺陷并测量，无证据需要立即替换架构。

[MDN start()](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/start)说明过去时刻会立即播放，支持重锚而不能沿用过去累计时间的约束。[MDN GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode)说明突变增益会产生click，应使用AudioParam随时间平滑；5ms只是候选参数，不是该文档给出的推荐值。实际渐变可选适合到零的线性ramp；不可对0使用要求正值的指数ramp。

## 验证计划与本轮结果

本轮使用Node 24.17.0（低于仓库要求24.22.1）、现有主checkout的TypeScript/Vitest 5.0.5依赖，只转译/测试专用worktree源码；没有安装依赖。临时Vitest配置指定专用WT root、node环境、`vitest`与`@lie/voice`绝对alias、cacheDir/fsModuleCachePath为/tmp并关闭结果cache。执行 `packages/voice/test/**/*.test.ts` 与 `apps/web/test/liveVoice.test.ts`：**5文件62项通过**。包括player、pcm、channel、microphone与liveVoice；liveVoice采用node环境运行而非仓库默认jsdom，此处未声称完成标准全套Web检查。

`results.json`与`schedule-repro.cjs`是本轮最小复现证据。脚本固定通过`git show`读取基线60c11f7的历史player/pcm，不读取修复后的工作文件，保留历史缺陷复现。通常安装仓库依赖后从本目录运行 `node schedule-repro.cjs`；本轮因专用WT无node_modules，以主checkout的现有TypeScript解析运行同内容。脚本只使用fake AudioContext，stop/disconnect和onended清理有断言；不合成或播放真人音频。

实施后应补有意义的自动化：连续到包无人工gap、真实迟到仅一次underrun、新队列重锚、重复恢复、短回答和尾包flush、普通stop drain、插话/aborted/close、预缓冲中stop、旧timer/ended隔离、callback失败、队列上限与非法PCM。AudioBuffer duration必须由真实sample数计算，不能沿用现有meter测试固定20ms假buffer来验证排程。

再做浏览器合成PCM回放/录制，观察首音延迟、排程gap和underrun，接着在MacBook与手机Chrome对比外放/耳机的真实会话，记录设备/OS/浏览器/音频输出与上下文状态。真实provider、mic、用户录音与服务窗口由root协调用户；本轮未调用或获取。合成PCM通过不能证明真实provider或外放回声问题已解决。

本轮没有服务、浏览器tab、mic/provider连接、Cloudflare操作、源代码修改、commit、main整合或push。该文档和复现附件是审计产物，候选参数均未获实施确认。
