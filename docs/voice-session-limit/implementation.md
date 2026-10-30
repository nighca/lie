# 可配置语音连接上限（默认10分钟）

2026-10-30；用户明确批准方案B：保留服务端上限、可配置、默认10分钟（600秒）。本专项已向用户说明并保留计时从relay创建开始、包括准备阶段的边界；没有批准改成ready起点、延长游戏询问预算、增加UGC上限或实现累计费用系统。

源分支 `codex/lie-voice-session-limit`，开始实施HEAD `2886bd90fc299a7627b9abbef6cf4c1bd8a79efb`；该提交仅包含此前基线60c11f7的调查材料。工作树 `/Users/nighca/.codex/worktrees/lie-voice-session-limit/lie`。本报告是专项源交付，整合和发布由总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 独占并另报。

## 实现与配置契约

`apps/gateway/cloudflare.config.ts`增加普通text绑定`VOICE_MAX_SESSION_SECONDS`，采用`bindings.text(process.env.VOICE_MAX_SESSION_SECONDS ?? '600')`。它只在网关配置进程中读取环境变量，生成部署Worker的env值，不是VITE变量、浏览器数据、secret或上游参数。网关保留现有InferEnv类型来源。

WebSocket升级请求先保留原Origin/空query/凭据检查，再解析配置，在发起上游fetch之前拒绝非法值：返回固定`500 Invalid voice session limit configuration`，不返回配置值或凭据。静态/health不受影响；voice/status仍只检查凭据是否存在，没有把它改成完整配置健康诊断。

配置是规范十进制正整数字符串：`1`至`2147483`秒，不含前导零、空格、小数或指数形式。其毫秒值不超过signed32-bit Web timer上界2147483647；0/负值/NaN/Infinity/超界均拒绝，没有无限模式。runtime绑定缺失时仍默认600，以保留直接调用/旧测试环境的缺省行为。relaySockets新增可选第三参数秒数，正常生产调用只传解析成功的服务端值，旧双参调用默认600。

每条连接仍在上游升级成功、relay创建时开始计时；期间hello、工具/麦克风准备、沉默、等待、播放都不暂停，也不因消息续期。到点按原方式code1000/reason`Conversation time limit`关闭两端。上游握手10秒、64KiB帧限制、幂等finish、提前关闭清timer、关闭后丢弃晚包都保持。

从仓库根目录配置本地或部署构建（仅示例，本任务没有运行dev或部署）：

```sh
VOICE_MAX_SESSION_SECONDS=900 npm run dev --workspace @lie/gateway
VOICE_MAX_SESSION_SECONDS=900 npm run build
```

缺省不设置变量即可600。改变生产值需要正常重新构建和发布；修改本机shell环境不会改变已部署或已建立连接。**本轮验证的配置入口是进程环境→typed config→生产text binding**，不是`.dev.vars`。该文件与声明text binding的优先级未经本轮验证，不在`.env.example`新增会暗示可直接复制的该设置；原有凭据占位也未顺手清理。

## 验证范围

遵循[Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)的配置/运行时边界，保持本项目cf方式，不迁移或安装Wrangler。实际pin `cf@1.0.0-beta.18`的`@cloudflare/config`类型在`public-B1DQ7JeZ.d.mts:1647–1650,1898–1904`声明text binding的type/value形状及text(value)签名；[官方typed config](https://developers.cloudflare.com/cf/projects/cloudflare-config/#understand-the-default-export)同样示例`bindings.text(...)`（2026-10-30读取）。配置测试实际导入本工程cloudflare.config.ts，核缺省600和配置进程覆盖17。

独立安装本WT锁定依赖，不复制/symlink其他worktree的node_modules，不改锁文件。只读执行此前已核Node24.22.1/npm11.19.1工具链，所有本任务临时缓存/日志/生成夹具在本WT忽略的`tmp/voice-session-limit/`；TMPDIR与npm缓存均指向这里。

- 假clock直接调用实际relay：旧179999/180000ms时刻不提前关；599999ms未关；600000ms关闭两端；临界前发送消息不续期；晚包丢弃/反复error不重复close；短override独立计时、提前关闭清timer。
- 请求级测试：10种非法设置均500且fetch mock零调用（即使回归也不会连接真实provider）；1秒和最大2147483秒技术边界通过校验，走到替身升级拒绝，不等待长时长。
- 真实workerd路由＋内存假上游：server env=1秒时1000到期关闭，浏览器`X-Voice-Max-Session-Seconds:600`不会控制寿命；server env=0时500且假上游fetch计数为0。
- 配置与产物：检查缺省600和覆盖17的实际生产Build Output text binding，最后恢复缺省600产物；摘录仅保存该非敏感绑定，不复制全部配置或凭据。
- 不做真实10分钟语音、provider/mic/浏览器或费用实测；fake/workerd成功不是生产供应商寿命/计费证明。

最终实际结果（同一生产源码，无后续源码变更）：

| 检查 | 结果 |
| --- | --- |
| 独立npm ci | 通过，lock未变；Node24.22.1/npm11.19.1 |
| 根npm run typecheck | 所有workspace通过 |
| 根npm test | 全部通过：scripts9＋24；gateway6文件34项；web37文件357项；animation80、core52、UI59、voice40 |
| 根npm run build | Web＋cf gateway通过；strict8预设121资源通过 |
| 生产text binding默认构建 | `{type: text, value: 600}`（实际JSON字符串值为`"600"`） |
| 仅gateway覆盖值构建 | 配置进程值17生成`{type: text, value: 17}`（JSON字符串值`"17"`） |
| 仅gateway恢复默认构建 | 成功，最终产物binding恢复字符串`"600"` |
| 历史probe/文档检查 | 旧180秒源码/结果保留；本次脚本语法、文档本地链接、JSON、diff whitespace通过 |

[verification.json](verification.json)仅摘录本非敏感绑定、版本、检查结果和本次修改源码SHA256；原始临时日志仍在ignored tmp，不提交一次性缓存。构建存在既有Vite未来native configLoader扩展名提示与underline.svg运行时解析提示，未出现本次新增构建错误。

首轮根types已通过；首轮根npm test在main-preview最后一个fixture失败：任务TMPDIR置于ESM工程下，其无扩展fake npm继承根type:module，require报错。没有改项目测试或源码来绕过；仅在忽略tmp/runtime中放CommonJS package边界，恢复该合成夹具预期的运行环境。

一次重跑被自动审批拒绝，理由是它将main-preview日志中的8787当作会启动受保护服务。经只读审查：`scripts/main-preview.test.mjs:24–27`的service仅timer替身，213–215替换default npm/Vite为timer-only合成可执行文件；唯一真实Vite测试148行明确port0、150行after关闭。附这些证据申请同一命令后审批通过；没有通过改测试或间接执行规避拒绝。日志中的8787/8788只是runner元数据，未运行实际main服务。

## 保留边界

600秒游戏不保证在一次连接内完整问满600秒，因为准备阶段消耗同一个网关连接寿命，网络/provider也可提前结束。官方局共享询问额度、准备不扣游戏时间、切人/停止/隐藏/断连资源释放均不改；UGC仍只要求正safe integer秒，无新业务分钟数上限。新配置不会取客户端budget，也不会信任query/header改变寿命。

provider空闲策略、不同连接与固定device的隔离、SKU及实际计费仍独立。有限cap只界定单连接；重连/并行连接可累计消费，不能称为按人/局/账号或全球费用封顶。邀请码方案仍暂停；没有新增认证、限流、数据库/DO、资源权限或自动重连。

旧调查[relay-clock-results.json](relay-clock-results.json)继续保存180秒历史证据，[脚本](relay-clock-probe.cjs)固定通过git show读取60c11f7，未覆盖成新600秒结果。

## 交付与服务

没有手动启动应用服务或浏览器、没有碰8787/8788、没有账号/auth/资源/部署调用。测试自身创建的workerd/Miniflare与临时port0隐私夹具由既有afterAll/after清理；不留下供用户消费的服务。没有更改其他WT、中央project-plan/development、播放器或游戏代码。

源文件冻结后已由专项 root 完整审查实际源码、相关测试、typed config 和配置说明；核对 verification.json 的五份源码/测试哈希全部一致，独立复验网关6文件34项通过，并直接读取最终 worker.config.json 确认 text binding 为字符串600。仅由专项 root 保存任务分支提交，再批量交总协调审查、集成与推送；本专项不更新 main 或远程。所有新增与修改文件以最终git status/diff和验收摘录为准。
