# coral-bob · Blender 单角色样片

2026-10-24。用户批准的单人物能力验证，**未批准用于正式产品或扩大到其他人物**。本目录不修改任何现有素材、manifest 或产品代码。

这版用真实三维网格和物体变换构成，保留海军蓝偏分短发、珊瑚三角耳饰/西装、象牙内搭与深蓝裤等身份线索。它是程序建模的卡通玩偶样片，**不是准确复刻原插画或生产级角色**。目前面部与身材比参考更规整、玩偶化，头发仍有分块感，西装与手部简化；这些差距需要用户看样片后决定是否继续，不以“能导出”代替美术验收。

## 先看结果

独立浏览器预览将原始 2D 图与可旋转 GLB 并排显示，并列出真实 Blender 三视角。参考图只由准备脚本逐字节复制，没有裁切、编辑、贴在模型上或上传第三方。

- `front.png`、`three-quarter.png`、`side.png`：最终场景的 Cycles 原生渲染，650×760。
- `listening.png`、`speaking.png`：同一场景 frame 72 / 120 的真实渲染，不是修改 PNG 得到的姿态。
- `coral-bob-sample.blend`：可直接用 Blender 打开的源场景，保存为 frame 1、正面 camera。
- `coral-bob-sample.glb`：可移植网格/材质/动画产物。没有图像平面、角色贴图、外部纹理、骨骼蒙皮或面部 morph targets。

![三分之四视角](three-quarter.png)

## 本地复现

使用用户已经安装的 Blender 5.2.3 LTS，自带 Python + bpy，不需要 MCP 或第三方 Blender 插件。命令须在仓库根执行；应用路径按本机安装位置调整。

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python spikes/coral-blender/create_sample.py
npm ci --prefix spikes/coral-blender/browser --ignore-scripts
npm --prefix spikes/coral-blender/browser run check
npm --prefix spikes/coral-blender/browser run build
python3 -m http.server 5204 --bind 127.0.0.1 --directory spikes/coral-blender/browser/dist
```

在 Codex 内置浏览器打开 `http://127.0.0.1:5204/`。如果 5204 已占用，换空闲端口，别停止别人的服务。只需查看既有结果时不必重跑 Blender；所有源场景和渲染已保存。`browser/prepare.mjs` 在独立 public 目录复制本样片和原始参考，build 将其打入 dist；public/dist/node_modules 均忽略，不修改根依赖。浏览器端不依赖 Blender 正在运行。

控制：待机、聆听、说话按钮切换导出的动画时间段，滑块旋转完整几何。没有麦克风、灵矽、游戏状态、账号、密钥或网络供应商调用。Three.js MIT 许可保留在 `THREE-LICENSE.txt`。

## 动作与生产差距

场景用一个总时间线表示：frame 1–48 待机，49–96 聆听，97–144 说话，24 fps；GLB 导出 3 条物体动画轨道，浏览器同时采样对应区间。头部倾斜、整条左臂旋转和嘴部缩放可动画，但没有肘部关节、人体蒙皮、眼睑、眉毛表情系统或真实中文口型。聆听是简化抬臂，不是精确复刻 2D 的耳侧姿态；说话是周期嘴部动效，不代表音频同步。切换状态未做正式动画混合，重复播放端点可能跳变。

材质为可导出 glTF 的 Principled 基础材质与高 roughness，使用明亮柔和灯光；没有把 Blender 专有 shader 当成浏览器保证，也没有本轮完成的 toon 描边系统。Blender Cycles 与浏览器实时灯光的结果会不同，应分别验收，不把离线渲染当成实时截图。

真实生产尚需：视觉修形（成人比例/非对称 bob/脸部与服装轮廓）、连续拓扑、关节和权重、表情/嘴型形状、动作设计、材质/描边、LOD/合批及减面、低端机与长时内存、角色切换释放和加载失败降级。当前 59 个 mesh 不是优化过的产品资源，不据此承诺三名角色的制作工期或沉浸效果。

## 实际检查与边界

- Blender 最小 cube 保存 .blend 和导出 GLB 先独立成功（probe 产物忽略）；随后本脚本真实保存/导出/渲染成功，未使用图像生成服务或图像编辑脚本。
- 沙箱内首次 Blender 后台启动 exit 139；在获准使用本机 Blender 的正常权限下重试成功 exit 0。这属于执行环境差异，不把首次失败藏掉，也没有安装额外依赖。
- `npm run check` 通过；`npm run build` 成功。JS 587.03 kB / gzip 150.83 kB，Vite 提示单 chunk 超过 500 kB，未隐藏警告或声称已做生产拆包优化。
- 源 GLB 结构检查：59 meshes、63 nodes、3 animation tracks，0 skins，49,308 三角形；准确 bytes/hash 见 `artifact-check.json`。这些数字不代表足够优化或骨骼验收。
- 本地 view_image 已逐张目检正/3⁄4/侧面与两状态渲染，发现并修正初始过曝、耳饰遮挡、领口曲线和说话嘴色/手臂遮挡等有限问题后停止此版迭代。侧视能看到实际头部、鼻子、发型、躯干和手臂厚度；没有声称无穿插或已达可用角色。
- 子代理此次 CUA 只列出外部 Chrome；未违背偏好改用 Chrome，已交 root 在内置浏览器独立验收步骤。浏览器完成情况由 root 的实际结果补充，不以类型检查/GLB 文件存在声称浏览器已通过。

API 依据：本机 Blender 5.2.3 实际 `bpy` 执行与 `bpy.ops.export_scene.gltf`、`bpy.ops.wm.save_as_mainfile` 调用已成功；背景执行方式见 [Blender CLI](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)，API 见 [Blender bpy](https://docs.blender.org/api/current/index.html)。浏览器使用 [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) 和 [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)。具体生产边界承接 `docs/cartoon-3d-investigation.md`。
