# 首页与调查页人物定位

2026-10-30；owner：界面专项（`lie-character-layout`）。用户在版本弹窗Chat提供两张截图并要求修复首页人物组偏侧、高窗口调查人物偏上。本次是既定品牌内的响应式修正，不改变玩法、人物资产或其他页面方向。用户随后在本Chat明确确认“看着可以，推进合入吧”，本版效果已获确认，交总协调审查与串行合入发布；此记录不代表已经上线。

## 原因与修正

首页背景按容器宽度展开，但三个人物的尺寸与left偏移分别写死在多个宽度断点，背景变宽时人物仍留在左侧。现在人物、背景、星星共用一个比例1.65的画面，最大宽560px，以容器中心定位；人物相对画面25%/50%/75%排列。多余的固定left与尺寸断点删除。

外层在矮桌面可随flex空间收缩，内层`home-cast-art`使用可用高度与aspect-ratio同步收缩整组宽度。因此1280×600时图组约380×230，背景与人物一起缩小，不会只压背景高度、把人物裁到胸腰；常规1280×720时约560×339。新增的Application.vue包装只含原来的装饰图组，不接触路由/Logo/版本弹窗或其他逻辑。

调查页原静态图与动画都使用height130%、top0、object-position顶部，大桌面又加top32px。宽高变化后，实际绘制受宽限制，剩余垂直空间集中在下方。现仅调查态img/canvas统一100% contain、中心锚点与中心object-position；去除固定32px覆盖。背景也中心锚定，保持接近正方的构图、最大高度80%，高窗口不无限拉长。结果页使用另外的result-portrait类，本次未改共享AnimatedPortrait或结果页规则。

[资源边界](source-bounds.json)：全部8套default PNG与动画canvas均1254×1254；default alpha顶边0–21px、底边1254px，没有大量透明顶留白。可见人物按各自造型有细微视觉中心差异，不增加个案/预设偏移硬编码。

## 审看与复现

5177由总协调正式分配。实际首页：`http://127.0.0.1:5177/?demo=1`；点击案件并接案可看官方调查页，demo明确使用fake voice。未点击开启对话。

完整可复现夹具：`preview.html`/`preview.js`创建真实CSS像素的iframe，可切19个宽高及首页、3/4/8人调查、8预设静态/动画。首页直接加载实际Application；调查由`scene.html`/`scene.js`加载正式App、正式controller、全部真实预设与合成内容，只有voice为fake。夹具不是新增案件或产品入口。专属源均入库；在`apps/web/tmp/character-layout`建立到`../../../docs/design/character-layout`的临时symlink后访问`/tmp/character-layout/preview.html`，symlink处于忽略目录，不进入产品构建。

## 证据与检查

- 用户问题原图：[首页](reported-home.png)、[调查页](reported-investigation.png)，来源为本Chat2026-10-30附件，不是本轮新验收。附件像素不能证明用户的CSS视口尺寸，尤其可能有DPR/裁图。
- 实际首页：[391×844](home-mobile.png)、[1280×600](home-short.png)、[1920×1400](home-tall.png)；[首页矩阵](home-matrix.json)检查320×700、391×844、620/621、700/701、850/851、900/901、1150/1151（以上断点均900高）、900×600、1136×835、1280×600/720、1440×900、1920×1400、2272×1670共19尺寸。均无横向溢出、图组中心偏差0px，宽高比保持1.65（取整误差小于0.001）。1136×835是补充对应截图可能DPR2比例，不声称用户实际窗口如此。
- [调查矩阵](investigation-matrix.json)在相同19尺寸检查静态形象，图/舞台中心偏差不超过0.008px，无横向溢出；这是盒和contain绘图区的几何证据，结合下方真实可见人物截图判断，不单用盒居中当视觉结论。
- [全部8套动画](presets-animated.png)、[全部8套静态](presets-static.png)在1920×1400正式App内逐人切换并实际截图，源图按舞台区域裁成4×2 QA联系表，未修改人物内容；序号1–8依次为珊瑚短发、阳光小胡子、蓝衣眼镜、银发盘发、灰白胡须、紫衣短卷发、薄荷双丸子、赭黄雀斑。[对应几何](portrait-presets.json)共16记录，均相同contain/center投影；不是播放全部语音/动作状态的全面动画验收。
- [调查391×844](investigation-mobile.png)为8人静态，人物/滚动列表/底栏可达；[1136×835](investigation-1136.png)为3人动画；4人fixture也原生核过人数与首人canvas可见。正式官方三人案实际首页→介绍→接案→[调查截图](official-investigation.png)在1280×720通过，未调用语音。
- `vitest run test/home-presentation.test.ts test/animated-game.test.ts`：12项通过；Web源码/tests `vue-tsc --noEmit`通过；现有tests验证首页内容/入口及动画/静态生命周期，CSS几何通过上面实际浏览器检查。没有用jsdom模拟布局或新增只镜像CSS声明的低价值测试。
- 正式Web build与8预设/121assets生成检查通过；复用本机此前固定编码器及图片优化缓存，未新增网络/provider依赖。Vite既有无扩展名、underline运行时路径提示保留。`git diff --check`通过。
- IAB实际截图与真实iframe视口；无全局viewport更改、storage/真实clipboard/mic/provider/Worker操作。未做Safari/真机或所有动画状态遍历，不把fake voice当真实语音证明。

## 交付与服务

工作树`/Users/nighca/.codex/worktrees/lie-character-layout/lie`；分支`codex/character-layout`；原base `843985977659ce2c78e746436b80b1b544119fe3`。该base只是历史任务起点，用户随后撤回video入Git许可，总协调负责从不含video的main仅cherry-pick本任务新commit；layout不依赖video文件/提交，不整体merge本分支。

服务owner为本专项`/root/character_layout`（发起Chat的完整实施子任务），起前lsof5177空；严格127.0.0.1:5177，Node PID93927，原exec/session49034。启动source为base843加本任务dirty，后续Vite HMR加载最终任务修改，不是clean生产dist。消费者：用户审看与本任务IAB tab1；发起者自有tab2独立review。用户确认效果并要求推进合入后，owner已在原session49034 Ctrl-C停止，exit130；随后实核5177无监听、精确PID93927无进程。发起者亦核对tab2仍为本任务预览后关闭，用户审看消费结束。未触碰5176/5198/5544/8787/8788或任何他人服务。保留WT、refs、ignored独立deps、生成资源、图片cache、dist及临时symlink，不因服务生命周期清理。

总协调持唯一main/push turn；专项仅提交clean任务结果供review，无PR/main/push/deploy。中央project-plan/development由总协调批量维护。
