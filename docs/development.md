# 本地开发

正式生产入口：[LIE](https://lie.agency/) · [编辑器](https://lie.agency/editor)。2026-10-25用户已启用该域名，指向现有Cloudflare正式Worker；本批仅文档修订，未改DNS/账号/Worker配置。平台原生地址`lie-game.nighca.workers.dev`继续作为原生入口与历史测量origin，不要求删除/重定向；[已核发布](releases/2026-10-25-main-refresh.md)的原始观测保留。

域名文档检查（2026-10-25）：正常TLS普通GET `/`、`/editor`、`/play`均200，最终URL保持lie.agency、0重定向；三者返回同一SPA入口（546 bytes，SHA256 `d9841a11c0cf254cba0b3dc2843f48a249e46ebea9e22986eb4786766bea08cb`），仅证明路由回退交付，不代表已生成可玩分享或执行编辑/语音。只读源码核：分享以`location.origin`生成`/play#game=…`；voice/status用同源相对路径、WS由当前location派生；gateway严格比较请求Origin与请求URL origin，没有写死旧生产hostname，未放宽Origin/CORS。无应用测试/build、浏览器/草稿、API/WS/provider或服务操作。

使用 Node.js 24.22.1 或更新的 24.x 版本，以及 npm 11。在仓库根目录运行：

```sh
npm ci
npm run dev
```

正式 Web 工程的本地入口是 <http://127.0.0.1:5176/>，与独立交互原型的 5173 端口区分。优先在 Codex 内置浏览器调试。

## 目录和命令

- `apps/web`：Vue 3 + TypeScript + Vite，包含完整游戏页面、浏览器对话编排与开发演示。
- `packages/*`：共享模块工作区；公共 UI 包使用 `@lie/ui` 名称，由组件任务提供。
- 根 `tsconfig.base.json`：共享的严格 TypeScript 配置，各包独立检查源码和相关测试。
- 历史原型与探针保存在独立工作分支；不要假设 main 上存在相应目录。

```sh
npm run typecheck
npm test
npm run build
npm run preview --workspace @lie/web
```

类型检查和测试遍历各工作区；构建显式先 Web 后网关。测试使用 Vitest、Vue Test Utils、jsdom 和 workerd，覆盖游戏规则、对话编排、公共组件、语音协议和网关边界。新增业务应按实际行为补充自动化测试。

`npm run build` 产出 `apps/web/dist` 静态文件；类型检查是独立命令，提交前应同时运行 `typecheck`、`test` 和 `build`。正式 Worker 配置位于 `apps/gateway/cloudflare.config.ts`，游戏状态保存在浏览器内存中。禁止将供应商凭证放入 `VITE_*` 变量或前端资源。

## 工作区协作

新增包时在自己的目录定义 `package.json`，组件库可直接导出 TypeScript/Vue 源码供 Vite 编译，无需预先增加库打包层。消费方必须在自身的 `dependencies` 声明使用的工作区包。根锁文件由集成者串行更新：从根目录执行 `npm install` 并提交 `package-lock.json`，干净安装使用 `npm ci`。

## 本地同源网关与自动化

根 `npm run build` 显式先构建 `apps/web`，再把网页和 Worker 打包到 `apps/gateway/.cloudflare/output`，避免工作区目录排序影响干净构建。`npm run dev --workspace @lie/gateway` 在 8787 提供同源网页与 API；普通 Web 开发在 5176，`?demo=1` 仅在开发模式启用明确标注的假语音。网关凭据未配置时会显示真实错误，不会切换到假模型。

GitHub Actions 的 CI 在 main push 或手动触发时执行干净安装、类型检查、离线/替身自动化和完整构建。它不读取灵矽管理 key、不运行 `test:linx`。现有CI在验证成功、确认commit仍是main且既有部署secret可用时会自动部署；普通push可能触发部署，因此仅按明确发布turn执行。真实供应商验收必须另外执行并记录，不能由绿色 CI 推导。

正式部署采用项目本地 cf CLI。首次准备好发布时，在仓库根目录执行 `npm ci`，再由账号持有者运行 `npm exec --workspace @lie/gateway -- cf auth login` 完成登录；使用 `npm exec --workspace @lie/gateway -- cf auth whoami` 检查结果。凭据不应发送到聊天或提交到仓库。供应商预付费与 Cloudflare 登录是不同前提。

## 本地真实语音试玩

准备真实灵矽专用测试设备（不执行推理），在仓库根目录运行：

```sh
npm run test:linx --workspace @lie/gateway -- --key-file /absolute/path/to/.linx-api-key --setup-only --export-dev-vars
npm run build
npm run dev --workspace @lie/gateway
```

打开 <http://127.0.0.1:8787/>。接案、点击“开启对话”、允许麦克风后发问，结束时点“结束对话”。这个页面连接真实灵矽，不使用 `demo=1`。浏览器与系统都可能需要授予 Codex 麦克风权限；始终保留“取消本轮”入口。

本地 Cloudflare Vite 插件读取忽略的 `.dev.vars` 中的语音凭据；production 构建仍无需供应商凭据。该环境只供单个受控浏览器会话使用，不证明公共多用户分配已经完成。

测试设备和凭据保留期间可反复打开同一本地入口。结束试玩后，先停止本地 Worker，再按网关 README 的 `--cleanup` 清理这组专用资源；不要在用户试玩中途清理。不要将 `.dev.vars` 内容发到聊天或提交。

## 固定 main 验收环境

在持有 `main` 的仓库根目录，以 Node.js 24.22.1 / npm 11 执行：

```sh
npm run dev:main
```

固定入口是 <http://127.0.0.1:8787/>，直接提供当前 main 的 Vite 源码。独立薄 Worker 使用 `127.0.0.1:8788`；前端同源代理 `/api/voice`，包括 WebSocket。凭据继续由网关读取本地忽略的 `.dev.vars`，脚本不复制凭据、不创建供应商资源，也不自动发起语音。两个服务仅绑定本机回环地址。当前主机由下述launchd持有这两个端口，不得为手动启动而释放/停止它们；新的受控环境启动冲突会报错并仅停止该脚本自己的子进程。

脚本每 1.5 秒读取 Git：main SHA 改变时停止自身服务，重新生成形象资源并重启；每次启动和锁文件改变时先运行 `npm ci`。安装或生成失败时停止并报告；手工运行可修复后重启，常驻进程管理器须退避重试。切换分支或修改已跟踪文件会暂停服务，恢复干净 main 后自动启动；忽略的凭据和生成文件不影响运行。不要在此 checkout 中实施未合入的功能。

开发专用 <http://127.0.0.1:8787/__lie/main-status> 返回当前服务的 main SHA，可与 `git rev-parse main` 对照；该端点不进入生产构建。已打开的页面在 main 更新导致的重启后应刷新再验收。服务启动和 Git 更新之间有短暂不可用窗口。

`SIGINT` / `SIGTERM` 会停止脚本自己创建的进程组并移除单实例锁。锁位于当前 checkout 的 Git 目录 `main-preview.lock`；锁记录 owner PID；启动时仅在系统明确报告该 PID 已不存在时回收死锁。存活或无法确认的 owner 均报告冲突，不能直接删除其他实例的锁。需要跨 chat 常驻时，由协调者配置本机进程管理器运行同一命令，并保存日志；进程管理器不得在安装失败后无限高速重启。

### 当前主机常驻服务

2026-10-24，当前用户已安装并启动launchd服务 `dev.nighca.lie.main-preview`，固定入口8787跟随owning main checkout；不依赖Codex chat/临时工作树，主协调归档/轮换时保留该服务。登录后自动运行；电脑睡眠/关机时本机服务不可访问。失败重启退避30秒。Node24.22.1完整运行时保留于用户Application Support/LIE/runtime，避免依赖临时目录或修改系统Node。

配置为 `~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist`，日志为 `~/Library/Logs/LIE/main-preview.log`。凭据位于owning main的 `apps/gateway/.dev.vars`，沿用既有同项目测试资源，不是新建provider资源；不读取/输出/提交其内容。前端fs deny同时保护该文件、管理key及Cloudflare本地状态目录。

检查或手工管理（会影响正在测试的页面，请先确认没有需要保留的对局）：

```sh
launchctl print gui/$(id -u)/dev.nighca.lie.main-preview
launchctl kickstart -k gui/$(id -u)/dev.nighca.lie.main-preview
# 停止且卸载当前登录会话中的服务（保留plist，未来登录仍按RunAtLoad启动）
launchctl bootout gui/$(id -u)/dev.nighca.lie.main-preview
# 重新装载
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.nighca.lie.main-preview.plist
```

不要在常驻服务已运行时另开 `npm run dev:main` 或占8787/8788；单实例检查会拒绝重复运行。main更新会重启开发服务，Vite通常重连后刷新，必要时手动刷新；游戏局内状态不跨刷新保留，本地编辑草稿仍按原浏览器存储规则恢复。

### 已完成的命名迁移维护

人物预设迁移所需的一次受控runner切换已由用户明确批准并完成，[实施验收](character-preset-migration-implementation.md)保存真实服务版本/资源/私密路径拒绝证据。它不是每次换代或接新任务都要重启的操作。当前继续用character-presets命令和公开/appearances路径；没有新服务turn不得重复kickstart、复制daemon或清锁。上方管理命令仅作为明确维护窗口下的操作参考。

## 服务登记与生命周期

固定端口用于复用来源与减少重复浏览器授权，不代表允许空闲常驻。启动前先查现有owner、消费者、cwd/SHA与监听；同一任务优先复用同一服务、同源测试路径或明确的多root预览。现有服务不能代表当前候选时，先与owner协调切换来源/配置；只有真实并发隔离或其他owner正在使用且无法共享时，才经协调登记例外，不自动换一个新端口，也不重复启动server绕过审批。

每个owner启动服务时，在任务记录及完整handoff登记：**owner/chat、worktree、源码SHA、端口、PID、原PTY/session、消费者、停止条件**。PID/PTY未知明确写未知，不从旧端口或历史日志猜测新进程归属；根协调收到批量交付后维护下面的当前表。适用的浏览器tab/origin也尽量复用并批量完成检查；权限审批仍遵守原边界，不为减少等待重复请求或绕过审批。

验收结束或消费者释放后立即停临时服务，优先原PTY Ctrl-C，并复核PID/监听已退出。原PTY失效时，只有已经确认owner及无消费者的精确进程，才在操作前再次核PID、cwd和命令后对该PID发送SIGTERM；退出失败/归属不明先协调，不使用pkill、按node或端口批杀。handoff分别列已停（实际退出证据）、保留理由、未知项，不能把“当前未见监听”写成“本次成功停止”。不同时清理WT、refs、文件或凭据。

### 稳定端口分配

| 用途 | owner/chat | 首选端口与停止条件 |
| --- | --- | --- |
| 用户当前main | root `01a17012-fa00-7170-ac0a-21c1900d71cd`／既有launchd | 8787 Web、8788 Worker及其内部子监听。用户常驻环境，换代/归档保留；仅明确服务turn可受控维护，不另起daemon或副本。 |
| Editor验收 | Editor `01a16d90-27cc-77c2-9e0a-4b28b1135371` | 5402，只有必要的受控代理才用5403；同源fixture复用，当前验收结束即停。 |
| 调查UI验收 | 调查 `01a16d5c-de69-7452-8d6a-280d15a87e9e` | 5507；同源路径复用，当前验收结束即停。 |
| 动画制作预览 | 动画 `01a16d44-aeea-7552-b184-5118072e75f3` | 5358 ochre、5359 mint；owner可在不影响当前制作的前提下合用一套多root服务，不强停在制消费者。制作/本批验收结束即停。 |
| 协调分配的有界验收 | root当轮明确的owner；当前动画组合仅离线验证，无服务turn | 5544；不同任务串行借用，不永久属于旧探索QA。先核监听/owner，登记实际WT/SHA/PID/PTY/消费者，结束原PTY停止并核销；不得另开端口或恢复暂停鉴权。 |

PTY仅属于创建它的执行会话，其他chat不能据旧session号宣称已控制该进程。端口分配也不证明当前已有服务在跑；每轮实际状态看下表。CF开发服务器附带的workerd/内部RPC端口属于8788同一受保护进程树，不作为闲置独立预览批杀。

### 当前登记（2026-10-25，基线main7249a6f；轮换已暂停）

用户约10:44暂停四小时换chat，root01a17012继续active/唯一integrator；准备文档不授权停止用户常驻环境或其他owner服务。这是root完整交付事实的更新，不是本次新做端口扫描。PID/PTY仅属于原启动会话，操作前仍须owner实际核对；源码HEAD不证明dirty运行字节。历史21服务清理及所有原始回执已在[清理记录](history/2026-10-25/development-service-cleanup.md)和[整理前原文](history/2026-10-25/coordinator-state-before-refresh-30822d3/development.md)保留，不按历史PID重复停止。

| 端口 / 状态 | owner / 消费者 | 来源 / PID / PTY / 停止条件 |
| --- | --- | --- |
| 8787/8788，用户常驻受保护 | root协调、用户；既有launchd及网关内部子监听 | owning main动态跟随，真实版本查/__lie/main-status。旧盘点PID不沿用为当前PID；没有新明确服务turn不得停止、重启或复制实例。 |
| 5355，珊瑚结果样片用户审看在用 | 动画01a16d44… / 用户tab60 | 当前PID1851、自建tab60消费者保留，33fe后加强版374f289（依赖33fe5d3）已clean交回、用户已直接批准加强版374、root仍待两版档案review，后7最多2lane仅design制作；仅design候选，不是生产manifest/契约更新。本轮没有新启动/端口扫描/停止。旧source1c设计预览PTY15660 exit130、tab59/mediaoverride清且旧PID未采集仅历史；不沿旧回执关闭或推定当前服务已停。 |
| 5544，最终组合验收回合已结束 | character_preset_migration | root候选be83810实际built Worker；Node35404/workerd35876，原PTY13186退出130，PID/监听消失；Chrome1910329555关、Fetch/cache/Network清理。后续视觉/语音/当前最终动画组合均无新服务；首帧69515/74321及性能43122/53366是历史，不重复操作。 |
| 5507，loading历史回合结束/height新turn | 调查01a16d5c… | 旧background-character-names/lie最终09b10a4；背景PID95357/PTY32844、标题PTY97605（PID未记录），各原PTY退出1且随后无监听，tabs37/38已清。新语音回合source fc635b5＋dba2d641，PID50346/PTY39627，消费者IAB39；原PTY Ctrl-C exit1、lsof核无监听、tab39/临时入口清理，无override；已main9b17538；居中PID85753/PTY22271 exit1、无监听/tab40清；PC位置PID8323/PTY85340 exit1、无监听/tab41/temp清，已main14ca。最新姓名间距source0f12453，PID97700/PTY27003停止/无listener、tab42及临时入口清。旧loading/preview回合source5afa：PID30999/PTY27840 Ctrl-C exit1、无listener、IAB43/44关/reduce恢复/4tmp清（owner回执）。sourceWT现从062复用height，保护两未跟踪QA fixture；新height监听/PID按owner后续回执，不能沿旧关闭推断新服务停止。本轮候选仅离线build，无扫描/启停。 |
| 5402/5403，Editor固定分配 | Editor01a16d90… | 改编验收原exec/session23758已退出、无listener，自建tab及临时public/remix-qa.html已清（owner交付/协调确认，本轮未扫描/停进程）。改编已main eafee859、动画已main299；quiet CTA最终验收原session54417已Ctrl-C/无listener，自建tab/fixture清（源quiet-refinement.md回执）；本轮47tests/types/build89组合仅离线，无新服务。最新状态恢复source97a1803→8e09327，原exec89431停止/无listener、tab26/temp清（owner回执）；最终组合Web288/types/build89仅离线，无新服务。最新姓名/草稿提示source335回合exec57157已Ctrl-C、tab29关闭、storage恢复原字节、lsof无listener（owner回执）；本轮329/types/build89仅离线，未启动/扫描服务。后续仅owner按需启用用后停。 |
| 5358/5359及18旧服务，历史清理完结 | 原调查/Editor/动画owner | 既有21服务清理回执存档，不为复用固定端口自动常驻或重复关闭历史进程。 |

保留所有在制/依赖WT、refs及ignored必要材料：特别是动画23链可恢复Git对象及两lane/父QA/旧formal来源、发布兼容61→cad→14a、语音新任务、改编方案、首帧和年长声调查。最新[只读WT盘点](history/2026-10-25/coordinator-preparation-01a17012-7249a6f/worktree-status.json)有时间边界：原browser-architecture dirty及invite-access-design未跟踪归档材料不清；动画sourceWT其后缺失更新见[handoff](coordinator-handoff.md)。服务退出不授权清理它们。前代分享自建tab清理unknown不能按复用的browser/tab号码盲关，须先核实际归属。所有生产维护、真人mic/provider及用户draft另守授权边界。
