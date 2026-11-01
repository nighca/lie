# Cookie Device 配置与发布执行单（待一次批准）

2026-11-01。本文件是可审查的具体操作方案，**尚未生成/读取/写入新secret、上传版本、改变部署、重启服务或执行真实provider**。已做的只有本地CLI/schema/源码、官方文档及指定线上部署/CI artifact的只读元数据核对。产品契约不再提问：稳定Cookie Device、intro预热、共享token首握及仅401同Device一次OTA恢复已定。

实施/配置/API验收/临时资源清理 owner：`/root/cookie_device_implementation`（本agent），归属本专项Chat `01a19557-145d-72f3-ace4-382ac03c22c9`；本专项及指定本agent负责保管私密owned/protected ledger、执行已获授权的人工只读核对与逐项清理候选。总协调Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8`负责排期、明确继任及账本交接、结果复核、用户授权协调和唯一integration/publication/回滚协调，具体操作由本agent在其turn执行。owner不可用时必须先由总协调明确继任并交接账本，不能失主后继续盲发身份。任何中断均由实施owner交回状态/owned资源，不留运行尾巴给总协调。

## 已核实的固定身份

- 源候选与clean全build：`c9d23741de7be8f46bd536011b21904b5d957d70`，gateway72 tests/typecheck通过；后续合入main的源码差异由总协调review，不重用未经核对的artifact。
- 生产Worker固定`lie-game`；本次readonly实见deployment `618a36fe-19fd-49b5-ba8d-07a8fcd03f90`，100% version `cf09d65a-4ec4-45d8-b6a2-bac129a79cf7`，tag `git-98d71fb9ebc2f517010598c4796c8db3014a73c7`。执行前必须重核相同，否则停并由总协调重建计划基线。
- 当前绑定元数据只有ASSETS、SHARED_GAMES、VOICE_MAX_SESSION_SECONDS及secret names `LINX_AGENT_ID/LINX_DEVICE_ID/LINX_WS_TOKEN`；未读值。当前version有已启用的URL `https://cf09d65a-lie-game.nighca.workers.dev`；没有访问此URL或调用provider。
- 旧代码/资产原CI：run `41270879240` attempt1，artifact `13068829177`，名 `production-build-98d71fb9ebc2f517010598c4796c8db3014a73c7-41270879240-1`。本次metadata核存在且`expired:false`，113388669bytes。根owner提供已核ZIP SHA256 `f35109580ebadfd16bf555b0ac04ed3e82163fdafab73b63ac07603e66d07ee5` / receipt256files；该原回执commit `9c39dd6ae0356e39bd39bd268f1ebe678a432e2f`不重放。
- 旧线上Web `index-gCk9AbIP.js`，247601bytes，SHA256 `d8c6fe7e217efecc56aabfd8e1d489a06dc7070476dfa805cef3eed4e4a8f39e`。本次未下载113MB或重新声称完整digest验证；实际bridge执行仍须下载ZIP、核上述digest及每个receipt字节。artifact若过期，停；不能同SHA重build冒充该artifact。
- pinned cf `1.0.0-beta.18` / Node24.22.1，无Wrangler。已核本地help/schema：versions create支持`--prebuilt --mode --worker --secrets-file --dry-run`，上传不部署；deployments create支持`--versions @file`。versions list/get使用`--worker-id`，deployment list/create使用`--worker`，不可混写。

## 主线：先激活旧代码配置桥，再让现有CD继承

不采用“只把新secret上传到inactive版本，然后假定CD会继承”。安装的cf deploy与versions upload实际都设置`keepSecrets:true`，上传form保留`secret_text/secret_key`；secrets-file仅覆盖提供键。桥版本`V_BRIDGE`使用**旧CI代码+旧静态资产**，只新增管理key和签名secret，继承现有生产Agent/WS/Device不改。先明确激活这个旧行为配置桥，再上传新代码candidate作版本URL验收；最终现有CI/CD从已配置的serving状态继承secret。部署后仍重核required names/实际接入，不拿name存在当值可用。[cf上传/部署语义](https://developers.cloudflare.com/cf/projects/)

平台在secret改变后可能拒绝直接回滚到原旧version，cf help/API明确存在绕过开关。本方案**不使用`--bypass-deployment-checks`或force**：恢复目标是持有完整同组secrets、旧代码/资产的`V_BRIDGE`。后续candidate/CD不轮换任何secret，保留所有旧固定Device/WS/Agent。若仍被平台拒绝，停止自动回滚并上报，不绕检查。回滚只换代码/绑定/资产版本，不回滚R2数据或provider资源。[Deployment API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/methods/create/)、[rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## 一次审批中的凭据来源与写入目标

状态根建议固定为`/Users/nighca/Library/Application Support/LIE/voice-device-release/2026-11-01`，目录0700、文件0600、wx拒覆盖。当前未创建；批准后才生成/持久化。它在repo外，不进入Git/CI artifact/报告。

| 字段 | 精确来源 | 使用/目标 |
| --- | --- | --- |
| LINX_API_KEY | 只允许`/Users/nighca/code/nighca/lie/.linx-api-key`，应用必要读取；当前只提案不读取。 | 本地主main `.dev.vars`新增此字段；Cloudflare `lie-game`桥版本新增secret；Node owned-MAC预检/解绑。将此管理凭据传至该Worker以执行Device绑定/归属核对，须在本次批准中明确包括。 |
| local LINX_WS_TOKEN / LINX_AGENT_ID | 只允许逐键读取`/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars`这两个现有字段；不输出/hash/比较其与生产值。 | 本地保留不变，不上传生产、不改生产Agent。 |
| production LINX_WS_TOKEN / LINX_AGENT_ID / LINX_DEVICE_ID | **不读取值**，桥及后续版本继承现存Cloudflare secrets。 | 保持生产资源目标与旧代码回滚兼容；本地Agent与生产Agent同一性未知，不能互代。 |
| local signing secret | 批准后`crypto.randomBytes(32).toString('base64url')`独立生成，UTF-8长度≥32。 | 仅本地`.dev.vars`的VOICE_DEVICE_COOKIE_SECRET。 |
| production signing secret | 另一次独立randomBytes(32)，不得复用local值。 | 状态根`production-cookie-secret`持久化0600；临时`production-additions.json`仅含API_KEY+COOKIE_SECRET交`--secrets-file`，成功或中断后删除临时bundle，保留签名secret恢复源。 |
| namespace | local `local-main`，production `production`。 | local用该launchd job的`EnvironmentVariables.LIE_VOICE_ENVIRONMENT`；production保持已审源码/构建text默认production，不靠`.dev.vars`覆盖声明text。 |
| Cloudflare/GitHub auth | 仅复用已可用的cf/gh登录与现有CD身份，由CLI内部消费。 | 不读原始auth文件或新增token/权限，不读GitHub/CD secret值。 |

local `.dev.vars`需保全原完整字节为状态根0600备份，然后只增改API_KEY/COOKIE_SECRET；保留其余字节不解析/输出。该“备份原配置＋受限写回”也需包含在一次批准中，不在实现授权里暗含。production不导出已有secrets。

## 可审查的固定命令（现在不执行写）

全程使用已安装的绝对CLI与项目Node PATH，不自动安装或升级。以下变量仅为路径/版本ID，不装secret值；禁止shell trace。

```sh
export PATH='/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin':"$PATH"
LIE_RELEASE_STATE='/Users/nighca/Library/Application Support/LIE/voice-device-release/2026-11-01'
LIE_CF='/Users/nighca/.codex/worktrees/b1b9/lie/node_modules/.bin/cf'
```

1. **只读重核与保全旧artifact。** `cf workers deployments list --worker lie-game --per-page 1`、`cf workers versions get cf09d65a-4ec4-45d8-b6a2-bac129a79cf7 --worker-id lie-game`；过滤author和值，仅记IDs/tag/binding name/type。`gh api repos/nighca/lie/actions/artifacts/13068829177/zip`下载至状态根old.zip，核固定ZIP SHA后，校验ZIP路径/类型再解包到fresh目录。用已审`scripts/ci-release.mjs`的`restore()`函数、精确旧id `{repository:'nighca/lie',sha:'98d71fb9ebc2f517010598c4796c8db3014a73c7',runId:'41270879240',attempt:'1'}`验证receipt/256files/lock并恢复至状态根`bridge/.cloudflare/output`。本次只读比过旧与当前lock完全相同；执行时仍比较，不覆盖候选现有产物。
2. **批准后生成/写入上述两份独立secret与备份。** 用Node文件IO/wx/0600，不在命令参数/env/log中放值；新管理key只来自白名单文件。新secret bundle仅两个键，旧生产三项完全不覆盖。失败中断保留恢复源及非秘密ledger，临时bundle及时删除。
3. **桥版本本地dry-run与上传（cwd为状态根bridge）。** 原artifact的Worker名/资源标识/R2桶必须仍精确既有lie-game/lie-shared-games；不修改routes/DNS/桶/CPU/sessionlimit，也不允许未指定标识触发资源创建。versions create没有provision=false选项，不伪造该flag；若出现任何资源创建计划/缺失资源则停。

```sh
"$LIE_CF" workers versions create --prebuilt --mode production --worker lie-game --secrets-file "$LIE_RELEASE_STATE/production-additions.json" --tag cookie-config-bridge-20261101 --message 'Old verified code and assets; add Cookie Device secrets' --dry-run
# review成功后，同一次已批准turn去掉--dry-run上传；记录返回V_BRIDGE，不猜ID。
```

上传后再次核active仍为原deployment/version；读取V_BRIDGE metadata确认旧code/asset身份和旧三secret＋新增两secret names。不得打印secret_file或CLI debug请求。dry-run只验证本地，不证明线上可用。

4. **明确的生产写：激活旧行为配置桥。** Node生成`bridge-100.json`为`[{"version_id":"<实际V_BRIDGE>","percentage":100}]`，随后：

```sh
"$LIE_CF" workers deployments create --worker lie-game --strategy percentage --versions "@$LIE_RELEASE_STATE/bridge-100.json" --dry-run
# 同turn实际激活：相同命令去掉--dry-run，不加bypass/force。
```

核active精确V_BRIDGE、旧Web固定hash、health/原status。该步骤是部署变更，必须在一次批准里明说；不能称为纯secret配置。原旧tab此时仍兼容；未新增真人语音。保全V_BRIDGE metadata/部署ID为恢复目标。

5. **新代码inactive candidate。** 使用c9d237已审clean build（或总协调review过的最终候选同源码构建），cwd候选`apps/gateway`：

```sh
"$LIE_CF" workers versions create --prebuilt --mode production --worker lie-game --tag cookie-device-candidate-20261101 --message 'Reviewed Cookie Device candidate; no traffic activation' --dry-run
# 批准turn去掉--dry-run上传，不带secrets-file；继承桥已激活的同组secrets。
```

核生产active仍V_BRIDGE；从返回值/`versions get <V_CANDIDATE> --worker-id lie-game`取**实际返回的版本URL**，不猜/遍历。现有version URL能力已证；若candidate不返回URL，停，不自行启用URL/Access/域名或改成生产激活试错。这里不使用version override header：它只能选current deployment里的version，不能测试任意inactive上传版本。[version URL](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)、[override限制](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/)

## 真实执行器、资源与费用上限

**执行器固定Node24＋两个独立的内存Cookie jars A/B**，用当前repo `ws`连接其同源gateway，不用用户Chrome store、不启硬件mic/AudioContext，不加产品debugroute。真实结果称“Cookie API/transport验收”；此前Chrome/native audio结果只是已有fake验收，不冒充这次真实全产品麦克风通过。

在candidate实际版本URL做：每jar GETstatus保留自己的HttpOnly Set-Cookie→解析自己新Cookie的MAC/Client仅写0600 ledger→该唯一MAC/Client一次OTA预检→未绑定activation才POSTprepare；如果预检已给bound token则立即停止且**不解绑该MAC**。初次登记可能已产生未绑定候选，如实入ledger；不声称能检测任意随机MAC碰撞。不请求未知生产Agent全清单。prepare204是candidate runtime用继承的生产Agent及新管理key完成绑定/确认的证据；失败不能由本地Agent替代，不因此改production Agent。

A/B各hello+MCP初始化、0listen；A第二条WS测试sameDevice顶旧、B保持活跃。只发公开测试schema，不发真人内容/角色问句或触发推理。再显式关闭全部owned WS。生产Agent值仍未读，所有既有设备一律不在owned allowset。

**一次批准的建议硬上限：** 0新Agent、最多2个新Device（A/B）；至多6次逻辑WS打开，最多12次upstream握手attempt（仅产品401恢复可多一次），WS各从拨号开始计时、每条≤15秒，全部连接累计≤90 socket-seconds；即使握手尚未完成也计入，aggregate到限立即关闭全部owned连接。provider HTTP预算24次（不含另列的最多12次WS upgrade尝试），至少4次留给精确owned-MAC解绑/核验；实际执行器持久保存计数并在发起前硬检查；网关内部providerHTTP不可直接从Node完整观测，因此按冻结source的最坏上界预扣（每prepare最多4、每逻辑WS最多1次OTA，显式OTA/解绑逐次计1），不凭未见调用退账，同时另记可见实际次数。任一上限先到即停止新请求/关闭连接，不因阶段变化重置。活跃provider阶段240秒＋清理60秒；CI等待与最终smoke另列阶段，仍共用同一HTTP24/逻辑WS6/upgrade12/socket90总账。0listen/0mic也可能计UID/静默时长费用，批准需明确接受；这是请求上限，不伪称账单金额封顶。任何配额/归属/网络不确定立即停新尝试，无手工token fallback、第三Device或无限重试。

最终CD后仍用A/B中一个**自己拥有的test Cookie**在Node jar向最终origin发送（只跨这两个获准origin、同production签名namespace）；GETstatus续期应保留同MAC，不通过清Cookie再造第3Device。它是operator API探针的显式身份复用，不是假设浏览器会跨host共享Cookie。最终origin WS smoke消耗同一6次/24HTTP预算；若环境/签名导致新身份，先停，不扩资源。CI等待期间所有WS关闭；最终smoke没有新的资源/时长账本，只能消耗上述剩余额度。建议整体维护窗口20分钟（含CI等待/最终smoke），与provider阶段240秒＋清理60秒分别计时；没有WS时CI等待不计socket时间。CI失败或超整体窗口时关闭ownedWS、回收两项测试绑定，生产留在bridge，不自动继续main/发布；若已经push导致CI/CD在途，由总协调只协调停止本次run并按需要回到bridge，不能因窗口已过而任其继续部署。owned资源责任仍由指定owner承担。

回收不需要知道Agent值：只对“先有本次server-issued Cookie、预检无bound token、仅本次runtime尝试绑定、无其他consumer、所有owned WS已闭”的allowset MAC，用白名单key调用官方`POST https://xrobo.qiniu.com/xiaozhi/device/unbind`，JSON `{deviceId: ownedMac}`，每次≤8秒；成功需HTTP200且code0。绝不DELETE Agent，不查别的MAC/账号，不解绑预检已bound或未知身份。响应未知留ledger给资源owner，不用OTA再查而意外登记新候选；解绑只证明关系解除，不宣称provider所有日志/设备记录被删除。[设备API](https://linx.qiniu.com/docs/xrobot/api/device)

## 本地8787/8788维护与最终CI/CD

5544 consumer已释放，不再等旧前端升级；不恢复其dirty草稿。8787/8788仍有用户old tabs，必须取得本次无活跃语音维护窗口，确认允许**结束旧对话并reload旧tab**。总协调负责用户通知/确认；本agent只操作自己tab，用户tab仅用户自行或明确指定后刷新。新的案件load会prepare真实provider，reload含案件URL不是零provider请求，不能顺带刷新用户所有tabs。

本地配置维护在更新owning-main前完成：备份精确job plist `~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist`；记录旧LIE_VOICE_ENVIRONMENT字段是否存在，不输出其他环境。只对该job加入`LIE_VOICE_ENVIRONMENT=local-main`，保留全部其他plist键；原main `.dev.vars`受限patch如前。为了使launchd重新读取该job env，本次批准包括一次该label的有序bootout/bootstrap（单纯kickstart不保证重读改后的plist）：

```sh
launchctl bootout "gui/$(id -u)" "$HOME/Library/LaunchAgents/dev.nighca.lie.main-preview.plist"
# 此时原owner核8787/8788及原服务树已停；再原子patch已备份plist/私密配置。
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/dev.nighca.lie.main-preview.plist"
```

只有在owner确认命令/cwd/label/consumer后执行，不按端口杀进程/不另起runner。当前runner把process.env传给gateway，所以该job变量会进入新的配置函数。备份、配置失败则按原字节恢复该job和`.dev.vars`后bootstrap旧main。核main-status/health/status（无案件load/prepare/WS）只说明运行和配置形状，本地provider Agent/WS与production同一性仍不宣称。

配置桥激活、candidate API验收、local新配置和维护窗口齐备，才由总协调串行合入main并普通push。现有CI/CD不改：精确CIartifact→CD `cf deploy --prebuilt --mode production --worker lie-game --provision=false`，不在这之前push缺secret源码，不手动替代CD发布新代码。owning-main自动跟随会重启自有children；核新main-status/health与运行状态后按窗口处理old tabs。CD后核serving version/tag、四项requiredsecret names、R2/CPU30000/600秒不变及最终origin前述smoke。

## 回滚与失败停止

- bridge前失败：不激活新代码；若已写local配置，恢复原私密文件/plist并由原job恢复，确认用户服务。provider仅回收owned allowset。
- bridge后/candidate API失败：生产留在旧行为V_BRIDGE，不推main；保留新secrets不影响旧代码。回收ownedDevice、inactive版本ID入回执；不为“整洁”删版本/secret。
- CD后回归：总协调暂停其publication队列，先确认没有待运行CD会再次覆盖回滚；本agent按已保存`bridge-100.json`执行deployment create（无bypass）回到完整旧代码/资产/同secret桥，并核旧Webhash/health。若CD尚在途，必须先由总协调取消/排空**本次**待部署run，不动其他工作流/仓库设置；该条件纳一次批准。
- Cloudflare rollback不恢复R2对象/provider Device，也不保证已建立WS立即断；ownedWS主动关闭。旧V_BRIDGE仍用原fixedDevice凭据；不删旧Device/WS/Agent，保证兼容。平台若拒绝回滚，停并报告，不force/绕过，保留恢复资料；总协调决定另一个reviewed纠正版本。
- 本地新旧Web/gateway须成组恢复，不能只刷新一侧。owning-main若已前进，恢复旧main代码走总协调reviewed corrective/revert流程，绝不reset/rebase/force-push；维护窗口期间必要暂保原job停止由总协调明示，不能自作主张停整站。
- 成功后：临时secret bundle删、production signing恢复源/旧配置备份及owned ledger0600保全；报告只留SHA/versionID/状态/耗时/资源计数。不开闲置临时服务、不遗留owned browser tabs；持久main job继续服务用户。

## 给用户的一次确认（不重复产品设计）

建议总协调把下面作为**一个完整批准项**展示：

> 批准在本次无活跃语音维护窗口按此执行单运行：读取白名单管理key、原main配置指定字段及私密原字节备份；生成并持久化两份独立签名密钥，把管理key/production签名密钥发送至既有lie-game；上传并激活“旧代码＋新secret”的桥，上传不激活新candidate，通过Node A/B Cookie jars做最多2Device/6次逻辑WS/24HTTP/0listen0mic有界真实验收并精确解绑；为本地job写local-main namespace和local私密配置，允许该label一次有序重启及本次旧tab reload；验收通过后由总协调按原CI/CD发布并做同预算最终smoke，失败按无bypass桥版本回滚，必要取消本次在途CD防覆盖。整体维护窗口建议20分钟，provider240秒＋清理60秒与CI等待/最终smoke分阶段但总请求/WS/socket账本不重置；超窗停止本次推进并按计划留bridge/回收测试绑定。接受静默WS也可能产生供应商时长费用；同意180天rolling Cookie/no自动解绑，以及发布7天首核、以后每周人工复核，由本专项Chat及指定实施owner保管账本/执行获授权核对，总协调Chat负责排期、继任交接、结果复核与授权协调；这不是定时任务或永久后台运行承诺。超过30天未连只列候选、后续删除须另获精确清理turn。现有production Agent/WS/Device不改、不读取值，不创建Agent/桶/Worker、不改套餐/权限。

用户需要补充的唯一时间条件是“现在已无活跃语音，可开始维护”或指定时段；若不允许操作用户tab，可选择用户自行reload（默认）。同一次批准还包括长期身份/人工核对政策：Cookie为180天rolling续期、没有自动解绑；发布后7天内首核、此后每周人工复核，由本专项Chat `01a19557-145d-72f3-ace4-382ac03c22c9`及指定本agent保管私密owned/protected ledger、执行已获授权人工只读核对/逐项清理候选；总协调Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8`负责排期、继任交接、结果复核和用户授权协调。7日/每周是本次待批准的人工政策，不创建定时任务，也不保证agent永久后台运行。超过30天未连接或名称前缀都不能直接触发解绑；必须核归属、无consumer及会话终止，再获逐项精确清理turn，疑项保留。owner不在则先由总协调明确继任/账本交接，不能失主后继续盲发身份。没有自动化/自动删除承诺，本次仅允许两项验收绑定的精确回收。批准前上述所有写、provider与维护步骤均不执行。
