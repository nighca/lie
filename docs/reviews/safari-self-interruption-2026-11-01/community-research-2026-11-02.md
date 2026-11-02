# 移动 Safari 自回声社区调查

状态：2026-11-02，用户要求在稍后进行 Mac→iPad 远程 Inspector 前先查社区。只读调查；无产品代码、采集、录音、供应商调用或线上配置变化。社区经验用于形成假设，不是本案根因或修复证明。

## 最贴近的第一手报告

### OpenAI Developer Community：会话开头自打断

[Realtime API Echo Cancellation Bug on iOS Safari](https://community.openai.com/t/realtime-api-echo-cancellation-bug-on-ios-safari/1075890)，2024-12-30 发帖；当前可见最后回复为 2025-08-17。

作者报告 iOS Safari 的 Playground 和自建网页偶发助手听到自己，连续自答并因 VAD 打断；更偏会话开头，随后很少出现。2025-03-25 跟帖者使用 LiveKit，称显式启用 echo cancellation 仍有问题，约十秒后消退。后续回复仍在询问解决办法，未见确认修复。

与本案相似处是外放、自打断和启动阶段线索。不同 provider、未给完整可复现代码或实际音频链，不能归因到 Linx 或证明 WebAudio 必然缺少 AEC。

### LiveKit #3758：实际回声、路由稳定与混合缓解

[Mobile Echo Issue with iphone's built in mics](https://github.com/livekit/agents/issues/3758)，2025-10-30，iPhone 14 Pro Max / iOS 18.5，浏览器 WebRTC；当前 Closed。

作者报告开场及遮挡麦克风时，助手外放被识别为用户说话；Safari/Chrome 都遇到。LiveKit 工程师提出 AEC 初始稳定时间、保持同一输出路由，建议尝试预热和关闭 AGC。11 月 4 日作者仍报告回声；11 月 18 日总结是多种措施组合，仍禁止开场打断并加服务端处理，未证明单项修复。Closed 不等于本问题已解决。

对本案的启发是检查输出刚开始的真实时序、采集和输出生命周期。WebRTC 也有同类报告，因此不能声称换成 WebRTC 必然解决；开场禁打断不符合现有自然插话要求，不能直接采用。

### Pipecat #3062：Safari 下输出被逐字转成用户文本

[Safari echo feedback with SmallWebRTCTransport](https://github.com/pipecat-ai/pipecat/issues/3062)，2025-11-15，macOS Safari / WebRTC。作者给出助手台词被转写为用户文本的例子，同配置 Firefox 和 Safari 耳机正常，并要求保留自然插话。贡献者本机 Safari 外放未复现，12 月 6 日按 Troubleshooting 关闭，没有确定原因或补丁。

它说明同类现象存在设备/环境差异，不能反推所有 Safari 或 WebRTC 都有问题。该平台与用户移动设备不同，贡献者对浏览器支持范围的宽泛陈述也不作为技术依据。

## 有相似症状但不能照搬的材料

### 个人工程记录：音频会话、短插话过滤

[iOS Safari audio sessions: fifteen commits to a working voice mode](https://samueleddy.com/writing/ios-safari-audio-sessions)，Sam Eddy，2026-05-17。

作者描述 TTS 被自身麦克风输入打断、播放音量/路由变化，混用 SpeechSynthesis、WebAudio、分阶段开关麦与短于约 300ms 的插话过滤。它支持排查音频会话生命周期，但没有能迁移到本案的单变量验证；“过滤短插话”会误伤“对/不/停”等真实输入，分阶段关麦也改变玩法。LIE 已使用 WebAudio 播放，不使用 SpeechSynthesis，不能将文章的迁移步骤当作新修复。

文章同时存在“说话时关麦”与“continuous mic”表述不一致，以及对 Safari 行为的泛化断言。只将作者观察当作其环境中的经验，不将其 API/版本和根因解释直接作为事实。

### WebKit #326286：相邻的爆音/路由问题

[REGRESSION: Audio output crackles while getUserMedia mic capture with echo cancellation is active](https://bugs.webkit.org/show_bug.cgi?id=326286)，2026-10-04 报告，当前 NEW，最后修改 2026-10-21。

主体报告 iOS 27 开启 AEC 采集后输出爆音；回复比较了 WebAudio、媒体元素、WebRTC、相同 48k 采样率等路径，仍有爆音。还有关闭 AEC 后音量/路由改变的观察。它是检查实际输出路径的背景材料，症状与本案自打断不同，也不是用户 iPadOS 26.7.1 命中该缺陷的证据。不能根据该报告关闭 AEC 或采用听筒低音量作为修复。

## 对现有数据的影响

- 用户 B→A→A→B 四轮的播放期输入能量超过 99.97% 集中在首十个**收到的**帧，和“启播阶段短暂泄漏”假设相容。时间戳是主线程收到帧的时间，不能据此宣布声学回声恰在前 200ms，或确认 AEC 校准失败。
- 默认率 B 不存在稳定收益，末轮 B 反而最高；社区的 native-rate 建议不能覆盖实测。iPhone C 更响且出声不同，社区的路由建议也不能使 C 成为已验证替代方案。
- AGC 是可排查变量，现有 getSettings 未报告该值；缺项不等于关闭，也不等于当前突然增益由 AGC 导致。没有足够证据立即改变产品约束。
- 静音预热是否有用尚未证实。现有诊断有静音源暖机却仍有首批峰值；这不能简单等同于真实游戏或 AEC 训练，更不能承诺加一两秒静音就修好。

## 下一步与边界

用户同意稍后用 Mac 连接 iPad，优先按 [next-live-window.md](next-live-window.md) 观察正常游戏里的角色播放、STT、aborted/本地停止的相对顺序，区分首句和后续句。现在不要求追加合成音测试。

进一步区分“整场首次启播”“每次回答首块”“音频路径重建/恢复后的首次启播”；这些预测有助于检验启动假设，而不是只凭社区用词决定根因。LiveKit 报告 Safari/Chrome 都受影响，仍解释不了本案同一 iPad 的浏览器差异。

这次调查提高了启动/路由生命周期的检查优先级，没有找到能在保持自然插话的同时直接采用的可靠修复。产品采集、16k 输出和中止逻辑保持现状；opt-in 产品侧追踪仍只是待确认设计。后续如需复制元数据，保留用户已要求的一键复制，且不收集对话正文、认证信息或音频。
