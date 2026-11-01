# Cookie Device 发布运维窗口 01 实际回执

2026-11-01。结果：**仅完成旧代码配置桥；新产品代码未上线。** candidate upload120s超时，状态`uploadunknown`，真实Cookie/provider/API验收未执行。本轮已安全收尾，不能把未执行步骤记为通过。

## 授权与职责

用户对已审`f9b960`/执行单SHA256 `a9b84ab975eb654e473b3175be0509db527520a930a51b49249ec7c6b65e130f`的原话：**“批准，现在无活跃语音，可开始维护”。** 该批准包含白名单私密准备、配置桥、最多2验收Device/6逻辑WS/24providerHTTP、0listen/mic、local指定job维护、原CI/CD与回滚及人工资源政策；不等于忽略执行turn/时间门槛。用户随后指令“继续发布上线”保留同scope意愿，下一窗口时间/具体turn仍由root指定，不自动重试本次unknown。

总协调授窗口`07:24:30–07:44:30 UTC`（北京时间15:24:30–15:44:30），并在过程中设置`07:39:30`后不启动main更新/push，给CI/smoke/清理留5分钟。本agent实际在**07:42:14 UTC（15:42:14）**交回release；截止后无云写/provider/job/main操作。

实施owner `/root/cookie_device_implementation`；本专项Chat `01a19557-145d-72f3-ace4-382ac03c22c9`保管私密ledger/恢复源；父owner及总协调审方法、排期/继任/复核/授权。总协调Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8`持integration/publication责任，本agent未做Git mutation。

## 实际身份和阶段

| 阶段 | 实际事实 |
| --- | --- |
| 原生产 | deployment `618a36fe-19fd-49b5-ba8d-07a8fcd03f90`，100% version `cf09d65a-4ec4-45d8-b6a2-bac129a79cf7`，tag `git-98d71fb9ebc2f517010598c4796c8db3014a73c7`；执行前再次核对。 |
| 旧artifact | 精确CI41270879240/attempt1/artifact13068829177。先自有慢下载48259后停止；经root批准复用指定源ZIP，自己重核113388669bytes、SHA256 `f35109580ebadfd16bf555b0ac04ed3e82163fdafab73b63ac07603e66d07ee5`，安全ZIP路径/类型和restore256files/receipt/lock全部过。不是同SHA重build。 |
| 私密准备 | 父review后prepare成功：原vars/plist备份、local/production两独立≥32UTF8bytes签名secret、新管理key临时bundle；只输出布尔值。目标local配置未写。生产Agent/WS/Device值不读不改，桥仅继承。 |
| Bridge | dry-run0、upload0，version **`3e83c77c-85f8-40b8-abe7-6ce0340513a7`**，tag `cookie-config-bridge-20261101`。旧CI代码/资产不变，只增加API_KEY/COOKIE_SECRET，metadata共5secret names完整；不提交author/原云响应。 |
| Bridge激活 | activation dry-run0、实际0，100% serving deployment **`db99ac94-5e60-445d-abb1-78a548976972`**；无bypass/force。旧代码/旧资产实际继续服务。 |
| 正式旧asset证据 | GET `/assets/index-gCk9AbIP.js`实际200，247601bytes，SHA256 **`d8c6fe7e217efecc56aabfd8e1d489a06dc7070476dfa805cef3eed4e4a8f39e`**；health `{status:ok,storage:r2}`、voiceStatus ready。只是旧行为/配置形状，不证明新管理key对生产Agent可用。 |
| Inactive candidate | 已审c9d237 build，tag `cookie-device-candidate-20261101`；dry-run0，唯一upload session65528在120s timeout停止，未回ID/URL；没有激活新产品代码、没有自动retry。inactive upload与旧asset GET并行，如实保留方法时序。 |
| 有限lookup | 第一次最新5条无精确candidate tag。第二次按当时“继续一次有限核对”指令发起per-page100、实际41条，并同批核active；“不要再追加metadata”消息到达时已发起，完成后不再查询。也无精确tag匹配，但不据此断言绝无远端创建；记**uploadunknown / 无可用URL**。 |
| 发布门槛 | 07:39:30未齐，root明确本轮不go main/push；集成候选16d643仅准备，不当成已部署artifact。最后owning-main实核仍98d71。remote main未由本agent更改。 |

## 真实请求和清理结果

- **provider HTTP0、owned WS0、owned Device绑定0。** API executor从未真运行，没有注册/解绑/新建Agent/推理/listen/mic/真人内容，不为测试制造临界请求。
- local `.dev.vars`与原backup私密逐字比较`true`；job plist与before逐字比较`true`；未执行local-config/local-restore/bootout/bootstrap/kickstart，原8787/8788及其他用户服务未动。没有操作用户tab/reload。
- 精确删除temporary `production-additions.json`，确认不存在。两个独立signing恢复源、原vars/plist备份0600保留于批准的0700状态根；不把其值/hash/内容放Git或工具输出。
- 自有慢下载48259 Ctrl-C退出；candidate upload由subprocess120s限时结束。最终有限ps核本次tag/API/download/CLI命令，无存活owned进程（仅核验命令自身）；没有kill未知进程或留服务/浏览器consumer。
- 正式生产最终仍为上述bridge100%；末次active核无变化，旧asset证据在无后续变更条件下复用。本轮结束没有新代码部署或回滚bypass。

私密状态根：`/Users/nighca/Library/Application Support/LIE/voice-device-release/2026-11-01`。由专项保管包括ZIP/receipt阶段文件、private CLI logs、`window-01-summary.json`及恢复源。repo只存脱敏方法/结果；不提交raw云metadata（含author）、secret bundle、Cookie、provider token或配置原文。

## 本轮固定方法与离线检查

以下是**本轮实际审查identity**，窗口已过，不能直接复跑；API仅完成离线检查没有真执行。下一窗口必须新文件/新参数，不修改这些历史字节。

| 文件 | SHA256 |
| --- | --- |
| `release-ops.mjs` | `1f0f96fbf6e4ef531e843fc109de380d1e4ddec0afbf652b834f52ed94967697` |
| `release-ops.test.mjs` | `779307f24eed62c670df2c1def5aee8cf7ba33656f7b1d9127a9d5ff3d66e9a3` |
| `release-api.mjs` | `7027e91f1dedaa39135183433731fb63e54fa7fbdfcc7952f0264bdda0dcd258` |
| `release-api.test.mjs` | `d742284aacdb06aa79d72e0298673e5a802ef041350cd57b74ced0dbedbc52ed` |

父及独立audit实际读审；Node pure checks **4+8=12通过**，含vars非目标字节/CRLF/重复键拒绝、绝对deadline、预算保留、hello/Cookie属性、自然替换因果、prepare20s/unknown拒解绑、跨save累计socket。helper保留before/expected双字节allowlist和部分失败恢复护栏，local写前两份expected均已私密落地；这些写路径本轮未执行。

已识别的下一窗口离线准备项：normal WS绝对global60秒close reserve与握手/hello剩余额度收窄、动态外部window参数、复用现bridge及既有私密恢复源、candidate唯一新tag/一次上传与unknown reconciliation，不在历史脚本上改成新方法。本轮没有用未审改动赶跑。完整实际cloud driver见[方法归档](release-ops-run-01-driver.md)。

下一步由本agent继续完整拥有配置/API/local/CI后smoke尾巴；root在新方法实际review ready后再给明确窗口，不重新生成secret/重传旧bridge，不把scope持续授权当作现在可自动云写。
