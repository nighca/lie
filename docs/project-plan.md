# LIE — 当前项目计划

2026-11-01 当前截点：local/remote main为 `a8be75823ceb67966390b5534d725a3a8bf1505b`，结果页、人物布局与前批调查归档已发布并完整验收，见[发布回执](results-layout-release/2026-10-31.md)。GitHub `v1.1.0` 指向a8，`v1.0.0`保持原f8c4e2b；两版release正文已按用户要求改中英双语，Latest仍v1.1.0。分享功能已获具体UI及正式实现/合入批准，后台、前端及设计记录正在独立联合候选review/checks；**本批尚未更新main或上线，须root审阅并取得新的安全维护窗口**。所有旧维护窗口及视频撤销时的单次恢复许可均已结束。

总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 负责需求、调度、实际 review、串行集成与发布；具体实施和耗时验证由专项完整执行。每个专项使用独立 managed worktree / `codex/` 分支，草稿、产物、依赖与临时文件不落主工作区。只有获唯一 integration/publication turn 的 owner 可更新 main/push；review 后默认普通 push，不开 PR，不恢复旧轮换或定时任务。服务窗口与源码发布授权分别确认。 2026-11-01 协作约定（纠正此前“默认已附带”的措辞）：创建每个新 LIE chat 时主动选择独立 worktree 环境，核验实际绑定路径、HEAD、目标 base、分支及文件 ownership；创建时已正确配置则复用该工作区，不重复新建，未配置则先补配置并完成隔离，不假设默认已有。独立 `codex/` 分支、任务隔离与唯一集成者规则继续有效。

## 当前执行队列

| 优先 / owner | 已确认状态、依赖与下一步 |
| --- | --- |
| 宣传视频：取消 Git 入库、仅本地交付 / 视频 Chat `01a17dee-6a37-73f3-bf53-853df51f6b15`＋总协调 | 用户最新明确“视频不提交进git，太大不合适”，继而要求本地含视频提交从历史撤掉，覆盖此前横v3/竖v5入库批准。b4c26c8/843985不再排入任何cherry/push清单；该视频提交从未成功published；当前远端main为a8，且不含b4/843祖先。四成片原WT逐个SHA匹配保留；成片/大型制作包只本地交付，不另托管、上传或删除。原许可、许可修补与取消/恢复过程见[日期档案](history/2026-10-30/coordinator-refresh-fd049/README.md#视频入库许可撤销与未推-main-恢复)。 |
| P2 礼物入门案 / Chat `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e` | 布丁案因答案明显被否决；用户批准礼物案实施：双人、180 秒、首页第一、旧案后移。允许内容 JSON、排序及必要 tests/docs，通用引擎/UI 不因加案改变。5544 保留用户试玩、proxy 8788；具体最终设计仍在与用户讨论，**先本地试玩、用户确认，再交总协调 review/合入**，不能把初始实施许可当最终设计通过。此前UI批次的无对话维护许可及后来的单次main恢复许可均已结束；这不授权停止5544或后续任意维护。 |
| 首页/高视窗人物对齐 / 已完成归档 | 源09a766d→003f8a9、用户批准及独立review已随a8发布验收；旧UI Chat已archived，不自动恢复。原5177布局服务已停；该端口现由分享Demo另行使用，勿套用旧停止回执。 |
| P2 成功/失败结果页 / 已完成归档 | 源2a677d8→23abd80已随a8发布并验收；错误指认不揭真相、正确揭完整经过及可变人数语义保留。该轮5176已停，后续分享本地验收也已完整停止，见[服务登记](development.md)。 |
| P1 持久化分享 / 专项Chat `01a194d9-e260-7cd2-a8df-89b1478a1120`＋总协调 | 用户已批准整体方案、1 MiB写入上限、128 bits/22字符标识及精简UI，要求正式实现合入。后台b9b403b→27a08ae、前端34c5af8→51900be（校验成功响应id、错误可重试）按序纳联合候选；候选owner page_version只做准备，root保main/发布turn。两私有Standard R2桶已建，r2.dev关闭、无customdomain/CORS/对象TTL；平台7天未完成multipart abort不属内容到期。5176/5180及内部监听已停，5177 Demo保用户consumer。见[发布准备](share-storage-release-readiness.md)；正式部署/云合成验收尚待turn，不造真实语音。 |
| PR自动验证/预览 / Chat `01a19533-d60a-7980-91b8-9e7ec1dbbe6a` | WT `1ead/lie`，基于既有提案独立讨论推进，初始范围为只读评估/方案收敛；未从总协调获Worker/token/workflow云配置或公开预览部署授权，未纳本批。 |
| 路演PPT / Chat `01a1951e-6609-75e3-8db8-e013f8c3ada1` | WT `e6ff/lie`，用户已确认中文、评委与潜在用户、10分钟展示＋10分钟问答、约两天后、现有品牌、本地播放/PDF；owner独占 `docs/hackathon/project-highlights.md` 与 `docs/pitch/` 并在该Chat讨论验收。该专项未纳本批，未授权视频或大型包Git入库。 |
| 体验与AI创作 / 独立设计专项 | Chat `01a19193`、`01a1919a` 的design v3冻结待用户确认；review WT中的untracked设计不纳本批，不覆盖分享文件所有权。 |
| P1 语音体验观察 / 总协调（原语音 Chat `01a18ac7-cdfc-7690-a0c9-bdc3e6fc8eb9` 已 archived） | CPU 配置发布后用户亲测线上 f862 连续近 4 分钟无意外断开；16k 候选 5545 用户明确“没有电流声了，效果很好”，已随 f75 部署。原 chat 现由 App 返回 archived，root 未擅自 unarchive；多个旧 voice WT 已不在 worktree list，不能当活跃服务，精确 Git 对象/refs（含1ee049e）仍完整可归档。保留为同设备人工观察，继续收具体页面 hash、触发场景和时间；不声称所有设备音爆已消除、完整 600 秒或 provider 已验证。无授权不自动推理、录音、WS/profile、付费测试或改 provider 配置。 |
| P1 本地 main 对比环境 / `session_limit_acceptance`＋总协调 | 用户已重新授权并恢复持久 launchd 8787/8788，跟 owning clean main；仅用户要求停用或明确维护窗口才操作。实际当前服务身份、消费者和下轮待更新 PID 见[服务登记](development.md#当前服务登记)。DEV＋本地 workerd 只能绕过生产 CF 网络/平台 CPU 配额，本地 workerd/provider/设备限制仍有；provider 资源同一性未核。 |
| 文档与调查归档 / 总协调 | CPU/红点/断连事实链/离线接缝及前批中央档案已随a8归档；本批候选追加a8发布回执、已纠正的新chat主动配置WT约定与分享设计/批准/实现记录。原待归档清单仅历史截点；root旧dirty/PNG原件不动，视频及未授权设计不纳入。 |

## 已确认的产品边界

[模块架构](architecture.md)、交互原型和中文 B 视觉方向均已批准，无需重问。浏览器承载故事、会话和指认，纯 TypeScript core 独立 Vue/宿主；薄 Worker负责provider传输；已批准的分享方案另以私有R2保存静态案件快照，不引入服务端会话/判案，平台管理凭据保持私密。四个既有官方案人数 3/4/4/3、共享询问额度 480/600/540/480 秒；引擎支持可变人数，新同玩法案件只需内容与必要呈现配置，不硬编码案件或人数。礼物案未作为已发布第五案计入。

仅语音交流、只读转写与按钮指认，无证据收集/组合/规则 DSL。准备阶段不占游戏询问额度；ready 后静音、等待和回答均计入，停止暂停、切人不重置共享额度。错指终局不揭真相，正确才揭完整经过；离开确认，刷新不恢复局内状态。服务端连接 timer 与游戏额度不同：默认 600 秒从 relay 创建起计，包含连接准备，不改变原游戏时长。final-only 回退、合成嘴或 fake provider 不等于实时 ASR、真实口型或真人体验验证。

编辑器范围为三步文本字段、预设形象、同引擎试玩和浏览器本地草稿；本批候选按已批准方案将新分享改为服务端持久快照短链，旧压缩fragment只读兼容。无账号、草稿云同步、上传素材或作品版本发布管理；持有链接者可查看完整内容，修改后须重新分享。正式角色结果动画与既有游戏呈现已发布；新的结果页讨论不撤销既有玩法语义。

## 最近已完整验收的发布

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

- 真实四案盲测、长会话、外放/mic、多用户固定 device 隔离、成本硬上限、Safari/iOS/跨设备与原生 clipboard 权限尚未全验；16KiB URL预算仅保留旧fragment兼容边界，新分享写入上限为已批准的1 MiB。离线/Mock/桌面 Chromium 成功不能替代这些结论。
- 角色沉浸、启动时序与 vendor WS 方向继续按具体证据排查；不擅改 prompt/provider/预算。贺宁与 Hackathon 的真实模型短测由用户本人执行，不自动造推理流量。
- GitHub 投稿仍为独立研究/用户手动确认路线，不授权 OAuth/PAT、自动 PR、提交或假定仓库可公开；开发工作仍采用无 PR 的 worktree 集成流程。
- PR CI 隔离预览提案 `60d1d8` 待用户确认，不实施新 workflow/资源/权限；邀请码明确暂停，须用户重启；旧版本兼容 14 天/256MiB 方案被用户否决，不接 CI、不自动保留或删除线上资源。
- 视频制作曾获专项授权、横v3/竖v5曾获指定清单入库授权；用户最新已撤销Git入库，仅本地交付，禁止再将成片/大型制作包排入Git发布，也未授权另托管、上传、购买、账号改动或删除。历史研究、被否决方案及旧媒体许可边界保留在[完整日期归档](history/2026-10-30/README.md)与[既有档案](archive/README.md)。
