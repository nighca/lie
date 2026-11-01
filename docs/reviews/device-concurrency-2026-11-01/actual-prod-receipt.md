# Cookie Device 正式上线实际回执

2026-11-01。**产品已由正常CI/CD上线，正式同源Cookie/API/transport验收通过，两个专用验收绑定已解绑。** 本文件仅归档，不触发本轮新main更新/CI/CD，也不阻塞用户测试。

## 决策、发布与身份

前轮[配置桥回执](release-ops-run-01.md)如实保留：桥成功、candidate uploadunknown、0provider/Device/WS，07:42:14 UTC收尾；不将其补写成新代码成功。用户随后“继续发布上线”，并明确“不需要复杂发布窗口机制、线上短暂不可用可接受”。总协调据此取消旧20min/5min/inactivecandidate门槛，直接main＋原CI/CD；本agent立即停止新candidate/window路线，只做指定local维护和发布后一次正式API验收，没有重复请求同scope批准。

以下生产事实为父owner/总协调的实际发布回执，本agent收到active GO后执行下节独立Node探针，没有手动部署新产品代码：

- local/remote发布SHA `16d64347b853ffaaac1f2dbaa9d8ddd232f9859a`；[CI41286697053](https://github.com/nighca/lie/actions/runs/41286697053)、[CD41286782831](https://github.com/nighca/lie/actions/runs/41286782831)成功。
- 正式100% deployment `e643f1c2-74fe-4768-acd2-8048d1eb6b41` / version `8aea85df-4899-4b7c-91fc-a1a2ae1d07d8`；git tag为上述完整16d SHA。不是前轮c9d237本地artifact身份。
- 正式entry `index-CCHONsW7.js`，248488bytes，SHA256 `3f3a04e9dc781b6e62a9ca4929d0e4ecda72ee9770577750288469e75ec8d273`；页面metadata精确16d、dirty:false。
- 正式health ok/storage:r2、status ready，四required secret names、production namespace、既有R2/CPU30000/voice600已由总协调核验。原生产Agent/WS/Device值未由本agent读取或替换；管理key是否能对继承Agent工作由下面真实prepare成功验证，不推断其与local Agent同一。

## 本地主job维护

父完整实读`release-local-simple.mjs`（SHA256 `67e350b9b656857d6116a12b2b70d7131b91f8170c5b06288832e151c8065d1a`）后执行。它仅抽取已审local-config/restore，去过时绝对deadline，不含prepare/生成secret/云操作；UTF8、regular/non-symlink、before/expected精确bytes及部分失败恢复护栏保留。

- 先核精确launchd label `dev.nighca.lie.main-preview`、原runner脚本、cwd `/Users/nighca/code/nighca/lie`、原PID66435；原Web74521/gateway74608为当刻维护前快照。
- 原label bootout0，8787/8788旧listeners核空后，写local API_KEY＋复用现有独立local签名恢复源，plist仅加`LIE_VOICE_ENVIRONMENT=local-main`；没有重新生成两secret或重复上传桥。
- 同job bootstrap0；新runner81316，Web82946/8787、gateway83547/8788为本轮完成时快照。保持持久服务，未起重复runner或碰其他端口、用户tab。
- 实际main-status精确16d；Worker8788 `/api/health` ok/r2，Web8787 `/api/voice/status` proxy ready；自己临时status Cookie的namespace比对`local-main:development`为true，只输出布尔值，不保留用户Cookie。
- 首次health检查误向Web8787发`/api/health`而得到SPA，已纠正为Worker8788；另有正常npmci启动阶段。不是成功前隐瞒服务错误，也未为此改proxy/回滚/重复启动。所有本地检查为零provider GET，无案件load/prepare/WS；用户旧tab由用户自行reload。

## 正式真实API/transport验收与清理

父与独立审查通过固定actor后，在总协调报告active16d时只执行一次：

```sh
'/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node' --use-system-ca \
  docs/reviews/device-concurrency-2026-11-01/release-api-simple.mjs verify https://lie.agency --approved-20261101
```

actual simple SHA256 `88b44e771bcd46216ed4d66f955c556b1889aa6b00ecce17e42a22cad4ee5409`，复用API core `release-api-v2.mjs` SHA256 `37d48f74026d73ad4ce3d77ef04153a85eb30f35d8472972835b04e982580677`。simple使用单次相对240s active＋最多60s cleanup，保留同一24HTTP/6逻辑WS/12upgrade/90socket总账；不读取旧绝对window、不要求inactivecandidate。全部private state为0700/0600；新ledger wx拒覆盖。

实际probe session69493 **exit0 / passed:true**；开始时间08:02:22.173 UTC（北京时间16:02:22.173）。没有自动重跑/第三Device/新Agent/listen/硬件mic/AudioContext/用户浏览器store：

| 断言 | 实际结果 |
| --- | --- |
| HttpOnly Cookie | A/B独立Node jars，实际校验Secure/HttpOnly/SameSite=Lax/Path=/及HMAC/namespace；MAC和Client不同的bool均true，不输出其原值。 |
| 首次准备 | 两个自己新Cookie先OTA确认未绑定，再通过正式runtime的真实OTA/注册/绑定/确认，prepare204；不需要读取生产Agent值或新增debugroute。 |
| WS/隔离 | A1、B1、A2共3个成功逻辑WS，hello非空session＋PCM16k mono、MCP初始化/tools list成功；0listen。A2拨号前A1仍OPEN，随后A1自然1000关闭，caller/limit均false，B1仍在；无早关/本地timer被误当替换。 |
| 正常关闭 | 三channel closeCode全部1000、terminated/limitClose/unexpectedClose全false。B1/A2由caller正常结束；unexpectedFrames0、fatal:false、normalClose:true。 |
| 计数 | verification预扣HTTP17，cleanup后预扣19≤24；逻辑3，upgrade预留6≤12；实际累计socket **17422ms**。HTTP/upgrade是保守上界，包含可选内部401恢复及额外gateway预扣，不能冒称实际provider19或实际握手6，也不能据此证明每次首握零OTA。 |
| 自动精确回收 | 仅confirmed204且本次preflight未绑定的两个owned MAC调用解绑，均HTTP成功/code0后标cleaned；最终allOwnedBindingsRemoved:true、uncertainPreparations0、bound:false。无Agent删除/其他MAC/账户扫描。解绑不是所有provider记录/日志擦除证明。 |
| 退出 | Node已exit0；最终ps无存活probe/local-helper，仅核验命令本身。无owned WS/临时服务/browser consumer保留；持久main job继续服务用户。 |

ledger中3条连接从拨号到close分别7736/6047/3639ms，总17422ms；A1关闭在A2拨号后且未经过caller/limit路径。privately累积phaseUsed约20670ms，远低于相对budget。完整Cookie/owned MAC/Client/签名恢复源/原配置备份仅在批准私密根，由专项owner保管，不入repo；temporary production-additions.json前轮已删，本轮未重建。

本次证明正式Cookie/API/provider transport、多身份并存与同身份自然替换及精确回收。没有进行真实语音ASR/LLM/TTS质量或真实浏览器麦克风验收；之前fake浏览器/native audio证据保持各自身份，不扩大结论。生产token TTL、每次是否发生401恢复未由本探针观测，不据passed推断。

## 必要方法状态索引（保留历史，不再扩展）

| 文件/路线 | 状态与替代 |
| --- | --- |
| `release-ops.mjs` / `release-api.mjs`及其tests | 前轮实际审查身份1f0/7027，固定过期window；仅prepare曾执行，API未执行，历史冻结。 |
| `release-window-v2.mjs` / `release-ops-v2.mjs`及tests | 用户取消复杂window/inactivecandidate路线前的离线草稿，**superseded，未云执行**；保留提出/审查过程，不作为现在需要的发布门槛。 |
| `release-api-v2.mjs`及tests | 其window-file CLI路径未执行；已审API核心复用于实际simple actor，不能整文件笼统标为无效。 |
| `release-local-simple.mjs` | 本轮实际local维护actor，替代过时绝对window的local路径，hash如上。 |
| `release-api-simple.mjs` / tests | 本轮正式verify＋自动confirmed-owned cleanup actor；父/独立fake checks合计11过，本agent独立复跑core9过。实际执行结果如上。 |
| `release-ops-run-01*.md` | 前轮配置桥与uploadunknown真实回执，保持原事实；不修饰为已完成上线。 |

实施/私密ledger责任仍属本专项Chat `01a19557-145d-72f3-ace4-382ac03c22c9`及指定本agent；总协调Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8`负责排期/继任交接/复核/授权。180天rolling/no自动解绑、7日首核/每周人工复核为已纳批准的人工政策，不是定时任务或永久后台运行保证；>30日仅候选，精确清理另核归属/无consumer/会话终止后获逐项turn。本次两项专用测试绑定已清，无不明待解绑项。
