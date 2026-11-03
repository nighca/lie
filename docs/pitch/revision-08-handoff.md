# V8：直连架构、交互与技术设计、Q&A占位交接

2026-11-03。承接冻结V7 `04c8eea2a05757e7d98275ff9617be94788f43ae`，按本轮三条PDF反馈及用户最新明确意见制作，处理见[映射](revision-08-feedback.md)，当前页序见[大纲](outline-v8.md)。原C方向不变，完整视觉/现场彩排仍待用户；源归档不代表视觉接受。

WT `/Users/nighca/.codex/worktrees/e6ff/lie`，branch `codex/lie-roadshow-deck`，本批parent为04c8eea，追加SHA由消息提供。V7已handed-off冻结，未改旧源；若V7尚未main，本批依赖须先review按序包含一次，不重放旧提交。专项未main/push/部署。

## 本轮范围

14页＝13主讲＋1张Q&A，560秒不变。删掉原3张预设问题页，只保留Q&A占位；End停第13，B到第14。用户明确不猜问题，不是再改三个问题标题。旧v7及更早源/产物保留。

第7完整重绘已批准直连架构：五前端模块及静态内容保留，浏览器↔Linx原生WSS传音频/转写/MCP上下文；Cloudflare做prepare/DeviceClient/凭据管理与分享API→R2。管理密钥留服务端，本局Device token仅内存。介绍页prepare一次、本局复用、手动重试可重prepare，是总协调本轮明确最新合同，覆盖专项旧status/per-open fresh。用户经总协调进一步明确：图直接作为完成架构，不上“正在实现”等状态标签、旧relay对照或迁移箭头；已遵循。内部发布身份仍按事实保留，不能把PPT当直连上线/真人或性能验证。根协调当时确认main仍3de59旧relay，必须同候选preview用户验收再main发布；本专项无权改变门禁。详细源记见[evidence](evidence/revision-08/voice-direct-brief.md)。

第11设计流程明确需求与约束→交互/技术设计→确认关键取舍→实现验证→审查集成，设计不是只有UI原型。左图从固定main3de59的WebMCP直接编辑方案原文渲染工具合同与保存段落，不新编假文档或伪装成浏览器截图；右保留原实际验收编辑器入口。原文byte精确核对，原件/选段/转换/hash见[evidence来源](evidence/revision-08/README.md)。案例11月1日，与10.23–25指标分开。没有新AI插画、视频、语音或用户稿操作。

## 最终本地产物

目录 `/Users/nighca/.codex/worktrees/e6ff/lie/tmp/pitch/revision-08/output/`：

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| LIE-roadshow-v8.html | 32551262 | `b739f41644b82e231f4443279fa7565b62e71f833294825b628970073a4e124c` |
| LIE-roadshow-v8.pdf | 6714964 | `c45b0826d043e83cf737ef96f4b9a1e74eb9901d7009b80ab8b8fef0fd4ef158` |
| LIE-roadshow-v8.pptx | 9243986 | `36fec79bf6e7817c50cf34e9b48c23394d8c2f6e2fcbbd225af81957ad563eec` |
| LIE-voice-backup-28.5s.mp4 | 2441725 | `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e` |

大产物及媒体均ignored本地，不Git/上传；PPTX正文/图原生可编辑、截图与技术文档摘录为位图，无内嵌视频；HTML仍嵌原横v3/28.5秒实录；PDF14页960×540pt静态图片，文字不可检索。Hiragino Sans GB为设计字体，跨机需检查替换。

## 实际检查

- 7/11/14主代理与独立子代理均实际阅最终PNG；修过技术截图与caption间距，最终无重叠/裁切。其余11页与已审v7 PNG逐字节相同，source/current依赖未变。PDF14页已核，Poppler复渲7/11/14，主代理实际阅对应三图。
- 最终PPTX结构/布局/字体/import0finding/0warning，receipt `tmp/pitch/revision-08/build/validation-final-v8.json` 与最终SHA一致；独立实核14 slides/14 notes、27媒体、无external、ZIP完整。没有原生PowerPoint运行验收。
- HTML14图/14标题、13主讲停留、B第14Q&A/End第13、原R/V第2和离页停播/嵌入媒体hash、无fetch/mic/WebSocket逻辑pass。旧QA内容未加载。预算560秒不是彩排时长。
- 主代理实际review子代理6文档变更及完整新制作源；三份逐页表同entries/notes13条标题/时间核一致，原技术MD同固定Git byte一致。三天785/97/>5277定义与66/97覆盖不变，无重查私人会话。current资料指向v8，旧600秒relay/CPU只作历史，不用作新主讲合同。
- 本轮无服务/browser/provider/mic/自动化/用户稿操作，无待停或未知新服务；此前IAB拒file://未绕过。未浏览器实播/全屏/扬声器或原生PowerPoint彩排，也未验证新直连产品。只做必要文件检查，不跑无关应用测试。
- 命名文件提交，diff-check与必要current链接检查通过。原技术Markdown副本保持原相对链接/历史状态，非当前目录导航，不视为新设计批准或最新上线记录。

交root按正常队列review、串行归档，保持V7先序依赖；大产物只供本机使用，后续用户修改另新commit协调，不为回执新增报告循环部署。
