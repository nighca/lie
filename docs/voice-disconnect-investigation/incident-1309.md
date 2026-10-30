# 21:09 左右线上再次中断：13:09 UTC 事件核查

日期：2026-10-30。状态：只读调查，供发起者独立审查；未集成、发布或调整运行设置。

**新固定窗口返回一组 `exceededCpu`：CPU 2050ms，wall 99509ms（99.509 秒），Worker 版本仍是 `380959e2`。** 与用户这次约一分半中断的反馈近时，但缺少用户请求关联标识，不能严格认定就是该连接；2050ms 仍不是有效配置限额的直接证据。

## 用户观察和截图

用户反馈发生在北京时间 21:09 左右，估计连接仅约 1 分 36 秒。提供的局部截图显示“剩余询问 06:24”、蓝色“开启对话”按钮、“语音暂时中断”，以及已显示转写保留、可重新开始的通用提示。**不从剩余时间反算精确连接时长**；用户估计和反馈时刻也不充当精确起止。

本次没有重新确认浏览器页面 hash，不能把先前页面的 `12c4e4d` 证据复用到本次页面。当前线上部署元数据与本次浏览器身份是两条不同证据。

已先用本地 `view_image` 检查[必要 UI 截图](incident-1309-ui.png)：仅局部游戏角色和中断操作区，无可见转写内容、账号详情、浏览器栏或个人标识，因此原样复制这个已提供的局部图，无裁剪、图像加工或外部上传。原图 SHA-256 和脱敏观察保存在[证据 JSON](incident-1309-evidence.json)。

## 只读核查过程与全部返回组

首次校时为 13:15:29 UTC，固定查询 **13:04:00–13:13:00 UTC**，结束点早于执行时刻。只查这次窗口，不重复旧 12:44–12:53 窗口。复用 Node 24.22.1 和已固定 `cf@1.0.0-beta.18`，按 cf-cli 技能使用现有 CLI；无安装或版本升级。

1. 通过匿名 `cf cli search` 找到 `cf o11y telemetry query`；读取官方 schema，确认 `o11y.telemetry.query` 是 `POST /accounts/{account_id}/workers/observability/telemetry/query`。该 POST 是读取查询结果，不是设置变更。dry-run 验证此路径；另对 Worker/deployment 元数据调用 dry-run 确认为 GET。账号选择、授权由 CLI 内部处理，未手读或导出凭据。
2. 13:17:00.641Z 查询当前 `lie-game`：与先前审计的 Worker 身份相符，配置域名匹配 `lie.agency`；部署创建于 12:09:28.789204Z，100% 使用 `380959e2-51b8-489f-b76b-1db289f30cba`，CI 注释为 `Verified CI build 12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`。真实 Worker/account ID 未写入归档证据。该当前部署结果不冒充用户页面版本。
3. 查询参数为 `view=invocations`、`limit=100`，AND 过滤仅 `$workers.scriptName == lie-game` 与 `$workers.event.request.path == /api/voice`。**没有 CPU、error 或 outcome 筛选**。13:17:02.523Z 返回 1 个 invocation group、5 条 records：4 条 CPU-limit exception，1 条 terminal；全部记录的域名/路径在内存中匹配上述线上语音路由，版本均为 380。
4. 初次按响应 invocation 对象的组键在内存合并。为核实这确为 requestID 分组，13:17:42.787Z 只对同一新窗口/过滤补查分组字段：5 条均存在 `$metadata.requestId`，且均与 invocation 组键相同；仍返回 1 组，terminal tuple 完全相同。因此是 **1 个请求组的 4 异常加 1 终态，不是 5 条连接**。标识仅在内存比较，最终只保留人工 `group-1`；未保存 request/ray/trace/span/account 标识值。

| 返回组 | Records | Exceptions | Terminal record timestamp | Outcome | CPU | Wall | Version |
| --- | ---: | ---: | --- | --- | ---: | ---: | --- |
| group-1 | 5 | 4 | 13:08:33.558Z (`1793365713558`) | exceededCpu | 2050ms | 99509ms | 380959e2-51b8-489f-b76b-1db289f30cba |

终态 eventType=`fetch`，truncated=`false`；未返回 responseStatus。record timestamp 的语义未进一步建立，**不把它称为点击、request start、request end 或断开时间**，也不倒推开始时刻。99.509 秒是平台 wall 字段，不是截图或代理计时。

响应顶层只有 run/invocations/statistics；runStatus=`COMPLETED`，`abr_level=1`。没有顶层 cursor/nextCursor/offset/result_info 或明确 hasMore 值。该响应没有给出可继续翻页的 cursor，但不能据此保证窗口内流量完全覆盖；limit=100、单条 truncated=false 也不能证明无采样。活跃连接、摄取延迟、保留和采样仍是边界。第二次读取只核同一窗口的分组与 tuple 一致性，不扩大时间窗或宣称全量。

## 判断及边界

这条记录再次提供实际生产 CPU 终止证据，wall 约 99.509 秒，明显不是“所有断连都在同一固定墙钟时长”的依据。与此前独立审计记录的 CPU2050ms/wall157316ms 具有同 CPU 量级、不同 wall 的特征，但没有重查旧窗口；旧事实见独立审计提交 `3b745182633266a0cd22d8cfada0ebffa86f37ad` 的 `post-upgrade-disconnect.md`，未重写旧文档或 JSON。

可继续优先核实生产 Worker 的有效预算/设置，但本次证据不能说明预算恰为 2000ms、Paid 未生效、存在旧 override、升级传播延迟，或 GPU/音频播放器是/不是最终根因。没有读 subscriptions、settings 或其他账号产品，没有权限扩大。现有只读投影也没有建立浏览器 close code/raw reason、主动关闭端、provider 资源关闭原因或应用 cleanup 是否执行。

独立 CPU 配置候选 `7c786ab3a97b34cdb5e401377d3c04175d13fccb` 保持冻结、未启用；本调查不更改它，不提出新的架构/音频/墙钟方案或自行申请部署。后续由总协调结合用户决定处理有效预算或支持渠道，不能把重复异常当作自动启用权限。

## 范围、检查和资源回执

原始 base 为 reviewed local main `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`，新 managed WT `lie-voice-incident-1309/lie`、branch `codex/lie-voice-incident-1309`。仅增加本文、脱敏 JSON、必要 UI 图片，不改变中央 project-plan/development、应用源码、配置或依赖。已有 AGENTS 已核，main 在开始与归档检查时仍为 12c。

检查包含 JSON 解析、时间窗与 terminal timestamp 转换、分组/record/exception 总数、第二次 tuple 一致、图片字节 hash、文内本地链接、敏感标识值排除、文件范围和 diff whitespace。纯证据文档不运行应用套件；没有 Worker/WS（真人或 synthetic）/provider/mic/inference/profile 测试。

所有临时脚本及脱敏中间结果只在本 WT ignored `tmp/incident-1309/`。初始 clean 后 CLI 自行新建的唯一 `.cloudflare/cache/cloudflare-account.json` 已识别为本任务自有；未打开内容，整块缓存移入 `tmp/incident-1309/owned-cf-cache/`，不提交。原始 API 响应只在内存，必要分类/数值/版本/路由匹配布尔才保存；无 headers、音频、转写、凭据、accountID 或原始 requestID。

无新服务、无停止服务、无浏览器/设备占用；用户 8787/8788、5176/5198 及其它专项端口均未触碰。没有账号/套餐/CPU/provider/权限/API write/deploy/push/main 变更，发布暂停继续由总协调持有。
