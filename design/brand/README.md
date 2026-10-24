# 正式品牌素材

2026-10-24 用户批准 B 微调中间版 `logo-b-refinements/shorter.svg`。`logo.svg` 保留该版所有路径、配色和比例，只将可访问名称与标题改为产品名 LIE；透明背景、440×235 viewBox，无字体或外部资源依赖。应用使用相同文件的副本 `../../apps/web/public/brand/logo.svg`，同时用于页眉与 favicon。

`readme-hero.png` 是 README 品牌插画，不是应用截图。可重建源为 `readme-hero.html`：正式 SVG 与 `../appearances/assets/` 中 coral-bob、sunny-moustache、blue-glasses 原始透明 PNG 通过 HTML/CSS 排版，再由内置浏览器导出 PNG。没有重新生成人物、脚本编辑位图或沿用旧图中嵌入的字标；画板为 1600×760 CSS 像素，实际文件为 1600×760 RGB PNG。人物下身自然出画，不作为单独立绘使用。

## 历史与范围

`logo-options/`、`lettermark-options/`、`balanced-logo-options/`、`logo-b-refinements/` 保留探索过程；各目录的对比板是历史提案，不是新的正式替代品。`../../design/ui/` 与 `../../design/styleboards/` 的既有稿件含探索期字标，只作布局/风格依据，不逐张重做。

旧 README 头图的 imagegen prompt 保存在 `prompts/readme-hero.txt`，仅记录被替换旧图的历史来源，不是当前 HTML 排版头图的生成指令。原始旧输出位于 `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-782c6c63-80ca-4df3-b8a4-eeaf8cd17186.png`，不作为仓库运行依赖。

## 验证

SVG 已进行 XML 解析；正式版与用户选定稿的路径、圆点、配色及 viewBox 逐项相同，应用副本逐字节一致。README 本地图片引用已核对。应用保留页眉链接的 `LIE 首页` 可访问名称，图片使用空替代文本避免重复朗读。web 50 项测试、TypeScript 检查、生产构建通过。

内置浏览器已查看头图：正式字标与中文清晰，三个脸部及头发完整；原始角色图片未修改，半身底部裁切属于横幅排版。应用隔离演示页已在内置浏览器确认标志加载为 116×62、favicon 引用正确且控制台无错误。favicon 复用完整标志，小尺寸细节有限，未另行设计图标。
