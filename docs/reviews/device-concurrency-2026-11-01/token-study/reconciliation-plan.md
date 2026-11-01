# 首轮创建响应不确定：网络诊断与最小只读核对方案

2026-11-01；父owner后续已实际审查并给单次只读执行turn，[回执](reconciliation-run.md)为HTTP200/code0、match0、hasMorefalse，session已退出并释放turn。下文保留当时审查计划；不是新增查询或重跑许可。不重跑创建、不取token、不建WS、不删资源。

## 已有执行记录能说明什么

- 首轮真实runner的`exec_command`未设置`sandbox_permissions`，工具schema默认为`use_default`；没有请求`require_escalated`。记录没有自动审批拒绝、明确EPERM/EACCES或HTTP拒绝，不能称“自动审批拒绝了创建请求”。
- 当时探针把底层异常统一替换为`Operation failed: create-agent`，只留下17ms、HTTP status/code均null。未留原始error/cause，无法恢复首轮精确DNS/TLS/网络/安全错误类别。这是证据保全局限，不通过重放创建补证。
- 追加无凭据诊断采用同一专用Node24.22.1、`--use-system-ca`、`use_default`：`dns.lookup('xrobo.qiniu.com')`失败，安全白名单投影为`ENOTFOUND`；公共`https://example.com`单次HEAD亦为`ENOTFOUND`。未带认证头、没有provider业务HTTP请求，未输出IP、原始error或私密标识。
- 这支持**诊断当时默认执行环境DNS不可用**；不证明首轮必是同一底层错误，不证明sandbox本身是唯一根因，也不证明供应商未创建Agent。首轮`cleanupComplete=false`保持原样。

## 官方API限制

[智能体API](https://linx.qiniu.com/docs/xrobot/api/agent)「搜索智能体」只列`type=mac`或`agent_id`的精确搜索；没有按`agentName`过滤的公开参数。当前既无新Agent ID、亦未生成Device，不能靠该搜索接口定位。

同页「获取用户智能体列表（支持分页）」公开`limit`（1–100）及`cursor`；不传两者会返回全量。公开页没有排序保证、名称过滤、创建时间过滤或只投影字段参数。不能擅加未证实的name参数假装精确服务端检索。

## 请求一次的最小候选（待授权）

1. 仅使用已批准本地管理key路径与本轮私密`state.json`。先核owner、createAttempted=true、agentId=null、devices为空以及私密名称格式；名称只在内存使用，绝不在命令参数、stdout、仓库、HTTP查询字符串或聊天中输出。
2. 在父owner新授窗口、可用网络执行环境下，最多**一次**`GET https://xrobo.qiniu.com/xiaozhi/agent/list?limit=20`，认证仅进程内构建；15秒上限、禁止重定向、禁止自动重试、总窗口30秒，无游标续页。若网络路径需sandbox升级，另按工具流程明确范围；不擅以另一账户或浏览器绕行。
3. 响应仅内存处理，正文最多256KiB，超限立即停止；HTTP非2xx、业务code非0、非预期数组结构或返回行数超过20都记失败，不保存响应。该API无法服务端筛名称，故最多20行仍会包含无关Agent字段；这是候选必要读取范围，待父owner明确接受，不把它描述为服务器端只读一个对象。
4. 对最多20行只做`agentName === state.agentName`完整字符串比较。公开输出仅`httpStatus`/`businessCode`、`match: 0/1/multiple/null`、`hasMore: true/false/null`；null表示失败或未知，不当0。不得输出其他行数、名称、ID、配置、系统提示词、游标或token。按父owner最新要求，唯一合法匹配ID只在原0600私密state原子更新`agentId`，保留全部其他字段，包括createAttempted和cleanupComplete；写前复核state未变化。原公开result与attempt/cleanup标记不改，不另存私密ID副本。
5. `one`只表示本页唯一匹配；若尚有下一页，不称全账户唯一。`none && hasMore=true`保持未知，不继续扫描；`none && hasMore=false`只记录该快照完整列表无匹配，仍不回写“创建请求从未抵达”。重复匹配/缺少合法ID/范围不符都停，不自动选一个。
6. 本窗口纯只读；即使找到也不自动DELETE。将匹配与私密ownership证据交父owner，再决定是否给一次具体owned Agent删除turn。任何失败不扩展为新建或共享token测试，不读原固定或生产secret。

费用：0WS、0listen、0输入音频，不产生本测试的语音连接时长；管理API本身是否有费用/限流未核，不承诺零账单。创建状态不确定和私密state继续保留，直到上述核对与必要清理有实际回执。

## 待审方法与命令

`reconcile.mjs`只有直接执行且唯一参数`--execute-readonly-approved`才读取key/state；导入与无参数运行不读凭据、不发请求。模块入口还要求显式turn标记。语法、4项离线fake及无参数安全运行通过；fake不证明账户中是否存在该资源。离线fixture无网络且结束即删除本次exact-owned临时目录。

获父owner执行turn后的命令：`'/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node' --use-system-ca docs/reviews/device-concurrency-2026-11-01/token-study/reconcile.mjs --execute-readonly-approved`。exec需`require_escalated`，理由限定为用户要求的token验证失败后的单次只读收尾核对；不要重新调用create或扩大到账户扫描。安全公开回执写`reconciliation-result.json`（wx，拒覆盖），原state仅在单一精确匹配时按上述原子落地ID。
