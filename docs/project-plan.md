# LIE — 当前项目计划

2026-10-30 状态截点：本文档整理基线为 `fd0493773e3b47ee934b2a391e8f69b49f632c58`。总协调最新完整回执：UI 合批 `bda3ddbf7b69f7f28ee2f112183477e617a2bbd0` 已 main/push、精确 CI/CD success、实际 serving 与本地恢复验收通过（见下表）。视频仍由 `page_version` 持唯一 turn 独立执行，尚无本任务截点内最终发布回执。用户另批准北京时间 **23:17:16–23:32:16** 视频素材及随后纯文档维护窗口，**不含结果 UI**；过窗须重新协调，不延续为常设权限。

总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 负责需求、调度、实际 review、串行集成与发布；具体实施和耗时验证由专项完整执行。每个专项使用独立 managed worktree / `codex/` 分支，草稿、产物、依赖与临时文件不落主工作区。只有获唯一 integration/publication turn 的 owner 可更新 main/push；review 后默认普通 push，不开 PR，不恢复旧轮换或定时任务。服务窗口与源码发布授权分别确认。

## 当前执行队列

| 优先 / owner | 已确认状态、依赖与下一步 |
| --- | --- |
| P2 宣传视频入库 / `coordinator_dashboard`＋视频 Chat `01a17dee-6a37-73f3-bf53-853df51f6b15` | 用户明确批准最新横 v3/竖 v5 入库，取代这些交付物的旧“不提交”门禁。独立 clean 候选 `b4c26c8ca2abb6444cfcc254409ae5aadde644fb`，base fd049，WT `lie-promo-package-v3-review`；360 named / 350 payload / 131416998 bytes，26 CLI、真实嵌套 symlink 写前拒绝、15 SHA 与四成片身份通过。原 SFX 不再分发、Apache LICENSE 已补；root 已读 HANDOFF/runtime helper/prepare/notices/overrides，无新增 blocker。root 已交 `page_version` 在上述窗口独立建候选、review/checks 与发布；最终结果待 owner 回执，不混结果 UI 或其他产品变更。仅入库指定清单，不授权社交上传、账号改动或购买；旧 v1/v2 不入库。 |
| P2 礼物入门案 / Chat `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e` | 布丁案因答案明显被否决；用户批准礼物案实施：双人、180 秒、首页第一、旧案后移。允许内容 JSON、排序及必要 tests/docs，通用引擎/UI 不因加案改变。5544 保留用户试玩、proxy 8788；具体最终设计仍在与用户讨论，**先本地试玩、用户确认，再交总协调 review/合入**，不能把初始实施许可当最终设计通过。当前 UI 批次用户明确无对话、可短暂更新 8788；这不授权停止 5544 或后续任意维护。 |
| P2 成功/失败结果页 / Chat `01a18d4c-72b2-7d93-8df3-2aa9cb7a5fe4` | 用户要求独立 Chat 共同优化，WT `4ea5/lie`；先前 Transcript 预览和本轮结果页预览均已停止交回。范围 App solved/lost 与专属呈现/样式/tests/设计文档，保错误指认不揭晓、成功完整经过、可变角色及 UGC。实现有序 `2a677d847ab76531a8eda6a5e6a14805daf54c07`→`23abd80ebfb7f8fa29d4aaa5b545ee08a4563f68` 已交，独立/root review 通过；5176 已停止释放。当前视频＋纯文档窗口不含此产品变更，下一批由 root 另协调用户确认记录与服务窗口；不因 code review 自动发布，不碰 Transcript/PageVersion ownership。 |
| P1 语音体验观察 / 语音 Chat `01a18ac7-cdfc-7690-a0c9-bdc3e6fc8eb9`＋总协调 | CPU 配置发布后用户亲测线上 f862 连续近 4 分钟无意外断开；16k 候选 5545 用户明确“没有电流声了，效果很好”，已随 f75 部署。保留为同设备人工观察，继续收具体页面 hash、触发场景和时间；不声称所有设备音爆已消除、完整 600 秒或 provider 已验证。无授权不自动推理、录音、WS/profile、付费测试或改 provider 配置。 |
| P1 本地 main 对比环境 / `session_limit_acceptance`＋总协调 | 用户已重新授权并恢复持久 launchd 8787/8788，跟 owning clean main；仅用户要求停用或明确维护窗口才操作。实际当前服务身份、消费者和下轮待更新 PID 见[服务登记](development.md#当前服务登记)。DEV＋本地 workerd 只能绕过生产 CF 网络/平台 CPU 配额，本地 workerd/provider/设备限制仍有；provider 资源同一性未核。 |
| 文档与调查归档 / 本任务＋总协调 | 中央草稿完整快照、决定演进和未集成依赖见[当日索引](history/2026-10-30/README.md)。CPU 发布、红点发布、本地恢复、断连与离线接缝证据已在各自 clean 分支，待按精确链独立审查归档，本文不代为 cherry-pick。 |

## 已确认的产品边界

[模块架构](architecture.md)、交互原型和中文 B 视觉方向均已批准，无需重问。浏览器承载故事、会话和指认，纯 TypeScript core 独立 Vue/宿主；薄 Worker 仅传输 provider，平台管理凭据保持私密。四个既有官方案人数 3/4/4/3、共享询问额度 480/600/540/480 秒；引擎支持可变人数，新同玩法案件只需内容与必要呈现配置，不硬编码案件或人数。礼物案未作为已发布第五案计入。

仅语音交流、只读转写与按钮指认，无证据收集/组合/规则 DSL。准备阶段不占游戏询问额度；ready 后静音、等待和回答均计入，停止暂停、切人不重置共享额度。错指终局不揭真相，正确才揭完整经过；离开确认，刷新不恢复局内状态。服务端连接 timer 与游戏额度不同：默认 600 秒从 relay 创建起计，包含连接准备，不改变原游戏时长。final-only 回退、合成嘴或 fake provider 不等于实时 ASR、真实口型或真人体验验证。

编辑器范围为三步文本字段、预设形象、同引擎试玩、压缩 fragment 分享和浏览器本地草稿，无账号、云同步、上传素材或作品版本发布管理。正式角色结果动画与既有游戏呈现已发布；新的结果页讨论不撤销既有玩法语义。

## 最近已完整验收的发布

| 发布 | 行为与验收边界 |
| --- | --- |
| `a742b1e` 连接上限 | 用户批准方案 B：保留可配置上限、默认 text 字符串 `600`。CI 41031475179 / CD 41031654559；[发布证据](history/2026-10-30/voice-session-limit-release.md)。未跑真实 10 分钟。 |
| `95cb5cf` 播放调度 | 用户批准 100ms PCM 起播/耗尽恢复储备、单一有界 timer 和消除逐片人为 gap；打断/close 清理，短尾 flush。CI 41046222803 / CD 41046380232；[发布证据](history/2026-10-30/playback-release.md)。离线 12 场景调度通过，48k 两场景差异保留，不等于音爆全闭环。 |
| `f86206611dbc0a10260fb1605d9a616b22493dc3` CPU 预算 | 用户明确批准显式 `cpu_ms=30000`；保留 600 秒、帧限制与清理语义。CI 41063632168 / CD 41063875763，serving `bf101da5-a7ad-4a46-8fe4-995a9103cd23` 100%，实际读回 CPU 30000、standard，线上完整 hash 与 clean 产物一致。人工近 4 分钟复测通过，继续观察。发布证据分支待[归档](history/2026-10-30/coordinator-refresh-fd049/pending-archive.md)。 |
| `f75b5db858e20b596c0d6851fa13a602f87bc975` 等待提示＋16k | 用户批准纯文字四段提示、无插画/步骤点/副句，ready 立即退出；此版本节奏为 0/700/1400/2100ms。单行播放 AudioContext 16k 调整保留 mic/PCM/player/100ms/600/CPU30000。CI 41071480755 / CD 41071695705，serving `923519c6-1759-4df3-950b-49b38ec8b404` 100%，线上完整 hash/root 产物身份已核。5545 用户试听通过，非所有设备保证。 |
| `fd0493773e3b47ee934b2a391e8f69b49f632c58` 红点版本入口 | CI 41073746177 / CD 41073977759，serving `971c6d3d` 前缀版本 100%，CPU30000 / 600。默认隐藏版本，Logo 红点打开 dialog 不导航，其余 Logo 导航保留；完整真实页面 build hash 可选择，DEV/unknown/dirty 如实标记。线上入口同 clean 产物，local main-status 已核。取代旧首页右下 footer（[旧发布](history/2026-10-30/page-version-release.md)）；只证明页面身份，不代表 gateway 或语音体验。后续 bda 已完成下述完整验收。 |

| `bda3ddbf7b69f7f28ee2f112183477e617a2bbd0` 姓名高亮＋趣味弹窗＋1秒提示 | 用户批准“页面口供”弹窗，clipboard 迟到 race 以请求序号/同步打开轮次/卸载失效补修并独立 deferred 复验；Transcript 仅已揭示安全文本高亮，提示按用户要求 0/1000/2000/3000ms。源 Transcript d76→831、弹窗 af960→954→a6、提示746。组合40 Web＋25 UI目标/types/clean全build/dry-run通过；CI41077748266 / CD41078006001 success。deployment `7f3d8035-f323-4ee4-8027-c42b1315938e`，2026-10-30T15:09:37.382Z，version `2d6b7a2f-5261-4ccd-bade-41298c7d856c` number38 100%，CPU30000 / plaintext600。root 独立线上 index-BnWfxI2C.js 243642 bytes、SHA256 `875fb60831d1de2f2fa4c68cbe114a847a90aef8d1f4d990e7b7cf1dd05a3bab`、full bda 同 clean；own Chrome default closed/footer0→红点弹窗/fullhash/dirtyfalse/关闭回焦通过，未真实 clipboard。local Web33625、gateway33704、health ready恢复；证据da3d2ef独立待归档。 |

## 后续与明确门禁

- 真实四案盲测、长会话、外放/mic、多用户固定 device 隔离、成本硬上限、Safari/iOS/跨设备与原生 clipboard 权限尚未全验；16KiB URL 预算仍是暂定边界。离线/Mock/桌面 Chromium 成功不能替代这些结论。
- 角色沉浸、启动时序与 vendor WS 方向继续按具体证据排查；不擅改 prompt/provider/预算。贺宁与 Hackathon 的真实模型短测由用户本人执行，不自动造推理流量。
- GitHub 投稿仍为独立研究/用户手动确认路线，不授权 OAuth/PAT、自动 PR、提交或假定仓库可公开；开发工作仍采用无 PR 的 worktree 集成流程。
- PR CI 隔离预览提案 `60d1d8` 待用户确认，不实施新 workflow/资源/权限；邀请码明确暂停，须用户重启；旧版本兼容 14 天/256MiB 方案被用户否决，不接 CI、不自动保留或删除线上资源。
- 视频生产已获独立专项授权，最新 v3/v5 指定清单又获入库授权；不扩展到旧 v1/v2、社交发布、购买或账号变更。历史研究、被否决方案及旧媒体许可边界保留在[完整日期归档](history/2026-10-30/README.md)与[既有档案](archive/README.md)。
