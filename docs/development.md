# 本地开发

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

GitHub Actions 的 CI 在 main push 或手动触发时执行干净安装、类型检查、离线/替身自动化和完整构建。它不读取灵矽管理 key、不运行 `test:linx`、不自动部署。真实供应商验收必须另外执行并记录，不能由绿色 CI 推导。

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

固定入口是 <http://127.0.0.1:8787/>，直接提供当前 main 的 Vite 源码。独立薄 Worker 使用 `127.0.0.1:8788`；前端同源代理 `/api/voice`，包括 WebSocket。凭据继续由网关读取本地忽略的 `.dev.vars`，脚本不复制凭据、不创建供应商资源，也不自动发起语音。两个服务仅绑定本机回环地址。运行前须释放这两个端口；启动冲突会报错并停止本脚本的子进程，不终止其他服务。

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

### 人物预设命名迁移的 runner 切换

正式源为 `design/character-presets/`，生成命令为 `npm run character-presets:generate`，生成入口为 `scripts/character-presets.mjs`；公开 URL 仍是 `/appearances/`。`main-preview.mjs` 启动时固定生成命令，运行中的旧 runner 不会随 Git 轮询重载自身代码。因此本次迁移合入干净 main 后，由环境执行 owner 在协调者给出的服务窗口执行一次现有 launchd 的 `kickstart -k`，使原 runner 加载新命令；不要新增 daemon、旧命令 shim 或并行实例。

切换前核对 main SHA、干净状态和现有 launchd owner，保留原 plist、日志、端口与私密配置；切换后等待原服务完成锁文件安装和资源生成，核 `/__lie/main-status` 与集成 SHA 一致、8787/8788 均只监听回环，逐项核源/public/dist 的清单投影和资源字节，且前端访问网关私密路径仍返回403。只核状态/拒绝结果，不打印私密文件内容；不调用语音或新建供应商资源。若启动失败，依据原日志排查，不启动第二套服务或删除尚存活的锁。本次实施候选验证与集成后的真实常驻服务验收分别记录，不以候选测试代替已重启证明。
