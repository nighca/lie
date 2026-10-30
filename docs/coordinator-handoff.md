# 项目协调与收尾交接

2026-10-30：用户指定总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 接任，持有唯一 integration turn。总协调主要负责与用户沟通、专项协调、审查、串行合入 main 和 push；具体实施、运行配置和耗时验证由专项执行，交付责任仍由总协调承担。四个专项及当前门禁见[项目计划文首队列](project-plan.md#当前执行队列与门禁)。所有专项改动须经总协调审查，不能自行更新 main 或 push。

用户要求全部专项在独立 worktree 工作，临时文件、设计草稿和生成产物均留在专项 worktree，主工作区仅作审查后的集成。视频 owner 已核对13个文件归属、完整副本和逐文件哈希，将主目录两个未跟踪视频目录迁入专项 worktree；总协调独立确认主工作区干净，文件内容保留。视频“不提交、不推送”的专项约束继续有效。

语音上限已随 main `a742b1ecbe2a6227d53958ed3275a9f4089c5b96` 完成普通 push，精确 CI `41031475179` / CD `41031654559` 均 success，实际部署日志核 text binding `VOICE_MAX_SESSION_SECONDS` 为字符串600，Worker版本 `082b7ad7-16dd-4c43-bec5-bd35d2f1f2c2`。[发布证据](history/2026-10-30/voice-session-limit-release.md)与[集成复验](voice-session-limit/integration-verification.md)保留；尚未真实provider/mic/600秒长会话验收。

用户已批准100ms起播缓冲与消除分片人为gap组合，source `5e97cda1bfe4e5621467bb4560cdfea2848b4591`→`decf1f17724250754db4041724a96f55fd12b57c`，候选 `8829f2c`→`e027701` 已通过总协调实际审查和独立组合复验，随 main `95cb5cf02277a5c3f380d0a18158d3672a9bfcdd` 合入并普通push；精确CI `41046222803` / CD `41046380232` 均success，实际deploy且线上脚本哈希一致，[发布证据](history/2026-10-30/playback-release.md)。[组合验收](voice-playback-smoothness/integration-verification.md)确认全部types、voice54/Web目标34/gateway34和完整build通过，生产JS哈希与源一致、网关仍为600秒。首播/真实耗尽恢复100ms PCM储备与单一有界timer、短尾flush、连续排队无逐片gap、打断/close立即清理；不加淡出或Worklet，48k接缝及真实爆音仍未闭环。旧20ms方案与旧视频dirty门禁仅为源提交历史，不覆盖本轮决定和已完成迁移。

P1持续问答约179秒断连的[只读调查](voice-disconnect-investigation/README.md)已由专项独立复核，并经总协调全文review；源有序提交 `6ac389a6392df9045ff646f6b23e70d246c13e3c`→`894ad60035ad41b8ba8b92656de308fa2109ec4c`、归档候选 `d856e48`→`c8a91d5` 仅保存运行证据，不含应用/config修复，CPU问题尚未闭环。固定597版本的实际远端relay模块和绑定正确为600秒；2请求组终态exceededCpu、CPU均2019ms、wall182022/204331ms，每组4条重复异常及1条完成记录。未关联用户浏览器连接ID，2019ms不能直接当配置2000ms。新前端版本不使这些固定历史证据失效，也不证明CPU问题已修。

用户授权内两项官方只读API查询已完成：classic lie-game settings GET成功，但limits/cpu_ms未返回；同账号connector订阅GET返回403 Authentication error，现OAuth connection存在endpoint/scope缺口。Workers Free/Paid与有效CPU cap仍unknown，缺字段不能当默认。总协调已请用户从控制台提供Workers订阅档位与lie-game Settings CPU time，未显示则说明未显示；待这两项事实，不要求新Billing token。未创建或索要token、扩权限、查账单支付或改CPU/套餐/provider/部署，不预设升级、不制造210秒/付费流量、不手工导出凭据，也不延长600秒墙钟。获批API核查的追加提交894ad60已clean交付并经总协调全文审查，同批归档；原6ac固定597证据不变，settings的61a版本背景不是原子快照。当前没有在线WS消费者或阻止独立frontend发布的依赖。

页面版本P2已完成并随 main `0d753ec74c03b9d35ae8505942ab56a5f02fa651` 普通push与实际部署，精确CI `41050806049` / CD `41050950581` 均success，Worker `61a449e7-7997-4b33-8e34-295a02bd138a`，实际部署日志text600。[发布证据](history/2026-10-30/page-version-release.md)保留最终clean构建与线上一致的完整metadata、dirty=false及脚本hash；它只表示页面build，不是gateway版本或语音修复证明。右下details短hash展开完整可选择，DEV/unknown/dirty诚实显示；391/1280原生交互与root类型/14目标复验已通过，未操作clipboard。[交付](page-version/README.md)和[独立复验](page-version/integration-verification.md)保留。本批调查归档会自然生成新的页面build版本，不回写这份历史发布身份。

等待提示仍为用户审看的dirty demo，原底栏“正在连接”已恢复、步骤0/700/1400/2100ms；文案/节奏/视觉待最终确认，不能正式合入。391/1280已实测，320仅验收页支持未实测；专属tsconfig隔离本WT合同后全Web source/tests类型检查通过，不改生产业务或tests补偿。`5176`（PID13931/session83334）与自有Chrome tab1910332005保留。播放器QA旧5544已释放；page_version本轮5544静态服务PID6016/session78829亦由原PTY Ctrl-C exit130后核精确ps/lsof空、自有Chrome1910332022关闭，无保留消费者，不能套用旧41535回执，详见[服务登记](development.md#2026-10-30-当前专项分配)。新入门案仍处讨论阶段。8787/8788继续停用，本批文档不授权启停服务。每批审查后的main集成继续普通push，不能沿用下述2026-10-27仅本地收尾的特例。

## 2026-10-27收尾快照

用户当时自行archive旧协调chat，新增工作另开chat；当时无 active coordinator / integrator、无在制任务，收尾仅提交本地main、不push远端。旧root `01a17012-fa00-7170-ac0a-21c1900d71cd` 不再自动推进、轮换或建立接任chat。本节及以下历史资源、发布记录保留原收尾事实，不能覆盖上面的新任协调和专项任务。

## 新 chat 先读

[收尾记录与恢复入口](history/2026-10-27/project-closeout/README.md) · [项目计划](project-plan.md) · [架构规格](architecture-design.md) · [架构决策](architecture.md) · [开发与停服说明](development.md)。先核实际 `git status` / `git log`，不要把旧交接历史当当前任务或新批准。

## 收尾时版本与发布状态

- 正式站点：https://lie.agency/ 。[v1.0.0](https://github.com/nighca/lie/releases/tag/v1.0.0)标签指向 `f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`。
- 最近已推送main：`ca7f37f9c04530e124ade2e38c4f3f8d9bcab7df`，CI40444791243 / CD40444941027均attempt1/success，Worker `43f0991b-333a-4feb-b09b-3bb99a0f4e3d`。[证据](releases/2026-10-27-cleanup-archive/README.md)。与v1运行输入相同，仅增加历史文档。
- 本次收尾提交在上述版本之上，仅本地；没有触发CI/CD，没有推送、移动tag或手工部署。具体本地SHA以Git为准。

## 已完成和未决事项

四官方案、八人物动画与音色、结果成功/失败呈现、单编号JSON新增案件、三步Editor/草稿/试玩/分享/改编、姓名高亮、标题/favicon、缓存与构建期WebP均已入库发布；README有桌面与移动演示。完整证据与限制见项目计划，不重复已main成果。

| 事项 | 保留状态 |
| --- | --- |
| 邀请码/访问鉴权 | 用户明确暂停，[设计及代码来源归档](archive/2026-10-25/invite-access-paused/README.md)；不自动恢复。 |
| PR合入前CI与逐PR预览 | [方案](pr-ci-preview-proposal.md)待用户确认，尚无新增workflow/Worker/token/权限；先确认后实施。 |
| 角色切换连接耗时 | [研究](voice-connection-latency/README.md)三次本地样本2.536/1.800/1.688秒；不是线上p95，未实施加速。预连接/路由/上下文隔离与成本仍需方案，不复用跨角色记忆。 |
| 贺宁/Hackathon真实模型短测 | 用户自行负责，未提供新结论；不再自动安排provider调用。 |
| 真实边界 | 出戏、多人隔离/费用硬上限、Safari/iOS跨设备与全硬件/长会话未全面闭环。已有有限QA/fake测试不替代。 |

## 本地资源和恢复

2026-10-27收尾时，58个旧工作树全部清掉，只保留main；旧分支/HEAD与官方恢复快照仍在。本轮新专项工作树不在该历史清理范围内。[清理回执和私密恢复位置](history/2026-10-27/project-closeout/README.md)。本批临时交接WT完成审验/合入后也归档，不长期留存。不要按旧路径继续工作或批量restore。

8787/8788已disabled/unloaded；5355旧PID/监听清理时均不存在。无在用LIE开发server需要保留或自动启动。`.dev.vars`等私密文件仍留main/私密备份，不入Git。`lie`、`lie-2`实读均PAUSED；不自动恢复旧定时任务或四小时轮换。

早期所有权/完整来源/门禁历史保留在Git及docs/history、docs/archive；chat归档不删除它们。未来由用户的新任务明确范围，再按AGENTS隔离审查、单integrator流程执行。
