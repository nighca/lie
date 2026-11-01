# 路演备用问答片段：来源、时间码与限制

2026-11-01，采用历史实录的首推候选。用户已选择现场开口问优先、实录备用；本片不代表全稿或剪点已获用户验收。

本说明根据总协调转交的视频owner只读调查报告整理，保留必要方法、结论与边界，避免ignored临时目录成为唯一依据。原调查报告为视频production工作树的 `tmp/roadshow-voice-evidence-2026-11-01/REPORT.md` 及 `evidence.json`。不归档独立麦克风WAV或其他原始录音。

## 采用片段

- 原件：本仓 `media/promo-video/lie-demo.mp4`，187.433333秒，1280×800@30，H264/AAC48k单声道，11,646,788 bytes。
- 原件SHA256：`5d662845a39ad08db9a7936651bd85eabecee406d800bbd7113f48f1c5b69c2a`，专项实际读文件核对与已归档记录相同。
- 时间范围：13.5–42.0秒，28.5秒，沈禾一轮。真人提问能量约14.1–19.3秒，角色回答约25.6–41.3秒；中间约6秒等待。问题涉及最后见章与交接时是否在盒，回答涉及交接前见章并直接递给下一人。
- 不含最终指认或结果，但包含关键交接线索，不能称零剧透。18–45秒会截掉提问开头，未采用。
- 本地衍生：`tmp/pitch/output/LIE-voice-backup-28.5s.mp4`，2,441,725 bytes，28.500000秒，SHA256 `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e`。已用ffprobe核时长，FFmpeg完整解码无报错。没有覆盖原件或提交MP4到Git。

剪取命令（本地FFmpeg，不新录、不调用provider）：

```sh
ffmpeg -hide_banner -loglevel error -ss 13.5 -i media/promo-video/lie-demo.mp4 -t 28.5 -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 128k -movflags +faststart tmp/pitch/output/LIE-voice-backup-28.5s.mp4
```

重新编码为有损输出，不称位级保真。此专项及视频owner本轮均未做主观听审；能量阈值和语义转写不能证明精确音节边界。用户在本机实播时仍须确认句头句尾、音量与现场节奏。本地HTML按R调用该片。

## 调查方法与证据范围

成功来源为用户已接受的 `joint-gameplay-take03`，不是失败take01/02或另一个Tingting合成提问试片。公开依据为[原合成记录](../promo-video/2026-10-25/combined-demo/README.md)、[真人录制记录](../promo-video/2026-10-25/joint-gameplay-recording/README.md)及对应 `audio-harness.js`：native getUserMedia返回原生stream，同stream另tee到inputGain，没有注入合成提问；输入为真人mic，输出为角色声音。

视频owner本次对原input/output的48kHz PCM按100ms RMS>0.01、短间隔不超过300ms归组，扣除原build的0.0936000347秒audio trim定位能量段。该阈值不能排除轻声或保证音节边界。对当前成片与原混音在12–43秒、47–71秒下采样8kHz，±0.2秒搜索FFT相关，最佳延迟均0样本，相关分别0.999585与0.999580，支持时间映射与音轨存在，不是主观听感或最新延迟证据。原合成另有62个有声秒窗保留、最低相关0.9892的历史核验。

## 已知限制与未采用候选

源录制已有持帧：采用段开头穿过旧hold最后约0.95秒，36.807100–41.995517秒另有约5.19秒持帧。音轨继续，但画面会冻结。不得称全程流畅、精确口型同步或新版本实时体验保证。旧界面与案名《空盒里的纪念章》、旧fragment均不代表98d71短链UI。

未采用的短候选为47.7–70.2秒（22.5秒，陈拓），真人约48.3–52.7秒、角色约57.4–69.1秒；回答中约7.77秒持帧。70.2秒截图仍是陈拓且回答全文可见，下一角色事件71.6604秒。它虽更短，画面连续性更差；两段合播还会提供更多推断责任的线索，故本稿只用首段备用。
