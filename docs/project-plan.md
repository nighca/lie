# LIE — 当前项目计划

2026-10-30：用户指定总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 接任，负责需求沟通、优先级、专项协调、实际交付审查、串行合入和 push；具体实施与耗时验证交专项执行。**总协调持有唯一 integration turn，所有专项改动须经其审查合入。** 每次 reviewed integration 按既定流程普通 push；专项另有“不提交、不推送”要求时继续遵守。

所有专项在各自独立 worktree 工作，代码、草稿、临时文件、生成产物及验证环境均不得落在主工作区。主工作区仅用于审查后的 main 集成。主目录原有两个视频目录已由视频 owner 核对13个文件归属、完整副本和逐文件哈希后迁入专项 worktree；总协调独立确认主工作区干净，视频仍不入库。

## 当前执行队列与门禁

| 优先 / owner | 当前状态及下一步 |
| --- | --- |
| P1 线上约3分钟仍断连 / 语音专项 `01a18ac7-cdfc-7690-a0c9-bdc3e6fc8eb9`＋总协调 | 用户持续问答约179秒中断（8分钟局余05:01）。[调查及API核查](voice-disconnect-investigation/README.md)已完整审查，源有序提交6ac389a→894ad60，归档候选d856e48→c8a91d5：固定597版本两请求组以exceededCpu结束（wall182/204秒），实际600秒timer正确；尚未逐一关联用户，不能由CPU2019ms反推配置2000ms。获准的官方只读API查询完成，但settings缺limits/cpu_ms、订阅GET403，档位及有效CPU cap仍未知。待用户从控制台确认Workers Free/Paid与lie-game CPU time，未显示则如实说明；不要求Billing token。不调CPU/套餐/provider、不造付费测试流量、不盲延600秒。归档不是功能修复，后续方案待事实与必要授权。 |
| P2 低调页面版本标识 / `page_version`＋总协调 | 已随main `0d753ec` 合入、普通push及实际部署，CI/CD通过，[发布证据](history/2026-10-30/page-version-release.md)。首页右下短hash展开完整值可选择；DEV/unknown/dirty诚实标记，仅代表页面build，不代表gateway或语音修复。源码、原生391/1280验收及独立检查见[交付](page-version/README.md)和[复验](page-version/integration-verification.md)。本批调查归档会自然改变页面build版本，不回写历史身份。 |
| P1 语音连接上限 / 语音专项 `01a18ac7-cdfc-7690-a0c9-bdc3e6fc8eb9`＋总协调 | 用户已批准方案 B：保留服务端上限、可配置、默认600秒。source `2886bd90`→`597d7635` 已随 `a742b1ecbe2a6227d53958ed3275a9f4089c5b96` 合入 main 并普通 push，精确 CI `41031475179` / CD `41031654559` 均 success；实际部署日志确认 text binding 字符串600，[发布证据](history/2026-10-30/voice-session-limit-release.md)。网关34项、类型检查和离线构建通过，[集成复验](voice-session-limit/integration-verification.md)及[实施与验证](voice-session-limit/implementation.md)保留。计时仍从 relay 创建开始、包含准备阶段；不改变游戏共享询问额度、UGC时长、provider idle 或累计费用体系。未进行真实10分钟语音验收。 |
| P1 语音播放流畅性 / 同上语音专项＋总协调 | 用户已批准100ms起播缓冲与消除分片人为gap组合。干净源分支 `codex/lie-voice-prebuffer` 按顺序交付 `5e97cda1bfe4e5621467bb4560cdfea2848b4591`→`decf1f17724250754db4041724a96f55fd12b57c`；总协调从 main `a742b1e` 构造候选 `8829f2c`→`e027701`，已通过总协调实际审查与独立组合复验，随 main `95cb5cf02277a5c3f380d0a18158d3672a9bfcdd` 合入并普通push；精确CI `41046222803` / CD `41046380232` 均success、实际deploy，线上入口脚本哈希一致，[发布证据](history/2026-10-30/playback-release.md)。[组合验收](voice-playback-smoothness/integration-verification.md)：全部types、voice54/Web目标34/gateway34及完整build通过，生产JS哈希与源相同，网关仍为600秒。首播/真实耗尽恢复采用100ms PCM储备和单一100ms有界timer，短尾flush，连续排队不逐片插gap，打断/close立即清理；不加淡出或Worklet。DEV数值诊断默认关闭。源全检查及原生offline12场景调度通过，16k波形一致，48k两个场景有差异；真实爆音及48k接缝仍未闭环。原候选 `b1844db` 不单独集成；已发布600秒上限不改。[首轮审计与复现](voice-playback-smoothness/README.md)、[调度实施](voice-playback-smoothness/implementation.md)及[100ms组合实施](voice-playback-smoothness/prebuffer-implementation.md)保留。 |
| 连接等待提示 / `01a18adf-d929-7060-969c-8c2d40415d04` | 当前UI有序候场旁白demo仍为用户审看中的dirty demo，无新commit，正式落地未批准。按用户反馈恢复原底栏“正在连接”，步骤为0/700/1400/2100ms、短主句与稳定副句；首开2.5秒/切人1.7秒参考预设另有短0.9秒/长8秒，实际ready立即退出。参考来自历史单次本地样本，不是当前分布；2631/1783ms只是假demo观察，非语音性能新测。owner报告8目标测试、Chrome iframe391/1280实测通过；320仅验收页支持、未实测。共享依赖workspace链接随main变化曾使默认Web types混入新版播放器合同；专属tsconfig paths绑定本WT后全Web source/tests类型检查通过，未改生产业务/tests补偿。IAB不可用，无真实provider/mic，不代表全应用build或真机通过。独立WT `lie-connection-design/lie` 基线60c11f7，5176服务及专项tab继续保留，[服务登记](development.md#2026-10-30-当前专项分配)。新图与观察在专项design目录、命令及局限在专项docs；文案/节奏/视觉待最终确认，后续整理clean有序提交再交总协调review与归档/合入，不清理WT。 |
| 简单入门案件 / `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e` | 布丁案因答案过于显然被否决；礼物案仍为讨论提案。待用户确认内容，不实施或增加正式案件。 |
| 宣传视频 / `01a17dee-6a37-73f3-bf53-853df51f6b15` | 26.1秒竖屏 v5 已交付，继续遵守用户“不提交、不推送”。产物及必要工程保留专项 worktree；owner 已核对并迁出主目录两个未跟踪目录，13文件内容保留在专项 worktree，主工作区已干净；不因接任授权入库或公开上传。 |

8787/8788继续停用，无新启动授权；不恢复旧定时任务或四小时轮换。2026-10-27收尾时的清理、暂停及历史发布证据见[交接入口](coordinator-handoff.md)与[收尾记录](history/2026-10-27/project-closeout/README.md)。最近已核发布 main 为 `0d753ec74c03b9d35ae8505942ab56a5f02fa651`，页面版本批次CI/CD、线上metadata及脚本身份、生产600秒绑定已确认；v1.0.0标签仍指向f8c4e2b。本批纯调查归档的集成/发布结果另核，不能沿用上批CI/CD结论。未重新授权的旧方案继续守原门禁。

## 已批准范围与已发布成果

四官方案3/4/4/3人、共享询问480/600/540/480秒（第四案为用户本次明确新增）；引擎支持可变人数，新同玩法案件仅内容与必要呈现配置。浏览器运行故事/会话/指认，薄Worker仅provider传输；纯TS core独立Vue/宿主，凭据不得入客户端。中文B、调查/首页A及既有美术方向已批准，详见[架构](architecture.md)。

仅语音人物交流、只读转写、按钮指认，无证据DSL。多轮可打断，ready后静音/等待/回答计额度；停止暂停、切人不重置。错指终局不揭真相、正确才揭晓，离开确认、刷新不恢复局内状态。final-only回退及合成嘴不当实时ASR/真实口型证明。编辑器三步/预设/同引擎试玩/fragment分享/本地草稿，无账号、云同步、上传素材或版本发布管理。

| 已随a0e发布 | 关键行为与证据 |
| --- | --- |
| 正式八人结果 | 8个v2包、16对结果动画/静态资源按真实被指认者投影，旧四态/81PNG/声音保留；2026-10-25用户在动画专项明确确认统一页8个角色新的两种状态均无问题；不重复合入制作，实际App/窄屏/reduce/fallback边界及strict121见[最终组合](result-game-ui/final-main-verification.md)。不是仅设计在制。 |
| CB01草稿保存保护 | 非finite时长拒绝序列化、原raw保留、修正后保存，notice只清自身保存错误；[审查与修复](reviews/content-boundary-2026-10-25/README.md)。 |
| 单JSON官方案 | 编号JSON派生目录/开局，summary贯通Editor/draft/share/remix/投稿；数值排序/max+1、旧id/URL和缺summary兼容，官方/投稿必填；移除catalog/public副本。[实施与验证](builtin-case-json-implementation/README.md)。不再是未决讨论。 |
| Hackathon14链 | 截至f753890的14项修订已审、随a0e发布；[讨论稿](hackathon/project-highlights.md)及[内部编写依据](hackathon/authoring-notes.md)保留。移动可用由用户确认，不扩大为盲测/长会话全通过。新平台定位source25e447d已审并随9e1发布，不计入旧a0e发布。 |
| 既有主线 | q90派生/CI-CD拆分、动画首帧/hash/cache、姓名高亮/标题、龙三叔配置、连接提醒/active切人续接、改编quiet入口、KeepAlive/草稿与复制隔离、调查高度等均已发布，不重派。详细原提交/验收见[整理前快照](history/2026-10-25/dashboard-before-a0e-release-archive/README.md)。 |

## 2026-10-27收尾保留事项与历史成果

以下为收尾时的成果、未决边界和批准证据，不是自动续跑队列；当前工作以文首表为准。

| 历史事项 / owner | 收尾状态与证据 |
| --- | --- |
| 调查立绘加载占位 / 已发布2268 | [实现与验证](investigation-portrait-loading.md)：动画未就绪显示居中“人物加载中…”，无动画/失败/reduce沿用静态回退，舞台尺寸不变；仅调查页启用。source8b98887完整审查，候选fe56783的36目标测试root复验通过；原生视觉未测，CI/CD及线上新JS身份已确认，未冒充真人验收。 |
| 头部Logo下划线 / 已发布2f5496d | 用户在专项要求移至Logo右下方并看完整页面；source0c4a268已完整审查、桌面/手机实际看图、独立格式/品牌身份审验通过；[当前方案](header-logo-lower-right-design.md)替代[上版位置](header-logo-underline-design.md)。静态重绘非App截图；用户随后在专项明确同意并要求笔画左移接触Logo、直接实现，UI专项4567e2f→28b77d1完整审查并集成发布：移除文字，笔画接触Logo且按后续要求再左移约20px；UI59/types/Webbuild与真实IAB桌面/手机通过，root组合5项Header测试通过。[实现](header-logo-implementation.md)。 |
| 语音连接提示A / 已发布8aa7ec9 | 用户明确批准奶油色A；source777c392已完整审查，Web357/相关21/types/build通过，root候选四项提示测试复验通过。保留取消及现有状态机；与首页CSS精确组合身份通过。[实施](voice-connection-notice/cream-card-implementation.md)；[原生组合QA](voice-connection-notice/combined-native-qa/README.md)已在独立Chrome补验三尺寸、reduce、cancel/ready/fail/late-ready，通过；真实App/controller＋fake transport，不是供应商验收。三稿及B/C替代保留归档。 |
| 第四案Hackathon作弊 / 已发布5a9a31c | 《这真是今天做的吗》3人/480秒，source b7b20e3→2cbae8f、候选c1da7a9→5c87845。仅新增04 JSON运行变更，原有1216产品文件未变；[内容与验证](hackathon-case/README.md)另附。Web357/脚本33/全types/正式build通过，root候选2项真glob/首页开局指认改编分享复验通过；真实AI/盲测未做。CI/CD与线上新JS身份均确认。 |
| PC首页双滚动 / 已发布8aa7ec9 | source b9ef3cb→cf5c0fc完整审查；PC视口约束，仅案件列表内滚；移动端维持自然页面滚动。真实IAB尺寸/第四案可达见[验收](home-scroll/README.md)。两轮5544验收均已原PTY停止并核空监听，组合Chrome亦验证第四案可达。 |
| 移动首页分区间距 / 已发布2f5496d | source397b032→19fba4c、显式Header依赖4567后58dedce已完整审查；≤620px案件区上边距32px，标题与列表关系保持；真实Chrome iframe320/391/620移动和621/1280桌面对照/滚动通过，391/1280与新Header组合几何相同。[证据](home-mobile-section-spacing/README.md)。两轮5544均停止核空、临时入口/tab清理。 |
| 首案改名 / 已发布b1f4af8 | 用户明确改为《消失的纪念章》，仅canonical title及当前README改变；ID/URL保持。37项相关测试与root单字段身份检查通过，CI/CD及新TLS JS已核验。[记录](case-title-rename/README.md)。 |
| 评审亮点文档事实同步 / 专项01a17114 | 用户时间紧，root已核旧稿仍三案/首案旧名/旧状态描述；source d01613c已审查，同批纳入英文更名4bc5081及用户在专项明确催合入的README三提交28b0625→7daa237→9f207e4；root保留新案名/视频，补齐两版README第四案、同步中央英文链接。已随57ff7d5合main、普通push且CI/CD通过；185当前链接/双语拓扑/四案身份组合核对通过，不重复实现。 |
| P1 真人/真实模型 / root协调用户与QA | 用户最新明确将贺宁和Hackathon两案真实模型短测交由自己，不再由root安排/调用provider；设定修订已入库，效果待用户反馈。其余四案完整盲测、mic/外放/长会话、固定device多人隔离和费用硬限额仍未全闭环，不借此授权新推理；fake/短WAV不替代。 |
| 原生分享/Editor生命周期 / 已完成有限验收 | source79d1798七项独立Chrome已完成，root全文/JSON/三图审查通过：[验收](qa/native-share-editor-d4c-2026-10-25/README.md)。中文emoji/换行分享、reload、valid/damaged历史、试玩Back缓存/无快照Forward回Editor、原生清除确认与焦点、窄屏长内容可达；仅localhost:5544自建合成草稿，末尾恢复null，127旧草稿未碰，5544已停核空。不是Safari/真机/跨设备/剪贴板授权/真实语音通过；16k预算仍暂定。 |
| Hackathon新平台定位 / 已发布 | source25e447d已审查集成并随9e1发布；“游戏＋游戏平台”统领既有UGC/资源/引擎能力，未增加玩法范围。保持讨论稿，不衍生视频制作许可。 |
| 出戏/启动/宿主WS / 工程与内容待排 | [出戏调查](role-immersion-investigation.md)未闭环，[WS非101诊断](dev-websocket-rejection.md)未修vendor；不默认付费叠prompt/换provider。真实visibility/广泛race/硬件touch、silver/mint同accent区分等旧边界保留，不按合成事件声称通过。 |
| 投稿 / Editor＋root | GitHub网页辅助、作者确认；用户计划公开源码不等实际visibility已操作，本批不查/改可见性。无OAuth/PAT/token输入或自动PR；[投稿范围](editor-official-submission-proposal.md)。 |
| 截止前待取舍 / root与用户 | 评审材料已随57ff7d5发布且CI/CD通过；贺宁/第四案短测用户自行负责。外部投稿可用性、Safari/iOS跨设备分享、多人隔离/费用边界仍未闭环。用户已授权独立chat设计PR CI与逐PR可跳转预览，先方案确认，不等实施/部署许可。 |
| 当前实现架构规格 / 专项01a17114＋root | 用户明确要求的模块规格/对外接口及双语README入口已随713bbe7发布，含简洁开头。全文及实际源码独立审查、124本地链接/围栏/空白通过；不修改原批准架构。 |
| 首页浏览器标题 / character_preset_migration | 已随713bbe7发布并CI/CD通过，首页精确“LIE · 语音推理”；其余路由不变，root27项复验与正常TLS新JS核验通过。 |
| 角色语音连接耗时 / 专项01a17319-1ea3-7be0-9c3c-04c999169591 | [首轮报告](voice-connection-latency/README.md)与[官方资料](voice-connection-latency/official-docs.md)已完整审查，ecd555c→008fb42归档。用户明确释放的有界窗口内3次本地实测2536.2/1799.6/1687.5ms，主要为连接握手包络；单样本非生产p95，未实施优化。8模块身份/4项fake时钟/旧生命周期证据保留。窗口已释放；后续测量/预热策略需明确方案，不重启已停8787/8788。 |
| PR合入前CI与预览 / 专项01a1730f-9304-7d51-bf5b-8c20c3d37920 | [方案60d1d8](pr-ci-preview-proposal.md)已root全文及独立审查归档，待用户在专项确认。建议全PR无secretCI、同仓自动/fork逐head批准的独立公开UI预览，无真实voice；审批/清理/token范围与成本边界保留。未改workflow、建Worker/token/environment或部署；归档不等实施批准。 |
| 移动端演示入库 / 专项01a17114＋root | 用户明确授权其mobile-lie.mov录制入库；source736e459已全文审查及独立媒体身份核验，128.7215秒1080×2376 H264/AAC，无重编码MP4及双语README链接已随f8c4e2b发布。包/时间轴保持，AAC header＋1.771ms如实记载；非全设备验收。[记录](promo-video/2026-10-25/mobile-demo/README.md)。 |
| 暂停鉴权 | 用户明确暂停，[设计与候选归档](archive/2026-10-25/invite-access-paused/README.md)保留，不恢复实现/QA/CI/部署。 |
| 宣传视频制作 / 专项01a17226-5e5a-7193-b5b7-e522519a3e0c | 73.4秒创作分享片及37.53秒合成双向试片已归档。用户主导的take03完成三角色真实问答→正确指认→首页，source1545c1f已root全文审查及[独立复核](reviews/joint-gameplay-1545-2026-10-25/README.md)：PCM/编码/哈希/7881帧索引通过，7ctxclosed/9tracksended、四API引用恢复；[完整记录与失败备选](promo-video/2026-10-25/joint-gameplay-recording/README.md)保留。录屏存在段间hold，具体指认点击瞬间未完整动态捕获，不能声称连续或精确口型；外围finally/observer源码未全保存，仅核终态回执。用户在专项新明确要求试玩前＋创作后、有声合成成片入库并README链接，source1ae1fa3已root全文审查、接缝/末帧实际看图及[独立身份审验](reviews/combined-demo-1ae-2026-10-25/README.md)通过；[成片与复现](promo-video/2026-10-25/combined-demo/README.md)187.433秒、1280×800/30fps/H264/AAC，试玩双方声音保留、创作段原无声。两README已加链接，特定成片入库许可覆盖其中实际人声，原WAV/失败素材仍仅本地；已随e130912合main并普通push，精确CI/CD均success；成片保留原录制名称与已知hold，不再重录打磨。发布窗口已释放，无新provider操作或公开平台上传许可。 |
| 不采用旧资源保留 | 用户不需要旧版本兼容，14d/256MiB提案不接CI；[历史方案](archive/2026-10-25/release-retention-not-adopted/README.md)保留。允许旧产品资源删除不等广泛账号工件/Git历史/WT清理。 |

2026-10-27收尾时没有保留5355消费者，58个旧工作树已清理，旧专项已archive；这些是历史事实，不覆盖本轮新建专项 worktree 与总协调身份。旧表中的owner/PID/PTY/tab只作历史证据，不按旧记录启停服务。当前协调入口见[交接说明](coordinator-handoff.md)，未列入文首队列的旧事项不自动续跑。
