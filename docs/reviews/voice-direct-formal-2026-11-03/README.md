# 正式浏览器直连：实施与验收合同

2026-11-03，设计已获总协调实际 review 与实施 GO；源码正在隔离 worktree 实现，资源操作与本人预览验收尚未进行。用户已授权以正式主干实现与生产默认直连为方向；用户转述 Linx 确认 DeviceId 经 OTA 获取 token 是有意设计，`/v1/ws/` 可用于这条浏览器链路。这是用户提供的供应商信息，不冒充我们已有该 endpoint 原生浏览器实测或 token TTL/撤销的书面合同。TTL/撤销细节未知不再作为阻止已授权方向的门槛。

**验收门槛：同一正式候选 SHA 必须先部署真实 Cloudflare preview 给用户，得到其明确“没问题”后，root 才能审合 main 并正常生产发布。** 自动测试、无输入握手和沉默都不能替代本人验收。当前不集成 main、不发布生产。为满足同候选 SHA，预览应部署 root 已审的最终整合候选（可先在隔离 integration worktree 准备，尚不更新 main）；用户验收后如 main 或候选发生实质变化，必须重新核对并按门槛重新验收，不能把另一构建冒充本人已测版本。

基线经 local main/origin/main 与 remote 精确读取一致：`3de59d67412366634211ecc79341741e28f35864`。独立 managed WT `/Users/nighca/.codex/worktrees/voice-direct-formal/lie`，branch `codex/voice-direct-formal`。旧 58 与 ba68 固定身份实验保全；当前测试 child 仍服务 ba68 / deployment `4cdff3cd-efa1-4bd9-b7ad-e72426c9e336`，没有单独部署 fixed `/ws/` 阶段。

## 最小合同

1. `GET /api/voice/status` 保留主干签名 Cookie、namespace、过期校验及 `newBrowserDevice`；各 browser context 得到各自 Device/Client。intro 只做 readiness/身份引导，不取 OTA token。
2. 每次显式 open 正常路径只 POST 一次 `/api/voice/prepare`，使用服务器验过的 Cookie 身份。prepare 完成当前 Agent 的绑定/ownership 校验后返回 fresh descriptor：固定 `wss://xrobo-io.qiniuapi.com/v1/ws/`（末尾斜杠）、DeviceId、ClientId、token、由既有 `VOICE_MAX_SESSION_SECONDS` parser 得到的期限（默认 600 秒）。请求保持 exact Origin、无 query、空 body；响应 no-store，不输出管理凭据。
3. `deviceProvider.prepare(): Promise<string>` 返回已取得的 first/confirmed token。已有 token 的分支保留 `belongsToAgent()`；新绑定成功返回 confirmed token；409、网络或响应不确定后的恢复仍要求 confirmed token 加 ownership。正常已绑定为 1 OTA + 1 ownership GET；新绑定为 2 OTA + 1 bind，异常恢复另有 ownership GET。不能再追加 `.token()`，不能跨请求缓存。
4. 无效/过期 Cookie 的 `identity-required` 409 可触发一次 status 更新身份，再 prepare 一次；不对任意 provider/WS 失败重试。响应迟到或 scope 取消后不得创建 mic/socket。descriptor 只在当次连接内存中使用；token 不进 URL、storage 或日志，URL 只携带协议需要的 Device/Client，token 放 hello。
5. 严格单 endpoint `/v1/ws/`，不保留 ws2 fallback。继续原生 WebSocket，不模拟浏览器无法设置的 HTTP 鉴权 header。保留 64 KiB 限制、single-open/socket、取消/关闭与 iOS 回答 drain+300ms 暂停上行；不改音频机制。服务端复用既有正整数且 `seconds <= floor(0x7fffffff / 1000)` 的配置校验；descriptor 类型为 number，客户端同样校验正整数/timer 上限，不把临时版字面量 600 硬编码到正式合同。preview 仍固定 600 秒；客户端期限不等于供应商硬上限。

## 已批准的服务端回滚能力

总协调已选择保留现有 relay 为明确的 server-only 运营回滚模式，默认 direct，不增加 query/URL 开关或自动 fallback。status 返回可信 transport；direct 模式的 `/api/voice` relay 入口明确返回 404，只有服务端配置 relay 才启用该路由；relay 模式保留原 204 预热与现有共享 token 首拨、仅 401 后一次设备 token 回退。`LINX_WS_TOKEN` 因此仍有实际消费者，不能当死配置删掉。切模式是配置与页面刷新操作，不允许一次连接隐式重拨另一路径。

已批准新增 `VOICE_TRANSPORT` 文本绑定：main/未来 PR 共九项（现八项加 mode），原四个 secret 保留；可信 PR restore 固定 mode=direct、namespace=pr-N。同步 artifact restore、deployment verifier/inspect 的精确 binding 白名单及测试。既有 PR5 等部署是已审 legacy 八项（缺 mode）；只有旧资源 preflight 允许 exact legacy 八项或新的九项，其他 names/types/namespace 不变。新运行时 missing/空/未知 mode 一律 unavailable；legacy 八项仅是旧部署读取兼容，不让新代码默认为 relay。direct readiness 不要求 shared WS token，但要求 API key/Agent/Cookie secret/namespace/合法期限；relay 另要求 shared WS token。新上传 postflight 必须九项且 mode=direct，不能泛放额外字段、用旧形状当新部署成功或自动修改资源。不放宽 provenance/receipt/digest/main-tip/URL 门禁，不修改 PR5 当前部署或 workflow。

## 文件所有权与独立检查

- frontend owner：`packages/voice/src/{channel,types,index}.ts` 及相关 transport tests，`apps/web/src/application/liveVoice.ts` 与相关 Web tests。从主干引入经审 direct 传输的必要代码，改为正式 `/ws/`；不复制 private wrapper、不 cherry-pick 整个 58/ba68。
- 本专项 owner：gateway index/browser-device/config 和对应测试、必要的 PR binding 合同/tests、正式 preview 薄 gate/build/operator/证据；负责组合全文 review、类型/构建、资源配置与完整验收 tail。只有总协调持 main 集成与生产发布权限。
- 类型检查全 workspace；fake/workerd 检查每浏览器 identity 分离、旧 namespace Cookie 更新、prepare 新/旧绑定 OTA 计数/ownership/并发恢复、错误/取消、direct descriptor 与 relay 实用回滚；共享 voice/Web 检查 URL allowlist、无 ws2 路径、64 KiB/有效期限含边界、单 socket、迟到响应、iOS drain+300ms。必要 PR scripts 套件保留全部可信发布门禁。

当前 main 未配置额外 CSP connect-src；实现时只在实际需要的现有策略中精确允许 provider WSS，不为关键词新造宽泛 CSP 或任意网络目的地。

## 真实 preview 资源计划（必须另审 GO）

同一 child `direct-test-20261103` / `https://direct-test-20261103.preview.lie.agency`，使用正式 handler，只有测试专属薄外围 gate 执行原 expiry（所有动态 API 到期 410）。不将固定 Device wrapper 放入主干。不延长截止、不改 shared parent/domain、生产或 PR5。

建议复用原 ledger 明确 owned 的专用测试 Agent；签名 Cookie 改用新 namespace（例如 `direct-formal-20261103-v1`），并配新 Cookie secret，令旧 58 给所有浏览器签过的固定身份失效。status 因旧 environment/签名不符而生成新的独立 Device；不能仅换入口继续接受旧 global Cookie。

正式 direct preview 八项绑定：ASSETS、LINX_API_KEY、LINX_AGENT_ID、VOICE_DEVICE_COOKIE_SECRET、VOICE_DEVICE_ENVIRONMENT、VOICE_MAX_SESSION_SECONDS、VOICE_TRANSPORT、原 PRIVATE_PREVIEW_EXPIRES_AT。无 R2、无 shared WS key、无固定 Device/Client。API key只在已批私密构建/部署流注入，未获资源 GO 不读取或调用管理凭据。

从当前四绑定更新时，cf 可能继承旧 PRIVATE_PREVIEW_DEVICE_ID/CLIENT_ID secret。必须 exact readback；只在它们是唯一多余项、latest 锁定新 CLI deployment 时，才经批准清掉这两个废弃固定项，绝不能复用旧实验删除 Cookie/namespace 的 PATCH。完整代码/module/assets hash、同 child、namespace、expiry 与实际 binding 列表作为验收依据。失败/漂移停止，不盲重试/回滚。

复用 Agent 后，其 ownership 和到期清理职责续归本正式方案 owner。旧 fixed Device 保留到新候选验收后；若提前清理旧 fixed 身份，只能精确解绑原 Device 并标记该 ledger 的 device 状态，不能删除仍服务新 per-device 的 Agent。旧 `resource-ops.mjs cleanup` 会解绑旧 Device 后直接删 Agent，迁移后已被本计划取代，必须保留历史但禁止在新 Agent 活跃期间执行。只有整个 preview 用户验收结束或原到期后的协调关闭阶段，才按该 owned Agent 的 bindings 列表逐项校验 AgentId 和 ID、解绑全部已确认 owned 的设备（含仍绑定的已知旧 fixed Device），再删除该确切 Agent；混入/未知项停 owner 核对，不扫描全账号。测试期间保留 Agent，不擅自新建、删 Agent 或回收生产设备；后续最小 operator 需区分 fixed-only unbind 与整组关闭，不能复用旧 cleanup 的删除行为。

原简化任务 no-input 预算仅剩 1 次（已使用 1/2）；正式 per-device 两 browser contexts 的真实验证涉及新动态 Devices，需 root 另批具体资源与拨号预算。不得悄悄复用或扩大预算。正式 verifier 最小保留准备状态、身份匹配、同源 Cookie 和 socket 数量、原生握手 HTTP status 数值、close code/关闭确认；不记录 raw headers/URL 参数/正文，不发 mic/listen/binary/文本推理，不做 ws2 回退。`/ws/` 原生行为如果不符合用户转述，报告实际失败并停，不自行恢复旧 endpoint。

## 本地实现与待批运营步骤

薄 expiry gate/config 和 `stage.mjs` 已准备；stage 只接收批准私密流提供的 Agent/API key/新 Cookie secret/原 expiry，验证 exact eight-binding preview build 后写0700目录/0600配置，不访问网络。旧 fixed-only cleanup 脚本仍保留历史，不能在复用 Agent 后调用其整组删除逻辑。

拟申请本轮正式验证为两个新隔离 browser contexts、最多两个 Cookie Device：各 status 两次比较身份稳定且相互不同，A/B 各 prepare，再 A prepare 检查同身份新请求，共三次 prepare；正常约五次 OTA、两次 bind、一次 ownership GET。仅 A 最后 descriptor 做一次真实当前 source channel 的 no-input `/v1/ws/` 握手，使用独立本任务计数，不复用旧任务额度。失败不自动重试、fallback 或回滚；第二拨号不在此脚本默认额度内。仅写脱敏布尔/状态码/close 证据，必要 Device cleanup 身份保存私密文件。此为待 root 资源/额度 GO 的具体计划，尚未执行。

部署前 fresh 锁 exact child/current4cd deployment、原四bindings、空 parent、main3de/PR5a91不变；私密内部比较原 Agent/expiry，另生成新 Cookie secret。只对同 child 一次 cf prebuilt upload。回读恰八项则不 PATCH；若唯一多余项为原 `PRIVATE_PREVIEW_DEVICE_ID`/`PRIVATE_PREVIEW_CLIENT_ID` 且 latest 仍是该新 CLI deployment，拟经资源 GO 后至多一次 JSON Merge Patch 将这两个字段设 null。不得删除正式 Cookie secret/namespace。未知额外字段、身份/latest漂移或未知响应先精确回读并停，不重试/删除。验证 exact module/assets/full SHA、stable/immutable `/` `/editor` `/api/health` `/api/voice/status`、原 expiry、Cookie隔离与404 relay/旧connection，然后才进行获批 no-input 检查。

无输入检查不触 mic、AudioContext、listen、音频或推理，只证明受限协议握手。真实语音、Safari/iPad autoplay/播放/中断和大陆体验均留给用户同 SHA 验收，不能先宣称通过。旧 ba68/4cd 四绑定部署与私密 staging 保留作为经审回滚资料；任何实际回滚仍需协调决定，不自动恢复固定身份。

## 历史实验回执保全

[ba68/4cd 脱敏回执](historical-fixed-preview-receipt.json) 保全用户转向正式 per-browser 方案前已完成的固定身份实验：单 prepare、四 bindings、ws2 的一次 no-input channel ready/关闭，以及源码/module/assets/HTTP 对照。它不构成 `/v1/ws/`、Cookie 隔离、真人语音或正式候选验收，也不授权继续部署固定方案。原始实验 source、private staging/ledger 仍保留；本文只归档必要脱敏事实，不复制凭据或身份值。
