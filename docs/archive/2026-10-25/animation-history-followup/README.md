# 动画专项历史材料补存

2026-10-25。仅历史设计/来源/评审证据归档；root已核验来源，按本地集成交付记录追溯。比对main `75a2e95`；本任务WT起点`83b2bead0e6c0bf5cb963ad5b26fba6860b12972`，不重放旧应用代码或改动新角色在制交付。source commit交付与本地集成分别记录，均不等于push或部署。

[动画owner盘点原文](owner-inventory.md.txt)来自`/private/tmp/lie-animation-history-inventory.md`、专项chat `01a16d44-aeea-7552-b184-5118072e75f3`。这是owner只读调查的**摘要报告原文**，不是所有原设计的原文。其baseline仍为b03c9d3，报告中的“未入main”不能覆盖后来的第二轮归档；此批已逐blob按75a2e95重新去重。

owner报告覆盖17个已存动画WT、42个相关refs及其中间文本，并明确不含任意全home/删除refs/全部旧chat。原文保留当时状态、来源、限制及两角色待handoff；不把它误称全机器无遗漏证明。

## 去重与补存结果

报告列9份历史原文，其中4份已在[第二轮历史归档](../history-followup/README.md)，本批不再复制：

- `docs/2d-animation-investigation.md`，b2a7b603版本。
- `docs/coral-animation-next.md`，c5e40f29和64127c1c两个版本。
- `docs/hunyuan-coral-animation.md`，7bab57b0版本。

本批补其余5份：coral-next两次生成prompt/引用/hash来源JSON，cartoon-2d、原画layered、早期程序Blender与混元四份研究README。三维研究仍是有限实验，不是正式3D路线或批量制作批准；当前正式边界见[动画契约](../../../animation/contract.md)。

另仅取3个小型证据：Blender与混元各一份`artifact-check.json`保留原结构数据，以及48,419字节原生`weight-failure.jpg`说明混元初轮权重失败。截图不作为最终成功姿势证据；没有新运行Blender、GLB检查或浏览器验收。root原研究文字保留的失败/未验限制不被此次文件存档消除。

不复制旧GLB、Blend、MP4、图层PNG或全部渲染。历史相对路径、Downloads/临时工程路径和复现命令仅表示原树上下文，不是archive内可执行入口。原source refs仍需保留，不授权删除或清理其源WT。mint/ochre新角色文档/来源仍随原作者正常交付，不在本批抢收。

## 原文与来源

[完整source manifest](source-manifest.json)保留Git blob、完整source SHA、日期、原path及SHA256。Markdown快照为`.md.txt`且原字节不改写；JSON/JPEG同样原样复制。

| 原始路径 | source | 存档 |
| --- | --- | --- |
| `design/coral-animation-next/sources.json` | `64127c1c` | [原文](snapshots/64127c1c/design/coral-animation-next/sources.json) |
| `spikes/cartoon-2d/README.md` | `b2a7b603` | [原文](snapshots/b2a7b603/spikes/cartoon-2d/README.md.txt) |
| `spikes/coral-layered-animation/README.md` | `bb9b031a` | [原文](snapshots/bb9b031a/spikes/coral-layered-animation/README.md.txt) |
| `spikes/coral-blender/README.md` | `368ff5d4` | [原文](snapshots/368ff5d4/spikes/coral-blender/README.md.txt) |
| `spikes/hunyuan-coral/README.md` | `7bab57b0` | [原文](snapshots/7bab57b0/spikes/hunyuan-coral/README.md.txt) |
| `spikes/coral-blender/artifact-check.json` | `368ff5d4` | [原文](snapshots/368ff5d4/spikes/coral-blender/artifact-check.json) |
| `spikes/hunyuan-coral/artifact-check.json` | `7bab57b0` | [原文](snapshots/7bab57b0/spikes/hunyuan-coral/artifact-check.json) |
| `spikes/hunyuan-coral/renders/weight-failure.jpg` | `7bab57b0` | [原文](snapshots/7bab57b0/spikes/hunyuan-coral/renders/weight-failure.jpg) |
| `/private/tmp/lie-animation-history-inventory.md` | `owner report` | [原文](owner-inventory.md.txt) |
