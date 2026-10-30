# 语音上限集成候选复验

2026-10-30（Asia/Shanghai）；独立验收 owner `session_limit_acceptance`。仅复验，不修改应用、Git refs、main 或远程。

## 候选与验证身份

- worktree：`/Users/nighca/.codex/worktrees/lie-coordinator-integration/lie`。
- 候选：`dc6a6ad11dd114ae54fb377ea04dd212e5020fb8`；从 main `60c11f72b71ead4b8e744f2281d5dbecb796d11a` 按顺序 cherry-pick 调查及实现，候选提交 `5da6062` → `dc6a6ad`。
- 源专项：`597d7635e3052c96639893164b7b6b086be12a5f`。两者完整 Git tree 均为 `ae3a51758bbd8fffce25bdb2d3d955fdec5b10e4`，不是仅选取文件相同。
- 锁文件 SHA256：`2efd70fe940997ce63746a05a6d5574974560a67d6a737f4801e9f9e254e82e0`。五份改动源码/测试哈希逐项匹配专项 [verification.json](verification.json)。
- 只读复用既有 Node.js `v24.22.1` / npm `11.19.1` 工具链，候选独立 `npm ci --ignore-scripts` 成功：217 packages，0 vulnerabilities。未复制或软链另一 worktree 的 node_modules，未改 lock。缓存、临时目录均在本候选 ignored `tmp/session-limit-acceptance/`。

## 审查与实际复验

已阅读 gateway 全部改动、实际 relay/config、相关路由测试及 fake-clock/config 测试，未发现阻碍集成的问题。配置仅来自服务端 text binding；规范正整数字符串与毫秒 timer 安全范围在上游 fetch 前检查。默认从 relay 创建开始计时，消息不续期，提前关闭清 timer、双端幂等关闭等原行为保持。没有把客户端玩法额度迁入网关。

本候选实际执行：

| 命令 / 核对 | 结果 |
| --- | --- |
| `npm run typecheck --workspace @lie/gateway` | 通过，含 Worker 与 scripts 类型检查 |
| `npm test --workspace @lie/gateway` | 6 文件、34 项通过；含 fake-clock 600 秒边界、独立连接/早关、非法配置不调用上游、真实 workerd 路由 1 秒 override 与请求 header 无法覆盖 |
| `npm run build --workspace @lie/gateway` | `cf 1.0.0-beta.18` 构建通过；仅离线 gateway 构建，不部署 |
| 读取实际 `apps/gateway/.cloudflare/output/v0/workers/default/worker.config.json` 的单个非敏感绑定 | `VOICE_MAX_SESSION_SECONDS = {"type":"text","value":"600"}` |
| `git diff --check 60c11f7 HEAD` | 通过 |

根全套测试、类型检查与 Web＋gateway 完整构建复用源专项已通过结果：候选完整 tree、锁文件与执行工具链身份相同，且运行代码没有后续变化；不声称本轮再次执行根全套或重新核验 Web 资产组合。协调者后续文档修订不改变这些运行输入。

## 环境与边界

没有手动启动应用/开发服务或浏览器，没有真实 provider、麦克风、账号或部署操作。测试中 Miniflare/workerd 全部使用内存假上游，由现有 afterAll dispose；命令已正常退出。本轮结束只读进程核对未见残留的 workerd、Vitest 或候选 worktree 执行进程（除核对命令自身），没有停止未知进程。没有操作 8787/8788 或主工作区文件。

此次结果不证明真实供应商、手机后台或连续真人 10 分钟会话。600 秒仍包含准备时间，不能保证一次连接完整提供 600 秒游戏询问；累计消费、provider idle、UGC 时长边界仍按 [实施记录](implementation.md) 独立保留。
