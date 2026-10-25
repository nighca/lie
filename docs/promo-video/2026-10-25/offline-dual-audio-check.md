# 离线双向音轨验证

2026-10-25，用户接受合成玩家声音，并要求游玩录像同时包含输入与页面输出。以下是已完成的离线采集验证，不是真实游戏对话或完整有声录像。

## 已实测结果

专用用户Chrome tab1910329677、lie.agency首页，临时注入录制装置；不操作创作草稿，不开启产品语音，不调用provider、不采集硬件麦克风。通过标准MediaStream构造可克隆虚拟输入，合成提问输入与另一AudioContext的页面输出经独立支路捕获并直接混音。页面输出使用660Hz一秒校准音，绝不称作角色回答；测试时只捕获信号、暂停硬件扬声器监听。

保留三条mono/48kHz/PCM16 WAV：input.wav、output.wav、mix.wav，每条均307968样本/6.416秒，逐文件FFmpeg -xerror完整解码通过。窗口RMS证明input只有提问、output只有校准音，mix同时包含双方；所有逐样本 `mix-input-output` 最大绝对差为0。证明当前6.416秒校准中双轨完整、直接混音样本对齐，不证明长对话无漂移、VAD、模型识别或画面同步已验。

当前产物位于media/promo-video/offline-audio-check/；pcm-dual-audio-demo.mp3是“提问＋校准音”的试听，不是可对外当游玩的视频。browser-audio-capture-prototype.js为本次实际注入源码；offline-audio-verification.json与offline-audio-events.json记录检查及时间戳。MediaRecorder旧WebM作为失败备选保留在素材库，不作正式录音。

## 方法与已处理问题

原生WebAudio输出connect在专用tab中临时tee，不替换游戏PCM、模型回答或产品代码；getUserMedia仅在该页以已生成声音构造标准流，不访问用户硬件声音。AudioWorklet从同一48kHz时钟导出输入、输出和直接混音PCM，正式方案将把真实角色WebAudio播放送到同一输出支路。prototype仅技术装置，仍需真实游戏短测确认输入/识别/回答/应用资源释放及音画时间对齐。

第一版MediaRecorder WebM读出有效信号但出现Opus packet header解码警告，输入/输出尾部持续时间不一致，未采用。第二版无损WAV采用MediaStream中转的混音总线，RMS通过但未通过逐样本对齐（相关搜索候选391sample仍有大残差），未采用。最终直接GainNode混音总线消除此问题，max difference=0；上述失败与未采用工程/raw保存在素材库superseded-stream-bridge及原WebM。不把初版退出码0当作无警告通过。

等待页面完成的locator首次限时检查返回超时，随后明确检查已完成状态再导出；没有重复触发该轮任务。总共三轮短离线校准，不是三次真实provider重试。

## 真实试录的资源门禁

已向主协调申请1角色/1问题/最多60秒/不重试的线上资源窗口，沿用现有agent/device，不建资源、不改配置、不读取管理凭据。root明确回复：当前没有核实共享device空闲窗口与费用边界，暂不给provider使用turn，只允许继续离线验证。因此本批没有启动真实语音；短测与完整游玩录像仍未完成，不声称已经能录好真实角色回答。由主协调落实具体owner/窗口/费用授权边界后再执行，不猜测无人使用。

录制以双方单独音轨与混音三份保留为目标；真实短测将先校验两边有声、文本和声音对应、音画同步，成功后才录整局。所有声音需来自实际输入和真实角色输出，不能以预写回答/配音替换真实结果。

## 保管与收尾

原始结果和未采用备选已持久保存于：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/offline-dual-audio-check`

临时录音装置已stop，getUserMedia与AudioNode.connect恢复，所有创建的媒体轨、worklet端口及AudioContext已释放，测试panel删除，自建tab已关闭。没有新增/改动OS音频设备、权限、软件安装、账号、服务端口/PTY、主线或部署。73.4秒完整创作分享视频保持原字节。本批仅制作验证与校准音/合成提问，不含个人声音或真实供应商回答。
