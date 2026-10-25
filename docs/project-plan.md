# LIE — 当前项目计划

2026-10-25，本轮已审main基线 `b3874d9f3ddd7a9d7ac91e380bed10f9c55bc3dd`。**用户约10:44暂停四小时换chat，本root继续做完项目**；唯一active coordinator/integrator仍01a17012-fa00-7170-ac0a-21c1900d71cd，不释放、不新建chat。本代推进lie ACTIVE、轮换lie-2 PAUSED，root约10:46只读确认，target/created_at不变。[handoff](coordinator-handoff.md)管所有权与门禁，[服务台账](development.md#服务登记与生命周期)管端口，[原文/refs快照](history/2026-10-25/coordinator-preparation-01a17012-7249a6f/README.md)保留历史；不把旧10:41deadline当现行许可。

已main：结果页A、官方三案同步打包、清单恢复、姓名唯一、帧守卫、性能hash/cache/动画首帧/背景姓名高亮与标题（c334e67）、三案背景和贺宁口径（7249）。不重做。当前已证远端/CI/CD/线上静态部署a64bf6c1674b9755dbacc4d7519e92675ee5f4bf，见[最新发布核验](releases/2026-10-25-q90-ci-cd/success.md)；旧483见[历史发布核验](releases/2026-10-25-main-refresh.md)；静态指纹同本地已验产物，不等真人功能验证。后续36a已含龙三叔配置，本轮归档基线main b3874d9f3ddd7a9d7ac91e380bed10f9c55bc3dd已含改编quiet入口、桌面立绘top32 CSS、正式动画与PNG研究归档。root保持响应，整项委派实施/环境/排障/浏览器/长检查，自己负责实际完整review、决策及串行隔离集成；文档批只查文档，按实际身份复用验证。用户已回来，旧夜间临时授权结束，所有设计/替代/失败方案须入库，归档不等于批准。

## 已批准的产品与架构

三官方案3/4/4人，询问额度480/600/540秒；通用引擎可变人数，新同玩法案件仅内容与必要呈现配置。浏览器运行故事、会话、指认，薄Worker仅provider传输；纯TS core独立Vue/宿主。故事纯文本，形象以appearanceId分离，完整故事浏览器可查，凭据私密。中文B黄蓝/深蓝卡通、调查A/首页A、既有Logo/头像、有限Canvas与静态回退均已批准，见[架构](architecture.md)。

语音为唯一人物沟通方式，转写只读、按钮指认，无证据DSL。持续多轮可打断；连通准备完成后静音/等待/回答均计额度，停止暂停、切人不重置。耗尽停止语音并允许最终指认；合法错指终局失败不揭真相，正确才揭晓。离开确认，刷新不恢复局内状态。玩家仍final-only回退，不称实时ASR；合成嘴不称真实口型同步。

编辑器三步自由往返、必选预设、唯一答案、同引擎试玩、压缩fragment、本地草稿，无账号/云同步/上传资产/发布版本管理。新编辑草稿姓名trim后唯一，临时未完成草稿仍可保存；旧同名分享可读。三人是作者内容原则，不是core人数硬限制。

## 当前队列与下一步

用户本轮授权的普通push修复后已完成：远端main a64bf6c，CI40165378030/CD40165634861均success，真实Worker版本dabb77da-39b5-4b69-bf90-bddbced1628e；lie.agency有限静态核验8响应SHA均同已验候选。[实际发布证据](releases/2026-10-25-q90-ci-cd/success.md)。旧297 coverage失败/CDskip与修复完整保留；本报告归档不自动二次push。正式结果UI/激活仍独立在制，不混成本轮已发布成果。

当前发布状态：a64bf6c已通过CI40165378030/CD40165634861及线上有限静态身份核验，[最新证据](releases/2026-10-25-q90-ci-cd/success.md)。后四位设计归档已由root实际review并本地集成，正式结果功能仍在制；本批不再push。旧483为历史发布，不覆盖当前事实。

完整owner/base/ordered SHAs/实际WT和检查边界见[handoff](coordinator-handoff.md)及[恢复清单](history/2026-10-25/coordinator-preparation-01a17012-7249a6f/active-handoff-refs.json)。新意图先与已分派文件协调，不重叠抢写。

| 优先 / owner | 当前状态与下一步 |
| --- | --- |
| 已发布a64 CI/CD拆分 / architecture_code_review＋root | 精确CI run40165378030/attempt1产物12588780677经CD40165634861恢复195文件，latest-main及真实deploy成功；Worker version dabb77da-39b5-4b69-bf90-bddbced1628e。[完整证据/静态指纹](releases/2026-10-25-q90-ci-cd/success.md)。覆盖率路径修复后573应用＋33脚本tests成功，不重复build/test于CD；无手动重试/部署。 |
| 不采用 旧版本保留 / production_release_compatibility＋root | 用户2026-10-25明确“不需要考虑旧版本兼容，老版本资源可以删除”。取消61a4f4d→cad7fd7→14a32fb实施/14天保留/累计256MiB预算选择门禁，不接CLI/CI、不再等待确认；现有hash构建仅current资源即可，无新增代码。候选README、修正、完整三SHA与代码引用[归档](archive/2026-10-25/release-retention-not-adopted/README.md)，[审查](reviews/release-compatibility-2026-10-25/README.md)保留。此批无实际线上删除；不授权清理Git历史/WT/凭据或广泛账号工件。 |
| 已main 动画 / 动画专项＋root | 用户视觉已验，root完整技术/范围review；用户取消PR路线，原owner已确认PR #1 CLOSED/mergedAt null，无merge。常规本地候选df8d26d（main14ca＋23链＋9aa报告）Web281/UI43/runtime33、三包types/build89、hash/8包/46parts/龙三叔及QA隔离均通过，[完整报告](animation/combined-final-animation-verification-2026-10-25.md)，已root review并本地main299，已随48316544发布/CI实际部署。不重复视觉，不夹整个远程分支。 |
| 已main 连接提醒＋active切人续接 / 调查视觉＋root | source fc635b56→dba2d641已root完整review，两提交纳入main **9b17538ba93fb9c388851a6882f1deb9954a304e**；全局醒目连接提示/取消，以实际收音ready退出，准备不计时；仅active（含准备中）切人断A接B，原已结束不开，历史/额度保留，迟到事件隔离、失败无循环。最终组合**31套266tests/types/build89通过**，7hash/完整20路径同源，龙三叔manifest/hash及QA不进生产包已核；[验收与复用边界](performance/2026-10-25/combined-voice-verification.md)。源IAB桌面/391为离线替身，无真人mic/provider；5507 PID50346/PTY39627 exit1无监听、tab39清。已随48316544发布/CI实际部署；App/controller所有权已释放给改编。提示居中微调7424已完整review并纳入main b3f9bf69029cb04aa0c21c58080192ee53f71b2a；5507本轮PID85753/PTY22271 exit1、无监听/tab40清。用户追加PC去姓名后立绘底部空，原owner仅获桌面portrait-backdrop CSS有界下移验收turn，窄屏/资源/组件不动，source ffa0b7534ccec65c34be81a1ae78aeb6a96ce6bc（baseb3，desktop top32px/mobile0）已root review并main14ca，当前组合保留，5507 PID8323/PTY85340 exit1、无监听/tab41清；不抢改编文件。 |
| 已main 改编游戏 / Editor＋root | sourced3bd29c6已root全文生产/5测试/docs及desktop/391两图review；组合Web281/types/build89与QA隔离通过，已main eafee859。[原验收](remix-game-proposal/combined-verification.md)。成功/失败复制当前完整静态案件＋新caseID，已有raw draft明确替换/取消/失败保留。5402旧session23758清理保留；quiet最终session54417已Ctrl-C/无listener、自建tab/fixture清。后续“我要改编”最右CTA复用quiet UiButton＋“改编案件”标题：候选4769b5a→5d24f00与source b84f1c7a六路径一致，独立47tests/types/build89通过、其他生产字节同main299，root已审[组合报告](remix-game-proposal/quiet-combined-verification.md)并本地main a128320，已随48316544发布/CI实际部署。 |
| 已main 年长男声 / older_male_voice＋root | 用户认为两候选仍年轻，**若无更合适先龙三叔并接受sunny同声，按现有支持候选实施已获授权**。voiceId2e7965636b0d4472ae51e75f419dff41；source7058f31368629d850ae8270a4339539eee8542f6已完整root review/独立单字段哈希核验，**main36a06de已实现**，其余7预设相等、不改sunny；source36tests/Webtypes/build89通过，候选应用资源依赖同源复用。已随48316544发布，未真人耳验扩展，不扩provider/克隆或付费样本。旧[候选](older-male-voice/available-candidates.md)仍待选择措辞已被此次决定覆盖。 |
| 已main，待真实模型回归 / case_content_revision | sourcea549bbe，root完整12files/三案11profiles/ending/context/docs review、候选411f8d8与source应用/tests/依赖同源；Core51/Web17/types/build89复用，root独立三对byte/其他字段原样通过，main7249。背景154→112/189→132/161→111；贺宁普通施压不自曝口径已调，**未真实模型回归，不能称实测修好**。原文/备选/矩阵已[入库](case-content-revision-2026-10-25/README.md)，无服务/provider。 |
| 已main / 性能、首帧、视觉 | mainc334e67；最终Web245/UI43/Gateway16/types/build89及40Miniflare，实际builtWorker有界开局/切人无staticfirst；[组合](performance/2026-10-25/combined-visual-verification.md)与[浏览器边界](performance/2026-10-25/combined-first-render-verification.md)保留。92hash输出/46parts、原89资源字节保留；源warm13资源零transfer不是线上新部署，PNG全81实测5.28%/66.73s，root已读完整报告并独立8项/源SHA汇总核验，同意暂不接构建；sourcea46的研究文档经fe32d46归档，已main299，不改生产。[PNG证据](performance/2026-10-25/png-lossless/README.md)。背景字面最长匹配/歧义中性、标题“{姓名}的询问记录”，不重派。 |
| 正式结果已本地main，未推 / 动画parent＋architecture_code_review＋root | 八人design已main归档；激活/UI/legacyfixture/真实App与八人页证据组成候选cb2，补runtime v1夹具ab7后完整root coverage579应用＋33脚本、CI17、types/Web+Gatewaybuild/strict121通过，8包62refs、40源SHA、81旧PNG/声音/旧态和124static同源，QA隔离通过。[最终组合报告](result-game-ui/final-main-verification.md)。root已实际审报告并本地集成，未push，线上仍a64；5355 PID37202/PTY40865/tab60用户消费者保留，其他制作/验收tab已清（owner回执）。 |
| 已随a64发布 / 调查页高度＋character_preset_migration | source7c5ab232→候选1dc7e996，相main9a6635ce仅12行高度CSS；原测量/fixture身份与JSON断言复核、Webbuild99modules/strict89通过。[短报告](investigation-viewport-height-combined.md)。原IAB45–47按身份范围复用，本轮无browser/service；5507 PID29602/PTY38417 exit1、无监听、tabs/temp清。 |
| 部分已确认，排序讨论，未授实施 / 单JSON增加内置案 | 用户确认删case-catalog派生目录、手写summary入正文、测试读content/games并删public/games、Editor输入及草稿/导出/分享/改编保留summary。无order、数字文件前缀与投稿count+1仍提议；root建议显式数值排序/prefix不改id旧URL/max+1/合入前冲突核查、旧summary兼容及必填分层，尚未确认。[当前讨论与旧方案](builtin-case-json-proposal.md)，本轮仅文档不迁移代码。 |
| 已发布a64 q90 / 图片专项＋architecture_code_review＋root | q90/m6/alpha_q100、不缩放/原PNG保留已root审查并发布a64；Linux真实50编码成功，currentmanifest及WebP线上MIME/cache/hash与本地已验资源相等，[发布证据](releases/2026-10-25-q90-ci-cd/success.md)。81图9,746,332B，8包46parts；[组合报告/审计](performance/image-build-optimization/combined-main-verification.md)保留。源IAB4图仅按相同静态资源范围复用。 |
| 已随a64发布 全站page title / Editor＋root | d325→4cd已root全文review，当前候选e818440→ba68f00接HTML正式品牌/title helper/真实Application两行；组合Web319/UI52/runtime43/generator23/types/build89（96modules）通过。[组合报告](page-titles/result-contract-combined-verification.md)。保留preview gate/loading；原IAB19矩阵与final28两页复核按原范围复用，未新browser。已root读报告并main365，现随a64发布。 |
| 已随a64发布 编辑器草稿提示位置 / Editor＋root | 已在main6b126c9整体移到步骤条下方居中，出现条件/清除/缓存语义不改、窄屏可换行；与姓名高亮组合329/types/build通过。 |
| 已随a64发布 公共角色名高亮＋草稿提示 / Editor＋root | source277→1a→db2→8b→335已root完整review；公共纯文本组件/统一样式覆盖调查标题、指认、成功经过和Editor预览，草稿状态/清除入口移三步下居中，wrong不泄真相、输入/复制/按键不改。已删唯一未引用global旧规则，不动height布局。最终候选fd4b257 Web35files329/types/build89（99modules）及资源/QA隔离通过，[报告](character-name-highlights/combined-verification.md)；已root审报告并main6b126c9，现随a64发布。源IAB按记录范围复用，5402exec57157/tab29/storage已清理，未归因MutationObserver限制保留。 |
| 已随a64发布 试玩结果隐藏改编 / 调查视觉＋root | /editor/preview成功/失败隐藏改编且handler防旁路；official/shared保留，返回原内存编辑/草稿保护不变。source af8141a→d4a1d81→5afa已root全文review，候选b42e55b全运行/依赖身份相同，复用288/types/IAB六场景，本轮新build89与QA隔离通过，[组合说明](voice-connection-loading-combined.md)。已root审报告并main911，现随a64发布；源WT现复用height不影响旧clean交付。 |
| 已随a64发布 连接提示loading / 调查视觉＋root | 青绿色20px环/1.1s纯CSS、reduce静态、取消保留；source5afa与候选b42e55b生产/依赖完全相同，root已审完整图/运行时证据，复用源IAB43/44及288/types，本轮build89通过。[身份/复用边界](voice-connection-loading-combined.md)。旧5507 30999/27840已exit1/tab43/44清，height新服务不外推。已main911、现随a64发布，不重占已释放App/Application。 |
| 修复组合通过 / Editor＋root | RSM-01保存失败试玩返回保留编辑/步骤/人物（含QA003）、RSM-02复制意图隔离已实现；97a1803→8e09327补失活立绘卸载、激活重建，最多缓存一份Editor、离开范围清理，改编替换key失效。root完整review；最终候选aa6fc190 **Web288/types/build89通过**，已root审[组合报告](editor-state-recovery/combined-verification.md)、本地ff并发布48316544，CI/deploy成功及线上产物身份已核；[发布记录](releases/2026-10-25-main-refresh.md)。旧[review](reviews/remix-state-review-2026-10-25/README.md)错误探针归档，不当修复后验收。 |
| QA原生前置未具备，review在制 / character_preset_migration＋architecture_code_review | QA已核8787状态实际SHA600，无ready字段；本轮一次工具inventory无IAB并报告Mac锁定，7个native case均未执行、无草稿/tab/service动作。[前置事实与未测范围](qa/native-share-editor-600-2026-10-25/README.md)已归档，等工具可用窗口再排、不猜ID/回退Chrome/新开端口。review检查voice controller迟到事件/切人/计时/释放，以有限fake探针确认新缺陷，不重复已修项。无provider/mic/新service/生产修改/push；root收完整证据后审查归档及另行排修。 |
| 已审候选归档 离线分享/Editor QA / character_preset_migration | source877ac94889b2ea140263997575751d1d32861e10四文件已root全文review并候选fd4b257归档；[8离线场景/边界](qa/released-share-editor-2026-10-25/README.md)，无新confirmed缺陷。固定483探针本轮不重跑；真实reload/popstate/BFCache/dialog未验，CUA未暴露IAB、不回退Chrome/启5544，不冒称原生QA。 |
| P1 真人/盲测/多用户 / root协调用户＋QA | mic/外放/长会话、三案盲测、固定device多人隔离、正式费用硬限额未闭环。fake/短WAV/ready不替代，新增声仍按用户真实耳验范围，不后台保活mic。 |
| P2 分享/投稿 / Editor＋root | 有界IAB539/16000 URL往返/reload/损坏输入已测；跨浏览器/地址栏粘贴/外部传输/离线/旧fragment网络补测未验，16k暂定、128KiB仅Node。投稿PRIVATE/用户GitHub门禁，不新增OAuth/PAT/代理投稿。 |
| P2 出戏、启动延迟、开发WS / 工程/内容owner待排 | [出戏调查](role-immersion-investigation.md)尚未解决，不无限付费叠prompt/换provider。observer已main但非真人加速证据；[宿主WS非101](dev-websocket-rejection.md)仅诊断，未修vendor。 |
| 交付组合通过 两项小优化 / Editor＋调查视觉 | 预设卡仅图像，aria-label/选中态/人物自己姓名保留；姓名高亮仅margin-inline少量间距，主题色/原文/匹配不变。root已读原图与完整diff；source0f12453及97a1803→8e09327在aa6fc190组合Web288/types/build89及字节/QA隔离核验通过。[报告](editor-state-recovery/combined-verification.md)；source IAB按相同字节复用，未重做浏览器；已随48316544发布，CI/deploy及线上静态身份已核，不重复派。 |
| P3 Editor/视觉边界 / owner待排 | QA003随RSM-01完成、最终候选回归通过；silver/mint同accent区分待定，不全面重画。真实visibility/广泛race/硬件touch未验；1280×720既有舞台裁切，合成hidden不算真隐藏PASS。 |
| 暂缓 鉴权 / 独立chat01a17076 | 用户明确暂停；[归档](archive/2026-10-25/invite-access-paused/README.md)及三候选/ignored材料保留，不恢复实现/QA/CI/部署，旧设计批准不替代重新启动许可。 |

## 已集成与已完成研究

| 成果 | 当前事实及证据 |
| --- | --- |
| 原三案/8人动画/UI/Editor/共享/品牌/命名迁移/README覆盖率 | 已随abb12db发布；详细历史见[索引](history/2026-10-25/README.md)与[整理前计划](history/2026-10-25/coordinator-state-before-refresh-30822d3/project-plan.md)。应用92.08%、脚本91.32%为不同分母的历史采样快照，不是现main重新采样。 |
| 姓名唯一 | 已main10c57c2；用户选定修复QA002，59相关测试/types/build89及root身份review，旧分享兼容；独立浏览器组合未验不冒称。 |
| 上下文帧守卫 | 已main531c721；[实施](context-frame-guard.md)，完整UTF8/RPC envelope守卫和具体提示，原64KiB/故事/历史保留，不解决超限内容续玩政策。 |
| 清单加载恢复 | 已main1f168e3；[证据](preset-loading-recovery.md)，8s fetch＋body deadline/retry/草稿保留；真实候选151组合测试/types/build89通过。 |
| 目录＋完整官方案eager打包 | 已main792e182；[证据](bundled-case-catalog.md)，目录/三案单一源，unknown失败，自编/分享优先，无官方/games请求；46相关测试/types/build89及有界实际浏览器通过，JS gzip增12824B。图片/语音仍运行时，不称整站离线。 |
| 结果页A | 已main7b4d96a；[实施](result-scene-implementation.md)，真实被指认者default/首字回退、wrong终局不泄真相，correct完整经过；组合Web220/24files/types/build89通过，root原图review，B/C未授权。 |
| 稳定探索QA首轮 | [报告11图](qa/stable-exploration-2026-10-25/README.md)：无P1、两P2已按上表修复、P3仍建议。测试固定abb12db/demo；不当真人provider验收。 |
| Draft已root审 / Hackathon亮点文档 | 独立chat01a17114-7dbb-74c2-ab1d-fd24725c9d65交[四维初稿](hackathon/项目亮点.md)，source67c3da2b0f09b9c8ac67fdbb2e64e70946a1f3be已root全文review，文档候选0c6286b收录。保留Draft、待用户讨论/赛制补充，集成不等用户批准；无发布/视频制作。 |
| 宣传准备研究 | [方法/依赖研究](promo-video-production-research.md)已完成，不再排待做。实际视频严格后置；原研究与拒绝/替代设计按[归档](archive/README.md)保留。 |

## 当前门禁与资源

- **最新本轮发布已完成a64bf6c**：CI40165378030/CD40165634861均success，线上有限静态身份核验同已验产物，[最新发布核验](releases/2026-10-25-q90-ci-cd/success.md)。旧[483发布](releases/2026-10-25-main-refresh.md)保留历史；报告/设计归档不自动二次push，本批不再发布，无额外手工Cloudflare部署许可。原PR #1 CLOSED/mergedAt null，不恢复PR路线；真人验证另记。
- 用户已明确不采用旧版本资源保留，相关14天/256MiB策略门禁取消；允许旧产品资源删除不授权广泛账号工件/Git历史/WT清理，此批无实际删除。没有新账号、secret、资源、付费测试或生产维护许可。
- 宣传仅[方法/依赖研究](promo-video-production-research.md)完成；实际脚本/分镜/录屏/配音音乐/生成媒体/制作须用户成熟判断后明确授权。投稿PRIVATE及[代理投稿方案](editor-official-submission-proposal.md)门禁保留。用户已启用正式域名[lie.agency](https://lie.agency/)并指向现有正式Worker，编辑器为[/editor](https://lie.agency/editor)；早先lie.nighca.me仅指导属于历史，本批未操作DNS/账号，原workers.dev保留为平台原生/历史观测地址。
- [端口台账](development.md#服务登记与生命周期)保留用户8787/8788及内部子监听。本批不扫描/启停服务，5544/5355/旧5507仅沿原owner退出证据；5507居中验收85753/PTY22271已exit1且tab40清；桌面立绘PID8323/PTY85340已exit1/无监听、tab41清，当前动画组合无新服务；其他人dirty/WT/refs不清理。前代分享tab未知不盲关。
- 真实mic/provider试验仍须明确矩阵、时长/费用上限、首FAIL/UNCERTAIN停止和自建资源清理；优先IAB，具体授权fallback才使用独立Chrome。原子agent句柄不会自动交给新chat；用户已暂停轮换，本root继续推进。
