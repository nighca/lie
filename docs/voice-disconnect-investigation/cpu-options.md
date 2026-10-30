# 语音CPU超限：Free优化与Paid路线

2026-10-30调查/提案，公开资料当日重新读取。专用WT `/Users/nighca/.codex/worktrees/lie-voice-cpu-options/lie`，branch `codex/lie-voice-cpu-options`，base与调查起点HEAD为 `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`，初始clean。本轮仅文档与离线可行性探针，不改应用、套餐、CPU/config、provider、部署或中央计划，不创建WS/真实语音/profile/browser/服务，不重复403或扫描账户。

**最新用户报告：已完成Paid升级；随后本人线上再次约2.5分钟中断。窄窗口返回组仍有exceededCpu终态（CPU2050ms、wall157316ms），见[新增调查](post-upgrade-disconnect.md)。有效数值/精确用户归属仍未证实，本专项只读调查、不改设置或代理发起流量。** 用户此前亲自确认升级前Workers订阅为Free，CPU time limit未显示；有效数值仍未知。这是用户事实，不是从API缺字段推断。历史[运行证据](runtime-evidence.json)/[API结果](settings-evidence.json)保持原样，不能把两次CPU2019ms称为Free固定硬上限。

## 推荐与理由

推荐用户已选择的Paid路线：保持现有JS relay和已批准保护，把已证实的运行CPU超限作为首要处理方向。相比为Free更换转发模式，它对现有行为的改动最小，也无需先删600秒服务端cap、64KiB逐帧限制或双端清理。开通后先核实际CPU设置，可合理以Paid默认30000ms作为验证起点；这不是预先断言升级就生效，更不是直接设到最大300000ms。

这条路线仍没有真实600秒保证：用户两次反馈窗口中的平台终态为exceededCpu，但尚无本用户精确会话关联；Paid可能存在既有override，provider idle/余额/共享device冲突、网络、平台重启、客户端错误等仍可断线。600秒计时从relay创建开始，包含准备阶段，不保证“问满600秒”。

## 当前官方限制与计量

[Workers limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)（页面更新2026-10-29，读取2026-10-30）：Free每HTTP请求CPU10ms；Paid默认30000ms，最高300000ms。CPU是执行代码时间，等网络不计；HTTP无固定墙钟上限并不免除CPU/内存和运行时更新边界。isolate偶发超限有弹性，不能依赖这种弹性作为Free长期语音承诺。

[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/#workers)区分WebSocket计费：初始Upgrade按一个请求计，消息不另外按请求计；**这不是CPU免费，也不等于每条消息会重置CPU预算**。本轮所读官方公开说明不足以给普通Worker作后一保证。已有平台invocation记录确实为整组请求报告了2019ms CPU与182022/204331ms wall；不能从它反推平台内部配额阈值或重置实现。本文不混用Durable Objects的消息20:1计费或按消息CPU规则，也不提出DO迁移。

## Paid公开费用边界

以下均来自[官方pricing](https://developers.cloudflare.com/workers/platform/pricing/)，2026-10-30读取的USD标价；**不是此账号真实账单或月总封顶**。

| 项目 | 公开口径 |
| --- | --- |
| Workers Paid最低订阅 | 账号级最低USD5/月，不是lie-game单项目USD5封顶 |
| Workers请求 | 每月含1000万，超额每100万USD0.30 |
| Worker CPU | 每月含3000万CPU-ms，超额每100万CPU-ms USD0.02 |
| 普通Workers duration/egress | 无duration费用；无额外egress/带宽费用，仍有执行/网络等限制 |
| 现已启用的Workers Logs | 当前Paid每月含2000万log events，超额每100万USD0.60；官方注明2026-12-01转用新Observability pricing，届时须重核 |

included额度按账号同类用量共享，账号内其他Workers也会消耗；Pages Functions按Workers计。实际业务量未知，没有从少数日志外推月费，也不把所有流量、所有已用资源都当作只有请求/CPU两项。[Linx计费](https://linx.qiniu.com/docs/xrobot/billing/)独立于Cloudflare；当前SKU/系数未核，连接可影响供应商资源消耗，不能报猜测金额。预算通知只是告警，per-invocation CPU和单连接600秒也不是账号累计消费硬cap；重复/并发连接仍可能增加费用。

## 保Free备选：保留但未选择

| 方案 | 可保留 | 无法现称等价/已解决 |
| --- | --- | --- |
| 小型JS转发优化 | 凭据只在server、Origin/空query、10秒握手、600秒timer、64KiB、幂等双端close均可保留 | 没有热点profile，不知TextEncoder占比；二进制转发当前已经不编码，逐消息JS调度/send仍存在，不能承诺Free撑180/600 |
| 直接返回上游Upgrade response，交原生proxy | HTTP入口检查、server构建provider headers、握手超时/拒绝检查可设计保留 | 改为不经应用逐帧JS后，64KiB guard不会自动保留；600秒可控关闭、应用close/error诊断/清理契约也不能照搬，需独立设计和行为批准 |

[官方WebSocket示例](https://developers.cloudflare.com/workers/examples/websockets/#write-a-websocket-client)区分accept后交JS处理与返回给client。[workerd官方源码](https://github.com/cloudflare/workerd/blob/main/src/workerd/api/web-socket.c%2B%2B)静态读取依据（2026-10-30，main为可变上游，不是本线上二进制实测）：`LegacyWebSocketAdapter::couple`538–550拒绝已经accept的socket用于Response，672–675将coupled对象转为Released；`close`936–939对Released直接返回；660–668说明原生pump可在IoContext消失后继续。因此，**不能用“直接return上游response＋原来的setTimeout(upstream.close)”就声称仍强制600秒**，也不能先accept以保留控制、再返回同socket而假定原生coupling不变。

应用若不接收消息，就没有现有逐帧64KiB拦截；浏览器自检不是服务端替代，不能信任所有客户端，平台自己的大帧界限也不是64KiB。原生传递Close/error不等于保留应用归一化code、双端finish幂等、清timer及固定原因诊断。AbortSignal对已Upgrade流的持续取消等替代机制本轮没有充分API/运行验证，不能当现成600秒保证。保留这些保护若需要新的取消边界/宿主协作，已超出无行为变化的小修；若放弃保护则更需用户明确批准。本轮没有实施或偷偷换架构。

### 仅用于判断局部优化空间的离线探针

[探针](cpu-text-guard-probe.cjs)从本基线源码提取现有size表达式，对一个**未实施**的候选谓词做等价检查：UTF-8每UTF-16 code unit最多3bytes，故短字符串可免编码；必超长者直接拒绝；不确定区间仍精确UTF-8计长，二进制仍按byteLength。覆盖4042个合成/边界/孤立代理项/emoji及二进制case，结果见[JSON](cpu-text-guard-results.json)。

人工混合30000个640-byte二进制＋600个短文本，原表达式600次encode，候选0次；但两者仍处理30600次frame guard。这个配比是合成假设，不是实网流量采样。没有将本机loop耗时当Cloudflare CPU，也没有跑profile/native-proxy或声称可省全请求某个百分比。它只说明局部文本分配可以减少，同时清楚显示大多数二进制JS转发不会因此消失；不足以替代Paid或证明600秒稳定。

## 用户完成Paid后的最小实施与验证

1. 用户已报告在Dashboard手动完成Paid开通；该用户事实与下面的API证据分别记录。当前只读API例外不授权代理升级；不索新Billing token，不扩权限。先只读确认实际Workers Paid生效、目标lie-game和部署版本，以及有效CPU设置；订阅名不代替CPU设置，旧override不假定被升级覆盖。
2. 若合理默认已生效，可以先不改代码验证；这点待核。若确需repository显式配置，在已确认Paid支持且相应配置获准后才考虑本工程`limits.cpuMs: 30000`并正常review/构建/发布，保留600秒绑定和原relay保护。不在Free上先deploy此字段，不机械填300000；升级/配置/真实测试是不同动作。
3. 用户另行批准真实provider成本与窗口后，先**新建一条≤210秒持续问答连接**越过旧180阈值。旧WS不能当作套餐升级生效的验收；不用自动重连/并发。只记录既有平台outcome、CPU-ms、wall-ms、版本和必要本地elapsed/code分类，不保存音频、转写、headers、URLquery或provider IDs。用户实际看到/听到180后正常问答与平台记录一起评估，不能只看HTTP101或success。
4. 初验后如用户再批准，另开单条连接验证配置600秒墙钟及预期close，和前一窗口分开确认费用/共享device资源。当前用户8分钟游戏会先到玩法预算，不能为测试默改预算；可用既有`content/games/02-duck-finale.json:5`的600秒额度案件，从足额新局进入并保持同一人物，准备消耗使网关timer应先于ready后玩法额度到期。仍不保证provider配合持续600秒。
5. 如需严核“relay创建后600秒”的起点与主动方，现有请求wall含上游握手，不能直接等同relay计时。可另批准最小固定枚举finish诊断（limitSeconds/relayElapsedMs/code/source），与平台terminal记录对照；不记录raw reason/用户内容，不逐帧log。若仅有现有元数据，结果只能标记近似请求墙钟，不能假装精确600验收。中断、切人、正常结束、提前关闭和fatal CPU无finish的情况仍应区分。

用户本人约210秒手动窗口已获确认（见下文），实际完成与窗口仍待反馈；代理自动真实窗口、600秒验收及诊断/配置改动均尚未授权执行或完成。用户已报告Paid升级完成，仍需区分有效CPU证据与真实验收；后续保留CPU/费用观察，provider共享device、网络/后台、内存/平台重启、准备期及账号累计费用保护仍是边界。

## 本轮检查与交付

只读源码与最新官方公开资料；Node24.22.1直接运行无依赖离线探针通过，未安装npm依赖。tmp目录仅在本WT ignored tmp/voice-cpu-options，工具链仅只读执行旧路径。文档链接/JSON/源码hash身份、旧证据不变、git diff --check与范围核对通过；纯文档/探针不跑应用全套。除README最新状态、本提案及离线probe/result外无改动；专项root保存文档提交后交唯一总协调审查，本专项不main/push。

首次方案批次（087，用户当时尚未报告升级完成）：专项 root 已审查本提案、原保护边界与离线探针，独立重新读取官方pricing/limits和workerd couple/Released/close相关源码，并独立重放4042项谓词检查及合成调用量计数，结果与归档JSON相同。源网关哈希匹配、历史运行/API证据未变。用户选择Paid仍不等于开通完成；本轮没有替用户执行升级、CPU调整或真实测试。


## 用户报告完成升级后的只读核查与手动试玩

2026-10-30基于已审commit `087d72a2e6e1395231ad52ee15b1bfe8011fee69`追加，只更新当前状态与新证据，旧提交/历史JSON不改。用户报告Paid完成来自总协调转达；不是API由缺少Free条目作出的推断。

[本次证据](post-upgrade-evidence.json)：12:39:00.993Z settings GET成功，但limits/cpu_ms仍不存在，没有插入默认值；12:39:04.659Z相关entitlements仅命中`workers_builds.cpu`，它是构建资源，已从运行CPU/档位结论排除，未将其allocation作为毫秒上限。两项API均内部认证，不读token；未重试已知subscriptions403，也未另扫账单、其它产品或扩大权限。因此：Paid完成是用户事实，API独立档位证据及有效CPU毫秒数仍未知，不能直接写成30000ms生效。

12:39:50.018Z通过既有cf另核同一账号选择/lie-game身份及lie.agency映射，最新部署12:09:28.789204Z创建，版本`380959e2-51b8-489f-b76b-1db289f30cba`占100%，标记git `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`。这是settings随后核的版本上下文，响应自身没有version，不能伪称原子快照。未改CPU/plan/config/provider/权限/部署，未创建WS（含synthetic）、profile、服务或browser，未执行210/600测试。

给用户的最小手动试玩步骤（本专项不代执行）：

1. 开一局全新游戏，选择一位人物，开始**新的**语音连接；记录本地开始时间（含日期、秒和时区，例如北京时间UTC+8）。旧连接不作为升级验收。
2. 保持页面在前台，与同一人物持续正常问答，期间不切人、不主动停再开；先只跨过3分钟，建议约3分30秒后主动结束，不顺带延长成600秒测试。该手动语音仍会使用Linx，费用与Cloudflare套餐独立。
3. 记录是否跨3分钟仍能正常问答。若中断，立即记本地时间/时区和完整UI错误提示；只留这些元数据，不导出音频、转写、请求headers或provider IDs，不自动反复重连。
4. 结束本次连接，回报上述时间、是否中断、UI提示，用于之后按窄窗口查已有平台outcome/CPU/wall/version。单次跨3分钟成功仍不证明600秒或所有设备/并发都稳定。

代理自动发起真实推理或210秒窗口、600秒验收、profile或任何配置调整仍未授权。用户本人手动窗口的确认状态见下段。纯文档增量只做JSON/链接/身份/范围/隐私检查，无需重跑应用套件。cf此次自动生成的账号选择缓存（本轮初始clean、时间与12:39查询吻合）已不读内容地移到本WT ignored tmp；没有遗留未解决的.cloudflare/，也不提交缓存。

用户随后已向总协调确认由本人进行上述单条新连接、同角色约210秒试玩，结束后反馈；实际开始/结束时间尚未提供，不能把确认通知时点当连接起点。本专项代理仍无发起WS/推理/profile/录音授权，不查询新日志，等待总协调传来具体窗口后再另作只读对照。总协调在该用户consumer期间暂停push/deploy，保持main12c/Worker380上下文；本交付不改变它。

后续反馈更新：用户已因中断结束本人连接；[新窄窗口调查](post-upgrade-disconnect.md)记录12c/380匹配组的CPU终态。旧“等待实际窗口”的描述是此前阶段，不能覆盖新报告；本调查WT没有执行额外210/600测试或实现配置变更；显式30000ms配置候选按总协调要求在另一独立WT离线准备，启用/发布仍待用户确认。
