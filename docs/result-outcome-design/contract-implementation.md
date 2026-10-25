# 结果人物契约与播放组件：第一阶段实现

2026-10-25。状态：已实现与自动检查，待发起者实际审查、串行本地集成；尚未接入结果页、制作新角色素材或进行视觉验收。用户已批准统一结果视觉方向 R；本记录不将技术测试或原四态验收当作两套新人物反应素材验收。

## 边界与来源

- 实现 owner：动画专项的 `result_contract_audit` 子任务。
- 原始 reviewed base：`48316544ea9fd22afbf1eee8db6f81e326026821`。
- 独立 managed worktree：`/Users/nighca/.codex/worktrees/result-reaction-contract/lie`。
- 唯一任务分支：`codex/result-reaction-contract`。
- 不依赖其他尚未集成提交；只扩展 runtime、portrait 组件、预置源规格/生成器/reader 和测试。
- 未更改 App/style/Application/controller/Editor、正式或候选角色包/PNG、源 manifest.json、依赖与锁文件。
- 本阶段不创建 PR，不推送/更新 main，不启动浏览器、临时服务、麦克风、provider 或付费工具。

## 正式数据契约

动画 JSON 仍是一份共享 assets/nodes/clips 的形象包。`schemaVersion:1` 继续严格只接受四个基础状态；新 reader 接受 `schemaVersion:2`，四基础状态仍必需，另允许各自独立可选的两个结果状态：

```json
{
  "schemaVersion": 2,
  "states": {
    "default": "idle",
    "listening": "listening",
    "waiting": "waiting",
    "speaking": "speaking",
    "accusedCorrectly": "accused-correctly",
    "accusedWrongly": "accused-wrongly"
  }
}
```

以上仅为局部示例，实际包仍需 canvas/assets/nodes/clips/transitions。结果 clip 必须存在且 `loop:false`，沿原 sampler 末帧钳制，不能用 null 或未知状态/clip。第一版 transition 端点仍只接受基础四态，结果动作由自身 clip 表达。公开的 `animationStates` 保持四基础态语义，新增 `resultAnimationStates`；类型分别为 `BaseAnimationState` / `ResultAnimationState` / 两者并集 `AnimationState`。32 个素材和 32 Mi 总像素预算不变。

`AnimationTimeline.finished` 表示非循环主 clip 到末帧，transition 尚在播放时不算完成。constructor/setState 拒绝不存在的状态，不修改当前有效状态；重复设置同态不重播。没有新播放器、另一份动作映射或规则状态。

预置源 `portraits` 增加两个可选字段：

```json
{
  "portraits": {
    "accusedCorrectly": "assets/<id>/accused-correctly.png",
    "accusedWrongly": "assets/<id>/accused-wrongly.png"
  }
}
```

旧 listening/waiting/speaking 仍必需。每张新图必须是对应固定路径的真实 PNG，与 default 画布一致；显式 null、其他文件名、缺失文件均不能通过正式生成。包映射某个结果态时必须有同名结果静态图；仅静态角色可以独立提供一张或两张结果图，无需动画。没有要求旧角色补齐两态。

生成 public URL 为 `/appearances/<id>/accused-correctly.png` / `accused-wrongly.png`。现有 reader 为新增字段归一 null；`CharacterPreset` 的新字段类型保留 optional，以保持已有直接构造预置调用兼容。调用者使用 `preset.portraits[state] ?? null`。静态图与动画终态一致性由素材制作/实际审查保证，生成器不冒充图像语义检查。

## 组件使用与一次生命周期

```vue
<AnimatedPortrait :src="preset.animation" state="accusedCorrectly" fit="contain">
  <!-- 应用负责：对应终态图 -> default -> 姓名首字；错误时只用被指认者。 -->
</AnimatedPortrait>
```

- `fit` 为 `crop | contain`，默认 crop 完全保留调查页 130% 高度策略。contain 仅把 canvas 高度设为100%、居中到底，不修改全局舞台。
- 结果态从加载开始展示 slot，成功后显示 Canvas；旧包缺该态、资源或 renderer 失败都显示 slot，不播放 default 动画冒充结果。原四态加载期间空舞台行为不变。
- 一次消费标记是当前已挂载组件里的一个布尔值：结果首次实际绘制后标记已消费；初始或中途开启 reduced-motion 也消费此次动作。关闭 reduce、修改标签、相同 state 重渲染或已播放后修改 src 均不重播；slot 负责静态终态。
- 到非循环末帧后保留 canvas，停止 RAF；隐藏后恢复仅继续未完成的现有 timeline，首个恢复帧 delta 为0，不补算后台时间。完成后可见性事件也不重启 RAF。
- 离开结果阶段必须卸载该展示组件；下一局新组件可以播放，即使人物与正误值相同。显式切换结果状态将开启新状态展示。无全局消费记录、案件结果 ID 或泛化 episode 系统。
- 延迟加载、替换src、reduce、卸载继续沿原 onCleanup/AbortController 隔离；没有语音/声音副作用。

## 资源发布链

不改 `apps/web/build/static-assets.mjs` 算法：其现有 `Object.keys(preset.portraits)` 自动改写两结果图 URL。每张静态图独立 SHA-256，动画目录（包及所有 parts）统一 hash，最终 manifest 再 hash；包内 parts 仍相对路径。更新结果静态图只改变对应图及 manifest；更新共享结果部件改变整个包目录及 manifest。

新运行时同时读取旧 v1 与新 v2；旧运行时会拒 v2，按原失败回退处理。生产沿既有不可变 manifest/包 hash 发布，旧构建持有旧资源链；不覆写旧 immutable URL。开发 canonical URL 仍存在，不声称旧运行时可直接消费 v2。

## 实际自动检查

Node：24.22.1（现有工具链）。只在本 worktree 生成 ignored public/dist 与测试缓存，依赖复用本机已有安装；本地 node_modules/@lie 指向本 worktree，避免误测 main 的实现。

| 检查 | 结果 |
| --- | --- |
| character-animation 2文件 | 43 tests 通过：v1/v2、独立可选状态、缺态、非法循环/transition、末帧保持与重复同态、原加载/渲染/预算 |
| UI 5文件 | 52 tests 通过：结果加载与缺态静态、非循环停帧、初始/中途reduce后不重播、新挂载可播、隐藏恢复、不重播src/标签更新、延迟加载失败/卸载，以及原四态（含非循环基础态完成后切态恢复RAF） |
| source generator | 23 tests 通过：原静态/动画、可选结果图、资源/路径/画布、结果动画必须有对应图、生成/check相同 |
| Web 31文件 | 292 tests 通过，包含 reader/hash/旧分享草稿兼容、现游戏/编辑器/结果场景；结果页尚未消费新两态，不宣称该页面新结果集成已测 |
| workspace typecheck | gateway/web/character-animation/game-core/UI/voice 全通过 |
| Web build + postbuild check | 成功，95 modules；现有8人89 assets，canonical源与dist生成一致 |
| git diff --check | 通过 |

首次直接运行兼容测试因新 worktree 缺 ignored public/appearances/manifest.json 导入失败；按正式生成器先生成原8人89资源后，相关3文件50 tests及完整Web292 tests通过。没有改用其他清单或跳过失败。build 的既有 underline.svg 静态引用提示仍保留，构建成功并输出对应 fingerprint 资源。

实测命令（使用本机 Node24 路径或 PATH）：`node --test scripts/character-presets.test.mjs`；`node node_modules/vitest/vitest.mjs run --root packages/character-animation --config vitest.config.ts`；相同命令 root 为 packages/ui、apps/web；`npm run typecheck`；`npm run build --workspace @lie/web`。

## 限制与后续 owner

本阶段没有新结果 PNG、正式 v2 角色包或浏览器截图；DOM/RAF 测试不证明新素材视觉、真实后台节流或结果页真实集成。发起者负责珊瑚短发两态样片、结果页UI及其真实组合验收。运行时 loader 与 Canvas renderer 算法未改，现有四态资源字节未改。候选需发起者读完整 diff/提交并由唯一 integrator 串行集成。

服务：本任务未启动、保留或停止任何进程，无端口/PID/PTY/消费者；未操作8787/8788或他人tab。ignored node_modules/public/dist/cache 为本地可重建依赖与输出，不是交付证据唯一副本；所有必要实现、测试与此记录纳入提交。
