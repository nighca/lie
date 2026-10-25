# LIE — 当前项目计划

2026-10-25，最近完成CI/CD核验的发布为 `5a9a31c26b1e8f7be57b4147c2886b785b052111`。CI40176764338/attempt1与CD40176928339均success，Worker `b1866411-b431-4f59-80f1-a6bd0f9e6eed`；[发布证据](releases/2026-10-25-hackathon-case/README.md)。新设计归档会继续推进HEAD，操作前读实际Git。

用户暂停四小时换chat，root `01a17012-fa00-7170-ac0a-21c1900d71cd`继续active/唯一integrator；lie ACTIVE、lie-2 PAUSED，实际toml更新时间见[handoff](coordinator-handoff.md)。每次实际review/验证合main后由root按fetch/分歧审验/普通push流程默认推送并监测既有CI/CD；报告并入下一正常批次，避免报告循环。此授权不扩成手工部署、账号资源或真实provider操作。

## 已批准范围与已发布成果

四官方案3/4/4/3人、共享询问480/600/540/480秒（第四案为用户本次明确新增）；引擎支持可变人数，新同玩法案件仅内容与必要呈现配置。浏览器运行故事/会话/指认，薄Worker仅provider传输；纯TS core独立Vue/宿主，凭据不得入客户端。中文B、调查/首页A及既有美术方向已批准，详见[架构](architecture.md)。

仅语音人物交流、只读转写、按钮指认，无证据DSL。多轮可打断，ready后静音/等待/回答计额度；停止暂停、切人不重置。错指终局不揭真相、正确才揭晓，离开确认、刷新不恢复局内状态。final-only回退及合成嘴不当实时ASR/真实口型证明。编辑器三步/预设/同引擎试玩/fragment分享/本地草稿，无账号、云同步、上传素材或版本发布管理。

| 已随a0e发布 | 关键行为与证据 |
| --- | --- |
| 正式八人结果 | 8个v2包、16对结果动画/静态资源按真实被指认者投影，旧四态/81PNG/声音保留；用户方向已批，实际App/窄屏/reduce/fallback边界及strict121见[最终组合](result-game-ui/final-main-verification.md)。不是仅设计在制。 |
| CB01草稿保存保护 | 非finite时长拒绝序列化、原raw保留、修正后保存，notice只清自身保存错误；[审查与修复](reviews/content-boundary-2026-10-25/README.md)。 |
| 单JSON官方案 | 编号JSON派生目录/开局，summary贯通Editor/draft/share/remix/投稿；数值排序/max+1、旧id/URL和缺summary兼容，官方/投稿必填；移除catalog/public副本。[实施与验证](builtin-case-json-implementation/README.md)。不再是未决讨论。 |
| Hackathon14链 | 截至f753890的14项修订已审、随a0e发布；[讨论稿](hackathon/项目亮点.md)及[内部编写依据](hackathon/编写说明.md)保留。移动可用由用户确认，不扩大为盲测/长会话全通过。新平台定位source25e447d已审并随9e1发布，不计入旧a0e发布。 |
| 既有主线 | q90派生/CI-CD拆分、动画首帧/hash/cache、姓名高亮/标题、龙三叔配置、连接提醒/active切人续接、改编quiet入口、KeepAlive/草稿与复制隔离、调查高度等均已发布，不重派。详细原提交/验收见[整理前快照](history/2026-10-25/dashboard-before-a0e-release-archive/README.md)。 |

## 当前待办与门禁

| 优先 / owner | 当前状态及下一步 |
| --- | --- |
| 调查立绘加载占位 / 已发布2268 | [实现与验证](investigation-portrait-loading.md)：动画未就绪显示居中“人物加载中…”，无动画/失败/reduce沿用静态回退，舞台尺寸不变；仅调查页启用。source8b98887完整审查，候选fe56783的36目标测试root复验通过；原生视觉未测，CI/CD及线上新JS身份已确认，未冒充真人验收。 |
| 头部Logo下划线 / 待用户确认 | [效果图与参数](header-logo-underline-design.md)已出并展示；source9431922完整审查后归档候选a6ea1bc，保留Logo/下划线原几何与参考图。桌面/391为静态矢量上下文，不是App截图；尚未批准，正式组件未改。 |
| 语音连接提示视觉 / UI专项01a16d5c | 用户反馈居中提示颜色深、移动端偏大；已安排三版浅色紧凑设计及短文案、桌面/391上下文对比，保留显著“连上后再说话”提醒与取消操作。仅设计，用户选定后再实施，不改语音状态机；先交既有头部稿避免新需求拖延旧交付。 |
| 第四案Hackathon作弊 / 已发布5a9a31c | 《这真是今天做的吗》3人/480秒，source b7b20e3→2cbae8f、候选c1da7a9→5c87845。仅新增04 JSON运行变更，原有1216产品文件未变；[内容与验证](hackathon-case/README.md)另附。Web357/脚本33/全types/正式build通过，root候选2项真glob/首页开局指认改编分享复验通过；真实AI/盲测未做。CI/CD与线上新JS身份均确认。 |
| P1 真人/真实模型 / root协调用户与QA | 贺宁口径改动已入库，真实模型回归未闭环；三案盲测、mic/外放/长会话、固定device多人隔离、费用硬限额仍缺证据。先确定实际矩阵/费用上限/停止清理边界，再执行；fake/短WAV/ready不替代。 |
| 原生分享/Editor生命周期 / QA | 最近600常驻状态SHA吻合但无ready字段，工具无IAB且设备锁定返回；7个native case未测、无草稿/tab/service动作。[实际前置](qa/native-share-editor-600-2026-10-25/README.md)。等可用窗口再排，旧8jsdom不重跑当进展。16k URL预算仍暂定；跨浏览器/外部传输/旧fragment网络边界未全验。 |
| Hackathon新平台定位 / 已发布 | source25e447d已审查集成并随9e1发布；“游戏＋游戏平台”统领既有UGC/资源/引擎能力，未增加玩法范围。保持讨论稿，不衍生视频制作许可。 |
| 出戏/启动/宿主WS / 工程与内容待排 | [出戏调查](role-immersion-investigation.md)未闭环，[WS非101诊断](dev-websocket-rejection.md)未修vendor；不默认付费叠prompt/换provider。真实visibility/广泛race/硬件touch、silver/mint同accent区分等旧边界保留，不按合成事件声称通过。 |
| 投稿 / Editor＋root | GitHub网页辅助、作者确认；用户计划公开源码不等实际visibility已操作，本批不查/改可见性。无OAuth/PAT/token输入或自动PR；[投稿范围](editor-official-submission-proposal.md)。 |
| 暂停鉴权 | 用户明确暂停，[设计与候选归档](archive/2026-10-25/invite-access-paused/README.md)保留，不恢复实现/QA/CI/部署。 |
| 宣传视频制作 / 专项01a17226-5e5a-7193-b5b7-e522519a3e0c | 用户现已明确授权新chat开始制作，将直接在专项沟通创意和细节；既有“仅方法研究”限制已被新决定替代。承接[方法研究](promo-video-production-research.md)，专项确认具体制作规格后推进；发布/上传、付费及共享采集资源仍按实际授权协调。 |
| 不采用旧资源保留 | 用户不需要旧版本兼容，14d/256MiB提案不接CI；[历史方案](archive/2026-10-25/release-retention-not-adopted/README.md)保留。允许旧产品资源删除不等广泛账号工件/Git历史/WT清理。 |

8787/8788及内部监听受保护；5355/PID37202/PTY40865/tab60仍有动画用户消费者，沿owner回执保留，未扫描/启停。其他端口及历史退出看[服务台账](development.md#服务登记与生命周期)。保护所有在制/dirty/refs；完成设计和失败方案均入库后才讨论清理，归档不等批准。当前状态替代[原文快照](history/2026-10-25/dashboard-before-a0e-release-archive/README.md)，旧发布/失败历史不被覆盖。
