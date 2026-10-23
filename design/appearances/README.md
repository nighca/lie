# 预置形象素材 v1

依据用户已确认的中文 B 方向：明亮黄蓝、深蓝轮廓、亲切成人卡通。形象是可复用外观，不是案件角色；资源不含姓名、职业、秘密、真伪或罪责状态。案件通过 `appearanceId` 选择形象。

## 使用

`manifest.json` 是交接清单；`avatar` 和 `portrait` 均是相对此目录的 PNG 路径。集成者复制 `assets` 到应用静态目录后，将路径解析为站点 URL。首版与后续扩充均保持稳定 ID：

| ID | 外观 | 主题色 |
| --- | --- | --- |
| `coral-bob` | 深蓝短发、珊瑚外套的成人女性 | `#FF665B` |
| `sunny-moustache` | 宽脸、小胡子、黄色上衣的成人男性 | `#FFCF43` |
| `blue-glasses` | 瘦高、圆眼镜、蓝色服装的成人男性 | `#075BFA` |
| `silver-bun` | 银发盘发、水蓝开衫、圆润体型的年长女性 | `#78DDD7` |
| `salt-pepper-beard` | 灰白短发短胡须、珊瑚套头衫的年长男性 | `#FF665B` |
| `plum-crop` | 深肤色短卷发、紫色卫衣、紧实体型的年轻成人中性外观 | `#AFA0F5` |

头像与立绘共享同一张透明 PNG，无额外下载。立绘使用 `object-fit: contain; object-position: center bottom`。头像容器使用 `overflow: hidden`，内部图片从上部取景；建议图片宽高为头像容器的约 240%，`max-width: none`，居中定位并用 `top: -3%`，覆盖容器的底部区域。不能仅用同宽正方形图片的 `object-fit: cover`，那会仍显示整个人物。最终按各容器比例在浏览器里检查头发、眼镜和下巴；这属于 CSS 展示裁切，不修改原 PNG。

默认立绘为头部至大腿的静态插画，画布底边自然截断裤腿，不是完整全身。只覆盖默认展示；聆听、等待、说话的文字/图标由 UI 表达。没有动作矩阵、动画 SDK 或撒谎状态。主题色用于视觉区分，不能代表可信度。

## 生成记录

2026-10-23，使用内置 `image_gen.imagegen`，三个请求均设置 `transparent_background: true`。未用 CLI、程序绘制、脚本裁图或去背景；复制工具原始 PNG 后保留 alpha。实际完整提示词见 `prompts/`，均为 `stylized-concept`。

1. `coral-bob`：参考 `../styleboards/playful-zh-b.png`。原始输出 `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-3e494097-6106-4df0-b9fa-d0b704aa62a0.png`。
2. `sunny-moustache`：参考已批准 B 风格板及首张 coral-bob，锁定线条、比例和构图。原始输出 `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-86ee530d-2ab8-420b-ba8d-a440f08da175.png`。
3. `blue-glasses`：参考已批准 B 风格板和前两张形象，保持同一套素材的轮廓和比例。原始输出 `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-b6fba487-b26b-44cb-8766-e6982c187bd9.png`。

默认生成目录只是来源记录，应用不应引用它；所需文件均保存在本项目。

### 形象库扩充

2026-10-23，继续使用内置 `image_gen.imagegen`、`transparent_background: true`，不修改既有三套 ID 或 PNG。扩充只是可见外貌差异，不指定心理、道德、故事身份或性别认同；manifest 不增加业务字段。

- `silver-bun`：参考 coral-bob 和 sunny-moustache。年长女性、银发盘发、圆润体型、水蓝开衫；保留自然年龄细节，不将年龄画成衰弱符号。实际 prompt 为 `prompts/silver-bun.txt`；原始输出 `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-8d591f09-4933-4f4f-966d-c9141cff28c2.png`。已 `view_image` 检查轮廓、手部、无文字道具、与现有插画一致。RGBA 与真实透明 alpha 已读取核对；底部自然截断裤腿。
- `salt-pepper-beard`：参考 sunny-moustache 和 silver-bun。年长男性、灰白短发短胡须、自然面部细纹、珊瑚套头衫；不预设案件身份。实际 prompt 为 `prompts/salt-pepper-beard.txt`；原始输出 `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-3f3a4766-aa5b-490b-8c63-378b9dba9d0f.png`。已逐张 `view_image` 检查，五官、手部与头部完整，颜色与轮廓符合现有插画。RGBA/透明 alpha 已核对；无脚本图像修改。
- `plum-crop`：参考 blue-glasses 和 silver-bun。约二十岁的年轻成人中性外观，深肤色、短卷发、雀斑、紧实体型与紫色卫衣；外观不预设角色性别认同或心理。实际 prompt 为 `prompts/plum-crop.txt`；原始输出 `/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-49a9b805-aeea-4f4a-a6d0-c336b865c7d1.png`。已 `view_image` 检查成人比例、轮廓、手部、无文字道具及跨图一致性。RGBA/真实透明 alpha 已读取核对。

本批新增三张均为 1254×1254 RGBA，分别约 0.97 MB、0.97 MB、0.89 MB，均为默认静态立绘。保留原始 PNG，不新增动画、状态矩阵或业务字段；现有三套 ID 和图片保持不变。

## QA 与限制

- 已逐张 `view_image` 检查成人造型、人物数量、轮廓、手部和边界，无文字、UI、道具或剧情线索；三人使用相同头至大腿构图、深蓝线条和静态友好表情。
- 使用 Pillow 只读取 PNG 尺寸、模式和 alpha 信息，不做图像修改。PNG 为 RGBA，alpha 最小值 0、最大值 255，背景存在实际透明像素。
- 三张实际尺寸均为 1254×1254（生成请求中的 1024 只是构图意图，工具实际输出以此为准），分别约 0.87 MB、0.96 MB、0.86 MB；未缩放压缩。原始文件保持不变，后续性能需要时再由集成者选择合适交付格式。
- 少量半透明边缘属于生成素材的抗锯齿；不把透明显示底色当作图片背景。不同背景和实际头像容器的浏览器组合效果仍由集成时验收。
- 图像为栅格插画，不是可编辑矢量源；色块存在轻微明暗，不要求每个像素严格等于主题色 token。主题色以 manifest 为准。
- 本轮不承诺动画、动态口型或各语音状态专用姿势。未来需要时可沿用相同 ID 扩展资源，先讨论具体需求。
