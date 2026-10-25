# 缓存路径与动画首帧组合验证

2026-10-25。执行 owner `/root/character_preset_migration`；root借用候选 `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`，分支 `codex/integrate-cache-and-animation-loading`，固定 HEAD `be83810d1dafcf1cc1270520e669885661b24088`。开始时tracked/untracked均clean，完成时HEAD未变；没有改应用源码、配置、Git引用、main，没有commit/push/部署。本文及两张同名前缀原生截图留给root审核提交。

## 身份及依赖

Node `24.22.1`。复用候选原有实际 `node_modules` 目录；不是目录symlink。安装锁的223个条目逐项与根锁比较version/integrity/resolved/link一致，六个 `@lie` workspace链接全部解析到候选自己的 apps/packages，不指向源工作树。相对root所报main `22b0b93`，root/Web/Gateway/UI package文件及根lock无diff。

SHA256：

| 文件 | SHA256 |
| --- | --- |
| package-lock.json | `2efd70fe940997ce63746a05a6d5574974560a67d6a737f4801e9f9e254e82e0` |
| apps/web/dist/index.html | `327035140101e782bf603e2960f544eecf9f1af0dabe8d67a4a75477f3694255` |
| built Worker bundle/index.js | `821cc7be4321ee4313ffb4fd6009399ad69d7ee4cbbfd4dd1a100b51e838b5b1` |

## 顺序检查

首失败即停止执行策略；本轮无失败，无无因重跑。

| 命令/范围 | 结果 |
| --- | --- |
| Web全套 | 25套228项通过 |
| UI全套 | 5套43项通过 |
| Web typecheck | 通过 |
| UI typecheck | 通过 |
| Web build/postbuild strict | 通过，8预设89资源 |
| Gateway全套 | 4套16项通过，含原13项和static-cache3项 |
| Gateway typecheck（应用及scripts） | 通过 |
| Gateway `cf build` | 通过，本地构建，无上传/凭据 |
| `node docs/performance/2026-10-25/verify-build.mjs` | 实际Miniflare完成40次请求断言，正常dispose，92派生输出、8预设、46相对parts |

构建验证器按实际built config/bundle/assets运行：派生文件逐字节对照、原manifest/package字节、资源引用、冷200/conditional304/HEAD、Range本地返回200完整体、缺hash及缺JS的cors/navigate404/no-store、HTML304回退保护，以及可变/HTML/API路径不应用immutable。未声称此本地运行产生206；206透传由Gateway相关fake-binding测试覆盖。`cf build`保留既有workspace lockfile探测提示，根lock身份已另核；不作远程平台或部署成功证明。

## 本组合的原生浏览器验证

本次IAB一次明确不可用，使用独立Chrome tab `1910329555`。运行候选实际 `cf build` 的Worker bundle和复制资产，使用已有 `preview-build.mjs`，不是Vite、不是原专项旧浏览器结果。生产包的demo标志编译关闭，即使入口带 `?demo=1` 也不是模拟语音；整个验收只开局/切人，从未点击“开启对话”，没有mic、provider请求或任何凭据绑定。没有进入Editor、读写草稿、操作他人tab或全局viewport。

针对当前tab开启Network、关闭cache并暂停动画package Fetch。官方首案介绍→接案：

- 沈禾舞台只有隐藏canvas，无slot/img。完整开局事件窗口包含侧栏avatar及logo请求和 `/static/96859df31e4b9bb8652145329a1de3d396930e678b93b81ab22ffba9c3160fe6/appearances/sunny-moustache/animation/package.json`，无舞台default.png请求。窗口无分页/截断。
- 放行后原生canvas1254×1254可见。切到顾遥，旧canvas立即隐藏、舞台无img；请求改为 `/static/bab6ff79d57294e9be8e798bbf8f809990eb3faac229618c7964be5947b7fe98/appearances/coral-bob/animation/package.json`。放行后顾遥canvas1254×1254可见。前后舞台均604.6953125×513.40625。
- 两个package及观察到的全部相对parts均200、`public, max-age=31536000, immutable`。本段控制台warn/error为空。

原生截图：[组合加载中](combined-first-render-pending.jpg)、[组合切人成功](combined-first-render-ready.jpg)。未重画截图。先前源专项391px/reduce/失败回退的结论保留其原证据边界；本组合只补首案这两个动画，不声称重验八人物、Editor、跨浏览器、warm缓存或live语音。

缺hash顶层浏览器导航由Browser Use扩展返回 `ERR_BLOCKED_BY_CLIENT`，没有获得目标HTTP响应，不算浏览器404通过，也没有尝试绕过。随后对同一正在监听的built Worker以proxyless本地HTTP请求（`Sec-Fetch-Mode: navigate`）获得：

| 路径 | 状态 | Cache-Control | Content-Type |
| --- | --- | --- | --- |
| `/static/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/missing.png` | 404 | no-store | text/plain;charset=UTF-8 |

此外实际Miniflare构建验证器已经独立覆盖缺hash的cors/navigate路径；不将其冒称浏览器网络证明。

## 服务生命周期与收尾

启动前即时 `lsof` 确认5544无监听。唯一服务：候选上述SHA，owner `/root/character_preset_migration`（已有launcher输出沿用原作者 `root/production_performance` 标签，不代表本次执行owner）；Node PID35404、workerd监听PID35876、原PTY/session13186、loopback5544，消费者仅本次组合浏览器验收，停止条件为本轮验收完成。无secret env绑定，仅ASSETS。

完成后原PTY Ctrl-C返回130；随后 `lsof -nP -iTCP:5544 -sTCP:LISTEN` 无输出，`ps -p 35404,35876` 无输出。自建tab已关闭，Fetch patterns清空、cache override恢复false、Network关闭。未使用viewport或fixture。无保留服务，无未知项；8787/8788/5355/5507及其他owner服务未操作。Miniflare构建验证器自己的运行亦正常dispose。

所有应用tracked文件仍与候选HEAD一致；只产生忽略的deps/generated/build及本文与两张待root提交图片。候选已交回root，可继续串行追加视觉提交；本报告未包含其尚未进入候选的变化。
