# Linx-Night与LIE语音播放：固定源码只读对比

2026-10-30检查。用户观察另一个同用Linx的Web演示“似乎没有电流样吱吱声”；这是有价值的观察，不是同设备/音源/配置的对照实验证据。未核演示部署是否对应本仓库SHA、同一模型/voice/device或浏览器输出设备，也没有运行demo、第三方代码、测试/依赖安装、provider/mic/WS/profile或native音频矩阵。

参考仓库[LMH168/Linx-Night](https://github.com/LMH168/Linx-Night)为public，GitHub connector实际读取default branch main，再固定commit **`eaf969a7d936d36601bd26c432bef65fd8bed60e`**。递归tree truncated=false；下述16份文件的blob SHA均与该固定tree核对一致。LIE对照固定 **`12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`**，由本地git show读取，而非假定远端现在的latest。本次归档WT/branch为lie-voice-cpu-options/codex/lie-voice-cpu-options，任务起点HEAD `3b745182633266a0cd22d8cfada0ebffa86f37ad`，初始clean；五份LIE对照源码与该WT无diff。本文不改应用或其它报告；专项root审查后保存研究提交，不操作main/push。

## 最有价值的差异

**参考项目的公共声音是服务端收齐一整段TTS后，拼成WAV，再交HTML Audio整段播放；不是浏览器逐PCM包排程的另一种小技巧。** 因而它没有LIE的应用级多source接缝，也不会在播放这份本地Blob期间等待下一个网络音频包。这个结构差异值得作诊断参照，却要付出等待整段TTS完成的首声延迟；不能直接替换LIE已批准的实时、可打断对话。

可核链路：

1. [host-audio.mjs L7–22](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/host-audio.mjs#L7-L22)接收binary PCM，按顺序暂存Buffer；正常tts.stop且文本/字节校验通过后才concat成WAV，不逐包送浏览器播放。
2. [voice.mjs L6–8](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/voice.mjs#L6-L8)写PCM RIFF/WAV头，单声道、16kHz、16bit，原始PCM bytes直接复制。没有逐包float解码、重采样或淡入淡出。
3. [HostPlayback.generate L28–40](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/server/src/host-playback.mjs#L28-L40)等待整份speak结果，存为ready任务；[API L47–51](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/server/src/api.mjs#L47-L51)返回完整WAV的base64。
4. [host-player.js L17–26](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/host-player.js#L17-L26)请求完成后转Blob URL，创建Audio并play；自然ended才确认任务。它没有按20ms创建AudioBufferSource。客户端poll周期在[L31](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/host-player.js#L31)为1000ms，这也是任务检查节奏，不能称作1秒音频jitter buffer。

另一个显著差异是**Linx录音路径**与公共播放互斥：[linx-voice.js L17–20、34–49](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/linx-voice.js#L17-L49)在收音前suspendPlayback，结束后恢复；[app.js L204](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/app.js#L204)实际注入hostPlayer.suspend，[host-player L32](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/host-player.js#L32)通过stop暂停。这个Linx录音路径不会像LIE一样在TTS外放时持续送麦克风PCM，回声/误打断暴露自然不同；不证明LIE已出现回声误打断。另一个[浏览器SpeechRecognition输入分支L158–171](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/app.js#L158-L171)未见同样调用suspend，不能将这一互斥结论泛化为其所有麦克风入口。

## 网页播放入口与音源路径清单

- 当前页面index加载host-player.js，并由app L225创建；这是所查网页的TTS播放入口。Audio元素带可见原生controls；stop/pause及自然ended确认均走它，没有发现隐藏的AudioWorklet/ringqueue输出实现。
- [API另一个voice/speak入口L78](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/server/src/api.mjs#L78)也取hostPlayback已缓存WAV，不是第二种实时PCM播放器。辅助[createVoiceService speak分支L29–51](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/voice.mjs#L29-L51)同样等待完整tts.stop再WAV；不能把辅助模块存在误读成当前页面走另一音频架构。
- Linx录音路径的AudioContext/OfflineAudioContext只用于录音解码和16k转换；浏览器SpeechRecognition只产生文本草稿，均不是TTS外放播放器。这里没有运行CLI/系统播放脚本，也不将其当Web demo音频路径。

参考公开语音还采用[host-audio L22的listen.detect/text_response](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/host-audio.mjs#L22)重新合成指定公开文本；[LinxClient L46–48](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/client.mjs#L46-L48)自身收到binary只记字节事件，并不在网页立即外放。LIE则是实时角色会话的TTS直接流到播放器。即使都用Linx，也不能视为同一份PCM音源、同一合成任务或同一provider配置。

## 各项机制对照

| 项目 | Linx-Night固定SHA | LIE固定12c | 对电流样声音的意义/边界 |
| --- | --- | --- | --- |
| 浏览器接收路径 | REST+完整WAV Blob，播放实现见上 | [channel L178–184](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/channel.ts#L178-L184)从WS接PCM binary，ready/speaking且未打断时立即发audio事件 | 网络抖动不在参考项目已开始的整段Blob播放路径中；不是证明其网络更好 |
| PCM协商 | [client L7、37、52–57](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/client.mjs#L7-L57)：pcm/16k/mono/16bit/little/signed_int16，20ms/320样本 | [channel L5–8、190–199](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/channel.ts#L190-L199)：请求相同PCM配置，hello校验format/rate/channels/bit depth | 两者不是一个用Opus、另一个误当PCM的已发现差异；未取得真实hello/payload证明不匹配 |
| 有符号、字节序、余字节 | 参考不在浏览器手写TTS PCM→float；WAV声明PCM16LE并复制raw。host-audio L11拒绝奇数包，不跨包补半样本 | [pcm L53–58](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/pcm.ts#L53-L58)DataView.getInt16 little-endian /32768；channel也拒绝奇数包 | 没看到能证明LIE符号/端序解码错的差异；双方都不支持拆在奇数字节的PCM样本 |
| 输出分片 | provider binary只要求偶数字节、整体≤32000×60，全部concat后播 | 每个实际入包按samples.length/16000定时，不要求收到的TTS包恰640bytes | hello20ms/320不是已测到的每个返回包固定大小；不能把参数当真实到包分布 |
| 输出采样率/重采样 | 文件声明16k；HTML媒体输出设备/实际rate未在此代码指定；整个文件交浏览器处理 | [liveVoice L21](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/apps/web/src/application/liveVoice.ts#L21)默认AudioContext；[player L98–119](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/player.ts#L98-L119)每块createBuffer的源rate16k，输出由context决定 | 参考不能据文件16k就称硬件也是16k；其应用没有LIE多source端点，这是有价值的不同 |
| 排程/队列 | 无输出worklet/ring buffer/逐块nextTime；完整文件串行任务播完才ack | 逐入包source，未来队列紧接nextTime；首次/耗尽后统一256/context.sampleRate提交余量 | 参考并未展示更先进的流式Worklet；有希望绕开接缝不等于给出实时方案 |
| 预缓冲 | 等正常tts.stop及完整WAV，实质整句/整轮收齐，不是固定100ms；额外REST/poll/媒体准备延迟 | [player L145–179](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/player.ts#L145-L179)1600样本起播、首pending100ms timer、普通结束flush，连续不另等 | 完整缓冲抗到包抖动的代价是放弃边收边播；不能称同延迟条件下更稳定 |
| gain/fade/停止 | [host-player L5、23、26、32](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/host-player.js#L5-L32)pause/remove/revoke与代次检查；未设置volume/GainNode/ramp/fade | [player L75–92](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/player.ts#L75-L92)即停sources/清pending，未淡出；正常TTSstop只flush/drain | 没有“参考靠淡出/低增益消爆音”的代码证据；HTML Audio内部也不能凭空认定有抗click处理 |
| mic处理/双工 | MediaRecorder整段，结束后decodeAudioData，再OfflineAudioContext(16k)转WAV上传；LinxClient.send使用manual | [microphone L5–19、81–108](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/microphone.ts#L81-L108)AudioWorklet收音→连续PCM encoder；[liveVoice L98–99、210–214](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/apps/web/src/application/liveVoice.ts#L98-L99)realtime并持续capturing | 参考OfflineAudioContext用来转换录音，不是输出流播放器；当前LIE收音也已是Worklet，不应沿历史ScriptProcessor假设批评它 |
| AEC/打断 | Linx录音要求echoCancellation/noiseSuppression，录音前暂停公共播放；另有浏览器SpeechRecognition输入 | [microphone L38](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/packages/voice/src/microphone.ts#L38)同样请求两项；[liveVoice L90–96、114–130](https://github.com/nighca/lie/blob/12c4e4d29135c7e30083c8ecf08c2fc95bcaf150/apps/web/src/application/liveVoice.ts#L111-L130)STT/aborted可硬停止，普通stop自然drain | 不是“参考开了AEC而LIE没有”；请求AEC不证明设备实际效果，交互路径不同不能直接比较 |

参考握手还有一处可借鉴的防错：[client L54](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/client.mjs#L54)会在hello显式带endianness/sample_format且矛盾时拒绝；LIE目前没有对这两个可选声明作同样校验。可以评估拒绝对端**显式矛盾**的端序/有符号格式，以免错误音频被当合法PCM播放；没有证据生产hello曾矛盾，不把此候选写成电流声已定位修复。字段省略需兼容，frame_duration/frame_size等其它严格检查也不应机械搬来；LIE实际播放时长由真实样本数计算。

`play_buffer_duration`尤其不能误读：[Night client L7](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/linx/src/client.mjs#L7)显式发送1000，LIE请求没有此项；但[官方协议](https://linx.qiniu.com/docs/xrobot/platform/websocket#步骤2设备发送-hello-消息)（2026-10-30读取，L102、134–142）本就说明默认1000ms，并影响服务器发送策略。它不是这里额外实现的浏览器1秒缓冲，省略可能已得同一默认，不能当参考少噪声的已证原因，也不据此擅改provider参数。

## 可以参考什么，暂不能推出什么

最优先参考的是**连续样本作为一个播放单元**的诊断思路：同一份合成/获准音源分别走现有多source与连续buffer/完整文件对照，记录输出采样率与边界。LIE已有[48k离线记录](../voice-playback-smoothness/prebuffer-implementation.md)出现跨source的少量样本差异，但未证实就是用户听到的吱声；不能用参考demo主观观察替它补上因果。本项目的native矩阵与5544归page_version所有，本任务不执行或抢占；此发现只交总协调转相关owner。

如果对照证据随后支持接缝方向，可评估在保持实时语义下连续样本/重采样状态、或合并适当批次以减少source端点；合并批次仍有批次之间边界，不能当完整答案。Worklet/ring queue是另一个需评估的实现方向，**不是Night已实现的能力，也不是本次授权实施**。直接等待整段WAV或录音时停播会改变LIE首声延迟、双工和打断行为，需另产品确认。

半双工暂停收音/播放可作为未来区分回声误打断与纯播放问题的受控变量，但不在真实用户流程偷偷关mic。保持同PCM、同设备/输出rate、同音量条件比跨应用/不同音色的试听更可解释。用户的“电流样”描述本身不区分短click、周期接缝噪声、长buzz、原始音源噪声或硬切断；本次没有频谱/硬件/实际音频证据。

参考还存在任务ready/正常ended确认、取消代次隔离、偶数字节/PCM协商、完整任务长度界限等工程约束；不是简单“没有保护所以顺”。但其[自身验收报告 L9–11、42–48](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/docs/batch3-voice-acceptance.md#L9-L48)仍明确连续播放出现浏览器提前pause、真人mic/音色听检未完；这些不是电流声证据，也不应把项目称作已经全面证明稳定。测试中[host-browser fake Audio](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/tests/host-browser.test.mjs#L1-L8)主要测确认/暂停回调，不能证明声学质量；本任务没有执行这些测试。

## 来源、许可与检查回执

固定SHA已读16份：apps/client/{host-player.js,linx-voice.js,app.js,index.html}；apps/linx/src/{client.mjs,host-audio.mjs,voice.mjs,wav.mjs}；apps/server/src/{host-playback.mjs,api.mjs}；package.json、README.md、docs/{web-voice.md,batch3-voice-acceptance.md}、tests/{host-browser.test.mjs,browser-voice.test.mjs}。额外client/README仅作简短入口核查。索引入口[client index L20](https://github.com/LMH168/Linx-Night/blob/eaf969a7d936d36601bd26c432bef65fd8bed60e/apps/client/index.html#L20)与app L204/225确认上述播放器确实接线；未将未使用的辅助模块当成页面实现。

许可核查：GitHub仓库metadata license=null，固定递归tree未见LICENSE/COPYING/NOTICE，package.json/README未见许可声明。**未找到可确认的代码复用许可**；本文只记录机制与链接，不vendor第三方实现，不建议直接复制源文件。若未来要复用代码，另确认授权；通用思路可自行实现并验证。没有保存author邮箱、身份/凭据/profile、原音频或大段第三方代码。

LIE固定12c源码SHA256（均从git show计算、与本WT逐项无diff）：

| 文件 | SHA256 |
| --- | --- |
| packages/voice/src/player.ts | 4b1bdfa0b506a02c4aa2066a43438d8a7ea6afaae03a8e7927538a243ef30ab7 |
| packages/voice/src/pcm.ts | f0d75bcd2d4a3e096aff705b58abea5526c3cc97d62d2f2ea99647f190bfb07f |
| packages/voice/src/channel.ts | b46d1a78c1a7d56a0f2858c74a611059557b4aa6b29e7faed48b224fc3ddb6e2 |
| packages/voice/src/microphone.ts | a21f27d92ef9e4cd3e62276cc41f3fb5e19c66c2ab5db660250e3a25166038b9 |
| apps/web/src/application/liveVoice.ts | a375635e33e482fbfc84e0121256f5bfa3a5c0e24abb3af630629635708efdad |

检查完成：参考branch→固定SHA→完整tree→文件blob身份；GitHub固定行号；LIE源码身份；文档本地链接与git diff --check。只有此一份新研究文档；未下载执行第三方代码、未装依赖/启动服务或触碰账号/Cloudflare/provider。没有新临时音频产物，第三方文件只通过connector读取并在工具内存中检索。原有归档、中央plan/development及其他owner资源不变，交root全文review后再决定归档commit与后续方案。
