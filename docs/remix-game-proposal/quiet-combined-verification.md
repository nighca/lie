# 改编quiet入口组合验证

2026-10-25，`/root/architecture_code_review`借用root冻结候选完成有界离线验证。root已全文审完整组合差异及两张原生图，本轮不重复视觉/浏览器。

- WT：`/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`；branch `codex/integrate-remix-quiet-action`。
- base main：`29987714c8df1cd85fba88684680d902106ad673`，已含动画与PNG研究归档；PNG未接生产构建。
- 有序候选：`4769b5a` → **`5d24f004402961221905c9131ca471aa0fbed8cb`**；验证前后HEAD不变，写报告前tracked tree clean。source最终`b84f1c7a47b5037a44413abdcb0b7f2ce5a7619a`。
- Node24.22.1 / npm11.13.0，使用既有node_modules，未安装依赖。

| 实际检查 | 结果 |
| --- | --- |
| Web App/editor-navigation/result-scene三个测试文件 | **47/47 PASS**，2.39s；未重跑全281 |
| Web vue-tsc --noEmit | PASS |
| Web vite build＋postbuild strict generator | PASS，8 presets / **89 assets**；817ms构建 |
| 最终App/Application/style及3测试 | 六路径均逐字节等于source b84f1c7a，SHA256见下表 |
| 其他生产内容 | base至HEAD全部tracked delta仅上述6路径＋docs；其余动画/原生图/manifest/龙三叔声线/依赖均与main299字节相等，未混入其他修改 |
| QA隔离 | dist仅index.html；临时public/remix-qa.html不存在，dist无QA HTML或该临时入口的HTML/JS/CSS引用 |

既有hashed underline.svg构建时解析提示仍出现，实际静态产物存在；未隐藏警告。完整运行命令为`npm run test --workspace @lie/web -- test/App.test.ts test/editor-navigation.test.ts test/result-scene.test.ts`、`npm run typecheck --workspace @lie/web`、`npm run build --workspace @lie/web`。

| 路径 | SHA256 |
| --- | --- |
| `apps/web/src/App.vue` | `87ccf1971c3aa93e861593bc74e728f4040f840cc7edc27d9e81006e452e08ef` |
| `apps/web/src/Application.vue` | `1d8d39b6465cec4e5b5dca4f056c773ff35b95594d2f92848b38920888a83caa` |
| `apps/web/src/style.css` | `2d0ae4fa785e4238ca148ce9668ba66f2a362a7f279e58f7481fd929524a73d7` |
| `apps/web/test/App.test.ts` | `c1786a15b281d05be607fbb39a3f56b0c6d57fea58d1ca858ba62001e39a1433` |
| `apps/web/test/editor-navigation.test.ts` | `6bfcf8aa24d3c837fde008e719960f6cfa5511332607213f81da5e2a7cac5447` |
| `apps/web/test/result-scene.test.ts` | `d581d24eb8b476dd9117eb57a6d2b245a081e53ca705c3ddff96a2d6836f5782` |

结论：quiet CTA及“改编案件”标题候选组合通过，待root审报告并本地ff，**未main/push/deploy**。[source专项验收/清理](quiet-refinement.md)按源码/资源/依赖相同身份复用；实际IAB 1004/391为owner证据，非本轮重跑。source最终5402原session54417已Ctrl-C/无listener，自建tab及fixture清（owner回执，本轮未扫描）；旧23758保留为历史。没有服务/端口操作、浏览器、真实mic/provider、远程workflow；8787/8788不动。仅追加本报告与中央状态，最终文档提交以handoff记录；报告写入前本轮生成仅ignored产物。
