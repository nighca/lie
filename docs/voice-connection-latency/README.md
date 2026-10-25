# 角色语音连接耗时调查

2026-10-25。状态：已完成首轮实际测量与候选评估，未改变产品连接行为；候选均未批准实施。基线 `57ff7d5984126932ba0367c6b47bfe911d03a480`，owner chat `01a17319-1ea3-7be0-9c3c-04c999169591`，managed worktree `voice-connection-latency/lie`、branch `codex/voice-connection-latency`。主协调仍是唯一integrator。[源码身份核对](source-identity.json)确认后续main713bbe7的这8个语音模块blob与实测基线相同；不把测量来源改写为新main。

## 结论

这组3次本地浏览器样本中，首次开启、同人手动重启、正在对话时切人分别等待 **2536.2 / 1799.6 / 1687.5ms**。最长分支均为WS与hello/工具发现；不是麦克风准备，也不是status。没有发现通过调整前端现有并行顺序就能明显压缩这组等待的依据。要显著改善切人，先定位连接包络中的主要等待；不能用假ready或直接复用跨人物会话掩盖它。

这不是生产TLS性能报告、p95或优化前后对照；每个场景只有一个样本、同页顺序执行，热身与场景混杂。第一个样本是本测试页首次开启，不能当作浏览器首次授权/机器冷启动。所有结果仅代表本次环境。

## 授权、环境与真实边界

用户在本chat回答“现在可以，暂不使用语音”，确认一个≤90秒、最多3次开启/每次≤15秒、ready即结束或切换、不提问/录音/重试的窗口。root要求先等用户释放资源，该确认已满足；ready前仍可能有供应商费用，没有声称零费。未创建或修改provider资源、凭据、模型、权限或部署。

复用launchd 8787/8788，实际`/__lie/main-status`返回上述基线；自建IAB browser3/tab1，原生WebSocket、getUserMedia、AudioContext、AudioWorklet，经现有本地Worker到真实上游。未触碰用户tab、5355、草稿或storage，未启动/重启/停止服务。测试独立创建实际controller/liveVoice/channel，使用合成两人内容，未测试贺宁/Hackathon内容或真实模型回答。

[完整成功probe](browser-probe.js)由CDP Runtime.evaluate在自有页安装一次按钮，以真实点击开启。只对依赖注入计时和资源跟踪，没有全局API替换；WebSocket包装与产品native adapter的发送/事件行为相同。每个attempt有独立observer，旧cleanup不会记入新attempt。麦克风采集图真实运行，但`onFrame`在probe内丢弃；**没有PCM上传、预录、补发、提问、转写/首音验证**。listenStart是本地发送，不是服务端ready ack。第三次由实际controller.selectCharacter自动续接，第二次是主动停止后手动重启。

probe将原始open拒绝压成failed供有界停止，因此不能拿它分析失败原因；本组三次均成功。首次安装脚本有语法错误，未执行任何连接/设备代码；修正为保存的完整probe后才点击一次运行，未重试供应商调用。

[原始白名单阶段记录](native-results.json)保留原浮点数和结果，无人声/正文/角色私有资料/认证头/上游URL/token/设备标识。导出后自建tab已close；最终**6个context全closed、3条track全ended、3个native WS全readyState=3**。cleanup观察事件也均完成。无遗留服务、浏览器覆盖或待清理权限操作；共享窗口已告知root释放。

## 分阶段结果（毫秒，派生展示四舍五入至0.1）

| 阶段 | 首次A | 主动停止后A | active A→B |
| --- | ---: | ---: | ---: |
| open入口→status完成 | 47.8 | 42.3 | 27.1 |
| WS创建→浏览器open | 2004.0 | 1331.4 | 1241.1 |
| 浏览器open→hello收到 | 470.7 | 423.6 | 416.5 |
| hello→tools/list回复完成 | 1.0 | 0.7 | 0.5 |
| open入口→采集resume完成 | 370.2 | 267.5 | 232.0 |
| getUserMedia请求→返回 | 210.6 | 137.4 | 116.6 |
| worklet addModule | 9.3 | 3.5 | 1.9 |
| 播放resume调用→完成 | 0.3 | 0.2 | 0.3 |
| open入口→listenStart/startup完成 | 2536.2 | 1799.6 | 1687.5 |

WS创建→open包含浏览器/本地Vite代理/本地Worker宿主/上游upgrade及相应网络，不能从单边时钟分出哪一方慢，更不能称“供应商处理了2秒”。open→hello也混有网络和上游工作；没有观测initialize来回，不把这整段冒称纯hello计算。toolsList仅表示本地工具列表回复发送完成。当前Worker等待上游upgrade后才返回浏览器101；源码解释了包络组成，没有给各组成部分的实际耗时。

实际gUM返回→worklet开始还有约83–91ms，包含新采集AudioContext创建等同步本地工作；但mic整支比通道早约1.4–2.2秒完成，因此消除这段也不会缩短本组ready。播放器resume和worklet改进同理。

补充[HTTP-only记录](http-only-results.json)：Python urllib直连本机HTTP，3次status完整响应380.775/81.498/14.154ms；无浏览器、无provider。第一个shell请求受既有proxy指向7890失败；显式本机直连在sandbox内亦连接失败，随后一次获准的沙箱外只读执行成功。没有据失败重启服务。该组没有浏览器连接复用/相同热身条件，**不能**替代真实组27–48ms或用于预测线上收益。

## 源码时序与历史证据

当前模型为 `Tstatus + 本地构建 + max(Tplayback, Tchannel, Tmic) + listenStart`。三个准备分支已并行，status未通过不申请mic/WS。controller先settle预算/flush旧文本、使旧epoch失效、abort/close旧scope，再立刻创建新scope；不await旧context.close才开启新连接，因此没有可直接删除的串行teardown等待。真实本地资源关闭可能与新设备准备重叠，不等于关闭操作零成本。

ready仍需PCM hello与工具列表回复、采集及播放就绪；准备期间不扣共享额度，停止后切人不自动开启。人物context始终绑定session/character/epoch/abort，只含本人历史/设定。网关每连接random Client-Id、固定上游/设备agent、180秒界限都是现行为；这次没有改变。模块边界详见[原架构](../architecture.md)，另审阅规格source `44d549e0d9dd5d6c9fc5a5dcb904de2164a33db4`（仅资料，不重放依赖）。

旧[启动审计](../voice-startup-audit.md)已正确指出现有并行和status gate；本次复用其observer，没有重复实现。旧[切人控制器记录](../voice-switch-controller.md)与[生命周期组合审查](../reviews/voice-lifecycle-2026-10-25/README.md)分别说明交互和隔离。旧[间歇失败](../reviews/intermittent-voice-2026-10-25/README.md)及[宿主非101限制](../dev-websocket-rejection.md)根因边界保留，不当成当前成功延迟根因。历史真人录制session的human-role是约180ms轮询的角色采样，不是点击时间；microphone-attached是tee建立时刻，不是gUM请求起点；空Network不能恢复WS时序。没有从视频补造连接时长。

2026-10-25只读核对官方[WebSocket协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)与[端侧MCP流程](https://linx.qiniu.com/docs/xrobot/mcp/hardware-mcp)：连接后再发hello，端侧工具按initialize/list/call发现与调用。未见当前所读页面承诺跨角色上下文清空或跳过发现的快速重连能力。仅是所读资料范围，不能据此断言供应商没有其他能力。

用户随后要求结合官方产品文档；[专项文档调查](official-docs.md)补齐换音色保留上下文/无记忆仍有本次上下文的明确约束，以及OTA动态路由与单备用连接候选。它是后续研究，不改变本节候选为未批准的状态。

## 候选、收益与决定门槛

| 候选（均未实施） | 本组能支持的收益判断 | 复杂度与风险 / 建议 |
| --- | --- | --- |
| 去掉、缓存或提前status | 理想省约27–48ms；切人本例最多约1.6% | 缓存失效、未配置时提前权限/连接改变行为。收益小，暂不推荐；若要做需明确gate语义。HTTP-only首样本不作为收益承诺。 |
| 同次启动更早resume、共享context或缓存worklet | mic和播放已远早于channel完成，本组总ready不获益 | 同次局部优化可能低风险但当前无目标收益；跨开启持有/共享context增加cleanup与权限语义，不为本样本优先实现。 |
| 少等tools/list或抢先listen | hello后仅0.5–1ms | 工具未注册/人物context缺失，破坏ready契约；不采用。 |
| 缩短timeout、把UI先置ready | 不缩短任何成功握手 | 误报可说话或增加失败；不采用。 |
| WS预连接、并行保持各人物连接 | 可能遮蔽最长的约1.2–2.5秒连接路径，**未验证** | 额外连接/费用、固定device并发、3分钟寿命、角色隔离和停止语义；属于产品/资源决策，必须用户先确认具体生命周期，不能直接落地。 |
| 同一WS切换人物或停止后保留 | 理论上避免重复upgrade/hello，**不是已证收益** | 远端记忆、tools/context缓存、无可靠逐回答音频ID、迟到帧串人/串音，需供应商契约与独立隔离证明；当前没有可批准实现的清空保证。 |
| 定位并优化Worker→上游upgrade路径 | 目标是最大包络，而非几十毫秒本地步骤 | 推荐下一步：先设计仅含数字的同请求阶段测量，并对照本地与生产TLS。新增运行观测/额外真实窗口/任何provider变更需另定边界；本批不部署、不重试、不换provider。 |

当前建议维持隔离与真实ready，先进一步拆解连接包络。尚未发现可以在现契约内直接证明“显著更快”的小改动。若用户愿意接受更大的连接生命周期变化，应先在上述两种连接策略中确定目标与停止/费用边界，再验证远端记忆和音频隔离；不能把本研究当成预连接批准。

## 离线验证与复现

[可控时钟实验](critical-path.test.ts)运行实际liveVoice，注入fake status/设备/通道；四组分别由transport、capture、playback、status主导，listenStart严格为480/780/980/1400ms，准备期间PCM丢弃，全部完成后才输入。[完整合成输出](offline-results.json)明确标为fake，不是加速或真实provider数据。

Node24.22.1 / Vitest5.0.5：本探针4/4通过；复跑原有controller＋liveVoice＋channel生命周期探针4/4通过，覆盖切人旧回包/额度、断线本人历史、迟到权限清理、握手timeout。browser-probe.js语法检查与git diff --check通过。无产品源码变化，不重跑无关全套或资源构建。

```sh
node node_modules/vitest/vitest.mjs run --config docs/voice-connection-latency/vitest.config.mts
node node_modules/vitest/vitest.mjs run --config docs/reviews/voice-lifecycle-2026-10-25/vitest.config.mts
node --check docs/voice-connection-latency/browser-probe.js
```

浏览器probe不是自动测试入口，不自动运行；文件保留当次绝对import路径，复现必须先确认服务来源/资源窗口/次数及用户设备授权。临时node_modules链接在交付前移除；无其他dirty/未跟踪交付物。未main/push/PR/手动部署；root负责实际review和串行集成。
