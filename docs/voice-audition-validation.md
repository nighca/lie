# 三候选音色试听准备与协议验证

2026-10-24；基于 `0416de6`，仅独立spike。未改变正式应用/appearance命名或契约、agent默认音色、用户8787设备0、实验5188设备1；最终声音映射仍待试听确认。

## 最省试听入口：官方公共demo

授权只读 `GET /v1/voices` 返回code0，三个既有候选仍在目录中且均有公共demo。这里只引用链接，未下载或提交供应商音频。

| 形象（仅候选关联） | 音色与公开ID | 官方demo |
| --- | --- | --- |
| coral-bob | 精准干练女，535b81a1db504baa99fd726e01afee15 | [Bella 2.0](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250617/jbxouw/Bella2.0.mp3) |
| sunny-moustache | 沉稳质感男，2e7965636b0d4472ae51e75f419dff41 | [龙三叔](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250617/otqtwd/%E9%BE%99%E4%B8%89%E5%8F%94.mp3) |
| blue-glasses | 温暖阿虎/Alvin，29ddb9582ae8481ebf11562f99aeaf95 | [Alvin](https://lf3-static.bytednsdoc.com/obj/eden-cn/lm_hz_ihsph/ljhwZthlaukjlkulzlp/portal/bigtts/Alvin.mp3) |

目录标签分别为成年/女性/知性、中年/男性/沉稳、成年/男性/温柔。这只是初筛，不代表听感；公共demo台词不一致，也不能据其直接比较响应时延。

## 为什么又做短样本

[官方协议](https://linx.qiniu.com/docs/xrobot/platform/agent-voice-switch)说明listen.agent_params.voice.id可换声音、不换agent；示例是detect。此次单独验证正式代码将采用的realtime listen.start路径，不为每种声音创建或修改agent默认配置。

新建**1个专用generic agent、1个设备**。macOS say只本地合成一次无敏感输入问句，FFmpeg转PCM；没有采集真人、下载公共音频或占用用户设备。每候选各一次新连接，用相同PCM问句、相同MCP虚构上下文，只在listen.start改变voice.id。目标输出统一短句“今天阳光很好，我们准备开始调查。”，不发送listen.detect；20ms持续PCM及句后静音触发自动回答。

| 候选 | 实际结果 | 返回样本 | 建连/hello/总耗时 |
| --- | --- | --- | --- |
| coral-bob候选 | 1 STT、1 context调用、1 TTS start/stop；目标短句匹配 | 139帧，88,960B，2.78秒 | 1771 / 2176 / 15055ms |
| sunny-moustache候选 | 1 STT、1 context调用、1 TTS start/stop；目标短句匹配 | 235帧，150,400B，4.70秒 | 1870 / 2276 / 16441ms |
| blue-glasses候选 | 第三尝试失败，立刻停止，不重试 | 没有生成可交付本次样本；使用上方官方demo | 未留存阶段，不能推断原因 |

两个本次输出WAV在 `spikes/voice-audition/tmp/coral-bob.wav` 和 `sunny-moustache.wav`，只在执行worktree的ignored目录保留，未提交。独立FFprobe确认均为pcm_s16le、16kHz、单声道，长度如上。不同长度/哈希不能单独证明voice.id生效，更不能代替听觉验收；两项成功只证明带指定ID的参数与输出链路兼容。Alvin在此前独立realtime实验已有带参数输出，但也未耳验，不能用它冒充本次第三项成功。

原运行脚本第三失败时只输出了successfulSamples=2，未保留该次详细阶段，因此不能把原因归为额度、网络或音色不支持。后续源脚本已补安全failure.json（计数及枚举原因）便于以后明确授权运行时诊断；**没有为了完善日志再执行付费实验**。agent默认音色前后对照也因子进程失败未完成，不声称已验证读回一致；本实验源码没有修改ttsVoiceId。

## 成本、清理和边界

操作量：一次公共目录GET，创建/配置/读回1agent、绑定1device，三次候选连接尝试（前两项各一答；第三未记录完整计数），本地合成1段输入；未查询实际账单，不能用“操作少”宣称零费用。没有按失败重跑、批量生成变体或额外调用试听合成API。

失败后立即执行仅自身资源cleanup，解绑设备、删除agent均HTTP200/code0，cleanup complete；私密state文件已移除，原始key未输出/导出/提交。目录快照、合成输入、两份输出和安全结果保持ignored，保留供root和醒后的用户试听；供应商音频/合成输出传播许可未核实，不盲目进仓库。

这不足以批准最终声音映射。应试听三公共demo及两同台词实际输出，核对年龄感、角色风格、清晰度、三人辨识度和自然程度，尤其确认不会三人同音色。如果需补第三live样本，应先review故障诊断与预算，再安排针对性新实验，不自动重跑整组。

## 最小应用建议（提案，不实施）

保持故事profile和展示资源分离，在现有展示预设条目增加可选voiceId，通过应用层交给已有VoiceChannelOptions.voiceId。切人仍关闭旧连接并建立新scope，只当前形象ID决定该连接声音；不要修改共享agent默认、不要为声音新增DB/agent池，也不把声音字段放入案件真相规则。声音缺省时现有供应商默认不变；最终三套映射由试听结论决定。

[智能体API](https://linx.qiniu.com/docs/xrobot/api/agent)和[音色目录API](https://linx.qiniu.com/docs/xrobot/api/others)均可由已授权代理操作，不需要用户必须到console逐项配置；若要后台试听，可作为可选入口。暂保留appearance命名；`PresentationPreset`、`CharacterStyle`只是将来统合外观与声音的命名候选，未经确认不迁移。
