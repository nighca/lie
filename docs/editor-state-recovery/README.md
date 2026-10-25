# 编辑器状态恢复与预设选择优化

2026-10-25；来源：用户要求安排待办，主协调分派 RSM-01/P2、RSM-02/P3 与预设卡片去名。状态：专项实现、自审与验证完成，待主协调独立审查/集成，未发布。原始基线 `b59a6f53a75a4ccb95adc5b730cd03934368c815`，分支 `codex/editor-state-recovery`，工作树 `/Users/nighca/.codex/worktrees/editor-state-recovery/lie`。依据只读 reviewed source `40260dc1bced8fe50b26cc246c48f1a6f14a8440` 的三 probe，无 cherry-pick 该 review 或其他依赖。

## 实现与边界

- RSM-01：仅在 `/editor` 与 `/editor/preview` 两个内部路由间，以 Vue KeepAlive 保留原 Editor 实例，最多一份。不增加内容快照协议、全局持久化或游戏会话保存。保存失败时原编辑C仍在内存，试玩用C的静态可玩副本，返回继续编辑C，保留步骤/所选人物（同时解决 QA003）。正常离开编辑器/试玩范围时卸载缓存，再次进入按原本单槽草稿读取。
- 改编是用户确认的显式替换：成功写入新的改编稿后增加 Editor key，使缓存旧稿失效；避免试玩结果“我要改编”返回时误显示旧编辑实例。写入失败/取消沿用原逻辑，保留原编辑；既有六组合改编回归继续通过。
- RSM-02：每次复制有递增意图身份。关闭/更换弹窗、分享或投稿内容变化、草稿编辑、编辑器缓存失活均使旧意图失效；完成后的成功与失败提示只更新所属的有效意图。重复点击以最新请求为准。不取消操作系统已发起的复制，不声称可撤销旧 clipboard 写入。
- 预设卡片仅呈现图片，移除可见名称和图下文字间距；以 preset.name 提供 aria-label，保留原 button/aria-pressed/焦点样式，读屏仍可辨认各图。故事人物自己的姓名没有改变。
- 生产仅 Application.vue、Editor.vue、editor.css；不改 App、controller、全局 CSS、Worker、Provider、依赖或存储键。

## 自动验证

- Web 全量 **31文件287项通过**（原281+新增6）；Web typecheck 通过；Web生产build及8 presets/89 assets检查通过。原有 underline.svg 构建时解析提示不变，生成资源仍含该文件。
- 新增导航回归2项：分别在保存成功/失败时修改标题和第二人设定，真实Application试玩静态副本正确，返回保留人物步骤与第二人、新文本；保存失败时storage仍为B而UI为C，失败提示保留。再离开该路由范围后重新进入，读取单槽草稿，证明缓存作用域不会跨页面保留。
- 新增复制回归4项：旧成功/旧失败迟到、新分享内容、相同链接关闭重开、分享切换投稿；旧完成不改变新弹窗成功或错误提示，新请求正常复制当前内容。Clipboard Promise为可控fake，不声称真实浏览器权限时序。
- 原预设回归改按aria-label点击/检查动态目录命名、图片、选中态，无可见名字。既有删除操作仍以可见文案定位。
- 最初全量有一条测试辅助定位只读aria-label导致“删除人物”可见文案找不到，已修为按实际aria-label或可见文案定位；最终全量通过。未修改生产行为迎合旧测试。

## 有界实际 IAB

独立服务5402、自己的tab26；同源 iframe 1004×900 与391×844，仅CSS断点验收，不宣称真实触屏设备。未变更共享viewport、用户8787/8788草稿或其他服务；全程demo，未调用mic/provider/付费。

临时QA页面仅在5402种入官方“空盒里的纪念章”测试稿B，页面上可见开关“仅专项桌面iframe：模拟草稿保存失败”。其load回调仅对desktop iframe的Storage.setItem(DRAFT_KEY)抛QuotaExceededError，其余键正常；app生产逻辑未注入或改写。

1. 桌面改标题为“内存中的编辑C · 保存失败仍应保留”，观察失败提示；切人物步骤，选择顾遥，试玩介绍显示C。
2. 从介绍返回编辑器，仍是故事人物、顾遥已选，仍提示草稿未保存。再切故事设定，标题仍为C。[返回人物](evidence/failed-save-return.png)、[返回后标题](evidence/failed-save-title.png)。本次不刷新/关页，正是RSM-01的内部往返。
3. 两个iframe打开预设选择，8张图片无可见字；391px docscrollWidth=innerWidth=391。DOM每张textContent空、aria-label正确、原选中按钮aria-pressed=true；Space选择蓝衣眼镜后弹窗关闭，故事人物沈禾姓名保留。[桌面与391图片选择](evidence/preset-images.png)。
4. 捕获一条 `Uncaught TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.`，时间2026-10-25 11:37:43.985+08；无来源URL/堆栈，未定位归因，不将此轮描述为console clean，未扩大生产修复范围。此前任务也曾捕获同类记录，本轮不以此证明其来源。

清理：自建tab26关闭，临时public/editor-state-qa.html删除；服务由原exec89431 Ctrl-C退出，最终lsof5402无listener。测试用原型shim随独立iframe销毁，不触碰产品文件。5402只留专项测试稿。工作树保留给主协调review；未 main/push/PR/deploy。

## 主协调审查后生命周期补正

冻结97a1803，追加Editor局部portraitActive激活状态：KeepAlive失活时卸载AnimatedPortrait，走其既有onUnmounted/watch cleanup停止requestAnimationFrame、abort加载与释放renderer；激活返回时重建立绘。只缓存编辑草稿/步骤/所选人物，不使隐藏编辑器动画和试玩动画并行。不改共享AnimatedPortrait接口/全局动画行为或视觉。

新增一项真实KeepAlive生命周期回归，以带mounted/unmounted观测的立绘stub，验证失活释放一次、返回重新挂载、人物步骤与编辑姓名仍保留。该测试验证组件释放路径，不冒称真实GPU或帧率测量。追加后相邻editor-page/navigation共47项通过，Web typecheck通过；未重开服务/浏览器，复用上一版实际UI证据。原全量287/构建结果属于97a1803，root将对追加组合重跑。
