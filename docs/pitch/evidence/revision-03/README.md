# v3 真实界面来源

2026-11-02。两个JPEG由固定main `6bd6426f9fe9c5d76cc5e3b5c15334588de56d46` Git对象逐字节提取，未新开浏览器/模型/语音/用户草稿。裁图仅在本地build衍生，源码和原图保留。

- `webmcp-entry.jpg` ← `docs/design/webmcp-entry-polished.jpg`：最终入口与真实工具写入后的虚构午餐盒样例。第5页裁去导航和底部，显示表单与同步预览；不冒充现场生成、当前Agent在线或质量验证。
- `time-help.jpg` ← `docs/design/first-use-help-2026-11-01/time-copy-readable/desktop-1280.jpg`：已批准四段计时说明，第4页仅裁取弹窗。背景为历史模拟模式截图，不声称是真实语音、最新人物绑定或Safari修复证据。

WebMCP实际契约核 `apps/web/src/editor/useEditorTools.ts`：guide/state/update，直接当前表单和既有本地保存，不返回原稿全文，不自动分享/试玩/开启语音。首用最终用户批准与截图阶段区别见同main `docs/design/first-use-help-2026-11-01/acceptance-handoff.md`。现指认标题已缩短，本deck未采用旧长标题截图。

总协调确认6bd已发布（CI41323231785/CD41323378232成功）；从96到6bd是诊断及证据，普通App代码相同。Safari真实问题未定因且未修复，不在路演宣称已解决。
