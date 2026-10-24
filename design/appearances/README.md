# 正式预置形象库

`manifest.json` 是唯一权威清单；正式素材统一在 `assets/<id>/`。故事角色只通过稳定 `appearanceId` 引用预置；形象展示名不是案件姓名，颜色和表情不表示可信度或罪责。

字段规格见 [`manifest.types.ts`](manifest.types.ts) 的 `AppearanceManifestEntry`，每个字段均有注释。源JSON通过Web类型检查中的静态契约核对；路径格式、唯一性、PNG尺寸和文件存在性由生成器进一步校验。前端运行时的 `Appearance` 是另一层契约，不应拿其可空资源容错作为正式素材可缺项的依据。

## 新增或修改一套形象

1. 在 `assets/<id>/` 放入 `default.png`、`listening.png`、`waiting.png`、`speaking.png`。头像与默认图相同时直接引用default；确有独立头像时另放 `avatar.png`。
2. 只修改本目录 `manifest.json`：填写 `id`、中文 `name`、`accent`、已授权配置的 `voiceId`、`avatar`、`portrait` 和三项 `portraits`。所有素材路径都相对此目录，固定为 `assets/<id>/<状态>.png`。
3. 执行正常的 `npm run dev` / `npm test` / `npm run typecheck` / `npm run build` 即会自动生成。单独准备静态原型素材时运行 `npm run appearances:generate`；运行中修改源后重新生成并刷新或重启dev。

新增形象不修改业务代码或第二份清单。缺中文名/声音/状态、重复ID、资源缺失、状态画布不一致等会报错，校验失败不会改写已有生成物。中文名由前端直接消费；声音配置齐全不等于已完成真人试听。

## 生成物与兼容 URL

`apps/web/public/appearances/` **不纳入Git，是生成物**，包括应用manifest和图片，不可手工维护。标准Web npm生命周期覆盖根命令及直接workspace命令；build结束再逐字节检查实际dist产物，陈旧、缺失或多余文件会阻断构建和持续部署。`npm run appearances:check` 只检查、不修改；首次clone可先运行generate，缺少生成物不是另一份制作任务。

当前8套保留已有运行时URL，避免破坏历史设计和原型引用。源清单的可选 `publicDirectory` 和 `publicAvatar` 只控制这些兼容输出位置；新形象可不填，默认输出 `/appearances/<id>/default.png` 等。正式源路径始终保持统一目录，不随兼容URL变化。

当前正式库8套均有4态、voiceId和中文name。迁移复制已审阅的运行时原图，不缩放、裁切、重生成；32态图及3个独立头像逐字节一致。其他5套的avatar复用default，不再复制相同PNG。原先平铺 `assets/*.png`、`state-studies/`、`expansion-complete/`、prompts和sources.json均保留为历史出处，不能据旧批次的“仅默认图”描述推断当前正式能力。

## 本次迁移验收（2026-10-24）

- 对比迁移基线 `a0c4b3d`：运行时清单除新增 `name` 外完全相同，35张唯一PNG的SHA-256均一致；旧URL、voiceId、主题色及状态映射不变。
- 根目录 `npm run typecheck`、`npm test`（255项，包括18项生成器测试）、`npm run build` 通过。删除生成目录后从标准Web dev命令启动，自动补齐8套35图；最终dist逐字节校验通过，网关直接使用该Web dist。
- 视觉负责人独立用Codex内置浏览器只读检查5364编辑器：8个中文形象标签与对应ID正确，logo及8张默认图全部加载，未捕获console warn/error。当前浏览器画面仍为既有编辑器，不包含另案待实现的三步交互；动态未知ID名称变更由组件测试覆盖，不把这次只读检查当作来源机制的独立证明。未使用麦克风或付费语音。

以下保留历史生成提示、初稿范围及QA。当时的相对路径、手工交接或未制作状态等说明属于旧批次；当前接入以上述权威清单与自动生成流程为准。

## 历史生成记录（来源留档）

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

本批新增三张均为 1254×1254 RGBA，分别约 0.97 MB、0.97 MB、0.94 MB，均为默认静态立绘。保留原始 PNG，不新增动画、状态矩阵或业务字段；现有三套 ID 和图片保持不变。

## 历史批次 QA 与限制

- 已逐张 `view_image` 检查成人造型、人物数量、轮廓、手部和边界，无文字、UI、道具或剧情线索；三人使用相同头至大腿构图、深蓝线条和静态友好表情。
- 使用 Pillow 只读取 PNG 尺寸、模式和 alpha 信息，不做图像修改。PNG 为 RGBA，alpha 最小值 0、最大值 255，背景存在实际透明像素。
- 三张实际尺寸均为 1254×1254（生成请求中的 1024 只是构图意图，工具实际输出以此为准），分别约 0.87 MB、0.96 MB、0.86 MB；未缩放压缩。原始文件保持不变，后续性能需要时再由集成者选择合适交付格式。
- 少量半透明边缘属于生成素材的抗锯齿；不把透明显示底色当作图片背景。不同背景和实际头像容器的浏览器组合效果仍由集成时验收。
- 图像为栅格插画，不是可编辑矢量源；色块存在轻微明暗，不要求每个像素严格等于主题色 token。主题色以 manifest 为准。
- 本轮不承诺动画、动态口型或各语音状态专用姿势。未来需要时可沿用相同 ID 扩展资源，先讨论具体需求。
