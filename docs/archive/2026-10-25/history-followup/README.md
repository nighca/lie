# 历史设计补存：第二轮

2026-10-25，归档研究交付；等待root review/本地集成。检查基线main `b03c9d3`；本批任务工作树起点`c43ddf93364320e0dc5f3d7d62d47ef75a9b8fc6`。不会重写前批归档、原作者文件或历史批准状态。

## 本轮新增范围

沿[首轮盘点](../README.md)，补查当前Git refs可达、尚不在main历史的**中间提交**，不再局限各worktree HEAD。`git rev-list --all --not b03c9d3 -- docs design`得到506个相关提交；逐提交检查`.md`/`.txt`变更，按Git blob去重并排除main完整历史已有对象（含首轮30份文本/3份来源JSON）。发现54个新文本对象：23个属于当前命名迁移/mint/ochre交付，由其owner负责；本批补存另31个历史版本。

其中包括此前缺失的宣传视频工具链研究、2D技术选型、混元3D实验、编辑器交互与修订、语音反馈、对话页规格、最早调查控制区提案、音色候选，以及后续迭代版本。原文逐字节保存为`.md.txt`/`.txt`快照；不重放含应用代码的源提交，不使旧原型变为当前执行稿。完整source commit、原path/blob、日期及SHA256见[source manifest](source-manifest.json)。

| 主题 | 本批历史材料与现行关系 |
| --- | --- |
| 宣传视频 | `promo-video-production-research.md`只是制作方法/工具依赖研究，仍未授权脚本/分镜/录制/媒体生成/制作；旧版本和许可资料不代表今天重新核验或最终路线批准。现行门禁见[计划](../../../project-plan.md#保留的门禁与外部依赖)。 |
| 动画探索 | `2d-animation-investigation.md`、`hunyuan-coral-animation.md`及coral中间修订，是已过阶段的有限研究/样片，非正式3D替换决定；当前2D播放器与资产边界见[契约](../../../animation/contract.md)。 |
| 编辑器/投稿 | 三版`editor-ux-proposal.md`和GitHub预填验证/投稿提案，是设计演进；现行见[编辑器实施](../../../game-editor-implementation.md)及[投稿方案](../../../editor-official-submission-proposal.md)，PRIVATE/权限门禁不变。 |
| 调查/对话 | controls最早提案、v3多版及mobile-v4、conversation规格是历史选项/迭代，不用旧双波形/状态文案覆盖现行[控制区实施](../../../investigation-controls-implementation.md)与[当前确认](../../../project-plan.md#已确认的产品与技术约定)。 |
| 语音/验证 | 音色选项、voice-feedback及旧realtime验证保留当时推荐和未验限制；当前[音色接入](../../../expanded-preset-voices.md)、[转写调优](../../../transcript-experience-tuning.md)、[真人边界](../../../realtime-voice-validation.md)优先。 |

本批只保设计文字，不运行旧命令/端口，不复制旧GLB、渲染MP4、截图/原型缓存。它们在原文中的相对路径或`/private/tmp`/Downloads路径只是历史出处，不能被当成archive内有效链接或可重放工程保证。旧source refs继续保留；未获得清理任何源工作树、原始模型或refs的许可。

## 归档chat定向核对

只筛归档列表中cwd为本LIE仓库的条目（projectId可能为null）；没有读取其他项目chat内容，也未创建新chat。

| 归档chat原名与ID | 定向读取范围与结果 |
| --- | --- |
| LIE 主协调 · 10月25日夜间接任 — `01a16f33-082b-78b2-bb32-b6f49fb4850a` | read_thread返回全部9turn、hasMore=false；设计相关内容为共享边界/动画QA和交接，分别已由首轮报告与历史记录保留，未发现独有chat-only设计原文。 |
| 主协调 — `01a16e3d-d2f9-75e0-a09f-d39d5ab927dd` | 读取最近30turn，至`01a16e64-4624-7203-b4bd-2e0f116332cc`，仍hasMore；结果页被指认对象、主题配色待办、启动调查、Logo/README等均有原位文档/计划，不重复存执行进度。例：turn `01a16eb0-4ac8-7290-9878-6ee638df026f`的结果页选择与[结果提案](../../../result-character-states-proposal.md)对应。 |
| Lie Game — `01a1677a-5eff-7f22-87c6-d2c382569aee` | 读取最近20turn，至`01a16d88-2856-7a40-8071-8afa847c6a39`，仍hasMore；主要是已入库调查/Editor/动画集成及命名候选review，未发现独有chat-only实质方案。更早设计优先通过完整refs中间文本审计补存，不逐turn全量扫描延迟这一批交付。 |
| Set up Cloudflare agent — `01a167b6-8fa6-7eb0-89b2-1a621f57b802` | 归档列表可见的本项目setup条目；未读其内容，避免把安装/认证操作日志误当设计。 |

上述是定向核对范围，不声称所有chat/子agent每条消息均已全文检索。没有将工具summary伪装成设计原文，也不把旧工具侧“原因不可见”覆盖用户后来明确的待审批说明。当前三个专项及其子agent的剩余材料由root直接向owner收取，再按source path/blob去重，属于下一个完整handoff；本批不碰其archive-inbox或在制文件。

## browser-architecture两份旧dirty的实质映射

只读检查`/private/tmp/lie-browser-architecture`，未改动或代提交。两份原字节仍不在main历史，哈希与首轮登记一致：

| 旧文件/对象 | 默认分支已有的实质内容 |
| --- | --- |
| `docs/deployment-options.md`，blob `4e36c78be8a04877632b2266d99046a8d5d1b0e1`，SHA256 `7480a791ce654f558225e21c47251d874600c32b5fe511ab49d369ca01f1b519` | 原base文档blob `30be893f7d8f9ffaed827452525481064d969af4`已在main历史，保留Workers/Vercel/纯静态比较、托管权威状态/DO后置、Opus解码取舍。dirty增量主要是选择浏览器状态＋薄Worker、探针已验证、端侧MCP和PCM实测：已由当前[架构](../../../architecture.md)、[部署记录](../../../deployment-options.md)、[验证记录](../../../validation.md)覆盖；`7868226dd52dc80a56fbde5dfe350f1a172eb9a7`两记录亦在main历史。未发现需从dirty抢救的独有设计决定。 |
| untracked `docs/validation.md`，blob `7dfb27b0780baeaa3326a74da99d4aadf096710a`，SHA256 `ce287556f52a4c7d2b5ff2529c97003df120dde0ecb7b9bb93b02ed3fc31a652` | 旧探针HTML/JSON/WS/绑定/MCP/TTS、79帧50560字节、2.49/7.78/9.40秒单样本、尚未验证浏览器听感/真人ASR/多用户等内容，均在[验证记录](../../../validation.md)及其main历史已有，且后来补齐清理与后续验证状态。旧文“清理结果待更新”不是当前状态。未发现独有新方案。 |

结论仅是**实质设计已有持久覆盖**，不是原字节已归档或该工作树可清理。原owner仍未提供clean交付，保留原文件/工作树；若要求保留这两份草稿的完整原字节或清理该WT，root需先确认归属后取得正规handoff。

## 保留的范围限制与下一批

- 三专项在制/待交付、命名迁移79b55031等23对象未取；不把已commit误当已review。
- 已删除/不可达refs、未入库且无已知线索的任意忽略目录/临时材料、旧chat未读取部分不在本次无遗漏证明范围。root收各owner batch后继续补存；不得用“本轮完成”代替持续入库规则。
- 纯文本归档仅运行文档hash、JSON、敏感值/链接/whitespace核对；未重新运行应用全套测试、使用浏览器/麦克风/真实provider或改服务。

## 本批31份原文

同路径的不同blob为真实迭代版本，按来源commit分目录；前轮已补存对象不重复。

| 源路径 | 源commit | 原文快照 |
| --- | --- | --- |
| `design/investigation-mobile-v4/README.md` | `6da37877` | [原文](snapshots/6da37877/design/investigation-mobile-v4/README.md.txt) |
| `design/investigation-mobile-v4/README.md` | `f4fc3aa8` | [原文](snapshots/f4fc3aa8/design/investigation-mobile-v4/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `1d9ee768` | [原文](snapshots/1d9ee768/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `151842d6` | [原文](snapshots/151842d6/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `84b627c3` | [原文](snapshots/84b627c3/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `cf371a5a` | [原文](snapshots/cf371a5a/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `d34a1343` | [原文](snapshots/d34a1343/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `c99baa99` | [原文](snapshots/c99baa99/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `4d63515b` | [原文](snapshots/4d63515b/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `6c7333bf` | [原文](snapshots/6c7333bf/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `fd44c80d` | [原文](snapshots/fd44c80d/design/investigation-controls-v3/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `87205d7d` | [原文](snapshots/87205d7d/design/investigation-controls-v3/README.md.txt) |
| `docs/coral-animation-next.md` | `c5e40f29` | [原文](snapshots/c5e40f29/docs/coral-animation-next.md.txt) |
| `docs/coral-animation-next.md` | `64127c1c` | [原文](snapshots/64127c1c/docs/coral-animation-next.md.txt) |
| `docs/architecture.md` | `251bb8f7` | [原文](snapshots/251bb8f7/docs/architecture.md.txt) |
| `design/github-prefill-verification/README.md` | `e94fdd27` | [原文](snapshots/e94fdd27/design/github-prefill-verification/README.md.txt) |
| `docs/editor-official-submission-proposal.md` | `e94fdd27` | [原文](snapshots/e94fdd27/docs/editor-official-submission-proposal.md.txt) |
| `design/investigation-controls/README.md` | `51776c8a` | [原文](snapshots/51776c8a/design/investigation-controls/README.md.txt) |
| `docs/investigation-controls-proposal.md` | `51776c8a` | [原文](snapshots/51776c8a/docs/investigation-controls-proposal.md.txt) |
| `docs/editor-ux-proposal.md` | `041c74a4` | [原文](snapshots/041c74a4/docs/editor-ux-proposal.md.txt) |
| `docs/editor-ux-proposal.md` | `36ff3b3a` | [原文](snapshots/36ff3b3a/docs/editor-ux-proposal.md.txt) |
| `docs/voice-feedback-proposal.md` | `20eb7431` | [原文](snapshots/20eb7431/docs/voice-feedback-proposal.md.txt) |
| `docs/editor-ux-proposal.md` | `fcb084f7` | [原文](snapshots/fcb084f7/docs/editor-ux-proposal.md.txt) |
| `docs/hunyuan-coral-animation.md` | `7bab57b0` | [原文](snapshots/7bab57b0/docs/hunyuan-coral-animation.md.txt) |
| `docs/2d-animation-investigation.md` | `b2a7b603` | [原文](snapshots/b2a7b603/docs/2d-animation-investigation.md.txt) |
| `docs/expanded-preset-voice-options.md` | `03ce42bf` | [原文](snapshots/03ce42bf/docs/expanded-preset-voice-options.md.txt) |
| `docs/expanded-preset-voice-options.md` | `e2f43910` | [原文](snapshots/e2f43910/docs/expanded-preset-voice-options.md.txt) |
| `docs/promo-video-production-research.md` | `9cf490af` | [原文](snapshots/9cf490af/docs/promo-video-production-research.md.txt) |
| `design/conversation-refined/README.md` | `3e8b665f` | [原文](snapshots/3e8b665f/design/conversation-refined/README.md.txt) |
| `docs/conversation-design-spec.md` | `3e8b665f` | [原文](snapshots/3e8b665f/docs/conversation-design-spec.md.txt) |
| `docs/realtime-voice-validation.md` | `006e39c5` | [原文](snapshots/006e39c5/docs/realtime-voice-validation.md.txt) |
