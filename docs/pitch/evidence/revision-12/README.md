# V12角色扇形单页

2026-11-03。用户三层扇形草图已授权制作；本稿替代V11第6页的横排构图，整套页序、时间和其他页面由主构建owner维护，本专项未修改。

- `role-fan-preview.png`：1280×720逻辑画布按1.5倍导出，沿用C方向正式logo/header/title。
- `layout-record.json`：13张正式原画的源路径、SHA256、透明裁边后尺寸、实际等比摆放矩形和安全区检查。
- 主构建复用 `../../role-fan-v12.mjs` 的 `drawRoleFan(s, {img, portrait})`。函数仅绘制内容区，调用方负责既有header/title；img签名为`(s,file,x,y,width,height)`，portrait为`async(id,state)`，返回现有透明裁边PNG路径。导入无文件/渲染副作用，无运行时依赖导入。

中心珊瑚短发default高180；内圈五状态高135–150，外圈其余七形象各单态高115–120。所有人物保持直立与原生比例，无旋转、变形、箭头、弧线或横排标签。只对透明空边裁切并等比排布，未覆盖正式原画、生成新画或改变人物像素内容。

实际渲染后阅图：13张人物均完整可见，扇形三层与中心主次清楚，未压住标题/header/footer。几何检查：所有实际摆放矩形在x55–1225/y230–680安全区，任意两张矩形正面积相交为0。该检查不代表用户对最终整稿验收，也不涉及产品/模型/音频。

独立runner位于本机ignored `tmp/pitch/revision-12/build/render-role-fan.mjs`，使用与V11相同的bundled Node/artifact-tool/sharp；中间裁边PNG仅在ignored build，无需作为新正式素材提交。模块与此处预览/记录是必要可审交付；未产生新PPTX/PDF或重导旧版本。

上述“未产生新PPTX/PDF”仅指独立单页子任务。正式V12已由主构建生成并验证，见[交接](../../revision-12-handoff.md)；独立单图与正式第6PNG字节一致，其余15页与V11一致。
