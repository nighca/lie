# 页面标题＋可选结果契约组合验证

2026-10-25，root已完整review来源/周边；本轮在root冻结候选执行验证，不改生产/测试。WT `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`，branch `codex/integrate-titles-result-contract`；base main **d82791c535f8d48b53d17fe0212bf671e4c26f9a**，有序：

1. `e818440e08d35509e519669682efd488a6963f8b`（title source d3250a87c6b701adb78edc5a4249bb04d141d362）。
2. `ba68f00edb5192b806bcc947705f7dc442d1b4fc`（title source4cd31f3e7bc5edf6476c0567fc7be9c968d9c607）。
3. **被测HEAD `8c0e8d9b341d51a27dca5229ffbfeddda016ddad`**（contract source6d443ceb1145073ba5bcbd9a1b8af7080f6e8bec）。

| 实际检查，既有Node24.22.1/npm11.13.0及相同lock | 结果 |
| --- | --- |
| 完整Web | **33files /319 tests PASS**，6.27s（title315＋契约4） |
| UI / character-animation runtime | **5files52 /2files43 PASS**，1.15s/197ms |
| Node character-presets generator | **23 PASS** |
| 根npm run typecheck | 全workspace通过（gateway/web/runtime/core/UI/voice） |
| Webbuild / strict预设 | **96 modules transformed**，350ms，8presets/89assets通过；既有underline.svg解析提示保留 |

90份canonical PNG/JSON/SVG（八人原图、旧四态包、manifest/声线等）逐字节同main d827；voice/controller/App/loading style/content/package-lock未改。title HTML/helper/两测试逐字节同4cd；Application相对当前main只增加精确title import/usePageTitle两行，保留preview handler guard与allowRemix gate；它因保留已main的preview修复而非整文件同旧title source，初次整文件比较断言据此收窄为真实组合核验。contract生产/测试逐字节同冻结6d，没读取动画owner新dirty样片。

产物8人48个hash引用与8包46个相对parts全部存在，dist仅index.html，HTML/JS无“开发预览”或QA入口。title源[原19次观测及最终tab28两页复核](README.md)分别按原范围复用，不把旧矩阵冒称最终writer全矩阵重跑；loading/preview源IAB43/44依[已有身份边界](../voice-connection-loading-combined.md)复用。此候选未新开浏览器/服务，不称其原生浏览器、GPU/真人provider或新结果视觉已验收。

结果方向R已批准，但33fe珊瑚样片用户未通过，加强版374f289e233a3c50ed9bf9c2256dad5215db46ea（依赖33fe5d3，仅design/result-reactions14文件）已clean交回，root尚未review两版素材、用户仍待看过，不纳入本组合；5355 PID1851/tab60由用户在看而保留，旧设计服务关闭回执不能覆盖新消费者。图片q90已批、81路径约9.75MB为研究测得，构建实现中；package/load兼容turn待本候选root审报告/本地ff后再授。title/契约当前仅组合候选通过，未main/push/deploy；loading＋preview已main911且尚未推。根实际HEAD/状态以Git为准。本轮验证后HEAD仍8c0e8d9、tracked clean，仅ignored产物；无安装/网络/服务尾项、main或push操作。
