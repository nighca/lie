# LIE — 当前项目计划

2026-11-01 当前截点：文档候选基于已审 main `51264aebaf590badf0d0e3039ebbb6679994fe29`。自 v1.1.0（a8be758）以来，R2快照短链、Cookie语音身份隔离与介绍页预热、调查页口供滚动均已上线；UI已获用户验收。全栈PR预览代码已合入，真实v1/v2同地址更新、同版前后端、R2与有界语音验收通过，关闭后精确元数据GET404已确认。v1.2.0双语release及之后PPT交接排队，未创建tag/release；v1.0.0/v1.1.0保持原标签，不提前把未完成项称为已发布。用户已接受短时不可用，正常review后main→CI/CD，不采用复杂固定窗口；若用户明确正在语音，再简单协调。

总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 负责需求、调度、实际 review、串行集成与发布；具体实施和耗时验证由专项完整执行。每个专项使用独立 managed worktree / `codex/` 分支，草稿、产物、依赖与临时文件不落主工作区。只有获唯一 integration/publication turn 的 owner 可更新 main/push；review 后默认普通 push，不开 PR，不恢复旧轮换或定时任务。正常review后main→CI/CD，用户已接受短时不可用，不再另设复杂固定窗口或重复询问；用户明确正在语音时再简单协调。 2026-11-01 协作约定（纠正此前“默认已附带”的措辞）：创建每个新 LIE chat 时主动选择独立 worktree 环境，核验实际绑定路径、HEAD、目标 base、分支及文件 ownership；创建时已正确配置则复用该工作区，不重复新建，未配置则先补配置并完成隔离，不假设默认已有。独立 `codex/` 分支、任务隔离与唯一集成者规则继续有效。

## 当前执行队列

| 优先 / owner | 已确认状态、依赖与下一步 |
| --- | --- |
| v1.2.0 / 总协调 | 用户已授权在调查页UI与全栈PR预览均完成review、合入及实际发布后，基于届时已验证远端main创建中英双语正式release；不重复询问是否发布，不将记忆专项或视频README设为附加门槛。当前UI与PR验收均已通过，接下来核精确远端SHA、CI/CD及发布结果后创建release。 |
| PR自动验证/全栈预览 / Chat `01a19533-d60a-7980-91b8-9e7ec1dbbe6a`＋总协调 | 已实现并合入main，前端与Worker均来自同一PR测试合并构建；同仓自动，fork/Dependabot等外部来源按当前head SHA通过GitHub workflow_dispatch原生权限批准，更新失效需重批，不自建admin角色层。真实测试PR的v1/v2同地址更新及前后端同版已通过；共享非生产R2共6请求/2合成案件，语音2Device、3逻辑WS/保守6upgrades、19HTTP、16031ms累计socket，正常关闭及owned清理通过。PR2 closed/unmerged，close CI41296845867/cleanup publisher41296859092成功，10:18:42Z helper deleted=true、DELETE后精确元数据GET404；owned远端分支删除后GET404，main未改变、private unknown=null。2owned Device解绑、2自建tab关闭、无服务，R2按批准保留；真实fork路径未覆盖。固定父Worker、受信publisher、管理token不进PR build/runtime，获批runtime可读其非生产运行凭据；共享测试桶不设PR前缀，关PR不删共享数据或猜测解绑Device。[合同](pr-ci-preview-storage-contract.md)、[实施](pr-preview-implementation.md)、[执行边界](pr-preview-execution-plan.md)；最终运行证据随正常批次归档。 |
| 调查页UI / Chat `01a1964e-eda0-78c2-b353-ffcecf1cfed0`＋总协调 | Transcript仅在底部跟随流式文本，上翻保位置、回底恢复；没有查到等待提示强制播满3秒的bug，仅补ready/cancel/fail回归，不写成修复3秒。源43a08229已审、用户本地试玩接受、已随b0bdf1b上线；组合UI64/Web419及types通过。5176原PTY80248退出130、PID19329和监听核空，用户consumer已释放。[实现及验收](transcript-experience-tuning.md)。 |
| 角色记忆调查 / Chat `01a19634-a55e-7c52-9bba-de2fed945f57`＋总协调 | 用户报A→B→A遗忘，独立wire和有限真实样本未复现；内容6/6但逐题工具新调用严格4/6，不能称已修复或每轮MCP保证。仅测试/档案已纳main，无产品修复；专用资源和WS已清理。等待具体案件、角色、原话大意及转写线索再定位，不自动重跑，不阻塞既定v1.2。[调查证据](reviews/character-memory-2026-11-01/README.md)。 |
| Cookie语音隔离 / Chat `01a19557-145d-72f3-ace4-382ac03c22c9`＋总协调 | 已随16d64347上线并真实验收：持久Cookie身份对应Device、同身份新连接自然顶旧、不同身份并存；intro成功load后台prepare，共享token首握仅初401同Device一次OTA恢复、共9秒。独立样本严格5/6及token TTL未知等边界保留；无自动重连、无活跃租约锁或新接管UI。正式2owned绑定已精确解绑，P0归档交接后由root负责资源清单、180天Cookie与人工核对政策，后续每项ops持有自己的ledger，无自动删除任务。[上线实际回执及历史方法](reviews/device-concurrency-2026-11-01/actual-prod-receipt.md)。 |
| 持久化分享 / Chat `01a194d9-e260-7cd2-a8df-89b1478a1120`＋总协调 | 已随98d71fb上线：1MiB仅写端、128bit/22字符ID、私有R2不可变快照，修改新链接，旧fragment只读兼容。持链接可读完整真相，默认不过期非永久保证，无账号云草稿或作者撤回。生产/开发桶分离，分享Demo5177仍仅按最后owner消费者回执保护，不能据正式功能上线擅停。[发布范围](share-storage-release-readiness.md)。 |
| P2 礼物入门案 / Chat `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e` | 布丁案已否决；礼物案获准实施双人180秒、首页第一/旧案后移，限内容JSON、排序及必要tests/docs，不改通用引擎/UI。用户本轮试玩已结束，不保留5544；owner核无listener、原PTY8214 Unknown process，退出时间/原因未知，本次未执行stop。dirty内容与附件保留，最终方案仍须用户确认、clean交付后review合入，不计为第五正式案。 |
| 宣传视频与README / 视频Chat `01a17dee-6a37-73f3-bf53-853df51f6b15` | 用户已在专项另授权最新漫画竖v2、横53.8秒各发布B站/YouTube，共4条；具体文案/协议由该owner执行，不扩账号/素材范围。正式URL核实后，独立轻量WT只改README.md/README.zh-CN.md（英YouTube、中B站），保留旧真实语音长demo，clean提交交root。新成片/大型工程仍仅本地、不入Git；旧b4/843视频提交未published，不再合入。5198最后登记用户编辑consumer未释放，见服务表。该README不增设v1.2门槛。[撤销与历史证据](history/2026-10-30/coordinator-refresh-fd049/README.md#视频入库许可撤销与未推-main-恢复)。 |
| v1.2后路演交接 / 总协调→PPT Chat `01a1951e-6609-75e3-8db8-e013f8c3ada1` | release完成后root主动同步v1.1/v1.2实际变更、URL/完整SHA、工程与环境状态及验收边界；owner核既有路演受影响处并直接与用户确认更新方案。轻量pitch/highlights已有专项提交089a5f9、未合入main，完整稿待用户验收；不自动覆盖用户材料、不上传大deck/video，不提前把待验项写成果。 |
| 体验与AI创作设计 / 独立Chat `01a19193`、`01a1919a` | v3设计/隔离模拟Demo仍待用户确认，不作为已上线功能；独立review WT原件保留，不混入本批或越过正式实施门禁。 |
| 语音体验观察 / 总协调，原语音Chat `01a18ac7-cdfc-7690-a0c9-bdc3e6fc8eb9`已archived | 近4分钟人工持续语音和16k本地试听有正向反馈，不推广为全设备音爆消除或完整600秒保证。继续收具体页面hash/触发场景和时间，无新许可不造推理、mic/录音、WS/profile或修改provider；旧WT目录与PID只作历史。 |
| 本地main环境 / `session_limit_acceptance`＋总协调 | 持久launchd8787/8788跟owning main；用户明确停用才停止；正常review后随main→CI/CD，若用户明确正在语音再简单协调，不复制服务。当前来源/consumer与历史PID见[服务登记](development.md#当前服务登记)。案件intro加载会后台prepare，不能当零provider的纯浏览。 |
| 文档归档 / 总协调 | 完成的CPU、播放、结果页、版本入口、分享与P0调查/发布史已在default main保全；历史完成表不是活跃全开队列。本轮仅收敛当前dashboard和服务登记，旧dirty草稿/原件不改不清；PR最终close已确认，与正常证据批次一次整合，不制造报告-only发布循环。 |

## 已确认的产品边界

[模块架构](architecture.md)、交互原型和中文 B 视觉方向均已批准，无需重问。浏览器承载故事、会话和指认，纯 TypeScript core 独立 Vue/宿主；薄 Worker负责provider传输及已批准的Cookie身份/设备准备；已批准的分享方案另以私有R2保存静态案件快照，不引入服务端会话/判案，平台管理凭据保持私密。四个既有官方案人数 3/4/4/3、共享询问额度 480/600/540/480 秒；引擎支持可变人数，新同玩法案件只需内容与必要呈现配置，不硬编码案件或人数。礼物案未作为已发布第五案计入。

仅语音交流、只读转写与按钮指认，无证据收集/组合/规则 DSL。准备阶段不占游戏询问额度；ready 后静音、等待和回答均计入，停止暂停、切人不重置共享额度。错指终局不揭真相，正确才揭完整经过；离开确认，刷新不恢复局内状态。服务端连接 timer 与游戏额度不同：默认 600 秒从 relay 创建起计，包含连接准备，不改变原游戏时长。final-only 回退、合成嘴或 fake provider 不等于实时 ASR、真实口型或真人体验验证。

编辑器范围为三步文本字段、预设形象、同引擎试玩和浏览器本地草稿；已按批准方案将新分享改为服务端持久快照短链，旧压缩fragment只读兼容。无账号、草稿云同步、上传素材或作品版本发布管理；持有链接者可查看完整内容，修改后须重新分享。正式角色结果动画与既有游戏呈现已发布；新的结果页讨论不撤销既有玩法语义。

## 已完成发布历史（按原日期与验收范围保留）

| 发布 | 行为与验收边界 |
| --- | --- |
| `a8be75823ceb67966390b5534d725a3a8bf1505b` 结果页＋人物布局＋调查归档 | CI41085985860/CD41086191125 success，serving1820dfac-c92e-4082-91af-0cf46de7aff5 100%，CPU30000/600；线上入口与CI256文件receipt及clean产物精确一致。local Web64161/gateway64257为当轮恢复快照，不作为当前PID。完整证据见[回执](results-layout-release/2026-10-31.md)，无视频入库。 |
| `a742b1e` 连接上限 | 用户批准方案 B：保留可配置上限、默认 text 字符串 `600`。CI 41031475179 / CD 41031654559；[发布证据](history/2026-10-30/voice-session-limit-release.md)。未跑真实 10 分钟。 |
| `95cb5cf` 播放调度 | 用户批准 100ms PCM 起播/耗尽恢复储备、单一有界 timer 和消除逐片人为 gap；打断/close 清理，短尾 flush。CI 41046222803 / CD 41046380232；[发布证据](history/2026-10-30/playback-release.md)。离线 12 场景调度通过，48k 两场景差异保留，不等于音爆全闭环。 |
| `f86206611dbc0a10260fb1605d9a616b22493dc3` CPU 预算 | 用户明确批准显式 `cpu_ms=30000`；保留 600 秒、帧限制与清理语义。CI 41063632168 / CD 41063875763，serving `bf101da5-a7ad-4a46-8fe4-995a9103cd23` 100%，实际读回 CPU 30000、standard，线上完整 hash 与 clean 产物一致。人工近 4 分钟复测通过，继续观察。发布证据已纳本批候选，[原待归档截点](history/2026-10-30/coordinator-refresh-fd049/pending-archive.md)。 |
| `f75b5db858e20b596c0d6851fa13a602f87bc975` 等待提示＋16k | 用户批准纯文字四段提示、无插画/步骤点/副句，ready 立即退出；此版本节奏为 0/700/1400/2100ms。单行播放 AudioContext 16k 调整保留 mic/PCM/player/100ms/600/CPU30000。CI 41071480755 / CD 41071695705，serving `923519c6-1759-4df3-950b-49b38ec8b404` 100%，线上完整 hash/root 产物身份已核。5545 用户试听通过，非所有设备保证。 |
| `fd0493773e3b47ee934b2a391e8f69b49f632c58` 红点版本入口 | CI 41073746177 / CD 41073977759，serving `971c6d3d` 前缀版本 100%，CPU30000 / 600。默认隐藏版本，Logo 红点打开 dialog 不导航，其余 Logo 导航保留；完整真实页面 build hash 可选择，DEV/unknown/dirty 如实标记。线上入口同 clean 产物，local main-status 已核。取代旧首页右下 footer（[旧发布](history/2026-10-30/page-version-release.md)）；只证明页面身份，不代表 gateway 或语音体验。后续 bda 已完成下述完整验收。 |
| `bda3ddbf7b69f7f28ee2f112183477e617a2bbd0` 姓名高亮＋趣味弹窗＋1秒提示 | 用户批准“页面口供”弹窗，clipboard 迟到 race 以请求序号/同步打开轮次/卸载失效补修并独立 deferred 复验；Transcript 仅已揭示安全文本高亮，提示按用户要求 0/1000/2000/3000ms。源 Transcript d76→831、弹窗 af960→954→a6、提示746。组合40 Web＋25 UI目标/types/clean全build/dry-run通过；CI41077748266 / CD41078006001 success。deployment `7f3d8035-f323-4ee4-8027-c42b1315938e`，2026-10-30T15:09:37.382Z，version `2d6b7a2f-5261-4ccd-bade-41298c7d856c` number38 100%，CPU30000 / plaintext600。root 独立线上 index-BnWfxI2C.js 243642 bytes、SHA256 `875fb60831d1de2f2fa4c68cbe114a847a90aef8d1f4d990e7b7cf1dd05a3bab`、full bda 同 clean；own Chrome default closed/footer0→红点弹窗/fullhash/dirtyfalse/关闭回焦通过，未真实 clipboard。local Web33625、gateway33704、health ready恢复；证据da3d2ef已纳本批候选归档。 |

## 后续与明确门禁

- 真实四案盲测、长会话、外放/mic、成本硬上限、Safari/iOS/跨设备与原生 clipboard 权限尚未全验；Cookie多身份并存已取得有限生产transport样本，不能扩大为全场景记忆隔离；16KiB URL预算仅保留旧fragment兼容边界，新分享写入上限为已批准的1 MiB。离线/Mock/桌面 Chromium 成功不能替代这些结论。
- 角色沉浸、启动时序与 vendor WS 方向继续按具体证据排查；不擅改 prompt/provider/预算。贺宁与 Hackathon 的真实模型短测由用户本人执行，不自动造推理流量。
- GitHub 投稿是作者手动确认的独立贡献流程，不授权Agent取得OAuth/PAT或自动代投稿；仓库public和PR预览权限不扩展为任意账号操作。内部AI开发仍采用无PR的worktree集成流程。
- 旧PR提案 `60d1d8` 的限制已由本轮已确认完整前后端预览合同覆盖，旧资料仅历史；新增资源/权限仍限具体授权。邀请码明确暂停，须用户重启；旧版本兼容 14 天/256MiB 方案被用户否决，不接 CI、不自动保留或删除线上资源。
- 视频制作曾获专项授权、横v3/竖v5曾获指定清单入库授权；用户最新已撤销Git入库，仅本地交付，禁止再将成片/大型制作包排入Git发布，另有本表所列专项4条上传授权，不扩展为任意托管、购买、账号改动或删除。历史研究、被否决方案及旧媒体许可边界保留在[完整日期归档](history/2026-10-30/README.md)与[既有档案](archive/README.md)。
