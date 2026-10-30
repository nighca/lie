# 播放器与600秒网关组合验收

2026-10-30（Asia/Shanghai）；独立验收 owner `session_limit_acceptance`。仅复验、记录结果，不修改应用、Git refs、main 或远程。

## 候选与输入身份

worktree：`/Users/nighca/.codex/worktrees/lie-playback-integration/lie`；分支 `codex/lie-playback-integration`。基于 main `a742b1ecbe2a6227d53958ed3275a9f4089c5b96`，有序 cherry-pick 连续调度及本地诊断 `5e97cda1bfe4e5621467bb4560cdfea2848b4591` → `8829f2cdd83ece92b177223df9f3806f31039687`、100ms预缓冲增量 `decf1f17724250754db4041724a96f55fd12b57c` → `e02770159444f86e8d4587d2d6cd7321479d3f95`。

独立实际 diff 核对：候选的 `apps/web`、`packages/voice`、可执行历史 harness、根 package/lock、scripts 和 design 均与源 `decf1f1` 无差异；`apps/gateway` 与 main `a742b1e` 无差异。没有用旧源树覆盖最新600秒网关。

[prebuffer-verification.json](prebuffer-verification.json) 的11份源码、测试、harness及原生夹具/结果 SHA256 全部逐项一致；锁文件 SHA256 同为 `2efd70fe940997ce63746a05a6d5574974560a67d6a737f4801e9f9e254e82e0`。协调文档后续修订不改变这些运行输入。

使用现有工具链只读执行 Node `v24.22.1` / npm `11.19.1`；候选独立 `npm ci --ignore-scripts` 成功，217 packages、0 vulnerabilities，lock未变。没有复制或软链其他 worktree 的 node_modules；缓存、日志、TMPDIR与构建临时文件均在本候选 ignored目录，原始验证日志在 `tmp/playback-integration/`。

## 审查与组合复验

阅读实际播放器/桥接/DEV诊断变更与周边生命周期及目标测试，未发现阻碍集成的问题。核对连续分片沿nextTime衔接，首次/耗尽恢复按100ms样本阈值或首pending的100ms timer起播，normal TTS stop flush短尾后等待真实drain；立即中断清pending/timer/sources，异步播放失败不伪报成功idle，过期scope不污染新会话。DEV诊断仅保留有界数值事件，无自动上传。

| 本候选实际执行 | 结果 |
| --- | --- |
| `npm run typecheck` | 全部workspace通过 |
| `npm test --workspace @lie/voice` | 4文件54项通过 |
| `npm test --workspace @lie/web -- test/liveVoice.test.ts test/liveVoice-prebuffer.test.ts test/voice-capture-readiness.test.ts test/voicePlaybackDiagnostics.test.ts` | 4文件34项通过，包含真实player接入替身channel/mic及诊断collector |
| `npm test --workspace @lie/gateway` | 最新网关6文件34项通过，包含600秒fake-clock/配置校验和workerd替身路由；没有以旧源16项替代 |
| `npm run build` | Web＋cf gateway完整构建通过；8预设121资源strict检查通过；独立冷缓存生成82份唯一WebP派生，未借用其他WT产物 |
| 实际生产Web入口 | `apps/web/dist/assets/index-JyPHfPjh.js`，SHA256 `9b3feb93e4fa4256be304f6dd3bd57cefe26c1c3566f8f9a9dac36414b0497b7`，与源交付产物逐字一致 |
| 生产JS marker扫描 | 未包含DEV collector开启/读取函数名、源模块路径或browser/prebuffer QA夹具路径 |
| 实际生产Worker配置 | `VOICE_MAX_SESSION_SECONDS = {"type":"text","value":"600"}`，从本次完整构建的 worker.config.json 单独读取 |
| diff whitespace | 通过 |

构建保留既有Vite未来native configLoader提示及cf工作区根lock探测提示，没有新增构建错误。运行源码/锁文件/资源身份匹配，源专项其他未变化模块的全套结果及历史harness类型检查可复用；本轮没有重新执行根全部测试或运行真实harness。

## 原生证据与限制

独立原生12场景结果、fixture与其实际消费的player/liveVoice源码哈希相同，生产Web入口也一致，本轮复用源专项原生OfflineAudioContext证据，不重复开服务或浏览器。原生结果JSON SHA256为 `c7bf9d40ae2460026cbd38ca2a38fed7c8a605a58bdb762f37ae05b071328f1e`，12个`schedulingPassed`均通过。

48kHz下阈值连续与耗尽恢复两场景仍各有5/2个输出样本相对单source不同，最大差0.25；保留`seamMatchesSingleSource:false`。不能将排程/缓冲验证称为声学等价、真实硬件爆音全部解决，亦未证明手机实时deadline、真实网络到包或provider行为。600秒连接仍包括准备阶段，不保证完整600秒可询问或累计费用封顶。

## 环境收尾

没有手动启动应用/开发服务、浏览器、真实provider/mic或部署，没有操作5176/5544/5198/8787/8788。测试的Miniflare/workerd仅内存假上游，按既有afterAll dispose；完整命令正常退出后，只读进程核对未见候选worktree、Vitest、workerd或cwebp残留执行进程（除核对命令自身），没有停止未知进程。

仅新增本验收文档，不提交。候选中的其他协调文档修改由协调者/对应owner管理；未覆盖其内容。交总协调审查后按单integrator流程集成/push，本记录不代表已经main、远程发布或生产部署。
