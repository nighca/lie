# 固定sharedToken直连候选

2026-11-01；本页保留共享 token 简化 proposal 与取舍。后续用户要求的优先省 OTA 方向，经真实样本与审查后已在专项源码实现：共享首握，仅初次 HTTP401 才一次同 Device OTA 与重握，共用9秒，无缓存/secret写回。尚未上线；真实过期路径、生产配置与发布门槛见[发布方案](../release-readiness.md)。

| 问题 | 当前证据 |
| --- | --- |
| token是否必定Device-bound | [真实run02](run-02.md)中同Agent、不同D1/D2共用T1并存；“不同Device必须不同token”不能再作强制前提 |
| 原固定token能否用于目标Agent的新Device | [原固定本地值真实轮](original-fixed-run-01.md)已验证批准本地token配来源目标Agent的新D1可hello保持3秒；不证明生产secret同一性或该旧Agent双Device并存 |
| token有效期与刷新 | 官方只说明过期/无效可拒绝或断开；当前T1为jwt-like、未验签、iat/exp安全投影均null。期限仍未知，不等于无期限 |

## 最小产品候选

1. 保留prepare的首次设备初始化：同一浏览器身份固定Device，必要OTA取激活码并绑定到已配置Agent。该路径确认合法绑定，不因共享token省掉首次设备准备。
2. 已prepared的WS优先用服务器`LINX_WS_TOKEN`＋当前Device/Client＋目标Agent直接握手，避免为了取得该Device自己的token而每次OTA。客户端不得获得provider token。批准本地原值已取得下述新Device接受样本，生产配置同一性与部署环境仍需由owner核对。
3. **只有第一次上游握手HTTP401**，才用同一Device做一次OTA取新token，再做一次WSS握手；整条路径共用现有总握手预算，不为刷新或重试另起完整超时。没有token、OTA失败、第二次握手失败或预算耗尽即返回明确不可用。
4. 不因403、普通网络失败、1000关闭或已建立WS断线猜测token过期；不自动重连、不重分配Device、不在此路径再次绑定。即使供应商可能在101后因认证断开，公开资料不足以稳定识别原因，仍按断线处理，不能扩大刷新触发条件。

**缓存/运维取舍：** 首版候选可不缓存刷新值，避免任意TTL与跨isolate一致性机制；代价是固定secret持续失效期间，每次新请求可能付出一次401＋一次OTA＋一次重试。需用脱敏计数定位持续认证失败，由授权运维轮换目标Agent的固定secret，Worker不自动写管理平台secret。若再加isolate内短缓存，它只能优化局部请求，不能充当持久凭据来源；过期策略必须有已证实期限或明确的失败驱动失效，不能随意发明TTL。刷新值跨Device/跨Agent复用范围亦须证据；本轮不顺带实现缓存或扩大scope。

该候选仍有限制：真正过期可能并不返回401；OTA与第二次握手可能挤不进既有预算；刷新到的token是否撤销旧值未知；固定secret运维轮换仍需具体责任人。它解决“每WS必做OTA”的未经证实强约束，不承诺自动续期永久可用。

## 原固定值的最小追加验证（后续已执行）

以下保留原scope proposal。[具体方法](original-fixed-plan.md)后续额外加入必须的原Agent禁问候GET，实际4HTTP/1WS、0新Agent/1新Device，[真实轮](original-fixed-run-01.md)已通过并清理。未改原Agent或原Device，不延伸为生产同一性结论。此前未授权状态由该次具体turn取代，不构成今后重跑许可。

需要owner明确允许读取哪份本地配置的`LINX_WS_TOKEN`/`LINX_AGENT_ID`、该值来源与目标Agent归属/消费者，并批准在该Agent下绑定**1个新专用Device**。不读生产secret比对、不用原Device、不改原Agent config。

最小轮次为：新Device初始OTA取激活码→绑定到该目标Agent→用原固定token搭配新Device做一条hello WS→正常关闭→只解绑此新Device。最多2次准备HTTP、1WS、1次清理HTTP；无取T2、无认证失败fallback、0listen/mic、不问答、不重试。原Agent不改问候设置，若其现配置会主动问候，必须事先向owner明确该可能生成/计费边界，不能承诺0推理。可由owner先确认必要白名单配置；若需要额外GET则单列一次读请求审批。

取得该有限样本也只证明这份本地值与这个目标Agent/新Device，不自动证明与线上secret相同。具体时间窗、预算、私密state与清理方法需再审查，当前不执行或擅读取原值。
