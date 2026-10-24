# 有效期邀请码访问设计（待用户确认）

2026-10-25；设计基线 `73ba1387c24762e48e78c003eef2421e53746a71`。**仅设计，未获实施批准；没有新增资源、secret、部署或付费实验。**

推荐：离线签发可重复使用、具有固定截止时间的邀请码；同域 Worker 兑换为 HttpOnly 授权 Cookie，正常游戏入口与真实语音连接都检查资格。保留浏览器游戏架构，不新增账号、数据库、DO 或频率限制。

## 先确认这三点

1. **邀请码可转发、可多人重复使用，到统一截止时间失效。** 推荐默认签发后7天到期，发码时可指定其他明确截止时间；不是每个人首次使用后再计7天。没有一次性、绑定个人或逐码撤销。
2. **到期暂停游戏并停止语音。** 不等整局结束；保留本页内存进度与只读转写，重新输入有效码后可继续，刷新仍按现有规则丢失进度。不清空已读内容、不自动判输赢。
3. **浏览与创作公开，实际试玩要码。** 首页、案件介绍、编辑器、保存草稿、生成/打开分享链接可匿名；官方案件、分享案件、编辑器“试玩”的“接案，开始调查”均要求邀请码。生产不提供绕过门槛的模拟试玩。

这些是推荐选项，不是已批准行为。用户已确认的只有：用有有效期的邀请码限制玩游戏访问、不限制频率；本轮先出设计供确认。若用户要不可转发短码、每人单独计期、一次性消耗或精准撤码，需要另行设计，不在此默认增加状态服务。

## 当前事实与设计边界

已读真实代码，而非沿用旧提案的配置描述：

- [Worker](../apps/gateway/src/index.ts) 当前暂时停用应用鉴权，`/api/voice/status` 只按三项供应商配置返回 ready/unavailable；WS 强制同源 Origin、禁止 query 覆盖，并使用固定 `LINX_DEVICE_ID`/agent/token。未授权请求目前也能在配置齐全时进入上游。
- [CF 配置](../apps/gateway/cloudflare.config.ts) 当前生产声明这三项 secret，`/api/*`、`/games/*` 先经过 Worker，其余资产/SPA 按静态路由处理。[开发配置](../apps/gateway/vite.config.ts) 没有旧提案所述的安装测试 Cookie 接口。旧[上线提案](public-voice-launch-proposal.md)是归档，不是本次批准范围。
- [Application](../apps/web/src/Application.vue) 在浏览器加载官方/分享/编辑器预览内容；[App](../apps/web/src/App.vue) 的接案按钮直接调用 controller.start；[liveVoice](../apps/web/src/application/liveVoice.ts) 先查状态，之后并行准备麦克风与 WS。[main](../apps/web/src/main.ts) 只在 DEV 且 `?demo=1` 时启用 fake 语音。
- 保留现有上游握手10秒、每连接180秒、每帧64KiB。它们是已有传输安全边界；内容中的每局询问时长是玩法规则。**本设计不新增兑换/连接频率、局数、并发数或日额度限制。**

游戏包、规则、答案仍可被浏览器检查；不锁静态 JSON/素材，也不承诺阻止下载后的离线运行或手改 JS。正常 UI 限制“玩游戏”，Worker 强制限制真实供应商访问；客户端门槛不能替代 Worker 校验。若要求故事数据保密或服务端强制执行指认规则，就超出现有架构，须另讨论。

## 用户路径与到期体验

1. 访客照常看首页/介绍或创作。点击“接案，开始调查”时检查访问状态；有有效 Cookie 直接开始，没有则在当前页面出现“输入邀请码”对话框。编辑器预览仍先进入介绍，再在接案处统一检查。
2. 输入框接受完整粘贴的长码，只去除首尾空白，不接受 URL。提交到同源 POST；成功后清除输入值，展示完整到期时间，再继续原动作。全程不换路由，原 query、`#game=…`、编辑器内存预览和本地草稿保留；取消返回介绍。
3. 格式/签名错误显示“邀请码无效，请检查后重试”；只有签名正确且已过期才显示“邀请码已过期，请获取新码”。网络错误显示“暂时无法验证，请重试”，不放行、不回退假语音。Cookie 被禁用时，提交后复查状态发现未保留资格，给出启用 Cookie 提示。
4. 已授权期间不重复输入。客户端用 Worker 的 serverNow/exp 算剩余时间，以单调时钟安排 UI，重新聚焦/从后台恢复及准备开始语音时复查；本机改时钟不能延长服务端资格。截止时提示“邀请码已到期，输入新码后可继续”，停止麦克风、播放及连接；游戏动作（切人、指认、重开、开语音）暂停，转写/当前页仍可阅读，也可返回首页/编辑器。
5. 新码验证后恢复当前内存局，沿用原剩余审问时长，不补时、不重置人物历史。前端暂停与异步事件隔离须复用现有 controller/voice 生命周期；禁止迟到音频在解锁后继续播放。到期本身不调用 end/accuse。已结束局仍可阅读结果；重新开始须有效资格。刷新仍丢局，不为邀请码添加存档。

客户端暂停是产品体验；篡改浏览器代码可以绕过本地玩法锁，不能绕过到期后的 Worker 语音检查。多 tab 共享本 host Cookie；一个 tab 换码后，其他 tab 在聚焦/下次动作复查获知，不新增跨 tab 身份或锁。

## 令牌、时间与秘密

邀请码建议格式为 `base64url(payload).base64url(mac)`，payload 仅含 `v:1`、`purpose:"invite"`、`aud`（准确 HTTPS origin）、`iat`、`exp`（UTC Unix 秒安全整数）、128位安全随机 nonce；MAC 为 HMAC-SHA-256。签名覆盖带固定域前缀的原始 payload 编码字节，固定算法，不信任输入指定算法。校验限制长度/字段/版本/目的/audience、确认 `iat <= now < exp` 且 `exp > iat`，不加过期宽限。

Worker 用原生 `crypto.subtle.importKey/sign/verify`，不手写 MAC 字符串比较；256位根密钥来自安全随机数。邀请码是持有者凭证，不是弱数字短码；签名载荷可读，不含个人资料、故事或供应商凭证。随机 nonce 不代表服务端记录使用次数。[Workers Web Crypto 的 HMAC 支持](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

兑换后签发 `purpose:"session"` 的独立签名令牌，使用不同的签名域前缀；保留原邀请码 exp/aud，签发新的 iat/nonce。邀请码不能直接充当 session Cookie，session 也不能作为新邀请码兑换；重复兑换不延长有效期，无滑动续期。

Cookie：`__Host-lie_access=<session>; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=<exp-now>; Expires=<exp GMT>`，不设置 Domain。每次响应按签发时的 Worker now 计算剩余寿命；到期资格最终由 Worker 校验，不依赖浏览器何时删除 Cookie。生产全程同源 HTTPS；开发用独立测试密钥和明确的 loopback Cookie 策略，不把生产码放进本地明文调试。[Cookie 的寿命与 HttpOnly 语义](https://httpwg.org/specs/rfc6265.html#section-4.1.2)、[浏览器文档中的 Secure/host 前缀/SameSite 属性](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)

时钟权威为 Worker 接受请求时的服务器时间，不接受浏览器发送 now。运营者发码时必须提供带时区截止时间，工具输出 UTC 和北京时间（Asia/Shanghai，精确到秒），并标明不含截止秒；示例格式“有效至 2026-11-01 12:00:00 北京时间”。默认7天是运营便利的提案，不是新增局数限制。发码电脑应校时；未来 iat 被 Worker 拒绝，不用浏览器时间补偿。

### 发码与撤回

拟增加离线 Node 24 CLI，只负责 keygen/mint/inspect；不建网页管理后台、不建在线发码 API。它读取受限私密文件或 stdin 中的根密钥，签发指定 origin/截止时间的邀请码；密钥不放命令行参数、shell history、仓库或聊天。mint 将邀请码及截止时间明确输出到操作者指定的0600私密文件，keygen同样写受限文件；inspect只显示非秘密字段/验证结果，不把码当诊断日志打印。临时产物放版本控制之外。CLI 依赖 Node 原生 Web Crypto，Worker 不增加 Node 兼容依赖。

根密钥以 Worker secret `INVITE_SIGNING_KEY` 保存，只有维护者及 Worker 有；浏览器只短暂持有输入的邀请码，长期授权留在 HttpOnly Cookie，禁止 localStorage/sessionStorage 保存码。不记录请求正文、Cookie、完整 token 或签名；现有 query 脱敏不等于这些字段自动安全，实施时要检查应用日志/诊断输出。[Worker secrets 官方说明](https://developers.cloudflare.com/workers/configuration/secrets/)

维护者线下把码和到期时间交给受邀者；设计不自动发消息。码不混入游戏分享 fragment、query、Referer 或分享预览。分享链接仍只承载案件内容，不附带作者授权。

无服务端使用记录，因此可复制、可重复使用，无法识别具体是谁或精准撤销单个码/已签发 Cookie。首版不加黑名单；丢码可等到期，紧急时轮换根密钥使旧码和旧 Cookie 全部在新请求校验失效，再重发新码。轮换影响全部访客，且不立即终止已建立 WS，不承诺即时全网撤销。若将来需要单码撤销，再单独讨论状态存储/运营代价。

## 接口与真正的网关门槛

以下均为拟新增/修改，不是现有端点行为。所有访问响应 `Cache-Control: no-store`，不启用 CORS；拒绝 query（包括邀请码参数）和 cross-site 请求。POST 要求准确同源 Origin、JSON Content-Type，流式读取时最多4KiB请求体、码最多1KiB，超限413；这些是解析安全边界，不是频率配额。GET 状态允许正常同源无 Origin 请求，但拒绝不匹配 Origin/`Sec-Fetch-Site: cross-site`。

| 端点 | 拟议行为 |
| --- | --- |
| `GET /api/access/status` | 200 `{state:"granted", expiresAt, serverNow}` 或 `{state:"required", serverNow}`；访问配置错误/暂停则503和固定错误码。缺失/损坏/过期 Cookie 均不授权，不返回 token；无上游请求。 |
| `POST /api/access/redeem` | body `{invite:string}`。有效则200，设置 session Cookie，返回 expiresAt/serverNow；无效401 `invite_invalid`，签名有效但过期401 `invite_expired`；同源错误403，解析错误400，配置缺失/暂停503。不因失败清掉仍有效的旧 Cookie。 |
| `GET /api/voice/status` | 先校验资格；无资格401 `access_required`；有资格继续现有 ready/unavailable（不打开上游）。前端需保留这类错误，不能一律折成 check-failed。 |
| `GET /api/voice`（WS） | 先检查 Upgrade/准确同源 Origin/无 query，再检查有效 session，未授权401且上游调用数为0；然后检查语音配置。上游固定目标、三项私密 headers 保留，不接受浏览器传 provider token/device。 |
| 其他静态/health | 沿用现有内容与缓存/404行为；`/api/*`未知路由仍404，不把SPA HTML当认证成功。 |

`/api/*` 已在 runWorkerFirst 中，拟新增接口也必须走 Worker，不能被 SPA fallback 绕开。由于不保护静态内容，不需要把整个站改为 Worker-first，也无需把 Cookie 转交 ASSETS 上游业务。[Cloudflare Worker-first 路由说明](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)

浏览器原生 WS 握手会按 Cookie 规则附带凭证，不在 URL 塞 token。[WHATWG 握手的 credentials include 定义](https://websockets.spec.whatwg.org/#opening-handshake)；Origin 只是跨站保护，不是身份凭据，非浏览器客户端也必须提供有效 session。

### 到期与握手竞态

1. 接案资格检查用于 UI；每次真实 WS 仍重新验 Cookie，不能相信先前的 status。浏览器在开始采音前检查 access/voice status；401重新输入，503显示服务不可用，不调用麦克风或供应商。
2. Worker 在启动上游前验证并捕获本连接的 exp；`now >= exp` 不可开始。绝对时间比较统一为毫秒（`exp * 1000`）；上游握手 Abort 截止取 `min(现有10秒, exp * 1000-nowMs)`。等待期间达到 exp 应取消握手。
3. 上游返回后、发101前再次读取 now；`now >= exp` 则关闭已得到的上游 socket、返回401。Abort 与返回竞态都清理上游，不建立浏览器 relay。极短有效窗口仍可能发出了上游请求，不能承诺零计费；没有额外设置“剩余至少N秒”限制。
4. 成功后连接截止取 `min(连接建立时间+180秒, exp对应的绝对时间)`。relay 同时设置关闭 timer，并在**双向每次转发**前检查 deadline；到期不再转发，关闭浏览器与上游，应用约定 close code 4001 `Access expired`。timer 可能延迟调度，不能宣称毫秒级硬止付；既有在途帧和供应商已启动的处理不可能撤销。close/error 清理复用现有幂等 finish。
5. 客户端收到4001停止采音/播放并转 access-required；WS 非101在浏览器可能只呈通用失败，因此失败后查 access/status 区分“需重新输入”与普通网络故障，不能依赖读取WS HTTP响应体。status显示有效也不自动无限重连。客户端暂停后保留本地局，不把到期误报为角色回答。
6. 换新码只影响后续请求。旧 WS 捕获原 exp，不因为 Cookie 更新自动延期；旧连接到期后可在新资格下按既有动作重新连接。未到原 exp 的已建连接也不会因另一个 tab 清 Cookie、密钥轮换或新部署立即全部断开。

WebSocket close 与运行时生命周期依官方接口处理，部署/运行时更新可能另外断线；本方案没有跨连接注册表，不增加全网 socket 控制服务。[Cloudflare WebSocket close 与连接生命周期](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

## 最小模块与实现拆分（批准后才执行）

| 所有权/拟议文件 | 职责、接口与依赖 | 独立检查 |
| --- | --- | --- |
| 共享纯 TS `packages/access/src/token.ts`（新目录，非强制新 npm 包） | `verifyInvite/verifySession(token,key,audience,now)`、`signInvite/signSession`；无 Vue、CF、供应商引用。输出 typed claims 或固定错误。用标准 Web Crypto 接口给 CLI/Worker 复用，不复制两套编码器。 | 固定密钥/时间向量、CLI签发→Worker验证；篡改/错误目的/origin/版本/非整数/未来iat/刚好exp/随机坏输入。 |
| 网关 owner：`apps/gateway/src/access.ts`、`src/index.ts`、`cloudflare.config.ts`、`test/*` | 访问端点、Cookie解析/发放、同源/输入边界；`requireAccess(request,env,now)`向relay传授权 exp；无游戏规则。配置类型继续从 cf config 推导。 | 真实本地 Worker runtime+假上游，验证无权零上游、exp跨握手、双向到期、关闭幂等、原安全边界/静态缓存回归。 |
| Web owner：`apps/web/src/application/access.ts`、`Application.vue`、`App.vue`、`application/controller.ts`、`application/liveVoice.ts`、`application/voice.ts`、相关样式/测试 | access port 管理状态/提交/时间；接案与有效局动作门槛；暂停释放音频且保留局；错误提示与 dialog；现有voice channel已上报close code，liveVoice须把4001转为typed access事件，不能丢成普通closed。授权逻辑不塞入game-core，controller只接收访问状态/暂停动作。 | fake access/clock/voice覆盖官方、分享、编辑器预览；取消/网络失败/过期/续码、后台恢复、并发动作和迟到音频。 |
| 运营工具 owner：`scripts/invites.mjs`、文档、必要package命令 | Node24读取私密材料、签发/检查和格式化截止时间；无远程API、无网页账号。需由共享模块构建入口复用编解码，不手写第二份协议。 | 原生crypto跨运行时向量、CLI参数时区/缺失/无效时间、无敏感日志；不把真实secret作为fixture。 |

共享令牌接口先冻结；并行时文件归属不重叠，Web/网关依赖共享向量。暂不选新 npm 依赖；签名、base64url、请求/Cookie解析采用有限固定协议，不能由此扩成通用 auth 框架。Worker 只需已支持的 Web API，不因 CLI 用 Node 而要求 `nodejs_compat`。最小前端样式沿用已批准视觉，不涉及新的视觉方向。

## 迁移、验收与发布门槛

- 本次不触碰固定8787/8788、现有资源、生产配置或 `?demo=1` 行为。实施后的生产入口用 `ACCESS_MODE=invite|closed`：缺失/非法配置、缺根密钥均失败关闭游戏/语音，不沿用当前“应用鉴权关闭”作为生产fallback。`closed` 保留浏览和编辑、禁止兑换与新游戏/WS；它是维护暂停，不是限频。
- 本机开发可在显式 development + loopback 的启动配置用 bypass/mock access，生产不能接受 query/header 绕过；生产构建仍不启用demo。测试密钥和本机 Cookie 与生产分开。固定开发服务切换须另安排 owner/受控重启，不在本轮自行重启。最后的本机 Cookie 行为需在实际浏览器验收，不假定HTTP `__Host-`可用。
- 保留现有传输安全限制、秘密扫描与无供应商密钥下发；新日志只记固定事件/结果码，不能记录 token/Cookie/兑换body。无必要不增加用户跟踪。
- 独立自动化按上表；总体验收用真实 IAB、假供应商先覆盖无Cookie直开/过期重输、刷新记住资格、Cookie禁用、地址栏分享fragment不变、编辑器草稿/预览返回、桌面窄屏键盘、后台恢复、到期麦克风/播放释放、两tab更新边界。worker测试覆盖 forged Cookie/伪Origin/直接WS、握手中到期、过期帧不转发、timer清理及配置失败关闭。
- 最后才在已获授权的隔离资源上做有界真实语音验收；假上游通过不代表真实多人供应商隔离通过。本轮没有执行这些实现或浏览器/真实provider测试。

### 独立的多人隔离阻塞

当前每次WS仍发送同一个固定 device。`Client-Id`随机、关闭长期记忆、浏览器context隔离，都不能证明不同访客/多tab在供应商端互不串话。[既有预览资源记录](online-voice-preview.md)只确认1agent/1device受控试玩；[归档资源分配提案](public-voice-launch-proposal.md)中的动态独立device/回收仍未因邀请码设计获批。

**邀请码可独立实现和验证，但不能作为多人上线验收许可。** 多人开放前须另有被批准并真实验证的设备/上下文隔离方案；不能因“不限频”而复用共享device作多人方案，也不把管理key交给浏览器。若该方案需要新provider、DB/DO、托管回收或scope变化，仍需用户确认；本设计不选择这些方案，不重新付费probe。

不限频不等于费用封顶：有效期内可多次/多tab建立连接并消费。已有每连接180秒及到期关闭不是全局预算。`closed`或密钥轮换能在配置实际生效后拒绝新请求；旧连接仍沿原deadline，供应商在途消费和部署传播不保证即时停止。访问费用策略继续单独暂缓，不加入预算、限流、供应商额度或资源回收承诺；已有[额度调查](linx-quota-investigation.md)仅作边界证据。

## 本轮设计核验记录

核对上述源码路径、CF配置及旧提案差异；查询官方 Web Crypto、Worker-first、WebSocket、secrets 与 Cookie/WS 标准资料（2026-10-25）。仅文档变更，不声称已实现/测通邀请码，也不改变已批准主架构。后续顺序：root实际review本设计 → 用户确认核心选项/范围 → 才分派实现与独立验收；生产启用另经验证与发布流程。
