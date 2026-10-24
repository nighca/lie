# blue-glasses：对话活动四态

沿用户已批准的 coral-bob v2 力度，为既有形象补聆听、等待、说话各一张；默认原图逐字节保留。**本轮为独立素材交付，未修改正式 manifest、应用资产或运行时映射。** 形象不绑定案件姓名、职业或秘密，活动状态不代表罪责、可信度、情绪判断或实时口型。

先看 [四态与表情近看](preview.jpg)，[预览源](index.html)；[三人并列核对](../sunny-moustache-v1/ensemble.jpg)，[对应排版源](../sunny-moustache-v1/ensemble.html)。整体同一方形画布、同一绘制比例，再用 CSS 放大表情，不按各图可见轮廓单独居中。聆听是靠耳手势，等待是托下巴/支肘，说话是张口并在胸前做紧凑掌心解释，避免横向伸臂。

## 来源与实际 prompts

2026-10-24 内置 `image_gen.imagegen` 引用编辑，三次均 `transparent_background: true`。唯一身份输入为 `/private/tmp/lie-appearance-assets/design/appearances/assets/blue-glasses.png`；先实际 `view_image` 后编辑，每态独立引用默认原图，不沿生成结果继续重画。完整实际 prompts 分别保存在 `prompts/listening.txt`、`waiting.txt`、`speaking.txt`。本套三次，连同另套全批共六次，均成功，没有重试生成或无界增加变体。

| 输出（位于assets） | 工具原始输出 |
| --- | --- |
| `listening.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-800b3cf0-7164-4350-af4e-e71b31537e04.png` |
| `waiting.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-1223722a-2266-4bf5-b255-5cd9f49b9c9b.png` |
| `speaking.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-c9721752-426a-4429-a9c0-1e56ffd80348.png` |

`assets/default.png` 与 `../../assets/blue-glasses.png` 逐字节相同。生成结果原样复制，未脚本抠图、裁图、缩放或调色。预览是内置浏览器实际渲染 HTML 后的原生 fullPage JPEG，不是生成原图的来源。

## 实际 QA

- 四图都是 1254×1254 RGBA，alpha 范围0–255；PNG格式、默认一致性和本地引用检查通过。原始图、各生成图、四态预览板都实际看过；脸部、头发及活动手势完整，无明显多肢、额外手掌或服装身份漂移。手指为卡通简化与自然遮挡，并不声称医学精确解剖。
- 与 coral-bob v2 并排：三人都用深蓝轮廓/扁平柔和阴影，保留各自体型、脸型、发型、服装；活动力度一致，嘴型/手势能辨。新两套讲话用胸前小手势，比顾遥外展掌更紧凑。不会为统一比例而把原本不同体型改成同一身形。
- 顶部alpha可见边缘只有少量源像素变化，整体头部位置接近，但生成编辑不是逐像素锁定，肩线/手臂/腰部轮廓有自然变化。接入应使用同组统一画布尺度、top对齐、contain限制，不按alpha包围盒逐图缩放或只缩某一态，否则会产生人为跳位。静态并列不能替代运行时切换验收。
- 预览实际 JPEG 1440×914；三人核对图1280×983。内置浏览器逐页实际查看，图片加载完成、中文与脸部完整。小图统一contain展示时手势仍可读。A舞台为半身取景，下垂手允许在画面外；需保住头部与当前活动手势，不能宣称所有画幅/屏幕都显示整个人。

alpha>32可见包围盒（原始源像素）：

| 状态 | bbox(left,top,right,bottom) |
| --- | --- |
| default | (255, 17, 1010, 1254) |
| listening | (251, 16, 1012, 1254) |
| waiting | (328, 16, 970, 1254) |
| speaking | (253, 17, 995, 1254) |

未修改业务/声音/Provider/plan，不操作用户8787或麦克风，不开展新人物或宣传视频。接入与是否统一采用新图由root review后安排，后续还需在真实A容器检查不同屏幕的活动手势与状态切换。
