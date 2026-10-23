# 本地开发

使用 Node.js 24.15 或更新的 24.x 版本，以及 npm 11。在仓库根目录运行：

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
