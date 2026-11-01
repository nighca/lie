# PR 预览：分享存储接口补充

2026-11-01；设计输入与最新用户决定。来源：分享专项 Chat `01a194d9-e260-7cd2-a8df-89b1478a1120` 的完整合同交接及本 Chat 用户批注。补充 [续接设计](pr-ci-preview-review-2026-11-01.md)，已交 review 的两项提交保持冻结；不更改分享 source。

## 当前选择（覆盖下文先前隔离建议）

用户最终明确：每个 PR 的前端和 Worker 都使用该 PR 的代码，独立预览入口内前后端版本一致。例如 PR 新增 Worker API 并由前端调用，预览必须能完整验证该功能。**这取代此前“仅前端变化/受信 gateway harness/不执行 PR Worker”的限制。** owner此前坚持旧限制属于理解错误，不是用户要求，不再重复要求用户批准此范围。

每 PR 独立 Worker/预览入口，共用的是非生产 R2 和 Linx 资源，不共用单一后端实例。具体父 Worker/Preview 映射在实施时核对。前后端来自同一次通过 CI 的 PR 测试合并提交，记录 head/base/merge SHA 与 run attempt；运行时提供批准范围内的非生产 bindings/语音配置。部署管理 token 仍只留受信 publisher，不进入 PR 构建或 Worker runtime。

用户明确提出生产与非生产两套资源边界，owner认可此简化方向：生产桶独立；本地开发/测试与所有 PR 预览共用一个非生产桶，不加 PR/generation 前缀，接受非生产环境的数据相互覆盖和行为影响。不再默认每 PR 建桶或独立 namespace。已有 `lie-shared-games` / `lie-shared-games-dev` 可作为拟接目标名称，实际绑定接线另按协调范围执行。

PR关闭只撤相应预览入口，不删除共享桶或按PR删除案件（已无归属前缀），用户已明确回复“没问题”。非生产数据统一清理需另定策略，不能保留旧逐PR清桶计划。当前接口相同规范化内容同ID同字节，但不同版本后端/规则仍可能产生兼容影响，用户已接受此非生产取舍。

用户认为外部 PR 经维护者 review/批准后可作为可信预览输入，包括运行该 PR 的 Worker。最新明确采用GitHub手动运行工作流原生write权限，不自建admin/actor/sender/rerunner角色检查，更严格人选可由用户配置Environment required reviewers。审批绑定当前 SHA，更新后重新批准才可部署新的前后端并使用非生产后端能力；同仓自动策略不因此授予外部更新自动批准。批准后运行不代表把部署管理 token 放入 PR 构建，也不允许 PR 配置选择生产桶或生产凭据；发布器限定部署目标、非生产绑定与配置范围。

语音最终接入已由root/P0上线合同明确：基线16d6434按浏览器签名Cookie分配稳定Device/Client，prepare首次OTA/绑定，WS用共享token首握，仅HTTP401一次OTA重试。复用非生产Agent/API key/WS token，不能复用一个固定Device给所有访客；不需每PR设备池或activelease。生产与非生产Cookie签名分离，PR namespace为pr-N，沿host-only Cookie隔开身份。四项runtime配置与上线回执见[完整实施方案](pr-preview-implementation.md)。配置值尚未复制到GitHub或新Worker；两套凭据不自动构成计费/配额隔离。

本轮记录方案和协调接口；未实际读取/复制凭据、绑定桶、创建资源或进行语音测试。无需重复申请用户已明确接受的非生产共用取舍。

## 可提前手动准备的配置

GitHub固定凭据 environment 约定名 `pr-preview`，与逐PR deployment记录分开。用户可在其中保存 `CLOUDFLARE_API_TOKEN`（新专用预览部署token）及 `CLOUDFLARE_ACCOUNT_ID`（现有同账户ID），不覆盖生产 repository secrets。受信 publisher 从默认 main 运行，environment可限定main；不默认设置全局required reviewers以免同仓每次自动预览变成人工审批，fork当前SHA审批由受信手动入口实现。

Cloudflare token先按当前账户限定最小Workers脚本编辑能力；现有非生产桶复用，不需要预先授R2对象删除/桶创建、DNS编辑或账单权限。最终预览API/绑定验证所需的精确额外权限以锁定CLI schema/实际只读验证为准，不声称尚未实测的最小权限已完整通过。token值只进GitHubenvironment secret，不发聊天、不入Git。

已有非生产桶与workers.dev可用作目标，无需用户另建桶/域名/手动部署Worker。P0最终Linx四项字段现已明确，新增GitHubsecret名称与私密来源授权见[实施方案](pr-preview-implementation.md)；不先自行复制旧固定device token或管理key。该清单为用户主动准备建议，本轮未实际操作上述设置。

用户随后确认 `pr-preview` 已配置。本专项只读 GitHub API 核实 environment 存在，两个 secret 名称 `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` 齐全，没有 required reviewers，已启用自定义 deployment branch policy。未读取 secret 值，也未验证 Cloudflare token 权限、创建父 Worker 或触发部署；用户的配置完成通知不视为这些外部写操作的授权。

## 来源与版本

后端 source `b9b403b` → `27a08ae`，前端 `34c5af8` → `51900be`，联合发布 `98d71fb9ebc2f517010598c4796c8db3014a73c7`。分享 owner 消息中“main 仍 a8/待维护窗口”是较早只读截点，已被总协调上线回执更新：CI `41270879240` 与 CD `41270953340` attempt2 成功，100% serving version `cf09d65a-4ec4-45d8-b6a2-bac129a79cf7`，SHARED_GAMES 绑定 `lie-shared-games`；两个合成案件的线上保存/读取、重复ID、旧快照核验完成。此为 root 上线回执，非本专项独立云核查，也不代表 PR 触发或预览链路已验证。

## 固定合同与兼容边界

- 同源 `POST /api/shared-games/v1` 接收 JSON GameDefinition，原始与规范化 UTF-8 均最多 1MiB，校验权威 preset；规范化内容 SHA256 前16 bytes 转无 padding Base64URL，得到22字符 ID，成功返回200 `{id}`。
- `GET /api/shared-games/v1/:id` 返回规范化 JSON；错误400/403/404/413/415/503返回安全 code，no-store，无 CORS。POST 要求 Origin 等于请求 origin，拒 cross-site。不要跨域借用 prod/dev API，或靠放开 CORS 接线。
- 前端15秒超时覆盖请求与 JSON 读取，校验返回 ID，用当前 origin 生成 `/play?share=v1.<id>`；不接受客户端 bucket/prefix 参数。旧 `#game` 为只读兼容，仍受16000字符/128KiB解压预算。
- 当前 PR 前后端/core/preset 均来自同一已验提交，不再有旧 main harness 与 PR UI 人为错配。不同 PR 对共享非生产数据的 schema/preset 兼容影响仍按用户接受的非生产取舍处理。

## 历史提案：对续接提案的收敛（已被当前选择替代）

以下保留先前选项与理由，不是当前实施要求。当前仅反映前端变化，非生产共桶无前缀，不执行逐 PR 建桶或 prefix 隔离。

**受信后端 + PR 静态 UI：** 可以只新建一个专用 preview bucket，由受信 harness 的 `Pick<R2Bucket, 'get' | 'put'>` adapter 添加固定 PR 前缀。PR号来自受信部署元数据，不能由客户端或 PR 脚本选定。无需修改生产 API、ID 或游戏引擎。这比默认每 PR 一桶的资源管理更少，是此模式下可优先考虑的方案。

**实际运行 PR 后端：** 每 PR 独立私有桶仍是直接隔离方式。原生 bucket binding 的应用前缀不是权限 ACL；PR Worker 可绕过 wrapper 访问其绑定桶内其他前缀。不能给不可信 Worker 共用桶后声称已隔离。可选的受信 storage broker 或 S3 临时 scoped credentials 会增加协议/签名/过期管理，不属于现有实现。语音凭据同样不能因数据分桶就注入未经审查的 PR Worker。

当前没有临时对象、索引、TTL、撤回或用户删除接口；对象直接写 `games/v1/<id>.json`，重复 POST 仍发生写操作。超时/关闭前端等待不证明服务端没有落盘。生产完成对象长期保存的策略不适用于未经确认的 PR 数据清理。

## 历史提案：链接寿命与清理责任（已被当前选择替代）

以下为先前逐 PR 数据域方案，不能作为共享非生产桶的清理指令。当前关 PR 仅撤入口，不按 PR 删数据；共享数据统一清理策略另定。PR 关闭后其 origin 不可达，不能据此认定对象已删除；其他非生产环境只要协议兼容且同桶仍可按 ID 读取。

建议同 PR 使用稳定 origin 与稳定桶/前缀，更新时保留旧快照；若按 run/generation 切数据域，即使 host 不变，旧 ID 也可能404，不能静默承诺旧链接继续可用。相同内容跨环境 ID 相同不意味着数据复制，替换域名通常404；关闭 PR 撤掉环境后测试链接失效，此寿命仍需用户接受。

受信 publisher 负责先撤写入入口、防迟到 run 重建，再分页 list 指定范围、每批最多1000对象删除并确认空；共享桶只能删本 PR 前缀。需处置已在途写入与清理失败，不能把撤入口当作已排空写入。生命周期可兜底，但通常到期24小时内删除，非即时保证，且规则数有限，不能每 run 无限加规则。7天闲置/20软警戒仍非用户已定预算。

## 依据与费用边界

分享 owner 已核官方 [R2 binding API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)、[生命周期](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)、[S3临时凭据](https://developers.cloudflare.com/r2/api/s3/temporary-credentials/)；本专项收到该核对作为接口交接，未实际验证 scoped credentials。

本专项此前已读 [R2定价](https://developers.cloudflare.com/r2/pricing/)：账户共享额度、按操作与容量收费，不能把 prefix 当节省相同流量费用的机制。当前定价含前100000个桶，但实际配额与账户余量需另核；无需因假设每桶固定费而共用生产桶。重复写、列举清理、Worker CPU/请求与 CI 部署另计，生命周期实际删除前仍有存储用量。无自动复制数据、硬总预算或IP限流的现成保证。

本补充记录已确认的完整 PR 前后端预览与非生产共桶取舍及历史备选；未实际创建资源、接线复用现有 prod/dev 桶、修改配置/权限/secret、产生 provider 流量或部署。完整 PR 前后端范围、外部 PR 当前 SHA 审批、公开链接、同账号 token 和非生产共桶无前缀不再重复询问。P0接口已明确，非生产共享数据统一清理与具体配置/部署按后续执行批次协调。已 review 的 `7a13ceb` → `2893738` 保持冻结；其文档中仅前端/受信 harness 限制以本次用户决定为准，不改写已交提交。
