# 架构单页布局样图 v10（待用户确认）

2026-11-03。用户要求本次先单独看图确认，接受后才更新演示文档。本次只生成架构单页PNG，没有制作V10全套、PDF或PPTX，没有替换V9；V9交付文件SHA全部核对未变。源与轻量图只保存为待确认提案，归档不等于接受。

[轻量预览](evidence/revision-10-proposal/architecture.jpg) · [可复现源码](architecture-preview-v10.mjs)。本机原PNG为`tmp/pitch/architecture-v10/architecture-preview.png`。

## 按用户说明调整

- Cloudflare节点改名Gateway，小字完整表述为“Cloudflare Workers，设备与凭据管理”，逗号后分行。
- Gateway放在右侧组的左边，R2与灵矽位于同一列。整体下移，三模块组上下范围358–600，中心479；语音模块范围435–523，中心同为479。Gateway自身也居中，中心479。
- 为给右侧腾空间，浏览器区保持五模块及原依赖，仅轻微收窄；直连、准备凭据、设备管理、分享关系均保持。直连蓝线从语音模块下侧绕过Gateway，管理/准备为灰线，不经过实时音频中继。
- Linx的小字用紧凑单行STT/LLM/TTS，避免在较窄节点中换行。正式直连事实沿用已发布7ff资料，无新增应用或provider验收。

主代理与独立子代理已实际阅此单页，标签/中心对齐/连线语义通过；初版Linx小字自动折行已修为上述单行。无浏览器、服务、麦克风、provider、自动化或账户操作。仅待用户对布局视觉确认，不继续整稿。

## 字节身份

PNG SHA256：`397b44ef2431d83c614c6f26bf35a2ed0fa9ea9050509865787088cb3775028b`。

轻量JPEG SHA256：`6be78a928df2bff60bf5f12c2eaff5b6ea243c6e936ca1153b1c8eebd8d5acb4`；仅PNG缩宽1600/JPEG质量90，不改图内内容。重建依赖已存在的正式logo与同一演示制作runtime/字体，不需新素材。
