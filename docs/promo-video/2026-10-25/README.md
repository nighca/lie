# 案件创作录像预览 01

> 历史预览：用户于2026-10-25要求重录完整流程并允许删除旧视频；本稿对应MP4已从当前交付目录移除，制作记录与Git历史保留。现行成片见[完整创作、试玩与分享](complete-create-preview-share.md)。

2026-10-25；状态：已制作，待用户审看片段节奏；不等于整片视觉批准。

## 用户确认与分工

用户在制作专题 chat 明确授权实际制作，先以几段实录加各段片头、整体片头与片尾组成简单版本。用户录制首页进入并完成一局的真实语音；制作 owner 录制创作与分享。用户随后确认统一 1280×800；owner 录制试玩或分享接收方时仅演示进入游戏，不进行语音对话。本次请求是先用线上环境录制案件创作。旧研究的研究限定已被此次授权取代。片头片尾参考待用户提供，尚未替其定设计或采购工具。公开上传尚未授权。

## 本次录制

- 真实入口 https://lie.agency/ → 编辑器 → 试玩 → 接案，开始调查。
- 临时示例《谁藏起了生日蛋糕？》，2 人，8 分钟；不是官方新案件，不是内容质量或真实模型验收。
- 内置浏览器独立自建 tab 1；开始时编辑器为空，没有清理用户既有草稿；仅添加本次演示草稿并保留。录制终点在调查页、开启对话之前。未访问麦克风、调用 provider、创建官方投稿或公开分享。
- 线上实际脚本 URL `/assets/index-BMjLEyzW.js` 与仓库发布记录 2268f84f02576d4384f0d30f9f117a70164f135a 对应；未重新下载核验整套线上资源哈希，不能扩大成新的完整发布验证。制作工作树基线 5a9a31c26b1e8f7be57b4147c2886b785b052111。
- CDP Page.startScreencast 采集真实页面 JPEG 帧，按原始时间戳重建；四段顺序拼接，段末略留静帧。没有伪造 UI 或加速操作。文案通过真实输入控件填写，长段为粘贴式填入。无鼠标指针覆盖。
- 输出 H.264 4:2:0 full-range / yuvj420p MP4，1280×800，30fps，51.366667 秒，2027808 bytes；无音轨、片头、字幕或音乐。FFmpeg 8.0 本地现有版本，无安装依赖。
- 抽查每 6 秒画面、核验最终调查页与 ffprobe 编码/尺寸/时长；完整人工逐帧播放尚未进行，用户可直接审看片段。

## 文件与复现

预览：../../../media/promo-video/lie-editor-creation-preview.mp4；验看图：同目录 contact-sheet.jpg、final-screen.jpg（截图实际为 JPEG、1163×727；不同于视频的 1280×800）。原始逐帧素材、时间戳 frames.json、FFconcat 工程已从临时目录保存到本机持久素材目录：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/editor-creation-take-01`

素材均为本次虚构输入和产品页面，无麦克风/个人声音；不提交大量逐帧 JPEG。FFconcat 中含临时目录绝对引用，复现时将 `/private/tmp/lie-promo-editor-20261025` 替换为上面的素材根目录，运行：

```sh
ffmpeg -f concat -safe 0 -i recording.ffconcat -vf 'fps=30,setsar=1' -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -movflags +faststart output.mp4
```

本批只新增本目录和 media/promo-video；没有应用代码、运行依赖、服务、端口、部署、push 或 main 修改。浏览器录制已停止，1280×800 临时 viewport 覆盖已 reset；专用 tab 保留给后续制作（handoff）。现有 8787/8788 与 5355 服务和他人 tab 未操作。主协调仍为唯一 integrator，中央计划由其审查批量交付后更新。

实际产物复核：编码命令请求 `-pix_fmt yuv420p`，但两部既有 MP4 的实际 ffprobe 结果为 `pix_fmt=yuvj420p`、`color_range=pc`，即 full-range；命令参数不等于实际产物为 limited-range。截图按 JPEG magic 修正扩展名，仅改名、原始字节不变。
