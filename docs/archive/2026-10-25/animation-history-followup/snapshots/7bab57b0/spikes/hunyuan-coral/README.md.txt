# 混元 coral-bob 绑定小样

用户提供的混元生成模型，局部骨骼动画实验。不是正式游戏资源，也不是宣传视频。

- `coral-bob-gesture.glb`：2.84 MB，单皮肤、7 骨骼、3 个真实关节动画，所有贴图内嵌。
- `speaking-gesture.mp4`：真实 Blender 骨骼变形渲染，25 帧、6 fps、约 4.17 秒，仅用于观察实验动作。
- `renders/`：原模型同机位正面、处理后四视图、动作定格、浏览器截图，以及第一轮失败权重。
- `build.py`：离线导入、纹理缩小/材质整理、粗绑定、动作制作、GLB/Blend 导出与实际渲染。
- `check_glb.py`：验证资源内嵌、皮肤和每个动作确实改变局部关节；`artifact-check.json` 为本次输出。

完整结论见 [`docs/hunyuan-coral-animation.md`](../../docs/hunyuan-coral-animation.md)。

## 本地复现

Blender 5.2.3 LTS 已在本机运行验证。原 28 MB 模型和 4.8 MB Blender 工程不提交仓库；原文件不改动。

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -t 4 --python spikes/hunyuan-coral/build.py -- /Users/nighca/Downloads/3bff789e42b392eee3c3ec6ce850a287.glb /private/tmp/hunyuan-rebuild
python3 spikes/hunyuan-coral/check_glb.py /private/tmp/hunyuan-rebuild/coral-bob-gesture.glb
```

本次可编辑工程保留在 `/private/tmp/hunyuan-experiment/coral-bob-gesture.blend`，打开后选好“说话手势”NLA轨道、帧范围 1–49，空格播放；不需要插件或新工具。其他轨道可在 NLA 编辑器切换静音。

```sh
cd spikes/hunyuan-coral/browser
npm ci
npm run check
npm run dev
```

独立页 `http://127.0.0.1:5206/`，只读取本地衍生 GLB，无网络第三方调用。构建用 `npm run build`。`node_modules`、`dist`、复制到 `public` 的重复模型不入库。

重新生成观察用视频（已有 FFmpeg）：

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b -t 4 --python spikes/hunyuan-coral/render_motion.py -- /private/tmp/hunyuan-rebuild/coral-bob-gesture.blend /private/tmp/hunyuan-frames
ffmpeg -framerate 6 -pattern_type glob -i '/private/tmp/hunyuan-frames/*.png' -c:v libx264 -crf 23 -pix_fmt yuv420p -movflags +faststart /private/tmp/hunyuan-motion.mp4
```
