# 灰白胡须成熟男声调查（初轮历史）

**现行结论见 [当前灵矽可接入候选](available-candidates.md)。** 本文保留初轮调查及外部参考，龙老伯不是本次最小修复；下文旧的优先建议已被后续具体目录调查覆盖。

2026-10-25；状态：初轮调查保留，候选未听验、未采用、无应用变更。来源：用户明确反馈 salt-pepper-beard 当前声音太年轻；root 委派 `/root/older_male_voice`，只读调查与后续试听准备。用户听感优先于供应商年龄标签。

## 结论与可交用户的试听

优先试听 **龙老伯（沧桑岁月爷）**。阿里云官方把 V3 标为 60 岁以上、普通话/英文；V2 也明确支持普通话。它比“中年、低音、沉稳”标签更直接对应年长男声要求，但温和程度、自然度仍必须人耳判断。这是上游候选，**不是已确认可接入灵矽的候选**。

| 候选 | 上游公开 voice 参数 | 官方公开试听直链 | 接入状态 |
| --- | --- | --- | --- |
| 龙老伯 V2 / 沧桑岁月爷 | `longlaobo` | [中文官方 demo](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20251020/kudwut/%E9%BE%99%E8%80%81%E4%BC%AF.mp3) | 本项目 2026-10-24 灵矽目录快照无此名称/参数；没有对应灵矽 public ID，不能填入 manifest |
| 龙老伯 V3 / 沧桑岁月爷 | `longlaobo_v3` | [中文官方 demo](https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20251117/mlmetv/%E9%BE%99%E8%80%81%E4%BC%AF.mp3) | 同上；独立版本，只作同方向对照，不能假设与 V2 相同或灵矽支持 |

两个版本只算一个音色方向，不为了凑两项而加入青年强磁性或播音嗓。试听入口来自官方页面对应行的 audio data-src（只读 HTML 提取），没有下载、转存、播放或声称已经听过音频。官方多模态音色页的同名中文样音文案为《红楼梦》相关讲述，可确认公开中文试听用途；实际发音、年龄感及闲聊自然度未听验。不同版本台词/风格可能不同，不能据此作同台词比较或时延比较。

## 当前映射与目录证据

reviewed base `30822d3779102de249c3daca0800cb4316bff53f` 的 canonical `design/character-presets/manifest.json`（构建时生成公开 appearances 清单）：salt-pepper-beard → `a42e04fcefac4e9492581fbc95f3fce3`；既有已提交中文 WAV 在 [原五声记录](../expanded-preset-voices.md)，名称“睿智青年男 / 龙楠”，灵矽标签 middle/chenwen。该样本被用户实际听感否定，不能用标签继续主张适配。

复用此前 Alvin 调查留下的公开目录快照 `/private/tmp/lie-shared-ui-kit/spikes/voice-audition/tmp/catalog-alvin.json`（226 项；日期依据 [原验收记录](../voice-audition-validation.md) 2026-10-24，本文件无独立 capturedAt）。未重新 GET 目录、未读取 key。保留完整公开中文男声子集及快照 SHA-256 于 [catalog-evidence.json](catalog-evidence.json)，避免临时文件成为唯一证据。原完整快照不进仓库；其余音色与本调查无关。

快照中文男声中没有老年标签，也没有龙老伯/沧桑岁月爷。可核对的现有中年项包括：

| 灵矽名称 / 别名 | public ID | 判断与保留原因 |
| --- | --- | --- |
| 沉稳质感男 / 龙三叔 | `2e7965636b0d4472ae51e75f419dff41` | 已用于 sunny-moustache；不擅自让灰白胡须重用以削弱辨识度；中年不等于老人 |
| 磁性理智男 / 龙天 | `2090374269950234626` | middle/chenwen，仍是磁性方向；无老年证据，不推荐为本轮替换 |
| 温暖元气男 / 龙泽 | `1c0da95dd2914bf882fb6d5048ea5138` | middle/wenrou 仍带元气方向；无老年证据，不推荐为本轮替换 |
| 磁性低音男 / 龙小诚 | `9d91653b2adf4aa9ad97e1c8f63fbda3` | 用户曾在沈禾粗犷方向中否决；该决定不是任爷爷的直接否决，但低音也不提供年长证据，不重复推给用户 |

不尝试降速、降调或提示模型“装老”；不改共享 agent 默认、首案三声、故事/profile、schema 或 API。

## 后续最小路径（提案，未执行）

1. root 可直接给用户龙老伯 V2 官方中文 demo，请判断是否符合“成熟年长、温和自然”。无需新建资源或付费合成。
2. 若方向获认可，先获具体只读验证 turn，再对灵矽当前目录作一次精确候选核对（官方接口只有全列表 GET，读完仅保留目标项或 absence 证据；不自动轮询）。旧快照缺失不等于今天仍无此音色。没有对应真实 public ID 则停止；向用户说明现有供应商可用性缺口。不得把 `longlaobo` 或猜测 hash 当灵矽 ID，不授权更换供应商、克隆或新接 TTS。
3. 只有得到可用 ID 且用户/root 给具体试听执行 turn 后，复用现有 `expanded-resources.mjs` / `expanded-sample.mjs`，编写独立 opt-in runner 并先交 root 审查。禁止直接跑现有 `expanded-run.mjs`：它固定五候选且会写旧 expanded-samples，不符合本次最多两项约束。

预备固定矩阵：最多两个经过目录核实的候选（只选一个时只一答），每项一个新 realtime 连接，固定原短句“今天阳光很好，我们准备开始调查。”，同一既有本地合成 PCM、不用麦克风，speed/pitch/emotion 默认。新建一个独立 generic agent＋一个随机设备，owner state/一次锁/输出独立目录；单请求20秒、单连接45秒、总执行设置180秒含准备的硬 deadline，cleanup 独立每请求20秒且仅自建ID。单帧64KiB、输出PCM最多4MB/4000帧、文本8192bytes、最多3次上下文工具；一答、准确中文文本、非空PCM及hello/STT/context/TTS start/stop为协议条件；第一 FAIL/UNCERTAIN/异常即停止、无重试。协议成功不等于人耳通过。

**费用前提尚未满足，因此不可执行付费矩阵**：现有脚本只限时长/操作量，目录 free 标签不等于免费；没有本次可核实计费单价/系数、资源扣减口径或供应商硬止付。必须先核算并获批具体人民币上界及实现可执行的上界；若供应商不能提供硬封顶，明确报告不能保证，交用户决定预算方式，不把180秒称为费用封顶。资源建立/清理操作也纳入核算。此文没有编造金额，也没有借“少量试听”越过费用审查。

结束必须核实解绑/删除成功；创建响应模糊保留 owner state 待查，不猜ID删除、不碰用户设备。仅保存公开目录必要字段、固定非敏感样本/安全结果；不输出 key/设备凭据。正式单字段替换另等 root 协调 manifest 写入 turn，测试解析真实 manifest 并核对其余七项未变；不代表本阶段已获替换授权。

## 来源与验证边界

- [阿里云 CosyVoice 官方音色表](https://help.aliyun.com/zh/model-studio/cosyvoice-voice-list)：本次公开 HTML 实读，提取 V2/V3 对应行和 demo URL；V3 年龄60岁以上，普通话支持。网页提取文本不显示音频控件地址，因此只读 HTML 作补证，没有关闭证书校验。
- [阿里云多模态音色表](https://help.aliyun.com/zh/model-studio/multimodal-timbre-list)：龙老伯中文文案与版本定位。
- [灵矽目录接口](https://linx.qiniu.com/docs/xrobot/api/others)：仅文档读取，未本次调用目录 API。
- [既有五声映射及实际中文实验](../expanded-preset-voices.md)、[既有三声与 Alvin 验证](../voice-audition-validation.md)。

本次只读公开文档、旧目录与脚本；没有 server/browser/mic/provider 推理/TTS/管理写、agent/device/key 操作。qiniu AI API docs 工具经目录发现仅有通用模型 OAS，非灵矽音色专用工具；本次使用对应灵矽与阿里云原始官方资料。

交付检查仅文档/JSON/路径/diff；无应用修改，不运行无关应用 suites。临时服务、浏览器tab、供应商资源均未创建，无清理尾项。worktree 保留给 root review；不集成 main、不 push/deploy/PR。
