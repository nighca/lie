# 下一次语音窗口的被动诊断准备（离线）

2026-10-25。协调者的只读日志调查仍未确定根因：失败窗口只见/status 200，精确/api/voice未匹配；成功对照可匹配/api/voice但status字段0不等于101。缺日志不能证明请求没到Worker；8aa→2f相关运行源码一致也不能排除环境或网络问题。此次按协调要求只做离线准备，没有浏览器操作、provider连接或生产修改，没有新的真实窗口授权。

## 白名单分类器

[diagnostics.mjs](diagnostics.mjs)仅处理6种CDP Network事件：created、willSendHandshake、handshakeResponse、frameError、closed、loadingFailed。仅在created URL的origin匹配且pathname严格为/api/voice时关联后续requestId；拒绝带URL用户凭据的地址，其他请求与所有帧正文事件丢弃。原始URL/query、raw requestId、request/response headers、Cookie、body、frames正文均不输出；内存requestId映射为1起的局部connection编号。只保留相对阶段时间、sent=true、有限HTTP状态码、白名单net::错误类别、blockedReason有限值及canceled布尔。

frameError不保存原文字：空、已知网络码、HTTP拒绝状态、握手超时、握手失败、打开前关闭、other。未知net::ERR_*归OTHER；未知blockedReason归other，承认精度损失而不存任意文本。handshake-sent只是浏览器发起阶段证据，不代表服务端收到；HTTP状态0或字符串值不会当101。CDP closed事件本身不提供WS close code，此工具不伪造关闭码。未相关的loadingFailed忽略，避免把其他资源的失败归给语音。

下一次明确窗口中，调用者可在已授权tab启用Network后保存cursor，readEvents仅使用导出的methods；将每个event交accept，只存snapshot，不打印或保存原始batch。断开时应分项disable与原有音频清理；本模块没有I/O、没有WS构造器包装，也不改变浏览器连接行为。这只是待集成的工具，不把离线成功说成已在真实浏览器部署。

## 单次调用保护

createSingleVoiceAttempt接收start/waitReady/question/waitAnswer/cleanup回调。未ready不question，任何路径cleanup一次，无重试；复用同一runner直接拒绝，不再次start。首错以stage/kind记录；原异常只保留为不可枚举cause供本地检查，不进入JSON。清理异常单独标记，不能遮蔽原失败；只清理失败也不能声称complete。

回调仍负责有界等待、具体音频/页面资源释放，模块不添加独立真实连接或擅自延长窗口；不能用runner完成结果替代原始UI inactive、被动closed、contexts/tracks终态的验证。现有正式harness的5分钟watchdog仍应作为兜底；下一真实窗口的范围需另行协调，未获窗口不得调用start。

## 检查

[7项合成测试](diagnostics.test.mjs)、[实际TAP输出](test-results.tap)。检查跨origin/路径/凭据排除、URLquery与原ID不持久化、请求与响应敏感字段getter不得读取、状态/错误/blockedReason分类、未ready禁止问题、单用不重连、首错与cleanup错误隔离、成功/回答未完成/仅清理失败区分。所有seed均为人工测试字符串，无用户数据。测试没有浏览器、网络、provider、系统麦克风或外部服务调用。

命令：Node24.22.1内建node:test运行`node --test diagnostics.test.mjs`，7通过0失败；git diff --check通过。没有应用代码变更，未重跑无关应用套件。完整游戏录制目标仍未完成，已有两份成功视频保持原字节。
