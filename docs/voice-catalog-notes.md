# 音色关联调查（待试听、未实施）

2026-10-23；[官方音色接口](https://linx.qiniu.com/docs/xrobot/api/others)的授权只读查询返回 code0、226条目。下列均有公共demo，标签只用于初筛，不代表听感已经适配。没有改账号配置、克隆音色或推理。

| 现有形象ID | 候选音色 | 供应商音色ID | 目录标签 |
| --- | --- | --- | --- |
| coral-bob | 精准干练女 | 535b81a1db504baa99fd726e01afee15 | adult、female、知性 |
| sunny-moustache | 沉稳质感男 | 2e7965636b0d4472ae51e75f419dff41 | middle、male、沉稳 |
| blue-glasses | 温暖阿虎/Alvin | 29ddb9582ae8481ebf11562f99aeaf95 | adult、male、温柔 |

建议先试听公共demo，再用一致、非案件台词比较自然度、三人辨识度、年龄感与清晰度；默认speed/pitch/emotion，不先调参掩盖不合适的基色。

[官方会话切换](https://linx.qiniu.com/docs/xrobot/platform/agent-voice-switch)支持listen.agent_params.voice.id及可选音量/语速/音调/情绪，只改声音、保留上下文。Header音色已废弃；官方示例使用detect，应用manual/realtime start生效还需实测。可以保持一个通用agent，浏览器按预置形象引用音色ID，Worker透传；不应在每次切人时修改共享agent默认音色。使用API即可，不要求用户后台逐项操作；后台试听是一种可选途径，不是接入前提。

[智能体API](https://linx.qiniu.com/docs/xrobot/api/agent)可改ttsVoiceId作为默认，但本调查不修改它。不同音色的供应商可用性和真实输出需实测，不能从API列出推断都能正常合成。本步不重命名appearance、不改变故事人物profile、不引入DB；展示契约如何携带声音待主代理统一协调。
