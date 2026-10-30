# 开发与服务登记

2026-10-30 文档整理基线 fd049；最新协调回执为 main 已普通 push `bda3ddbf7b69f7f28ee2f112183477e617a2bbd0`，UI精确CI/CD、serving与本地恢复已由发布owner完整回执，root独立核线上fullhash一致。视频另由 `page_version` 在北京时间23:17:16–23:32:16视频＋随后纯文档窗口执行，结果UI不在该窗口内；视频后续新main/children以其下一批回执为准。本表来自已交接的 owner 回执，**本次文档任务没有扫描端口、HTTP、进程或 launchd**。PID 是快照，不是永久停机授权；这里记录UI发布后bda快照，不能沿用为后续视频/文档发布的新PID。

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

启动 Web/gateway 预览前先获得对应端口窗口并核 owner、consumer、cwd/SHA/listener，按应用 README 的 dev 命令配置已分配端口与同源 proxy。根 `npm run dev` 的默认开发端口不构成占用许可；当前 5176/5544/5198 与 8787/8788 均有明确归属，不自行换端口起重复服务。无 consumer 的临时服务应关闭，稳定端口也不授权闲置常驻。

私密配置只在各自获准的 ignored `.dev.vars` 等服务端位置，由应用内部读取；不查看/打印/复制凭据、不导出 token、不放 VITE/client/assets/提交。持久 main 环境使用 owning main 现有 ignored `.dev.vars`，不为“恢复环境”创建 provider 资源、修改套餐或扩大权限。需要真实 Linx/provider 验证时另外取得具体用户窗口，默认离线 fake，不自动执行付费测试命令。

<a id="2026-10-30-当前专项分配"></a>
<a id="服务登记与生命周期"></a>

## 当前服务登记

| 端口 / 生命周期 | owner、来源与最后回执 | consumer 与下一步 |
| --- | --- | --- |
| 8787 Web / 8788 Worker，持久保留，仅 loopback | `session_limit_acceptance`＋总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8`；owning main `/Users/nighca/code/nighca/lie`，launchd `dev.nighca.lie.main-preview`。UI发布后快照：runner66435，Web33625 parent66435，gateway33704 parent33649；source/status bda，healthready。上批fd049 Web48655/Worker48747已是历史；视频/文档后新PID待owner下一批回执。 | 用户本地与 lie.agency 对比；5544 用户试玩 proxy 复用8788。用户已明确本批无对话、允许 main 更新短暂重启，非长期开放维护，也未授权停止5544。保留服务；停止须用户明确要求或新的协调窗口。 |
| 5544，保留用户试玩 | 礼物案 Chat `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e`；WT `8b07/lie`，原 base f862＋专项 dirty；已登记 PID10258 / PTY8214，Vite proxy8788。 | 用户仍审看礼物案，未释放 consumer；不要停、刷新用户 tab 或自行操作 mic。内容迭代后实际 SHA/dirty 由该 owner 下一批登记，不把旧 base 当当前 main。 |
| 5176，已停止释放 | 结果页 Chat `01a18d4c-72b2-7d93-8df3-2aa9cb7a5fe4`，WT `4ea5/lie`。前一 Transcript PID39747 / PTY79421 exit1已交回；本轮结果UI root回执也已停止释放，source2a677→23abd。该轮精确PID/PTY不在本次摘要，留原owner正式handoff，不与旧Transcript快照混用。 | 当前无保留consumer回执；结果UI代码已review，发布窗口另协调。若再启须重新核归属和窗口，不据历史端口擅起服务。 |
| 5198，保留用户编辑 | 视频 Chat `01a17dee-6a37-73f3-bf53-853df51f6b15`；最后登记 PID13491，workbench 用户编辑环境。原 PTY/精确 cwd 未在本次回执提供，待原 owner 补登记，不编造或通过无关探测补齐。 | 用户编辑 consumer 未释放；不重启/停止、不清工程。成品入库许可不等于关闭 workbench。 |
| 5177，已停止交回 | 趣味 PageVersion Chat `01a18d48-6d1a-7273-914e-3c2aef2fa27e`；WT `85bb/lie`，source af960→9549278→a6bf862；原 PID77249 / PTY5085 Ctrl-C exit130，owner 核无 listener。 | 用户批准页面口供版本后结束审看；无运行服务。不得将旧 QA tab/端口自动用于新任务。 |
| 5545 / 5546，已停止交回 | 16k 音频专项；WT `lie-playback-16k-candidate/lie`；原 PTY8226 / 17929 及内部监听已由 owner 停止核清，own Chrome 已关。 | 用户明确试听“没有电流声了，效果很好”并释放环境；不再启动或造语音流量。完整 PID 历史保留专项交付，不拼凑为当前运行值。 |

这张表没有登记为活动的旧 5402/5403、5507、5358/5359 等只是[历史快照](history/2026-10-30/coordinator-refresh-fd049/development.root-draft.md.txt)中的旧窗口，不能自动恢复。未知进程、消费者或归属先协调，不能杀未知 PID、按端口杀进程、`pkill` 或换口绕占用。

<a id="固定-main-验收环境"></a>
<a id="当前主机常驻服务"></a>

## 常驻 main 对比环境

用户 2026-10-30 明确重新授权恢复该服务，覆盖旧 2026-10-25 停用标记，**仅限这个服务**，不恢复旧 chat automation/四小时轮换。使用持久配置：

- label：`dev.nighca.lie.main-preview`；plist：`~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist`。
- runtime：`~/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64`，完整 Node/npm，不依赖 chat/tmp 或全局 Node 修改。
- 日志：`~/Library/Logs/LIE/main-preview.log`；owning clean main：`/Users/nighca/code/nighca/lie`。
- 固定入口 `http://127.0.0.1:8787/`，Worker8788；`/__lie/main-status` 用于非敏感源码/服务 SHA 核对。首页、health、voiceStatus 的 ready/200 不代表已完成真实推理或 provider 资源同一性。

[`scripts/main-preview.mjs`](../scripts/main-preview.mjs) 约每 1.5 秒检查 owning main SHA；只有正确分支且 tracked clean 才随新 SHA 重启自有 children，lock 改变时正常 npm ci。保留单实例 PID lock、仅 ESRCH 可回收的陈旧锁、自有进程组和 launchd 30 秒失败退避；不要手工抢锁或另起 runner。应用本地状态/storage 不因维护清除。此次 UI 更新触发的是既有自动跟随，不再为报告文档制造额外 main 更新；这里children/PID仅为UI发布后bda回执；后续发布按下一批更新。未人为改main模拟重启测试。

本地为 Vite DEV＋本地 workerd，页面版本显示“开发版”，不是线上 production 的同一 bundle；精确本地 main SHA 用 main-status 核。它绕过生产 Cloudflare 网络/平台 CPU 配额，仍受本地 workerd、provider、网络与设备限制。未读取 secret 手比 provider 资源，不把本地 ready、无断连观察或 runtime 恢复当线上配额/音爆根因证明。线上入口为 `https://lie.agency/` 与 `/editor`；旧平台原生地址保持现状，未授权 DNS 改动。

## 服务操作与交付规则

每次启动登记 owner/chat、worktree/SHA/dirty、端口、PID、原 PTY/session、consumer 和停止条件。临时 consumer/验收结束后优先在原 PTY Ctrl-C，再核进程/监听消失；原 PTY 不可用时仅在 owner 确认不再需要、重新核 exact PID/cwd/命令后精确停止。服务关闭不连带清理 worktree/refs/用户文件。

main 跟随重启会影响5544共享8788，发布 owner 必须持唯一 integration/publication turn，先确认实际语音消费者安全维护窗口，保用户 tab/其他端口不动。不要在非窗口自行 `kickstart`、停止或复制 launchd 服务树；不因某端口历史已空就默认可占用。

当前文档任务无服务操作、远端 API、浏览器、provider/WS/mic/profile 或应用测试。旧完整登记、来源/批准门禁和未合入的恢复证据见[日期索引](history/2026-10-30/README.md)；旧记录的“暂停/已停/当前 PID”不覆盖最新明确恢复和 consumer 回执。
