# 最终刚性动画与当前main组合验收

2026-10-25，owner `/root/character_preset_migration`。root借用WT `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`，分支 `codex/integrate-approved-animation-final`；clean应用候选 **df8d26db494178cf561d7b5a77c24254c0c296aa**，基线已审main **14ca8cc2229eef9317bdaf98fbde3c960df18b05**。root只重放已审8be6→a432的23动画提交＋9aa技术报告，没有merge整个远程abb分支。用户已验视觉，本轮不重复视觉、不新browser/service/mic/provider/依赖/图编辑。

## 实测检查

沿用候选真实本地node_modules，非根目录symlink，@lie链接全部在候选内；223个安装锁条目version/integrity/resolved/link与根lock一致，未安装依赖。Node **24.22.1**，依次执行，无失败、无无因重复：

| 范围 | 结果 |
| --- | --- |
| Web全suite，含preset/voice/remix/动画集成 | **31套281项通过** |
| UI全suite | **5套43项通过** |
| character-animation运行时全suite | **2套33项通过** |
| Web / UI / character-animation types | 全部通过 |
| Web生产build及postbuild strict | **8预设89资源通过** |
| 实际hash输出/包引用/QA隔离 | 下述全部断言通过 |

没有把旧remote应用组合或owner61项历史检查当作当前组合PASS。此处运行时测试为Node单测，不是原生canvas/browser视觉、真实visibility或真人语音验证。

## 生产与资源身份

相对基线14ca，`apps`、`packages`、根`scripts`、package.json及lock Git tree/blob完全相同，所有非动画业务逻辑不变。正式资源tree仅五个animation/package.json改变，逐一与source **a432b72bd9d7742c5b2d49306725be0fcd74e0d5** blob相同；其余PNG/manifest/三旧包均保持基线字节。用户批准的silver最小button crop/y修复来源、完整23链及9aa技术报告随候选保留。root已完整审五包nodes/tracks、五制作generator、验证器/纠正checker/HTML/报告和remote候选228＋5路径身份；本轮补当前main组合验证，不替代或重复其视觉审查。

实际fingerprintAssets输出 **92项派生资源**，逐文件对照dist字节一致。8个包均用实际readAnimationPackage解析，canonical→固定public→固定dist→hash dist的package bytes全相等，**46相对parts全部解析到存在的输出**；由包内容变更引起的hash链已体现在生产manifest中。

- 生产manifest：`/static/a569fd2622d84c9b584c1b7fbc3aa2182a07e7a3b438033f2780c77bb3f58a29/appearances/manifest.json`
- 生产manifest SHA256：`a569fd2622d84c9b584c1b7fbc3aa2182a07e7a3b438033f2780c77bb3f58a29`，与URL中摘要相等。
- fixed manifest SHA256：`3650cf01b7fdc69068b8e289e5b52e0c76d48d8f119bdefe709533f0197ecbb1`。
- hashed/fixed全部8项id→voiceId相等；salt-pepper-beard仍为获准龙三叔 `2e7965636b0d4472ae51e75f419dff41`，保留sunny同声。
- dist共190文件，唯一HTML为index.html；无py/ts/mjs/txt作者/探针文件。HTML/JS/CSS中无qa-controls、__voice_connection_qa、remix-qa.html、qa-entry.ts、waiting-inspection.html或/design/animation-candidates/引用。

8包实际SHA256（动画目录URL使用整目录摘要，不把本表包字节摘要误作目录摘要）：

| id | package SHA256 |
| --- | --- |
| coral-bob | `f3f2321b98fbced68c606b3513e93c27756a3e3aa7380ed2067dcf49b41fb818` |
| sunny-moustache | `baa81c21f615780b3a4e35d6f89c96281dd08c29d7cf29fe9abbcdbba560414c` |
| blue-glasses | `1b2702529a50c58537dd3b5abccae3f1acc306da0061a7efd5f56a97cc2f8f53` |
| silver-bun | `5b44d5066e1d1f624a28eed5c4f8338f9289870133bedd1b7def3f9feb20a330` |
| salt-pepper-beard | `92693d4321f48d6a9af578cb4e56d0d028396da5f8bc47b9fa7ff7098d97bde8` |
| plum-crop | `bcf6fe83894384997b45f53e8f13abdfd131c2bb666a5bbdfe5720d935624bfc` |
| mint-puffs | `bb4c9fad042cc871c6fed77e46237bf72bc413f7ef05d50e801b0488e2543adc` |
| ochre-freckles | `b5dce30a0aac378a5ba3a660b8c730c4dfc82afe5ea799bf29a4b272bce499c7` |

## 已审PNG研究归档与复用

所有生产检查结束后，按root明确授权顺序cherry source **a46dd06a8c2828dad73c2c9d3ba8eb1c907d56aa** 为 **fe32d468f3e998f8f2bf99bb9d072937ac0559c4**。[PNG报告](../performance/2026-10-25/png-lossless/README.md)是纯研究，没有接入build。root已完整读探针/8测试/资源身份，独立8/8 PASS及81文件source SHA/bytes/sum核验；本轮又核81PNG source SHA仍等于该测量，并证明归档前后apps/packages/scripts/正式资源/依赖tree不变，因此复用刚完成的应用验证，不再跑一分钟压缩或重复build。PNG报告中的4c0b旧manifest属于其d47测量基线；本动画候选五包JSON变化后的当前URL以上述a569为准，不反改历史研究数据。

全81PNG省5.28%、level9压缩66.73秒，root同意暂不接生产构建；报告review通过并在本候选归档，root ff前不称已main。不复制其他未审报告。

## 用户决定、服务与限制

用户已纠正不走动画PR，恢复常规本地集成。原owner已实际gh确认[PR #1](https://github.com/nighca/lie/pull/1) **CLOSED、mergedAt null**，head仍a9e5811；未评论、未删分支、未merge/deploy。本验收者没有远程动作。root仍唯一integrator，当前动画组合验证通过、待root审本报告及快进main，不能提前称已main/push/deploy。旧PR例外已取消，PR及旧FAIL/纠正历史保留。

基线已包含改编（main eafee8599210bd382b2738d85d52a08281d43b7e，源d3bd29c6，前轮281/types/build89及原生2图经root审）和桌面立绘CSS（main14ca，源ffa0b753，仅min-width1151 top32，mobile0）。后续CTA由Editor独立处理：88ab14d曾交但未cherry/main，用户再要求复用“投稿给官方”的quiet UiButton（默认纯文字、hover既有底色边框），不采用蓝色下划线；owner保留88ab并追加修正在制，不在本冻结组合，不抢写或扩本轮测试。

本轮服务、浏览器、真实mic/provider、费用和凭据操作均零，无PID/PTY/tab或override需清理，无端口扫描或停止旧PID。保护8787/8788及其他owner资源。5507 PC位置回合owner回执PID8323/PTY85340、IAB41，原PTY exit1、lsof无监听/tab41/temp清；5402改编session23758退出/无监听/tab/temp清，均是来源回执，不声称本轮重新验证服务。现有原生图和技术数值checker保留其原证据范围，未把它们升级为本组合的新视觉验收。没有新Gateway/CF构建、Miniflare或线上请求。

## 交付顺序

以下为从main14ca到应用候选24链及PNG归档的全部有序提交；本报告和中央最小状态更新的后续提交由handoff另列，root逐一review后ff。原始源链见已有9aa chain与协调历史refs，未改写source commits。

```text
5be93eef1d82420de39b45543b9faffed82a8546
9dd54121db1a0b575d8acacbcde5ac89d6a7dc4d
0d829c3ff972f1f7a05129ccef388b617a7515ea
42aa8c03c9c303b60fccadd18e8f497a40dc25bb
42b9a6f3d49b911d806e96b1105bfe56562ff959
4a5012553e0be9bf7442a14af92580581c405280
5070bf0d62044655c58510c4ba49db9bc69d3442
01a1f23a1dd57eb498fbe0d89963e957643e645c
612bc00737619bb93982e8fdec3940aeb921fc4d
2babb431401aba615841e54543d7ca2bafba4d4e
b4112387d9ac24c745afb0cd1c397778464bb9ae
4d352cb615a008c2a6ae5f45d19e90a7b71c99a3
adb32dd0d5905451d1bebe0fcbe1e530df0a6691
ad77c3fea69471510c16ab16b42949a6635bec68
f2717b790b1a9c3623ba1eb50b7ead2f8315a479
9e19ee66400702ee909e7642fb059f6249c3b1be
11aad88ef564a0b83a673f09ab5760e47e52f4a8
5247a5211c22af05aa0d0189c49f981fd71247ec
5d97616066c41727682c023685bd052c4b1898b6
2f9e9127d5e1ec4367849a18324662661a6fdc81
c595de58de906b891e4b4703176eb93cf02664c4
9b5ef6d4039d6e02b03a05e5274dbaf5dd6840c2
d05c67c2afbfb8804fc03395436be97e485956f9
df8d26db494178cf561d7b5a77c24254c0c296aa
fe32d468f3e998f8f2bf99bb9d072937ac0559c4
```
