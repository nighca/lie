# 移动首页章节间距

2026-10-25 用户截图反馈：玩法流程与“选择案件”标题紧贴，章节层级不清。实现基线 `6fc17ae7bdc536580edb75a557728350da457476`，自有分支 `codex/home-mobile-section-spacing`。

仅在现有 `@media (max-width: 620px)` 中为 `.home-cases` 增加 `margin-top: 32px`。间距加在案件区整体前，标题与下属列表的既有距离不变；621px 以上不匹配此规则，PC 列表内部滚动及移动自然文档滚动规则不变。未修改品牌、组件、路由、内容或逻辑。

已读取 nighca-fe general 与首页全部相关媒体规则。PostCSS 完整解析通过；移除新增这一条规则后，CSS 与基线逐字节相同；`git diff --check` 通过。按本次一条 CSS 影响范围，不新增镜像测试、不运行应用套件或重复图片构建。

## 实际 Chrome 验收

本会话一次 `cua.getState()` 只有 Chrome extension，无 IAB。按本任务明确授权创建独立 Chrome 标签 `1910329694`，用同源 iframe 内真实应用（`?demo=1`）进行检查；没有修改浏览器/global viewport。所有 iframe `innerWidth` 实测分别为 391、320、620、621、1280，高均 844。候选左侧；基线右侧仅注入移动 `.home-cases { margin-top: 0 }`，准确恢复本批唯一 CSS 差异，不是另一构建或旧版本截图。

| 视口 | baseline → candidate 两区间距 | 标题到列表 | 文档 / 列表滚动 |
| --- | --- | --- | --- |
| 320 / 391 / 620 | 0 → 32px | 均保持 0px（标题盒高40px自带留白） | 文档自然增高；列表 overflow visible |
| 621 | 横向两栏坐标逐项一致 | 保持 0px | 文档844px，列表 scroll1222 / client672，overflow auto |
| 1280 | 横向两栏坐标逐项一致 | 保持 0px | 文档844px，列表 scroll1105 / client648，overflow auto |

额外实际滚动：320px candidate 文档 `scrollY=836`、列表 scrollTop=0；1280px文档 scrollY=0、列表 scrollTop=457.5。均无横向文档溢出。320/391原生对照截图确认流程与案件区分隔清楚，标题仍靠案件列表。1280最初被 fixture flex 缩至709px的数据已作废；为 iframe 增加 `flex:none` 后重新测得真实1280px，保存的最终JSON/截图使用纠正结果。一次跨frame键盘滚动操作超时，未作为通过证据；随后由fixture明确滚动按钮完成实际滚动并读取结果。

证据：[391](viewport-391.png)、[320](viewport-320.png)、[620](viewport-620.png)、[621](viewport-621.png)、[1280](viewport-1280.png)、[完整测量](measurements.json)、[实际滚动](scroll.json)、[夹具源码](fixture.html)。复现可临时复制 fixture.html 为 apps/web/__spacing-qa.html，同一Vite服务打开该路径；下拉框切尺寸，Measure读取两frame几何，Scroll按钮仅操作候选。截图保留宿主页面和真实iframe尺寸标识；不是设备模拟器或手机硬件验收，未测移动Safari。

## 服务生命周期

Owner `/root/character_preset_migration`，自有WT `/Users/nighca/.codex/worktrees/character-preset-migration-dawn/lie`，runtime冻结 `397b0328c79b82b6de97622edd198955fef7a944`。root确认UI释放后，本任务再次lsof确认5544无监听，才启动单一Node24 Vite（没有gateway），127.0.0.1:5544 / PID50243 / 原PTY session61290；consumer为上述自建标签，stop条件为本轮验收完成。已原会话Ctrl-C，exit130；最终lsof无监听且精确PID已退出。标签已显式关闭，未设置viewport override，无需reset；临时 apps/web/__spacing-qa.html已删除，源码保存在本目录便于重放。

未访问Editor/语音/草稿，无storage写入、mic/provider/语音API或语音WS调用（仅Vite自身HMR）；未操作8787/8788/5355、其他服务和用户标签。未改UI owner工作树或packages/ui，最终仅追加本目录证据，生产提交保持冻结。

## 已审 Header 依赖组合追加检查

root 在原矩阵收尾后要求追加已审 header `4567e2f9862abffc6c94ef88da8e4c316e7e28b6`，其依赖已在 root 候选 `1bde284`。本分支按授权 cherry 为 `7c62ed365cc768a56038e2ebff3e40c2404aa6d8`；此依赖不属于本任务提交，集成时不可重复重放。原 `397b032` 及 header source 均未改写。

仅实际复查391×844、1280×844：[组合JSON](combined-header.json)、[391截图](combined-header-391.png)、[1280截图](combined-header-1280.png)。两宽 header 实测均64px，流程/案件/标题/列表几何、滚动尺寸与原矩阵对应值完全相同；391间距仍32px、PC仍0margin及内部列表滚动，无composition问题。组合截图宿主页面保持了原生自动滚动位置，因此顶部工具栏/header部分不在截图范围；实际viewport与完整几何以JSON记录为准，未将宿主截图尺寸冒充iframe尺寸。

第二次服务：先核5544空，再启动同WT/冻结组合7c62ed3，PID69163 / 原PTY46596；自建Chrome tab1910329701。验完显式关tab，原PTY Ctrl-C exit130；精确PID与5544最终均不存在。未设置viewport override，临时夹具再次删除，无用户storage/其他服务动作。本次依赖仅局部header，未扩大重跑原5尺寸或应用套件。
