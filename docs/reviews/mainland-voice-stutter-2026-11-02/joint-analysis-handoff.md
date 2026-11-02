# 联合诊断：播放连续性最小输入与判读

2026-11-02。状态：供共同负责人合并的分析合同；**不是第二份用户测试步骤，也没有新增采集实现。** 依据为已审源提交 `3040bf1ed8972739e5c85c06e9fef4adcf9d000c` 的[首轮调查](README.md)、[实际player离线脚本](offline-replay.mjs)和[9组结果](offline-results.json)。本增量不改变这些已交付文件的代码/结果。

## 统一责任与已有信息

- 用户通过总协调明确要求两个Chat一起推进，尽量共用诊断和测试，需要配合时统一通知。Safari Chat `01a19770-ee7d-7c31-96fe-b80657c3ee5d` 是共同诊断负责人/唯一测试说明维护者，拥有 `docs/reviews/voice-diagnostics-2026-11-02/**`；本专项只维护自身目录，向负责人交分析输入，再由负责人整批交root审查/统一通知。
- 已有镇江电信/Wi-Fi/iPad Safari、断续后继续/正常转写/无连接错误/初始化偏慢的用户答复复用，不再追问同样环境。Safari负责人最新转述：**iPad目前未复现自打断，用户打算稍后用iPhone Safari，并已问过连接步骤。** 不据此认定句中断续也已消失；不要求另测iPad、两台对比、换浏览器或合成音AB。iPad旧环境不自动归到iPhone，新样本未知信息留空，由唯一负责人从已有资料统一核对。
- 只使用用户本人选择的一个设备的一次正常短会话；没复现先分析已有证据，不强求重测。原来的两套连接说明由共同负责人统一；本文件不再次派发步骤或要求用户操作。
- 协调授权不等于已批准产品记录器、Worker逐帧日志、录音/HAR、自动mic/provider、协议/缓冲/路由变化。保持16k、自然插话和现有播放行为，不读云端原始用户日志、用户草稿或clipboard。

## Inspector这一轮最少输入

以唯一负责人的现有Inspector记录为准，不安装/注入收集器，不在Console包装WebSocket或猴子补丁播放器。**首轮只取异常附近连续至多10条下行binary（尽可能前5/后5）及夹杂的必要事件**；无法定位则已有一次回答开头至多10条并注明非异常对齐，负担大或UI不提供就停止于现象/事件。不索取完整回答逐帧数据；以下“完整覆盖”仅为未来可用数据的判读条件，不是追加采集要求。UI未提供的字段留 `unknown`，不推算隐藏字段。

| 输入 | 最小形式 | 关键限制 |
| --- | --- | --- |
| 来源与覆盖 | `Inspector`；同一次选定socket；局部连续窗口；完整/部分/未知，是否缺行/开始太晚/结束太早。 | 至多10条完整局部摘录也不等于完整回答；无法以“未看见”证明整个回答中事件没发生，也不能计算全回答最大包间隔。不要保存socket URL/身份标识；本地顺序号足够区分本轮。 |
| 事件 | 方向、`tts.start / tts.sentence_start / tts.stop / stt / binary / close`枚举；stop的`is_aborted`布尔（若实际存在）。 | 不保留正文、工具参数、原异常、音频或认证信息。缺失aborted字段标未知，不补成false。STT存在只证明收到识别事件，不能凭枚举判断它来自回声。 |
| 时间 | Inspector实际显示的时间及其单位；统一转成相对毫秒。优先同一回答第一个`tts.start=0`；缺start时明确用首条可见事件为零且回答边界不全。 | 不把另一个面板/主机的时钟直接相减；保留显示精度。Inspector若只提供次序不提供时间，只分析次序。时间代表该工具的可见事件时刻，不命名为网卡/服务器发送时间。 |
| 下行binary长度 | 仅UI确认为binary **payload byteLength** 时记录整数bytes；否则只记binary事件、bytes未知。 | 不展开、复制或散列二进制。网络transfer size/压缩后长度/帧头大小不等于PCM payload，不用于换算音频时长；输出分片不强定640bytes。 |
| 用户停顿标记 | “听到停顿/恢复”“本人在说话/沉默/未知”，配大致顺序或一个粗略时间区间；正常首声也可简单标记。 | 不要求同步敲键、录屏/录音或精确人肉秒表。主观标记与Inspector时钟未同步时只做粗范围关联，不算毫秒差或硬件延迟。 |
| 已有环境/版本 | 唯一负责人复用的设备、系统、浏览器、输出/前台状态、页面版本及来源；缺项未知。 | iPhone新样本与iPad历史分别标来源。没有实际读取到版本/输出状态就不补；不为补字段再开一轮会话。 |

初始化观察只附带同一窗口已有的请求/upgrade/hello/tools-list次序或时间；不记录请求头/正文，也不人为清Cookie/预热缓存制造冷启动。用户点击、WS open、ready、首个binary与主观首声是不同边界，缺任一就不计算相应阶段。

有完整的同方向连续binary窗口、可靠payload长度且16k PCM格式已确认时，`audioMs = bytes / 32`（16k × 1ch × 2bytes/s）。可算累计音频时长与相邻可见binary事件间隔；**它们不是queueAhead**，不扣主观播放时间来编造真实缓冲。缺payload长度时仍可看事件次序，缺连续覆盖时最大间隔只称“已列事件的间隔”，不能标真实流中断。回答间自然静默不计为回答内候选缺口；没有回答边界不能代填。

## 保守的自动判读规则

这是供统一分析程序采用的规则顺序，不另立线上trace格式。输出应是可并存的**事实标签＋未分辨项**，不能自动选一个根因或给“网络健康/已修复”。先校验来源、时钟/单位、连续覆盖与回答边界，再应用以下规则；缺省均为unknown。

| 条件 | 可输出的事实标签/结论 | 禁止推断 |
| --- | --- | --- |
| 用户本轮没有听到问题或标记未知 | `未复现`或`主观症状未知`；可保留实际观察到的事件。 | 不判测试通过/故障已消失，不追加一轮测试。 |
| Inspector见STT，用户粗标此段沉默 | `识别事件与自报沉默同窗`；继续对照aborted/实际停顿顺序。 | 不判“已证实自回声”；没有正文比对/声学因果证据。 |
| Inspector见`tts.stop`且aborted=true | `上游协议中止已见`。 | 不等于观测到本地player.stop或硬件停声，更不能把终止源归给网络。 |
| 仅见普通`tts.stop`，aborted=false | `正常回答结束事件已见`。 | 当前桥接normal stop会flush/drain，不作为强制清空。 |
| 同一回答内连续无省略的局部窗口中binary显示长间隔/随后集中到达 | `客户端可见下行间隔变化`，列实际时长、精度及bytes条件。 | 不设“超过100ms一定卡顿”的阈值，不判PCM已丢、queue已耗尽或跨境原因。先前已储备音频可能足够。 |
| Inspector没有stop事件 | `协议窗口未见所列stop`（仅该局部窗口连续覆盖时可这样说）；否则`协议事件覆盖不足`。 | **始终不能由此断言无本地stop/context变化或queue耗尽**；当前生产没有可读player observer。 |
| 未来经批准的完整player观察：前后schedule确属同回答，计划gap超过浮点比较容差，相关窗口context持续running，且没有显式stop/reset，回答边界完整 | `同回答计划供给缺口`；列gap/queue与输入回调。排除回答首次schedule引用旧nextTime而得到的轮间gap。 | 不是硬件underrun计数；网络、provider、Worker派发和主线程仍不可辨。任何覆盖条件不足则只报`观察到计划gap，来源不完整`。 |
| 未来player观察中有`stop(reason)`或context非running | 分别报`本地显式停止已见`、`context状态变化已见`；与gap标签并列。 | 不让先后一个事件覆盖另一个事件；状态变化不等于测得实际声卡停声时刻。 |
| 未来完整player观察在主观停顿范围内计划连续/供给足够 | `该范围未见计划供给缺口`，继续查内容静默/render/output。 | 不判实际音频正常、PCM波形无问题或网络全程健康。 |
| 未来同会话Worker观察已出现长回调间隔 | `缺口在Worker观察点已可见`。 | 不只归到provider生成或上游网络；Worker自身派发、双向上行/MCP依赖均保留。 |

“无显式stop而queue耗尽”是需要完整应用观测才能判的组合，**此次Inspector-only做不到**。网络binary到达不是enqueue、schedule或硬件出声；enqueue又包含主线程等候。不同主机时钟不能直接相减。两段WS与Worker派发的不可辨性在任何输出中保留，不能用前轮Mac离线结果、iPad合成音RMS或CF-Ray后缀填补。

未来复用player observer还有两个回答边界细节：normal `answer:stop`之后仍可能flush并产生该回答短尾schedule；不能在stop处直接截断。新回答到来时桥接先报`answer:start`，再可能报`stop:new-answer`清旧回答残余；不能把最近start之后所有stop一律归给新回答。仅事件采样时state=running也不证明整个间隔持续running，缺状态覆盖必须保留未知。

## 可直接复用的fake反例与预期标签

以下均直接引用3040已有结果；不新增用户矩阵、样本采集或另起fake服务。

| 既有case / 结果 | 自动判读应保留的反例 |
| --- | --- |
| `constant-extra-500ms`：首计划596ms、gap0；`steady-20ms`：96ms、gap0。 | 固定增加时延不必产生句中gap；不能从初始化慢推连续播放原因。 |
| `100ms-batches-same-average-rate`：最大enqueue间隔100ms、gap0。 | 长包间隔不必耗尽buffer；不能用100ms阈值直接判卡顿。 |
| `delivery-hold-600-to-900ms-then-catch-up`与`steady-network-main-thread-blocked-600-to-900ms`：最大enqueue间隔均320ms、计划gap均220ms。 | 相同客户端/排程统计来自两种机制；自动规则必须输出不可辨，不能给网络/主线程单因标签。 |
| `source-pause-300ms-no-catch-up`：最大enqueue间隔320ms、gap300ms。 | 同样最大入队间隔下，后续供给节奏不同，gap也不同；最大值不是充分的缓冲/路由调参依据。 |
| `20ms-audio-every-25ms`：4次gap、总455ms。 | 持续供给低于消耗；有限buffer不能无限补偿。fake结果不标为真实provider速率。 |

自动实现前还应保留的负例（规则要求，未声称新增自动化已执行）：Inspector-only无stop→本地停止未知；跨回答gap→不计同回答缺口；截断窗口→缺失事件未知；STT/aborted与gap同窗→并列标签；context暂停→不以冻结audioTime计算墙钟gap；用户未复现→不判通过。由统一负责人决定未来是否需要把这些规则写进共享离线分析器，避免两套schema/collector。

已有9组fake均为单回答、context始终running、无显式stop；不覆盖上述跨回答/缺事件/中止/context状态负例，也不声称已验证一个完整诊断器。源hash在JSON中，前轮Node24.22.1独立复验深度一致；本次仅引用，不重复跑未变的矩阵。

## 不足时的唯一最小增补提案

若这一次Inspector证据不足，先分析已有信息再提出**同一份**opt-in方案。播放连续性仅请求复用现有`onPlayback`的answer/schedule/buffer/stop/context字段，加统一本地相对时钟、完整/截断标记及相应下行bytes摘要；必要时用可用的主线程迟滞信息解释回调间隔。和Safari需要的STT/aborted/stop共用同一窗口/记录器，不再重复采集RMS或正文，不新增另一次付费会话。

这仍是待批准的产品变更：没有实施共享hook、采集入口或Worker事件。单次Inspector缺数据不会自动授权追踪器，也不直接升级成Worker逐帧日志。若未来要分两段传输，另审同会话序号/bytes与各端I/O时序的最小范围及保留政策；没有provider发出时序/Worker运行证据就继续保留不可辨。

本增量只做文档/规则审查，不重复执行与其源码hash未变的9组离线脚本；无新服务、端口、tab、provider/mic/WS/录音、clipboard、云API、main集成/push/deploy或账户操作。提交后的具体SHA/clean回执通过共同负责人整批handoff；3040保持原样，root已审通过并hold下一正常归档。
