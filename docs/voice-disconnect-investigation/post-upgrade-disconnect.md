# 用户报告升级Paid后再次中断：窄窗口证据

2026-10-30，基于专用WT `lie-voice-cpu-options/lie`、branch `codex/lie-voice-cpu-options`、HEAD `8d6c4b8f38e6358da35d9b21e8dc2f5a25466757`追加。只读调查，无应用/套餐/CPU/config/provider/权限/部署改动，无WS（含synthetic）/推理/profile/音频/转写/browser/服务。旧commit与所有历史JSON不改，本增量经专项root审查后保存新任务提交，不改旧提交或main/push。

**本次窗口里返回的匹配语音请求组仍有实际exceededCpu终态，CPU2050ms、wall157316ms。** 用户报告Paid升级完成与这条平台证据并存；后者不能推成有效限额恰2000ms或Paid未生效，也没有严格证明此组就是用户那一条连接。

## 用户反馈与查询

用户在先前升级完成报告后，本人再次线上问答约2.5分钟后中断，称发生在反馈前1–2分钟；页面完整版本`12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`。截图显示05:25剩余、蓝色开启对话、语音暂时中断及同一保留转写提示。总预算本次未再次确认，**不把05:25计算成精确155秒**。用户已结束该连接。通知时点不作实际开始/断开时间。

调查首先取得时钟12:51:38UTC，按留足UI延迟的固定12:44–12:53UTC窗口查询。证据见[脱敏JSON](post-upgrade-disconnect-evidence.json)。

- 12:53:13.195Z，既有cf部署查询确认lie-game仍100%版本`380959e2-51b8-489f-b76b-1db289f30cba`，部署创建12:09:28.789204Z、标记CI git12c4e4d。没有用新部署替换用户测试版本。
- cf官方schema确认o11y.telemetry.query的路径与POST查询格式，再dry-run核请求。过滤仅`$workers.scriptName == lie-game`、`$workers.event.request.path == /api/voice`、上述timeframe；view=invocations，发送limit=100。**没有CPU/error/outcome过滤**，不是只看异常的查询。
- 12:53:14.673Z首次结果返回1个request group、共5条record：4条固定CPU-limit异常、1条terminal。它们不是5条连接；人工group序号不含真实request/session ID。实际URL仅在内存比对，5条均为lie.agency/api/voice；version均匹配380。
- terminal原始record timestamp=`1793364547065`，转换为12:49:07.065Z；outcome=`exceededCpu`，cpuTimeMs=2050，wallTimeMs=157316，eventType=fetch，truncated=false，responseStatus未返回。**record timestamp不冒充click/start/end**，CPU与wall单位均毫秒。
- 12:56:17.341Z对同一固定窗口、同一筛选只补核响应完成/分页元数据，terminal tuple完全一致。runStatus=COMPLETED，返回仍1组/5条，CLI响应无cursor/result_info/明确hasMore值；统计abr_level=1原样保留，不据此宣称无采样。发送limit100和单record truncated=false也不能证明所有流量完整覆盖；活跃请求、日志采样、保留/摄取延迟等仍有边界。因此只称“本次查询返回1组”，不称该时间窗全流量只有1条连接。

## 能说明与不能说明

与原升级前597两次2019ms CPU记录相比，当前380这组是2050ms CPU，墙钟约157.316秒。平台记录的CPU终止再次出现，不能归因于已证伪的旧180秒timer，也不能先归咎缓存、idle或播放器。近时、route/version和用户所述约2.5分钟相近，支持它作为优先排障证据；未采集用户请求关联信息，仍不能作严格归属断言。

这些投影没有建立浏览器close code/raw reason、主动关闭端或provider/protocol资源关闭原因。现应用没有finish来源/elapsed日志，CPU被平台终止时也未必能执行应用cleanup日志；不能把lack of close log解释成某端没有关闭。已经取得明确exceededCpu，应先处理运行配额事实，不能继续增加600墙钟来应对CPU终止。

用户确认的Paid开通是账号侧事实；先前settings没有返回limits/cpu_ms，故实际有效数字仍未知。单次CPU计量不等于配置值，运行弹性/计量/配额选择口径尚无足够证据；不把2050向下取整成2000。当前数据也不能证明Paid尚未生效、升级传播延迟、或某个旧override就是原因。本轮没有新settings/订阅/entitlements查询，没有重复Billing403或扫描其他产品。

## 用户本地对照反馈

随后总协调转达：用户本人在`http://127.0.0.1:8787/`与同一人物连续问答约3分40多秒，原话“然后都没有问题”。这是用户报告的约220秒以上无问题，非代理计时或独立运行验收；至少未报告中断，不能强解为已经验证全部音爆消失。没有精确起止/连接ID，通知时刻不是连接时间。总协调此前HTTP核实本地main为12c4e4d，与线上git一致；本地是Vite DEV＋本地workerd，provider agent/device身份未比较，status ready也不证明相同。

本地较长成功与生产157.316秒CPU终止并列，进一步支持优先验证生产Worker运行预算/设置差异；DEV/build、运行时和网络等条件有差别，仍不足以绝对归因Cloudflare，或证明600秒及所有音爆根因已排除。用户本地8787/8788保持不动，总协调继续持有发布暂停；任何main更新可能触发本地runner重启，维护窗口须由总协调另行安排。

## 必要下一步提案，尚未实施

可把**显式`limits.cpuMs: 30000`**作为后续最小配置候选，保留普通JS relay、600秒、64KiB和现有鉴权/双端关闭保护；它需要用户授权、实际配置审查、构建/发布及新运行验证，不直接拉满300000，不承诺能解决这次终止或保证600秒。

适用依据已核：本工程仍使用cf beta18的typed cloudflare.config；专项root另核cf/config实际重导出的`@cloudflare/config`0.27.0声明`WorkerConfig.limits.cpuMs`为可选number，并将其转换为`limits.cpu_ms`；Vite使用的0.28.0亦支持。[官方cf配置说明](https://developers.cloudflare.com/cf/projects/cloudflare-config/)599–600定义它为Worker invocation CPU毫秒上限，仅适用standard usage model，并非DO专属字段。[官方Worker limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)允许Paid配置CPU预算；两份公开资料于2026-10-30读取。当前普通Worker的WS升级/处理以fetch记录，能提出这一配置候选；但这些类型/文档**不解释本次到底是哪一个有效quota在2050ms终止它，也未保证普通WS每消息预算重置**。不能以类型可接受代替运行配额证据。

若用户选择配置候选，需先确认针对正确账号/Worker、Paid/standard适用性及配额，然后按review＋发布流程处理，之后先新连接跨180、再单独获准验证600墙钟，保留原计时起点。若有效quota仍不明，或后续明示配置与终态继续不符，就需要有效配额证据或账号持有人联系Cloudflare支持；本任务不自行升级、改权限、创建支持工单或发起流量。旧Paid默认30000的公开说明不是本Worker的已验证设置。

## 检查、隐私与资源回执

Node24.22.1＋既有pinned cf只读复用，无新依赖。raw API响应只在内存，用内存request分组后丢真实ID，仅固定分类/数值/版本/route布尔落地；未保存accountID、headers、音频、转写、provider IDs或原始URL。query/body与脱敏运行临时文件全在本WT ignored tmp。此次初始clean后CF在12:53:12Z生成的唯一account-selection缓存已确认自有、未读内容地移入`tmp/voice-cpu-options/post-disconnect-owned-cf-cache-1253`，不提交或残留.cloudflare/。

JSON/本地链接/隐私字段/重复tuple身份/diff whitespace/scope检查通过。旧runtime/settings/post-upgrade证据与探针不变；纯文档无需应用全套。用户线上连接已结束，但总协调发布暂停由其持有，本专项不自行解除；未碰本地8787/8788或其它服务。全部结果交root完整审查后新commit归档，再由唯一总协调决定集成/发布与后续授权。
