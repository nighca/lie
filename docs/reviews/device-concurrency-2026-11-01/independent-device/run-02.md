# 第二轮：独立Device并存与按局顺序复用样本

2026-11-01；状态：**动态分配、双Device并存及正常顺序切人样本已完成；严格六题总判据未全通过。** 第6题没有在该问答窗口内记录新的context工具调用，因此原始结果保持 `completed:false`，不能改写成6/6全部通过。

用户明确要求继续完整验证，总协调为[追加计划](retry-plan.md)授予新的一次独占provider测试窗口。实际新建1个专用Agent、2个Device，6次合成文本detect、5条先后WS，最多2条同时在线。未使用生产/本地用户Device，不改现有Agent、secret、服务或部署；无麦克风和输入音频，无自动重试。

## 方法与执行身份

- 基线 `4867e7d`；专用WT `/Users/nighca/.codex/worktrees/b1b9/lie`。执行方法[probe-v2.mjs](probe-v2.mjs)SHA256 `bf01c4c7ec205e0eacc3d56ee534e5a6a1550d58128c19afacb27e1177f1dbe1`，执行前实核且运行后未改。
- Node24.22.1，复用已有ws包，无安装、软链或锁文件改动。exec session54339，最终exit1来自第6题严格断言失败，不是进程崩溃。
- 原key只在进程必要读取，未复制/打印/改mode；不读`.dev.vars`。私密state在独立ignored `tmp/p0-independent-device-2026-11-01-run-02/`，0600，write-ahead原子rename；不覆盖首轮材料。
- 两次OTA目标安全投影都为`scheme:ws`、官方host/path匹配、无query/userinfo/非默认port。**真实WS拨号始终固定官方wss**，没有连接明文ws或OTA动态地址。这是本轮实际观察，不倒推首轮未保存的URL。
- Agent五项白名单读回为Memory_nomem、history0、disable_greeting true、max_tokens160、enable_search false；仅从Agent响应核对并保存这五项白名单字段，不归档或输出完整配置，未请求模型列表或账单。

## 关键时序与并存结果

UTC `05:16:50.644–05:18:33.794`（北京时间 `13:16:50.644–13:18:33.794`），elapsed103150ms。所有下表时间为同一实验起点的相对毫秒，完整结果见[results-02.json](results-02.json)。

| 时间/耗时 | 事件 |
| --- | --- |
| 0–4754ms | Agent创建、配置、必要字段读回 |
| 4758–8295ms | D1首次OTA1866ms、绑定1211ms、再次OTA456ms |
| 8296ms / 10746ms | D1-A开始WS / hello+MCP ready |
| 13749ms | D1-A保持ready3秒后，D2首次OTA请求开始；分配调用计时另包含此前约2ms本地处理 |
| 13749–17783ms | D2首次OTA1855ms、绑定1715ms、再次OTA461ms |
| 17784ms / 19886ms | D2-X开始WS / hello+MCP ready |
| 6139ms | 从开始分配D2到D2 ready的实测总耗时；D1此前已在线，未被顶掉 |
| 22888ms | 两连接共同保持3秒后开始第1题 |
| 45367ms | D1-A正常close1000确认后才开始同D1的B连接 |
| 60483ms | D1-B正常close1000确认后才开始A2 |
| 74438ms | D1-A2正常close1000确认后才开始新局N样本 |
| 99712ms | D2-X原连接完成第6题，因工具调用门槛未满足进入清理 |
| 100145–100151ms | D2-X和D1-N主动关闭，收到close1000并CLOSED |
| 100152–103148ms | 两owned Device解绑与测试Agent删除 |

D1/D2同时ready时均OPEN；D2-X从19886ms ready保持到100145ms主动关闭，约80.26秒，中间经历D1多次正常close与新WS，没有非主动关闭。5条WS最终均callerClose=true、closeCode1000、closeObserved=true、readyState3、terminated=false。这支持**本次专用资源下，独立Device可避免不同连接顶替；同Device正常关闭后顺序换人物也可运行**。

没有在当前生产网关接入动态Device分配；本轮是专用资源直接连供应商的真实协议测试，不能称生产修复已经部署。D2分配到ready6139ms只是单样本；首D1还包含Agent新建/配置，首ready10746ms，不能假定现客户端10秒窗口容纳全部冷启动，更不能填p95或SLA。

## 六题逐项结果

| 题 | 验证 | 实际结果 | 严格判据 |
| --- | --- | --- | --- |
| 1 | D1/A记录合成玩家暗号 | 回答含A姓名/口令和canary；context调用1、TTS stop、215680音频字节 | 通过 |
| 2 | D2/X独立人物不知A暗号 | 正确X姓名/口令，明确不清楚玩家暗号；调用1、TTS stop、293760字节 | 通过 |
| 3 | D1同Device换B，空history | 正确B姓名/口令，明确不知道；未出现A canary；调用1、TTS stop、280320字节 | 通过 |
| 4 | D1回A2，显式history | 正确恢复canary及A身份；调用1、TTS stop、261760字节 | 通过 |
| 5 | D1新局N，空history | 正确N姓名/口令，明确不清楚玩家暗号；调用1、TTS stop、309120字节 | 通过 |
| 6 | D2原X连接继续 | 身份/口令正确，明确不知道玩家暗号，无其他人物canary；TTS stop、280320字节；**本题context调用0** | 未通过逐题新调用要求 |

第6题原文为合成安全内容：“我叫小紫，人物口令是紫云六号。玩家的暗号我不知道，我的资料里没有这个信息。” 文本及协议输出完整，未观察到污染；失败原因明确是该题窗口内 `toolsCalled:0`，不是被顶线、音频失败或文本泄漏。D2在第2题已调用过本人物context，本轮没有证据确定第6题未新调用的供应商内部原因，不能断言是某种工具缓存机制。

原始 `questions[5].passed:false`、顶层 `completed:false`、`Question assertion failed: 6` 均保留。因断言抛出前未执行末尾汇总，原结果未写 `d2StayedOpen`/`distinctSessions`字段；前者可由WS事件时序判断，后者不从缺失值捏造，各session原值未落盘。

## 收尾与实际状态

已观察全部5条WS正常关闭，无terminate、无异常关闭。之后才清理owned绑定：D1解绑HTTP200/code0，D2解绑200/0，测试Agent删除200/0。私密状态再次投影核对mode0600、agentIdnull、bindings0、tokens0、uncertain0、cleanupComplete true；不保存或显示实际MAC/Agent/session/token。此处仅指owned绑定和Agent清理，不声称供应商所有设备注册记录、日志或历史被擦除，也不把Node close事件当内部终止API ack。

执行session54339已exit1；无新增服务、浏览器tab或残留probe消费者。结束后立即向父owner报告实际结果、cleanup与provider turn释放，再整理本档。未修断言、prompt或重跑第6题，未发额外管理/OTA诊断请求。

## 能回答与仍未回答的问题

- **可实现性：已获得真实正向样本。** 新软件身份能通过OTA/绑定取得token，已有D1在线时再分配D2并同时对话，不需要不同Agent，亦不需要共享固定Device。
- **按局固定Device：正常路径样本支持。** 同局D1的A→B→A2顺序重建WS，空history未泄漏前人物canary，显式history能恢复人物信息；独立D2整局不受影响。但这不覆盖旧握手晚到、进程失联、断网、同凭证多tab重放或跨Worker争用，仍需可靠按局所有权与关闭/不确定状态策略。
- **每轮MCP新调用：本轮不能保证。** 第6题真实反例说明“提示要求”不等于每轮都新取context；必须保留为明确限制，不用5/6自动通过冒充完整契约。
- **费用/容量/许可：仍未知。** 已产生真实连接/推理用量，未查账单；小规模可运行不代表无限软件Device许可、数量/速率无上限或资源回收完全解决。

本轮核心连接隔离问题已取得正向验证，但完整验收门槛和生产实现仍未完成。后续方案决策以这些分项事实为依据，不将总断言失败误说为“独立Device无效”，也不将部分正向结果夸成全部通过。
