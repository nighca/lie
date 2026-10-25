# 开发预览服务清理与生命周期规则

2026-10-25，Asia/Shanghai。用户要求各chat减少闲置background terminal/dev server，复用稳定端口、减少重复浏览器授权，用完停止。根协调将停止责任按原专项分配，`root/character_preset_migration`仅盘点、整理规则与本记录，不重复发送信号、不启动server/browser、不清WT/refs/文件、不触凭据/provider。

实施基线main `6e52462f8d9902bbf265fbf30f9ad030c855644e`；新分支codex/dev-service-hygiene复用原clean WT，已交迁移branch及79b5503/354f58b/963956f保持冻结。本批为文档规则和实际服务核销，未运行应用全检。

## 原owner完成的18个旧服务

| owner/chat | 端口／监听PID（停止时） | 方式与退出证据 |
| --- | --- | --- |
| 调查 `01a16d5c-de69-7452-8d6a-280d15a87e9e` | 5368/43922、5369/37362、5370/31072、5392/990、5398/31368、5394/45969 | 原PTY不可恢复；owner逐个核cwd/完整命令/端口、已完成任务且仅LISTEN后，精确SIGTERM。最终6端口无监听，6PID及npm30889/45491退出；root未重复逐项检查。 |
| Editor `01a16d90-27cc-77c2-9e0a-4b28b1135371` | 5371/69081、5372/81380、5373/15834、5374/33118、5375/79024 | 原PTY不可恢复；owner逐个核cwd/命令/任务无消费者，精确SIGINT至Vite，未kill共享父进程。最终5端口无监听，5Vite及5npm（68601/80896/15353/32636/78545）均退出。 |
| 动画 `01a16d44-aeea-7552-b184-5118072e75f3` | 5346/88454、5347/58899、5348/69255、5350/94694、5351/5119、5352/4647、5357/63280 | owner经root批量回报已向逐个核实PID精确TERM。根协调随后明确允许一次最终全局只读监听扫描；08:10:18确认7端口均已释放，不补写未独立重查的原7PID全部退出结论。 |

调查real_audio_feedback/notices_and_reveal子agent明确原任务未开server/持久PTY，无需清理。Editor本轮保留0、未知归属0，调查保留0；原有5505/5507/5402/5403等无监听，不冒领为本次root成功停止。部分旧cwd已不存在，报告中的保留分支SHA只能追溯历史，不能证明已删除磁盘的运行字节。

原始回执（由原owner交root并转交本执行者，未包含凭据）：

- `/private/tmp/lie-investigation-preview-cleanup-2026-10-25.md`：2026-10-25调查完整回执，含六项cwd、保留版本、精确停止、父进程退出及无消费者理由。
- `/private/tmp/lie-editor-service-cleanup-20261025.md`、同名`.json`：Editor回执，JSON采样时间`2026-10-25T08:07:10.521449+08:00`；含五项cwd/历史SHA、精确SIGINT与最终端口/父进程退出。
- 动画本次精确TERM的批量回报经root直接消息转交；最终只读全端口采样原始JSON `/private/tmp/lie-dev-service-inventory-final.json`，时间`2026-10-25T08:10:18.463504+08:00`。必要结论与元数据已保存于本文及[当前登记](../../development.md#服务登记与生命周期)，不要求未来依赖tmp文件。

## 保留与未知边界

最终全部TCP范围的LIE cwd筛选只发现：5355（PID4072）、5359（54935）、5544（35694）、用户8787（54878）/8788（54957）及其同一网关workerd54990；内部50360/50366/50367均为回环，不作为独立闲置预览停止。

- 5355有明确消费者：用户现有tab18。动画owner负责待用户不再使用后核并停；其cwd为animation-comparison-preview/lie，当前checkout HEAD读取失败，保留为unknown，不能以旧ref猜测现存文件版本。root不动用户tab。
- 动画最终batch确认5358/5359两个本轮制作入口也已关闭：5358原PTY Ctrl-C；5359旧PTY失效，重新核原PID54935后精确TERM。owner最终核两端口均无LISTEN；连同上面18旧服务，共20个关闭。根侧未再扫或重复停止。
- 后续5544最终回执：verify_editor_candidate已删除精确临时壳，通过原session19829 Ctrl-C退出130，lsof核5544无监听，WT clean。完整回执提交`72c4a93a7a5bd2c1ed4baa78e261d516139a64e9`的`docs/animation/mint-ochre-game-integration.md`；此前QA源c5de95c已纳入该候选，不重复重放。连同前述20个共21个已关闭，不再发送信号。
- 8787/8788为用户launchd固定环境及子进程，只允许明确服务turn维护。无新增daemon或并行服务。

未发现其他未知归属LIE监听。前代root5486/5488/5489等当前未见监听，不能因此认领历史停止或按旧PID操作。当前保留的5355和main有明确消费者；5544已收到最终退出回执。随后动画owner因用户查看全部8角色需求，精确停止旧5355 PID4072后复用同端口：来源final-two-character-game HEAD72c4a93，PTY82389，新PID尚未交不猜测；8人UI逐一切换canvas1/fallback0，logs0。用户tab45已交付，原tab18未改；保留WT及5355直到用户结束或移交稳定main。该受控来源切换不计作额外消除闲置服务。

## 落地规则

[AGENTS](../../../AGENTS.md#development-service-lifecycle)新增持久服务生命周期规则；[development](../../development.md#服务登记与生命周期)为当前端口/owner/消费者与停止条件登记。Editor首选5402、必要代理5403；调查5507；动画5358/5359可由owner协调多root共用；5544为当前QA有界例外；用户8787/8788保护。稳定端口不等于空闲常驻，禁止为绕占用/审批自动换口或重复起服务，使用后优先原PTY Ctrl-C并核释放；PTY失效仅对即时重核且归属明确的PID优雅停止，不pkill/按node或端口批杀、不动未知进程。
