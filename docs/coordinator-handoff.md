# 当前主协调交接状态

2026-10-25，最近完成CI/CD核验的发布为 `e130912a86fa7431886cba03dc15cea510f4282a`。CI40190425237与CD40190596028均attempt1/success，Worker `938c40ed-a35c-47e4-9306-d14fcad0d501`；[发布证据](releases/2026-10-25-combined-demo/README.md)。有声演示片和中英文README链接已入库；运行输入与b1相同，复用正式TLS新标题验证。后续正常批次会推进HEAD，操作前读实际Git。

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

正式八人结果激活/UI、CB01保存保护、单JSON官方案、截至f753890的Hackathon14链均已随a0e发布。结果[最终验收](result-game-ui/final-main-verification.md)、[CB01](reviews/content-boundary-2026-10-25/README.md)、[单JSON](builtin-case-json-implementation/README.md)、[Hackathon依据](hackathon/authoring-notes.md)保留真实来源和边界；不把旧“在制/仅讨论/未推”当当前状态。

| owner / 队列 | 下一步或保留职责 |
| --- | --- |
| root | 唯一integrator/发布turn，平台定位/归档已随9e1发布验证；调查立绘加载占位已随2268发布；本批调度第四案、头部效果图与视频新授权同步，实际审查后串行合入、普通push并检查CI/CD；保持响应，不把长验收尾巴留自己 |
| Hackathon专项 | 新定位25e447d已review并随9e1发布，保留用户决定和既有主线补记 |
| animation parent01a16d44 | 2026-10-25用户在专项明确验收8角色两种新状态无问题，root已读取直接用户原话；5355统一页按要求继续保留。正式激活/UI已发布，不重复制作/合入 |
| architecture_code_review | 单JSON/CI-CD已验发布；本批原始发布材料来自该owner，CI artifact/restored256与Web251为不同集合。后续审查按新source身份，不重复已验全suite |
| character_preset_migration | 调查立绘加载占位source8b98887已clean交付、root完整审查并候选fe56783；36项目标测试root复验通过，沿用source UI/Web类型检查；仅调查页启用slot，无服务启动，IAB不可用，原生视觉未测。[证据](investigation-portrait-loading.md)。 |
| hackathon_case | 新增第四案source b7b20e3→2cbae8f，root完整内容/八文件diff审查、候选c1da7a9→5c87845；仅新增04 JSON为运行变更，root2项专项复验通过。源Web357/脚本33/types/build身份可复用；真实模型/盲测未验。[交付](hackathon-case/README.md)。 |
| 头部UI专项01a16d5c | 原头部9431922仍未批准；用户在专项要求下划线位于Logo右下方、带完整页面对比，新proposal0c4a268已完整审查归档；用户随后明确批准并要求左移接触，专项4567e2f→28b77d1已完成ProductHeader局部及再左移20px，已完整审查并随2f发布；UI59/types/build/IAB桌面手机和root5项测试通过。语音A用户已批准，e214c0e三稿归档并由character owner完成实现；两项门禁独立。 |
| 宣传视频01a17226 | 73.4秒创作分享片及37.53秒合成双向试片已归档。用户主导的take03完成三角色真实问答→正确指认→首页，source1545c1f已root全文审查及[独立复核](reviews/joint-gameplay-1545-2026-10-25/README.md)：PCM/编码/哈希/7881帧索引通过，7ctxclosed/9tracksended、四API引用恢复；[完整记录与失败备选](promo-video/2026-10-25/joint-gameplay-recording/README.md)保留。录屏存在段间hold，具体指认点击瞬间未完整动态捕获，不能声称连续或精确口型；外围finally/observer源码未全保存，仅核终态回执。用户在专项新明确要求试玩前＋创作后、有声合成成片入库并README链接，source1ae1fa3已root全文审查、接缝/末帧实际看图及[独立身份审验](reviews/combined-demo-1ae-2026-10-25/README.md)通过；[成片与复现](promo-video/2026-10-25/combined-demo/README.md)187.433秒、1280×800/30fps/H264/AAC，试玩双方声音保留、创作段原无声。两README已加链接，特定成片入库许可覆盖其中实际人声，原WAV/失败素材仍仅本地；已随e130912合main并普通push，精确CI/CD均success；成片保留原录制名称与已知hold，不再重录打磨。发布窗口已释放，无新provider操作或公开平台上传许可。 |
| home_scroll / character_preset_migration | 首页source b9ef3cb→cf5c0fc、语音A777c392均已审查并随8aa发布；前者真实IAB验收，后者357测试/types/build及root4项通过。组合QA追加48b4b22已在独立Chrome补验并完整审查：三尺寸/reduce/取消迟到完成/首页四案滚动通过；使用真实App/controller＋fake transport，非真实语音。5544 PID10172/PTy45505原session停止exit130并核空监听，tab/临时入口/viewport清理完成。 |
| native QA | source79d1798七项独立Chrome已完成，root全文/JSON/三图审查通过：[验收](qa/native-share-editor-d4c-2026-10-25/README.md)。中文emoji/换行分享、reload、valid/damaged历史、试玩Back缓存/无快照Forward回Editor、原生清除确认与焦点、窄屏长内容可达；仅localhost:5544自建合成草稿，末尾恢复null，127旧草稿未碰，5544已停核空。不是Safari/真机/跨设备/剪贴板授权/真实语音通过；16k预算仍暂定。 |
| 真人/内容QA | 用户最新将贺宁/Hackathon两案真实模型短测交自己，root不再安排；四案全盲测/硬件/长会话/多人隔离和费用硬限额仍未全验，不借此执行新推理。 |
| PR CI与预览01a1730f | 新chat01a1730f-9304-7d51-bf5b-8c20c3d37920已创建，用户先方案确认，未授实施/部署；负责逐PR CI与可跳转预览、fork/凭据/清理/成本等具体方案，root审查入库。 |

旧完整owner/base/有序SHA/失败和WT恢复入口保存在[整理前两页原文及来源SHA](history/2026-10-25/dashboard-before-a0e-release-archive/README.md)，更早[只读WT/ref清单](history/2026-10-25/coordinator-preparation-01a17012-7249a6f/active-handoff-refs.json)有原时间边界，不当当前WT clean/存在证明。不得因刷新文档清理他人dirty/refs/ignored材料。

## 资源与未取消门禁

[服务台账](development.md#服务登记与生命周期)是端口恢复入口。8787/8788及内部子监听受保护，真实版本看main-status，不从Git推断运行ready。5355/PID37202/PTY40865、WT result-reactions-combined-qa/lie、用户tab60仍有消费者；不停止/切源/清用户草稿或归档其WT。其他旧端口沿owner退出回执，本批无扫描/启停/浏览器。

鉴权明确暂停；视频现已获用户明确制作授权，专chat01a17226-5e5a-7193-b5b7-e522519a3e0c与用户直接确认创意细节，旧仅研究门禁不再适用；投稿为GitHub网页辅助、作者确认，用户计划公开仓不等本批已改visibility，无OAuth/token/自动PR。旧版本retention未采用；不扩为账号工件、历史、WT或凭据清理。[当前待办](project-plan.md#当前待办与门禁)包含出戏/宿主WS/真实visibility等未验边界。用户确认移动可用不等全设备长会话/盲测通过。

上次1232归档的产品运行输入与2f相同；本次另含用户明确的首案改名《消失的纪念章》，仅canonical title字段及当前README变化，ID/URL保持，37项相关测试通过、root单字段比较及全文diff审查完成。离线诊断和历史取证仅docs，不重复图片构建或真实provider。新发布CI/CD须另核验。

已发布组合：spacing397→19f→58d及Header4567→28b已随2f发布；root审查/5项Header复验、原生五宽对照及391/1280组合身份均通过。最新纯left微调未重复完整build，最终CI已验证生产构建；证据链接见上。
