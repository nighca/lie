# LIE — 当前项目计划

2026-10-25，最近完成CI/CD核验的发布为 `2f5496d61fca524dca04cf23da4ade8778513924`。CI40183820150/attempt1与CD40183972202均success，Worker `c45edc68-cace-4425-bda6-374a857389cf`；[发布及旧CI纠正证据](releases/2026-10-25-header-spacing/README.md)。正式TLS首页/JS/CSS逐字节匹配精确产物；头部与移动间距已上线。后续归档会继续推进HEAD，操作前读实际Git。

用户暂停四小时换chat，root `01a17012-fa00-7170-ac0a-21c1900d71cd`继续active/唯一integrator；lie ACTIVE、lie-2 PAUSED，实际toml更新时间见[handoff](coordinator-handoff.md)。每次实际review/验证合main后由root按fetch/分歧审验/普通push流程默认推送并监测既有CI/CD；报告并入下一正常批次，避免报告循环。此授权不扩成手工部署、账号资源或真实provider操作。

## 已批准范围与已发布成果

四官方案3/4/4/3人、共享询问480/600/540/480秒（第四案为用户本次明确新增）；引擎支持可变人数，新同玩法案件仅内容与必要呈现配置。浏览器运行故事/会话/指认，薄Worker仅provider传输；纯TS core独立Vue/宿主，凭据不得入客户端。中文B、调查/首页A及既有美术方向已批准，详见[架构](architecture.md)。

仅语音人物交流、只读转写、按钮指认，无证据DSL。多轮可打断，ready后静音/等待/回答计额度；停止暂停、切人不重置。错指终局不揭真相、正确才揭晓，离开确认、刷新不恢复局内状态。final-only回退及合成嘴不当实时ASR/真实口型证明。编辑器三步/预设/同引擎试玩/fragment分享/本地草稿，无账号、云同步、上传素材或版本发布管理。

| 已随a0e发布 | 关键行为与证据 |
| --- | --- |
| 正式八人结果 | 8个v2包、16对结果动画/静态资源按真实被指认者投影，旧四态/81PNG/声音保留；2026-10-25用户在动画专项明确确认统一页8个角色新的两种状态均无问题；不重复合入制作，实际App/窄屏/reduce/fallback边界及strict121见[最终组合](result-game-ui/final-main-verification.md)。不是仅设计在制。 |
| CB01草稿保存保护 | 非finite时长拒绝序列化、原raw保留、修正后保存，notice只清自身保存错误；[审查与修复](reviews/content-boundary-2026-10-25/README.md)。 |
| 单JSON官方案 | 编号JSON派生目录/开局，summary贯通Editor/draft/share/remix/投稿；数值排序/max+1、旧id/URL和缺summary兼容，官方/投稿必填；移除catalog/public副本。[实施与验证](builtin-case-json-implementation/README.md)。不再是未决讨论。 |
| Hackathon14链 | 截至f753890的14项修订已审、随a0e发布；[讨论稿](hackathon/项目亮点.md)及[内部编写依据](hackathon/编写说明.md)保留。移动可用由用户确认，不扩大为盲测/长会话全通过。新平台定位source25e447d已审并随9e1发布，不计入旧a0e发布。 |
| 既有主线 | q90派生/CI-CD拆分、动画首帧/hash/cache、姓名高亮/标题、龙三叔配置、连接提醒/active切人续接、改编quiet入口、KeepAlive/草稿与复制隔离、调查高度等均已发布，不重派。详细原提交/验收见[整理前快照](history/2026-10-25/dashboard-before-a0e-release-archive/README.md)。 |

## 当前待办与门禁

| 优先 / owner | 当前状态及下一步 |
| --- | --- |
| 调查立绘加载占位 / 已发布2268 | [实现与验证](investigation-portrait-loading.md)：动画未就绪显示居中“人物加载中…”，无动画/失败/reduce沿用静态回退，舞台尺寸不变；仅调查页启用。source8b98887完整审查，候选fe56783的36目标测试root复验通过；原生视觉未测，CI/CD及线上新JS身份已确认，未冒充真人验收。 |
| 头部Logo下划线 / 已发布2f5496d | 用户在专项要求移至Logo右下方并看完整页面；source0c4a268已完整审查、桌面/手机实际看图、独立格式/品牌身份审验通过；[当前方案](header-logo-lower-right-design.md)替代[上版位置](header-logo-underline-design.md)。静态重绘非App截图；用户随后在专项明确同意并要求笔画左移接触Logo、直接实现，UI专项4567e2f→28b77d1完整审查并集成发布：移除文字，笔画接触Logo且按后续要求再左移约20px；UI59/types/Webbuild与真实IAB桌面/手机通过，root组合5项Header测试通过。[实现](header-logo-implementation.md)。 |
| 语音连接提示A / 已发布8aa7ec9 | 用户明确批准奶油色A；source777c392已完整审查，Web357/相关21/types/build通过，root候选四项提示测试复验通过。保留取消及现有状态机；与首页CSS精确组合身份通过。[实施](voice-connection-notice/cream-card-implementation.md)；[原生组合QA](voice-connection-notice/combined-native-qa/README.md)已在独立Chrome补验三尺寸、reduce、cancel/ready/fail/late-ready，通过；真实App/controller＋fake transport，不是供应商验收。三稿及B/C替代保留归档。 |
| 第四案Hackathon作弊 / 已发布5a9a31c | 《这真是今天做的吗》3人/480秒，source b7b20e3→2cbae8f、候选c1da7a9→5c87845。仅新增04 JSON运行变更，原有1216产品文件未变；[内容与验证](hackathon-case/README.md)另附。Web357/脚本33/全types/正式build通过，root候选2项真glob/首页开局指认改编分享复验通过；真实AI/盲测未做。CI/CD与线上新JS身份均确认。 |
| PC首页双滚动 / 已发布8aa7ec9 | source b9ef3cb→cf5c0fc完整审查；PC视口约束，仅案件列表内滚；移动端维持自然页面滚动。真实IAB尺寸/第四案可达见[验收](home-scroll/README.md)。两轮5544验收均已原PTY停止并核空监听，组合Chrome亦验证第四案可达。 |
| 移动首页分区间距 / 已发布2f5496d | source397b032→19fba4c、显式Header依赖4567后58dedce已完整审查；≤620px案件区上边距32px，标题与列表关系保持；真实Chrome iframe320/391/620移动和621/1280桌面对照/滚动通过，391/1280与新Header组合几何相同。[证据](home-mobile-section-spacing/README.md)。两轮5544均停止核空、临时入口/tab清理。 |
| P1 真人/真实模型 / root协调用户与QA | 贺宁口径改动已入库，真实模型回归未闭环；三案盲测、mic/外放/长会话、固定device多人隔离、费用硬限额仍缺证据。先确定实际矩阵/费用上限/停止清理边界，再执行；fake/短WAV/ready不替代。 |
| 原生分享/Editor生命周期 / 已完成有限验收 | source79d1798七项独立Chrome已完成，root全文/JSON/三图审查通过：[验收](qa/native-share-editor-d4c-2026-10-25/README.md)。中文emoji/换行分享、reload、valid/damaged历史、试玩Back缓存/无快照Forward回Editor、原生清除确认与焦点、窄屏长内容可达；仅localhost:5544自建合成草稿，末尾恢复null，127旧草稿未碰，5544已停核空。不是Safari/真机/跨设备/剪贴板授权/真实语音通过；16k预算仍暂定。 |
| Hackathon新平台定位 / 已发布 | source25e447d已审查集成并随9e1发布；“游戏＋游戏平台”统领既有UGC/资源/引擎能力，未增加玩法范围。保持讨论稿，不衍生视频制作许可。 |
| 出戏/启动/宿主WS / 工程与内容待排 | [出戏调查](role-immersion-investigation.md)未闭环，[WS非101诊断](dev-websocket-rejection.md)未修vendor；不默认付费叠prompt/换provider。真实visibility/广泛race/硬件touch、silver/mint同accent区分等旧边界保留，不按合成事件声称通过。 |
| 投稿 / Editor＋root | GitHub网页辅助、作者确认；用户计划公开源码不等实际visibility已操作，本批不查/改可见性。无OAuth/PAT/token输入或自动PR；[投稿范围](editor-official-submission-proposal.md)。 |
| 暂停鉴权 | 用户明确暂停，[设计与候选归档](archive/2026-10-25/invite-access-paused/README.md)保留，不恢复实现/QA/CI/部署。 |
| 宣传视频制作 / 专项01a17226-5e5a-7193-b5b7-e522519a3e0c | 73.4秒创作分享片已归档；dcc→3ee→904→434→f623整批36路径root实际审查及[独立完整审验](reviews/video-f623-batch-2026-10-25/README.md)通过。[37.53秒有声试片](promo-video/2026-10-25/user-tab-recording-take01/README.md)含本次新STT/TTS/非零双轨，但30秒上限仍speaking主动结束，非完整回答。用户直接验收效果并批准完整流程；等2f发布结束后唯一≤5分钟正式窗口又在连接阶段失败，未发问题且未观察到STT/TTS，已停止清理并释放，用户tab保留，整片未完成，source721baec已root及独立只读审查并归档，客户端未观察到结果不代表供应商未建资源或零计费。architecture整项只读查连接链路/既存日志，不猜普遍生产故障/不重连/不改provider配置；后续新真实尝试须另明确窗口。无公开上传许可。 |
| 不采用旧资源保留 | 用户不需要旧版本兼容，14d/256MiB提案不接CI；[历史方案](archive/2026-10-25/release-retention-not-adopted/README.md)保留。允许旧产品资源删除不等广泛账号工件/Git历史/WT清理。 |

8787/8788及内部监听受保护；5355/PID37202/PTY40865/tab60仍有动画用户消费者，沿owner回执保留，未扫描/启停。其他端口及历史退出看[服务台账](development.md#服务登记与生命周期)。保护所有在制/dirty/refs；完成设计和失败方案均入库后才讨论清理，归档不等批准。当前状态替代[原文快照](history/2026-10-25/dashboard-before-a0e-release-archive/README.md)，旧发布/失败历史不被覆盖。
