# 改编游戏候选组合验证

2026-10-25，执行者 `/root/architecture_code_review`。root已实际完整审查source生产差异/5测试/方案实施及desktop/391原图；本轮负责冻结组合的自动验证与身份核验，没有重新开浏览器。

- owning main：`b3f9bf69029cb04aa0c21c58080192ee53f71b2a`，本轮不更新main。
- root-owned WT：`/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`；branch `codex/integrate-remix-and-retention-decision`。
- 冻结被测HEAD：`be6dd1253bf673f1a3324f9d492cd94c3c3e66e1`，由main依次cherry已审不采用retention文档 `e409346`、改编 `be6dd125`。
- 改编source：`d3bd29c6d5e6d09ebf9938c36a92488f9767a4f3`；原base `9b17538ba93fb9c388851a6882f1deb9954a304e`。其base至owning main的apps/packages/scripts/package/lock范围只有style.css四行差异；候选整个style.css逐字节等于main b3f9bf6，语音提示位置保留。PC立绘新source ffa0b753不在本次冻结候选，不混算验收。

## 实际执行

既有本地依赖，Node **24.22.1** / npm **11.13.0**，未安装依赖。

| 检查 | 结果 |
| --- | --- |
| `npm run test --workspace @lie/web` | 31文件 / **281 tests PASS**，3.35s |
| `npm run typecheck --workspace @lie/web` | PASS，vue-tsc --noEmit |
| `npm run build --workspace @lie/web` | PASS，Vite生产构建；pre/post generator均8 presets / **89 assets**，postbuild strict check通过 |
| 临时QA入口隔离 | dist仅index.html；public/remix-qa.html不存在，dist HTML/JS/CSS无该临时入口引用 |
| 构建提示 | 既有hashed underline.svg构建时解析警告仍出现；实际dist含该static资源，不把警告隐藏或称新缺陷 |
| 依赖与构建身份 | package.json、package-lock.json、apps/web/package.json、apps/web/vite.config.ts逐字节等于source |
| 归档身份 | 不采用retention README.md.txt / corrections.md.txt均逐字节等于sources.json指定14a32fb路径，SHA256匹配 |
| 验证后状态 | HEAD仍be6dd125；写本报告前git status --porcelain为空；仅ignored生成产物变化 |

4生产/5测试路径均逐字节等于source；SHA256如下（不以通过测试代替root review）：

| 路径 | SHA256 |
| --- | --- |
| `apps/web/src/App.vue` | `2dd6273ec589495cfe47a67308737a86e0136fc539e8a90f7cca4682ca7f713e` |
| `apps/web/src/Application.vue` | `92d2dca311035248cb13c9637205ac2af64e3e7f62f6dc98037af9a01063509d` |
| `apps/web/src/application/controller.ts` | `30acda32893a2ba05bf05a88059f9176a0f7dd3c3cfcf3dac03d92680bfd8a5e` |
| `apps/web/src/editor/draft.ts` | `2592362f5948d52773c7637df4006417ffba212a90ae9c86aa32711186cc4503` |
| `apps/web/test/App.test.ts` | `218abb4fc0adb88e6ea2467210dc26e4f57500feb466bed55beea3291784e917` |
| `apps/web/test/controller-result.test.ts` | `da7d84f8cf989915940defaea1219dbd7c39f7ff71db068f074fedd978965745` |
| `apps/web/test/editor-draft.test.ts` | `d885d663ee733c9d5422512a1cc2752b43ad2f508c6aadc1ef134565bee77c8f` |
| `apps/web/test/editor-navigation.test.ts` | `b0d8f42c8b5301d879e3f0782862ce29afd02b0ce7f1281e94ca265934a331b6` |
| `apps/web/test/result-scene.test.ts` | `790cd9f33b82b91e3bd0ce4765d2b02561df87c2615d0255ed5e70f86585c830` |

## 范围与清理

[专项实施/IAB与三张原图](implementation.md)按同源生产文件及相关CSS/依赖身份复用；本轮未运行真人mic/provider、服务、浏览器或远程workflow，未重做voice/gateway全套，不把本地fake测试当生产真人验证。source原5402 exec/session23758已退出、无listener，自建tab及临时入口已清，为owner交付/协调确认事实，本轮未端口扫描或终止进程。5402保持按需启用用后停；不动8787/8788或其他owner服务。

结论：冻结候选自动组合验证通过，**待root审本报告并fast-forward main**；本轮没有main/push/deploy。后续仅追加此报告与中央状态文档，生产源不改；具体最终docs commit以handoff为准。
