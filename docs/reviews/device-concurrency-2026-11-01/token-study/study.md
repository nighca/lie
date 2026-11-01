# WSS token作用域与复用研究

2026-11-01；受权[第二轮](run-02.md)已验证同一专用Agent下T1用于D1/D2并存；另受权[原固定本地值轮](original-fixed-run-01.md)已验证批准本地token配来源目标Agent的新Device可hello保持3秒。**“不同Device必须不同token”不成立为普遍假设；生产secret同一性、长期期限与刷新仍未验证。** 下文保留官方公开契约与证据边界，不把JWT格式或历史各Device分别取token当必须分token的依据。

## 官方已说明与未说明

| 来源与具体章节 | 已说明 | 不能推出 |
| --- | --- | --- |
| [WSS协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)「必需的请求头参数」「其他注意事项／鉴权」 | Bearer token用于认证；Device-Id验证设备绑定；token过期或无效可拒绝握手或后续断开 | 未声明token必须绑定Device、Client或Agent，未声明不同Device不能共用token，未给TTL或刷新接口 |
| [OTA协议](https://linx.qiniu.com/docs/xrobot/platform/OTA)「成功响应」「快速激活状态检查」 | 已绑定设备上报后可取得websocket.url/token；未绑定不返回token；激活后重新OTA取连接配置 | 没有要求每条WS前重新OTA；也没有承诺同一token跨Device、永不过期或固定有效期 |
| [固件接入指南](https://linx.qiniu.com/docs/xrobot/guide/xiaozhi-firmware) §2.2 | 若服务端需要token，它有保活期；所述固件无定期OTA过程，超期后靠重启触发OTA | 未公布保活期秒数、滑动续期条件、取新token是否使旧token失效、活跃WS是否立即断开 |
| [平台API](https://linx.qiniu.com/docs/xrobot/api/)「API基本信息」 | 管理API支持Bearer Token/API-KEY，开放API推荐API-KEY | API-KEY、控制台登录token与OTA返回的WSS token不能混同；未证明管理key可直接用于WSS |

查询过官方WSS、OTA、API总览、FAQ与token/有效期/刷新相关公开结果。公开资料未找到可替代Device身份的HTTP语音session创建契约；这只限定本轮查阅范围，不证明供应商绝无其他能力。MCP Proxy的30天token、聊天音频签名URL的1小时期限均为其他产品接口，不能套用到WSS。

## 仓库与历史事实

- 已发布基线`98d71fb9ebc2f517010598c4796c8db3014a73c7`的gateway由`LINX_WS_TOKEN`直接构建每条WSS的Bearer，配固定Device和Agent；该源码不记录token来源或有效期。
- `apps/gateway/scripts/linx-check.ts`旧方法为每Device做OTA并把首个Device token导出本地开发配置。它说明测试作者当时的取值方式，不证明跨Device复用不允许，更不证明生产secret与历史本地值相同。
- [两独立Device第二轮](../independent-device/run-02.md)每Device分别OTA并成功并存；raw token已清，没有可用于同一性对比的值或hash。不能凭聊天重构比较，也不据此读取生产secret。

## 分开回答两类问题

1. **是否可共用：** [第二轮真实样本](run-02.md)已用同一Agent下D1所得T1连接D1/D2，并在D2 hello后并存5秒，未顶线。[原固定本地值轮](original-fixed-run-01.md)另证实该本地值可用于其目标Agent新Device；本轮不观察旧Device，不能合并成生产完整并发验收，更不能扩展成所有Agent、套餐或未来永久可用。
2. **是否可长期省OTA：** 即便短测成功，仍需期限和失效恢复契约。获批后只投影JWT的`iat`/`exp`是否存在与数值，不输出token、claims、ID或hash；解码不验证签名，标量也只是当前样本，不等于供应商稳定承诺。opaque token或无exp应如实记未知。

可评审候选为固定sharedToken＋明确轮换：只有实际共享验证通过且scope适合目标Agent后，再决定是否保留固定WSS secret；新Device仅首次绑定，日常WS直接用sharedToken。到期/认证失败时明确报不可用并由授权运维轮换，或另行批准服务端按需OTA刷新设计。不能无限缓存、Worker自动改平台secret、无限认证失败重试，亦不能把“正在用的WS短时间正常”写成长期刷新已完成。

## 当前状态

[固定sharedToken直连方案](shared-token-proposal.md)将首次prepare与日常WS分开。后续专项源码已实现共享首握、仅HTTP401时一次OTA刷新＋一次握手重试，共用9秒，无缓存或secret写回；离线检查见[发布方案](../release-readiness.md)，尚未集成或上线。真实过期路径仍未知，本地fake恢复通过不能代替供应商过期样本，亦不授权追加实测。

[有界验证计划](plan.md)及[第二轮差异](retry-plan.md)覆盖专用资源样本。[首轮](run-01.md)的创建状态随后按受权只读[核对回执](reconciliation-run.md)处理：完整响应快照无该名称，未DELETE或重跑该state。[第二轮](run-02.md)实际共享T1通过并已正常关闭/解绑/删专用Agent。[原固定本地值轮](original-fixed-run-01.md)另按明确两键来源scope通过并已关闭/解绑唯一新Device，未改原Agent或原Device。两轮私密state均清理完成、执行turn释放，当前没有运行中的测试。生产secret同一性与TTL未知，实际配置/发布由总协调安排；文档设计或本地实现不等于已上线。
