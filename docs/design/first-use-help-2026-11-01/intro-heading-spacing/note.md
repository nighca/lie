# 接案标题与手绘下划线间距

2026-11-01。用户希望下划线更接近标题、些许重叠，同时标题与正文稍远。基线`217e6a5dfb4f98cac477397098ba227d2a6afa5a`，本轮产品只改style.css两条介绍页范围规则：标题margin-bottom由24px改36px；下划线bottom由-10px改0，上移10px。宽52%、高12px、颜色/素材/角度不变，不改结果标题或其他界面。

在同一5544真实应用的新建Chrome专属tab`1910332641`，只用DEV demo的《消失的纪念章》。实际查看[1280桌面原生clip](desktop-title-native-clip.jpg)、[391窄屏](narrow-391.jpg)与[320窄屏](narrow-320.jpg)：下划线贴近字底，末端有轻微视觉交叠，没有明显盖住笔画；正文与标题更分开。此判断来自原生截图，不把伪元素盒的位置等同于字形轮廓测量。

三宽度computed pseudo bottom均0，标题margin-bottom与实际标题盒到正文盒间距均36px，较原相邻margin折叠后的24px增加12px；scrollWidth分别等于1280/391/320。该案两窄宽标题维持一行（高度约40.8px），文字/卡片/按钮无溢出或重叠。[完整量测](measurements.json)。截图magic核为真实JPEG/.jpg，无自行图像编辑或重编码。

纯CSS调整，未跑镜像unit/tests、types或build；`git diff --check`通过。style.css SHA-256为`a7df1d2dd9d66ffc78c93a4ff5eaa4883e588e6f74465f5ab0a88f78b0c49a01`。未修改App、文案、游戏或语音逻辑。

自建tab已关闭、viewport reset，console warn/error为空；未操作用户正常tab或真实provider/mic/storage。5544沿用原Web PID64673/PTY63756，仅正常CSS HMR，无启停或新服务，用户consumer保留。未stage/commit/main/push，交主代理实际review具名提交。
