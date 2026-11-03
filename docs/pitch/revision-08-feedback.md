# v8：本轮反馈与明确决定映射

2026-11-03。保留V7冻结源与历史交付；本版14页＝13主讲＋1张Q&A占位，560秒主讲不变，原C封面与简洁C正文不变。以下记录本轮反馈及后续明确决定，非逐字引文。来源/验证另见[大纲](outline-v8.md)与[本轮交接](revision-08-handoff.md)；已只读核对制作源entries/notes及第7/11/14页PNG；已只读核对最终PPTX14页/14 notes、无external、receipt同hash及HTML14页边界；现场验收仍另记，不称实播或产品直连已部署通过。

| 项 | 反馈/最新决定 | 本版落实 | 事实与验证边界 |
| --- | --- | --- | --- |
| 1 | 架构按最新已批准直连方案表达 | 第7页将浏览器与Linx实时数据通路和gateway prepare/管理/分享职责分开，完整呈现已确认架构，不上实施/发布状态或旧relay对照 | 当前正式main仍旧relay；本局内存复用Device token是最新合同，不据旧status/per-open条目改回；未证生产发布/新真人语音/性能提升 |
| 2 | 工程“先设计”不限UI原型，也包括技术方案 | 第11页五阶段改为需求与约束→交互/技术设计→关键取舍确认→实现验证→审查集成；下方技术方案原文摘录真实渲染＋最终UI截图 | 引用11月1日WebMCP已完成设计/交接，图标“技术方案摘录”，不伪造文档、不称新UI实拍，不计入三天指标 |
| 3 | 用户明确删除原三张QA，不预设问题，只留一张Q&A | 第14页仅问答占位；删除旧三种时间/改稿保护/统计范围备页 | 不是更换三个猜测问题；定义仍在讲稿/备注，旧版历史不删除 |

工程摘录原件为固定main `3de59d67412366634211ecc79341741e28f35864` 的 `docs/design/webmcp-direct-edit-2026-11-01.md`：L15–34含工具合同及保存/并发边界，L3–5为关键选择与接受记录，L38–46为检查；该文“待CI/CD”是当时交接截点，后续上线另据同main `docs/project-plan.md` 的WebMCP行（随96c5fdd）。最终UI原图 `docs/design/webmcp-entry-polished.jpg` 含既有虚构样例。截图只证明对应材料，不替代测试/review/发布证据。

本轮2026-11-03已批准、正在推进合入的直连方案尚未成为正式线上实现；当前正式main仍为旧relay。介绍页发起一次POST prepare，薄gateway依据签名Cookie和namespace分配浏览器Device/Client身份，完成OTA与必要绑定/Agent归属检查，返回transport、Device/Client、Device token及期限。浏览器在本局内存持有并复用token；点击开始等待同一个pending prepare，再以原生WSS直连Linx `/v1/ws/`。URL带Device/Client，token在hello中，不放URL或长期保存。音频、STT/TTS与MCP角色上下文在浏览器和Linx之间传输，不经Worker；管理API key、签名secret和设备管理仍在gateway。静态资源、prepare及分享API仍由托管端提供，分享快照进入R2；游戏状态、判定、询问计时留浏览器。token足够一局是用户批准的工程假设，失败重试可重新prepare，新局重新准备，不引入复杂TTL状态机。relay仅为服务端显式运营回滚，非客户端自动fallback。

资料来源为直连专项 `/Users/nighca/.codex/worktrees/lie-formal-direct-integration/lie/docs/architecture.md` 与 `docs/reviews/voice-direct-formal-2026-11-03/README.md`，加本轮总协调正式回执。专项文档旧的status/per-open准备与期限条目已由本轮“一次intro prepare、本局复用、重试可重准备”的明确决定覆盖。不能把旧固定身份实验、无输入握手或已批准方案说成正式发布、真人语音通过或性能改善已证；等待同候选验收与合入/生产回执。
