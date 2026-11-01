# 原固定本地token配新Device：真实样本通过

2026-11-01。父owner与独立reviewer实际审查后，总协调授一次具体turn：0新Agent、最多1新Device、4HTTP/1WS、90秒实验／WS20秒／清理30秒。**批准本地配置中的原固定token可用于该目标Agent下新绑定的Device，本轮hello接受并保持3秒。** 未读取生产secret作同一性比较。

## 方法与来源边界

执行前实核SHA256：

- 方法`original-fixed-probe.mjs`：`1a1d1e1640aca584bf37dc9f13840ca36c5d3345e0cbc6aeed347168281b66fd`
- 入口`original-fixed-runner.mjs`：`6b87ce356741831452385713f1f20af26852307e63394e56dbda605bd57b1a73`

实际使用项目专用Node24.22.1、系统CA、唯一`--execute-original-fixed-approved`、exec `require_escalated`。probe只逐行选择已批准本地`.dev.vars`的`LINX_WS_TOKEN`与`LINX_AGENT_ID`，不解析或使用`LINX_DEVICE_ID`或其他变量；key仅进程必要读取既有批准管理key。没有复制/hash/output token/config、写回配置或生产比对。

先只读原Agent的必要问候标志，明确`disable_greeting=true`才新建Device；没有改原Agent配置。实际固定官方WSS、用**原固定token**配新D1，不从D1 OTA另取替代token，不使用newT1代替，不连接原Device。

## 实际结果

完整脱敏证据：[result-original-fixed-01.json](result-original-fixed-01.json)。相对本轮开始：

| 事件 | 时间／耗时 | 回执 |
| --- | --- | --- |
| 原Agent问候白名单GET | 3–2098ms | HTTP200/code0，禁问候明确true |
| 新D1首次OTA | 2100–8039ms | HTTP200，获得激活码；未读取/使用任何既有Device |
| D1绑定到来源目标Agent | 8041–9814ms | HTTP200/code0 |
| 以原token拨号／open／hello | 9815／11664／12114ms | PCM hello及非空session被接受 |
| hello后静默保持3秒 | 至约15116ms | 仍OPEN，0listen、0输入音频，未收到TTS或音频 |
| 主动关闭事件 | 15639ms | callerClose、1000、CLOSED，无terminate |
| 解绑本轮D1 | 15639–17497ms | HTTP200/code0 |
| 全轮结束 | 17499ms | completed=true，约17.5秒 |

总共4HTTP、1WS，无fallback/retry、Agent创建/更新/删除、全账户列表或额外OTA。只从批准的本地来源取得两字段，不核对或假设其与生产secret一致。

## 期限、并发与费用限制

原token安全投影为jwt-like、未验签，iat/exp/declaredLifetimeSeconds均null。不输出任意claims，不据此声称永不过期、原token年龄、刷新触发或长期保活。

本轮仅1条新Device WS，不连接或观察既有消费者的语音连接，**不称旧Agent双Device并存已直接实测**。[run02](run-02.md)提供的是新专用Agent同T1双Device并存样本；两份证据分别说明当次共享能力及原本地值可用于新Device，不能合并成生产完整多人验收。

未发listen/mic/输入音频或问答；静默仍可能产生UID会话时长。未查账单，不声称零费用或严格账单封顶。固定token直连／401单次刷新继续属于[待决proposal](shared-token-proposal.md)，真实token过期路径尚未测。

## 清理与交付

session82681最终exit0，未留下服务、WS或其他后台消费者。先观察本轮WS正常关闭，再只解绑本轮新D1；没有改变原Agent配置、原Device、本地配置或8787/8788、5544服务。

收尾对私密state只做安全投影复核：mode0600、device存在但bound=false/uncertain=false、无token字段、cleanupComplete=true。state中的目标Agent ID只是私密清理归属证据，不能把原Agent当owned新资源删除。本轮清理只指新D1绑定；不承诺供应商所有注册/日志/历史被清除，也不把Node close当内部终止API ACK。

结束后先向父owner报告exit、实际WS关闭、解绑与私密state并明确释放providerturn，再写本归档。没有自动重试、扩大测试或改产品源码。执行前语法、7项离线fake、无flag安全runner均通过；fake只验证方法控制流，本轮真实回执才证明原本地token接受新Device。
