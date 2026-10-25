# 动画人物首次渲染

2026-10-25，用户要求已知有动画的人物从首次渲染就走动画路径，避免静态图切换画布的闪动及无效图片请求。此项已获实施授权；不改变动画素材、人物选择、声音或游戏规则。

## 实现

`AnimatedPortrait.vue` 保留现有 `src/state/label` 接口，新增独立失败状态。仅 `src === null`、系统减少动态（包括能力不可用）或明确加载/渲染失败时挂载静态 slot。正常动画加载期间保留隐藏画布，不挂载静态 slot；首帧绘制成功才显示画布，无固定延时或新 spinner。

在 setup 读取初始 motion 偏好，避免首轮渲染作出错误回退。资源 watcher 同步处理 src、motion 和 canvas 生命周期：切换时先隐藏、取消旧请求/RAF并清空旧画布，现有 active 检查阻止迟到加载发布；继续使用原单一 RAF、visibility 暂停和 unmount 清理。舞台尺寸、静态/首字容错及 Editor 共用组件语义保留。结果页静态图不受影响。

文件归属只有组件、UI测试、Web动画集成断言及本记录/证据；未修改 App、样式、loader、动画包、素材、provider 或锁文件。

## 自动验证

基线 `9316701433ba21017286c7023af5470275c23a28`，分支 `codex/animation-first-render`，工作树 `/Users/nighca/.codex/worktrees/animation-first-render/lie`。Node 24.22.1，锁定依赖离线安装于本工作树。

- UI全套5套43项通过（最终组件状态下重验），其中动画组件12项：deferred首载无slot/img、成功首帧、无动画、加载/绘制失败、motion初始/运行切换、静态与动画互切、快速切换和迟到结果、unmount取消、visibility单RAF。
- Web动画及预设2套35项通过；收敛为单资源 watcher 后再次运行动画集成2项通过。
- UI/Web typecheck通过；Web生产构建及strict输出检查通过，8预设89资源。单资源watcher最终版本再次构建通过；public/dist appearances共90文件（manifest加89资源）逐字节一致。
- jsdom对先隐藏后显示的节点存在可见性缓存，组件单测直接验证 `canvas.style.display`；真实浏览器另验可见动画。没有把mock绘制当作原生动画证明。

## 原生浏览器验收

IAB一次明确返回不可用，按本次授权使用独立Chrome标签页 `1910329550`。5544单Vite demo，transport `http://127.0.0.1:9`，无gateway、麦克风或真实provider。没有进入Editor或读写已有草稿，没有操作其他标签页及全局viewport。

使用CDP仅拦截当前tab的动画package Fetch：

- 从“空盒里的纪念章”接案暂停沈禾请求，舞台只有隐藏canvas，没有img；切到顾遥，旧请求取消，新请求仍仅隐藏canvas。完整网络窗口中有侧栏avatar请求但无舞台default.png。释放顾遥请求后显示原生动画，桌面舞台前后604.6953125×513.40625。
- 将陈拓当前动画请求明确失败，原生页面挂载 `/appearances/blue-glasses/default.png`，尺寸不变；运行切到reduce再选沈禾，静态回退正常。
- 最终源码通过独立同源391px iframe从介绍接案：请求暂停时舞台无img；释放后原生首帧可见，前后舞台148×168。该开局完整网络窗口仅有动画package请求，无default.png；记录无截断、无剩余分页。[精简网络证据](animation-first-render-evidence/narrow-network.json)。临时壳只设置iframe宽高，没有修改产品CSS。

原生截图：[391px加载中](animation-first-render-evidence/narrow-pending.jpg)、[391px首帧](animation-first-render-evidence/narrow-ready.jpg)、[明确失败回退](animation-first-render-evidence/fallback.jpg)。截图未重绘。桌面前两步发生在等价双watch实现，收敛为最终单watch后重新做了失败回退和391px完整首载；最终单watch的快速切换/late/清理由12项组件测试覆盖。不声称跨浏览器、真实provider、所有人物或Editor专项验收。

## 服务与清理

owner `/root/character_preset_migration`；工作树同上，服务启动基线SHA同上（组件任务dirty），唯一Vite监听PID 69515，原PTY/session 74321，端口5544。启动前即时核无监听；消费者仅本次动画验收，结束条件是浏览器验收完成。

完成后原PTY Ctrl-C（shell返回1，Vite已退出），随后 `lsof -nP -iTCP:5544 -sTCP:LISTEN` 及 `ps -p 69515` 均无结果。自建tab关闭，Fetch拦截清空、motion覆盖清空、cache恢复、Network关闭；临时 `apps/web/public/animation-first-qa.html` 删除。无保留服务、无未知进程。用户8787/8788、5355及其他owner端口未操作。只保留Git中的实现/必要证据，依赖和构建产物为忽略文件。
