# 紫色短卷（plum-crop）四态素材

默认沿已认可原图逐字节复制；三态各一次独立引用默认，不重做默认，不沿上一态继续重绘。

[四态及表情近看](preview.jpg)，[原生排版源](index.html)。保留同一身份、体型、发型、衣服和原色，聆听靠耳手势、等待托下巴/支肘、说话张口并胸前掌心解释，均是静态对话活动，不表示罪责、可信度、模型推测情绪或实时口型。**资源交付待 root review，未改正式 manifest/runtime/voice。**

## 实际来源和 prompts

2026-10-24，内置 `image_gen.imagegen` 原图引用编辑，均 `transparent_background: true`。输入图先实际 view；每态完整实际 prompt 保存在 `prompts/`。PNG原样复制，未裁切、抠图、缩放、调色或用脚本编辑位图。生成次数：本套三态各一次；silver另外默认一次，全批共16次上限，全部成功，无额外重试/变体。

| 输出（assets下） | 原始来源 |
| --- | --- |
| `default.png` | `design/appearances/assets/plum-crop.png` |
| `listening.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-214626e0-4dab-454b-8e4f-1456cbe4d246.png` |
| `waiting.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-3eea1990-1a96-49fe-9980-8d00facedd97.png` |
| `speaking.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-7681b4ca-f146-4770-9598-e9d56acfb9ea.png` |

`sources.json`保存同样路径；相对默认来源均相对仓库根目录，绝对生成来源仅是制作记录，项目资源已实际复制，不依赖本机生成目录运行。

## 实际QA与边界

四图逐张 view：身份和服装保持，完整头发/脸部与活动手势入画，无明显额外手掌/多肢。手指采用卡通简化和自然遮挡，未逐像素锁定，肩线/手臂/衣褶会自然变化。新四态与已批准 coral-bob v2 力度一致；青少年形象保留普通日常装束和原有年龄比例，不成人化。

全部 PNG1254×1254/RGBA/alpha0–255。默认未重做的四套已校验逐字节一致；silver是上述已review修订。alpha>32可见包围盒如下，供检查透明边界；**不要据此逐图缩放/居中**。运行时应同组统一画布尺度、top对齐并contain，后续接入人员仍需在实际A容器检查状态切换和活动手势，不能从静态图宣称零跳位或覆盖所有屏幕。

| 状态 | bbox(left,top,right,bottom) |
| --- | --- |
| default | (265, 11, 1043, 1254) |
| listening | (254, 10, 1044, 1254) |
| waiting | (354, 8, 983, 1254) |
| speaking | (264, 11, 1025, 1254) |

预览图为内置浏览器渲染HTML后的原始JPEG；下排面部放大只用于展示，未修改PNG。人物半身/下垂手的运行时裁切由统一容器控制，不承诺全身始终可见。本套不绑定案件姓名、秘密、职业或心理/道德倾向。完整注册和音色由后续实施owner负责，当前仅交可复用素材。
