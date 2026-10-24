# 本地 WebSocket 拒绝握手：宿主边界与处理选项

2026-10-25；reviewed main `bf0583753c518adc5f6e61e7dd80d2b0ce99ff84`。这是[依赖审计未闭合项](dependency-audit.md)的独立定位，不预设依赖补丁回归。没有修改Web/gateway生产配置、Worker门禁、供应商参数、握手超时或凭据，也没有开启麦克风/真实provider。结论是当前Cloudflare Vite开发宿主丢弃非101响应；Web Vite代理本身能保留HTTP拒绝。

## 完整网络对照

Node24.22.1、Vite8.3.5、`@cloudflare/vite-plugin@2.0.0-beta.v.4`，macOS ARM64。用实际`ws`客户端发完整GET/Connection Upgrade/Upgrade websocket/Sec-WebSocket-Key/Version握手，专属临时loopback端口，未碰8787/8788或既有服务。顺序均为同源、跨源。

| 路径 | 结果 | 能证明什么 |
| --- | --- | --- |
| 本地假拒绝上游直连 | HTTP503、403 | 探针能正确接收标准拒绝握手 |
| 同一假上游经过现有Web Vite代理 | HTTP503、403 | 现代理保留Host/Origin与非101响应；不需要给web proxy复制业务门禁 |
| 实际无凭据gateway的`/api/voice/status` | unavailable | 不向具备真实provider凭据的环境发WS请求 |
| 实际gateway HTTP控制：保留Upgrade头，但Connection为close，不进入Node upgrade事件 | HTTP503、403 | 相同Worker代码能给出正确拒绝；这条是HTTP控制，不能冒称完整WS通过 |
| 实际gateway完整WS握手 | 两者socket hang up | 原问题在当前独立环境复现 |
| 实际gateway再经现Web Vite代理的完整WS握手 | 两者socket hang up | 完整本地开发链保留该宿主问题，web层无法从已销毁socket取回原状态 |

假上游只返回503/403，不模拟付费服务。实际gateway为当前Cloudflare Vite插件/本地workerd、当前Worker源码，未配置voice secrets。既有gateway workerd测试的dispatchFetch拒绝检查与本表网络路径不是同一个层次。

## 根因证据

[Worker](../apps/gateway/src/index.ts)的relayVoice先验证Upgrade、Origin/查询，再在未配置时返回503（35–41行）；这次没有改动或放宽。完整HTTP控制请求已验证该逻辑实际执行。

安装版`node_modules/@cloudflare/vite-plugin/dist/index.mjs`的`handleWebSocket`（本版本约90234–90258行）调用`miniflare.dispatchFetch`后读取`response.webSocket`，若不存在则直接`socket.destroy(); return;`，没有把Worker的status/headers/body写回Node客户端。即使Worker正常返回403/503，客户端也只收到连接被断开。该模块的catch亦直接销毁socket；本调查不将所有hang up都归为这个已定位分支。

对照安装版Vite内置http-proxy的WS `stream`处理器：`proxyReq.on('response', ...)`明确转发非WS HTTP状态/headers/body；网络fake对照也实际通过。[现Web Vite配置](../apps/web/vite.config.ts)没有额外破坏拒绝状态。此前审计已经在未升级依赖环境复现，本次没有重新安装旧依赖，也没有把静态源码证据当作新的跨版本实测。

## 可重跑诊断与清理

在**新建、无任何本地.env/.dev.vars文件及voice credential环境变量的独立worktree**运行：

```sh
PATH=/private/tmp/lie-toolchain-node/node-v24.22.1-darwin-arm64/bin:$PATH node scripts/dev-websocket-rejection.mjs
```

[诊断脚本](../scripts/dev-websocket-rejection.mjs)拒绝环境/凭据文件（只允许仓库.env.example模板），并在任何实际WS之前要求gateway公开status=unavailable；不读取/输出secret内容。它加载现Web/gateway Vite配置，用port0分配端口，关闭HMR/文件监听，不改主预览配置。四个自有服务均在finally关闭；结束用TCP探针确认所有自有端口ECONNREFUSED。成功输出依赖版本、有限握手状态和本次自有端口；没有人声、游戏内容或身份日志。

脚本接受两类明确结果：当前已知“开发宿主丢弃拒绝”，或未来宿主已正确保留503/403；其他意外结果失败。它不是要求永远保留bug的测试，也不自动升级/修补vendor文件。实际执行成功，四个自有端口关闭；source diff/syntax检查通过。无正式行为变化，因此未用全仓重跑伪装已修复线上或真人语音。

## 最小处理选项与维护成本

1. **当前建议：保留准确限制和诊断。** 未配置环境继续由status检查在申请mic/WS前阻止开启；端到端拒绝status的网络验收在该开发宿主下标为未通过。线上Worker是否正确保留拒绝仍需独立环境验证，不能由本地推断。成本是少量诊断维护，不更改provider或隐私生命周期。
2. **向上游修复/等待已验证版本。** 在开发宿主无workerWebSocket分支将原HTTP拒绝写回并结束连接，而非destroy；需正确处理headers/body、socket已断开和stream错误，不手工伪造101。先向上游提交最小无凭据复现；拟升级时独立分支核锁文件/安全审计、同一网络诊断以及正常101文本/二进制relay。没有选版本或访问远程服务，本次不作依赖升级决定。
3. **仅当必须立即消除此dev限制时，再评估开发专用适配。** 当前公开插件接口没有暴露这个非101处理回调；本地shim、替代Miniflare开发服务器或patch-package都增加开发链维护/同步负担，需要另定范围。不得通过复制Origin/credential gate、追加status预请求替代实际WS、把所有连接错误伪装403/503、重写Origin、前移真实provider握手或改生产Worker来“修复”显示。

本次没有必要在已正常工作的apps/web proxy添加补丁。保留问题为开发宿主限制比引入不可靠状态推断更精确；主协调可据此决定是否追踪上游修复或另开开发适配任务。供应商/正式架构/依赖大幅调整仍须用户确认。
