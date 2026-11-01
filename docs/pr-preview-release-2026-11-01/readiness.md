# PR 全栈预览执行与验收

2026-11-01；用户对[执行单](../pr-preview-execution-plan.md)明确回复“批准”。执行 owner `preview_execution`；源码修复、集成与发布由父 owner/root 负责。本目录仅存脱敏证据、已审薄方法与其 fake tests；完整公开标识见 [operations.json](operations.json)。

**当前结果：四项runtime凭据已配置，专用父Worker已初始化；PR#2的v1/v2均通过真实CI、自动publisher与浏览器前后端同版验收。共享R2与真实语音验收通过，两个测试设备绑定已解除。PR已关闭且未合并，Preview元数据及stable health均GET404，自有远程branch删除后GET404；完整清理完成。**

## 配置与部署

唯一owner批准的本地开发私密来源只读取三个Linx字段，未扫描其他私密配置、未读生产或GitHub secret值。独立生成非生产Cookie签名；四个 `PR_PREVIEW_*` secret经stdin设置成功，environment共六个名称回验齐全，私密恢复ledger无未知写入。Cookie与恢复材料保留于ignored目录0700/0600，不纳Git或日志。

[配置方法](configure-runtime-secrets.mjs)拒绝重复assignment、空值及control/whitespace，写前记录unknown字段，失败即停；8项fake测试通过。[临时PR方法](acceptance-change.mjs)只增加无敏感数据的Worker测试API与独立HTML消费页，2项测试通过。实际核对Vite publicDir为 `apps/web/public`，小隔离构建证实HTML会进入dist。

初始化run41292864690成功创建inert `lie-pr-preview`，Base无业务绑定。每个PR使用自己的完整前端和Worker；dev桶共享无PR前缀、Linx资源复用、Cookie namespace按PR区分，关闭仅移除Preview。

## 实际前后端与资源验收

自有临时[PR#2](https://github.com/nighca/lie/pull/2)未合main。通过GitHub API只更新 `codex/pr-preview-acceptance-20261101-0923`；每次写前检查PR/head/branch并记录unknown状态，写后核身份，非force。

| 验收 | PR head | 测试merge | CI / publisher |
| --- | --- | --- | --- |
| v1 | `44fe5aa4cd23063c893a71d9a677af95ea468d9b` | `361e2e8fe5f44dfa1f5241fe2bf15cdafabebaa1` | 41295994810 / 41296127731 success |
| v2 | `e262418bd7254af0085a5b9d91fd8c3b47e69067` | `34e0813c50c19a0daf361516bb5cc33670c2b751` | 41296560774 / 41296703371 success |

两次publisher均基于可信main `51264aebaf590badf0d0e3039ebbb6679994fe29`，验证exact artifact/receipt/current head后发布。stable为 `https://pr-2-lie-pr-preview.nighca.workers.dev`；v1/v2 immutable分别为 `https://7b2a8acf-lie-pr-preview.nighca.workers.dev`、`https://779b6509-lie-pr-preview.nighca.workers.dev`。

IAB能力不可用后，使用自建Chrome专用tab，仅访问独立 `/pr-preview-check.html`（平台规范化为无后缀路径）。v1页面显示 `preview-acceptance-v1：前端和 Worker 一致`；两处marker更新后刷新显示v2对应文字。该文字只有同源新增API返回与前端期望相同revision才出现，证明PR新增接口与消费方一起更新。未进入案件或执行语音prepare；两个自建tab已关闭，未改viewport或用户tab。

- R2：2个小合成案件、6/6请求通过；重复POST ID稳定，修改后生成新快照，旧快照仍可读。测试数据按批准保留在共享非生产桶，不清桶。
- 语音：复用P0已审驱动的[薄适配](prepare-voice-adapter.mjs)与[入口](verify-voice-preview.mjs)，在root授予共享provider turn后单次执行。2个专用Cookie/Device、3逻辑WS、6上游握手、19管理/OTA HTTP、16031 socket-ms；normalClose=true、uncertainPreparations=0、allOwnedBindingsRemoved=true。0listen、文本推理、音频与mic。设备原文仅在私密ledger，公开证据只计数。
- 有界方法纯测试：配置8、语音适配3、PR改动2、R2方法2，合计15项通过，父owner独立复核；这些fake测试与上述真实验收分别记录。

语音薄适配最初审查源为 `cbc88f474db2a103af2c50a0c016571a9ae0c58e`。归档前逐一比较四个源文件，确认其与已发布main `51264aebaf590badf0d0e3039ebbb6679994fe29` 对应文件字节一致；归档方法改用后者作为可从默认历史取得的源锚，3项适配测试再次通过，未再次调用provider。

## 已解决的发布问题

以下均是当时状态，已由正常审查、集成和发布解决；未用宽CF登录或扩权限绕过。

1. CLI OAuth最初缺workflow scope；用户补授权后正常push。平台随后拒job.env的runner.temp，invalid run41292291035无job；父最小语法修复正常发布。
2. 首版v1 CI41292994119成功，publisher41293123810上传后本地元数据校验失败，旧helper只有generic错误。执行owner停止新部署；只读run41294606441进一步在inspect-deployment失败，确认parent/pr2存在但当时latest形状未知。
3. 安全inspect41295284533成功：实际latest无preview_id，8项绑定类型与dev/PR/600秒/secret匹配全部通过，不可变URL使用部署UUID前8位。修正后以固定已验证Preview端点和精确部署ID确认归属，缺省preview_id可接受，显式错值仍拒；仅标准UUID允许前8位URL，绑定检查保持。root发布51264a，相关94项测试通过。旧artifact不复用，通过owned branch合入确切main生成新head及合规新artifact，后续v1/v2全通过。
4. v2准备期间GitHub只读GET两次EOF，均在write前；等待恢复并复核open/head后继续，无未知branch写入。

## 清理与限制

关闭PR触发CI41296845867 success及正常cleanup publisher41296859092 success（job124819485297）。10:18:42Z helper回执deleted=true/pr-2；其实现先删除再对确切Preview元数据GET404才返回，未跳过确认。另一次stable `/api/health` GET返回404。随后删除唯一自有远程测试branch并回验GitHub GET404，main前后不变，私密unknownOperation=null。永久保留inert父Worker、非生产配置及按批准保留的R2合成数据。设备only-owned cleanup已完成；未启动本地服务、未更改用户launchd服务或生产配置。

现有唯一fork `kingqn0321/lie` 对当前账号push/admin均false；未向其写、未造新fork或账号，真实fork人工批准路径**未实测**。同仓自动创建、更新、关闭路径已实测；本轮不另重复手动部署来冒充fork验证。私密ledger、原始日志和大artifact不纳本目录；公开run链接可供复核。
