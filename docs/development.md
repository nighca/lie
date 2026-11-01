# 开发与服务登记

2026-11-01 当前登记截点：已审main5552215已普通push，CI41318558408仍在跑；持久8787/8788随owning main保留，不将push或本地跟随称为生产已验。徒步专项无保留本地服务、PR4已关闭且云Preview清理确认404。5176为WebMCP迭代、5544为首次帮助用户体验，均未释放；5177/5198仍按最后回执保护。Safari诊断工具已审、待普通集成，没有新应用服务或真实mic/provider验收。本轮仅按owner/root回执登记，不探测或启停服务。

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

启动 Web/gateway 预览前先获得对应端口窗口并核 owner、consumer、cwd/SHA/listener，按应用 README 的 dev 命令配置已分配端口与同源 proxy。根 `npm run dev` 的默认开发端口不构成占用许可；5176/5544/5177/5198与8787/8788按最后owner回执均有保留消费者；5180/5182旧轮已释放，新任务仍需重新协调归属，不自行换端口起重复服务。无 consumer 的临时服务应关闭，稳定端口也不授权闲置常驻。

私密配置只在各自获准的 ignored `.dev.vars` 等服务端位置，由应用内部读取；不查看/打印/复制凭据、不导出 token、不放 VITE/client/assets/提交。持久 main 环境使用 owning main 现有 ignored `.dev.vars`，不为“恢复环境”创建 provider 资源、修改套餐或扩大权限。需要真实 Linx/provider 验证时另外取得具体用户窗口，默认离线 fake，不自动执行付费测试命令。

<a id="2026-10-30-当前专项分配"></a>
<a id="服务登记与生命周期"></a>

## 当前服务登记

| 端口 / 生命周期 | owner、来源与最后回执 | consumer 与下一步 |
| --- | --- | --- |
| 8787 Web / 8788 Worker，持久保留，仅loopback | `session_limit_acceptance`＋总协调；owning main `/Users/nighca/code/nighca/lie`，launchd `dev.nighca.lie.main-preview`。P0实际配置/恢复回执为main16d6434、namespace `local-main`，runner81316/Web82946/gateway83547是当轮快照，后续main跟随会换children；先前main-status读回51264a属历史；已审main现为5552215，持久服务随owning main推进，不将旧SHA/PID当本轮服务实测。 | 用户本地对比；5544当前首次帮助consumer复用8788，旧江苏消费者已释放不代表新consumer或持久main服务可停。后续由root持唯一集成turn，正常review后main→CI/CD；用户已接受短时不可用，明确正在语音时再简单协调，不设复杂固定窗口。[已归档回执](reviews/device-concurrency-2026-11-01/actual-prod-receipt.md)。 |
| 5176，WebMCP本地迭代用户consumer保留 | Chat `01a19745`；WT `c4e9/lie`、branch `codex/webmcp-authoring-research`。最后登记Web PID48877/原PTY35629，入口 `/editor?demo=1&webmcp=1`；51830ee/3e68803仅旧Demo身份。 | 用户已改方向为表单partial直接写现有草稿＋能力提示，owner实施中，尚无新clean交付，不把旧检查覆盖新流程。consumer仍保留；owner释放后原PTY停并核PID/listener，不能用旧调查页5176退出记录停止本轮。不打印token。 |
| 5544，首次帮助本地Vue体验保留 | Chat `01a19748`；WT `a92e/lie`、branch `codex/first-use-help-assessment`。最近至少f24d267已审，仍用户迭代；最后登记Web PID64673/原PTY63756、cwd `apps/web`、strict127.0.0.1/proxy8788，入口 `/` 或 `/?demo=1`。 | 用户consumer继续保留，尚未最终接受产品合入/发布；旧360ac91及startup1b028cf只作历史。用户释放后owner原PTY停核，不读editor store、不自动真实voice，不因旧江苏5544退出记录擅停。 |
| 5544，江苏案最终试玩已停止交回 | 江苏案Chat `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e`；WT `lie-jiangsu-starter/lie`、branch `codex/lie-jiangsu-starter`、base1e88180＋当轮专项变更，最终源d6d33a7。原Web PID29602/PTY34175，strict127.0.0.1、proxy既有8788。用户接受后owner原PTY Ctrl-C停止，PID与5544监听核空，root收到同项回执。 | 用户consumer/服务turn已释放；没有关闭或刷新用户tab，不触碰8787/8788。旧礼物案释放事实另列，不将其PID套用于本轮；不自动重启。 |
| 5544，礼物案用户试玩已释放 | 礼物案 Chat `01a18add-78a2-72d0-b8c1-7b0c2dac9c0e`；WT `8b07/lie`、原base f862＋dirty，原PID10258/PTY8214。用户明确本轮试玩结束不保留环境；owner只读核无listener、原PTY Unknown process。 | 退出时间/原因未知，本次没有执行stop。保留dirty内容/附件，不重启、刷新用户tab或升级旧前端；正式案件确认门禁不变。 |
| 5176，调查页UI试玩已停止交回 | UI Chat `01a1964e-eda0-78c2-b353-ffcecf1cfed0`；WT `6d4d/lie`、branch `codex/investigation-ui-followup`、clean43a08229。Node24 Web以proxy8788、strict127.0.0.1:5176运行；原PID19329/PTY80248，用户明确验收通过并允许撤环境。owner复核监听后原PTY Ctrl-C exit130，ps19329及lsof5176均空。 | consumer/turn已释放，未动用户tab/storage/8787/8788，不把原分享QA或结果页旧PID套成本轮。新任务起前另协调。 |
| 5182及内部63075，P0 fake验收已停止 | owner `/root/cookie_device_implementation`、P0 Chat `01a19557-145d-72f3-ace4-382ac03c22c9`；源cf375958（产品a178），Node41692/workerd41766、原PTY64276 Ctrl-C exit130，精确ps/listener均空。 | 自建pages2/3/4已关闭、native contexts closed/合成track停止；保留原page1。无真实provider/mic，本轮不重启；方法与身份见[本地验收](reviews/device-concurrency-2026-11-01/acceptance/README.md)。 |
| PR原生云Preview验收，已收尾；无本地服务 | owner PR Chat `01a19533-d60a-7980-91b8-9e7ec1dbbe6a`；真实PR2 v1/v2同地址前后端同版、R2六请求/两合成、voice两Device/三逻辑WS与owned清理通过。close CI41296845867/cleanup publisher41296859092 job124819485297 success，10:18:42Z deleted=true，精确GET404。 | PR2 closed/unmerged，owned远端分支已删除GET404，main不变；private unknown=null、两owned绑定已解绑、两自建tab已关闭、服务0。共享测试R2按批准保留，关PR不删共享数据或扩大清理；真实fork未验。 |
| PR3自动云Preview，成功保留；无本地服务 | 总协调按用户授权rename＋普通merge同步原PR分支，head d67d69c；CI41302052728与publisher41302167123实际成功，receipt/上传/固定4GET/publish均通过。 | PR3 OPEN且DO NOT MERGE，未合main；无新增provider/voice测试，无服务启停。PR2关闭回收记录不适用于PR3，不删除其预览或共享R2数据。 |
| PR4云Preview已按授权关闭回收；本专项无本地服务 | 徒步案已获用户最终接受并集成main5552215；PR4按授权close，自动cleanup成功，原Preview入口404已由owner/root确认。 | 不再提供PR4预览；共享R2按原批准保留，不扩大清理。正式main CI41318558408仍运行，生产验收另核；EPIPE未定因，不称已修复。 |
| 5180，分享gateway验收已停止；原5176轮为历史 | owner `/root/share_frontend`；源27a＋dirty、最终34c5af8。原Web75839/PTY8893与gateway75292/PTY31258均Ctrl-C exit130，内部56985、workerd75705及56996/56997核空，自建IAB清理。 | 与新UI5176回执分开；不把本地R2/DEV身份当云验收。 |
| 5198，最后登记为用户编辑consumer | 视频 Chat `01a17dee-6a37-73f3-bf53-853df51f6b15`；cwd `lie-promo-production/lie/tmp/promo-landscape-v3-2026-10-30/workbench`，原launcher95944已退出；PID13491只是源owner最后回执，不是本轮复核。 | 尚无consumer释放回执，不重启/停止、不清工程；未来须owner核当前command/cwd/精确PID，不能把launcher退出当服务已停。新视频Git入库撤销与专项上传授权均不改变该服务门禁。 |
| 5177，最后登记为分享UI Demo用户审看 | owner `/root/share_ui_demo`、Chat `01a194d9-e260-7cd2-a8df-89b1478a1120`；WT `lie-share-storage-ui-demo/lie`，branch `codex/lie-share-storage-ui-demo`，c4ee640→eccf75f。原PID29883/PTY99739、a8＋dirty后HMR，仅历史来源。 | 没有新释放回执，仍保护用户consumer；不能因为正式分享已上线就擅停，用户释放后由owner原PTY停并核销。 |
| 5545/5546，16k试听已停止交回 | 历史WT `lie-playback-16k-candidate/lie`，原PTY8226/17929及内部监听owner已停核清，own Chrome已关。 | 用户试听正向反馈及旧PID只属历史，不重启或自动造语音流量。 |

这张表没有登记为活动的旧 5402/5403、5507、5358/5359 等只是[历史快照](history/2026-10-30/coordinator-refresh-fd049/development.root-draft.md.txt)中的旧窗口，不能自动恢复。未知进程、消费者或归属先协调，不能杀未知 PID、按端口杀进程、`pkill` 或换口绕占用。

<a id="固定-main-验收环境"></a>
<a id="当前主机常驻服务"></a>

## 常驻 main 对比环境

用户 2026-10-30 明确重新授权恢复该服务，覆盖旧 2026-10-25 停用标记，**仅限这个服务**，不恢复旧 chat automation/四小时轮换。使用持久配置：

- label：`dev.nighca.lie.main-preview`；plist：`~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist`。
- runtime：`~/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64`，完整 Node/npm，不依赖 chat/tmp 或全局 Node 修改。
- 日志：`~/Library/Logs/LIE/main-preview.log`；owning clean main：`/Users/nighca/code/nighca/lie`。
- 固定入口 `http://127.0.0.1:8787/`，Worker8788；`/__lie/main-status` 用于非敏感源码/服务 SHA 核对。首页、health、voiceStatus 的 ready/200 不代表已完成真实推理或 provider 资源同一性。

[`scripts/main-preview.mjs`](../scripts/main-preview.mjs) 约每 1.5 秒检查 owning main SHA；只有正确分支且 tracked clean 才随新 SHA 重启自有 children，lock 改变时正常 npm ci。保留单实例 PID lock、仅 ESRCH 可回收的陈旧锁、自有进程组和 launchd 30 秒失败退避；不要手工抢锁或另起 runner。应用本地状态/storage 不因维护清除。main更新（包括文档）可能触发既有自动跟随，不为报告单独制造额外main更新；旧children/PID仅为当轮快照；a8历史身份见[发布回执](results-layout-release/2026-10-31.md)，P0配置与local-main恢复见[实际回执](reviews/device-concurrency-2026-11-01/actual-prod-receipt.md)，均不能替代下一维护turn实际复核。正常review后main→CI/CD；用户已接受短时不可用，不再要求固定新窗口，明确正在语音时再简单协调。未人为改main模拟重启测试。

本地为 Vite DEV＋本地 workerd，页面版本显示“开发版”，不是线上 production 的同一 bundle；精确本地 main SHA 用 main-status 核。它绕过生产 Cloudflare 网络/平台 CPU 配额，仍受本地 workerd、provider、网络与设备限制。未读取 secret 手比 provider 资源，不把本地 ready、无断连观察或 runtime 恢复当线上配额/音爆根因证明。线上入口为 `https://lie.agency/` 与 `/editor`；旧平台原生地址保持现状，未授权 DNS 改动。

## 服务操作与交付规则

每次启动登记 owner/chat、worktree/SHA/dirty、端口、PID、原 PTY/session、consumer 和停止条件。临时 consumer/验收结束后优先在原 PTY Ctrl-C，再核进程/监听消失；原 PTY 不可用时仅在 owner 确认不再需要、重新核 exact PID/cwd/命令后精确停止。服务关闭不连带清理 worktree/refs/用户文件。

main 跟随重启会影响所有复用8788的consumer（当前5544用户体验仍保留），发布 owner 必须持唯一 integration/publication turn，按用户简化要求允许短时不可用，仅用户明确正在语音时简单协调，保用户tab/其他端口不动。不要自行 `kickstart`、停止或复制 launchd 服务树；不因某端口历史已空就默认可占用。

本轮文档整理无服务操作、远端API、浏览器或应用测试；仅做必要文档检查，main更新及自动跟随按正常review发布流程，不追加复杂窗口审批，不创建真人provider/WS/mic/profile流量。旧完整登记、来源/批准门禁和已纳本批候选的恢复证据见[日期索引](history/2026-10-30/README.md)；旧记录的“暂停/已停/当前 PID”不覆盖最新明确恢复和 consumer 回执。

原语音Chat `01a18ac7-cdfc-7690-a0c9-bdc3e6fc8eb9` 现已archived，root未自行unarchive；若干旧voice WT已不在worktree list。精确提交（如1ee049e）及refs仍可归档，目录/旧PID只是历史证据；不为归档恢复chat、服务或旧WT。以上均为协调回执，本任务未额外探测。

## 分享R2与本地隔离（2026-11-01）

用户自行启用R2后明确批准两桶创建：`lie-shared-games`（production）、`lie-shared-games-dev`（独立开发验收），均Standard/private。03:41:18Z实际readback：r2.dev关闭、无自定义域名、无CORS、无对象自动过期；保留平台7天abort未完成multipart默认规则。此时间点尚未上传案件或部署Worker，是创建阶段历史；后续98d71分享已上线、正式合成验收通过。完整创建事实与beta18 raw body修正见[发布准备](share-storage-release-readiness.md)。不重新创建、不扩权限或账单。

正式配置默认生产桶，独立开发目标通过 `LIE_SHARE_BUCKET_NAME=lie-shared-games-dev` 明确覆盖；本地 `dev.remote:false`／插件remoteBindings:false只用各WT的Miniflare R2，不连接生产桶，不复制provider secrets。绑定的本地配置与构建dry-run不等于云部署验收；正式serving R2/CPU30000/voice600已有已归档回执，不沿用本地build作证明。PR受信publisher固定共享非生产桶，真实六次请求/两合成案件已验；共享数据不按PR前缀隔离，关闭PR不删除。新的云写读/语音smoke仍须具体turn，本轮文档不执行。

案件intro有效load会后台prepare并可能产生供应商OTA/绑定请求；准备仍无mic/WS、不扣玩法额度。只有health/status只读检查不能被扩大为实际案件浏览也零provider。生产/开发Cookie签名与环境按已批准配置隔离，不复制secret值或把两套token等同计费隔离。
