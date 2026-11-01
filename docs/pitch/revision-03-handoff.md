# v3 路演修订交接

2026-11-02。用户已确认WebMCP主讲方案（“可以的”），完整视觉产物仍待用户审阅。专项WT `/Users/nighca/.codex/worktrees/e6ff/lie`、branch `codex/lie-roadshow-deck`；原应用base `a8be75823ceb67966390b5534d725a3a8bf1505b`，本批parent `8b900b1d42a47b1bf757e7bf1a8fba25fb55688a`。此前三个有序提交已由root审查集成，不重放；本批追加SHA由消息提供。root持集成责任，专项未改main/push/部署。

## 范围和批准

第5页实际编辑器验收画面呈现讨论→直接填稿→自己试玩；第7页可编辑图解分开用户Agent/WebMCP页面工具与浏览器/网关/语音角色两链。主讲解释复用现有表单、本地保存、无产品侧新创作模型服务；更多支持Agent的长期适配是方向。第4页真实计时帮助裁图，第6/14页六案与额度同步。第10页AI开发方法、江苏开场90秒现场优先、11+5页、560秒均不变。

轻量范围：docs/hackathon/project-highlights.md、docs/pitch/**，含两张实际JPEG及来源说明。子代理只改亮点/content-notes，主代理已逐项review实际diff与周边、核对图文范围。没有新WebMCP实操、用户草稿访问、录音、模型调用、服务或浏览器操作。v1/v2媒体与所有旧产物保留，新PDF/PPTX/HTML只在ignored tmp。原纪念章28.5秒实录和历史横v3宣传片hash不变，不自动替换最新公开片。

固定事实main `6bd6426f9fe9c5d76cc5e3b5c15334588de56d46`：六案、WebMCP直接表单更新、首用帮助已上线。root正式确认CI41323231785/CD41323378232success及实际部署/身份核查；普通App能力沿用96c5验收。Safari仅诊断上线、真实根因未定未修，不称游戏语音修复。v1.2 tag仍f504。未扩大为全Agent兼容/总耗时提效/故事质量验证。

## 本地产物

输出绝对目录 `/Users/nighca/.codex/worktrees/e6ff/lie/tmp/pitch/revision-03/output/`。

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| LIE-roadshow-v3.html | 32314194 | `01be8a3ccbc58a93f81d6c27b8ef966f6d33603d26eb7f996f50d47fbc4a360f` |
| LIE-roadshow-v3.pdf | 6232813 | `312fdb23e4ac51517372f29dfa70ff9a85ab48a6d1af5a2aa0c1de6ac6cc7b8b` |
| LIE-roadshow-v3.pptx | 14000094 | `3597ac9718d76aaf0393a6935bc2c6a5a9f677c8c93adbec9ae34dd4719d66f9` |
| LIE-voice-backup-28.5s.mp4 | 2441725 | `f4ca309ae7d8840e47b2a310cfafcfeae8e397c3cb06436d2c167d54187b1e9e` |

## 实际检查与限制

- @oai/artifact-tool全源重建并同进程导出16页，560秒；不是从缺媒体的JSON单独导出。最终PPTX完整性/布局/字体策略/第一方重新导入通过，16页、21个嵌入媒体，无外部图片引用。字体Hiragino Sans GB/Arial。保留封面有意越边原画warning1，finding0。
- 最终PNG逐一hash对比v2，仅4/5/6/7/14变化；五页实际查看并修正第4页人物与文字相碰后重建。其余11页字节一致，沿用前轮视觉审查。PDF16页960×540pt，pdftoppm复渲4–7，实际查看4/7，5/6复用相同PNG嵌入。
- HTML mockDOM控制与16页PNG/两视频嵌入hash检查通过，主讲边界、换页停视频、无网络API。没有浏览器实播/全屏/扬声器主观验收，没有原生PowerPoint运行；应用内浏览器此前拒绝file://，未另开服务或绕过。
- PDF为高清静态图片归档，文字不可检索，无视频；PPTX保留可编辑文字/图解和静态素材，无视频。现场优先HTML/PDF稳定呈现；真实产品另需网络、支持组合和手动操作。
- 内部首轮PPTX移入build/pre-visual-correction.pptx保留。第二次finalizer因旧receipt EEXIST停止未交付；旧receipt移为pre-visual-correction-validation.json后再跑成功，最终身份以上表及validation-final-review.json为准。
- 最终文档diff-check、必要链接/来源检查，不跑无关应用测试。无启动服务、无待关闭消费者；dirty仅本批named资料，提交后应干净。
