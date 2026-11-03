# LIE 中文路演确认稿

2026-11-03，用户确认V14无进一步问题，并明确授权将这版PDF及必要材料合入主干、push到仓库。此处保存用户已看过的原始PDF字节，不重新渲染或修改内容。

**[下载/查看确认稿 PDF](LIE-roadshow-v14.pdf)** · [字节身份与来源清单](manifest.json) · [讲述指南](../presenter-guide.md) · [当前大纲](../outline-v14.md)

- 16页（15页主讲＋1页Q&A），主讲预算560秒；中文10分钟路演＋10分钟问答。
- 7,863,949 bytes；SHA256：`3f6fcf1c3503ffd0a3b7745387f66fc9063278924b79301e57e8af937c8db9f2`。
- 仅归档本确认稿PDF。旧HTML/PPTX、视频、大型临时渲染/缓存不新增入库；已入库的旧源码、设计取舍、必要轻量图和证据历史继续保留。
- 本次确认是最终视觉及仓库归档/合入/push授权，不是实际设备全屏、音响、真人语音或产品演示彩排的验收。演示环节仍需另切官网或独立备用实录，PDF不嵌入媒体。

## 长期保存的制作材料

- [最终制作源](../build-deck-v14.mjs)、[三层角色布局](../role-fan-v14.mjs)、[PDF打包脚本](../package-pdf-v14.py)。源代码含逐页讲述备注、素材路径与事实来源；[内部备稿](../content-notes.md)保存完整统计定义。
- [最后一轮反馈](../revision-14-feedback.md)、[交接与检查](../revision-14-handoff.md)、[最后三页阅图](../evidence/revision-14/README.md)。更早C方向/截图/设计方案与决定按原路径和Git历史保留，不与最终状态混用。
- [Agent统计原始方法](../engineering-evidence-v6.md)、[文档372的去重与分类](../engineering-output-evidence-v11.md)。原始时长/覆盖记录不因显示取整而改变；无需重新读取私人聊天才能理解本次统计口径。
- [真实JSON视窗生成脚本](../render-game-json-v11.py)及[原文/hash记录](../evidence/revision-11/json-source.json)。其原文来自历史 `content/games/01-empty-medal-box.json`，当前 `content/games/03-empty-medal-box.json` 与其同blob；旧renderer按旧树路径保留，不在新main直接重跑，见[历史制作路径](../README.md#历史制作路径)。V14重建使用已入库PNG，不依赖执行该历史renderer。角色/品牌原画来自仓库`design/`正式资源，不改变像素或上传新媒体。

## 重新制作

从仓库根目录，使用提供`@oai/artifact-tool`、`sharp`、ReportLab的制作runtime；当前验证版本为26.1026.10807，字体为Hiragino Sans GB。将runtime的Node模块目录链接到`tmp/pitch/revision-14/build/node_modules`，复制`build-deck-v14.mjs`到该build目录后运行；再从仓库根运行`package-pdf-v14.py`。构建只写ignored `tmp/pitch/revision-14/`，不会覆盖此确认稿。

原画/轻量证据与两个模块均在仓库内。重新导出的PDF可能因生成时间或runtime变化而有不同字节，不能冒充本次用户验收文件；需要提交/播放时优先使用本目录的原始确认稿并核对上述SHA。后续修改另起修订，不覆盖本V14文件或重写其来源记录。
