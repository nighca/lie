# token共享第二轮：独立输出与安全错误分类

2026-11-01；父owner和独立reviewer实际审查后已授新资源独占turn，[第二轮实际回执](run-02.md)共享T1样本通过、正常关闭/解绑/删Agent，session已退出并释放turn。下文保留当时评审方法，不构成重跑许可。[首轮](run-01.md)创建响应未知，后续受权[单次只读核对](reconciliation-run.md)的完整响应快照中未找到该名称。所有首轮原result/state保留，未重用或覆盖。

## 本轮方法差异

1. 继续复用`probe.mjs`的原资源与协议流程：1专用新Agent、2新Device，D1取T1；D2只绑定不取T2；D1/T1先hello保持3秒，再D2/T1 hello后并存5秒。8准备HTTP、2WS、3清理HTTP，0listen/mic，无额外API/OTA/问答/重试。
2. 仅追加异常白名单保全：HTTP各阶段与WS的`errorCode`只允许固定Node/Undici网络码（如ENOTFOUND、EPERM、ECONNRESET、TLS/超时码），或固定OTHER／ABORTED／TIMEOUT／REJECTED_RESPONSE。最多查看两层cause，不输出raw message、stack、hostname、error object、任意code或其他字段。失败仍停，不借错误分类盲重试。
3. 新增`runner-v2.mjs`，私密state独立为ignored `tmp/p0-token-study-run02/state.json`，安全结果为`result-02.json`；wx拒覆盖。管理key仍仅进程必要读取既有批准路径；不读原固定token或生产secret。首轮原方法在提交`cf37595810d320032f273d95f708aa1608c99992`中保全；第一轮真实方法hash不回写为新版本。
4. exec必须`require_escalated`，明确用户token验证与root专用资源turn。系统CA与项目专用Node24.22.1；不修改网络设置、不换账户、无自动retry。180秒总实验、WS阶段30秒、清理60秒继续适用。

## 待审命令和验证

新turn实际授予后才可运行：

```sh
'/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node' --use-system-ca docs/reviews/device-concurrency-2026-11-01/token-study/runner-v2.mjs --execute-dedicated-approved
```

语法检查、8项离线fake与无参数runner安全运行通过；新增用例核网络码白名单、未知code隐藏、嵌套cause分类及创建ENOTFOUND只发一次请求并保留不确定ownership。离线fake不能证明真实共享token或供应商资源状态。

费用与结论边界沿[原计划](plan.md)：静默也按UID时长计费，最大连接时长估算不当账单封顶。即使本轮成功，也只证明专用Agent新T1的当次跨Device样本；不证明原固定本地值、生产secret同一性、长期有效或刷新承诺。JWT只投影iat/exp安全标量且未验签。
