# 持久化分享：交互原型

2026-11-01。状态：整体存储方案已获用户批准，UI交互原型待用户评审；没有正式接线、创建存储桶或上线。基线为 `a8be75823ceb67966390b5534d725a3a8bf1505b`，方案来源为专项 `docs/share-storage-design.md`（设计依赖至 `ad7bfb32b37d076688cec8243266a84f5c6fcca6`）。

## 范围与体验

独立Vue/TypeScript原型在 `design/share-storage-demo/`，复用现有ProductHeader、UiButton、EditorDialog及编辑器/游戏样式，沿用已确认的中文B视觉。未改正式Editor/Application、UI公共组件或其他专项文件。

按用户后续反馈修订：作者从现有第三步结局页点击「分享案件」立即打开同一弹窗，弹窗内显示保存中、失败或成功；不在底部按钮展示等待或在页面底部另报接口错误。成功弹窗按用户最新精简反馈仅保留「把谜题交给朋友」标题、链接与复制操作组、合并小字说明三组信息；去掉成功提示句、可见字段label（保留aria-label）、独立快照段落、分隔线与分离的存储说明。保存中、失败使用准确的将来时说明，编辑页不显示。不增加确认弹窗或发布流程。网络或服务失败在弹窗内提示，并给「重试」「继续编辑」；草稿保持。超限也在同一弹窗提示精简内容，仅给「继续编辑」。等待期间可关闭弹窗，模拟计时器随之停止，迟到结果不重新打开弹窗；不承诺真实请求因此没有保存。弹窗不增加Demo导航，接收方体验从外部工具栏切换。

玩家打开时展示加载，随后沿现有接案页展示案件与人物。网络错误可重新加载，不存在时提示向作者确认链接，支持返回首页。不会自动进入语音或申请麦克风。

原型上方灰色工具栏仅用于切换作者/玩家和模拟成功、网络失败、服务不可用、超过1MiB、案件不存在等场景，**不是产品UI**。所有存储结果、已保存草稿提示和等待均为模拟；编辑仅在内存中，刷新重置示例。示例短链不能作为已上传或可公开打开的真实案件；「开始调查」、其他编辑步骤、投稿等不接真实流程。复制按钮使用浏览器真实clipboard API，失败时提示手动复制。

## 运行与验证

使用根锁定依赖，不新增依赖或package-lock修改：

```sh
npm ci
node scripts/character-presets.mjs
node node_modules/vitest/vitest.mjs run --config design/share-storage-demo/vitest.config.ts
node node_modules/vue-tsc/bin/vue-tsc.js -p design/share-storage-demo/tsconfig.json --noEmit
node node_modules/vite/bin/vite.js build --config design/share-storage-demo/vite.config.ts
node node_modules/vite/bin/vite.js --config design/share-storage-demo/vite.config.ts --host 127.0.0.1 --port 5177 --strictPort
```

检查使用已有Node24.22.1运行时。初次npm ci使用shell默认Node24.17发出engine警告，安装成功，后续类型/构建/服务均用24.22.1；没有修改任何全局Node配置或执行audit fix。独立原型无需应用全套测试。

- 类型检查通过；Vite生产构建通过。编辑器CSS按原组件同样使用scoped方式，构建无deep选择器警告。
- IAB默认1280×720及390×844检查：分享等待、成功弹窗、真实复制成功、关闭弹窗、网络失败保留文本、手动重试成功、服务暂不可用、超限、玩家加载/接案/不存在/网络错误及重试。390px页宽无横向溢出。
- 本次仅验证模拟UI，不证明R2读写/体积边界/真正超时或云端可用性。剪贴板失败分支有文案，未通过改权限人为触发。
- 预设图片使用现有生成目录，无新增素材；构建产物与生成资源不入Git。必要截图见 [evidence](../design/share-storage-demo/evidence/)。

## 服务登记（供总协调批量更新）

- owner：`/root/share_ui_demo`，发起专项Chat `01a194d9-e260-7cd2-a8df-89b1478a1120`；端口5177由总协调分配，仅本原型使用。
- worktree：`/Users/nighca/.codex/worktrees/lie-share-storage-ui-demo/lie`，branch `codex/lie-share-storage-ui-demo`。
- 启动源码：基线a8be758＋本原型未提交文件；提交后服务沿同一原型源码HMR，最终SHA见交付回执，不把初始dirty冒称clean构建身份。
- listener PID：29883；原始exec session/PTY：99739。命令为上述Vite命令，实际node为`/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node`。
- consumer：用户交互设计评审；入口 `http://127.0.0.1:5177/`。子agent隐藏IAB负责验收，root另开可见tab供用户审看。
- 停止条件：用户释放评审consumer后由本owner在原session Ctrl-C，随后核listener与精确PID退出；当前保留供用户审看，不停止未知进程。未操作8787/8788、5544、5198或真实gateway。

正式接入须等本轮UI获得用户反馈后再实施；此原型代码不直接复制为完整游戏编辑器实现。

## UI修订记录

用户要求保存接口的等待及异常统一在分享弹窗中，已替换初稿页面按钮等待/外部错误展示。`c4ee640e0691b36d429051f8df5307e2f0669c3a`保留初稿历史，当前截图和代码为修订版；不改正式产品或额外部署。

修订验收：子agent本轮IAB工具不可用，经协调使用新建专属Chrome tab验收，未操作root可见IAB或用户其他tab。桌面保存中→成功、网络失败→弹窗重试、等待中关闭后迟到结果不重开；390×844失败→继续编辑、超限仅继续编辑、保存中→成功均通过。390px无横向溢出，console无warn/error。验收后重置viewport、关闭此Chrome tab，5177原服务继续保留。截图新增share-loading与share-error的desktop/mobile对照，覆盖成功/超限的旧图；初稿图仍可从c4ee历史追溯。

用户再次明确将存储说明从编辑页移入分享弹窗：当时说明移至状态和操作区之后；本轮进一步移除分隔线并合并说明，所有分享状态仍共享一次，未增加任何确认步骤。此修订追加提交，不改已交历史。Chrome专属验收页已核桌面/390×844等待、失败、成功和超限状态，说明均在弹窗内仅出现一次，编辑页不显示；移动无横向溢出。截图已同步更新，验收tab关闭且viewport重置；类型/构建检查通过，原5177服务继续供用户审看。

用户认为成功弹窗信息类别与样式过多，本轮合并为三组；等待去掉重复副句，失败去掉重复的草稿保留段落，保留原因与重试/继续编辑。说明为普通小字，不新增图标、确认步骤或组件。旧版设计仍保存在此前提交，用户对照图保存为evidence/review-before-simplification.png。专属Chrome页实测桌面链接/复制同行且保现有输入边框/内距、390px自然堆叠无横向溢出；复制成功、失败重试、等待关闭和超限继续编辑通过，已更新截图并关闭验收页。类型/构建和diff检查通过；原服务保留，正式UI仍待用户批准。

Review补修：复制反馈使用一个轮次counter，新分享、关闭/导航和卸载使旧异步结果失效；每次复制重置错误。沿现有Vitest/Vue Test Utils做3项实际组件测试：正常复制、deferred旧复制在关闭重开后完成不标记新弹窗、失败后重试成功清错误，全部通过，无新增依赖。`evidence/player-network-mobile.jpg`已重拍并目视核见玩家网络失败卡片与重新加载按钮；专属Chrome验后关闭，viewport重置，原服务保持。
