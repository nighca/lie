# 单次语音180秒限制：现状与选择

2026-10-30（Asia/Shanghai）实施前调查快照。用户随后明确选择方案B并批准默认10分钟（600秒），计时仍包含准备阶段；见[实施与验证](implementation.md)。本文保留原始比较和未选择方案，不代表仍待选择或其他方案已获实施授权。源码基线 `60c11f72b71ead4b8e744f2281d5dbecb796d11a`，专用分支 `codex/lie-voice-session-limit`，worktree `/Users/nighca/.codex/worktrees/lie-voice-session-limit/lie`。本任务与播放器流畅性修复分离，不依赖、改写或提交其工作树/commits。中央project-plan/development由总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 统一维护。

## 结论

180秒来自项目网关的单连接定时关闭，不能解释为已查明的供应商或Cloudflare硬性3分钟要求；也不等于每局共享询问预算。当前持续讲话也会到点断开，沉默不暂停网关计时，消息不会续期。提前结束/断网/切人后新建连接又得到独立180秒，所以它只是每连接有界保护，**不是账号、访客、游戏或全球费用封顶**。

建议用户先在“保留一个可配置的服务端连接保护上限”与“明确取消该固定墙钟保护”之间作产品/运营选择。工程最小推荐是将服务端保护上限配置化、独立于客户端玩法额度；具体数值、是否保留上限、UGC是否需要业务时长范围必须由用户决定，本报告不预定分钟数。单纯沿用默认180秒不会解决当前连续对话被截断的问题；配置化本身也不是已实施修复。

## 当前代码证据

以下行号均相对上述基线；链接便于审查，行号以表内为准。

| 来源 | 已核实行为 |
| --- | --- |
| [gateway/src/index.ts](../../apps/gateway/src/index.ts) 46–78、82–109 | 上游fetch先有10秒Abort；取得upstream WebSocket后调用relaySockets。后者第84行启动180000ms timer，早于accept/返回浏览器101。到期finish(1000, Conversation time limit)关闭两端；这是业务源码常量。 |
| 同文件85–105 | finish幂等并clearTimeout；一端close/error、发送失败、帧超过65536bytes均统一关闭两端；正常双向消息只透传，不刷新timer。代码调用close不代表TCP关闭/供应商结算在同一瞬间完成。 |
| [controller.ts](../../apps/web/src/application/controller.ts) 97–141、163–203 | connection.open成功且仍current之后才设置enabledAt，按单调时间累计；准备期间不扣玩法预算。timer最多250ms一段刷新，事件/操作前还检查到期。停止时结算，归零关闭当前语音并打开指认，不自动判负。 |
| 同文件109–121、246–288 | 所有停止入口统一abort/connection.close，清timer并保留已经显示的历史；切人物不重置共享额度。当前active切人会关闭旧连接并自动启动新人连接，旧提案“切人一律手动再开”不能覆盖现实现。停止态切人不自动启动。重开新局恢复额度。 |
| [liveVoice.ts](../../apps/web/src/application/liveVoice.ts) 128–147、176–205 | open等待播放resume/channel.open/mic三者；闭连事件交controller处理。close停止采集、channel、player、播放context；迟到mic grant另被关闭。网关timer可能已在等mic权限/hello/工具准备时消耗。 |
| [channel.ts](../../packages/voice/src/channel.ts) 82–110、238–256 | WebSocket onclose映射closed事件；closed终止socket callbacks和未完成工具。hello/工具发现有本地10秒握手窗口（独立于上游fetch的10秒）。通道没有自动重连。 |
| [microphone.ts](../../packages/voice/src/microphone.ts) 55–70 | 停止时移除worklet消息、disconnect、stop全部tracks并close收音context；这不是关闭回调必达或硬件即时停止的实测证明。 |
| [Application.vue](../../apps/web/src/Application.vue) 37–65、160–162；[navigationLifecycle.ts](../../apps/web/src/application/navigationLifecycle.ts) 3–30 | 实际挂接的是navigationLifecycle：hidden结束当前语音，pagehide丢弃controller，persisted pageshow重新load；路由fullPath更新先discard；组件卸载清理。beforeunload取消离开不应停语音。旧独立pageLifecycle helper不是生产挂接依据。 |

因此，正常前端单连接实际可用时长近似受`min(网关剩余保护时长, 本局剩余询问时长, provider/网络寿命)`约束；准备耗掉多少网关时间会随权限与握手而变，不能将180秒当作保证完整180秒可问。网关close原因未在现ConversationEvent中保留，controller显示通用“语音暂时中断，可重新开始”；当前没有专门的3分钟提示或透明续接。

[四份官方JSON](../../content/games/) 的interrogationLimitSeconds分别480/600/540/480（各第5行），都大于180。其含义是跨人物、多次连接累计的玩法启用时间，包括静默、等待和回答，非实际发声秒数。手动停止、断线重连不恢复已用预算，重新开始整局则恢复。

## UGC、分享与数值边界

- [Editor.vue](../../apps/web/src/editor/Editor.vue) 43、170：5/8/10分钟只是快捷按钮，自定义输入没有max；转换为四舍五入的整数秒。默认新草稿600秒见[draft.ts](../../apps/web/src/editor/draft.ts)19。
- draft.ts53/66–74及[content.ts](../../packages/game-core/src/content.ts)72–75：可玩内容只要求正safe integer秒；保存草稿另拒绝非finite，没有合理最大分钟数。分享[share.ts](../../apps/web/src/editor/share.ts)5–6、37–58限制URL字符/内容bytes并调用同一validateGame，未加时长cap。很大的整数只占很短文本，压缩长度限制不能代替时长保护。
- 秒为safe integer不保证乘1000后毫秒仍为safe integer。当前core [session.ts](../../packages/game-core/src/session.ts)123–137直接相乘；超过`floor(Number.MAX_SAFE_INTEGER / 1000)`秒就越过毫秒安全整数范围。现controller每次tick≤250ms，所以**当前没有把这个巨大值直接塞进一次超长setTimeout**；不应误报为当前timer溢出复现。
- 若新方案将客户端剩余秒数直接变成网关定时器，会同时引入客户端可伪造、数值精度、宿主timer范围问题。Web timers通常上限2147483647ms（约24.9天），过大值存在溢出风险；Node具体超大delay行为不是Worker global timer的自动保证。实现时须在服务端校验有限、正、安全整数且在已批准的合理上界内，或以deadline分段定时并重核；不能靠传一个“极大值”代表无限。若选择无固定cap，应明确不建该timer，而不是用Infinity/0/负数编码。
- 为所有UGC新增产品级时长上限会改变编辑器、已有草稿、分享和内容校验契约，需用户确认，不在本次调查中偷偷修正core范围。

## 历史决定的证据等级

| 文档与日期 | 证据能支持什么 | 不能升级成什么 |
| --- | --- | --- |
| [voice-conversation-proposal.md](../voice-conversation-proposal.md)66–68，2026-10-23 | 明确记录用户同意先验证再实施；3分钟只作为能力实验约束，正式单次上限待定。 | 不是正式体验永久180秒的批准。 |
| [architecture.md](../architecture.md)137–141，2026-10-24 | 后续架构记录真人多轮可用并允许接入；同段陈述仍保留每连接3分钟，与共享额度不同。 | 这是repo中的批准/实现摘要，未找到在这份文档中单独、明确选定“正式产品上限恰好180秒”的原始用户答复。不能仅凭章节标题替代正式上限决策证据。 |
| [interrogation-budget-proposal.md](../interrogation-budget-proposal.md)3、9–16、28–34，2026-10-24 | 记录已选语音启用时间、含等待静默、准备不扣；内容作者自定时长。 | 游戏预算批准不自动批准把网关改成480/600秒。其旧错误指认建议不覆盖最新终局规则。 |
| [public-voice-launch-proposal.md](../public-voice-launch-proposal.md)3–9、48–55 | 公开语音方案将3分钟列为现存保护，明确多连接和费用不受此封顶；文件自身是归档/待后评估方案。 | 不是额外认证、限频、device分配或预算系统的实施授权。 |
| [invite-access-design.md](../invite-access-design.md)3、7、11–21、86、117及[专项交接](../history/2026-10-25/invite-specialist-chat-handoff.md)10，2026-10-25 | 邀请方案曾确认到期只拦新WS，已连沿用既有180秒；随后明确暂停实施。 | 证明后续设计依赖该现存边界，但不能把暂停的邀请码设计当现行访问保护，或新正式上限批准；若以后恢复邀请码且移除cap，旧连接可能跨邀请码到期无限延续，必须重审。 |

搜索当前docs及相关历史关键词并检查上述文件git历史，没有发现更新的、可独立确认正式上限数值的用户决定。结论限于本次读取到的repo材料，不代表所有旧聊天均已穷尽检索。

## 官方平台资料

全部只读公开页面，读取日期2026-10-30；qiniu AI API docs工具尝试返回not available，无法证明覆盖Linx xrobot，故使用官方linx.qiniu.com资料。不访问控制台、账号、当前device/agent配置或真实账单。

| 官方来源与定位 | 明说的内容 / 本轮判断边界 |
| --- | --- |
| [Linx WebSocket协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)，通信流程、响应验证、关闭连接、鉴权（读取行55–61、168附近、步骤5、错误处理） | 握手hello有默认10秒等待；端或服务可关连接，token无效/过期也可导致断连。没有在所读协议中找到“单连接总时长180秒”或“活跃会话无限持续”的保证。独立WS拥有会话过程不证明固定device多连接隔离/并发能力。 |
| [Linx智能体配置](https://linx.qiniu.com/docs/xrobot/guide/agent-config#_8-1-空闲超时)，8.1（读取行372–378） | 空闲断连可设60–3600秒，初始UI值120秒；判断还考虑音频等活动，不是只从上一句话结束精确倒计时。这是空闲限制，不是总连接寿命；未读取应用实际值。持续发送静音PCM不等于能保证其永不空闲断开。 |
| [Linx智能体API](https://linx.qiniu.com/docs/xrobot/api/agent)，更新智能体extra.goodbye（读取行490–514） | idle_timeout_seconds有同一范围。没有因此得到当前生产配置，也没有获权修改共享agent。 |
| [Linx资源包扣减规则](https://linx.qiniu.com/docs/xrobot/billing/resource-usage-billing)，快速了解、计时系数、余额结算（读取行22–48、95–116、139–151） | 适用UID小时资源包时按连接会话时长乘（1＋大模型计时系数＋音色计时系数）计扣，含非发声时段；用量可延迟聚合，余额不足时可能结束会话。**没有核实本项目SKU、其他额度优先级、系数和硬止付行为，不能推算当前真实账单或金额封顶。** |
| [Workers limits](https://developers.cloudflare.com/workers/platform/limits/#duration)，Duration/Runtime updates（读取行708–725） | HTTP触发无固定wall-clock duration cap，活跃连接可继续；runtime更新/压力等仍会结束连接。CPU执行限制和连接墙钟不是同一量，未见Cloudflare统一180秒要求，也不能因此承诺长连接永不掉线。 |
| [Cloudflare Network WebSockets](https://developers.cloudflare.com/network/websockets/)，Connection limits / Idle timeout | 无双向数据一段时间会关连接，公开页未在该段给通用具体秒数；建议适当心跳。它是网络层idle，不能当Linx语义idle配置；不用猜值，也不借此给LIE新增心跳。 |
| [Workers Web standards](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)，Timers；[Performance/timers](https://developers.cloudflare.com/workers/runtime-apis/performance/) | Worker global timers采用Web API，时间测量有I/O精度边界；不能以本地Node假时钟证明生产计时精确度。[MDN delay限制](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value)支持对任意长timer显式设界，不能代替workerd/生产验证。 |

付费风险应按真实产品计费确认，不能沿用旧方案笼统只按“ASR/TTS/LLM发声量”估算。当前gateway每新WS生成random Client-Id，但所有连接使用配置中的同一个Device-Id/Agent-ID/token（index.ts57–61）；应用没有每访客独立device或消费账本。UID资源包规则也不是“每位访客拥有独立额度”，provider可能还有其他额度优先，未验证。

## 直接WebSocket与费用边界

现WS仅检查准确Origin/空query/凭据存在（gateway47–52），应用鉴权暂停。普通网页JavaScript不能随意伪造Origin，但同源用户可跳过游戏controller直接连接并发送协议；外部客户端可自设Origin，故Origin不是身份验证。服务器不收可信gameId/remaining预算，也不校验案件状态。64KiB只限制单帧，不限总帧/连接数/累计时长。

因此取消180秒后，诚实正常前端仍会按本局额度关闭；绕过客户端、后台事件未达或异常存活的连接不再受此服务端墙钟约束。即使保留有限cap，反复/并行建立连接仍绕过累计消费控制。仅把客户端budget签名回传也不自动解决跨重连累积，真正可信的按人/按局额度需服务端授权、消费记录/防重放及计费口径，属于新架构/资源决策。

## 方案比较

| 方案 | 体验与最小变化 | 仍需接受的边界 |
| --- | --- | --- |
| A 取消本项目固定连接墙钟 | 删除/禁用此timer，保留finish幂等、早关/error/帧限制；正常前端由共享询问额度停止。 | 最少代码，不再在180秒硬截；无服务端连接寿命兜底，provider/网络仍可能早断。不能宣称成本安全或无限会话保证。若用户明确接受，此路线可单独实现，不顺带新增预算系统。 |
| B 服务端连接cap配置化并选择更合适值（工程最小推荐） | 只让部署方设置有限总连接寿命；默认/目标值用户决定，校验数值范围，不让请求控制。仍从relay创建计时，语义清楚。 | 只是推迟而非消除固定截断；配置值不足时仍打断回答，UGC可超出。若要覆盖最长官方局的一次不切人对话，值必须考虑600秒玩法预算与有限准备余量，但这不是本报告替用户选值。每次重连仍新cap。 |
| C 按客户端remaining决定连接寿命 | 可令诚实前端表现接近当前局剩余量。 | 服务器不能信任客户端值；目前无可信server session且WS禁止query，增加该参数不是只换常量。钳到server cap仍只是B的客户端建议，不能当硬费用隔离。UGC无限大正整数、毫秒精度和timer范围必须明确。若签名官方内容上限，分享/编辑器仍需另一可信策略。 |
| D 从ready/首帧才启动cap、或改闲置timeout | 减少准备消耗，或只在真正闲置时停止。 | ready在浏览器、服务器需新的可验证协议/握手阶段deadline；客户端可拖延ready，不能无界免计。把每条消息视为活跃会被静音PCM保活，不能直接等同用户在交流。改变计时口径/idle定义需另确认与验证，不是同一常量的简单修补。 |

推荐不要把玩法预算迁入薄网关，亦不为一次3分钟问题先引入DO/账号/数据库。用户若目标是不再被任何固定墙钟打断，B不能假装满足目标，应选择A并明确接受少一个服务端保护；用户若希望保留异常连接兜底，B是最小独立调整。保持手动重连、人物隔离、可见性停止，不以自动重连隐藏问题或重放PCM。

## 用户需决定

1. 要取消固定连接墙钟，还是保留一个可配置的服务端cap？保留时需批准具体值及是否包括准备期；也需接受任意长UGC可能超过它。若要求所有UGC一次聊完，则要另外决定是否限制作者可设的时长，不能默认加上。现180秒在决定前保持不变。
2. 这次只改善正常玩家体验并接受现有公开访问风险，还是要求可信的累计/全球费用硬封顶？后者要另立范围，不能用本次时长调整冒充。无需因本调查重开已暂停的邀请码方案。

## 检查与后续验证

本轮直接读取固定基线relay函数，使用Node内置stripTypeScriptTypes去掉类型后在VM注入假socket/假clock；未重写逻辑。见[probe](relay-clock-probe.cjs)及[results](relay-clock-results.json)：179999ms不关、180000ms关、临界前消息不续期、双端关闭幂等/late丢弃、早关清timer、两个relay隔离均有断言，已通过。Node24.17.0低于应用要求，仅用于这个无依赖只读探针；有experimental strip warning，未用此冒充应用标准环境/真实workerd测试。没有真实等待180秒。

现有gateway tests覆盖双向文本/二进制、上游主动close、帧上限和握手拒绝；未见180秒timer的专门既有测试。本轮没有安装依赖/跑应用套件/启动服务。现有controller测试230–245/248–328覆盖预算、准备不扣、断开/hidden/到期；navigation tests147–200覆盖实际App生命周期，属于源码已审的既有测试，未重新执行，不作为本轮实测声明。

待路线获批后：用fake clock验证保留/取消timer、配置非法值、边界前后、消息不续期或明确的新idle语义、早关与竞态、独立连接、无残留timer；controller覆盖180秒后继续与最终玩法预算归零、断线保留历史、准备晚到/切人隔离；UGC大值与分享契约另测。workerd/浏览器可用假上游验证超时close一路释放mic/player而无真实推理；真人长会话、provider idle、账单/结算和手机后台可靠性另需明确受控窗口，不用fake证明这些。超时关闭与网络中断可能同时发生，应只清理一次，且不能丢已显示转写。

本轮文档链接/JSON/脚本语法/whitespace检查完成；生产源码、配置、凭据、资源、中央plan均未改，无服务/PID/浏览器/mic/provider、commit、main整合或push。临时验证未使用/tmp或主目录；运行只在本新WT，唯一新增可审产物为本目录三文件。交专项审查，再由总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 独占集成/push；方案无实施授权。

专项 root 已审查全文、相关源码与 probe，并独立重放 probe，结果/source hash 与归档 JSON 相同；同时重新读取官方空闲配置、计费规则与 Workers duration 文档，核对边界。计费公式明确含基础倍率 1。本次仍只交付文档与证据，不修改应用限制或供应商配置。
