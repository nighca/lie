# 100ms起播缓冲：实现与验证

2026-10-30。用户已批准100ms起播缓冲，并要求与原连续排程修复一起交总协调审查合入。该授权不包括淡出、增益、播放Worklet、自动重连、真实provider/mic或额外配置操作。

源worktree `/Users/nighca/.codex/worktrees/lie-voice-prebuffer/lie`，branch `codex/lie-voice-prebuffer`，初始clean，直接依赖/base `5e97cda1bfe4e5621467bb4560cdfea2848b4591`（原排程修复，源基线60c11f7）。本交付不修改旧commit/工作树；完整有序交付应为 **5e97cda → root审查后提交的本增量**。总协调基于最新main整合，中央project-plan/development须保留其当前状态，不能用旧5e97中的历史片段回退。本执行者不commit/main/push。

## 行为与接口

首次、或音频时钟已真正耗尽已排队列后，先保留decoded PCM，累计1600个16kHz mono sample（100ms）即安排播放；标准分片为5×20ms。没有机械再等待旧20ms。若已排队列仍在未来，新包仍紧接nextTime，不逐包添加缓冲或render lead。

首个pending分片建立一个100ms timeout；后续包不重新计时。达阈值、普通回答结束调用flush，或timeout任一先发生就起播。`player.flush()`立即安排短尾，空pending时无操作；不会停掉已经安排的音频。timer的100ms是主线程调度deadline，忙碌/后台节流可使回调更晚，并不是硬件绝对时间保证。

起播实际等待取决于到包速度：5包突发即可立即提交，均匀20ms包间隔的第五包约在首包后80ms到达，短回答可由TTS stop更早flush；不能称“固定新增100ms”。未收到TTS stop/丢流时仍会由timer提交现有短段，避免永久等满阈值。持续断流不可能由有限缓冲填满。

normal TTS stop先标记answerEnded，再flush，仍待真实onIdle转listening。pending存在时旧source自然结束不能误报idle。stop/STT/aborted/切人/close立即清pending、buffer timer、已排sources和meter；不淡出。旧timer通过handle身份丢弃，旧ended通过sources.delete成功与否隔离，无新增epoch框架。pending音频与已排ahead、新入音频一起检查既有30秒上界，第一块31秒会在入队前拒绝；旧实现允许先塞31秒再在下一块报错的测试已改为精确30秒后追加验证，这是把新pending纳入同一界限的必要修正。

`createPcmPlayer(context, onIdle?, onLevel?, onPlayback?, onError?)`新增可选第五onError。timer触发的异步准备/启动失败先清全部pending/timer/已排sources/meter，然后通知onError，不以onIdle假装成功；error consumer自身异常隔离。batch局部列表在connect前登记所有source；未start者只disconnect，不对其调用会抛InvalidState的stop；已成功start者由统一清理停止。同步enqueue/flush错误继续抛给调用者，liveVoice按原错误收口；第五回调只在scope仍current时发送error，旧会话不会污染新UI。

可关闭本地诊断延续既有DEV collector：新增buffer waiting/pending/threshold/timeout/flush、pendingSamples、schedule.renderLead和playback-error原因；不引入新全局/storage/上传或PCM/转写/身份字段。arrivalIntervalMs仍在enqueue入口采样后随分片保存，不把稍后的批量flush间隔冒充到包间隔。除该字段毫秒外，音频时间/queueAhead/renderLead均为秒。

## 起播提交余量

单有100ms的数据储备不等于能把首次source安全安排在currentTime。已核[W3C播放算法](https://www.w3.org/TR/webaudio-1.0/#playback-AudioBufferSourceNode)首次render从buffer offset开始；[Chromium实现](https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/modules/webaudio/audio_buffer_source_handler.cc)的HandleStoppableSourceNode讨论了启动可能晚一个quantum的情况（2026-10-30读取，观察blob `6ffa1caa25118e4516269e7ea5905da33d7d9ea9`）。据此不能依赖“晚起时引擎会自动截去迟到部分”来保证相邻source不重叠。

本轮工程选择先准备好整个pending batch的AudioBuffer/source，再尽量晚读音频时钟，仅在首次/真实耗尽恢复留`256 / context.sampleRate`秒未来提交余量：按当前默认128-frame quantum的两个周期，48k约5.33ms、44.1k约5.8ms、16k离线16ms。全部batch和后续分片仍沿nextTime紧接；有未来队列的flush不叠加此余量。当前构造AudioContext没有设置renderSizeHint，128为该默认假设。

这是最小工程初值，**不是实时deadline/最佳听感保证**，没有新增调参框架或另加20ms。主线程长任务、真实音频渲染压力、设备/浏览器差异仍待真实环境测量；OfflineAudioContext不会验证control到实时render的竞态。

## 消费方审计

全仓搜索直接调用、public re-export及createPlayer注入点：

- `packages/voice/src/index.ts`继续导出同一工厂/类型，无额外兼容层；`packages/voice/README.md`公开示例与普通tts.stop契约已加flush/timeout/onError/提交余量说明。
- `apps/web/src/application/liveVoice.ts`在normal stop flush，并接入current作用域onError；其createPlayer所有编译mock（liveVoice、voice-capture-readiness）已加flush。
- player.test、pcm.test直接调用者已更新；新增liveVoice-prebuffer.test将真实player接入fake channel/mic，覆盖短尾真drain、STT/aborted/close清pending与timer异步失败。
- `spikes/realtime-voice/harness/main.ts`是可执行的直接import当前player消费者，已获root纳入范围：普通stop flush、已有try/catch收口同步错误，第五onError沿既有stop失败入口。其180秒实验约束、资源脚本和provider行为未改；只做独立类型检查，没有执行它的真实语音。
- 历史browser-qa.html/JSON/source-hashes仍原样对应5e97，需在该源码环境复验；当前使用独立prebuffer fixture/result/hash。固定git-show基线的历史schedule-repro仍保持不变。

## 验证

独立npm ci（锁未变），只读旧WT已核Node24.22.1/npm11.19.1工具链。日志/cache/TMPDIR全在本WT ignored `tmp/voice-prebuffer/`；tmp/runtime放CommonJS package边界，避免main-preview合成无扩展npm继承根ESM。没有复制或链接其他WT node_modules。

| 实际检查 | 结果 |
| --- | --- |
| 根npm run typecheck | 全部workspace通过 |
| 根npm test | scripts9＋24；gateway16、Web39文件367、animation80、core52、UI59、voice54全部通过 |
| 根npm run build | Web＋cf gateway通过，strict8预设121资源通过 |
| 随后仅新增晚到error作用域测试 | Web3文件32项及Web types再次通过；生产源码未变 |
| 可执行历史harness独立strict tsc | 通过；不运行harness/server/provider |
| 文档、JSON、diff whitespace、历史证据identity | 检查通过，见独立prebuffer-verification.json |

新增自动化覆盖100ms阈值、连续队列末端无人工gap、短flush不早idle、首pending timeout不续期、耗尽重缓冲/重锚、pending时旧source结束、stop后旧timer/ended、pending计入30秒、诊断抛错、异步createBuffer/connect/start失败（含已start一部分）、无成功idle伪报、scope过期错误丢弃。没有真实等待网络语音。

[原生fixture](prebuffer-browser-qa.html)与[完整12场景结果](prebuffer-browser-results.json)：Chrome native OfflineAudioContext，输出16k/48k，各测阈值＋连续、短flush、无stop timeout、耗尽恢复、stop旧timer、真实liveVoice normalTTSstop后真drain。所有`schedulingPassed`通过，native与单source对照的预期内部均无静默，context全closed。enqueue音频时钟是合成驱动，performance间隔不能解释为真实网络间隔。

16k六场景均与reference sample一致。48k阈值连续场景5个输出sample、恢复场景2个输出sample与单source不同，最大差0.25（合成固定0.25输入），其余场景一致；明确保留`seamMatchesSingleSource:false`。这是既有跨source重采样边缘差异，本轮未承诺修复，也不是实际外放爆音根因证明。调度通过不等于声学等价。没有真人mic、扬声器、手机实时deadline、供应商到包抖动/回声误打断或长会话实测。

截图通过浏览器工具内联输出；工具写本WT时被EPERM拒绝，未将其转存/tmp或主目录绕过路径限制。完整原生JSON通过内存gzip无损传给获准的文件工具保存在本WT，本报告/fixture/JSON是入库可复验依据；不把截图当额外声学证据。

## 服务回执与交接

原5176由connection-design用户审看占用（PID13931/cwd lie-connection-design），只读核归属后未停、未复用或改其tab1910332005。总协调另明确分配已登记空闲5544，本轮起前再次lsof为空才启动。

本任务owner `/root/voice_audit`，服务source为本prebuffer WT，HEAD5e97＋本次dirty核心源码；Vite `127.0.0.1:5544 --strictPort`，PID41535，原PTY/session75464，唯一消费者自建Chrome1910332008。IAB尝试返回不可用后才fallbackChrome；无global viewport、现有tab、storage/draft、Worker/proxy/API/账号动作。验收保存结果后关闭own tab，原PTY Ctrl-C退出1；随后精确ps41535为空、lsof5544无listener。没有保留服务、未知进程停止或8787/8788操作。

最终源冻结后交root完整diff审查；root提交本增量并把ordered 5e97→新SHA及完整范围发送总协调Chat01a18baa-4fac-71f2-a81f-c39be0640fe8。只有该总协调整合/push。本任务未更改session-limit、中央project-plan/development、旧候选b184或旧5e97工作树/commits；不声称已经main/发布。

## 专项 root 审查

专项 root 已审查完整播放器/桥接差异、所有直接消费者与测试、独立原生 fixture 和12场景JSON；逐项核对 sourceSha256、锁文件、生产入口bundle均与回执相同，独立复验 voice54项及 Web三个目标文件32项通过。每个原生schedule的start/end与sampleCount/16000时长吻合；48k两场景的非零波形差异仍明确保留。`git diff --check`及历史5e97证据identity核对通过。

审查时最新local main仍为`a742b1ecbe2a6227d53958ed3275a9f4089c5b96`。60c11f7→该main在apps/web、packages/voice、package-lock.json无差异；本分支根检查里的gateway16项来自旧依赖树，不代表已发布600秒网关的组合验收。总协调应按原source5e97及本后续提交，在最新main有序构造候选，保留已发布的600秒gateway和现行中央文档，再进行组合审查/相应检查。不要直接以旧候选b184或本source工作树整树覆盖main。
