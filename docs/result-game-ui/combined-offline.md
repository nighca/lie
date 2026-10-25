# 结果资源与正式 UI 组合离线验证

2026-10-25。状态：离线检查通过，等待父任务同一 5355 端口实际浏览器验收；不宣称已集成 main、发布或完成视觉验收。[机器记录](combined-offline-checks.json)。

## 候选身份

工作树 `/Users/nighca/.codex/worktrees/result-reactions-combined-qa/lie`，分支 `codex/result-reactions-combined-qa`。父从已审 main `297666a69286e067d4a28135f9331ef4bd5f7726` 按序构建：

1. `d2b12557104a0b53bb9817f905ae86b7635c171a` mint candidate
2. `e2928168dc925ecd87012e1d34b532599c4268d8` blue candidate
3. `6a1813b7afddb5a24fef67a670b31cbdeb2f1381` beard candidate
4. `0a58975ca3144582a5578a75af3a4957f040ca7f` ochre candidate
5. `93521c5d30430a7fdcfef9dd161e437590883b76` all-eight self-review
6. `a64e3119c8c728e093262b96e87fe3ebcbcff67a` canonical activation
7. `b7721f8223cfbbba8342ceec973f99241d07b2a6` result UI

本任务从上述组合 HEAD 开始，没有自行 replay/cherry/main 操作。另增测试修正 `b1b3df3f200a89b22da45ddac00a972cda9cc0b2`：显式 clone canonical 数据、投影 schema v1 与四个基础态，恢复独立 legacy fixture；保留真正 v2 正向覆盖。最初全套 338 pass / 2 fail 原因是 canonical 激活后，“旧包”mock 已变 v2，会正确渲染 canvas；并非产品静态回退失效。该单文件测试 turn 经父授权，没有改生产，也未重写原 UI 提交。

## 实际执行

Node 24.22.1；离线锁定 npm ci 217 packages、zero vulnerabilities、无 lock 改动。

- 完整 Web 复跑：36 files / 340 tests passed。
- Web vue-tsc passed。
- generator tests：24 passed。
- Web build：100 modules passed；82 unique PNG byte sequences encoded、0 cache hits、0 preserved PNG fallback；严格 postbuild 8 presets / 121 assets passed。
- activation verify.py 实际运行通过：原 81 张 PNG 对 Git base `870cbd524ab21e243e072866ce70288932192834` 字节一致；旧 clips/nodes/states/assets/transitions 保留；40 copied files 对 pinned candidate source `73e55f527729417ae5296526cc602aed2ca926ef` 一致。另逐条 SHA256 核 source-identity.json 全40项通过。
- production 输出 16 static WebP＋16 new part WebP；全部62 animation part 引用可本地解析；具体 manifest hash 见机器记录。
- runtime src/test 对该已审 `870cbd5` git diff 为空，复用其 PNG/WebP 验证证据，本轮没有重复声称 runtime suite 已执行。
- git diff --check passed。

保留既有 underline.svg runtime URL warning（实际 asset emitted），新增本次 Rolldown PLUGIN_TIMINGS 性能提示（CSS post callback 2.4s）、Vitest jsdom 环境性能建议；均非失败。未运行激活后的候选检查来冒充原四态基线检查：本次旧四态保留证据来自 Git-pinned activation verify.py，原素材时序样本证据仍是前置 source73 的1936采样，时点不可混淆。

## 一个 listener 的私有 QA 入口

新增 `design/result-reactions/game-qa.vite.config.ts`，repo root、`apps/web/public` publicDir、正式 `staticAssets()` virtual preset plugin＋Vue。仅 `/`、`/editor`、`/editor/preview`、`/play` 返回真实 `apps/web/index.html` 并 `transformIndexHtml`，入口改为 `/apps/web/src/main.ts`；实际加载 Application/router/controller，不造游戏状态或假 App。统一候选页保留 `/design/result-reactions/`，仅修正过时 HTML title 为“人物结果反应 · 统一检查”。

配置固定 127.0.0.1:5355 strict；沿正式 sensitive file deny，不添加 fs.allow、不添加 proxy、不开第二 listener。离线 `loadConfigFromFile` 成功，并用 stub middleware 检查四真实路由返回实际入口、统一页 passthrough；没有调用 createServer 或 listen。普通 URL 必须显式 `demo=1`，与正式 main 的 DEV gating 一致，只 fake voice，不发麦克风/付费 provider 请求。此 QA 配置没有后端 proxy。

父在协调并安全停止其原 5355 服务后，从此 repo root 可启动：

```sh
PATH=/private/tmp/lie-toolchain-node/node-v24.22.1-darwin-arm64/bin:$PATH node node_modules/vite/bin/vite.js --config design/result-reactions/game-qa.vite.config.ts
```

验收入口：`http://127.0.0.1:5355/design/result-reactions/` 与 `http://127.0.0.1:5355/?game=empty-medal-box&demo=1`；后者走真实指认流程。editor preview 必须从真实编辑页发起，直接刷新 preview 缺少内存数据会沿现有行为回 editor。

## 服务、证据与边界

本任务未启动/停止任何服务或浏览器 tab，没有变更端口、fs.allow、媒体/viewport。旧父 PID1851/PTY55257、图片5356/5357以及8787/8788均未操作。无需 PID/PTY交接；这里的 URL 是配置就绪后的入口说明，不宣称当前listener已使用此候选。

父负责 read 全 diff、明确服务 turn 后桌面391真实浏览器验收、静态/reduce/加载失败/按键滚动/长文/preview改编行为、记录新PID/PTY/consumer/stop condition。原PNG/JPEG历史截图字节与URL保留，未转码或编辑。临时运行日志、依赖/构建/cache均 ignored或/tmp，本记录与机器摘要保存必要可复核结果，不提交 disposable log/cache。
