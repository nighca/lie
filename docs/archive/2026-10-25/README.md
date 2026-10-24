# 2026-10-25设计资料补存盘点

状态：归档交付，等待root review/本地集成；不会改变原方案批准状态。盘点基线`2982e6a77046d9f3c3744e529c08166149e3eddc`，日期按Asia/Shanghai。

## 范围与方法

只读盘点该基线的tracked `docs/`、`design/`，以及当次`git worktree list`列出的61个本项目工作树。按来源path＋Git blob去重，将各工作树HEAD的`.md`/`.txt`与基线完整Git历史对象比对；不是仅凭branch未push就判遗漏。共有146个非当前文本版本，其中绝大多数已在默认分支历史；发现32个不在该历史的版本，30个历史版本在本批补存，另2个mint在制文档留给owner交付。未改其他工作树、refs或服务，未扫描用户home/凭据文件。

这不是全机器、所有已删除chat/WT或所有中间commit的无遗漏证明；未读取历史HEAD之间每一个未合并commit，也未扫描任意忽略目录。后续作者仍须按规则交付这些范围中的最终设计。既有main原位设计和历史已入库，不重复复制。

## 本批补存

| 材料 | 来源/状态与边界 |
| --- | --- |
| [覆盖率准备方案](coverage-design-preparation.md) | 原owner `/private/tmp/lie-coverage-design-preparation.md`完整内容（仅去除末尾多余空行）；基线2982e6a。design-preparation/proposed，未实施、未采样、没有百分比。六workspace一次Vitest统计、Node脚本另报、SFC remap待验、PRIVATE snapshot badge/CIartifact仍是推荐，不代表批准。 |
| [有界分享真实IAB结果](share-browser-results.md) | 原Editor报告原字节，source0f73006；Unicode/16000/reload通过及16001/损坏错误，network捕获/跨browser/离线等未验；曾发现长正文横溢，后续已修，见[修复](../../history/2026-10-25/share-long-text-wrap.md)。[四图](#必要附件)保留。 |
| [早轮分享未完成记录](share-boundary-incomplete.md) | 原只读QA `/private/tmp/lie-share-boundary-qa-20261025/handoff.md`原字节；只打开缺内容页，CDP中断、owned tab清理未确认；无边界PASS。后来成功QA不抹掉此轮能力与清理边界。 |
| [sunny可见/合成visibility检查](sunny-visibility.md)与[观测](sunny-observations.json) | 原报告/JSON原字节；实际可见游戏单canvas，三轮iframe事件明确synthetic，真实hidden/restore仍未测。[模拟截图](evidence/sunny-iframe-simulation.jpg)不是正式视觉验收。 |
| 历史方案原文30份及3份来源JSON | 见[逐份清单](#历史原文清单)和[源manifest](source-manifest.json)，保留原字节、Git blob、SHA256、源commit/日期/路径，未重放源分支应用代码。 |

历史Markdown保存为`.md.txt`原文快照：不重写内部旧链接、批准语句或运行命令，避免把历史相对链接误当成当前可运行入口。prompts保持`.txt`。补存的三份coral来源JSON保留制作次数、原图哈希、引用和未采用尝试；内部资产路径同样只表示历史源树。旧二进制素材和运行原型仍由原source refs保留，本次不授权清理这些refs。

这些文本的具体来源文件可用manifest所列`git show <source_commit>:<source_path>`恢复；此批不复制整套旧图层/运行时/截图缓存，不承诺旧原型可在archive内播放。当前替代关系：coral研究→[正式契约](../../animation/contract.md)/[coral生产接入](../../animation/coral-game-integration.md)；调查v2/v3→[控制区实施](../../investigation-controls-implementation.md)；早期命名候选→[最新迁移计划](../../character-preset-migration-plan.md)（仍由迁移owner执行）；silver早期状态→[正式接入](../../animation/silver-bun-game-integration.md)。

## 必要附件

- [普通Unicode分享](evidence/lie-share-browser-normal.jpg)
- [16000与原横溢证据](evidence/lie-share-browser-16000.jpg)
- [16001长度错误](evidence/lie-share-browser-16001.jpg)
- [损坏gzip错误](evidence/lie-share-browser-damaged.jpg)
- [sunny合成iframe模拟](evidence/sunny-iframe-simulation.jpg)

截图均原生JPEG原样复制，约208KiB；不含凭据/认证header。测试fixture/HTML、生成包、缓存不作为proposal归档；原报告中的`/private/tmp`仍记录来源，不是新唯一证据。

## 已有持久摘要，不重复原日志

`/private/tmp/lie-combined-qa.md`存在；三案/8形象/品牌/Editor分享结论及限制已有[10月24日历史](../../history/2026-10-24/README.md)和[组合验收](../../history/2026-10-24/combined-ui-animation.md)，本次不重复其服务/会话日志。`/private/tmp/lie-rotation-preflight-2026-10-25.md`存在，是02:02只读运维盘点而非设计；批准/释放边界已在[前代快照](../../history/2026-10-25/coordinator-handoff-01a16e3d-d2f9-75e0-a09f-d39d5ab927dd.md)留存，不复制PID/监听全日志，也不让旧状态覆盖现状。指定临时文档全部找到，无missing声明。

## 尚待owner交付/确认

- **mint/ochre动画专项**：只读时mint WT `mint-puffs-animation/lie` HEAD `4c213f83f7ebdd498b2031ff005f7936393bf155`有未main的README/prompts两文档；ochre WT `ochre-freckles-animation/lie` HEAD `73ba1387c24762e48e78c003eef2421e53746a71`有dirty候选资源/工具。两者original base73ba138，在制完整设计/来源/QA由动画owner正常clean handoff，不能因已commit或本次归档就当已review。未复制dirty或替owner提交。
- **命名迁移owner**：`character-preset-migration-dawn/lie`基线2982e6a，实际dirty包含design/文档迁移；[迁移计划](../../character-preset-migration-plan.md)由其更新，未覆盖/搬动该任务文档。旧命名候选快照不批准其旧门禁或执行结果。
- **早期browser-architecture草稿归属待root确认**：`/private/tmp/lie-browser-architecture` HEAD `13aabaf46d9f8ec041e1ee431d5215daf652aee3`，tracked dirty `docs/deployment-options.md`、untracked `docs/validation.md`与main同主题但非同字节。前者更新为早期Cloudflare探针已验证状态，后者记录早期基础链路/未测产品边界；现行[部署比较](../../deployment-options.md)、[验证记录](../../validation.md)已有相关信息。未取得原owner对dirty材料的交付授权，只登记保留，未复制/commit/清理它们。草稿SHA256分别`7480a791ce654f558225e21c47251d874600c32b5fe511ab49d369ca01f1b519`、`ce287556f52a4c7d2b5ff2529c97003df120dde0ecb7b9bb93b02ed3fc31a652`。root应确认归属和必要差异，随后正规handoff/归档或明确说明已有摘要覆盖，再允许清理。

在制/待归属并不阻塞其他历史资料补存；用户要求“最终入库”作为持续交付规则生效，不能宣称本次把所有未完成材料都归档完。

## 历史原文清单

以下均为历史候选/研究/较早状态快照，入库不改变批准状态；每份source完整SHA及日期见manifest。

| 原始路径 | 来源commit | 归档副本 |
| --- | --- | --- |
| `design/appearances/README.md` | `21eadee` | [原文](snapshots/earlier-naming-candidate/design/appearances/README.md.txt) |
| `design/character-presets/README.md` | `21eadee` | [原文](snapshots/earlier-naming-candidate/design/character-presets/README.md.txt) |
| `docs/animation/contract.md` | `21eadee` | [原文](snapshots/earlier-naming-candidate/docs/animation/contract.md.txt) |
| `docs/animation/coral-game-integration.md` | `21eadee` | [原文](snapshots/earlier-naming-candidate/docs/animation/coral-game-integration.md.txt) |
| `docs/animation/production-workflow.md` | `21eadee` | [原文](snapshots/earlier-naming-candidate/docs/animation/production-workflow.md.txt) |
| `docs/architecture.md` | `21eadee` | [原文](snapshots/earlier-naming-candidate/docs/architecture.md.txt) |
| `design/coral-layered-animation-v2/README.md` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/README.md.txt) |
| `design/coral-layered-animation-v2/prompts/closed.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/prompts/closed.txt) |
| `design/coral-layered-animation-v2/prompts/head.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/prompts/head.txt) |
| `design/coral-layered-animation-v2/prompts/listen-fore.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/prompts/listen-fore.txt) |
| `design/coral-layered-animation-v2/prompts/listen-upper.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/prompts/listen-upper.txt) |
| `design/coral-layered-animation-v2/prompts/open.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/prompts/open.txt) |
| `design/coral-layered-animation-v2/prompts/speak-fore-cleanup-attempt.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/prompts/speak-fore-cleanup-attempt.txt) |
| `design/coral-layered-animation-v2/prompts/speak-fore.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation-v2/prompts/speak-fore.txt) |
| `design/coral-layered-animation/README.md` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/README.md.txt) |
| `design/coral-layered-animation/prompts/body-correction.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/body-correction.txt) |
| `design/coral-layered-animation/prompts/body.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/body.txt) |
| `design/coral-layered-animation/prompts/fore-left.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/fore-left.txt) |
| `design/coral-layered-animation/prompts/fore-right-alpha-correction.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/fore-right-alpha-correction.txt) |
| `design/coral-layered-animation/prompts/fore-right.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/fore-right.txt) |
| `design/coral-layered-animation/prompts/head.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/head.txt) |
| `design/coral-layered-animation/prompts/upper-left.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/upper-left.txt) |
| `design/coral-layered-animation/prompts/upper-right.txt` | `85b8f44` | [原文](snapshots/coral-research/design/coral-layered-animation/prompts/upper-right.txt) |
| `docs/coral-animation-next.md` | `85b8f44` | [原文](snapshots/coral-research/docs/coral-animation-next.md.txt) |
| `docs/coral-layered-animation-v2.md` | `85b8f44` | [原文](snapshots/coral-research/docs/coral-layered-animation-v2.md.txt) |
| `docs/coral-layered-animation.md` | `85b8f44` | [原文](snapshots/coral-research/docs/coral-layered-animation.md.txt) |
| `docs/coral-runtime-evaluation.md` | `0faa4df` | [原文](snapshots/coral-runtime-research/docs/coral-runtime-evaluation.md.txt) |
| `design/investigation-controls-v2/README.md` | `c7f1284` | [原文](snapshots/investigation-controls/design/investigation-controls-v2/README.md.txt) |
| `design/investigation-controls-v3/README.md` | `c7f1284` | [原文](snapshots/investigation-controls/design/investigation-controls-v3/README.md.txt) |
| `design/animation-candidates/silver-bun/README.md` | `97548ea` | [原文](snapshots/silver-earlier-status/design/animation-candidates/silver-bun/README.md.txt) |
| `design/coral-layered-animation/sources.json` | `85b8f44` | [历史来源JSON](snapshots/coral-research/design/coral-layered-animation/sources.json) |
| `design/coral-layered-animation-v2/sources.json` | `85b8f44` | [历史来源JSON](snapshots/coral-research/design/coral-layered-animation-v2/sources.json) |
| `design/coral-layered-animation-v2/reused-sources.json` | `85b8f44` | [历史来源JSON](snapshots/coral-research/design/coral-layered-animation-v2/reused-sources.json) |
