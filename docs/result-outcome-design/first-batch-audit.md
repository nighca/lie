# 首批三位结果素材：独立审计与归档组合验证

2026-10-25。base `870cbd524ab21e243e072866ce70288932192834`，冻结设计候选 `da68bfda62118dff5516f15d3e52192a3d53b51f`。root已全文审查来源/提示/节点轨道和父证据；本轮仅归档，不激活正式manifest、不实现正式结果UI。

- 本批57个design/result-reactions文件逐bytes同parent `458aaf85af8bb71aead85596fced9ddd3524ad59`。范围只含sunny/silver/plum、统一页及父补证；parent历史内其他未选入的在制人物目录没有顺带导入。
- 相base，apps/packages/scripts/.github及design/character-presets全部零差异；不重建、不编码、不跑应用全suite或新浏览器。当前parser/playback相历史462只有asset后缀允许png/webp的parser单行扩展，playback原样；继承已验runtime80，不声称本轮重跑。
- 当前Node24.22.1实际执行`node --experimental-transform-types design/result-reactions/validate.mjs`退出0（仅预期ExperimentalWarning）：4人968刚性采样、旧四态/parts保留、结果一次保持、画布/资源文件头均通过，完整输出与历史审计的unified结果相等。[当前输出](first-batch-audit-current-validation.json)。
- [历史完整机器审计](first-batch-audit.json)与[原检查脚本](first-batch-audit.py)原样归档。其runtimeMain=`462d8a4ddebe1df3703caace2f2db2aa5c8eeb89`是当时实际身份，不是本轮870；脚本重放会查询运行时的main，不能覆盖历史记录含义。三位各自242采样/资源SHA、尺寸、RGBA/alpha、预算和来源记录核验见该结果。旧PNG分别5/6/5张原样；含canvas总像素12,580,128 /14,154,438 /12,580,128，低于33,554,432。
- 正误静态PNG的文件身份/尺寸和采样末帧保持已检查；实际Canvas末帧与PNG逐像素相等仍为parent原浏览器证据，本轮未重渲染/视觉复验。silver真实JPEG格式纠正及父追加service stopped/stopEvidence已保留，不将旧lane README暂留服务文字当现状。

原始有序来源：`e362243bc600c1443451503ec79d422b4285c149` → `174d98c43c83e5f0dcb0660edc42d22b68e7d5f3` → `6f83ce9cf661c13610d052c919a783eab4e724d4` → `4fa81cacf2a78bf3dc7f77087ffee4b9d3f4f14f` → `cf93dae724351f62c5258338981fdbc8d7129735` → `17922c6` → `458aaf85af8bb71aead85596fced9ddd3524ad59`；root本候选依次cherry为`6f9b96d` → `b9fa59e` → `ff2c31a` → `8bda842` → `1bf8de4` → `d9f34cd` → `da68bfd`。

用户新增明确授权：本次合完、review后由root普通push并发布线上。尚未ff/push/部署，不将新授权写成执行结果；root唯一发布turn。正式激活与结果UI仍由动画parent接入，不将三位归档等同八人完成。

本轮无服务/browser/viewport/mic/provider/安装/素材编辑，无main或push；只产生本报告和归档证据/中央状态。相对链接、JSON解析、diffcheck通过，源码与依赖不改。
