# V11：角色状态、JSON实例与文档产出

2026-11-03。承接冻结V10 `7afda03c99c0c17af9eb81c93c9b41969eae2b76`；本批追加提交，旧源/交接不amend。worktree `/Users/nighca/.codex/worktrees/e6ff/lie`，branch `codex/lie-roadshow-deck`。用户授权本轮六条改动，详见[反馈映射](revision-11-feedback.md)，新视觉仍待用户查看。

16页＝15主讲＋1张Q&A，560秒；原规格页30秒拆为概念20秒＋JSON10秒，媒体及演示预算不变。

## 检查及证据边界

- 主代理实际阅6–16所有变化PNG；1–5与V10逐字节一致。PDF实际Poppler复渲6–9/14，主代理阅6/8/9/14；角色未裁错/重叠，JSON底部是明确视窗裁切而非改写数据，字节来源见source元数据。第7只更换标签，布局保持已批准单图。
- 最终PPTX16slides/16notes、ZIP CRC通过、无external关系，finalizer结构/布局/字体0finding/0warning，first-party import通过，receipt与文件SHA一致。仅文件检查，不代表PowerPoint原生运行或声音/全屏彩排。
- HTML mockDOM16图/16标题、15主讲，End/下一步停第15邀请，B到第16Q&A，R/V只第2，离页停视频；旧两媒体hash一致，无网络/mic API。PDF16页均960×540。
- 372口径：固定bb5fe51三天可达窗口，首次A入库且f8c4e2b5截止仍在的Markdown386路径/375正文；排除两纯导航、一机器摘要后383路径/372原字节唯一正文。包含设计71/调研35/实现33/测试评审验收发布112/协作交接历史64/产品模块说明57，非独立主题或设计数；额外txt快照不纳主讲。主代理独立运行另一份脚本核386/375→383/372并实际读3排除正文；完整清单与复现脚本见新增工程证据。原97/>5277不重新查询私人记录或改口径。
- 独立内容代理实际阅6/7/8/9/14，未见阻塞；主代理实际review五文档diff，清理陈旧页码/引擎对比措辞与旧指标备稿，三份页序表同entries。证据Markdown脚本主代理提取实际运行，分类/372/清单hash均一致。
- 无应用代码修改、无新服务/browser/mic/provider/自动化/账户或用户草稿操作，无待停服务，不跑无关应用套件；专项无main/push/部署。既有file://限制不绕过。

## 本地产物身份

路径`tmp/pitch/revision-11/output/`，大文件ignored不入Git。HTML自含旧媒体，PDF静态页面，PPTX正文/图可编辑而角色/截图为图片。源码、JSON视窗生成器及五张轻量阅图入Git，足以保留设计与来源。

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| LIE-roadshow-v11.pptx | 23510713 | `9a54e8d3baebf3af3b5cf7cdd53543027655d3a66b88ba878db1285862c9234b` |
| LIE-voice-backup-28.5s.mp4 | 2441725 | `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e` |
| LIE-roadshow-v11.pdf | 8175498 | `77841fc3e8286af4cd248e1d32606d1c560e92720131f80f093fb57d4c16102a` |
| LIE-roadshow-v11.html | 34283007 | `3bcfdd6df4a8a7e4645735e05c81110f270b5cb36c457bcf990e1c39f6a1d6f1` |
