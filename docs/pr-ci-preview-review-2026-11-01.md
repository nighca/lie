# PR 自动验证与预览：续接核查

2026-11-01；状态：无凭据 PR CI 已获实施授权；预览部分决策已确认，完整功能方案讨论中。沿用 [2026-10-25 完整提案](pr-ci-preview-proposal.md)，不覆盖其备选和决策证据。

## 本次实际基线

- 专项 managed worktree：`/Users/nighca/.codex/worktrees/1ead/lie`；初始 HEAD `a8be75823ceb67966390b5534d725a3a8bf1505b`，与交接 intended base 一致。初始 detached HEAD，工作区干净；实施前在本 worktree 分配唯一 `codex/` 分支，不再创建第二个工作区。
- 当前本地 main 也为该 SHA；本轮没有 fetch，不能以本地 ref 证明远端状态。
- 总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 保留唯一 main/integration/publication turn。本专项未占用共享 workflow/helper 文件；实际实施范围确定后一次协调 ownership。
- 已读现行 CI/CD YAML、`scripts/ci-release.mjs` 及测试相关拒绝条件、Cloudflare config、package、CI/CD与部署说明、中央计划。CI 仍只接受 main push/手动入口；仓库尚无 PR workflow。
- CD 仍只接本仓成功 main CI，核对 run/attempt/SHA/artifact provenance 与 digest，恢复完整 production output，并在部署前再查 latest main。helper 拒绝 PR/fork、Preview output 和错误 Worker；预览必须另建 helper，不扩大生产入口。
- config 已设 `cpuMs: 30000`、语音连接默认 600 秒，仍声明三个 Linx secrets。此工作区尚无 SHARED_GAMES binding。

## 保留的推荐

1. 指向 main 的实际 GitHub 贡献 PR 跑完整无凭据 CI；AI 内部仍按 worktree → root review → main 集成，无内部 PR。固定 gate 先报告结果，不改 main 分支规则或 bypass。
2. 同仓 PR 自动预览，fork/Dependabot 低信任来源按当前 head SHA 由维护者批准，每次更新重新批准。草稿先 CI，ready 后预览。
3. 首版仅 UI/内容；静态 Web dist 由默认分支受信 gateway/config 封装。发布器不执行 PR scripts/config/hooks；明确 UI merge SHA 与 harness SHA。PR Worker 只接受 CI 检查，不宣称其公网行为已验。
4. 独立父 Worker 与原生 Previews；无 Linx/生产数据绑定。独立父 Worker 不等于凭据层面的账户隔离。token、environment、公开访问和测试 PR 仍须具体授权。

## 今日现状变化与缺口

- 交接报告 Workers 已升 Paid；本轮未读取账户或账单。套餐变化不构成语音、额外资源或费用授权。
- 交接报告分享持久化 backend `27a08aeceb81093b62cffde65124bf3f445df67e` 已 review、frontend 正接线，尚未进入本基线；已有生产与隔离验收私有 R2 桶。它们都不是 PR 预览可用的数据资源。
- 建议首版对持久化分享明确显示不可用/受限状态，保留本地草稿与可用的纯浏览器交互。不能继续笼统承诺“分享全链路验收”。若用户要求测试真实存取，先与分享 owner 确认协议、隔离与清理，再形成独立存储方案；不暗绑现有生产/dev 桶。
- Web artifact 仅取明确的 dist inventory，限制单文件/总大小与文件数；不将仓库、设计或视频目录打包。旧版资源 14 天/256MiB 兼容保留提案已被否决，本专项不恢复。

## 官方能力复核与局限

本轮只读公开官方文档，未调用账户 API、安装依赖或运行预览上传：

- [cf 项目文档](https://developers.cloudflare.com/cf/projects/#deploy-a-preview) 仍列出 `cf previews deploy <name>`、preview build output 与 mode 匹配；明确该命令没有 `--dry-run`、需要凭据，beta 可变化。不能用通用 help 的 dry-run 字样认定上传安全。
- [Worker Previews](https://developers.cloudflare.com/workers/previews/) 仍说明 URL 默认公开；Paid 每 Worker 500 个 Preview、每 Preview 100 次部署，触限自动淘汰。此为平台文档上限，不是本项目预算，也不是当前账户可用余量。
- 同页说明 R2 等隔离取决于绑定独立资源，service binding 会调用目标生产 deployment。因此 ASSETS-only 白名单仍必要。
- 本 worktree 没有已安装的 `node_modules/.bin/cf`；锁定 CLI 的当前实跑/help/schema/预览构建与远程 URL、删除语义尚未在此验证。没有以新版官方页面代替锁定 beta.18 的实证。
- `docs/ci-cd.md` 开头仍保留 10 月 25 日“远程尚未执行”的历史口径；当前触发行为以实际 workflow/helper 为准，交接中的已发布状态不冒充本轮远端核查。

## 用户本轮确认与实施批次

用户明确授权实施 PR CI，并确认同仓自动、fork 逐当前提交批准、公开链接、同 Cloudflare 账号专用 token（不选独立账号）。无需重复确认这些选择。用户希望预览也有真实语音和持久化分享，要求先解释阻碍及所需代价；此前 UI-only 推荐未被采纳为首版目标。

第一批由子 agent `pr_ci` 在本隔离 WT 完整实现/验证，只拥有新增 `.github/workflows/pr-ci.yml` 与 `docs/pr-ci-validation.md`。父 owner 负责实际 diff review、交付总协调；总协调保留 main/push turn。已向总协调发送唯一新增文件 ownership 与批准边界，并向分享 owner 请求接口/隔离建议。生产 ci/cd/helper 和规则均不修改。

## 完整功能预览：具体可行路径（提案，未批准资源）

功能可用与执行 PR 后端是两个维度。建议默认 PR UI + 已审 main gateway，gateway 真实调用预览专用 provider/存储；这样可以实际玩与创建/打开分享。PR 的 gateway 变化仍只有 CI 覆盖，不能称为该 PR 全栈部署。若需要实际测试 PR Worker，需额外批准该版本的后端代码执行；仅 fork 发布 SHA 审批本身不等于安全审查所有后端改动。未经审查的 PR Worker 若持有 provider token，可以读出并外传；若持有 R2 binding，可以读写所绑定桶全部内容。Cloudflare 部署 token 始终只在受信 publisher，绝不给运行时或 PR 构建。

### 持久化分享

已实际读 backend `27a08ae`：`SHARED_GAMES` binding，当前固定对象路径 `games/v1/<contentId>.json`，POST 校验同 origin/大小/结构/预设形象，GET 按 ID；没有 PR namespace，也没有完成对象 TTL。因此建议每 PR 独立私有 Standard 桶，仅允许预览 gateway 绑定它，创建/关闭清理由受信 publisher 执行。优点是不改分享 API、跨 PR 数据隔离直观；代价是创建/列出/删对象/删桶生命周期与失败补偿需要实现。PR 关闭后链接失效，明确为测试数据，不导入生产。PR 更新建议保同 PR 桶以便回归；协议不兼容时由 owner 决定清理，不能静默删数据。

另一条路径是一个预览桶按 PR prefix 分隔，但当前后端没有 prefix 接口，且 prefix 不是 R2 binding 权限隔离。只适合受信 main gateway 统一控制；不能用它承诺任意 PR Worker 互不访问数据。具体选择待分享 owner 回执和用户范围收敛。

[R2 官方当前价格](https://developers.cloudflare.com/r2/pricing/)：Standard $0.015/GB-month、Class A $4.50/百万次、Class B $0.36/百万次；账户共享每月免费 10GB-month/100万 A/1000万 B。按百万次等单位向上取整，不能把零散请求的线性估算当账单。小型 JSON 人工验收通常远低于额度，但账户余量未读，不能保证免费；不能套用新桶独享额度。主要工程成本在生命周期，不在存储容量。

### 真实语音

当前 gateway 用固定 LINX token/device/agent。新增预览专用 agent/device/token（不复制生产设备/凭据）可以复用现有 relay；当前 Worker CPU30000 与600秒连接上限已在基线声明，不需为此换套餐/搬运行时。平台是否有额外设备额度/并发限制、专用资源初始化与回收仍需按授权实测。

按 PR 分配独立 device 可隔离不同 PR，但同一 PR 多人/多 tab 仍共享 device；不能把它称为已解决多人隔离。最低操作成本方案是少量维护者协调串行验收；并发可靠性要求则需要已验证的独立会话身份分配或设备租约/回收，成本更高，可能涉及新增受信 broker/协调状态，须另定范围。公开页面不必意味着无限匿名付费语音：如需门控，可仅限制语音与写入 API，保持静态页面公开；这是新提案，不擅自恢复已暂停的邀请码方案。

[灵矽当前计费规则](https://linx.qiniu.com/docs/xrobot/billing/resource-usage-billing)：UID 资源包按设备连接会话时间乘以模型和音色系数相加后的倍率扣减，静音等待也可能消耗连接时长；具体系数看 agent 当前配置，不猜人民币单价。例：20 次各5分钟有效会话合计100分钟，倍率1.5时为150资源分钟；此为假设示例，不是当前agent价格/系数。余额显示可按日聚合延迟，不能拿余额页面作实时硬止付。

[Workers 当前价格](https://developers.cloudflare.com/workers/platform/pricing/)：同账户 Paid 套餐的共享请求/CPU用量，不按每个 Preview 重收一份基础月费；超额有请求与CPU费用，ASSETS走Worker first不能把全站说成零计费。WS初始Upgrade计请求，消息不逐条计请求，但仍有CPU消耗。主要新增消费预计来自真人语音测试，实际数额取决于测试频率、时长、模型/音色及账户当前额度。

所需后续操作：确定后端执行边界 → root/分享 owner 协调接口 → 配置专用 preview token/environment 与父Worker → 专用存储/provider资源 → 验证真实问答/分享写读/PR更新与关闭清理。用户本轮未授权执行这些外部写操作；目前只实施独立无凭据 PR CI，不开测试 PR、不改 secrets、不部署、不购买。7天闲置/20软警戒仍待定，不构成硬预算。

## PR CI 实现 review 与分享候选增量

子 agent 提交 `7a13cebde0bc53d60e0a9286ed9cc9926d9bbb6e`；父 owner 已逐文件读取完整 diff，并独立重跑现有 handoff guards 17/17 通过。仅两项新增文件，verify 命令与当前 main CI 对齐；gate 使用 always 和显式 success 判断，不把取消/跳过当通过。未加入部署 artifact 或 secrets。

总协调确认本专项三文件 ownership 无冲突，分享发布候选为 `98d71fb9ebc2f517010598c4796c8db3014a73c7`，正在发布而非本轮已核 published。父 owner 已读相对 a8 全部变更文件清单及 CI 相关 package/config diff：新增 gateway workspace 的 game-core 依赖/R2 binding 与 gateway/web/core 测试；生产 CI 命令未改。PR CI 使用 npm ci/workspace typecheck/coverage/build，会随测试合并提交接入这些代码和 lock，而非固定 a8 代码。dry-run 带 provision=false 不创建桶，但含 R2 的精确合并基线 dry-run 本轮未重跑，需 root 候选与首次 PR CI 实证；不把本轮 17 guard 通过当分享功能或远程 R2 验收通过。与 root 集成后最终 SHA/远程 Actions 结果另行记录。

本轮无服务、端口或浏览器操作；完整批次按 base/dependencies/ordered commits/full diff/checks/局限交 root review。未集成或 push。
