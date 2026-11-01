# 调查页提示与转写跟随（2026-11-01）

状态：专项完成，等待总协调实际 review／串行集成。未改 main、push、部署、provider 配置或语音生命周期。

## 来源与范围

用户要求统一核查连接提示疑似强制三秒、修复转写上翻被拉回底部。此 Chat 附带独立 managed worktree `/Users/nighca/.codex/worktrees/6d4d/lie`，核实原 HEAD/local main 为 `16d64347b853ffaaac1f2dbaa9d8ddd232f9859a`、初始 clean/detached，创建唯一分支 `codex/investigation-ui-followup`；无额外依赖提交。owner 为本专项，最终 review／main／发布由总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 负责。

应用改动仅 `packages/ui/src/components/Transcript.vue`，测试仅对应 follow 和 App/notice 组合文件。其余新增材料为本目录。未改记忆专项文件、controller、liveVoice、voice、App 或提示文案。

## 连接提示调查结论

当前源码没有最短展示时长：`VoiceConnectionNotice.vue` 的 1000/2000/3000ms 只切文案，卸载会清除 timer；CSS 只有 .2s 入场，无延迟离场。App 根据 `phase === interrogating && conversationActive && busy` 挂载。controller `await connection.open()` 返回后当次仍有效便立即清 busy；取消、失败使当次失效并移除提示。没有等待前三句播放完的队列。

`liveVoice.open()` 先等待 status/prepare HTTP（可被进局预热复用），再并行等待麦克风、AudioContext resume 和 channel.open。channel.open 需要 hello 音频协商和 MCP tools 注册才算 ready；WS open 只发 hello，不能当作可开始对话。所有条件满足后 startInput/capturing，controller 才开始扣询问时间。本次保持该定义。

App＋真实 controller＋fake VoicePort 的 fake clock 在 250/1250/2250/5000ms ready，提示均在 resolve/渲染批次后消失；前三阶段可被打断，第四阶段持续等。中途 cancel/fail 与 late ready/listening 不复活；原有重连、角色切换、背景打断测试保留。另以真实 liveVoice＋controller＋App，分别延迟 mic、player resume、channel.open 最后一个条件，2250ms resolve 后立即消失，保留完整时间预算。fake channel 就绪代表协议完成，协议 hello/tools 语义另由源码及既有 voice 测试负责。

这证明当前 UI 没有三秒门槛；没有真实 provider 时序采样，不能据此断言用户观察的等待具体耗在哪个上游阶段，也不能把 fake 成功当作现场网络或录音验证。

## 转写行为

用滚动事件记录是否距底部 4px 以内。内容更新后仅在已跟随时滚到底，避免 DOM 增高后重新判底导致脱离。上翻状态不会被 messages clone、同消息增量、pending→final 或逐字 reveal 重置；手动回底恢复。空历史重新开启跟随；角色切换由既有 App character key 隔离，新局由页面生命周期/空历史隔离，不根据数组引用推断新会话。

新增内部 content 容器供 ResizeObserver 同时观察内容和 log 尺寸，处理容器/字体/内容尺寸变化；卸载断开 observer 并保留原 reveal timer 清理。无新产品按钮，role/log、slot、高亮、头像、揭示/打断样式与 reduced motion 行为保留。阅读中尺寸变化保留浏览器原生滚动锚定。

jsdom follow 测试用合成几何覆盖初始无溢出→溢出、clone/增量/final、揭示与打断、底部容差、resize 和卸载。它不提供浏览器布局证据。

## 真实浏览器验收

IAB，合成数据入口 [browser.html](browser.html)／[browser.ts](browser.ts)，无真实 voice/mic/provider、无 storage 写入；截图 [browser.png](browser.png)。测试按钮只在本目录 QA 页面，不进入产品。

直接读取实际 DOM 几何（top/scrollHeight/clientHeight）：

| 场景 | top | height | client | 结果 |
| --- | ---: | ---: | ---: | --- |
| 初始历史 | 1114 | 1438 | 324 | 底部 |
| 持续 reveal | 1264 | 1588 | 324 | 跟随 |
| 用户上翻 | 940 | 1588 | 324 | 离底 |
| 后续 reveal | 940 | 1642 | 324 | 阅读位置不动 |
| 320px窄屏换行 | 1321 | 2458 | 324 | 保留浏览器锚点，未跳底 |
| 手动回底 | 2270 | 2594 | 324 | 恢复 |
| 继续 reveal | 2378 | 2702 | 324 | 继续跟随 |
| 回600px宽度 | 1454 | 1778 | 324 | 仍在底部 |

已实际使用滚轮；触控/拖动未逐一做物理设备测试，它们共用容器 scroll 事件逻辑。

## 检查与服务

- UI suite 6 files / 64 tests 通过；Web suite 43 files / 419 tests 通过（随后新增3个 liveVoice+App case 另跑 notice suite 16 tests 通过）。
- UI 和 Web vue-tsc 通过。
- Web build 首次因受限网络无法取得 storage.googleapis.com 编译工具而失败；放开构建所需网络后成功下载校验固定工具，82 张图片编码完成，标准生产构建与 postbuild 121 素材检查均通过；保留既有 configLoader/underline runtime URL warning。
- diff --check 通过。无依赖升级。

服务 turn：root 单次授权并核5176无listener后启动。owner本专项；source该 WT base16d＋本批 Transcript/tests/QA dirty。command：`PATH='<既有Node24.22.1 runtime>/bin':"$PATH" ./node_modules/.bin/vite --config packages/ui/vite.config.ts --host 127.0.0.1 --port 5176 --strictPort`。PID92516、原session38326、consumer本Chat IAB、stop condition为QA结束。默认依赖扫描命中仓库旧归档HTML的失效 import，有 warning；当前页面实际加载成功，无借此改旧档。

验收完在原session Ctrl-C，exit130；精确 ps PID92516为空、lsof5176无listener。无其它服务。正常验收own tab2已关闭；首次服务未启动时产生的error tab1因工具URL策略拒绝绑定而无法显式关闭，未标记保留，按IAB临时tab生命周期结束后自动回收。无viewport/network覆盖，无用户tab/storage操作。

总协调建议更新：两项均完成专项review-ready；连接提示记录“未发现强制3s，回归覆盖fast/all-ready”，转写记录“按用户底部意图跟随”。服务5176已停止释放，无新审批门槛；待root实际review后按现CI/CD发布。
