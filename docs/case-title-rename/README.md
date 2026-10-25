# 首案标题更新

2026-10-25 用户明确要求首案从《空盒里的纪念章》改名为《消失的纪念章》。基线 `1232ef884a6841065a73db5a1080d81eeb2fe03e`。仅修改 canonical `content/games/01-empty-medal-box.json` 的 title，以及当前展示用 `apps/web/README.md`、根 README.md / README.zh-CN.md 的案件名称。根两份 README 也直接展示当前官方案件，故一并同步。

案件 `id=empty-medal-box`、URL `?game=empty-medal-box`、编号文件名不变。独立JSON比较确认除title外所有字段逐项相等。首页 catalog 从 `officialCases` 的 game.title 派生，默认/URL加载仍由同ID的 `readBundledCase` 读取；App和页面标题使用 controller/title，没有另一个标题副本需维护。

全仓 tracked旧标题搜索原有61文件，改4文件，保留57文件，完整清单与分类见 [retained-references.json](retained-references.json)。content/proposals保留当时方案；两份legacy-preset fixture是旧草稿/旧分享输入，必须原样保留以验证兼容；design与docs中的设计、方案、截图/浏览器/模型验证、录制脚本和转写均保留原时点标题。Hackathon亮点讨论稿同样保留本轮之前的原始讨论，不把其旧三案描述顺带改写。历史链接ID无变化。不追溯替换二进制图像/视频或用户旧分享/草稿；分享中原有标题属于各自内容，不做改写。中央plan/handoff/development由root批量更新，本分支未改。

Node24.22.1：`npm test --workspace @lie/web -- bundled-cases staticContent page-title`，4 suite / 37 tests PASS（1.14s Vitest）。覆盖真实官方内容加载、catalog投影与标题导航；未新增镜像断言，既有断言无需调整。canonical JSON严格解析、单字段身份、完整diff及whitespace检查通过。未启动服务/浏览器/真实provider，未重复应用全suite或图片构建；无mic/storage/用户标签操作。
