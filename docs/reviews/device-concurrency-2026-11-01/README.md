# 同设备新连接顶替旧连接：P0证据审查

2026-11-01；状态：本地配置可复现，后续[生产双页面协议连接也已复现](production-2026-11-01.md)，正在决策修复；未实施。本页保存最初本地证据的独立审查，生产实测另档，不将后续结论倒写为本地实验的覆盖范围。只保存脱敏事实和方法，不复制原始本地脚本、设备/会话标识、认证值、录音或转写。

## 来源与身份

源 Chat `01a1954a-ebcd-7860-bdff-693447c817f0`，本机原证据四件在 `/tmp/lie-device-concurrency-check/`；逐件 SHA256/字节见 [sanitized-evidence.json](sanitized-evidence.json)。临时原件不是长期归档保证；本档案保留必要方法与结果。源 owner 已由总协调与专项联系，关闭回执待核，不把脚本 finally 当最终 CLOSED 实测记录。

初审草稿由总协调 child 在其自有 WT 准备；本专项实际复核四件后接管，保存于 `/Users/nighca/.codex/worktrees/b1b9/lie`、分支 `codex/voice-device-isolation`，基线为下述98d71。旧 WT 其他 pending 文件未复制。生产代码对照本机 main/source HEAD `98d71fb9ebc2f517010598c4796c8db3014a73c7`；没有查看本地私密环境文件或远端配置。

## 实际方法与结果

两段 Node/ws 脚本使用已有本地开发配置，直接连接供应商 WSS；同一配置 Device-Id/Agent-ID/token，每条连接生成独立随机 Client-Id。发送 hello 和 MCP initialize/tools/list 响应；provider 返回 session 标识仅在内存中作不等比较，档案不存标识。

1. 第一轮先准备 A、再准备 B，随后计划并行合成文本问答。A 已意外 close1000，A.ask 返回拒绝，批次以 Connection not open 停止；两个 hello 和不同 session 已记录。**B.ask 仍会在 Promise.all 参数求值时执行并可能发送一次 listen.detect**；结果里 B 有空 round。toolsCalls0、无回答文本和记录音频，不能据此声称第一轮没有请求推理或费用为零。原脚本未完成隔离问答目标。
2. 第二轮删除实际 ask 调用，只验连接。UTC 04:15:32.823 开始：A hello2356ms；A 准备完成后保持3秒；B开始5359ms；A非主动 close1000 于7040ms；B hello7470ms，B准备后再保持3秒；04:15:43.302结束。两 session 不同，toolsCalls0、rounds空。此轮没有发送 listen 请求或麦克风输入，足以复现“独立 Client-Id 不足以让本地同设备两连接并存”。没有测试不同设备并发。

两脚本 finally 都主动 close A/B，并设1秒后未关闭则 terminate；90秒总截止 timer 会在 finally 清除。结果 JSON 在 close 后立即写入，**没有最终 CLOSED ack或连接盘点**；需 owner 回执确认结束。独立审查没有执行脚本或新增连接。

## 对当前网关的意义

`98d71` 的 [gateway](../../../apps/gateway/src/index.ts) relayVoice 每次使用 `crypto.randomUUID()` 作为 Client-Id，但所有访问者共享部署环境的 LINX_DEVICE_ID，Agent-ID/token 也来自配置。局部独立 relay 对象只能隔离应用事件，不能改变供应商的设备连接契约。此处是已发布源码的风险结构；**精确代码事实以98d71 Git对象为准**，未读取生产secret或测生产并发。

本地配置没有与生产设备作同一性比较，因此不能直接宣称生产已实测顶替、全部设备只能单连接或历史用户信息已泄露。close1000只说明上游按正常关闭码结束旧连接，不代表多用户并发符合产品目标。现证据不支持仅改 Client-Id、延长600秒、增加CPU预算或自动重连作为解决方案；自动重连可能造成相互顶替循环（风险推断，未试验）。

## 既有调查与仍需决定的事实

- [连接优化官方资料归档](../../voice-connection-latency/official-docs.md)早已将同device并发契约、reset/ack、工具缓存与跨人物记忆列为未决；该历史文档包含旧180秒状态，不覆盖新600秒配置。
- [并发与额度调查](../../linx-quota-investigation.md)区分设备数、会话数、账号并发、费用闸门；它是2026-10-24文档调查，不是当前账号或并发承诺。
- [连接期限归档](../../voice-session-limit/README.md)已明确随机Client-Id与共享Device-Id，以及独立WS不能证明固定device隔离。

下一步首先核供应商连接唯一性到底按device、agent、token或其组合；动态Client-Id在这次配置下已不足。若需独立device，须确认设备创建/绑定/回收和容量、token/身份、短期上下文/工具历史隔离；是否每会话/访客独立或使用安全租约池属于待讨论架构，不在此授权资源创建/配置或实现。不同设备并存成功也不自动证明跨用户数据隔离，需另定有界合成验证。

初审归档阶段只读查阅官方公开协议，结果与待选方案见[修复调查与决策稿](proposal.md)；未查询账户API、控制台、账单或生产secret，不猜测账号限额或费用。初审阶段未进行真实WS、mic、provider调用、资源变更、服务启动或产品改动，只准备文档归档。后续获准的生产WS测试与实测收尾另见[生产档案](production-2026-11-01.md)，不更新main或push。
