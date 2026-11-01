# 同Agent跨Device共享token：最小有界实测计划

2026-11-01；**待父owner给出具体资源/时间窗/执行turn，未执行。** 原两轮测试已结束，不能复用此前许可。

探针为`probe.mjs`，只有显式参数才能调用`runApproved`；`runner.mjs`只有直接执行且唯一参数为`--execute-dedicated-approved`时才加载本worktree的`ws`并读取已指定管理key。导入或无参数运行均不读key、不发请求。**flag本身不是授权，当前不能执行真实命令。** 获得turn后的确切命令（Node 24.22，系统CA）：`node --use-system-ca docs/reviews/device-concurrency-2026-11-01/token-study/runner.mjs --execute-dedicated-approved`。私密状态仅在ignored `tmp/p0-token-study-run01/state.json`，结果在本目录`result.json`；两者拒绝覆盖，不自动重跑。

## 一轮具体范围

- 最多创建1个专用测试Agent、2个新Device（D1/D2）；不使用、读取或修改生产、本地试玩的Device/Agent/token/secret。
- 用父owner明确批准的现有管理key文件，仅本进程读取，不打印或复制到仓库/新开发配置。执行前核该文件owner与使用范围；本计划不授权当前读取。
- Agent显式`Memory_nomem`、history0、`disable_greeting=true`、max_tokens160、search=false；必要白名单读回。只使用合成测试身份，无麦克风、无输入音频、无`listen`/`detect`/问答，最多两条WS。
- 第一次管理请求到测试结束硬上限180秒；首次WS开始至最后测试结束另加30秒硬上限。每HTTP请求最多15秒、无自动重试；单WS握手＋hello最多10秒。清理另最多60秒。失败立即停新请求/拨号，进入清理。
- 请求上限：Agent创建/更新/读回各1次（3），D1初始OTA/激活码绑定/取T1各1次（3），D2初始OTA/激活码绑定各1次（2），共8次准备HTTP；2次WSS；清理D1/D2各解绑1次、Agent删除1次，共3次HTTP。没有预注册批量导入、全账户列表、账单、模型列表、生产配置读取或T2请求。

## 预设顺序和判据

1. 持久化私密owner/拟建Agent名后创建/配置/读回专用Agent；状态文件原子写、mode0600。管理key和token仅内存，不落state。
2. 随机D1身份先落私密state，再首次OTA。若返回已有token则停，不能假设新身份所有权。取激活码绑定；绑定前落attempt，业务成功后落bound。再次OTA取得T1，只保存必要安全token标量投影。
3. 随机D2同样落state，初始OTA→激活码绑定；不再给D2取T2。这样D2仍是同Agent合法绑定身份，同时请求头明确用T1。
4. 固定拨号官方`wss://xrobo-io.qiniuapi.com/v1/ws/`。D1/T1先收到PCM hello/session，静默保持3秒；然后D2/T1以不同Device/Client连接。D2也收到hello后静默保持5秒，核两条仍OPEN且session不同。只发送hello，不发送MCP工具调用或任何listen。
5. 对外结果仅标签D1/D2/T1、阶段时序、HTTP/业务数值码、hello状态、session是否不同、close代码、是否callerClose。异常文本/响应正文/URL query/token/MAC/Agent/session/激活码/claims/hash一律不输出。
6. 主动关闭两条owned WS，等待close事件。3秒后仍未close则本地terminate并记录区别；本地close不是供应商内部终止ACK，不假称。全部owned socket已观察CLOSED后，才依次解绑本轮Device并删除本轮Agent；响应不确定或清理失败保留私密state，不盲重试/换新资源。

通过需要D1正常hello、D2以T1正常hello、并存5秒不意外关闭、两个session不同及实际close收尾。该结果回答专用Agent的这枚新T1可否跨Device使用；**不验证生产secret同一性、历史固定token来源、token长期期限、真实模型问答或所有未来用户。** 若任一失败，记录发生阶段；不能仅凭失败就宣布Device-bound（可能权限/绑定传播/过期/协议等），不临时取T2改测或扩大请求。

## 费用与资源边界

[UID时长规则](https://linx.qiniu.com/docs/xrobot/billing/resource-usage-billing)按连接会话时长计费，静默不等于免费。两WS在30秒测试窗口内保守至多60设备秒，再考虑清理60秒极端收尾窗口，保守至多180设备秒（3设备分钟）乘当前倍率；真实提前完成即关闭。管理调用、最终供应商内部断开计时及其他套餐计费未知，该估算不是账单封顶。若未观察本地socket关闭，保留资源状态并上报，不能靠解绑谎称已停计费。

## 原固定token的追加scope（本轮不含）

若用户要专门核原固定token，父owner需明确：仅哪一份**本地**配置/私密state中的`LINX_WS_TOKEN`及`LINX_AGENT_ID`可读、原Agent当前owner与活跃消费者、是否允许在该Agent下绑定2个新专用Device、是否可证明该token就是待讨论原值。不得读取生产secret来“对照”，不得在原Device拨号。

这会变成另一轮：0新Agent、2新专用Device、原固定token配D1/D2并存；若必须获取token以外字段，只读已批准白名单。该轮证明范围仅该本地值，除非生产owner另有安全同一性核对证据，否则不能称生产真实token已测。取得这一追加scope后再写确切调用数、清理和短窗，不在专用Agent轮成功后自动扩展。
