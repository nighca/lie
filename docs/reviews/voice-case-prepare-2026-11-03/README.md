# 每局一次 prepare：正式直连候选

2026-11-03 用户已批准：进入案件阅读背景时，以同一个 POST prepare 完成 Cookie 身份、OTA/绑定/归属检查与 token 预取；点击开聊等待同一 pending，同局切角色或停后再开复用凭据。假定 token 覆盖一局是工程假设，不是供应商 TTL 事实。没有 TTL 状态机、自动刷新、自动重试或跨局缓存。

本批依赖已审候选 `ec26f1a59472bf038a9ad71ef2340273a6cbc5d9`，实现工作树 `voice-case-prepare`、分支 `codex/voice-case-prepare`；主线仍为 `3de59d67412366634211ecc79341741e28f35864`。ec26/e093 的 status 引导、每次 open prepare 已被本方案取代，旧候选不合入；[历史尾验回执](historical-ec26-receipt.json)保留实际构建、平台、HTTP/UI 与无输入结果。旧已交付 commits、私密原始 ledger 和审计目录不改写。

状态：实现与组合离线检查完成，待根协调实际审查最终批次、整合候选和本批资源/调用预算；尚未部署新候选。当前测试环境 deployment 为 e093；正式 main 仍为 3de59d6。完成实际源码审查、根协调冻结整合候选后，再构建该 clean SHA 并更新同一真实 Cloudflare preview。**必须由用户对新候选明确表示测试没问题，才允许根协调合 main/正常生产发布；旧候选测试或沉默不构成批准。**

## 单一请求合同与生命周期

- `POST /api/voice/prepare`：精确同源 Origin、无 query、空 body、拒绝 cross-site、所有响应 no-store。先验证这些边界及服务配置，再复用有效 Cookie 或在本请求创建身份，签/续同一身份 Cookie。direct 成功响应 `{transport:'direct',url,deviceId,clientId,token,maxSessionSeconds}`；relay 成功响应 `{transport:'relay'}`。不保留旧 204 或 status 恢复合同。
- provider 的绑定/OTA/归属失败仍返回本请求身份 Cookie，让玩家显式 retry 复用并恢复同一设备，避免已绑定后因失败响应丢身份而主动轮换。Origin/body/config 被拒时不签 Cookie、不调用 provider。provider token 仅存在 direct 成功响应和当前案件内存，不写日志、URL 或持久存储。
- 每个 controller 独占 VoicePort；背景显示后开始一个准备 Promise。成功与失败都缓存到本局结束。open 只等待这个 Promise；连接停止、角色切换不触发新 prepare。新案件、restart、dispose 取消并清除本局准备；玩家明确从错误状态 retry 才另发一次。已展示的错误在切人/开关指认后仍保持重试含义；若玩家先停止等待、后台才失败而从未见过错误，下一次 open 先展示缓存失败，再由明确 retry 发新请求。旧案件的迟到响应不能写入新案件或启动 mic/socket。
- 删除 `/api/voice/status`。`GET /api/health` 仅增加 `voice:{status:'ready',transport:'direct'|'relay'}` 或 `voice:{status:'unavailable'}`，用于配置就绪核对；不签 Cookie、不进行 OTA/绑定/WS。PR publisher 只做三个 GET：首页、editor、health，并验证 R2 与 direct 配置；不得调用 prepare 作为自动健康探针。

`deviceProvider.prepare()` 仍直接返回现有 first/confirmed token：已绑定路径是一次 OTA 加 ownership GET，新绑定路径是两次 OTA 加 bind；异常绑定恢复继续要求 confirmed token 与正确归属。没有在其后再取一次 token，没有削弱跨 Agent 验证。默认 direct，服务端明确 relay 仅作真实回滚用途；保留 relay 共享 token 首拨及其既有 401 后同 Device OTA 一次回退。浏览器不切模式或隐式重拨。

固定原生地址 `wss://xrobo-io.qiniuapi.com/v1/ws/`；query 只携 Device/Client，hello 携 token。保留 64 KiB 帧限制、单 socket、取消、配置正整数连接期限、iOS playback drain 加 300 ms。客户端期限不是供应商硬上限；仍 pending 的准备会让开聊等待，真实 Safari autoplay、语音与大陆体验由本人验收，不用 fake 或无输入握手替代。

## Cookie 并发与失败边界

同源两 tab 在初始无 Cookie 时同时 prepare，可能分别创建两个身份。每份响应中的 Cookie 与 descriptor 必须对应同一 Device/Client；各 direct 案件固定使用自己得到的 descriptor，另一响应后来覆盖共享 Cookie 不会改写已持凭据。下一局使用那时的 Cookie。显式 relay 的升级仍读取当时 Cookie。这里不引入跨 tab 锁、共享缓存、数据库或同步系统。

Fetch 取消不能撤销已完成的 provider 绑定，也不能保证浏览器未应用已到达的 Set-Cookie。响应完全丢失时，客户端可能无法得知已分配身份；显式重试只能采用当时 Cookie。测试记录未知身份时只标 unknown，不猜 ID、不扫描全账号。成功/失败同请求签 Cookie 缩小可恢复失败的孤立窗口，不能消除网络断开边界。

## 文件所有权与离线验收

- backend owner：`apps/gateway/src/index.ts` 与直接受影响 gateway tests、gateway README、architecture、本方案及旧 ec26 脱敏归档；保持 browser-device 的 provider ownership 实现。
- frontend owner：独立 `voice-case-prepare-frontend` worktree，从 ec26 开始；liveVoice、VoicePort、controller/main/demo/fakes/diagnostics 与必要 tests/shared voice。必须覆盖真实 controller 生命周期、pending 去重、局内复用、显式 retry、新局/离开取消与迟到 response/JSON。
- probe owner：独立 `voice-case-prepare-probes` worktree，从 ec26 开始；publisher/dev rejection 的 status consumer 及必要 tests、本目录新 verifier。保留 provenance、digest、main-tip、精确 URL/资源合同；健康检查不创建 provider 资源。
- 实现 owner 完整审每项冻结 diff 与组合检查；只有根协调持有最终整合/发布 turn。旧执行性 latency fixture 随新接口更新，历史延迟数据不据此改写。旧 dated device-concurrency release-api/v2、旧 formal verifier 与历史 performance probe 保留原合同供审计，不能作为新候选的验收命令。

后端用 workerd fake 验证 Cookie/descriptor 同身份、续签、无身份首次请求、旧 namespace/畸形 Cookie 替换、并发首次请求、同 Cookie 并发绑定恢复、foreign Agent 拒绝、confirmed OTA 失败后显式 retry 不重建、配置/Origin/body 拒绝无副作用，以及最小 relay JSON 合同。健康/资源探针只证明配置和部署，不证明真实 provider。

## 后续资源计划与清理责任（尚待最终具体 GO）

目标保持 `lie-pr-preview` 下唯一 `direct-test-20261103` child、同一自家域名 `https://direct-test-20261103.preview.lie.agency`。child ID 为 `ed1fb7b3f53547968e95d9b79ea48d01`，当前 deployment `e0938651-fc5f-45af-9a42-5ef63029ffe5` 保留为已知基线。复用当前八项 bindings、owned Agent、Cookie secret、namespace `direct-formal-20261103-v1`、600 秒配置；不新建 Agent、不改 main/PR5/父域，不恢复固定公共 Device。原绝对 API 期限 `2026-11-04T00:22:26.438Z`（北京时间 11 月 4 日 08:22:26）不延长。到期后新 API 请求及跨到期才返回的 prepare 均410；但到期前已取得的本局 descriptor 可能在之后继续用于原生 open，因为局内复用不再请求 API。API gate 不撤销已发 token，也不证明禁止所有后续对话；不为临时预览增加产品 TTL 状态机，资源到期核权清理另行协调，供应商 token 撤销效果仍不编造。

八项为 `ASSETS`、`LINX_API_KEY`、`LINX_AGENT_ID`、`VOICE_DEVICE_COOKIE_SECRET`、`VOICE_DEVICE_ENVIRONMENT`、`VOICE_MAX_SESSION_SECONDS`、`VOICE_TRANSPORT`、`PRIVATE_PREVIEW_EXPIRES_AT`。沿用已审 formal stage helper，私下核对原 Agent、Cookie secret 与 ledger expiry，再把同一四项私密输入放进新独占 staging；不打印或提交其值。

最终 clean candidate 经实际审查后，同 child 一次 cf prebuilt 更新，精确读回 deployment/latest、八项绑定、module/assets/full SHA、期限与原身份。当前已经八项，计划不需要 env-null PATCH；未知额外项/漂移/失败先精确读取并停，不盲重试、删资源或回滚。

拟申请新独立预算：两个 fresh contexts 各一次 prepare（最多两个新 provider Device），A 的同一个 descriptor 做一次最终 source channel 原生无输入 WS；失败也消耗额度，不重试/fallback。验证成功 Cookie 与 descriptor 身份一致、跨 context 隔离、精确 `/v1/ws/`、101/ready/关闭；无 mic/listen/binary/inference。局内多次 open、角色切换、续签与错误重试仅用离线检查，不为对称性增拨号。旧 ec26 的一 WS 额度已耗尽，不能复用本计划作为执行授权。

原 owned Agent、旧 fixed Device 与已产生动态 Device 的生命周期仍归本执行 owner。**旧 `resource-ops.mjs cleanup` 会删除整个 Agent，已 superseded，禁止在新预览活跃时执行。** 只清旧 fixed 身份时至多精确解绑它，不删复用 Agent。完整预览结束/到期后，按 owned Agent 限域列出绑定，逐项校验 AgentId/Device 后解绑，最后删除确切 Agent，并另行协调撤销该唯一 child；共享父 Worker/域名及 PR5 不动。出现未知或混入项先协调。用户测试可能产生自动验证之外的新 Device，不能只清两项就声称完整清理。到期 API 410 不代表 provider 资源删除。

ec26 私密 staging/ledger 为本轮审计、受控回滚及精确清理暂留 0700/0600；新部署采用新的私密 attempt/receipt，不覆盖旧证据。用户验收完成或协调终止后清除无需继续保留的临时凭据副本，必要脱敏事实随正常批次入库；本文件不包含 Agent/Device/Client 值、Cookie、token 或管理 key。

## 本批本地检查

组合 worktree 的 `npm test` 共955项通过：main-preview9、presets24、gateway107、Web513、Safari19、animation80、core54、UI65、voice84。`npm run typecheck` 全 workspace 通过。publisher/CI release/dev rejection/new verifier 的脚本 suite219项通过；新的 latency fake4项与 browser-probe语法由 frontend owner 验证，已实际审查相同源码。没有运行真实 latency probe、dev rejection服务实验、Cloudflare上传或 provider 验证。

后端 `e01d1468a8b3957180e1db822365448a72149de2`、probe `f791add1ca7eabb94c7d2e5b30119f92e0b3998a`、frontend `9459aac8e0a282347a7959f33657a043cba217d7` 均从本批依赖顺序组合且实际审查。frontend main工厂仅把 VoicePort 创建移入每次 controller 构造，controller仅增加reset及保留已呈现error的小改；生产liveVoice净删旧状态逻辑，未改游戏规则或音频机制。最终clean构建与真实部署身份以随后的冻结批次/平台回执为准，这些本地结果不宣称用户已验收。
