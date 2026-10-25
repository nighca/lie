# 当前主协调交接状态

2026-10-25，最近完成CI/CD核验的发布为 `1232ef884a6841065a73db5a1080d81eeb2fe03e`。CI40184964392/attempt1与CD40185106004均success，Worker `11b07cad-85eb-44d4-a255-291cf8c73599`；[发布证据](releases/2026-10-25-native-video-archive/README.md)。运行输入与2f完全相同，复用其正式TLS身份。后续正常归档会推进HEAD，操作前读实际Git。

## 协调权、自动化与发布

| 字段 | 实际状态 |
| --- | --- |
| coordinator / integrator | active；唯一root `01a17012-fa00-7170-ac0a-21c1900d71cd`；用户已暂停四小时轮换，不release/create或代改自动化 |
| lie推进 | ACTIVE，target同root，created_at=`1792881692759`，本批只读toml的updated_at=`1792911872975` |
| lie-2轮换 | PAUSED，target同root，created_at=`1792881694334`，updated_at=`1792893842022`；用户暂停，不擅自恢复 |
| owning main | `/Users/nighca/code/nighca/lie`；项目`ec01ea33-d2f9-4986-98e0-ed1644ba1772`；前代lie-3/4暂停及子agent句柄不可自动继承事实保留 |
| 发布规则 | 每次review/验证后合main，由root按AGENTS串行fetch/分歧审验/普通push并监测既有CI/CD。不是force/手工部署/新资源/provider许可；报告进下一正常批次避免循环 |

自动化状态来自本批实际只读toml，不读取/复制提示正文或凭据，未修改自动化。新集成会推进HEAD，操作前实际核Git；子agent仅交完整候选/来源/检查，由root实际review和单一集成。

## 已完成与当前所有权

正式八人结果激活/UI、CB01保存保护、单JSON官方案、截至f753890的Hackathon14链均已随a0e发布。结果[最终验收](result-game-ui/final-main-verification.md)、[CB01](reviews/content-boundary-2026-10-25/README.md)、[单JSON](builtin-case-json-implementation/README.md)、[Hackathon依据](hackathon/编写说明.md)保留真实来源和边界；不把旧“在制/仅讨论/未推”当当前状态。

| owner / 队列 | 下一步或保留职责 |
| --- | --- |
| root | 唯一integrator/发布turn，平台定位/归档已随9e1发布验证；调查立绘加载占位已随2268发布；本批调度第四案、头部效果图与视频新授权同步，实际审查后串行合入、普通push并检查CI/CD；保持响应，不把长验收尾巴留自己 |
| Hackathon专项 | 新定位25e447d已review并随9e1发布，保留用户决定和既有主线补记 |
| animation parent01a16d44 | 2026-10-25用户在专项明确验收8角色两种新状态无问题，root已读取直接用户原话；5355统一页按要求继续保留。正式激活/UI已发布，不重复制作/合入 |
| architecture_code_review | 单JSON/CI-CD已验发布；本批原始发布材料来自该owner，CI artifact/restored256与Web251为不同集合。后续审查按新source身份，不重复已验全suite |
| character_preset_migration | 调查立绘加载占位source8b98887已clean交付、root完整审查并候选fe56783；36项目标测试root复验通过，沿用source UI/Web类型检查；仅调查页启用slot，无服务启动，IAB不可用，原生视觉未测。[证据](investigation-portrait-loading.md)。 |
| hackathon_case | 新增第四案source b7b20e3→2cbae8f，root完整内容/八文件diff审查、候选c1da7a9→5c87845；仅新增04 JSON为运行变更，root2项专项复验通过。源Web357/脚本33/types/build身份可复用；真实模型/盲测未验。[交付](hackathon-case/README.md)。 |
| 头部UI专项01a16d5c | 原头部9431922仍未批准；用户在专项要求下划线位于Logo右下方、带完整页面对比，新proposal0c4a268已完整审查归档；用户随后明确批准并要求左移接触，专项4567e2f→28b77d1已完成ProductHeader局部及再左移20px，已完整审查并随2f发布；UI59/types/build/IAB桌面手机和root5项测试通过。语音A用户已批准，e214c0e三稿归档并由character owner完成实现；两项门禁独立。 |
| 宣传视频01a17226 | 73.4秒创作分享片已归档；dcc→3ee→904→434→f623整批36路径root实际审查及[独立完整审验](reviews/video-f623-batch-2026-10-25/README.md)通过。[37.53秒有声试片](promo-video/2026-10-25/user-tab-recording-take01/README.md)含本次新STT/TTS/非零双轨，但30秒上限仍speaking主动结束，非完整回答。用户直接验收效果并批准完整流程；等2f发布结束后唯一≤5分钟正式窗口又在连接阶段失败，未发问题且未观察到STT/TTS，已停止清理并释放，用户tab保留，整片未完成，source721baec已root及独立只读审查并归档，客户端未观察到结果不代表供应商未建资源或零计费。[只读历史日志诊断](reviews/intermittent-voice-2026-10-25/README.md)完成，根因未知；失败窗仅/status200，精确voice/上游错误聚合缺项不证明未到Worker。[离线被动分类器](promo-video/2026-10-25/passive-voice-diagnostics/README.md)sourcebb1834f已全文审查，原7项+独立4项通过；尚未证明真实故障原因。用户随后明确再试一次，第二轮仍连接失败并已释放；source736fae1已完整审查并归档[实际失败证据](promo-video/2026-10-25/full-gameplay-take02/README.md)和[独立审验](reviews/full-gameplay-take02-2026-10-25/README.md)。用户先同意亲手点击对照，首次等待未点击到期、0provider，不当语音失败；随后明确取消该对照，改为协作完整录制。root已读直接用户指令01a172b0-3cca-7ce2-aafd-9bf2c3265304，批准≤8分钟窗口：专项从首页操作至调查，之后用户亲手开启/真实mic说话/切人/指认/回首页，专项持续录音录像；不自动重试/reload，逐项清理，窗口结束前冻结push。后续入口须有限错误分类及分项finally，不改生产/provider配置。无公开上传许可。 |
| home_scroll / character_preset_migration | 首页source b9ef3cb→cf5c0fc、语音A777c392均已审查并随8aa发布；前者真实IAB验收，后者357测试/types/build及root4项通过。组合QA追加48b4b22已在独立Chrome补验并完整审查：三尺寸/reduce/取消迟到完成/首页四案滚动通过；使用真实App/controller＋fake transport，非真实语音。5544 PID10172/PTy45505原session停止exit130并核空监听，tab/临时入口/viewport清理完成。 |
| native QA | source79d1798七项独立Chrome已完成，root全文/JSON/三图审查通过：[验收](qa/native-share-editor-d4c-2026-10-25/README.md)。中文emoji/换行分享、reload、valid/damaged历史、试玩Back缓存/无快照Forward回Editor、原生清除确认与焦点、窄屏长内容可达；仅localhost:5544自建合成草稿，末尾恢复null，127旧草稿未碰，5544已停核空。不是Safari/真机/跨设备/剪贴板授权/真实语音通过；16k预算仍暂定。 |
| 真人/内容QA | 贺宁真实模型、三案盲测、长会话/mic/外放、多用户隔离和费用硬限额未闭环；fake/短WAV和静态HTTP身份不是证明 |

旧完整owner/base/有序SHA/失败和WT恢复入口保存在[整理前两页原文及来源SHA](history/2026-10-25/dashboard-before-a0e-release-archive/README.md)，更早[只读WT/ref清单](history/2026-10-25/coordinator-preparation-01a17012-7249a6f/active-handoff-refs.json)有原时间边界，不当当前WT clean/存在证明。不得因刷新文档清理他人dirty/refs/ignored材料。

## 资源与未取消门禁

[服务台账](development.md#服务登记与生命周期)是端口恢复入口。8787/8788及内部子监听受保护，真实版本看main-status，不从Git推断运行ready。5355/PID37202/PTY40865、WT result-reactions-combined-qa/lie、用户tab60仍有消费者；不停止/切源/清用户草稿或归档其WT。其他旧端口沿owner退出回执，本批无扫描/启停/浏览器。

鉴权明确暂停；视频现已获用户明确制作授权，专chat01a17226-5e5a-7193-b5b7-e522519a3e0c与用户直接确认创意细节，旧仅研究门禁不再适用；投稿为GitHub网页辅助、作者确认，用户计划公开仓不等本批已改visibility，无OAuth/token/自动PR。旧版本retention未采用；不扩为账号工件、历史、WT或凭据清理。[当前待办](project-plan.md#当前待办与门禁)包含出戏/宿主WS/真实visibility等未验边界。用户确认移动可用不等全设备长会话/盲测通过。

本批仅新增原生验收、视频素材/方案和文档，产品运行输入与2f发布相同；文档/媒体/脚本检查与完整审验已记录，不重复图片构建或真实provider。归档不能替代新发布的CI/CD核验。

已发布组合：spacing397→19f→58d及Header4567→28b已随2f发布；root审查/5项Header复验、原生五宽对照及391/1280组合身份均通过。最新纯left微调未重复完整build，最终CI已验证生产构建；证据链接见上。
