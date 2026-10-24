# 灰白胡须与紫衣短卷发正式动画接入候选

2026-10-25。从 reviewed main `596866140893ed08f5bc247c6fd8758947a85003` 准备。用户已授权银发之后人物由团队实际验收后交主协调正式接入；不把用户未在线当验收。本分支尚未集成main、push或部署，不包含银发待集成资源或依赖。

## 来源与资源边界

两个来源均从 `62b3846eecce8e902cd8bfe1764c87a337551e4b` 开始，无额外runtime依赖：

- gray：`bb4fbd3a02a1951500528d1f919dd928132bc885` → `2a2b619511499b8e305f73a518b7bb0991a42de2` → `fbc147191234a61e4063e55fda62557bac5224f1` → `33e7e2670317b9b0d65a847cbcb52b6edaa4c554`。实际桌面四态25/75、肩腋/腰袖局部与正式AnimatedPortrait作者页实播记录见候选initiator-review及gray-final/gray-live-final原生图。
- plum：`cea0307acaf7bb598bb60355d1500f5010f01aad` → `66e6a390a364bcde4220e389dd1e72926f3a10d3` → `31111b6f3fc9af51ffbbf34858cf1c53c5afd9a2` → `b91dfccec7dee2996687eed154313927cf8cebe8`。实际桌面1s/3s、颈部/肩帽/手指/腰袖与Canvas作者页播放/100ms中断记录见initiator-review和plum-extrema/shoulders-cap/waist/live-final原生图；作者页不是游戏Vue组件。

正式源分别是 `design/character-presets/assets/{salt-pepper-beard,plum-crop}/animation/package.json` 和各自引用的五份PNG，全部原字节复制；manifest仅这两条新增animation引用。原八份静态四态图和头像引用均不变，未动其他人物、UI、runtime、引擎、案件或命名。plum作者inspection.html另以独立commit将唯一runtime绝对import改为当前工作树相对路径，不扩大Vite文件访问范围。

| 角色 | Package SHA256 | PNG/节点 | 画布+活动纹理像素 | PNG压缩字节 |
|---|---|---|---:|---:|
| gray | `5ab6cc080aa9a09aefc6df88da131fd8c2c7fb0c57f4de26307dc20064c42a64` | 5 / 23 | 9,435,096 | 4,235,793 |
| plum | `5e67782c83fa5b73c04dd91ae1da8eeb1d4d0489c63f898756fb200b3b2b44a6` | 5 / 15 | 9,435,096 | 4,129,783 |

五PNG均1254² RGBA；单包低于严格解析器33,554,432预算。gray只有一次内置生成裤补底、仅用y>=935，头颈/肩袖仍canonical；plum只有一次内置生成无嘴头，嘴使用canonical裁剪。来源prompt/native输出/hash在各自候选目录，未改PNG像素或重采样。plum生成头/中性目光与原四态不逐像素相同，已在作者实际视觉复核中说明。

## 运动及自动验证

两者waiting均为固定腰以下，上身/头/接触臂纵向±0.6%呼吸；gray锚y915、plum锚y850，各17正弦key，无整体横摆。其他三态分部运动保持。plum讲话肩帽固定在body-root，以同源20px重叠衔接转动手臂；gray讲话有独立原生衣摆窄片，避免袖片带出衣摆黑尾。嘴为合成时序，无真实音素同步、自然抬放transition、眨眼或网格变形；专用附件即刻显隐，数值沿既有settle衔接。

本执行侧Node24.22.1完成两份严格脚本：各960有限采样、四loop、嘴/附件互斥、canonical/native hash、100次未完成settle中断逐node逐通道连续；gray另有241个full-parent等待固定腰及下巴接触样本。只读预审额外对同hash的plum实际执行241个full-parent下身/腰锚固定检查通过。两份原generator在临时目录执行，JSON逐字节一致，未写回源候选；plum临时复制五PNG也原字节保持。

全仓372测试、全仓typecheck、Web/gateway build通过；public/dist严格资源check为8人物/72资源。各包六文件候选→正式→public→dist逐字节/hash一致；八旧静态图source/public/dist对比base均不变，manifest除两个animation引用外一致。既有通用加载失败/静态回退/减少动态/卸载与状态映射测试属于替身自动化，不替代这两个角色的游戏内IAB验收。

没有重复耗时的全套Python alpha扫描；已读完整实现和源QA结果、核原图/最新原生证据。gray的八neutral局部区域alpha零漏点、七同源描边零差异；讲话右侧122个异源描边差异仍保留，不能写成122个洞或完整coverage通过。plum审计使用完整父链/继承显隐、32相位和nearest-alpha；71,136内部不透明探针、192肩探针属于固定有界区域。独立检查其每个源选区实际非空（每相位212—408源点）。上述都不证明全canvas、所有过渡帧、最终颜色重影/外轮廓/Canvas抗锯齿或真语音。

## 391来源记录与正式IAB交接

来源owner已clean追加gray `5c02f2203b8aca411a0bd8155599e864da1a8f9c` 与plum `00881f691140ae14042fc3f3fa90ffc8347549cc`，本分支已review并各纳入一次；仅文档和八张原生391图，没有包/PNG变化或临时HTML壳。记录各角色同源iframe内部391检查：innerWidth=scrollWidth=391、四态真实点击、完整头手衣摆与无横溢出；gray canvas宽355、plum宽351。本执行侧阅读证据，不把他人的浏览器操作写成自己完成，也不把iframe当顶层移动设备/真机touch验收。每个QA壳捕获一条无source URL的 `MutationObserver.observe` 非Node异常，直接作者页此前console空；异常来源尚未查明，不臆断属于壳或产品。正式顶层游戏console必须另测。

独立服务 `http://127.0.0.1:5505/?game=duck-finale&demo=1`：第一人任爷爷为gray、第三人贺宁为plum；demo不使用麦克风/provider。作者工具位于同端口 `/@fs/Users/nighca/.codex/worktrees/gray-plum-activation/lie/design/animation-candidates/salt-pepper-beard/qa.html` 和 `plum-crop/inspection.html`（后者支持 `?phase=extrema&detail=shoulders|waist`）。

待可用IAB专项：顶层桌面/391四态、等待固定腰下和头手接触、极值肩腋/掌下/腰袖、换人卸载与恢复、减少动态静态回退及恢复、阻断各自package失败回退与解除、隐藏/恢复、console特别核对上述壳异常是否重现。1280×720既有舞台裁切与素材缺陷区分记录；PointerEvent模拟不作真机touch证据。结束清阻断/模拟、reset viewport并关闭自建tab。本执行侧未占浏览器或调用mic/provider。
