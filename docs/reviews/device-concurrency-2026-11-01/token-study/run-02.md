# 同Agent跨Device共享T1：第二轮真实样本通过

2026-11-01。父owner及独立reviewer审查通过后，总协调授本轮独占providerturn。**同一专用Agent下，D1取得的同一枚T1被D1/D2两个不同Device接受并静默并存。** 这反驳“不同Device必定各用一枚token”的普遍假设；不把样本扩大为原固定本地值、生产secret或永久刷新契约。

## 方法与授权边界

- 1新专用Agent、2新Device，D1取得T1，D2只做首次OTA取激活码并绑定，**没有给D2取T2**。两WS均用内存中的同一枚T1；实际请求头使用不同Device/Client与同一Agent。
- 方法SHA256：probe `c9bdee4dcbb931eaa7d7a33d2b504781b466a38a72f75efa7ca6fd74dda79fe4`；runner-v2 `d13b8c6af8498990c5dca54c9e17aaef77b83dc557884ae3aa6399d4dc876a40`。执行前实核匹配，未临时修改方法。
- 项目专用Node24.22.1、系统CA、唯一执行flag，exec为`require_escalated`。只进程必要读取批准管理key路径；未复制key，未读legacy `.dev.vars`或生产secret。
- 实际8准备HTTP、2WS、3清理HTTP；0listen、0输入音频、0mic、无fallback或retry。Agent五项白名单读回为Memory_nomem/history0/禁问候/max_tokens160/search=false。
- OTA目标安全投影为ws、官方host/path、无query/userinfo/非默认port；**真实拨号始终固定官方wss**，没有连接明文ws或响应中的动态地址。

## 实际时序

完整脱敏证据见[result-02.json](result-02.json)，下表均为本轮开始后的毫秒。

| 事件 | 时间／耗时 | 观察 |
| --- | --- | --- |
| Agent创建／配置／读回 | 2–3647ms | 三次均HTTP200/code0 |
| D1首次OTA／绑定／取T1 | 3649–6622ms | OTA均200，绑定200/code0 |
| D2首次OTA／绑定 | 6626–7603ms | OTA200，绑定200/code0；没有第二次D2 OTA |
| D1/T1拨号／open／hello | 7606／9758／10189ms | PCM hello，取得非空session |
| D2/T1拨号／open／hello | 13192／18712／19125ms | D1已hello并保持约3秒后才拨D2；D2接受同一T1 |
| 并存观察完成／开始关闭 | 约24127ms | D2 hello后再保持5秒，两者仍OPEN且session不同 |
| D2、D1关闭事件 | 24548／24565ms | 均callerClose、close1000、CLOSED，无terminate |
| D1解绑／D2解绑／删Agent | 24565–27258ms | 三次均HTTP200/code0 |
| 全轮结束 | 27261ms | completed=true，约27.3秒 |

两条WS均未收到音频字节或TTS消息，探针未发送listen或输入音频。未做模型问答，此结果只检验握手接受和短时静默并存，不能证明上下文内容隔离。静默仍可能消耗UID会话时长，未查账单或宣称零费用。

## token期限与结论边界

仅在内存解析并归档允许标量：`format=jwt-like`、`signatureVerified=false`、`iat=null`、`exp=null`、`declaredLifetimeSeconds=null`。这表示本方法没有获得标准iat/exp安全数值投影，**不等于token永不过期**；未输出token、任意claims、完整ID或hash。不能从短测推出长期保活、轮换触发或复用到其他Agent/账户。

可依据本次样本继续审查“已绑定Device＋固定sharedToken，WS免每Device取T2”的简化方案，不再把逐Device token或每WS OTA当未经验证的强制条件。原固定token的scope/来源与线上目标值同一性、实际期限和失效恢复仍需单独证据或明确运维设计；本轮不读取那些秘密补做验证。

## 清理与交付

exec session54489最终exit0；全部本轮WS正常关闭，没有新增服务、浏览器或后台消费者。随后才解绑本轮D1/D2、删除专用Agent。收尾再次只投影私密state：mode0600、agentId为空、2条Device记录、bound0、uncertain0、无token字段、cleanupComplete=true。

这里的清理准确指本轮owned绑定与Agent，不能声称供应商所有设备注册记录/日志/历史被擦除，也不把Node close事件当供应商内部终止API ACK。原run01 state/result与只读核对结果未修改。完成后先向父owner报告exit、实际关闭与资源清理并释放providerturn，再归档本记录；没有自动开始下一轮。

执行前语法、8项离线fake及无参数安全runner均过；父owner和独立reviewer均实际审查方法。fake只验证方法控制流，本次真实provider回执才是共享T1的正向证据。
