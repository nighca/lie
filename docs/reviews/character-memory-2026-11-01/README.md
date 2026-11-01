# 切回人物后的对话记忆调查

2026-11-01，owner：本专项 Chat，工作树 `/Users/nighca/.codex/worktrees/aa77/lie`，分支 `codex/character-memory`，基线 `16d64347b853ffaaac1f2dbaa9d8ddd232f9859a`。状态：离线链路与一次真实合成试验完成；没有复现线上遗忘，尚无已证实根因或产品修复。等待用户提供具体案件/角色/对话大意及页面转写是否仍存在。

用户报告：同局 A → B → A 后，A 不记得首次对话。预期是恢复本人当局历史，B 不知道 A 新获知的信息，新局清空历史。保持浏览器内状态、不启用供应商长期记忆、不改变语音玩法。

## 实际源代码核对

- `controller.ts`：`stopVoice()` 先 `flushPending()`，再递增 epoch、取消与关闭旧连接。`selectCharacter()` 在此之后切人物。旧回调通过 session/character/epoch/abort 检查被丢弃；`readContext()` 读取实时 session 对应 character 的 history。
- `session.ts`：history 按内容人物 ID 存储，追加时复制；重开创建全新空 history。
- `context.ts`：只投影指定人物 profile/history，不截断；systemPrompt 本身未拼入 history，但 history 是工具 JSON 的独立字段。
- `liveVoice.ts`：工具返回 `JSON.stringify(scope.readContext())`。STT 先中断/提交上一段回答，再追加本次 userText；正常 TTS stop 等播放结束提交，切人时未播完文本按 interrupted 提交。
- `channel.ts`：新 WS 重新注册同一工具；调用结果按 MCP text 原样封装，无 history 截断。超过 65536 UTF-8 bytes 会显式报错/关连接，而非悄悄缩短。应用无法从当前协议强制供应商每问调用工具；供应商既有 prompt 要求不等于执行保证。

## 离线证据

新增 `apps/web/test/character-memory-wire.test.ts` 组合真实 controller、liveVoice 与 channel，只模拟 socket/音频设备。两种路径（完整回答/切人时 pending 回答）均直接解析 MCP wire 工具响应，断言 A 的旧问题、回答及新问题全部存在，B 空历史、新局空历史；旧 socket 已关闭。两项通过。连同 controller、voice-switch-controller、liveVoice 原回归共 4 文件 65 项通过；voice 包 54 项、game-core 包 54 项通过。Web TypeScript 检查通过（先运行现有 character-presets 生成步骤）。使用项目要求的 Node 24.22.1，无服务启动。

测试中的提问“我之前告诉你的暗号是什么？”没有包含答案。此处只验证实际发送的数据，不用 fake 回答证明真实模型记忆。

现有低层真实 [A2 样本](../device-concurrency-2026-11-01/independent-device/run-02.md)支持显式 history 可恢复信息；其第六题 context 调用为零，因此不能推断每轮一定调用。

## 已批准的一次真实实验

用户在本 Chat 明确批准：1 专用 Agent、1 Device，最多 4 条顺序 WS、6 次合成纯文本问答，无麦克风，不改现有 Agent/生产配置。新建资源只在本次试验使用并清理；会产生真实推理/TTS 用量，金额未知。root 仍负责协调试验 turn 与最终 review/main/push。

`probe.mjs` 复用旧资源生命周期实现，直接构建当前 `packages/game-core/src/context.ts` 产生真实字段的上下文，使用产品相同工具描述。每次提问先加入本人 history；回答追加带 id/at/interrupted 的 DialogueEntry。序列：A 教暗号、A 原连接续问、B 未知、切回 A 恢复、A 续问、新局 N 未知。后续问题不重复暗号答案。保存全合成工具上下文，分别记录内容正确与是否本问新调用，不把零新调用的正确回答误报成每轮调用成功。

专用 Agent 使用此前通用合成测试 prompt、Memory_nomem/history0；未读取生产 Agent 配置，因此其模型和实际生产配置一致性未经验证，不能把成功直接称作生产复现/修复验收。

执行上限 240 秒，cleanup 最多 60 秒且总计 300 秒；每问 25 秒、每 HTTP 20 秒、总 HTTP 上限 10（正常 8）。close1000 确认后才复用 Device。全部 socket 关闭后解绑本次 Device/删本次 Agent；不确定 owned 状态保留 ignored 0600 state 并报告，不能凭名称猜资源或盲删。原 key 仅必要读取，不输出、复制或提交；不读取 `.dev.vars`。

没有启动服务或浏览器，不操作用户 launchd 8787/8788。

## 一次真实实验结果

源方法 hash：`a5b7ec2aeba6a040592ff0e962ad0a7f418c7aa3797159cfb244adbde3f463c5`，运行前后未改。root 独立方法审查并授予专用 turn 后执行。入口为 Node 24.22.1 `--use-system-ca probe.mjs --execute-approved`，exec session 84884，exit 0；2026-11-01 北京时间 16:29:14.630–16:30:35.607，总耗时 80.977 秒。原始 [results-01.json](results-01.json) 保留，不修改各题失败字段。

| 问题 | 内容结果 | 本题 context 调用 | 严格 passed |
| --- | --- | --- | --- |
| 1 A 学暗号 | 姓名/人物口令/暗号正确 | 1 | true |
| 2 A 原连接续问 | 正确回忆暗号 | 0 | false |
| 3 换 B | 本人身份正确，不知道 A 暗号 | 1 | true |
| 4 切回 A | 从本人 history 正确恢复暗号 | 1 | true |
| 5 A 原连接续问 | 正确回忆暗号 | 0 | false |
| 6 新局 N | 本人身份正确，不知道 A 暗号 | 1 | true |

内容 6/6 正确，逐题新调用严格判据 4/6。所有题均收到 TTS stop、非 aborted、非零 PCM。顶层 `completed:true` 和 exit 0 的定义是内容正确及 session distinct，不包含所有题新调用，**不能称严格契约全部通过**。

实际第4题工具响应含 A 首次玩家暗号、首次回答、续问/回答和当前问题；B/N 响应只含各自当前问题。全部上下文为当前产品 `buildCharacterContext` 输出，未包含别人的 profile 或 ending。`contextReplies` 留存纯合成上下文，`source-sha256.txt` 留存源与回归测试身份。

4 条 WS 依次正常 close1000、closeObserved=true、readyState=3、terminated=false；每次确认旧连接关闭才开新连接。正常使用 8 HTTP，全部成功。随后本次 Device 解绑和 Agent 删除均 HTTP200/code0；0600 private state 安全投影为 cleanupComplete=true、agentRemaining=false、bound=0、tokens=0、uncertain=0。仅证明 owned 绑定/Agent 已清理，不声称供应商注册记录/日志全部擦除。

进程已退出，无新增服务/浏览器/录音消费者，专用 provider turn 已向 root 释放。用户生产服务和连接未停止。一次有界授权已使用完，没有自动重跑或改供应商配置。

结论限定：本次产品形态的短 history 可恢复，离线切人保存/投影/封装路径亦通过；不能排除实际案件较长上下文、特定问句或生产 Agent 差异。没有证据把线上现象归因为本地 history 丢失，也不能因本样本通过而说用户问题不存在。待用户提供实际对话后决定下一步；此时不推测修改产品。
