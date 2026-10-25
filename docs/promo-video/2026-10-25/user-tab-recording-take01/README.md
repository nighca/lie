# 用户标签页的首次双向有声录制

2026-10-25，用户明确要求“用我的标签页尝试录制”。协调方确认无已知其他provider消费者，一次单问≤60秒，无自动重试。复用用户Chrome tab1910329655，不重载/清旧转写。初始沈禾07:34，结束07:03，原有两条转写保持，新增本次两条。标签页保留，草稿和73.4秒创作分享视频未改。无生产代码、配置、权限、设备或服务变更。

## 实际结果与可交付预览

[37.53秒视频](../../../../media/promo-video/lie-gameplay-audio-test.mp4)，1280×800、30fps、H264/yuv420p/tv、AAC48k单声道。3030个原始帧metadata全1280×800/scale1；FFmpeg -xerror完整解码通过。视频同时包含本次Tingting合成问题与页面实际沈禾回答，不使用校准音/历史回答充当本次声音。

本次问题：我想问一下，你最后一次看到纪念章是什么时候？

本次新回答转写：18点整，我在摄影间门口的拍摄台前掀开白盒，亲眼看到蓝色纪念章卡在衬垫里。然后我合上盖子，当着顾遥的面把盒子直接交到她手里，那是我最后一次看到章。

[实际调用结果](outcome.json)：ready及questionSent均true、4条转写（初始2条），30秒回答等待上限时仍speaking，所以answerComplete=false，主动结束并显示回答被打断。此片是双向录制效果预览，不称完整正式游戏片、完整回答或多角色/指认已录完。播放器中可听完整保留的本次输出区间；未以文本完成推定声音完成。原用户旧问候/回答也出现在画面里，属于保留的基线记录。

## 音轨与时间对齐

输入/输出/混合3轨各1805056样本、37.605333秒、48k PCM16。输入峰17339、约第6–10秒非零；输出峰27104、约第16–36秒非零；mix逐样本与input+output最大差0。独立数值、每秒RMS、编码与SHA见[verification.json](verification.json)。原始WAV保留供后续剪辑，不以读回转写代替双向音频存在性。声画用record-start epoch与CDP帧首时间戳对齐，混音前裁音频约60ms；这只是时基对齐，尚无用户听感验收或独立口型精确同步测量。

[采集harness](audio-harness.js)不代理WebSocket，仅跟踪AudioContext并临时替换gUM和输出connect；零增益mic保活与真实AnalyserNode输出分别记录。输出监听静音，回答通过tee进入outputGain；本次没有把真实麦克风声音发送到服务。[实际完整wrapper](record-once.js)使用短周期同步DOM状态读取，避免上一轮长promise等待问题；结束/取消限定语音控制region，首错保存数组且清理分步catch，不被取消重名掩盖。harness60秒watchdog也会先结束页面新会话，后关闭资源。准备入口仍prepare(question.wav的base64)＋makeRecorder＋wrapper，原问题样本已交付。

[session](session.json)证明录音结束后3ctx closed、4tracks ended、cleanup errors0。因为移除了WS构造代理，socketCount0仅指harness未追踪，不能解读为无真实WS。被动Network本轮只读到close（见network.json），不伪造101或完整握手证据；真正的新STT/TTS和新非零输出是本次真人服务参与的证据。实际页面脚本沿用index-BEN7xLYe，未声称对应新发布UI。

## 清理与保存

已准确结束新对话、恢复gUM/AudioNode.connect/AudioContext、删除临时API/指针、Network.disable、Emulation清除与浏览器viewport reset；用户标签保留。没有新进程/服务/端口，不关闭他人窗口。原始帧、WAV、时戳、脚本保存在持久目录：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/user-tab-recording-take01`

render-command.json保存实际FFmpeg命令与裁音频偏移；输入依赖以上持久目录，不含私有认证/WS正文/header。后续正式片按用户已确认的几句→切换角色→指认节奏另录，须保留完整回答所需时间并协调新窗口，不自动重试本次。
