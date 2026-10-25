# 有效期邀请码访问设计

> **当前状态：用户明确暂缓实施（2026-10-25）。** 因额外复杂度先暂停，专项chat保留供以后讨论；下文是已形成的设计及历史批准，不再构成当前实施许可。保留候选代码/证据，不合入、不配置或启用，待用户明确重启。

2026-10-25修订；源码基线 `76cc04c43c63c4189f88b914a0ffd12cdc6c4322`。**用户已确认核心范围，并授权按实现简单度选择到期行为；root审查后可排期实现。本轮仅修订设计，未改应用、secret、资源、服务或部署。**

采用最小方案：离线签发共享邀请码，默认签发后14天统一到期；Worker兑换同源HttpOnly Cookie。新开局和每次新WS检查有效期，已建立WS沿用既有180秒上限，不按邀请码到期强断。不做当前局续码恢复、账号、数据库、DO或频率控制。

## 已确认与本轮选择

- **用户批准**：邀请码可共享、可多人重复使用；默认14天，可签发指定截止时间的码。首页、案件介绍、编辑器、草稿保存、生成/打开分享链接公开；官方案件、分享案件、编辑器实际试玩都需邀请码。不限制频率、局数、并发或日额度。
- **用户明确删除**：续码恢复当前局，以及为此保留/持久化局进度的功能。刷新仍丢局，无云存档。
- **用户授权按简单度决定**：到期是否立即停。本设计选择“到期拒绝新开局/新WS，已建WS自然结束”，比较见下表；不用再次请求整案批准。具体实现仍须root审查，供应商资源/生产启用仍有独立门禁。
- 不增加一次性消耗、绑定个人或精准逐码撤销；无服务端使用记录，不能声称支持这些能力。

| 到期路线 | 改动与体验 | 选择 |
| --- | --- | --- |
| 仅新开局/新WS验exp，已建WS沿既有180秒 | 新增请求边界校验；不改relay计时或逐帧处理，不加页面到期计时器、暂停/恢复状态。到期后下一条WS不可建立。 | **采用，最简单。** |
| 到期立即停止正在进行的语音/游戏 | 额外exp关闭timer、双向逐帧截止检查、握手到期Abort、UI到期同步/后台恢复及资源释放竞态；即使不做恢复仍需额外关闭状态。 | 保留为未采用备选，不实施。 |

**180秒是每条已建立WS的原有上限，不是整局保证。** 同一局切人、手动停止后重开、断网重连都会建立新WS，均重新检查；到期后不能因为“已经开局”继续无限建立新连接。没有新增连接频率或次数限制。

## 当前代码事实与保护边界

已读[Worker](../apps/gateway/src/index.ts)、[CF配置](../apps/gateway/cloudflare.config.ts)、[开发网关](../apps/gateway/vite.config.ts)、[Application](../apps/web/src/Application.vue)、[App](../apps/web/src/App.vue)、[main](../apps/web/src/main.ts)、[liveVoice](../apps/web/src/application/liveVoice.ts)及controller/voice错误处理。

当前应用鉴权暂关；voice/status只按三项供应商配置返回ready/unavailable，WS要求准确同源Origin、无query，使用固定provider device/agent/token。现有上游握手10秒、每连接180秒、每帧64KiB保留。每局审问时长属于玩法，不是供应商消费预算。

游戏和答案仍在浏览器，静态JSON/素材可公开读取，正常UI限制实际试玩，Worker强制保护真实供应商通道。不能防手改JS、离线运行或inspect故事；不把游戏规则迁入服务端，也不把provider管理材料交给前端。[旧公开上线提案](public-voice-launch-proposal.md)的动态设备、预算/限流等未因此获批。

## 用户路径与到期的完整边界

1. 访客浏览/创作/打开分享介绍照常。点击“接案，开始调查”或结果页“重新开始一局”时查access/status；无资格则当前页弹出“输入邀请码”，有资格开始新局。官方、分享、编辑器预览共用门槛。开发fake试玩可显式mock，生产无demo绕过。
2. 粘贴完整邀请码，只去首尾空白，不接受URL；POST兑换成功后复查Cookie资格，清空输入并继续**新开局**。不改变路由，保留原query、分享`#game=…`、编辑器预览内容和草稿。无效/签名错提示“邀请码无效”；签名有效但过期提示“邀请码已过期”；网络错误可重试，不放行、不回退fake。Cookie不被保存时提示启用Cookie。
3. 在有效期内，原有游戏动作、切人/重连/重开继续；每次新WS仍服务端验码。浏览器不能用本机时间、已查过的status或“已有一局”延长服务端资格。
4. **到期瞬间不主动操作已开始的局或WS。** 已接通的语音可继续到该连接原本的180秒上限（也可能被用户结束、切人、网络/供应商提前关闭）；本地转写、指认、结案和返回仍按原玩法执行。页面不加exp timer，不承诺到期瞬间停音或整个局都能问完。
5. 到期后第一次尝试新开局/新WS被拒绝时，正常UI停止相关采音/播放、dispose旧controller并回到该案件介绍，提示“邀请码已到期，请输入有效码重新开局”。旧局进度不保留、不自动判胜负；新码成功后新开一局，不提供暂停、续局或补时。若之前已结案，重新开局同样检查资格。取消输入留在介绍；尚未尝试新连接的旧局可直接本地指认结束。
6. 不增加局内换码/恢复入口，也不为禁止其他tab正常共享Cookie而新增每局授权标记或跨tab状态。每次新WS只验证请求当时的有效Cookie；若另一个tab已兑换有效码，按正常Cookie行为生效，不额外强制丢弃该tab尚未结束的局。这是原页面仍在运行，不提供保存、恢复或补时功能。

到期后仍保留页面原有内存直到按上述边界丢弃，并非新增“保留待续局”能力。现有导航/刷新照常清理；迟到回包用既有epoch/dispose隔离，不带入新局。

## 令牌格式：两段不是JWT

原提案的 `base64url(payload).base64url(mac)` **不是标准JWT/JWS compact**。常见签名JWT使用三段`header.payload.signature`，JWS规定签名输入为编码后的header与payload。[RFC7515 §3.1](https://www.rfc-editor.org/rfc/rfc7515.html#section-3.1)、[JWT定义](https://www.rfc-editor.org/rfc/rfc7519.html#section-3)

本设计保留自用有限的两段HMAC协议：只有本项目CLI签发和Worker校验，无外部JWT互操作需求；固定版本/算法/字段，无JOSE算法协商、证书或远程key发现，也不加auth SDK。密码算法仍用标准Web Crypto，不自造加密算法。代价是编码/输入校验/协议维护由本项目负责，不能交给JWT库或通用JWT工具验证；若以后需要第三方验证或现有JWT基础设施，再改标准JWT并评估库，而不是把两段码叫JWT。

固定payload：`v:1`、`purpose:"invite"`或`"session"`、`aud`准确公开origin、`iat`/`exp` UTC Unix秒安全整数、128位安全随机nonce。HMAC-SHA-256使用256位安全随机根密钥，签名覆盖固定目的域前缀及原始payload编码字节；算法不由输入选择。严格校验分段、base64url、字段类型/版本/目的/audience和 `iat <= now < exp`、`exp > iat`，不加过期宽限；nonce不代表使用记录。

Worker原生`crypto.subtle.importKey/sign/verify`，不手写MAC字符串比较；CLI与Worker复用同一实现和固定向量。[Cloudflare Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

兑换invite后签发独立purpose=session令牌，换iat/nonce但保持原exp/aud，分别使用不同签名域。不能用invite直接充当session，也不能session再兑新码；重复兑换不延期，无滑动续期。密钥/供应商token不进入载荷，载荷可读不是加密。

默认 `exp = 签发iat + 14×24小时`，不是首次使用起14天。发码可用显式带时区截止时间覆盖，CLI同时输出UTC和北京时间（Asia/Shanghai，精确到秒，截止秒不含）。最终判断由Worker服务器时间，忽略客户端传now；发码机需校时。

## 同源、Cookie与本地路径

### 生产

CF配置将Web构建资产和Worker一起部署；浏览器页面、`/api/access/*`、`/api/voice/status`都在同一HTTPS origin，WS用同host的WSS `/api/voice`。Worker保留准确Origin检查；不开放CORS或任意上游。`/api/*`已Worker-first，新增access端点无需全站改Worker-first；其他静态资产仍公开，不能依赖SPA fallback鉴权。[Worker-first路由](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)

生产Cookie：`__Host-lie_access=<session>; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=<剩余整数秒>; Expires=<exp GMT>`，不设Domain。寿命以签发时Worker时间计算，Worker仍每次验exp，不信任浏览器删Cookie时机。浏览器原生WS按Cookie规则附带凭证，不在query、fragment、subprotocol或JS存储传token。[Cookie语义](https://httpwg.org/specs/rfc6265.html#section-4.1.2)、[Cookie属性/前缀](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)、[WS凭证握手](https://websockets.spec.whatwg.org/#opening-handshake)

### 固定开发环境：源码核实，不冒称已运行验证

[main-preview脚本](../scripts/main-preview.mjs)设置`LIE_GATEWAY_PORT=8788`、`LIE_VOICE_GATEWAY_URL=http://127.0.0.1:8788`并启动Vite Web在8787。浏览器访问`http://127.0.0.1:8787`；现有[Web Vite配置](../apps/web/vite.config.ts)仅将`/api/voice`前缀HTTP/WS代理到8788（包括`/api/voice/status`）。**`/api/access`当前没有反代，实施必须补这一前缀**，否则会命中Web开发服务而非认证Worker。

代理需保留浏览器的原始Host/Origin/Cookie，HTTP响应Set-Cookie回到8787；不得把浏览器改为直连8788后开放CORS。现有配置未启用changeOrigin；实施需用本地Worker测试+IAB证明穿过cf/Vite后request.url与Origin实际一致。若宿主重写URL，只允许显式development/loopback配置的预期Web origin并用该origin验aud，不能无条件信任Forwarded/X-Forwarded-Host或放宽生产Origin。

Cookie **不按端口隔离**，HttpOnly和`__Host-`也不提供端口隔离。`127.0.0.1:8787`与`:8788`/同host其他port可能收到同一Cookie。aud含origin能阻止正常验证器在错误端口接受它，不能阻止那个服务收到并窃取后拿去原origin重放。[RFC6265 §8.5](https://httpwg.org/specs/rfc6265.html#section-8.5)

开发建议：显式development、仅绑定loopback时，使用独立 `lie_access_dev` 名、开发密钥、开发aud和host-only/HttpOnly/SameSite=Strict/Path=/ Cookie；纯HTTP调试不依赖Secure/`__Host-`在loopback的浏览器例外。这些区分避免误用生产资格，**不能隔离同host恶意端口**。不在共享不可信host调试，不使用生产码/密钥；需要强隔离时另用独立host+HTTPS测试，不偷改现有服务。开发bypass/mock只能显式启动配置，不接受URL/header绕过，生产构建禁止。Cookie与代理真实行为留实现验收。

## 端点、WS与错误

所有认证响应no-store，不启CORS，禁止query，GET拒绝不匹配Origin或cross-site（允许正常同源无Origin）；POST要求准确同源Origin和JSON。请求体流式上限4KiB、码上限1KiB，超限413；这是输入安全边界，不是频率控制。

| 端点 | 行为 |
| --- | --- |
| `GET /api/access/status` | 200 `granted + expiresAt + serverNow`或`required + serverNow`；缺失/过期/损坏Cookie不授权。访问配置错误/closed为503；无上游。 |
| `POST /api/access/redeem` | `{invite}`有效：200+Set-Cookie+expiresAt/serverNow；无效401 `invite_invalid`，签名有效但过期401 `invite_expired`；解析400、同源403、配置/closed503。失败不清掉仍有效旧Cookie。 |
| `GET /api/voice/status` | 先验访问资格，无资格401 `access_required`；有资格保留ready/unavailable，无上游。前端不得把401一律压成check-failed。 |
| `GET /api/voice` WS | Upgrade/准确Origin/无query→验session→语音配置→固定上游。未授权401，且上游调用为0；不接受客户端device/token。 |
| 静态/health/未知API | 保留现有公开内容、缓存、health及404，不误回SPA HTML认证成功。 |

**握手边界**：每次启动上游前验`now < exp`，保留现10秒Abort。上游返回后、发101前再验一次；若此时已过期，关闭已取得的上游socket并返回401，不建立浏览器relay。握手跨exp可能已发供应商请求，不保证零费用；不新增剩余至少N秒门槛。成功101后只保留原180秒计时、64KiB和现有错误/关闭清理，不加exp计时、逐帧校验或4001协议。

浏览器非101可能只得到通用WS失败；失败后查access/status判别到期/普通故障，不依赖WS HTTP body。到期则丢局回介绍重新开局；网络/503保留现有普通错误体验，不自动无限重连。准备新WS前status已拒绝时不启麦克风；请求与握手之间的竞态失败沿现有close清理收音/播放，不能保证每次竞态都从未短暂请求麦克风。

新Cookie、密钥轮换、closed或新部署不保证立即杀掉旧WS；不建跨连接注册表。普通网络/运行时也可能提前断线。[Cloudflare WS生命周期](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

## 发码运营与最小实现范围

拟离线Node CLI `keygen/mint/inspect`，不建在线发码接口/管理账号。密钥从0600私密文件或stdin读取，不放命令行值、仓库或聊天；mint将码和期限写操作者指定的0600文件，inspect只显示非秘密字段/验证结果。维护者自行分发，不自动发消息。

本机已只读核实可用Node：常规PATH为24.17.0，**低于项目要求**；`/usr/local/bin/node`是16.14.0。已有持久运行时 `/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node` 实际`--version`为24.22.1，并验证subtle.importKey/getRandomValues/base64url入口存在，可用于CLI；未生成真实key/token，未安装/修改环境。实施使用该兼容运行时，不把所有“Node 24”当符合项目engine。

根密钥Worker secret `INVITE_SIGNING_KEY`，访问模式`ACCESS_MODE=invite|closed`；缺失/非法配置失败关闭新游戏/WS，不沿用当前noauth默认。closed保留浏览创作、拒绝兑换和新连接，非频率限制。生产切换和固定本机服务变更须协调owner，不能本次自行重启。[Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

不记录token/Cookie/兑换body；不放localStorage/sessionStorage、游戏分享fragment/query或Referer。query脱敏不等于其他字段安全，必须检查诊断输出。无DB不能精准撤单码；紧急换根密钥使旧码/旧Cookie在新请求失效，影响全部访客，不承诺旧WS即时停止。

| 批准范围内的拟议模块/owner | 责任与独立验收 |
| --- | --- |
| 共享纯TS token模块 | 固定有限HMAC编解码、签发/验证invite与session；标准WebCrypto，不依赖Vue/CF。CLI与Worker复用向量，覆盖篡改/错purpose/aud/未来iat/恰好exp/坏长度/坏类型，不写两份协议。 |
| Gateway：`src/access.ts`、`src/index.ts`、cf config、tests | 端点、Cookie、Origin、请求上限、握手双次有效期检查；原relay计时不变。workerd+假上游测无权零调用、握手跨exp、已建WS跨exp保持原关闭规则、原安全/缓存回归。 |
| Web：Application/App、access port、liveVoice/voice错误映射、controller必要接线、Vite config/tests | 接案/重开门槛、拒绝后dispose→介绍、新码新局、补access代理。不加pause/resume状态或到期timer、不改game-core。fake覆盖三类play入口、正常多tab Cookie共享、网络/401清理与迟到事件。 |
| CLI：scripts/invites与文档/必要package命令 | Node24兼容运行时离线签发、默认14天、指定时区日期、受限文件输出及跨运行时验证；无远程API。 |

暂不新增npm依赖或Node兼容flag；共享模块位置/构建入口由实现owner在原生WebAPI边界内确定，锁文件若确需调整由集成者串行管理。模块接口先对齐，具体文件归属不重叠。

独立IAB验收覆盖生产等价HTTPS Cookie、固定loopback反代、无Cookie直接WS、Cookie禁用、invalid/expired、分享fragment/编辑器草稿不变、所有play门槛、已建WS跨exp但新WS拒绝、拒绝后换码全新局/正常多tab Cookie共享、麦克风/播放清理与窄屏键盘。真实provider仅在另外获授权的隔离资源上有界验收；本轮未运行应用或这些测试，文档检查不冒充其通过。

## 独立门禁与历史

当前provider固定device仍未证明多人/多tab上下文隔离；随机Client-Id和关闭长期记忆不能替代真实验证。[既有预览](online-voice-preview.md)仅1agent/1device受控试玩。邀请码能独立实现，但**不是多人正式开放许可**。动态设备/新provider/DB/DO/资源回收仍另案确认，不因共享多人码获批而默授。[费用调查](linx-quota-investigation.md)的未知不改写为已解决。

不限频不是费用封顶；有效期内可反复建立连接，临近到期已接通的WS可继续最多原180秒。closed/换密钥只在实际配置生效后的新请求阻断，不保证在途消费立即停止。费用/预算/供应商额度策略仍单独暂缓；本设计不添加软限流或硬消费承诺。

[旧完整设计、来源和未采用备选索引](archive/2026-10-25/invite-access/README.md)保留默认7天、立即停与续码恢复的原文，明确已被本版替代。最新用户决定记录在本文开头，root维护中央计划/决定证据；本轮不修改中央文档。原提交ref `46ae7cb11902977470d121843b3e45ecd1da9241` 保留。
