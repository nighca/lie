# Browser Cookie Device 发布就绪方案

2026-11-01。**方案待配置/真实验收 turn；不是发布批准或已完成回执。** 本轮 source 使用 required `LINX_WS_TOKEN` 首握；仅初次HTTP401取消该body后，按同一个Cookie Device做一次OTA并重握一次，三段共用原9秒。403/网络失败/已升级后断线均不刷新，不缓存或写回secret。原固定本地token跨新Device的窄范围证据另见[token study](token-study/study.md)，不能推出生产同一性/TTL。本方案不读取密钥、不配置线上、不发真实请求、不启动服务。

实施与 fake/native 浏览器证据见 [acceptance](acceptance/README.md)，HTTP/时序设计见 [implementation](browser-device-implementation.md)。本文只把剩余运行条件变成可核对的步骤；不把 status ready、build/dry-run 或 fake 顶替当真实供应商通过。

共享首握这轮的离线影响检查：gateway/workerd 11 files / 72 tests通过，gateway typecheck通过；包含正常首握零OTA、401一次恢复及body取消、403/网络/已升级后close不刷新、总9秒及取消/迟到upstream回收。原[浏览器验收](acceptance/README.md)明确针对此前cf375958（每WS OTA）身份，未冒充本轮新浏览器/真实provider通过。Web与media源码本轮未改；最终clean build的SHA/结果由发布owner回执保全，本文件不伪造已完成。

## 发布前必须补齐的状态

| 项目 | 当前事实 / 发布前证据 |
| --- | --- |
| 产品源码 | Cookie Device 接入已实现，本地 tests/typecheck/build 和 fake 浏览器已过。需总协调 review 后走串行 integration/publication。 |
| 新 Worker secrets | 源码声明存在；实际 local/production `LINX_API_KEY`、保留的 `LINX_WS_TOKEN`、`VOICE_DEVICE_COOKIE_SECRET`、目标 `LINX_AGENT_ID` 的可用性尚未由本任务核验。不能先 push 触部署，再补 secret。 |
| 命名空间/Agent | 编译默认 `VOICE_DEVICE_ENVIRONMENT=production`；preview/local 必须确定独立 namespace/签名密钥与已批准的目标 Agent。未决定变更 Agent，也未创建任何新 Agent。 |
| 真实接入 | 真 Cookie→prepare 注册/绑定→WS 与多身份/同身份行为需下面的有界 turn；既有低层探针不能替代这套 API 接入验收。 |
| 共享消费者 | 总协调回执：5544用户consumer已释放，原owner核无listener/原PTY Unknown process，未执行stop；该旧前端兼容阻塞已解除。8787/8788消费者/维护窗口仍需新turn，旧PID不作当前操作依据。 |
| 资源与回滚 owner | 总协调在 turn 中点名实施/资源 owner、secret 配置 owner、发布/回滚 owner；未点名和保全清单前不扩大发放身份。 |

## 凭据、目标与兼容迁移

| 配置 | 具体准备与核验 |
| --- | --- |
| `LINX_API_KEY` secret | 指定唯一获准来源与目标账号/Agent；先确认所需 device bind 与目标 Agent 设备归属查询权限，选择可满足这些操作的最窄现有权限。不因迁移自行新建/扩权 key。只让应用或获准 operator 消费，不打印/复制到报告。 |
| `VOICE_DEVICE_COOKIE_SECRET` secret | 新独立密码学随机材料，至少32 **UTF-8 bytes**；不复用 API key/WS token/access token。开发与生产不同。来源、写入目标、保存/恢复责任由配置 owner 记录，交接只记已配置/长度校验布尔值，不记原文。首版没有多 key 验签窗口。 |
| `LINX_WS_TOKEN` secret | 保留现有共享首握凭据；新source仍要求非空，不能因为401有OTA恢复就留空。原固定本地token的实测不是生产值同一性的证明；由获准配置owner核目标环境可用性。401取得的新token只用于本请求，不更新此secret。 |
| `LINX_AGENT_ID` secret | 默认优先核现有获准通用 Agent，确认目标账号、context-tool 契约、无跨游戏角色固化/不当记忆配置和现有消费者。若需新 Agent 或改 Agent prompt/模型/记忆，另行确认，不能把 Device 接入授权当改 Agent 授权。 |
| `VOICE_DEVICE_ENVIRONMENT` text | 正式构建从 `LIE_VOICE_ENVIRONMENT` 取值，默认 `production`；dev/验收采用明确不同值。记下实际构建值并核部署输出/serving 绑定，不把 shell/env 示例当已生效。改变 namespace 会使旧 Cookie 失效，导致新 Device 候选。 |
| 旧 `LINX_DEVICE_ID` / `VOICE_ACCESS_TOKEN` | 新 source 不读取这两项；先留在旧环境的既有私密配置中供旧消费者/回滚使用，不删除、不打印、不自动转换 Cookie。新管理 key 不能被放进任何旧 WS-token 字段。 |

Cookie 不是密文：只有签名的 Device/Client 身份、版本、环境及时间戳，没有 token/key。初次迁移不把旧固定 Device 分配给所有 Cookie；新 Cookie 随机生成其伪 MAC 与稳定 Client UUID，prepare 绑定到选定 Agent。正常WS不再先OTA证明绑定，签名Cookie也不证明provider已绑定；该路径是否接纳未准备Device由供应商决定，WS路由本身不会bind；401恢复中的OTA也可能登记未绑定候选，不能当纯read，需纳入资源核对。新 Device 必须入资源 owner 的受保护清单。现有 Agent 中所有旧 Device 默认属于既有消费者，不因“名字像测试”而回收。

从旧 Agent 切换到另一个 Agent 时，已有 Cookie Device 可能仍归旧 Agent；prepare的归属核对会拒绝未知/错误归属，不会自动解绑再绑；共享token的WS首握本身不保证拒绝，不能把prepare检查当每WS强制门禁。先由 owner 决定保留原目标、排空迁移或批准一次身份 namespace 变更并安排旧资源回收，不能直接只改 Agent ID 试错。轮换签名密钥/namespace、清 Cookie 都不删除供应商 Device，必须记录可能增长的孤立候选。

## 8787 / 8788 / 5544 消费者保护

以 [development](../../development.md) 的现行登记为入口，在实际 turn 重新核对：owning-main launchd 管理 Web8787/Worker8788；5544此前复用8788，但本轮总协调已确认用户consumer释放，owner核无listener/原PTY Unknown process（未stop），故不再等待其升级。**本地 main SHA 更新就可能触发 runner 重启，早于远端 push/CD**；文档提交也可能触发重启。不能把“未 push”当无本地影响。

发布 owner 在 local main 更新前取得新的维护窗口，确认无活跃语音，并保全上述5544释放回执。未来礼物案试玩基最终main重新申请服务/消费者窗口，不恢复旧dirty前端或将礼物案内容草稿并入此批。案件load如今即触发真实prepare，未来重开不能被描述为零provider请求的纯浏览。新 gateway 不兼容旧客户端“直接 WS、无 status/prepare”的启动流程：补齐 secret 仍可能得到409或未准备失败。本次5544 consumer释放已满足该兼容条件；未来若保留其他旧协议消费者，须先确认其前端兼容。若要暂留旧协议后端，必须另获明确隔离服务/端口/配置授权。不自行加 legacy bypass、起第二个8788、依赖127.0.0.1跨port碰巧已有 Cookie，或刷新用户 tab。

旧8787已加载页面同样可能保留旧 JS。窗口中说明用户何时需要自行/授权刷新到新契约；不能用刷新所有标签页替代消费者确认。不停止5544/5198/5177等其他服务，不改 proxy 目标/launchd配置/`.dev.vars`，除非本次 turn 具体列明。

local 私密配置由原环境 owner在获准维护 turn 内补齐并保留旧项；不得从其他 checkout复制 `.dev.vars`/key 或把生产签名密钥拿到 preview。若无法在 owning-main 自动跟随前保证新配置和仍保留消费者兼容，暂缓 integration，不靠一次启动失败后的临时修补。

## 有序上线步骤与责任

1. **总协调冻结候选。** 记录候选 source/config/build SHA、唯一 integrator、目标 Worker/account/Agent、环境 namespace、回滚版本与各阶段 owner。确认所有共享消费者已安全，先解决 local main 自动跟随条件；此阶段不改变 main/远端。
2. **配置 owner 核准实际配置路径。** 获得单独授权的私密来源/目标/写入范围及维护 turn 后，使用本项目 `cf` 的当前 schema核对配置能力和目标 Worker（生产现行 CD目标为 `lie-game`）。不执行试探性 secret 写入；CLI secret/version操作可能激活新版本或重新发布旧代码，必须先确定实际语义及是否可只准备未激活版本。不能声称“写 secret 绝无部署影响”。
3. **先准备配置，再允许部署。** 在获准的 preview或未激活 candidate版本准备新 secrets/text，保留旧凭据。若平台/CLI不能对未激活版本准备，协调明确的生产配置维护 turn，在保留原代码/旧凭据可恢复的条件下完成配置并核现有服务，不以先上缺配置的新代码代替。没有可验证路径就停在发布门前，由总协调解决，不擅增账号权限/资源。
4. **执行下面的真实验收。** 在明确分配的隔离来源，用相同候选 source完成真 Cookie/API/WS验证。若使用不同 Worker/Origin，记录差异；不能当最终生产绑定也已通过。任何失败先停止新的 provider尝试，按 owned ledger关WS/核资源，无隐式换 ID/回退 token 重试。
5. **总协调复核后串行 integration/push。** 配置证据、真实验收、维护窗口与 rollback齐备才推进。当前 CI对main构建并上传精确artifact，成功 CI触发 CD；CD用`cf deploy --prebuilt --mode production --worker lie-game --provision=false`部署经SHA/artifact核对的构建。部署凭据 `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` 与 Linx/签名运行时 secrets不同；现workflow没有代为生成/写入新 voice secrets。构建dry-run不能证明线上值存在或可用。禁止先 push触CD，再补 secrets；不为此自行改CI/部署流程。
6. **发布 owner核 serving身份与绑定。** 分别核local main/remote main/CI artifact/线上serving version，health与status；status ready只说明配置形状。按 turn预算做一次最终origin的同源 Cookie/prepare/WS smoke。若最终origin未实测，应明确标记未验，不沿用preview通过推断。跟踪新的Device归属，不输出Cookie/OTA token/key。
7. **资源 owner交回清单，发布 owner交回服务状态。** 完成临时browser/service/probe清理与资源责任确认后才释放turn；持久用户服务按登记继续保留，不能因测试结束停止。由总协调向用户报告已发布SHA、真实覆盖、遗留/回滚状态。

## 必要真实验收：待单独批准的具体窗口

此计划没有执行权限。总协调在执行前填写：实施owner、资源owner、精确候选SHA、私密来源白名单（不记值）、唯一已有测试Agent、隔离Origin/服务port及consumer/停止条件、可接受费用与真实请求范围。5182仅是已释放的上次fake窗口；再次启动要重分配和核listener，不能沿用旧turn。新remote Worker/Agent等额外资源不在默认范围。

**建议硬边界：** 最多2个专用浏览器身份/Device、1个已批准Agent、6条WS（最多3条短暂重叠）；每条开通后最多15秒、合计最多90 socket-seconds。准备/执行240秒，随后预留60秒清理，合计300秒；provider HTTP最多24次（含目标Agent前后归属核对，至少保留4次给核对/回收）。客户端20秒/服务端18秒/单HTTP8秒与WS9/10秒继续有效；9秒包含共享首握、可选401 OTA与重握，绝非每段9秒，不为实验临时放宽。禁止自动循环、扫描账户、手工换token/Device试错或失败后创建第三个Device；产品本身那一次401同Device恢复是唯一允许的自动fallback。

默认先做 **0 listen / 0 mic / 0文本推理** 的Cookie/transport验收：即使不推理，WS静默也可能计供应商时长/UID费用，需在turn内明确接受。可用同源受控浏览器页的原生WS并走真实 status/prepare，发送hello并完成必要MCP初始化；不触用户tab。若要进一步通过真实产品“开启对话”验收，须把合成媒体、`listen.start`与可能的ASR/会话费用明确纳入同一turn/6条上限；先独立验证synthetic-only override且无native fallback，绝不自动调用硬件mic。普通线上玩家测试不应装这种测试注入。

| 步骤 | 必须记录的断言 / 失败处理 |
| --- | --- |
| 前置保护 | 仅针对获准Agent读取一次既有Device保护快照，不枚举别的Agent。保存owned ledger所在私密状态的路径/owner，不输出秘密。识别不可靠则不创建Device。 |
| 真Cookie初始化 | 隔离context A访问status：无provider副作用；实际Cookie有预期HttpOnly/Secure/SameSite/Path/Max-Age属性（只报告属性/身份匹配布尔值），前端不持有provider token。缺Cookie POST应409且不注册资源。 |
| A首次prepare | 介绍页触发实际POST；观察首次OTA/绑定/确认成功，响应204且无Set-Cookie/身份字段；0mic/0WS。记ownedDevice A及Agent归属至私密ledger，失败未知归属不重建/盲解绑。 |
| A首次WS | 当前Cookie决定Device/稳定Client；首握使用required共享token且不OTA；若初次HTTP401，只同Device一次OTA+一次重握，所有token不出服务端；hello/MCP成功。仅transport阶段不发送listen。客户端/服务端实际来源与版本一致。 |
| 同A第二tab | 同一个隔离context，status/prepare复用A，Device数不增；第二WS后旧WS按真实provider行为关闭，旧scope无自动重连、残留采集/播放（若启用产品媒体路径）。若同Device不顶旧，判契约未满足，停而不临时加tab锁。 |
| 独立B并存 | 另一isolatedContext完成相同流程；不同Device/Client，B连接期间A仍活跃；不能通过不同port宣称Cookie隔离。失败后不改同Device/client组合试探。 |
| 复用与迟到 | 同页面切人/重开保持同身份；已ready不新prepare，后续WS仍共享token首握；仅HTTP401允许一次同Device OTA/重握。Cookie候选覆盖/异常bind的fake已验；真实窗口只覆盖事先批准、可核归属的范围，不通过删Cookie/批量资源制造额外故障。 |
| 最终origin smoke | 发布后在该origin用获准隔离身份核实际Cookie/prepare/hello，消耗同总预算；若preview已用满预算或要新增Device，先单独协调，不自动扩大。 |

只统计状态码、阶段耗时、关闭码/原因的脱敏分类、是否同身份/同Agent和已拥有资源数量。Cookie/raw MAC/Client/token/key不进入公开日志、截图或仓库；必要owned IDs仅存获准私密ledger供精确回收。不得把“角色回答正确但未调用context工具”当强制工具契约通过；本transport窗口不证明每答必查工具、真实ASR/TTS质量或角色知识隔离，若这些是发布要求，需总协调指定额外有界验收而非据此自行加推理。

## 资源留存与回收责任

测试完成先关所有owned WS、合成源/contexts及owned tabs，再停临时服务原PTY并核所有自有listeners/PIDs。Provider资源由资源owner按ledger逐个核归属和无当前消费者后，只解绑本次确认拥有的Device；不删共用Agent、不触旧固定Device或他人会话。若批准留作staging/后续真实验收，则记录保留理由、owner、下一核对时间；保留不是清理成功。

API失败/响应未知、候选A/B竞争或无法确认归属时，保留私密ledger与脱敏待清单，不盲认领/解绑、换ID或删除state。资源owner在turn结束前把未清项交总协调并继续负责，不把“浏览器已关”当资源已回收。超过cleanup60秒仍未知则结束自动操作，保全状态并上报，而非无限重试。

生产首版没有自动TTL解绑或全局设备数量硬上限。建议的人工政策（尚需用户确认）：资源owner发布前保存目标Agent保护清单，发布后7天内首次核对、以后每周复核；超过30天未连接只作为人工候选，需核归属/会话终止/consumer再处理。若清单能力不能可靠覆盖，暂停扩大新身份发放；Cookie180天或页面卸载不是自动回收依据。

## 回滚预案

- 发布前保全上一个已验证代码+Web同版artifact/版本引用、旧固定Device/WS token/Agent的私密配置及消费者关系。**不能仅回滚Web或仅回滚Worker**：旧Web没有prepare，新gateway会拒绝直接WS；新Web调用prepare而旧gateway没有该API也会失败。
- 总协调持唯一turn，在约定消费者窗口回到经过核验的兼容代码/资产/绑定组合。优先使用已确认可恢复的整版平台版本；如果要走source纠正/revert，按现有review/integration/CI/CD流程，不reset/force push/main历史重写。任何手动平台回滚需具体授权，不能因这里有方案就执行。
- 旧版本依赖旧固定凭据，部署前必须确认仍可用且Device仍归其Agent；新管理key/签名secret不是替代旧WS凭据；新source已保留required共享WS token，也不能省掉管理/签名门槛。回滚保留新secrets及owned资源ledger，待consumer排空后再协调删除，不能先清凭据断回滚路。
- 新Cookie对旧source只是无关Cookie，不必清用户storage；回滚后再前进若保持原签名secret/namespace/Agent可复用新身份。轮换任一项可能使旧Cookie失效或Device归属冲突，必须另安排迁移/资源核对，不声称有双key或自动Agent迁移。
- 触发例：配置缺失/真实鉴权失败、prepare持续失败、跨身份互顶、同身份不满足替换契约、旧消费者不可用、secret意外泄露或费用异常。先停止新的测试/发布尝试并保全元数据；是否关闭公众voice/轮换key由总协调与用户决定，不擅自停整站或删Agent。

执行后由各owner回填真实 serving/config摘要、turn/费用范围、WS/HTTP计数、资源清理/保留及回滚可用性；在此之前本文件始终是待执行方案。
