# 调查页历史设计与原始证据补档

采集日期：2026-10-25（Asia/Shanghai）。范围限本 chat 的调查页、品牌细节、移动端方案及两名子代理。此目录交主协调审查整合；不代表新增产品决策或要求恢复旧实现。

## 来源与去重

以 `75a2e9511bf798c9e2e7eab392ebef4807beada2` 的全部可达 Git 对象为去重基准。68 条选定来源中，45 条保留原始字节，12 条已经在 main 历史，11 条与本批其他原件相同。另列出 33 张未选取的普通执行截图及原始 Git 引用；未删除任何原件或分支。

[来源清单](source-manifest.json) 逐项记录来源提交、路径、日期、Git blob、SHA-256、字节数、历史批准状态及归档位置。`already_in_main_history` 指对象已可达，不保证当前 main 工作树仍以原路径展示；`covered_by` 给出已归档路径或对象引用。相同字节只保存一次，各方案的引用关系仍保留。

HTML、CSS、Vue、脚本、SVG 等源码附加 `.txt`，内容未改写，不作为新产品入口运行。原型依赖通过清单及 Git 提交重建，不保证单个快照目录能直接运行。图片按实际格式命名，未重绘或压缩；临时联系图只用于本次审查，不纳入归档。

## 方案索引与历史状态

| 分组 | 内容 | 历史状态 |
| --- | --- | --- |
| `voice-feedback` | 初期真实音量反馈的独立 fixture、模型、测试和桌面/窄屏图 | 技术与交互探索，不是全部视觉细节获批 |
| `controls-v1` | 第一轮调查操作区原型、状态模型及桌面/手机示例 | 初案，后续版本取代 |
| `controls-v2` | 第二轮双通道波形原型及两种屏宽示例 | 中间方案，不能据此恢复角色波形 |
| `controls-v3-initial` | v3 初始页面与样式 | 待反馈版本 |
| `brand-early` | 两笔细线品牌对照及 SVG | 用户认为不如原风格稿，后由描摹版本取代 |
| `controls-v3-approved` | v3 最终原型、原稿局部、描摹下划线与缩短间距示例 | 当时布局方向获用户认可；正常状态文案、角色波形等后来又被修改 |
| `mobile-v4-initial` | 窄屏对照的初始 frame 与样式 | 设计比较过程 |
| `mobile-v4-approved` | 紧凑人物区与连续记录区方案、对照页和脚本 | 用户认可紧凑方向；所存早期截图仍有后来删除的“当前人物” |

当前批准行为应查最新项目决策与实现，不从历史截图反推。特别是：用户后来要求只显示玩家输入；连通后静音也保留平波形；不显示正常等待/回答/等你开口文案。早期颜色、字体、底栏和角色标签也可能已经过后续调整。

## 临时证据与验证边界

- [Sunny 原始 QA 报告](evidence/sunny-native-report.md.txt) 和短桌面截图：保留 1280×720 下手部被舞台裁切的更正；原生隐藏/恢复没有验证，不能宣称通过。
- [CJK 原始测量](evidence/cjk-native-measurements.json)：同字体的浏览器 Range 数据，仅代表当时 IAB；不推断跨浏览器效果。
- 指认单人卡片修正前/后截图：保留发现比例问题与修复结果，后图为候选 `7dfbba6`，不是用户单独批准最终单人布局的证据。

已查看本批 15 张图片，内容为产品原型、局部品牌稿或测试案件画面，未发现凭据或个人账户界面。文本扫描未发现密钥、认证头或私有配置；原始来源没有被脱敏改写。

## Chat 与子代理回收说明

本次没有完整 chat 导出或用户原始标注附件的本地文件；不把重述或代理截图冒充用户原件。[Chat 回收说明](chat-recovery-notes.md) 明确区分摘要、批准记录及原始文件。

`source-manifest.json` 的 `child_agents` 记录 `real_audio_feedback` 与 `notices_and_reveal` 的原提交及全部改动 blob。两者仅交付实现，没有额外独立设计稿；所列 17 项改动的对象均已可达去重基准 main，未重复复制应用代码。前者旧工作树已不存在，提交仍可读取；后者工作树存在且本次只读检查为干净。未清理任何工作树。

## 已由主线保存，不重复复制

以下为检索路径，具体版本以 main 为准：

- `docs/archive/2026-10-25/history-followup/source-manifest.json`：第二轮 31 份历史文本，包括各轮 README 与提案。
- `docs/investigation-controls-implementation.md` 与 `docs/history/2026-10-24/investigation-input-feedback.md`：调查页落地与音量反馈。
- `docs/history/2026-10-24/ui-polish-acceptance.md`：首页、气泡、提示、结局分段等已实施批次。
- `docs/history/2026-10-25/home-flow-typography.md` 与 `docs/history/2026-10-25/accusation-fan-layout.md`：首页流程字样、指认扇形。
- `docs/cjk-numeric-spacing.md`、`design/brand/logo-easter-egg/README.md` 与 `design/brand/readme-hero.en.png`：数字间距、Logo 动效、英文首页图。
- `docs/pending-ui-feedback.md`：原 17 条用户反馈的集中记录；本地旧待办副本未重复归档，其“只记录”条件不能覆盖后来实施授权和已合入状态。

校验方法：归档字节逐项与来源 Git blob 或现存临时原件比较；校验 SHA-256、大小及 Git 对象 ID；解析全部 JSON（包括文本快照内 JSON）、核验内部 Markdown 链接、图片格式及完整 diff。仅文档归档，不新增产品代码或重复运行应用测试。
