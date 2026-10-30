# 线上约3分钟语音中断：运行证据与下一步

最新用户事实与决定（2026-10-30）：用户已亲自确认Workers为Free，CPU time limit未显示，有效数值仍未知；随后明确选择Paid，并表示会在控制台手动开通，尚未报告完成或核实生效。见[两路线比较、费用与后续验证](cpu-options.md)。未修改套餐/配置或创建真实语音流量；此前[API结果](settings-evidence.json)保留历史状态，不从缺字段/2019ms推定限额。

2026-10-30只读调查；专用WT `/Users/nighca/.codex/worktrees/lie-voice-disconnect-investigation/lie`，branch `codex/lie-voice-disconnect-investigation`，调查起点与执行者冻结交付时HEAD为 `95cb5cf02277a5c3f380d0a18158d3672a9bfcdd`，初始clean。此交付只新增本目录，未修改应用、CPU/会话配置、账号、provider或中央计划；专项root审查后保存任务分支文档提交，不操作main/push。

**已确认所查反馈窗口中正确Worker版本的两次语音请求因CPU超限结束。** 其实际部署模块与绑定均为600秒，不是仅凭CI/CD成功推断。尚未把请求组归属到该用户，也未验证真实连接持续600秒；有效Workers订阅档位/CPU配额仍缺明确证据，不能由2019ms观测反推“配置就是2000ms”。

## 用户现象与证据

用户描述全程持续问答，8分钟游戏余05:01时中断，约179秒已启用询问；提示为“语音暂时中断。已显示转写保留，你可以重新开始对话”。总协调给出的定位窗口约11:20–11:35UTC。该提示由[controller.ts](../../apps/web/src/application/controller.ts)153–158同时处理closed/error，不是某个close code或某个主动端的唯一标识。

通过现有cf内部登录态、锁定beta18执行只读查询；原始响应只在内存解析，仅保留[脱敏运行证据](runtime-evidence.json)：

| 核查 | 事实/边界 |
| --- | --- |
| cf workers deployments list --worker lie-game | 11:12:48.069595Z部署597aa83d-8b31-4564-a7f4-c16e2345d872，100%流量，标记Verified CI build95cb；未见混合版本。前一a742于09:12:24Z部署。 |
| cf workers get lie-game | 同CLI选定账号下的lie-game包含lie.agency custom-domain reference，logs persisted/enabled，query redaction开启。没有把其他同名账号Worker混用。 |
| cf workers versions get597… --worker-id lie-game --include modules | 该显式版本env与binding的VOICE_MAX_SESSION_SECONDS均plain_text600，usage_model standard；响应没有limits字段，不等于已测有效CPU配额。 |
| 实际下载index.js | 5572bytes，SHA256 `ddfc474059891e3d06da989dc500b56a1a23aa07aa54bfd98af2f26b4cbc85f1`。parser默认600，解析值传relay，timer为sessionLimitSeconds×1000；无180000/180e3。完整相关代码行保存在证据JSON中，无secret值。 |
| 固定窗口、scriptName=lie-game、request.path=/api/voice的o11y查询 | events有8条异常，invocations去重后是**2个request groups**，每组4条异常＋1条terminal记录。它们的实际request URL仅在内存比对，均匹配lie.agency/api/voice，version均为上述597。8条不是8个独立连接。 |

| 人工组号（非会话ID） | 原始记录timestamp(ms)/UTC | outcome | CPU(ms) | wall(ms) |
| --- | --- | --- | --- | --- |
| group-1 | 1793359711884 / 11:28:31.884Z | exceededCpu | 2019 | 182022 |
| group-2 | 1793359441859 / 11:24:01.859Z | exceededCpu | 2019 | 204331 |

保留的是API记录时间戳，不擅自把它换算为用户精确点击/断线时刻。约182秒墙钟与用户约179秒启用询问相近，且准备期可占差额，但本轮没有采集关联用户/会话ID，不能宣称已严格一一对应。terminal outcome和CPU/wall数值是实际平台记录，不是fake测量。CPU2019ms与墙钟182/204秒是不同量，不能称“CPU限额3分钟”。

## 已缩小与尚未证实的原因

- 当前绑定与部署代码已经600；对这些实际落在当前版本的voice异常，旧180秒timer、错误Worker或前端缓存不能解释已有exceededCpu。未枚举全部zone更具体routes：beta18搜索/已安装命令未暴露classic Workers routes/settings独立读取入口；已有domain reference和实际请求version匹配比只看静态产物更强，但不泛化为所有访客路径绝无其他route。
- 上一600版a742自09:12Z已存在，原180版更早；用户反馈在本次11:12发布约十多分钟后。普通旧180/600连接跨部署不是当前首要解释，仍不凭部署本身保证任何连接不中断。
- [gateway/index.ts](../../apps/gateway/src/index.ts)90–116逐消息执行JS转发、字符串帧UTF-8计长，并处理关闭/错误/64KiB界限；即使是薄网关也消耗CPU。没有profile，不能将2019ms归因于TextEncoder某一行，也不推定WebSocket每条消息会重置CPU预算。不能靠微调TextEncoder宣称已支持600秒。
- [controller.ts](../../apps/web/src/application/controller.ts)97–141按ready后共享游戏额度计时，准备不扣；用户剩05:01削弱预算归零解释。正常hidden/pagehide、协议错误、player30秒overflow/播放异常等也能结束客户端，尚无本用户close/error元数据证明完全排除；它们本身不解释已查到的Worker exceededCpu。
- provider的总会话上限、语义idle、退出意图、共享Device-Id并发冲突/鉴权也未读账号配置。官方协议没有在本轮所读段给出活跃会话180秒总上限；持续问答削弱长静默idle解释，却不能代替provider配置或close证据。当前gateway所有访客共用配置Device-Id/Agent-ID，每连接随机Client-Id不证明隔离；本轮不读取其secret值或进入控制台。
- relay的finish本身没有正常close来源/elapsed日志；channel保留code/reason，但[桥接层](../../apps/web/src/application/liveVoice.ts)只向controller送通用closed/error，生产DEV collector关闭。因此尚无浏览器实际close code/raw reason/主动端的证据。Worker CPU被平台终止时也不保证应用finish能执行，不能以缺少finish日志否定CPU原因。

## 官方资料与运行配额边界

以下均2026-10-30读取，只用官方公开资料：

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)明确CPU与等网络的墙钟不同，CPU超限记录outcome为exceededCpu；公开Free每HTTP请求10ms，Paid默认30000ms、可配置至300000ms。HTTP无固定墙钟总时长不代表不受CPU、内存或运行时更新影响。当前版本standard/没有limits字段均不足以确认实际付费档位/有效CPU限额；不将两次2019当作某个配置上限证明。
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)将WebSocket初始Upgrade作为请求、消息不另算请求；这不单独证明CPU在哪个回调重置。当前CLI订阅查询没有得到明确可识别的Workers档位，**未找到Paid项不等于已确认Free**，也不读取价格、账单、支付细节。
- [CPU/heap生产profile指南](https://developers.cloudflare.com/workers/observability/profiling-in-production/)要求选中实际运行版本并有期间流量；支持1–50秒capture，输出pprof。当前无capture/流量授权，没有执行profile，也没有借新版latest切换混淆固定597的证据；未来如做需固定实际版本，缺symbols时不能强行映射热点到源码行。
- [Telemetry query API](https://developers.cloudflare.com/api/typescript/resources/workers/subresources/observability/subresources/telemetry/methods/query/)用于固定窗口/字段过滤；CPU/wall字段均毫秒。查询只是读取已有数据，不改observability/账号设置。
- [Linx WebSocket](https://linx.qiniu.com/docs/xrobot/platform/websocket)说明双向会话和端/服务关闭；[智能体对话空闲](https://linx.qiniu.com/docs/xrobot/guide/agent-config#_8-1-空闲超时)可配60–3600秒，页面初始120秒且判断考虑音频活动；它不是本生产当前值或活跃总时长保证。[Cloudflare网络WebSocket](https://developers.cloudflare.com/network/websockets/#technical-note)也有idle/重启边界，不能据此给用户此次断连套用固定秒数。

## 最小下一步与需确认事项

总协调可直接问用户这一项事实：**“请看Cloudflare的Workers & Pages：Workers订阅是Free还是Paid，以及lie-game显示的CPU time limit是多少？这两项与域名的Free/Pro计划不同。”** 当前CLI缺少明确入口不能当作Free证明，约2秒CPU记录也不能代替这个事实。若用户不便查看，也可明确授权改用cf之外的官方只读API，仅读取该Worker的CPU限额/Workers档位；当前cf约束不允许本任务擅自替换为Wrangler、直接API或其它管理工具。这两条都先取事实、不改套餐或限额。

先处理运行CPU限制证据，保留已批准600秒墙钟上限，不再盲加墙钟。若有效档位/限额需付费升级或提高CPU预算，先说明变化与费用风险并获用户批准；尚未批准任何plan/limit/config操作。账号若本来Paid仍需核实际自定义限制，不机械认定默认30000；dashboard或旧配置曾设较低CPU cap仍是更小的可能，version API没有返回limits不排除它。纯代码优化作为后备，以真实profile/有代表性的离线转发bench支持，不能承诺它足以容纳600秒。

若还需下一次运行观测，最小诊断建议为单条幂等server finish日志：固定枚举来源wall-limit/browser-close/upstream-close/browser-error/upstream-error/send-error/oversize，elapsedMs、configuredSeconds、closeCode和固定reasonCategory；不raw provider reason、URLquery、request/session/device IDs、文本或音频，不逐帧log增加CPU。客户端本地只采固定关闭/协议/播放错误类别、elapsed、code、context state，保留原UI。平台terminal outcome仍必须并查，fatal CPU未必来得及finish。此处只是提案，未改代码或部署。

如用户另批准真实验证，先协调**单连接≤210秒**的持续问答窗口，目标仅越过旧180秒阈值，记录元数据而无audio/转写，准确注明包含准备时间；不自动重连、不并发、不改共享device/agent。此动作会联系真实provider，SKU/计费口径尚未核，不报猜测金额，须先确认成本与窗口。本轮未执行。跨180成功仍不证明完整600秒；后续是否更长验收另定。

## 检查与交付

独立Node24.22.1/npm11.19.1，pinned cf1.0.0-beta.18，独立npm ci成功；工具链只读复用旧路径，node_modules未复制/链接。缓存、安装日志及TMPDIR全部在本WT ignored tmp/voice-disconnect。应用/配置未改，无需应用全套测试。

[最小探针](deployed-relay-probe.cjs)显式经cf读取固定597模块、在内存用AST提取真实relay，不重写其逻辑；fake socket/clock验证179999/180000/599999不关，600000关，早关清timer、late丢弃与幂等。见[结果](deployed-relay-results.json)，hash与实际下载模块一致。该结果不模拟Workers CPU执行上限，也不证明真实长连接。

文档链接、JSON、探针、git diff --check及scope检查通过。没有任何服务/browser/mic/付费provider连接、profile会话或部署；5176用户consumer、未分配5544、8787/8788均未碰。旧WT/commits、session-limit/播放器报告和中央docs不变。

隐私边界：未读凭据文件/token，未落地原始API响应/日志或secret值；API内存响应只投影必要数据。首轮invocations字典key意外进入工具结构显示及临时投影的技术requestID已从临时落地投影移除；入库只人工group序号，不保留这些ID、账号/zone ID、账单字段、headers/URLquery/PCM/转写。账号/Worker/version选择由同一cf内部登录完成，官方查询命令先经search/schema/help/dry-run核验。

## 专项 root 复核与版本更新

专项 root 已完整审查本报告、脱敏JSON和探针，给探针补充了在执行AST提取逻辑前核对远程模块字节数/完整SHA256的断言。随后通过现有cf只读重新取得固定597版本，独立重放假时钟探针，与归档结果完全相同；另外独立查询相同历史窗口的invocations，按人工组序号投影后确认两组version/route均匹配、各有一条CPU终态、CPU均2019ms、wallTime为182022/204331ms。没有输出或保留用户/request IDs、音频、转写、凭据或支付值。

后续总协调通知：纯前端页面版本标识已随main `0d753ec74c03b9d35ae8505942ab56a5f02fa651` 发布，新Worker版本`61a449e7-7997-4b33-8e34-295a02bd138a`，北京时间2026-10-30 19:50:56；gateway、voice、lock/workflow相对95cb无差异，未改CPU/套餐/limits/provider。本报告的597部署快照与11:20–11:35UTC日志仍是固定历史证据，不代表后续latest版本，也不因新前端发布失效。首页hash不能当网关连接关联ID或CPU问题已修证明；此版本更新来自总协调回执，本专项未重复部署验证。

本轮只归档调查，不修应用或调整资源。总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 独占后续用户决定、审查、集成与push。

## 2026-10-30补充：获准官方只读API后的结果

用户随后明确允许cf缺入口的两项使用Cloudflare官方只读API：只查Workers订阅Free/Paid及lie-game有效CPU limit。基于已归档commit `6ac389a6392df9045ff646f6b23e70d246c13e3c`追加本节，不改历史597模块/日志/探针证据；这次例外不授权更改CPU、套餐、权限、provider或创建真实连接/profile。

官方Cloudflare connector已内部认证成功，明确选择与既有cf一致的账号，无凭据文件读取、token导出、手动HTTP认证header或新登录。先用官方OpenAPI确认必要GET的schema再执行，在工具内部只投影允许字段。完整最小结果见[settings-evidence.json](settings-evidence.json)：

| 读取 | 时间UTC与结果 | 能确认/不能确认 |
| --- | --- | --- |
| GET /accounts/{account_id}/workers/scripts/lie-game/settings | 11:59:59.791Z成功；limits不存在，limits.cpu_ms不存在 | schema明确cpu_ms可为毫秒整数；实际响应未提供，不能补默认或据此排除dashboard/旧配置的低限额。有效CPU limit仍未知。 |
| GET /accounts/{account_id}/entitlements | 12:00:19.641Z成功；仅Workers CPU/plan相关键的投影为空 | 没有得到明确档位/CPU配额；空结果不是Free证明。 |
| GET /accounts/{account_id}/subscriptions | 至12:02:16Z前完成；HTTP403，10000 Authentication error | connector明确当前OAuth不能使用此接口，需带Billing Read/Write的API token。本任务不索要secret、不扩大权限，不再扫描其他账户产品或账单。Workers Free/Paid仍未知。 |

这次通过现有cf CLI另核当前部署：lie-game的100%流量版本为`61a449e7-7997-4b33-8e34-295a02bd138a`，11:50:55.080093Z创建，标记git `0d753ec74c03b9d35ae8505942ab56a5f02fa651`，同一账号/Worker及lie.agency映射。settings响应自身没有version字段，因此上述版本为cf随后核实的上下文，不伪称原子一致快照；此前597/11:20–11:35UTC exceededCpu证据仍保持原历史身份。

**两项仍准确未知，而非已确认Free或CPU=2000/默认值。** 目前最小剩余事实仍是用户在Workers & Pages看Workers订阅Free/Paid，以及lie-game实际CPU time limit；它们与域名Free/Pro不同。已Paid但dashboard/旧配置设低CPU仍可能，不直接推荐升级套餐。确认事实后才决定是否需要配置修复及额外预算授权；不继续增加600秒墙钟、不以缺字段或2019ms观测猜配额。

本增量只有本节及settings-evidence.json。JSON/链接/隐私字段/范围和git diff --check通过；无应用改动，无需重跑应用套件或历史探针。没有账号/配置/部署/权限变更、服务、浏览器、语音推理或profile流量。认证被拒绝只限制订阅读取，不曾尝试绕过；历史已通过的应用与运行探针结果没有改写。

专项 root 已审查本增量的API范围、读取结果与版本上下文，校验JSON和文档链接；固定597模块/历史运行证据/探针与6ac389a逐项无差异。本增量只保存只读结果，不重复运行已通过的应用检查或被拒绝的订阅请求。
