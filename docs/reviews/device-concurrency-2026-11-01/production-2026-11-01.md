# 生产入口双标签页连接顶替复现

2026-11-01；专项owner `01a19557-145d-72f3-ace4-382ac03c22c9`，执行subagent `production_reproduction`。**一次生产传输路径实验已复现A被关闭、B继续在线；不是完整游戏UI、真人双人问答或数据泄漏验收。**

## 授权与实际范围

用户在专项明确要求“那先完成线上环境复现，可以接受测试期间顶掉其他用户，可以跟总协调同步”。总协调收到同步后为本次测试保留独占窗口，避免其他Agent同时造语音连接、发布或维护。一次双连接、每条ready后保持3秒、总截止30秒，无自动重试；不创建设备、不读私密配置、不改资源/线上部署或本地服务。

使用两个新建Codex IAB标签页，均打开 `https://lie.agency/`。在A的实际页面版本弹窗读到完整构建SHA `98d71fb9ebc2f517010598c4796c8db3014a73c7`。通过tab-scoped CDP `Runtime.evaluate` 在各自页面创建原生 `WebSocket('wss://lie.agency/api/voice')`；浏览器生成正常同源Origin，经过实际生产网关转发，不从脚本提供provider凭据或Device/Client/Agent headers。

IAB的Playwright evaluate只读，故采用其公开的开发CDP能力；没有切到用户Chrome。子agent无法设置IAB visibility参数，第二页使用默认创建，未调整用户viewport。仅在自建A打开版本弹窗；未操作用户已有页面、storage或麦克风。

协议只发送PCM hello及MCP initialize/tools/list响应，提供一个合成工具描述，不发送listen、ask、音频，也不返回人物context。ready定义为收到hello且已回应tools/list。具体方法已保存为[非自动执行脚本](production-method.mjs)；只供审查，重新调用需另获授权。实际[脱敏结果](production-evidence.json)不含session标识、摘要值或关闭reason原文。

## 实测时序

实验UTC `04:40:29.930–04:40:41.747`，即北京时间 `12:40:29.930–12:40:41.747`，总计11.818秒。以下统一以实验开始为零点，由各页绝对startedAt加本地计时换算，毫秒测量存在工具调度开销；不是服务端追踪时间。

| 全局相对时间 | 事件 |
| --- | --- |
| 22ms | A开始建立生产WS |
| 1992ms | A浏览器WS open |
| 2538ms | A hello与MCP ready |
| 5556ms | 发起B的CDP建立命令；此前读取A仍OPEN、无主动关闭 |
| 5567ms | B页实际开始建立WS |
| 7705ms | B浏览器WS open |
| 7931ms | A收到非主动close1000，wasClean=true；探针未调用A.close |
| 8533ms / 8539ms | B hello / MCP ready |
| 约11539ms后 | B在ready后保持3秒仍OPEN；开始读取结果与清理 |
| 11816ms | B主动关闭后收到close1000、wasClean=true |

两条hello都有session，页内计算digest仅用于内存不等比较，结果不同，值不输出不保留。两边toolsCalls=0、listenSent=0、音频收发=0、protocolErrors=0；没有申请mic或发送任何人物问答。UID仍可能按连接时长计用量，未读账单。

这比此前“只有本地配置复现”的证据更强：**生产同源网关路径下，B建立期间A确实被非主动关闭，而B继续在线。** 结合当前源码固定Device而随机ClientId，与本地对照现象吻合，支持同类生产并发风险。浏览器看不到网关注入的生产Device/Client/Agent值，因此没有直接核实其实际值，也未证明唯一性键的完整服务端规则。只有一次试验，无法独立排除测试期间另一个外部访客连接的干扰；没有证明历史泄漏或所有断线都由本问题造成。

## 清理与验证

A本身已CLOSED；B由探针主动close，收到浏览器close事件。收尾时两socket的readyState均为3（CLOSED），两closeCode均1000、wasClean均true，区别于旧本地JSON缺最终关闭记录。**这证明浏览器侧关闭完成，不是供应商内部会话清单或终止API确认。** 两个自建IAB标签页随后关闭，IAB tab inventory为空；没有shell probe进程或临时本地服务需要停止。无重试、配置变化、设备创建/解绑、mic、推理问答、部署、main或push。

当前实验只改进复现证据，不是修复；供应商会话/设备契约、独立身份方案与完整真实隔离验收仍按[决策稿](proposal.md)推进。
