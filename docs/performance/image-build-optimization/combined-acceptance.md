# q90 组合验收与构建交付

2026-10-25。当前代码head `9e7f9f130cbcafac107151b4d0c0237d5b98c75e`，reviewed base `365269b6185be586b69c0fac2b7ba15defeb7a6f`（已含结果可选契约及page title），不是把旧3fdec的应用测试当组合验收。研究56b2adad是独立待归档依赖，不在此分支重复cherry。

按顺序本任务代码提交：

1. `72148739fdd8fb87452842c913f48d6880ef073d` q90构建/缓存/工具/实验。
2. `0039ccca9fb08a1aca895c29e48f3b906c704b86` 更新新结果hash测试为带assets的真实包结构，准确记录直接用户批准原话。
3. `9e7f9f130cbcafac107151b4d0c0237d5b98c75e` 已完整review的子任务runtime；原来源 `a58bd5840f80fc2334825833875123522fd887b9`，base同365，无其他dependency。

## 已执行检查

实际 Node24.22.1，原锁文件不变，独立WT npm ci。组合执行：

- Web全部34文件 **324 tests PASS**。
- Character-animation全部3文件 **80 tests PASS**。
- 源素材生成器 **24 tests PASS**（含canonical PNG伪装.webp拒绝）；Web与animation typecheck PASS。
- `npm run build` 的真实Web与cf Worker构建 PASS；postbuild固定资源strict检查 **8 presets/89 assets PASS**。
- 构建日志0encoded/50cache hits/0preserved；原native冷编码74.25s，缓存fingerprint1.83s记录见[批准与实施证据](q90-approved.md)。没有更改q90/m6去降低耗时。
- [verify-build.mjs](verify-build.mjs)按真实dist核对所有源/固定81PNG未变、全部81WebP SHA与独立q90实验一致；8包46parts经实际runtime parser与PNG/WebP header读取并按contract尺寸验证；每个静态图/manifest hash与实际bytes相符，所有包目录hash按最终路径/长度/bytes重算一致。**81派生图9,746,332B**。
- [built-identity.json](built-identity.json)记录当前190个Web dist文件SHA，总原始77,277,967B（含固定PNG副本，不是传输量）；真实Worker assets中的对应190文件逐字节相同。
- `git diff --check` PASS。初次365组合Web323通过/1失败来自新增result-hash测试的旧简化fixture仅有schemaVersion；实际rewriter需要assets，0039修正fixture后完整324通过，未对生产错误静默放宽。

已有baseline `underline.svg`在CSS引用的Vite“保留运行时路径”提示及cf workspace lock自动配置提示，均未导致失败；不为图片优化扩大范围。

## 精确构建目录接口（CI拆分owner可用）

- Web完整静态站点：`apps/web/dist/`。正式入口 `index.html`、`assets/index-h1-8LEHW.js`、`assets/index-C3hoq_bD.css`；hash名称以最终构建为准。
- hash manifest：`/static/30a60c44617ba8916468ba2d580434752c46415338ef9ca6a14a4441cf7a30b4/appearances/manifest.json`。
- cf Worker完整prebuilt根：`apps/gateway/.cloudflare/output/`，当前版本布局 `v0/workers/default/`。
- Worker config：`.../default/worker.config.json`；worker代码：`.../default/bundle/index.js`（同目录source map与`.vite/manifest.json`按现有cf产物保留）。
- Worker最终静态目录：`.../default/assets/`，含对应Web dist完整文件和cf生成的fallback entry；以既有cf `deploy --prebuilt`消费完整output根，不手写重新组装。
- `ASSETS`是静态绑定；预览只注入它，不读取/配置LINX凭据。config里已有secret类型声明不代表本机测试含值。

图片缓存CI patch仅721提交的7行，在npm ci之后恢复`tmp/image-build`（actions/cache@v5，平台/helper/source键及restore prefix）。**此文件lease已交还root的新CI拆分owner，本专项不再写ci.yml。** 该owner可按新流程安排恢复/保存，但不能把缓存当build产物的唯一来源；无缓存时自动正常TLS下载锁定工具并编码。

## 浏览器与服务状态（已完成，首次阻塞保留为历史）

当前浏览器/HTTP已完成且服务清理闭环，见[追加验收](browser-acceptance.md)。以下首次阻塞为当时事实，已由原owner释放解决：

根协调授权单次127.0.0.1:5356的built ASSETS-only Worker验收，首次启动前lsof发现它被他人占用，当时尚未启动服务/创建tab，未切换端口、停止或复用未知进程。

占用归属只读核验：PID57333、PPID92300、TTY`??`，command为`node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5356 --strictPort`，cwd `/Users/nighca/.codex/worktrees/result-reactions-lane-one/lie`，当前checkout HEAD `e362243bc600c1443451503ec79d422b4285c149`、status clean。HEAD是观察时checkout身份，不能推断为该进程最初启动SHA。PPID是Codex app-server；未读取环境/凭据。未找到当前PID的任务台账/原PTY/消费者证据，**原tool session/PTY和实际消费者UNKNOWN**，已交root协调animation owner。旧历史5356 PID记录不冒充此新进程。

首次交付仅离线保存[5356预览脚本](preview-build.mjs)，当时未运行；后续按上述追加验收运行并停止。它按实际cf config/bundle/assets构造Miniflare并打印owner/SHA/PID/消费者/停止条件。待owner明确释放后仍需重查listener，再开始桌面+391px、WebP MIME/hash/缺失404/immutable、开案/切人/canvas/正误结果与静态fallback检查；本机Worker头不能写成线上已部署验证，浏览器也不推导LCP改善。浏览器证据将新增提交，不amend这批冻结代码。

无main集成/push/deploy，本批服务已按追加验收停止，无mic/provider/新账号/费用。原始源PNG、固定生成PNG以及已批准动画/结果玩法保持不变。当前只有结果契约，无新结果原画在该base，因此可选结果资源的构建闭合由fixture验证；当前实际正误结果沿用default派生图。
