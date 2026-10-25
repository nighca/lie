# PR 合入前检查与逐 PR 预览方案

2026-10-25；状态：**待用户确认，仅方案，未启用**。来源：用户要求独立 chat 先评审方案，再实施；专项 chat `01a1730f-9304-7d51-bf5b-8c20c3d37920`，主协调/唯一 integrator `01a17012-fa00-7170-ac0a-21c1900d71cd`。基线 `57ff7d5984126932ba0367c6b47bfe911d03a480`。本方案不改变 AI 内部直接集成 main、不开内部 PR 的协作约定；PR 指实际 GitHub 投稿/贡献 PR。

## 推荐与待确认决策

推荐首版：**每个指向 main 的 PR 做完整无凭据 CI；同仓 PR 自动预览，fork PR 经维护者按当前提交批准后预览；预览不接真实语音。** 使用 Cloudflare 原生 Worker Previews、GitHub Actions 受信发布器；PR Checks 给直达链接，同时记录 Deployment。生产 main 的现有 CI→精确产物→CD 边界原样保留。

请确认以下整体范围，任何一项都尚未获本方案授权：

1. 新建专用预览父 Worker，建议名 `lie-pr-preview`，在其下按 `pr-123` 建原生 Preview；使用 workers.dev，无新域名/DNS。所有预览无 Linx secrets、不绑定生产服务/数据。独立父 Worker 便于防误操作，但**不是同账户部署 token 的权限隔离**。
2. 同仓 PR 自动发布；fork（含 Dependabot 的低信任场景）必须维护者在 GitHub 手动选择 PR 编号与当前 head SHA 批准。每次 push 撤销之前的预览批准，重新批准后更新。GitHub 自身 fork Actions 运行审批另算一层。
3. 首版是 UI/内容预览，不提供真实人物语音；不伪造 AI 通过。关闭/合并时清理，另每天清理关闭或最近 7 天没有成功更新的预览；闲置 open PR 可手动重建。建议 20 个作为软警戒阈值，达到后暂停新建并提示维护者；跨 PR 并发可能暂时超出，不承诺硬上限，也不驱逐其他活跃 PR。若需要严格容量/费用硬限额，需另设计全局原子配额，不以按 PR 锁冒充。
4. 提供预览专用 Cloudflare token 与 GitHub 最小写权限；首版固定 `PR CI / gate` 只报告合入前检查，不改 main 规则。若用户要求强制阻止不通过的 PR 合并，需先确认下文与直接集成 main 兼容的规则/bypass。预览发布本身先不作为合并硬门槛。

若必须首版就测试真实语音，应先改选下文增强方案，并另确认设备、凭据、访问范围和费用上限。当前贺宁/Hackathon真实模型测试由用户负责，不在本任务执行或安排。

## 实际仓库与检查范围

已读 [CI/CD说明](ci-cd.md)、[部署说明](deployment-options.md)、[项目计划](project-plan.md)、[协调交接](coordinator-handoff.md)、CI/CD YAML、`scripts/ci-release.mjs`及其测试、两应用 package/Vite/config 和 gateway 路由。当前无 Wrangler 配置；`cf@1.0.0-beta.18`，Node 24.22.1；Vue 前端包含浏览器规则/官方编号 JSON/Editor/fragment分享，Worker 是同源静态服务和语音 relay。当前配置声明三个 required Linx secrets，不能把该配置不加修改地拿去建无语音预览。

现有 CI 仅 main push/手动；执行 handoff guards、全 workspace typecheck、coverage、Web/Gateway build、production prebuilt dry-run。生产 artifact guard 明确拒绝 Preview output、非 `lie-game` 和 PR/fork 来源；保留这些拒绝条件，另建预览 helper，不能泛化生产 guard 到接受 PR。

首版独立 `.github/workflows/pr-ci.yml`（工作流名 PR CI）复用上述检查，不把 PR 来源接入生产CI/CD；固定 gate 汇总所有必须步骤；增加预览包目录/完整性验证与安全边界测试。CI 在 GitHub 托管临时 runner 上执行 PR 代码，无 Cloudflare/Linx secret、无持久 checkout 凭据、`contents: read`。不使用 self-hosted runner。coverage 仍 14 天；预览 Web artifact 1 天。文件检查不按 paths 跳过整个 required workflow，避免一直 Pending。

可人工验收：四官方案首页/介绍/开局、可变人数、立绘和终局呈现；Editor字段/预设/草稿/同引擎试玩；fragment分享、损坏链接、改编与移动布局。语音不可用时只能验证提示和已有自动 fake-provider 行为，不能完成真实问答，也不能声称声学、模型、设备隔离通过。浏览器草稿按预览 origin 隔离；稳定 PR URL内会跨更新保留，验收前用自建草稿，不覆盖用户数据。

## CI 身份与合并语义

新增 `pull_request` 目标 main：opened、synchronize、reopened、ready_for_review；draft 也做 CI，预览可延后到 ready。默认 checkout GitHub 的 `refs/pull/N/merge`，检查的是 head 与当时 base 的测试合并结果。记录 repository ID/full_name、PR号、head repo/head SHA、base SHA、merge SHA、run ID/attempt 和锁文件 hash；页面与Actions摘要说明身份。合并冲突时 GitHub不运行该事件，应显示冲突，不标成功。[GitHub事件定义](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)

base 更新不会保证给每个 PR 自动重新触发检查：建议分支规则要求与 main 保持最新，维护者更新 PR 后重验；不让旧 base 的成功冒充当前可合入。发布器也拒绝 base/head/merge 身份已变的产物。required check规则也会约束root本地cherry-pick产生新SHA后的直接push：它首次推送前通常没有PR gate记录，可能被拒。首版不改规则；若要强制PR门槛，需用户另确认具名integrator的bypass及其审查约束，或调整当前无内部PR流程，不能自行配置例外。若日后启用 merge queue，必须补 `merge_group: checks_requested`；本轮不启用队列。固定 gate 使用 always 并显式核依赖成功，失败/取消不误算通过。[required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)

CI并发组按 PR号，取消旧 CI；main CI保持现有策略。preview 的部署/删除用另一按 PR号串行组，不在云端上传中途盲目取消；创建前和写最终状态前再核 open/head/base，关闭与更新共用锁。晚到的旧 run不能覆盖当前入口；若上传后发现过期，不写success，将该次GitHub Deployment标记inactive。不得以删除整个pr-N来回收旧run：保留到下一次覆盖/已确认的整Preview清理；若后续实现支持精确deployment-ID删除，须先验证API粒度再做，不能误删新预览。

## 预览发布器与凭据边界

新增独立默认分支 workflow，由 PR CI的 workflow_run唤醒，发布仅接受成功检查，同仓自动；fork只展示待批准，维护者从默认分支 workflow_dispatch 提交 PR号和完整 head SHA启动。手动入口只能解析到当前成功且身份匹配的 CI run，不能输入任意 artifact/run绕过验证。重新打开/超期恢复也走同样路径。closed事件让PR CI仅跑无凭据结束信号job、不执行PR脚本，受信发布器再核PR已关闭后清理；事件漏发由每日兜底修复。fork/草稿等pending status也由受信发布器写，PR CI不获写权限。

发布器从受信默认分支固定 SHA取自身脚本/CLI/配置，绝不 checkout并执行 PR代码、PR package/lock/config、npm hooks、artifact内脚本或从artifact输出shell命令。`pull_request_target`完全不用。工作流 ID/path、event、仓库、conclusion、attempt、PR关联、当前head/base/merge都通过 GitHub API验证；区分Actions run的head_sha与CI检出的merge SHA，不能假定两者相同，merge提交的父提交须对应本次head/base；只取该run唯一命名artifact ID，校验GitHub digest、receipt、inventory、文件类型/数量/总大小/路径，拒绝符号链接、越界、私密文件。receipt说明字节身份，不能证明PR可信。[GitHub安全依据](https://github.blog/security/application-security/how-to-secure-your-github-actions-workflows-with-codeql/)

**首版只接受 PR CI 的 Web dist静态文件。** privileged job不直接恢复 PR生成的 Cloudflare output。用默认分支已审 gateway服务代码和固定配置封装这些静态文件，只允许ASSETS，无secret/生产service binding、routes、cron或自动资源配置；Worker模块不来自PR。构建封装阶段无Cloudflare token，token只在最后已验上传步骤获得。不得扫描/执行上传目录里的JS；HTML/JS是供浏览器加载的数据。

这意味着：PR里的Gateway变更会被完整CI测试/构建，但公网预览仍使用已审默认分支Gateway，**不证明该PR Worker部署后行为**。Actions摘要必须明确列出“UI merge SHA / gateway harness SHA”。后续若需要全栈PR Worker预览，可另开无secret、无生产binding的执行环境并增加审查；不能悄悄扩大首版。

独立预览token放GitHub preview environment，生产token保留现有CD；固定preview environment用于凭据门控，逐PR Deployment记录由API另外创建，不能误把动态environment自动拥有secret；最小Cloudflare权限以官方API/CLI实际请求核定，不预先加账户管理员、DNS或Linx管理权限。Workers写权限可能按account而非单Worker授权：同账户token仍可能修改生产Worker，固定发布器/目标白名单是工程防护，不是IAM硬隔离。若用户要求凭据层面无法触及生产，需独立Cloudflare账户或可证实的更细权限，届时另确认配置成本。

PR静态内容仍能在测试者浏览器执行不可信JS；使用独立workers.dev origin，与lie.agency的本地存储/同源API隔开；不向预览注入生产账号或密钥。fork CI审批不授予secret，fork preview审批也不代表允许生产发布。GitHub fork安全设置不打开“send write tokens/secrets”。[fork运行审批](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks)

## Cloudflare机制、产物与生命周期

推荐原生 [Worker Previews](https://developers.cloudflare.com/workers/previews/)，不是 `workers versions create --preview-alias`：后者使用该version配置的生产资源，不提供分支资源隔离。[两种机制区别](https://developers.cloudflare.com/workers/previews/compare-workflows/)

CLI官方支持 `cf previews deploy pr-N --mode preview`；发布器在只含受信封装与PR静态目录的工程运行。Preview构建有 `isPreview: true`，生产output不能直接交给它；`--prebuilt`必须同mode的Preview output。首版复用昂贵Web/图片产物，只重新构建小型受信封装；不重跑应用CI、不重新编码图片。生产CD继续消费main CI完整output，无重建。cf beta的build output格式固定随lock，不把生产receipt改成兼容预览。[cf项目接口](https://developers.cloudflare.com/cf/projects/)、[配置context](https://developers.cloudflare.com/cf/projects/cloudflare-config/)

原生Preview提供稳定地址和每次部署地址：PR入口使用稳定地址；Actions摘要/Deployment记录同时保存不可变部署地址及三种SHA。具体URL取CLI JSON返回并校验HTTPS/预期workers.dev host，不自行拼接或信任PR提交的URL。`pr-N`从验证过的整数生成，防不同fork同名branch冲突。首版不申请自定义域名、不创建数据库/存储资源。

关闭/合并：默认分支受信清理任务核PR已关闭，只删除对应父Worker下pr-N，标记Deployment inactive、状态说明已关闭。每天兜底核PR状态/最后部署时间，清理漏事件及7天闲置；只处理有本项目标记和PR映射的资源，不批删账号资源。失败在Actions显示并保留待清理清单；清理成功再改状态，不把exit0等同删除证明。原生版本链接在Preview删除/平台淘汰后不可用，不承诺永久保存。`cf previews delete`有可发现命令及dry-run；具体删除参数在实施前按schema重新核验。

缓存：PR CI可使用依赖/图片缓存，但预览发布器不读PR cache；生产CD也不读PR cache。缓存不是来源证明，生产/main产物不得从PR artifact/cache提升。PR可恢复的main图片cache不包含任何凭据；在实现验证阶段确认GitHub scope隔离/只读默认，不打开低信任写回选项。[GitHub缓存安全](https://github.blog/changelog/2026-06-26-read-only-actions-cache-for-untrusted-triggers/)

## PR点击入口、权限与失败可见性

发布器创建 `preview/pr-N` Deployment（production_environment=false、transient_environment=true），成功status写environment_url及log_url。同步给**PR当前head SHA**写 `preview` commit status，target_url直达预览；这样fork的PR Checks也有入口，不依赖跨workflow/fork deployment关联刚好展示“View deployment”。同仓PR原生Deployment入口可同时保留；无须bot评论。[environment URL](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/deploy-to-environment)、[fork关联限制](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/view-deployment-history)

预览publisher最小GitHub权限：contents:read、actions:read、pull-requests:read（查询PR）、deployments:write、statuses:write。不申请issues:write、pull-requests:write或checks:write；使用短期GITHUB_TOKEN，不增加PAT/App安装。权限仅在受信workflow/job生效，PR CI维持只读。[Deployment status API](https://docs.github.com/en/rest/deployments/statuses#create-a-deployment-status)、[Commit status API](https://docs.github.com/en/rest/commits/statuses#create-a-commit-status)

CI失败显示具体测试日志和coverage；无artifact则预览不发布。fork未批、草稿、超额、过期身份分别给pending/说明与受信工作流入口；上传/HTTP检查失败写failure并指日志，不伪装成功。更新失败时原稳定URL可能仍是旧部署，必须在status明确“旧预览/更新失败”，不可把链接称为当前SHA。成功至少探测首页、Editor SPA、静态资源、health、voice unavailable与错误JSON路径后才写success。required CI gate与preview状态名称分开。

## 资源、费用与备选

| 方案 | 可测试范围与代价 | 建议 |
| --- | --- | --- |
| 无语音UI/内容预览 | 不用Linx token/device/agent，不推理；可覆盖UI/内容/分享，Gateway用受信封装 | 首版推荐 |
| 专用语音预览 | 必须专用provider凭据/设备/agent、受控访问、并发/费用上限与清理；PR Worker持有这些secret即能读取它们 | 另确认，不默认开 |
| 共用生产语音 | 配置少，但影响生产设备会话/额度，未有多人隔离证据；向未审代码提供生产secret | 不推荐 |
| Cloudflare Pages Git集成 | 静态预览方便，但增加第二部署体系、GitHub App权限和构建配置；语音/同源路由仍需方案 | 保留备选，首版不选 |
| 每PR独立Worker | 兼容路径较直接，但占Worker数、删除/命名/资源管理更重 | 原生Previews不可用时再讨论，不自动切换 |

普通静态资源请求免费；当前Gateway对assets/static等先运行Worker，不能把整站流量承诺为零费用。Worker请求/CPU、日志及GitHub Actions分钟/artifact储存仍计额度，真实语音另计provider费用。[Cloudflare计费](https://developers.cloudflare.com/workers/platform/pricing/) 当前原生Preview上限Free每Worker100、Paid500，每Preview100 deployments，触限会自动淘汰旧项；20个软警戒/7天为本项目建议策略，不是平台保证。单静态文件上限25MiB，须检查构建输出，不能把仓库里的成片视频误带进Webdist。[平台限制](https://developers.cloudflare.com/workers/platform/limits/)

没有读取当前账户套餐、余量、账单、仓库可见性或GitHub规则，不能据文档推断现有套餐可用/零新增账单；实施获准后先做只读能力/余量检查再创建资源。预览默认公开且workers.dev有noindex；若需登录保护要另确认Cloudflare Access与访问名单，不默认更改账户策略。权限、额度不满足时停在该步骤，不扩权或换付费服务。

## 最小实施顺序与验收

1. 用户确认上述推荐范围；root审查合入本设计。实现owner独立worktree，避免并行改同一workflow/helper。现有main生产集成与publication仍由root独占。
2. 先增加无secret PR CI、固定gate、身份/安全helper测试；通过一个同仓测试PR与受控fork测试PR确认merge SHA和失败展示。不改生产CD拒绝PR/fork的测试。
3. 经确认配置preview父Worker、专用token/environment与fork审批入口；先验证不含任何生产/Linx binding。封装构建使用当前锁定cf，不能因beta接口不符擅自改为version URL。
4. 接预览发布、status/deployment链接与HTTP探测；实测同仓更新、fork等待/批准/更新失效、篡改/旧run/attempt/关闭race、无token构建、失败保留旧URL说明。
5. 接关闭与定期清理；用本任务资源验证删除后不可达，保留日志；确认main CI/CD链仍只发布main完整产物。如用户要强制合并门槛，再明确并确认兼容直接push的规则/bypass。所有测试资源/临时PR和实际外部写操作包含在后续明确实施授权中，当前未创建。

完成标准：PR明确展示完整检查结论（强制合并门槛待独立规则决策）；两个来源PR都能走完所承诺路径；链接明确构建身份；不可信构建阶段没有secret；关闭/过期可清理；生产部署目标/触发/产物安全拒绝条件没有退化。fake、dry-run、文档研究不算远程链路通过。

## 本轮证据与交付边界

本轮只读仓库和官方资料；本机只运行cf命令发现/help并读锁定实现，确认存在previews deploy/delete，未登录、读取secret、调用账号API、推理或部署。官方文档称previews deploy无dry-run，而锁定CLI help显示通用dry-run；没有执行，以“不做部署dry-run证明”为准。真实预览权限/套餐/URL/清理语义仍须实施时验证。

方案与备选保存在本文件；无应用/workflow/config修改，无新服务/监听/浏览器操作。文档通过diff/链接检查，未跑无关应用套件。中央计划由主协调review时更新为“方案待用户确认”；本专项不改共享main和其他owner文档，不push/内部PR/集成。
