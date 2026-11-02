# v5：统一C方向交接

2026-11-02。用户最新明确决定：“整体风格，我后悔了……统一采用……C方向……不要糅合B的页面”。覆盖此前C正文+B开场/转场。A/B只保留历史，最新正式稿只C；三部分内容、12主讲+5备页/560秒、固定统计与媒体安排不变。整稿最终视觉/真实放映仍待用户验收。

WT `/Users/nighca/.codex/worktrees/e6ff/lie`、branch `codex/lie-roadshow-deck`。本批parent `18b0817c65c8526988796eb8b35dab9ed119ca76`，追加SHA见消息；原app base仍a8be758。本批依赖18b源码与C图解，root若尚未集成18b需先审并按序包含一次；更早已main提交勿重放。专项未动main/push。

## 实际变更

新增独立v5 build/package/check/finalize源码，不改已交18b。第1封面与第3现场切页改为奶白底、大字阶、正式原人物/黄色标点的C构图，正式logo仍源自SVG；v5源码不加载B漫画背景。全部17页逐字节比对，**只1/3变化，其余15页PNG字节一致**，复用已实际全17页审查；主代理实际查看两张新PNG和PDF封面复渲。新图全部由现有正式人物和原生文字布局组成，没有新image_gen/素材生成。

同步最新C-only决定、放映路径/大纲/视觉选择状态；同时处理root review两处澄清：visual-direction README尾仅说当前C，A/B未采用；content-notes原11页视觉建议完整保留并显式标被v4/v5替代的历史，replacement链接指向当前12主页、技术9/WebMCP/本版无二维码。原v1–v4与A/B探索图、源码/大产物/原PNG/两视频均保留，没有cleanup/覆盖。

## 最终本地产物

目录 `/Users/nighca/.codex/worktrees/e6ff/lie/tmp/pitch/revision-05/output/`：

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| LIE-roadshow-v5.html | 33792606 | `3d76a5beab0fec2665a85e43e784638847716ea5f9ea63f85baf7aaaeac16c27` |
| LIE-roadshow-v5.pdf | 7488694 | `6d95a9b9ae5e7df998823caae4f7d9d3f452e7dc3193472aa4f65a7967ef974e` |
| LIE-roadshow-v5.pptx | 17245525 | `b8cd3958b9bde46d1d56427b0c6a5f84298880744855947a63dd719a45828a83` |
| LIE-voice-backup-28.5s.mp4 | 2441725 | `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e` |

## 检查与限制

- 全源重新装配17页/560秒，最终PPTX完整性/布局/字体/第一方导入通过，0finding/0warning；CRC、17页、39媒体、无外部rels核查。对全部media逐字SHA检查，旧B背景PNG未嵌入。标题/正文/正式标点可编辑，三张复用C概念图为位图，不能说所有图解元素原生可编辑。
- PDF17页960×540pt，复渲封面实际查看，2张已阅原PNG用于新页、另15张与已阅v4同字节。PDF仍静态图、文字不可检索；HTML已通过mockDOM 17图/2视频hash、主讲边界/问答/停播/顺序/无fetch-mic-WS检查，保留同样备用媒体hash。
- 仅1/3换版，内容/三指标口径/架构/骨骼/WebMCP/工程/媒体无实质变化；无需重跑SQLite或无关应用测试。v4独立全稿review与源资料范围详revision-04-handoff.md。
- 仍未实际浏览器全屏/声音播放、原生PowerPoint和讲者彩排；不绕过此前file://拒绝，不新开服务或provider。无应用/用户稿/模型/mic/共享浏览器行为，无启动或待关闭服务。
- 最终文档和cached diff-check/必要本地链接检查通过；named提交后clean交root按正常串行审查归档，归档不代表用户最终视觉认可。
