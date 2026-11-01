# 第二轮隔离验证申请与方法差异

2026-11-01；状态：**仅离线准备，额外新资源轮次和新独占窗口待确认**。首轮[结果](run-01.md)、`probe.mjs`及`results.json`冻结保留，不覆写。不是自动重试，也不沿用首轮剩余问答额度。

首轮成功创建/配置测试Agent、绑定D1并取得token，但在未使用的OTA地址校验处停止，零WS零问答。官方[OTA协议](https://linx.qiniu.com/docs/xrobot/platform/OTA)的已绑定示例使用 `ws://xrobo-io.qiniuapi.com/v1/ws/`，原探针只接受`wss:`，因此与该官方示例不兼容。首轮未保留原URL，不能断言首轮实际返回的就是`ws:`。

## 唯一功能修正

[probe-v2.mjs](probe-v2.mjs)由首轮实际执行的f9e2方法快照复制，除轮次隔离外只修OTA目标校验：

- 接受官方配置声明的`ws:`或`wss:`，继续要求精确官方hostname、`/v1/ws/`路径、无query/userinfo/非默认port；不扩大为任意代理。
- 校验前只保存安全投影：scheme类别`ws/wss/other/invalid`，knownHost、knownPath、hasQuery、hasUserinfo、hasUnexpectedPort布尔。原URL、任意host/path文字和参数名/值均不入结果。
- **实际拨号仍始终固定 `wss://xrobo-io.qiniuapi.com/v1/ws/`**，不使用OTA动态URL、不连接明文`ws:`。Device token仍须非空，且只放固定官方WSS认证头。
- 新轮私密状态在本WT ignored `tmp/p0-independent-device-2026-11-01-run-02/`，0600原子write-ahead，首次wx防重复；新公开结果为`results-02.json`，不会覆盖首轮。

## 拟追加的执行范围

需重新确认**再新建1个专用测试Agent、最多2个新Device、最多6次合成文本问答**。从首管理请求起300秒实验、清理最多60秒并锚定总360秒；每管理请求20秒、每问25秒；无真人麦克风、无输入音频、不改现生产/本地资源、不盲重试。任何失败立即停止后续分配/问答并清理已确认owned资源，状态不确定则保留私密记录待核。

继续执行原[六问矩阵及判据](plan.md)：D1在线时才动态分配D2、双独立Device并存；D1顺序切人物/显式history恢复/新局空history，D2保持同WS且继续问答。canary不在新人物问题或context中泄漏；同Device复用前必须观察正常close1000，异常则停止复用。UID静默连接仍可能产生费用，最多约600设备秒乘适用倍率并非严格账单封顶。

准备运行命令（**批准与新turn前不执行**）：

```sh
'/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node' --use-system-ca docs/reviews/device-concurrency-2026-11-01/independent-device/probe-v2.mjs --execute-approved
```

只直接读取已授权私密key路径，不复制/打印/改变原key文件，不读取`.dev.vars`。结束交付实际配置读回、各管理/连接阶段时序、问答/工具/TTS/audio判据、每socket关闭或terminate、owned解绑与Agent删除结果；成功也不把端侧CLOSED当供应商内部终止ack，不能由有限合成样本承诺所有生产边界。
