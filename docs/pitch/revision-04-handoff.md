# 正式路演 v4 制作交接

2026-11-02。用户明确确认整体产品/技术/工程骨架与C正文＋B开场/转场，补充正式logo、自研骨骼动画规格和引擎、Router–Worker/设计先行/可核数据，WebMCP放技术最后。制作前双门禁已解除；本完整视觉稿仍待用户最终验收，归档/集成不代替验收。

WT `/Users/nighca/.codex/worktrees/e6ff/lie`；branch `codex/lie-roadshow-deck`。原app base `a8be75823ceb67966390b5534d725a3a8bf1505b`，本批parent `7759e8cc1a7b6d4c722046c57f3da9570e1b1672`。旧v1–v3与v4提案提交均已由root集成，不重放。本批唯一追加SHA由handoff消息提供；未自行main/push/deploy。

## 变更范围

仅docs/hackathon/project-highlights.md和docs/pitch/**。新增独立v4 native源/build/package/check/finalize脚本、聚合工程证据、四张必要概念插画JPEG及精确提示词/来源说明；同步当前大纲/制作简报/内容备稿/放映指南/视觉选择状态。旧v3制作脚本、v1–v3大产物、原图/视频不覆盖。生成大原PNG、全部新HTML/PDF/PPTX仅ignored本地，没有上传或入Git。

17页＝12主讲＋5备页，560秒＝产品280/技术140/工程120/开收20；含江苏90秒现场语音和65秒创作页中的45秒操作。技术7架构/8自研骨骼/9WebMCP，工程10Router和指标/11设计先行资产闭环；每页正式logo源自仓库SVG。B落在开场/现场转入，C承载正文与技术工程图解。三图是概念解释而非假截图，主体文字/指标/布局原生可编辑，图解位图标签不可逐元素编辑。二维码本版未采用，保留清晰域名。

工程数字冻结：main bb5fe51可达952 commits（含docs/tests，squash/cherry-pick边界保留）；本机2026-11-02 20:54元数据精确项目筛选33顶层Chat、142显式spawn子代理会话，排除1342审批，非人数/并发/有效工时。主代理实际独立重跑Git计数与文档只读aggregate脚本，得到同值；未读取私密正文或导出数据库。无可靠有效工时或效率倍数。

## 本地交付

目录 `/Users/nighca/.codex/worktrees/e6ff/lie/tmp/pitch/revision-04/output/`：

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| LIE-roadshow-v4.html | 37942156 | `39c214389c516672822f09c2d2d49f83c7a8cbd99735dc338ad0a5af4d8f5530` |
| LIE-roadshow-v4.pdf | 12591860 | `29aa0ef684fe9c4f9b0be75956b3865dcb21bf81ce9d2fcf2d3dcccfbc6212a1` |
| LIE-roadshow-v4.pptx | 16975252 | `ae3849af3f3967d7536add3a611c2afa1150cb542c53dee892f96992190ac2e3` |
| LIE-voice-backup-28.5s.mp4 | 2441725 | `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e` |

备用纪念章28.5秒实录与历史横v3 53.8秒宣传片字节保持，片中历史UI与声音边界保留；不自动替换最新公开漫画片。前者真实问答原声，后者只有BGM/音效，无本轮主观听审。

## 实际审查与验证

- @oai/artifact-tool全源同进程构建17页，PNG1920×1080，560秒；不存在独立加载JSON丢媒体。最终native包CRC/完整性/布局/字体策略/第一方导入均通过，finding0/warning0；17页、17notes、37嵌入媒体，无外部rels。字体Hiragino Sans GB，未验证原生PowerPoint字体渲染。
- 主代理实际看17页，修正封面文字与图片相碰、UI页信息密度、错误临时案名（已核正式《这真是今天做的吗》）、图注双向语音。独立子代理实际看全部17页/四脚本与ZIP/HTML，未发现阻塞。其一项备注精度反馈已修：中继600秒从relay创建起，含后续音频/权限准备；介绍页HTTP prepare在此之前。
- 反馈后的全源重建；最后一次仅修正notes原件措辞，使用LIE_EXPORT_ONLY重建native（仍从所有图片源重新装配），PNG未变。旧native及receipt保留build/pre-note-precision*，最终身份只取表中与validation-final-review.json。
- PDF17页960×540pt，pdftoppm复渲7–10，主代理实际查看7/10；全部其他页使用同一已阅PNG嵌入。HTML mockDOM17图/2视频hash、停播、主讲第12页边界、问答和技术页顺序通过，无fetch/WS/micAPI。PDF为静态图片，文字不可检索；PPTX无视频，HTML内嵌视频。
- 应用内浏览器此前拒绝file://，本轮没有绕过、换浏览器或开服务；没有实际浏览器放映/全屏/扬声器主观验收，也未原生PowerPoint运行。演讲者尚需手动实播与彩排，560秒是预算。
- 新素材由内置image_gen制作，提示词与JPEG可复现追溯；它不构成游戏模型/语音调用。本轮无应用修改/测试、生产浏览器/provider/mic/用户稿访问、服务启动或待关闭消费者。只跑文档/产物适用检查。

本批轻量文件全部review并named提交后交root持唯一turn按正常流程归档；工作区应clean。root负责实际review/集成/普通push，用户继续在本Chat验收完整稿。
