# V9：六条版面与措辞反馈交接

2026-11-03。承接冻结V8 `3942d2b4a4f4ba7efe1f2afb7962133ecc066362`，逐项落实用户六条PDF意见，见[反馈映射](revision-09-feedback.md)与[当前大纲](outline-v9.md)。仍14页＝13主讲＋1张Q&A占位，560秒不变；原C方向保持，完整视觉与现场实播仍待用户验收。资料归档不代替视觉接受。

WT `/Users/nighca/.codex/worktrees/e6ff/lie`，branch `codex/lie-roadshow-deck`；本批parent为3942d2b，追加SHA随消息提供。旧V7/V8已handed-off冻结，没改旧源；若尚未main，依赖04c8eea→3942d2b须先审按序包含一次，不重放更早已main版本。专项无main/push/部署。

## 六条处理

1. 第7移除内容资源节点和底部总结句；Browser五模块移到左侧，Cloudflare与R2同排，Linx单独下排；准备凭据、设备管理、分享API与原生WSS使用短线分别连接，保留既有直连职责，无状态标签/旧relay对照。
2. 第8上屏标题精确“自研轻量骨骼动画”。
3. 全部可编辑主标题仅删除末尾句号；问号/正文标点/封面图片不变。
4. 第9长期适配及说明置用户Agent下方；轻量实现及说明置LIE编辑器下方。
5. 第10标题、节点、notes与当前讲稿统一“协调 Agent”，Worker和30分钟循环/设计/派工/审查/串行集成机制不变。历史文件保留当时Router称谓。
6. 第12删最下可核记录整句，保留785/97/>5277与97拆分；完整66/97覆盖、316643739ms、工具等待并行与31缺失不估继续在notes/内部证据，不加回画面、不新估算或查询私人记录。严格下界本身有已核记录支持。

本轮仅使用V8及既有证据，不重新查产品部署/直连或私人会话，不把旧资料状态当新验收。技术文档摘录/产品与人物图片/两段视频继续原字节；没有新图片或音视频素材。current文档和project-highlights同步上述称谓及展示取舍，原统计证据不覆写。

## 最终本地文件

目录 `/Users/nighca/.codex/worktrees/e6ff/lie/tmp/pitch/revision-09/output/`：

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| LIE-roadshow-v9.html | 32443909 | `07c6347f28266f18956aade18778aad3d36576fce61aa5be838b670d4f050b35` |
| LIE-roadshow-v9.pdf | 6648886 | `2d7024da0cb9a0ff7ab26cd2a1b7a9c57757ae592de5ef4a342bbdc69648b947` |
| LIE-roadshow-v9.pptx | 9243130 | `823959ca1f923fff0ea09d3fd93193fd04a7bc3bac816473ef20ad93b25b7758` |
| LIE-voice-backup-28.5s.mp4 | 2441725 | `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e` |

大文件均ignored本地，无Git/上传；PPTX原生正文/图可编辑，真实截图/文档摘录为位图，无内嵌视频；HTML含原媒体，PDF静态图片页不可检索/无视频。Hiragino Sans GB仍可能跨机替换。

## 实际review与检查

- 主代理实际阅10张改动PNG（3–12），其余1/2/13/14与V8 PNG逐字节一致；独立子代理实际阅全部14页，重点7/8/9/10/12无裁切、重叠或错误对齐。PDF14页960×540，Poppler复渲7/9/12，主代理实际阅三图。
- 最终PPTX结构/布局/字体/import0finding/0warning；receipt `tmp/pitch/revision-09/build/validation-final-v9.json`与最终SHA一致。独立实核14 slides/14 notes、27媒体、ZIP完整/无external；主代理再实际查XML的11个原生主标题无末句号，7无资源节点/删句、10协调Agent无Router、12screen无可核记录/66但notes保留66/97。
- HTML mockDOM14图/14标题、13主讲/End第13/B第14占位、R/V第2与离页停播、嵌入两MP4hash和无网络API检查通过；新metadata第8/10准确。元数据空格调整后同源export-only，未改变PNG。
- 主代理读制作源及子代理6文档实际diff/新大纲/反馈，三份13行时间表与entries完全同标题/秒数，合计560秒。source和当前说明中的旧Router已换称谓，历史不倒写。diff-check与当前链接检查通过。
- 无新服务/browser/provider/mic/自动化/用户稿操作，无待停或未知新服务。此前IAB拒file://未绕过；未浏览器全屏/扬声器/原生PowerPoint或讲者实际彩排，不把文件验证称现场实播。不跑无关应用测试。

按root正常队列review、串行归档，不移动正在验收的产品基线；后续用户改动另新commit协调，勿amend冻结手递。无需为回执新增报告循环部署。
