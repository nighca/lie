# 三候选音色试听准备与协议验证

2026-10-24；以下前两轮记录保留各次独立 spike 当时的结果与限制，基于 `0416de6` 起步。实验未改变正式应用/appearance命名或契约、agent默认音色、用户8787设备0、实验5188设备1。用户后续认可及正式映射见末节。

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

以上首轮实验本身不足以批准最终声音映射。当时建议试听三公共demo及两同台词实际输出，核对年龄感、角色风格、清晰度、三人辨识度和自然程度，尤其确认不会三人同音色。如果需补第三live样本，应先review故障诊断与预算，再安排针对性新实验，不自动重跑整组。

## 当时的最小应用建议（历史提案）

保持故事profile和展示资源分离，在现有展示预设条目增加可选voiceId，通过应用层交给已有VoiceChannelOptions.voiceId。切人仍关闭旧连接并建立新scope，只当前形象ID决定该连接声音；不要修改共享agent默认、不要为声音新增DB/agent池，也不把声音字段放入案件真相规则。声音缺省时现有供应商默认不变；最终三套映射由试听结论决定。

[智能体API](https://linx.qiniu.com/docs/xrobot/api/agent)和[音色目录API](https://linx.qiniu.com/docs/xrobot/api/others)均可由已授权代理操作，不需要用户必须到console逐项配置；若要后台试听，可作为可选入口。暂保留appearance命名；`PresentationPreset`、`CharacterStyle`只是将来统合外观与声音的命名候选，未经确认不迁移。


## Alvin中文验证与沈禾粗犷方向候选（2026-10-24）

基线 `5d1d6f83ecbf24b1889299ed130a2a631e81707b`。用户认为原三声音基本可用，新增目标是核实Alvin中文并给沈禾找更粗犷的替代方向；不改变正式映射或现有共享agent。原第三次失败事实与缺少诊断的限制保留，不能用这次成功倒推那次原因。

本轮授权只读[官方音色目录](https://linx.qiniu.com/docs/xrobot/api/others) `GET /v1/voices`，HTTP200/code0、226项；Alvin的实时目录明确 `languages=["zh","en"]`。因此官方英文demo不代表只支持英文。精简的三条公开目录证据见 `spikes/voice-audition/catalog-selected.json`，不包含凭据或完整账号响应。

新增独立 `--alvin-only` 模式，只创建 `LIE-alvin-chinese-*` 名称的1agent/1device，私密状态为忽略的 `tmp/alvin-state.json`；输出/故障文件也与原运行隔离。复用上次本地say生成的无敏感PCM输入，没有重采真人麦克风或下载供应商demo。每次仅一个Alvin候选、一个新realtime连接、一个回答，listen.start传voice.id不修改agent默认声音，45秒上限，失败停止不重试。generic无记忆配置与原试听保持。

此次成功：1 STT、1 MCP context、1 TTS start/stop，返回158帧、101120字节、3.16秒；TTS事件文本匹配固定中文句“今天阳光很好，我们准备开始调查。”。建连1690ms、hello2099ms、总14506ms。安全结果见 `spikes/voice-audition/results-alvin.json`。FFprobe独立确认pcm_s16le、16kHz、mono、3.16秒。**这验证了指定ID+中文文本+realtime返回音频的兼容链路；实际中文发音、自然度及是否确为Alvin听感仍由人耳复核，不能只凭文本/哈希确认音色身份。**

中文WAV绝对路径（ignored，未提交）：`/private/tmp/lie-shared-ui-kit/spikes/voice-audition/tmp/alvin-chinese.wav`。样本是本次真实供应商输出；与官方英文demo分开，试听时不要用英文demo代替它。播放交付可以直接引用本地文件，无需重新生成。

沈禾最多两项替代候选，仅按官方标签/命名初筛，不额外调用付费合成，不声称已经听证比龙三叔更粗犷：

| 候选 | 公开ID/标签 | 官方目录给出的demo | 与需求的关系（推断） |
| --- | --- | --- | --- |
| 热血磁性男 / 龙飞 | `30b517c1409d4e4493319fbbd1f8126b`；成年男、rexue、zh/en | [龙飞](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250618/liqtfn/%E9%BE%99%E9%A3%9E.mp3) | 优先对比更有劲、更外放的方向；是否粗犷由用户听定 |
| 磁性低音男 / 龙小诚 | `9d91653b2adf4aa9ad97e1c8f63fbda3`；中年男、chenwen、zh/en | [龙小诚](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250618/sjhntj/%E9%BE%99%E5%B0%8F%E8%AF%9A.mp3) | 对比较低沉、成熟方向，低音不自动等于沙哑粗犷 |

两链接来自中文目录及zh-CN路径，未下载音频，未将其实际台词/语言当作已经听验。不改变音调来假装换声音；最终是否替换龙三叔仍由用户选择。

本轮操作量：目录GET1、create/configure/read各1、OTA2、bind1、realtime回答1；cleanup unbind1/delete1全部HTTP200/code0，私密 `alvin-state.json` 已删除。没有操作8787/5188资源，没读实际账单，不能说零费用。脚本语法与diff检查通过；WAV和完整目录保持ignored，不将供应商音频传播权视为已核实。


## 已认可声音的正式映射（2026-10-24）

用户认为 Bella 2.0、龙三叔、Alvin 三个声音基本可用；Alvin 的官方 zh/en 目录与独立中文 realtime 样本已复核。本次仅将已认可声音写入实际应用的 `apps/web/public/appearances/manifest.json`，沿用已经实现的形象 → 对话 scope → listen.start 音色参数透传，不改变共享 agent 默认、角色文本、引擎或预设名称。

| 形象 | 当前声音 | voiceId |
| --- | --- | --- |
| coral-bob | Bella 2.0 / 精准干练女 | `535b81a1db504baa99fd726e01afee15` |
| sunny-moustache | 龙三叔 / 沉稳质感男 | `2e7965636b0d4472ae51e75f419dff41` |
| blue-glasses | Alvin / 温暖阿虎 | `29ddb9582ae8481ebf11562f99aeaf95` |

沈禾当前仍使用龙三叔；用户希望探索更粗犷方向，前述两项备选仅供选择，本次未擅自替换。`appearance` 是否更名也未在本次决定。

本次配置验证直接加载实际 manifest，经 `readAppearances` 解析并逐项核对三 ID；Web 测试与构建分别检查现有内容关联和产物生成。没有新增管理 API、付费推理或麦克风采集；静态检查不等同于本轮主应用三人真人听感复验，前述实验失败和听觉验收限制继续保留。
