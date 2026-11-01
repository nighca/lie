# PR 预览启用执行单

2026-11-01；**用户已回复“批准”，本单为获准执行范围。** 实际配置、发布、验收与清理结果见[执行记录](pr-preview-release-2026-11-01/readiness.md)；下文保留执行前的核查信息和授权边界。实施细节和信任边界见[实施方案](pr-preview-implementation.md)。

## 准备状态

- GitHub仓库为public，当前账号具admin权限，有1个fork（只读元数据核对，不代表拥有该fork写权限）。`pr-preview`已由用户配置，CF两个secret名称齐全、main-only、无Required reviewers。没有读取secret值或检验token实际能力。
- 非生产R2目标使用已有私有Standard桶 `lie-shared-games-dev`，不新建桶/域名，不改生产桶、CORS或对象TTL。
- P0动态浏览器Device方案已在16d6434上线；本专项不修改该产品代码，复用其HTTP/准备/连接合同。
- 当前本地实现仍待总协调完整review与串行main集成。已审旧CI两个patch是依赖，只纳一次，不把旧文档的main harness限制当现要求。

## 一次批准涵盖的动作

1. **配置非生产运行凭据。** 由用户直接填GitHub environment，或在用户明确授权后由P0私密配置owner提供本地开发配置作为唯一来源，写入 `pr-preview`：

   | GitHub Environment secret | Worker runtime 字段 |
   | --- | --- |
   | `PR_PREVIEW_LINX_API_KEY` | `LINX_API_KEY` |
   | `PR_PREVIEW_LINX_AGENT_ID` | `LINX_AGENT_ID` |
   | `PR_PREVIEW_LINX_WS_TOKEN` | `LINX_WS_TOKEN` |
   | `PR_PREVIEW_VOICE_DEVICE_COOKIE_SECRET` | `VOICE_DEVICE_COOKIE_SECRET` |

   不从生产读取或复制值，不在聊天/日志/Git中展示。Cookie签名采用至少32UTF-8 bytes的非生产随机材料，可以为预览新生成并保存在受保护来源，不能用API key/WS token充当。API key会作为获准PR Worker的运行凭据，用于设备绑定/归属核对；不声称其供应商权限自动仅限某个Agent。复用P0 owner确认的 `LIE-development` Agent和本地非生产共享WS token，无需另建Agent/固定Device。具体现有私密来源由owner确认，不猜路径或自行扫描。

2. **初始化唯一预览父 Worker。** 总协调review后经正常main集成与Actions，手动运行 `PR Preview` 的 `operation=initialize`。仅使用已有CF专用token，在同一账户创建固定名 `lie-pr-preview` 的无业务绑定404 Worker，`workersDev=false`、预览URL开启；不会部署或修改 `lie-game`。已存在时只核查，不覆盖。没有确认404就不创建。父Preview Base必须为空，禁止继承生产或未知配置。

3. **启用全栈PR发布。** PR CI无secret构建完整前后端；受信publisher限定父Worker、测试桶、四secret和 `pr-N` namespace。只在token权限足够时推进；失败不加管理员/DNS/R2删除权限、不新建账号或换部署体系。Cloudflare变更用锁定cf CLI；beta.18缺Preview GET/list命令，辅助脚本仅用相同官方API做精确只读回验（存在性、当前/新deployment绑定、删除后404），不直接REST写资源。

4. **真实GitHub/Cloudflare链路验收。** 创建一个本仓临时贡献PR，用最小测试接口与前端消费验证同提交全栈；更新一次、核新SHA入口、关闭并确认Preview删除。若已有fork由本账号可写且owner允许，使用受控临时branch/PR核等待→当前SHA批准→更新失效→重新批准；不能因为读到1个fork就擅自向他人fork push。没有获准可写来源时保留fork真实路径“未验”，不造新账号、不伪装同仓为fork。临时测试PR不合main，只按批准关闭并清理本任务自有临时分支，保留必要脱敏运行证据。

5. **分享与语音有界验收。** 在同一个测试Preview创建最多2个小型合成案件，最多6次POST/GET请求核保存、读取、重复ID和旧快照；保留为非生产测试数据，不删除共享桶其他对象。语音最多2个专用Cookie身份/Device、4条逻辑WS（包含401恢复最多8次上游握手）、最多30次管理/OTA HTTP（含归属核对与精确清理）、合计最多60 socket-seconds，0 listen/文本推理/音频/mic。首条失败就停止新尝试，保全清理，不自动重跑。按P0资源owner清单回收本次确切两个测试绑定；不解绑其他浏览器身份，不改Agent模型/音色/记忆。

静默WS仍可能消耗供应商资源包，CI/artifact/Worker请求与CPU也计账户共享用量，不承诺零费用。自动HTTP smoke最多四次GET，不执行页面JS、prepare或WS；对本次受控代码无provider副作用，不能把此性质推广为任意PR修改的GET。日后访问PR背景页会自动prepare，可能新增长期Device，需沿P0人工资源核对责任管理，关PR不自动解绑。

## 失败、回滚与服务边界

配置、元数据或权限不匹配即停止；不通过跳检查/force push/修改生产CPU来排障。上传前检查父Base与已有Preview latest env，上传后检查新精确deployment，不能让旧额外secret先被PR代码继承再报警。

更新失败时公开status明确稳定URL可能仍是旧版本。上传中PR更新则只标本次GitHub deployment inactive，不删整个Preview以免误删新版本；关闭只删该 `pr-N`，回验404后再标inactive，不清共享R2或用户Device。CLI的exit0/Aborted不算删除证据。没有自动全局预算、闲置驱逐或设备回收。

本专项不启动开发服务、不碰用户tab/storage/mic，不改8787/8788运行配置。main集成仍由总协调持唯一turn并确认其自动跟随服务可安全更新，不沿用P0旧窗口；不为此安排一套额外复杂维护编排。若需修正已上线预览，用同一审核/发布路径，必要时撤测试Preview，不回滚生产Worker。

## 完成判定

分别报告本地checks、main集成/发布SHA、Actions run/attempt/artifact digest、真实stable/immutable URL、两个来源审批覆盖、同版API前端消费、R2/API/WS实际计数及资源状态。未执行或因权限/可写fork来源缺失的项明确列出，不以本地fake/dry-run替代。所有必要脱敏证据保存仓库文档；私密凭据与完整Cookie/设备标识不入Git。
