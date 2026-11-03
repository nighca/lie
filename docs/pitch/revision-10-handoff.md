# V10：平台、开放规格与产出数据

2026-11-03。用户已确认架构单图布局，明确允许更新全稿，并要求优化标题。新反馈见[映射](revision-10-feedback.md)。本轮15页（14主讲＋1张Q&A），560秒；保留C方向。新角色与规格页仍待用户查看整体效果。

任务worktree `/Users/nighca/.codex/worktrees/e6ff/lie`，branch `codex/lie-roadshow-deck`，本批base `5f5f3fa`（仅已归档的待确认单图提案），其parent为直连发布文档 `61508c1`。完整顺序承接冻结V7/V8/V9及发布文档，交接SHA在消息中提供，不amend旧交接。不操作main、不push/部署。

## 产物与验证

交付目录 `tmp/pitch/revision-10/output/`；字节身份见下表。HTML自含既有实录与宣传片，PDF静态页面，PPTX正文与技术图可编辑、截图及原画为位图。素材使用仓库正式八角色，不重新生成。

- 主代理实际检查新增/改动5/6/7/8/13及后移9/10/11/12/14/15的PNG；1–4与V9完全同hash，保留此前视觉验收边界。本轮PDF Poppler实际复渲并阅6/7/8/13，未发现裁切或文字/连接重叠。
- 最终PPTX finalizer结构/字体/布局/first-party import通过，0 findings/0 warnings。实际ZIP15 slides/15 notes、无external关系、CRC通过。首轮import因缺runtime env未执行，补正确RUNTIME_NODE_MODULES后重跑通过，未跳过校验。
- PDF15页，均960×540。HTML mockDOM15图/15标题、14主讲，结束邀请停第14页/B到第15页Q&A，R/V仍只第2页、换页停播；媒体hash与旧版相同，无麦克风/网络API。不是浏览器/全屏/音响/原生PowerPoint彩排。
- 主代理独立统计固定bb5fe51的三天committer窗口785提交，截止f8c4e2b5，设计主文档19条路径一致。统计口径完整保留于备注/工程产出证据，未查新私人会话，原97与>5277证据不重写。
- 独立内容代理实阅5/6/7/8/13无阻塞；主代理实际review六文档diff并修正旧页码，三份14行时间表与entries逐项一致。证据Markdown代码块由主代理提取运行，785/19/19唯一正文/cutoff/清单hash均一致。
- 未新起服务、浏览器、provider、mic、自动化或账户操作，无待停服务。无应用代码变动，不跑无关应用测试。既有file://浏览器限制未绕过。

## 交付哈希

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| LIE-roadshow-v10.pptx | 18826565 | `3343dbbc9df32bb89b5addb44173083500350b8542923b2620f0cb75bf51f7c9` |
| LIE-voice-backup-28.5s.mp4 | 2441725 | `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e` |
| LIE-roadshow-v10.pdf | 7854145 | `facef354fa0b8435b7cae4bbe947d18c816994ff67623937fae0406eeec0cc9b` |
| LIE-roadshow-v10.html | 33730813 | `d397637900e2ccedb54867499f8ff09f429c4db9523a52e379e8de6ce6581297` |

大文件只在本地ignored目录，不上传Git。源码与五张轻量阅图在仓库，按既有单一集成队列交总协调审查。
