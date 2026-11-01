# WSS token作用域与复用研究

2026-11-01；本轮只读官方公开资料与仓库源码，尚未取得真实token测试turn。**“不同Device必须不同token”和“每次WS必须OTA”均未证实。** 下文不把JWT格式、不同token字符串或历史每Device各取token的成功样本当作该结论。

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

1. **是否可共用：** 用同一Agent下D1所得T1，连接D1与D2并存，能提供本次T1跨Device接受及不因共享T1顶线的直接样本。不能扩展成所有Agent、套餐、token来源或未来token永久可共用。
2. **是否可长期省OTA：** 即便短测成功，仍需期限和失效恢复契约。获批后只投影JWT的`iat`/`exp`是否存在与数值，不输出token、claims、ID或hash；解码不验证签名，标量也只是当前样本，不等于供应商稳定承诺。opaque token或无exp应如实记未知。

可评审候选为固定sharedToken＋明确轮换：只有实际共享验证通过且scope适合目标Agent后，再决定是否保留固定WSS secret；新Device仅首次绑定，日常WS直接用sharedToken。到期/认证失败时明确报不可用并由授权运维轮换，或另行批准服务端按需OTA刷新设计。不能无限缓存、Worker自动改平台secret、无限认证失败重试，亦不能把“正在用的WS短时间正常”写成长期刷新已完成。

## 当前状态

[有界验证计划](plan.md)覆盖专用资源样本；原固定token另需owner明确来源和授权scope。当前未读任何secret、未做账户请求、未创建资源。source与配置修改由父owner负责，本子目录只保全研究、计划、探针及脱敏结果。
