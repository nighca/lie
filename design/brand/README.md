# README 品牌素材

- `logo.svg`：原创几何 LIE 字标，深蓝圆角笔画、珊瑚色圆点，透明背景；原生 SVG 路径，不依赖字体、位图或外部资源。viewBox 为 400×160。SVG 自带可访问标题与描述。
- `readme-hero.png`：README 横幅插画，不是应用截图；黄底与三个现有成人形象进行轻松对话，无案件答案、证据、按钮或未实现的功能。实际尺寸 1774×887，保留工具原始 PNG。

这两项沿用用户已确认的中文 B 方向；独立字标是可维护矢量，横幅中的 LIE 字样则是生成插画的一部分，并非独立字标的像素复制。横幅没有需要翻译的英文宣传文案，只保留产品名 LIE。

## 生成与 QA

2026-10-23 使用内置 `image_gen.imagegen`，`transparent_background: false`。输入为 `../appearances/assets/` 中的 coral-bob、sunny-moustache、blue-glasses 三张现有形象；完整实际 prompt 位于 `prompts/readme-hero.txt`。原始输出：`/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-782c6c63-80ca-4df3-b8a4-eeaf8cd17186.png`，已原样复制进项目，无脚本编辑、裁切或去背景。

已用 `view_image` 检查：LIE 清楚可读；恰好三名成人，脸与头发完整；配色、轮廓与现有形象一致；无案件、道具、指认结果或 UI 功能暗示。图中人物下身与最右侧肩部自然出画，是横幅构图，不作为单独人物立绘使用。SVG 已通过 XML 解析和外部资源检查；图片尺寸模式已读取核对。README 集成后仍需检查窄屏缩放、替代文本与首屏实际效果。
