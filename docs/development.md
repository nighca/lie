# 开发与服务登记

2026-11-01 当前登记截点：owning local/remote main为a8be758，结果页/布局/前批归档已发布并恢复本地health/ready；Web64161、gateway64257、runner66435是该轮回执快照，不是本次重新探测值。分享联合候选正在隔离准备，尚无本批main自动重启维护窗口。下面服务事实来自各owner/root回执，不为文档更新扫描或操作用户服务。

## 本地开发

使用 Node.js `24.22.1` 或符合根 engines 的 24.x、npm 11；根目录 `npm ci` 安装 workspace 依赖。源码在 `apps/web`、`apps/gateway` 与 `packages/*`；应用边界见[架构](architecture.md)。实现、依赖、临时文件和产物放专项独立 worktree，不在主工作区落临时工作，不跨 checkout 软链共享 node_modules。

常规离线检查：

```sh
npm run typecheck
npm test
npm run build
npm run character-presets:check
```

按实际改动运行必要检查；纯文档只做文档/链接/敏感材料检查。character presets 的生成/校验入口是根 scripts；素材或生成契约变化再运行生成，不手工改生成物。构建应从预期 clean HEAD 重做，页面版本注入精确 git SHA/dirty，build 后再改 tracked 文档会改变下一次身份。Mock 测试不能证明真实 provider。

启动 Web/gateway 预览前先获得对应端口窗口并核 owner、consumer、cwd/SHA/listener，按应用 README 的 dev 命令配置已分配端口与同源 proxy。根 `npm run dev` 的默认开发端口不构成占用许可；5544/5198 与 8787/8788 有保留消费者，5176/5180分享验收已停止释放但需重新协调归属，不自行换端口起重复服务。无 consumer 的临时服务应关闭，稳定端口也不授权闲置常驻。

私密配置只在各自获准的 ignored `.dev.vars` 等服务端位置，由应用内部读取；不查看/打印/复制凭据、不导出 token、不放 VITE/client/assets/提交。持久 main 环境使用 owning main 现有 ignored `.dev.vars`，不为“恢复环境”创建 provider 资源、修改套餐或扩大权限。需要真实 Linx/provider 验证时另外取得具体用户窗口，默认离线 fake，不自动执行付费测试命令。

<a id="2026-10-30-当前专项分配"></a>
<a id="服务登记与生命周期"></a>

## 当前服务登记

| 端口 / 生命周期 | owner、来源与最后回执 | consumer 与下一步 |
| --- | --- | --- |
| 8787 Web / 8788 Worker，持久保留，仅loopback | `session_limit_acceptance`＋总协调；owning main `/Users/nighca/code/nighca/lie`，launchd `dev.nighca.lie.main-preview`。a8发布后main-status精确a8、health正常、voiceStatus ready；Web64161/gateway64257、runner66435仅当轮已核快照。 | 用户本地对比及5544 proxy复用8788；保留consumer。本批main更新会自动重启，须root取得新的无语音维护窗口；不沿用旧许可。 |
| 5544，保留用户试玩 | 礼物案 Chat `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e`；WT `8b07/lie`，原 base f862＋专项 dirty；已登记 PID10258 / PTY8214，Vite proxy8788。 | 用户仍审看礼物案，未释放 consumer；不要停、刷新用户 tab 或自行操作 mic。内容迭代后实际 SHA/dirty 由该 owner 下一批登记，不把旧 base 当当前 main。 |
| 5176 Web / 5180 gateway，分享验收已停止释放 | owner `/root/share_frontend`，WT `lie-share-storage-frontend/lie`，启动源27a＋dirty，最终交付34c5af8。Web75839/PTY8893与gateway75292/PTY31258均原PTY Ctrl-C exit130；内部56985及workerd75705的56996/56997也核退出，所有listener为空。 | 本次自动验收consumer结束，自建两个IAB tab已关/网络与metrics恢复；不把本地R2合成数据或DEV身份当云端验证。再启动需重新分配。 |
| 5198，保留用户编辑 | 视频 Chat `01a17dee-6a37-73f3-bf53-853df51f6b15`；来源 cwd `/Users/nighca/.codex/worktrees/lie-promo-production/lie/tmp/promo-landscape-v3-2026-10-30/workbench`，原 launcher session95944已退出；PID13491为源owner最近lsof回执，用户IAB编辑保留。 | 用户编辑 consumer 未释放；不重启/停止、不清工程。视频取消Git入库不等于关闭workbench或删除工程；未来停止须精确重核command/cwd/`.dev.pid`，不将已退出launcher当存活服务PTY。 |
| 5177，分享UI Demo保留用户审看 | owner `/root/share_ui_demo`，发起Chat `01a194d9-e260-7cd2-a8df-89b1478a1120`；WT `lie-share-storage-ui-demo/lie`、branch `codex/lie-share-storage-ui-demo`，源c4ee640→eccf75f。原PID29883/PTY99739，启动源a8＋dirty后HMR，具体UI已获用户批准。 | 用户审看consumer仍保留，尚无停止许可；由原owner在用户释放后原PTY停并核PID/listener。此前布局93927/49034已停只属历史，不套到此服务。 |
| 5545 / 5546，已停止交回 | 16k 音频专项；历史来源WT `lie-playback-16k-candidate/lie`（不能据旧路径认定仍在worktree list或有活跃服务）；原 PTY8226 / 17929 及内部监听已由 owner 停止核清，own Chrome 已关。 | 用户明确试听“没有电流声了，效果很好”并释放环境；不再启动或造语音流量。完整 PID 历史保留专项交付，不拼凑为当前运行值。 |

这张表没有登记为活动的旧 5402/5403、5507、5358/5359 等只是[历史快照](history/2026-10-30/coordinator-refresh-fd049/development.root-draft.md.txt)中的旧窗口，不能自动恢复。未知进程、消费者或归属先协调，不能杀未知 PID、按端口杀进程、`pkill` 或换口绕占用。

<a id="固定-main-验收环境"></a>
<a id="当前主机常驻服务"></a>

## 常驻 main 对比环境

用户 2026-10-30 明确重新授权恢复该服务，覆盖旧 2026-10-25 停用标记，**仅限这个服务**，不恢复旧 chat automation/四小时轮换。使用持久配置：

- label：`dev.nighca.lie.main-preview`；plist：`~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist`。
- runtime：`~/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64`，完整 Node/npm，不依赖 chat/tmp 或全局 Node 修改。
- 日志：`~/Library/Logs/LIE/main-preview.log`；owning clean main：`/Users/nighca/code/nighca/lie`。
- 固定入口 `http://127.0.0.1:8787/`，Worker8788；`/__lie/main-status` 用于非敏感源码/服务 SHA 核对。首页、health、voiceStatus 的 ready/200 不代表已完成真实推理或 provider 资源同一性。

[`scripts/main-preview.mjs`](../scripts/main-preview.mjs) 约每 1.5 秒检查 owning main SHA；只有正确分支且 tracked clean 才随新 SHA 重启自有 children，lock 改变时正常 npm ci。保留单实例 PID lock、仅 ESRCH 可回收的陈旧锁、自有进程组和 launchd 30 秒失败退避；不要手工抢锁或另起 runner。应用本地状态/storage 不因维护清除。此次 UI 更新触发的是既有自动跟随，不再为报告文档制造额外 main 更新；旧children/PID仅为UI发布时快照；a8发布后的HTTP身份与当轮PID见[发布回执](results-layout-release/2026-10-31.md)，该快照不替代未来实际复核。后续发布必须取得新窗口。未人为改main模拟重启测试。

本地为 Vite DEV＋本地 workerd，页面版本显示“开发版”，不是线上 production 的同一 bundle；精确本地 main SHA 用 main-status 核。它绕过生产 Cloudflare 网络/平台 CPU 配额，仍受本地 workerd、provider、网络与设备限制。未读取 secret 手比 provider 资源，不把本地 ready、无断连观察或 runtime 恢复当线上配额/音爆根因证明。线上入口为 `https://lie.agency/` 与 `/editor`；旧平台原生地址保持现状，未授权 DNS 改动。

## 服务操作与交付规则

每次启动登记 owner/chat、worktree/SHA/dirty、端口、PID、原 PTY/session、consumer 和停止条件。临时 consumer/验收结束后优先在原 PTY Ctrl-C，再核进程/监听消失；原 PTY 不可用时仅在 owner 确认不再需要、重新核 exact PID/cwd/命令后精确停止。服务关闭不连带清理 worktree/refs/用户文件。

main 跟随重启会影响5544共享8788，发布 owner 必须持唯一 integration/publication turn，先确认实际语音消费者安全维护窗口，保用户 tab/其他端口不动。不要在非窗口自行 `kickstart`、停止或复制 launchd 服务树；不因某端口历史已空就默认可占用。

原文档整理任务无服务操作、远端API、浏览器或应用测试；本批集成只执行必要离线checks/构建，main更新及自动跟随须新确认窗口，不创建真人provider/WS/mic/profile流量。旧完整登记、来源/批准门禁和已纳本批候选的恢复证据见[日期索引](history/2026-10-30/README.md)；旧记录的“暂停/已停/当前 PID”不覆盖最新明确恢复和 consumer 回执。

原语音Chat `01a18ac7-cdfc-7690-a0c9-bdc3e6fc8eb9` 现已archived，root未自行unarchive；若干旧voice WT已不在worktree list。精确提交（如1ee049e）及refs仍可归档，目录/旧PID只是历史证据；不为归档恢复chat、服务或旧WT。以上均为协调回执，本任务未额外探测。

## 分享R2与本地隔离（2026-11-01）

用户自行启用R2后明确批准两桶创建：`lie-shared-games`（production）、`lie-shared-games-dev`（独立开发验收），均Standard/private。03:41:18Z实际readback：r2.dev关闭、无自定义域名、无CORS、无对象自动过期；保留平台7天abort未完成multipart默认规则。未上传用户案件、未部署Worker；完整事实与beta18 raw body修正见[发布准备](share-storage-release-readiness.md)。不重新创建、不扩权限或账单。

正式配置默认生产桶，独立开发目标通过 `LIE_SHARE_BUCKET_NAME=lie-shared-games-dev` 明确覆盖；本地 `dev.remote:false`／插件remoteBindings:false只用各WT的Miniflare R2，不连接生产桶，不复制provider secrets。绑定的本地配置与构建dry-run不等于云部署验收；后续生产需核实际serving binding/CPU30000/voice600。合成云写读smoke须另获明确turn，本批候选准备不做。
