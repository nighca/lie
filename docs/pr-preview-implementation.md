# 全栈 PR 预览实施方案

2026-11-01；本地实施中，尚未启用远程预览。基线为已审并上线的 `16d64347b853ffaaac1f2dbaa9d8ddd232f9859a`。本文件与[最新用户决定](pr-ci-preview-storage-contract.md)覆盖 [10月25日提案](pr-ci-preview-proposal.md)及[续接记录](pr-ci-preview-review-2026-11-01.md)中的 UI-only/main gateway harness 限制；保留旧文档以记录备选。

## 2026-11-03 自定义预览域名约定

所有新发布的 PR 预览入口使用 `preview.lie.agency`：稳定地址为 `pr-N.preview.lie.agency`；不可变地址只接受部署 API 实际返回的完整 deployment ID 或 UUID 首8位，例如 `063049c3.preview.lie.agency`，不自行增加 PR 后缀或生成缺失地址。上述日期较新的约定覆盖本文早期启用状态和链接约定，云资源验收由专项资源记录单独保存。

发布器严格核对 CLI 返回的 PR/name/slug、deployment ID、HTTPS origin 及固定自家域名；如同时返回旧 `workers.dev` 地址，也要核对同一父 Worker 和账户。新部署的全部不可变地址还必须逐一出现在固定 Preview 的精确 deployment metadata 中。只有平台返回且校验通过的自家域名可用于 HTTP probe、成功 Step Summary、GitHub Deployment 和 commit status；缺少稳定或不可变自家域名时失败，不回退发布 `workers.dev`。只读 inspect 仍可展示身份匹配的平台原始两类地址，自家域名排在前面。身份审批、产物信任、关闭清理和资源权限保持既有合同。

## 用户已确认的行为

- 每个指向 main 的贡献 PR 接受完整无凭据 CI。每 PR 有独立 Worker 预览入口，前端与 Worker 均来自同一次 PR 测试合并提交，新增接口及其消费方可端到端验证。
- 同仓自动预览；fork/Dependabot 等低信任来源由维护者审查并通过GitHub手动入口批准当前 head SHA，更新后重新批准。用户已明确依赖GitHub原生write权限，不增加自定义admin角色检查；更严格人选可由用户配置Environment required reviewers。默认链接公开。内部 AI 仍按隔离 worktree/review/main 集成，不引入内部 PR 或修改分支规则。
- 使用同 Cloudflare 账户的独立预览部署 token；拟设 `lie-pr-preview` 父 Worker，其下使用原生 `pr-N` Preview。不是所有 PR 共用一份后端代码或一个运行入口。
- 生产桶独立，所有非生产（本地开发/测试及 PR）共用 `lie-shared-games-dev`，不加 PR 前缀，接受不同测试代码对数据的相互影响。关闭 PR 只撤预览入口，不删共享桶、共享案件或 Linx 设备。
- 语音沿 P0 的浏览器身份方案接入，共用非生产 Agent/凭据，不复活固定 Device。生产与非生产凭据分开；无需每 PR 建 Agent/Device 池。7天闲置或20个容量警戒不是已定要求，本批不擅加闲置删除。

## P0 已上线合同与预览配置

总协调回执：local/remote/production 均为基线16d6434，CI `41286697053`、CD `41286782831` 成功，serving version 前缀 `8aea85df`；两 Cookie 身份的真实 API 路径已验并清理。此为 P0/root 上线回执，不冒充本专项独立 provider 测试。

`GET /api/voice/status` 只检查配置及签发/续期 Cookie，无 provider 调用；`POST /api/voice/prepare` 同源空 body，首次 OTA/绑定，成功204；浏览器案件加载后提前调用 prepare，准备过程不开 mic/WS。WS 使用当前 Cookie 的稳定 Device/Client，正常直接用共享 token 连接，只有首握 HTTP401 才 OTA 一次并重握一次，总9秒。同身份自然顶旧，不同浏览器身份独立；180天 Cookie，不自动解绑。准备与 Cookie 不是全局连接租约。

| 预览配置 | 来源/作用 |
| --- | --- |
| `LINX_API_KEY` runtime secret | 非生产获准管理凭据，用于 Device 绑定与归属核对；不能把它误当设备连接 token。实际权限范围须如实记录，不声称自动只限单 Agent。 |
| `LINX_AGENT_ID` runtime secret | 获准开发 Agent；用户正在统一显示名 `LIE-development`，ID不因改名改变。 |
| `LINX_WS_TOKEN` runtime secret | 非生产共享首握凭据。原本地 token 跨新 Device 有正向样本，TTL未知，不能留空依赖401刷新。 |
| `VOICE_DEVICE_COOKIE_SECRET` runtime secret | 至少32 UTF-8 bytes 的非生产签名材料，独立于生产、API key和WS token；在预览更新间保持稳定。 |
| `VOICE_DEVICE_ENVIRONMENT` text | 受信发布器强制 `pr-N`，最终HTTPS身份标签为 `pr-N:https`；生产仍 `production`，本地仍按其已配置值。 |
| `SHARED_GAMES` binding | 受信发布器强制 `lie-shared-games-dev`，不从 PR 配置采纳桶名。 |
| `ASSETS` binding | 同一次 PR build 的静态 Web output。 |

Cookie为host-only，因此同一个浏览器打开不同 PR origin 自然有不同身份；非生产可共用签名材料，不能复用生产签名身份。原生 Preview 不自动替我们清理供应商 Device，关闭预览不代表解绑完成。P0的人工资源核对责任继续保留，需要在正式启用预览时纳入非生产新增身份；不按 PR 猜测设备归属或自动解绑。

GitHub `pr-preview` environment 已只读核验存在，包含 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 两个 secret 名称，部署分支仅main，无required reviewers。未读取值或验证权限，尚无本专项四项 runtime secret 的配置回执；不从 production/local 私密文件自行复制。

四项新增 GitHub environment secret 使用 `PR_PREVIEW_LINX_API_KEY`、`PR_PREVIEW_LINX_AGENT_ID`、`PR_PREVIEW_LINX_WS_TOKEN`、`PR_PREVIEW_VOICE_DEVICE_COOKIE_SECRET`，最后上传步骤才映射到表内runtime字段，避免同名生产runtime secret 的意外回退。已有两个Cloudflare secret名称保持不变。

## 构建与发布器边界

PR CI 在托管临时 runner 执行 PR 的 npm/构建/测试，只读 GitHub 权限、不获得任何 Cloudflare/Linx 凭据。先保留既有完整检查及无上传 production dry-run，再只重建小型 gateway Preview output（复用该次 Web dist）。锁定 cf beta.18/Vite 插件通过 `CLOUDFLARE_PREVIEW_BUILD=true` 标记预览构建；这必须用本地实际产物核验，不能把部署命令的通用dry-run当验证。

产物包含同一次 PR 的完整静态资源与 Worker bundle；receipt记录repository/PR/head/base/merge/run/attempt及每文件size/hash。只打包Cloudflare output，不打包源码仓库、node_modules、缓存、私密配置或设计视频。receipt/inventory提供字节身份，不赋予信任。

发布器自身只从默认分支固定 workflow SHA 获取代码与锁定工具。它可上传 PR Worker 模块为运行数据，但本地不 import/eval 模块，不执行 PR config、lockfile安装、package hooks或产物脚本；也不把生产 receipt/helper 改成接受 PR。构建output中的命名、绑定、账户与部署设置不能直接沿用：发布器重建允许的预览配置，固定父Worker、预览mode、测试R2、P0 secrets/text、CPU30000、已审兼容标志和观测设置，拒绝额外资源或触发器。

四项runtime secret只在已验证的最后部署步骤进入权限受限临时输出，上传后立即清理；Cloudflare管理token仅传部署CLI，GitHub token不进入该CLI或runtime。子进程不继承PR npm/NODE_OPTIONS环境，不在PR工作目录运行。维护者批准当前SHA意味着允许该Worker读取已提供的非生产runtime凭据和共享数据；不能声称这些值对获准运行的代码保密。部署管理token始终不能供PR运行时获取。

## 身份、并发与可见结果

API独立核对固定PR CI workflow、成功结论、来源、run/attempt、当前PR open/draft/head/base/merge和merge提交父节点。手动入口只收PR号和完整当前head SHA，不收任意artifact/run作为授权；workflow_run不继承曾经的fork批准。artifact ID/name/digest和receipt必须全部匹配，不恢复缓存或较早产物。

用户随后明确撤销自定义admin限制：手动批准和初始化直接依赖GitHub对workflow_dispatch的write权限限制，不调用collaborator permission API，不叠加actor/sender/rerunner角色证明；不会从输入接受权限或跳过当前SHA检查。更严格人选由用户配置Environment required reviewers，工作流遵守该环境原生保护规则。若用户为共享pr-preview配置reviewers，则同仓预览及初始化等引用该环境的job也遵守审批，不在代码中绕过。

选择任务只读，确定PR号后按PR串行发布/关闭清理（cancel=false）；真正进入锁后重选并核同PR，防选择与上传之间更新。上传前重查，最终success前再查。晚到产物不覆盖当前入口；上传期间变旧时标本次deployment inactive，不删除整个pr-N以免误删新环境。更新失败明确提示稳定地址可能还是旧版本。

Checks固定CI gate与预览status分开；预览使用commit status链接及GitHub Deployment，不写PR评论。成功状态写到当前PR head，同时记录实际merge/build SHA与发布器SHA。关闭PR由无凭据closed信号唤醒受信发布器，重查确已closed后只删对应Preview，再把相关Deployment标inactive。不修改共享R2或provider资源。

## 验收和具体外部操作边界

本地完成meaningful自动测试：来源/审批失效、run/attempt/artifact身份、字节篡改/路径/符号链接/体积、生产binding注入、CLI执行环境和临时secret清理、旧run/关闭竞态及失败状态。用假CLI/provider验证边界，不能据此宣称真实预览已通。

远程执行前一次提交可审查执行单：创建专用父Worker、验证现有预览token权限、把明确来源的四项非生产secret配置至pr-preview、测试一个同仓PR和一个受控fork PR、验证同提交新增API/前端消费、更新/审批失效/关闭删除、共享案件读写和P0 Cookie路径；明确真实provider/WS次数与测试资源回收。部署使用正常Actions，不手工替代生产CD；生产CI/CD、main规则和已有服务不修改。用户当前“继续工作”授权本地推进，不自动授权上述云写、凭据复制、测试PR或provider调用。

全部新实现由专项review后完整交总协调，main/push仍由总协调唯一turn执行。旧PR CI两个已审patch作为依赖只纳入一次；本分支已从16d6434 cherry其patch，原7a13ceb→2893738保持不变。当前尚无本专项云资源、服务或监听。

## 本地交付验证

- 使用项目已安装 Node24.22.1，`npm ci --offline --ignore-scripts`成功；无需下载升级工具。
- 真实Web构建与无凭据Preview gateway构建通过，复用按锁定工具/源码hash校验的图片缓存（82 hits、0次编码）。构建内部临时loopback编译进程已退出，不是保留开发服务。
- 真实256文件、113276186 bytes的output完成pack→restore→锁定CLI BuildOutput读取及配置schema转换。此为合成本地run身份，非GitHub产物身份或真实云部署。
- 父owner独立执行全部预览helper及原生产handoff测试，**161/161通过**：身份审批/字节链路、固定资源/旧secret继承前检、初始化/删除回验、真实child fakeCLI不执行PR模块、URL/HTTP有界probe、通知跨run晚到竞态等。独立review owner复核关键边界与修复，不以作者selfreport代替review。
- 两workflow YAML解析及全部run的bash语法检查通过，diff check通过；actionlint未安装，未为此联网安装。生产workflow/helper与P0产品文件未改，不重复跑未受影响的应用全套。
- 尚未验证原生Preview云端metadata实际形状、token权限、真实fork事件/跨run下载、公开URL或语音/R2接线；这些按[执行单](pr-preview-execution-plan.md)在用户批准后实测。CLI部署/删除仍使用cf，预览元数据GET因beta.18缺原生命令而采用其同一官方endpoint的精确只读回验。

历史review修复0745ad9：曾追加自定义admin核验，并修复创建GitHub Deployment得到ID后立即保存到受信context、再写后续status。该批206tests通过是历史截点；admin部分随后被用户明确要求移除，保留Deployment失败恢复修复。已用真实临时context文件和一次模拟commit-status失败验证fail能把同一deployment从in_progress收尾为failure，不遗留无法追踪的已批准状态。此次仅移除不需要的角色限制，既有实际构建与schema证据仍适用，不重复构建未变应用。

当前原生手动权限依据：[GitHub手动运行工作流](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)、[Environment required reviewers](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments#required-reviewers)。不新增PAT或权限查询要求，未修改用户现有Environment设置。

真实首个PR发布失败后，使用同一可信工作流的 `operation=inspect` 与 `pr_number` 精确只读核查固定父Worker/该Preview/latest deployment：只输出存在性、已知字段/绑定类型与数量、目标匹配布尔值及验证过的公开URL，不输出env文本或凭据，不部署/删除/修配置。部署错误保留静态阶段及安全HTTP/进程退出码，避免泛化错误掩盖上传前后边界。Deployment日志和失败status链接指向当前publisher，producer CI run仍单独用于产物身份；成功后的Step Summary仅列已验证URL及公开head/merge和两类run标识。父Worker及其Preview Base保持无业务绑定，实际R2/语音配置直配每个PR部署。

用户要求移除admin限制的本轮delta：父owner实际审阅角色层移除、main/当前SHA及P2立即保存ID保留，独立Node24.22.1运行受影响GitHub授权/编排测试 **109/109通过**；两YAML与27段bash语法、diff check通过。未变产物/部署模块不重复扩测或重build；已有实际构建与字节/schema证据继续保留，远程启用仍未执行。
