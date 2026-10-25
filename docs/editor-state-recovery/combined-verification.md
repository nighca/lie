# 本轮发布UI修复组合验证

2026-10-25，`/root/architecture_code_review`借用root冻结候选完成离线验证；root已全文review生产/测试/文档/fixture/JSON及8张原生图和KeepAlive/立绘生命周期周边。

- WT `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`，branch `codex/integrate-release-ui-fixes`。
- main base `aca35311784cded8423c8958170bb9f30862b505`；有序 `4b6624d3bbc9b37f643580a8442da11915139f01` → `61c0c41d6e8409f1b2d12b2d185e548506709750` → **被测HEAD `aa6fc190c938169088e8abbe3b86d09431b784c6`**。验证前后HEAD不变、写报告前tracked tree clean，仅ignored生成产物变化。
- source调查 `0f12453a1d9fcc6d9b1e8dca4900675df225d7cf`，Editor `97a18031666a0e60cca7a7ada920ad6ce51951cd` → `8e09327e9ff2b504b8e62ce72f59825b7e7dae0a`。

| 实际执行（既有Node24.22.1/npm11.13.0、无安装） | 结果 |
| --- | --- |
| `npm run test --workspace @lie/web` | **31files / 288 tests PASS**，3.49s，包含新增保存失败/返回step/复制意图/预设可访问名称及KeepAlive立绘生命周期回归 |
| `npm run typecheck --workspace @lie/web` | PASS |
| `npm run build --workspace @lie/web` | PASS，608ms；pre/post strict **8 presets / 89 assets**，既有hashed underline.svg解析提示仍出现，实际static产物存在 |
| 最终文件身份 | style.css逐字节同调查source；Application.vue、editor/Editor.vue、editor/editor.css、editor-page.test.ts、editor-navigation.test.ts逐字节同8e09327 |
| 其他字节/QA边界 | 全tracked增量仅上述6路径＋docs与design/background-name-spacing证据目录；其他生产、动画/manifest/龙三叔、内容、依赖同mainaca。dist仅index.html；临时editor-state-qa与背景QA入口不存在，dist HTML/JS/CSS无相关fixture入口引用 |

RSM-01、RSM-02、QA003及预设去名/姓名间距组合通过；旧review的错误断言probe未当修复检查运行。source IAB1004/391编辑恢复与预设选择、1280/391背景姓名间距按实际相同生产/资源/依赖字节复用，不重开浏览器/服务。新增生命周期测试观察组件卸载/重新挂载，不冒称真实GPU、帧率或新浏览器验收。[source实施与限制](README.md)仍记录未归因MutationObserver异常，本轮不称该浏览器console clean。

清理沿owner回执：5402原exec89431停止/无listener、tab26及临时fixture清；5507 PID97700/PTY27003停止/无listener、tab42清。本轮没有扫描/启停、mic/provider/付费、fetch/push/main操作，保护8787/8788。root审本报告、复核Git后本地ff并执行用户本轮单次普通main push，触发现有CI；实际HEAD读Git，CI/线上部署成功另行确认，**此报告不声称已ff/push/deploy**。
