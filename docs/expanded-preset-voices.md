# 新增五套预置形象的声音配置与验收

2026-10-24。五套形象已配置不同的灵矽音色，首案已确认的 Bella、龙三叔、Alvin 保持原样。配置仍是现有 `CharacterPreset.voiceId`，跨案件复用形象会复用声音，无新增 schema 或业务分支。

## 当前选择

| 形象 | 中文角色使用场景 | 音色（目录名称 / 官方试听别名） | voiceId | 官方年龄/风格标签 |
| --- | --- | --- | --- | --- |
| silver-bun | 乔姨、陶老师；温和、清楚地说话 | 温暖治愈女 / 龙媛 | `8fca6d5172fc4c309c2d16352ca8a9b3` | middle / wenrou |
| salt-pepper-beard | 任爷爷；沉稳、解释清楚 | 睿智青年男 / 龙楠 | `a42e04fcefac4e9492581fbc95f3fce3` | middle / chenwen |
| plum-crop | 贺宁、予安；克制、平静 | 低调冷静女 / 龙应静 | `2c1ea0eb64c74975813af2187ef2aa0f` | adult / lengjing |
| mint-puffs | 16 岁小岚；自然爽快，避免幼儿化 | 爽快思思 / Skye | `e1dd0f75cad64290a1172dff48103694` | young / youhao |
| ochre-freckles | 15 岁阿湛；自然的少年口吻 | 少年梓辛 / Brayan | `d0a37106e7f945b0aa85f3d233ffc36e` | young / youhao |

选择依据是现有角色的年龄与表达方式、目录语言和风格，不是通过外貌断定角色身份或性别。plum-crop 是中性外观，并不要求所有引用者具有同一性别。尤其两套年长外观的候选实际只有 middle 标签；龙楠名称甚至含“青年”，不能据此声称已得到真正老人嗓。青少年采用 young 而非 child，是否过熟仍需听感确认。

## 真实中文验证

2026-10-24 08:02:41Z 重新 GET 官方 `/v1/voices`，五项均存在，均标记支持 `zh/en`、`profile: public`、`tier: free`、空到期字段。仅保存这五项公开元数据到 [catalog.json](../spikes/voice-audition/expanded-samples/catalog.json)。`free` 是目录标签，**不代表会话免费或资源包永久可用**。

使用一个新建、独立 generic agent 与一个随机测试设备，模型固定为现已使用的 `deepseek-v4-flash`（`f3626c105383d71654a57f2bb8a973f3`）。不修改现有应用 agent、用户设备、全局模型/服务配置。每个候选建立一次新连接，在 realtime `listen.start.agent_params.voice.id` 指定其 ID，并发送既有本地合成问题 PCM，不使用麦克风。

所有候选只回答同一句：**今天阳光很好，我们准备开始调查。** 共五次推理，无答复重试。每条均观察到 hello PCM16k/mono 协商、一次 STT、一次角色上下文工具调用、一次 TTS start、固定中文 sentence 文本、非空 PCM 和 TTS stop。结果及 PCM SHA-256 见 [results.json](../spikes/voice-audition/expanded-samples/results.json)。

| 形象 | 本次生成的可听中文 WAV | PCM 时长 |
| --- | --- | --- |
| silver-bun | [龙媛](../spikes/voice-audition/expanded-samples/silver-bun.wav) | 4.46 秒 |
| salt-pepper-beard | [龙楠](../spikes/voice-audition/expanded-samples/salt-pepper-beard.wav) | 4.30 秒 |
| plum-crop | [龙应静](../spikes/voice-audition/expanded-samples/plum-crop.wav) | 4.22 秒 |
| mint-puffs | [Skye](../spikes/voice-audition/expanded-samples/mint-puffs.wav) | 2.98 秒 |
| ochre-freckles | [Brayan](../spikes/voice-audition/expanded-samples/ochre-freckles.wav) | 3.20 秒 |

[本地试听页](../spikes/voice-audition/expanded-samples/index.html) 并排提供五个播放器。这些 WAV 是本项目此次实际生成的固定非敏感中文句子，不是下载的官方英文 demo。协议通过证明中文合成链路可用、已发送各个 voiceId；PCM hash 不同不单独证明供应商没有忽略音色，也不能替代耳听年龄、质感和自然度。**尚未取得用户对这五个中文样本的听感验收**。尤其年长嗓与青少年年龄感若不合适，应保留具体样本给用户判断，不声称已完全符合。

这是直接供应商的隔离链路测试，并非本地页面/线上浏览器真人收音验收；跨角色配置和关闭前一 scope 的行为另由三案自动回归验证。没有为了试听更改正式设备或开启新服务。

## 安全与成本边界

`expanded-run.mjs` 必须显式 `--execute`，私密 owner state 和单次执行锁位于 ignored `spikes/voice-audition/tmp/expanded/`，权限 0600。锁存在即不能无意重跑。每回答最长 45 秒，单帧 64 KiB、总音频 4 MB/4000 帧、输出文本 8192 bytes、上下文调用最多 3 次；多回答、错句、异常立即停止。finally 仅解绑本脚本记录的随机设备与删除创建响应里得到的新 agent ID；创建响应模糊则保留待查状态，不猜 ID 删除。

准备阶段两次因 OTA 地址校验停止，均 **零推理**，均已解绑/删除新资源；未发生音色答复重试。实际 OTA 返回 `ws://xrobo-io.qiniuapi.com/v1/ws/`。第三次准备按既有产品方式识别这个官方 metadata 地址，但实际 WebSocket 始终固定使用 **wss://xrobo-io.qiniuapi.com/v1/ws/**，不降级明文。host/path/port/query/hash/userinfo 均受限。成功批次后 unbind/delete 均 HTTP200/code0，owner state 已删除。ignored 目录保留三个尝试的时间记录供审计。

目录没有本次实际人民币费用、LLM/TTS 系数或资源包扣减明细。连接时长上限、回答次数和清理不能称严格费用封顶；本次含 ASR、模型和 TTS，不声称免费。没有购买资源、启用额外付费供应商或改套餐。

复现仅供受控人工执行；默认不要为了重复检查而再调用供应商：

```sh
node --test spikes/voice-audition/expanded.test.mjs
# 真实调用需有对应授权，准备合成 PCM，指定既有依赖路径与 key 文件；不把 key 写进参数。
LIE_DEPENDENCY_ROOT=/path/to/installed/package.json node spikes/voice-audition/expanded-run.mjs \
  --execute --key-file /path/to/.linx-api-key --input-pcm /path/to/synthetic-input.pcm
# 若 cleanup 出错，使用同一 owner state 清理，不创建替代状态。
node spikes/voice-audition/expanded-run.mjs --cleanup --key-file /path/to/.linx-api-key
```

## 官方依据

- [灵矽语音目录 API](https://linx.qiniu.com/docs/xrobot/api/others)：真实 ID、语言/年龄/风格字段，官方 demo 在已保存的五项目录中。
- [灵矽音色切换协议](https://linx.qiniu.com/docs/xrobot/platform/agent-voice-switch)：使用 listen 的 voice.id，Header 不再支持切音色。本文不是把 detect 示例直接当 realtime 已验，而是另外实际验证了五次 realtime start。
- [WebSocket 协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)：语音连接与音频事件。
