# 浏览器 Device 最小接入设计

2026-11-01；基线 `916d77cdb4044069e53d7c9f61b2a2b68d5bdcbf`。**仅设计，未实现或新增真实测试。** 产品语义已确定：一个站点浏览器身份对应一个供应商 Device；同身份后连接自然顶旧，不加锁、不新增多标签页提示。案件有效加载成功、展示背景页时即后台准备Device；开始对话时准备已完成就连接，否则等待同一准备任务。Cookie 跨局保留，开始游戏不等于新建 Device。

## 推荐：签名 Cookie＋供应商绑定状态，不新增 DB/DO

服务端签发 Cookie，payload 为 `{ v, environment, deviceId, clientId, issuedAt, expiresAt }`；Device的伪MAC和Client UUID均由服务端随机生成；前端不需要读取HttpOnly Cookie或取得Device身份字段。HMAC 签名防止客户端任意指定别人的 Device；本版不在 Cookie 放管理 key 或设备 token，因此无需为凭据另做 Cookie 加密。Cookie 是浏览器身份凭证，不是账号、真实 MAC 或活跃连接租约。管理 key 和新签名密钥仅保留在 Worker secrets。

生产建议 `__Host-lie-device; Secure; HttpOnly; SameSite=Lax; Path=/`，不设 Domain；有效期建议180天，在语音准备时续期且保留同一 Device/Client 身份。仅 loopback 开发使用不同名称、不同环境签名密钥和非 Secure Cookie，以兼容现有 HTTP 开发入口，不能接受生产 Cookie 跨环境使用。清 Cookie、无痕结束、过期或签名密钥轮换后可能产生新身份，不恢复硬件身份。

供应商仍保存绑定状态，所以这只是“不新增应用映射数据库”。不依赖 Worker 内存缓存、全局 Map 或同源标签页共享 Promise 来保证服务端状态。

## HTTP 与准备流程

| 接口 | 职责与边界 |
| --- | --- |
| `GET /api/voice/status` | 保留配置可用性检查；缺失/失效Cookie时签发新身份，需续期时保留原Device/Client。返回`{status:"ready"}`及必要`Set-Cookie`，`no-store`；不发OTA/管理请求。`ready`只表示配置可用。 |
| 新增 `POST /api/voice/prepare` | 空body，只接受当前签名Cookie；校验同源Origin、无query，不接收客户端Device/token。按该身份OTA，未绑定才激活绑定固定Agent，再OTA确认token。成功204；无效/缺Cookie为409 `{error:"identity-required"}`且无provider副作用；非法输入400、跨源403、供应商失败502、准备超时504。 |
| `GET /api/voice` WebSocket | 保留同源Origin/无query、不新增subprotocol。验证当前Cookie及配置环境后OTA取token，只有已绑定身份才连接固定官方WSS。不跟随OTA URL，不用明文WS；未绑定时503，下一次显式准备处理，不在WS窗口冷注册。 |

请求示例（浏览器自动处理Cookie，正文不含身份或凭据）：

```http
GET /api/voice/status
# 200 {"status":"ready"}; 需要时附Set-Cookie，Cache-Control:no-store

POST /api/voice/prepare
Origin: https://lie.agency
Cookie: __Host-lie-device=<server-signed-value>
# 空body；成功204，Cache-Control:no-store

GET /api/voice
Origin: https://lie.agency
Cookie: __Host-lie-device=<server-signed-value>
Upgrade: websocket
# 无query/自定义subprotocol；有效且绑定的当前身份才返回101
```

### 首次 Cookie 竞争：接受候选身份，不伪造全局同步

两个无Cookie标签页并发status可能签发A/B两个候选，后响应会覆盖Cookie；**不声称一次GET就锁定全浏览器身份**。当前有效签名Cookie是身份权威，页面的`prepared`仅是减少重复准备的优化hint。A的prepare若已开始才被B Cookie覆盖，A结果仍属于A，不移给B、不做回滚解绑；它可能成为孤立候选，进入人工资源核对。

随后WS按其实际Cookie B重新OTA：B已绑定就连B，符合当前身份语义；B未绑定就失败，不临时创建，不借用A token或人物context。下次用户显式对话动作先重新status/prepare同一个B身份。HTTP准备缺Cookie/失效时，可在同一20秒总预算内最多重新bootstrap一次；再失败停止。WS失败不自动重拨，沿现有错误反馈。首次候选竞争期间不保证不同候选马上互顶；它们是不同身份，旧候选连接仍受原600秒/页面关闭生命周期约束，不为此加活跃voice锁或新UI。

未采纳“前端expected identity tag＋WS subprotocol”备选：它约束JS曾准备的候选，但这不是已定产品要求，也不消除孤立资源，反而扩大协议和voice包修改；本方案不新增tag字段或修改voice包。

准备窗口建议客户端 ensurePrepared 全链20秒（包括身份GET和prepare POST）、服务端prepare供应商总计18秒（单次请求最多8秒且受剩余总预算约束）；失败立即停止，不循环重试。现有 channel 的10秒握手窗口保留，单独覆盖每次 WS 的 OTA、上游 upgrade、hello/MCP；网关该阶段总预算应小于客户端10秒，建议9秒。用户后续要求验证跨Device共用原固定token及有效期/刷新；这部分尚未实证，见[token研究](token-study/study.md)。正常prepare与WS各一次OTA是目前已实现的保守取舍，而非供应商已证实的必须要求：不为省这次请求引入跨实例 token 缓存或把 token 放浏览器。

已测 D2 OTA＋bind＋OTA约4.034秒、WS到ready约2.102秒，整体6.139秒，仅单样本，不是超时可满足的 SLA。准备完成不意味着麦克风已准备或语音已ready。

### 首次并发、未知响应与身份稳定

同 Cookie 的两个 prepare 可并发；没有应用 active lease。它们必须始终使用相同 Device/Client 和固定目标 Agent，不能因超时换 ID、误解绑或删设备。官方 bind 对激活码已使用/设备已绑定可返回400/409，**不能当成幂等成功**。

建议每次 prepare 最多一次 bind；bind 成功后 OTA 确认。遇400/409或响应丢失，只允许一次有界 OTA 核对，并在需要时用供应商受支持的绑定归属查询确认该 MAC 属于配置的 Agent；无法确认则失败，保留 Cookie，下次用户操作仍从同身份 OTA 开始。不做跨账号枚举、不自动 rollback 解绑。新身份与既有设备冲突不能直接认领，具体冲突/归属核验应在实现与 fake 中覆盖，未证明的重复绑定行为不当成契约。[OTA](https://linx.qiniu.com/docs/xrobot/platform/OTA)、[设备 API](https://linx.qiniu.com/docs/xrobot/api/device)

## 前端生命周期与取消

建议把 live VoicePort 在 `main.ts` 的应用作用域创建一次，注入各 controller；不能继续每次 `createController()` 都新建准备状态。每个 Conversation 的 scope、mic/player/channel 仍是独立局部对象。VoicePort 增加 `prepare(): Promise<void>`，demo 实现为空操作；live port内持有当前`generation`、`preparedGeneration`和`pending={generation,promise}`，只合并**本页面应用实例**的准备调用，跨标签页不声称共享Promise。每次发起新的准备attempt递增generation；仅当前attempt成功能写preparedGeneration，旧pending的finally只能清除自己代次的pending。generation只用于本页异步归属，不宣称能感知HttpOnly Cookie被其他页面更新。

- 有效`controller.load()`成功发布背景页（intro）后即触发`voice.prepare()`；失效、失败或dispose的加载不触发；`restart()`展示新背景时复用准备，`start()`不再首触发。不阻塞背景展示或开始游戏、不申请麦克风/AudioContext、不创建 WS、不发送 ASR，不启动审问计时；后台失败只记录为未准备，不新增提示流程。
- `Conversation.open()`先await同一prepare：pending就等、已prepared则跳过；未准备/上次失败时由这次显式对话动作触发一次新准备。live内部捕获本次attempt generation，完成后先检查scope仍current再建mic/player/WS。HTTP有界bootstrap之外不自动循环重试。
- 取消当前 Conversation 只使该 awaiter 的 scope/epoch 失效，不 abort 共享 prepare。准备返回后先检查 `isCurrent()`，失效者不创建 mic/player/WS。换局可复用已准备状态与同一个 Cookie；准备请求取消/迟到只涉及本身份，不能清理其他浏览器资源。
- 页面卸载可能中止fetch，但不依赖服务端必定观察到断连，也不新增公共取消整个VoicePort的接口。已经成功的绑定保留给同浏览器，不因为消费者离开而解绑；本地20秒、服务端18秒上限仍有效。
- prepare 成功后沿用既有 mic/player/channel 并行启动，**全部ready后才计游戏预算**。WS建立失败仅在其捕获的generation仍匹配当前preparedGeneration时使该准备失效并递增代次；旧Conversation的失败不能清掉新代次状态。下次用户显式重试重新准备，不自动重连。同身份自然顶旧时，旧页沿现有 close→停止采集/播放路径，不新增UI。

## 需确认的运维边界

建议保留固定通用 Agent，仅用在线管理 key 完成首次绑定；不在运行时创建 Agent。设计供用户审阅不阻塞已授权的接入推进；在线管理key作为Worker secret、新独立Cookie签名密钥及下述运维策略仍需进入具体配置/发布审查，不在本设计里执行。原固定 `LINX_DEVICE_ID/LINX_WS_TOKEN` 不再承担所有用户连接身份；迁移与环境隔离另由发布方案核定，不能默认两套 token 能隔离同 Device。

建议180天 Cookie、首版无自动解绑 TTL：cookie 过期不等于供应商通话结束，`lastConnectedAt` 的完整性/时效也未验证。由总协调指定资源管理 owner，发布前保存配置 Agent 的既有设备保护清单；发布后7天内完成首轮人工清点，此后每周复核。超过30天未连接只列为人工候选，必须确认归属、无当前消费者及终止状态后才清理；不能只按前缀或时间直接删除。若清单/归属无法可靠核定，暂停扩大新身份发放并补齐登记/查询能力，不能静默无限积累。以上周期、责任与暂人工回收方案待用户确认，不代表已有自动清理或硬容量上限。

## 文件范围、离线检查与真实验收申请

| 范围 | 最小变化 |
| --- | --- |
| `apps/gateway/src/index.ts`＋新增 `browser-device.ts` | Cookie验证/签发、prepare、OTA与绑定核对；固定 WSS、同源限制、600秒及64KiB保持。 |
| `apps/gateway/cloudflare.config.ts`、gateway tests | 私密管理/签名bindings及环境分离；Cookie与供应商 fake，不写真实secret。 |
| `apps/web/src/main.ts`、`application/voice.ts`、`demoVoice.ts`、`liveVoice.ts`、`controller.ts` | app级VoicePort、后台prepare、共享pending/ready、scope取消与现有失败反馈。 |
| Web对应测试 | 案件加载成功展示背景即触发、失效/失败/已dispose加载不触发，但不阻塞/不计时，不申请mic或WS；同页重复调用/换局合并、旧finally/旧open失败不清新代次；取消旧scope后准备迟到不建通道；失败仅显式重试；顶旧沿原清理；准备延迟后再开语音的既有权限/播放路径不得假定已验。 |

关键 fake：无Cookie先只签发无provider副作用；两tab候选A/B覆盖后WS只用当前Cookie B：B已绑定可连接，B未绑定拒绝且不借A凭据/不误解绑；旧响应/旧finally/旧open失败不污染新generation；签名/过期/环境/Origin/query拒绝；跨身份Device不同、同身份始终稳定；两个gateway实例同身份首次并发；bind400/409/响应丢失经有界核对或明确失败，不换ID、不误解绑；OTA token不进入Cookie/body/log；同Device新WS踢旧、不同Device互不影响；准备18/20秒与WS9/10秒边界、取消/晚到、600秒与帧限制回归。Fake不替代真实供应商行为。

实施按已授权接入方向推进；密钥配置与真实测试窗口另行协调。拟在隔离预览做最多2个专用浏览器身份/Device、1个已确认测试Agent、最多6次合成短问/无mic/总300秒＋60秒清理：后台准备后开语音、同身份多tab自然顶替、不同身份并存、切人/重开身份稳定、首次准备并发与未知响应按批准范围覆盖。无需创建真实生产 Device 来做首次验收；不把现有probe结果当该HTTP/浏览器接入已通过。服务端对象和浏览器关闭分别记录；清理只本次明确拥有资源，未确认项保留记录。
