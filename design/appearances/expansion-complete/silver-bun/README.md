# 银发盘发（silver-bun）四态素材

默认经过一次原图引用编辑，经 root 目检接受为东亚年长女性原创美术设定；三态独立引用该修订默认。盘发、衣服、圆润体型保留，不根据真实人物推断族裔。早期默认修订原始记录已在先行提交，当前延续该结果，未再次生成默认。

[四态及表情近看](preview.jpg)，[原生排版源](index.html)。保留同一身份、体型、发型、衣服和原色，聆听靠耳手势、等待托下巴/支肘、说话张口并胸前掌心解释，均是静态对话活动，不表示罪责、可信度、模型推测情绪或实时口型。**资源交付待 root review，未改正式 manifest/runtime/voice。**

## 实际来源和 prompts

2026-10-24，内置 `image_gen.imagegen` 原图引用编辑，均 `transparent_background: true`。输入图先实际 view；每态完整实际 prompt 保存在 `prompts/`。PNG原样复制，未裁切、抠图、缩放、调色或用脚本编辑位图。生成次数：本套三态各一次；silver另外默认一次，全批共16次上限，全部成功，无额外重试/变体。

| 输出（assets下） | 原始来源 |
| --- | --- |
| `default.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-ab19557b-27d2-4c66-806a-8785a22d3096.png` |
| `listening.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-e633165b-e6bd-4439-b668-70ad92427c9c.png` |
| `waiting.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-a1aafc9d-0d89-4ab6-9379-e946371f876c.png` |
| `speaking.png` | `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-aa455faf-1df6-4db4-85a0-b1d0dc83c236.png` |

`sources.json`保存同样路径；相对默认来源均相对仓库根目录，绝对生成来源仅是制作记录，项目资源已实际复制，不依赖本机生成目录运行。

## 实际QA与边界

四图逐张 view：身份和服装保持，完整头发/脸部与活动手势入画，无明显额外手掌/多肢。手指采用卡通简化和自然遮挡，未逐像素锁定，肩线/手臂/衣褶会自然变化。新四态与已批准 coral-bob v2 力度一致；青少年形象保留普通日常装束和原有年龄比例，不成人化。

全部 PNG1254×1254/RGBA/alpha0–255。默认未重做的四套已校验逐字节一致；silver是上述已review修订。alpha>32可见包围盒如下，供检查透明边界；**不要据此逐图缩放/居中**。运行时应同组统一画布尺度、top对齐并contain，后续接入人员仍需在实际A容器检查状态切换和活动手势，不能从静态图宣称零跳位或覆盖所有屏幕。

| 状态 | bbox(left,top,right,bottom) |
| --- | --- |
| default | (279, 20, 1025, 1254) |
| listening | (280, 19, 1026, 1254) |
| waiting | (368, 19, 966, 1254) |
| speaking | (278, 18, 1006, 1254) |

预览图为内置浏览器渲染HTML后的原始JPEG；下排面部放大只用于展示，未修改PNG。人物半身/下垂手的运行时裁切由统一容器控制，不承诺全身始终可见。本套不绑定案件姓名、秘密、职业或心理/道德倾向。完整注册和音色由后续实施owner负责，当前仅交可复用素材。
