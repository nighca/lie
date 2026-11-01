# 首次玩家帮助 · 真实界面实现与本地体验

2026-11-01。用户接受本目录 Demo 的交互后，明确要求：“交互上没问题，不过我希望你在真实代码基础上真正实现完再给我体验下”。本轮由此进入真实 Vue 代码实现与本地体验；没有将该指令扩展为合入 main、发布、真实语音自动测试或其他帮助功能。

## 实现

- `apps/web/src/App.vue`：在真实语音控制区加入原生 `details/summary`。永久短句“所有人物共享，结束对话后暂停”与“怎么算时间？”保持可见，默认收起，展开显示准备/就绪计时边界、切人共享、耗尽回看指认和查看说明不会暂停。没有新增 Vue 展开状态或调用 controller 来切换帮助。
- 指认弹窗沿用现有“点人物即提交”和返回调查，在人物前明确说明：“点击人物会立即提交，结束本局；选错不会揭晓答案。”轻黄底来自既有 `--lie-canvas` 与 `--lie-surface` 混合，不引入新颜色 token。
- `packages/ui/src/components/VoiceControl.vue`：仅新增可选 help 插槽与跨列布局，不改音频、操作事件或状态反馈。
- `apps/web/src/style.css`：桌面控制区所在 grid 末行自适应；移动端固定控制区增加帮助行，展开正文限制为 `min(160px, 25dvh)` 可滚动区域，并为调查内容预留空间。两个主要操作继续可见，没有增加首次状态、教程页、确认按钮或新玩法。
- `apps/web/test/App.test.ts`：增加真实 App/controller 集成检查，确认展开/收起说明时连接保持、计时继续，手动结束对话后暂停。既有指认及切人测试仍覆盖原规则。

## 环境与离线检查

WT `/Users/nighca/.codex/worktrees/a92e/lie`，分支 `codex/first-use-help-assessment`。实现基线 HEAD `1b028cfaf4c69ea9ac9e39db893d1d272d0216f4`，来自 reviewed main `35e987a7516493dcdccb8392cb8817f3b82744e4` 加研究/设计文档。本次检查时四个产品/测试文件为 dirty；README 的授权状态更新由主代理拥有。未修改 main、其他 WT 源码或 Git refs，执行子代理未 stage/commit。

使用既有独立运行时 `~/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin`：Node `24.22.1`。本 WT `npm ci --offline --ignore-scripts` 成功，新增 217 packages，无锁文件变化，不链接其他 WT 的 node_modules。

实际执行：

```sh
npm run test --workspace @lie/web -- App.test.ts controller.test.ts voice-switch-controller.test.ts --maxWorkers=2
npm run typecheck --workspace @lie/web
npm run typecheck --workspace @lie/ui
npm run build --workspace @lie/web
git diff --check
```

三文件共 58 tests 通过，Web 与 UI 类型检查通过，Web 生产构建/postbuild 通过；生成/检查 8 套预设、121 份资源，图像优化 0 encoded / 82 cache hits / 0 preserved。未跑 gateway build 或部署。

首次构建缺少固定 libwebp 工具，受限网络无法解析 `storage.googleapis.com` 而失败。未修改构建配置或跳过校验；只复制既有 `lie-jiangsu-starter/lie/tmp/image-build/` 中固定工具目录及 `images` 衍生缓存至本 WT 的 ignored cache，再成功重建。脚本在使用前核工具 SHA-256，图像缓存逐项核 source/output/尺寸/alpha；独立 `shasum` 核工具与仓库固定常量一致：

- cwebp：`07ba910950253f18ca227d085848ff39be530f6ef22005e778cd48d4850734f2`
- dwebp：`7b341872a316596df8e517b6d5b1bcb9e2ca6b6489521d328f2db38d22881ca6`

未复制 secret、用户草稿、旧源码或依赖。构建仍有既有 Vite native configLoader 的无扩展名 import 提示及 underline 静态资源构建时不解析提示，未扩大本项范围修复。

实际生成入口 `dist/assets/index-BuCqfrAS.js`，SHA-256 `fec75579d0cd9223e13ff9bc4b543de756035e494795bc119ad8f1b2c0f6e100`。该构建源是上述 HEAD 加 dirty 修改，**不是 clean 发布包**。本地体验使用 Vite DEV，不宣称它与 production bundle 相同。

## 真实浏览器验收

总协调明确分配 5544 turn 后，先核无 listener，再启动本 WT 单独 Web。自动检查只访问 `/?demo=1&game=jiangsu-local`：`main.ts` 在 DEV+demo=1 明确使用既有 `createDemoVoicePort`，其 prepare 为空、对话为已标注占位转写，不调用真实 provider、麦克风或 WebSocket。不进入 editor，不读取/覆盖该 origin 的历史草稿、storage 或 Cookie。

通过 Codex in-app browser 自建隐藏 tab `1` 实际进入真实接案页、点击接案，检查真实 App、controller、预设与对话控件。本子代理不能显示 IAB 可见窗口，因此用后台页面验收并提供本地链接，由用户自行打开；没有转用用户的 Chrome profile。

已保存并实际查看：

- [桌面收起](implementation-screenshots/desktop-collapsed.jpg)、[桌面展开](implementation-screenshots/desktop-expanded.jpg)：实际默认 1280×720，展开时文案与对话/指认操作完整可见，scrollWidth=1280。
- [391px 收起](implementation-screenshots/narrow-391-collapsed.jpg)、[391px 展开](implementation-screenshots/narrow-391-expanded.jpg)、[391px 指认](implementation-screenshots/narrow-391-accusation.jpg)：391×844，无横向溢出；展开控制区高333px、顶511px，记录区底499px，无重叠。
- [320px 收起](implementation-screenshots/narrow-320-collapsed.jpg)、[320px 展开](implementation-screenshots/narrow-320-expanded.jpg)、[320px 指认](implementation-screenshots/narrow-320-accusation.jpg)：320×844，实际 scrollWidth=320；summary 左18/右302、说明与两操作可见，无横向溢出。

在真实浏览器开启模拟对话、展开说明，保持连接且剩余从02:00持续减至01:47；结束后仍为01:47，随后切换视口/指认与返回不自动续聊。指认弹窗中后果文案在人物前可见，原生 Escape 关闭成功、焦点回到指认入口；返回调查按钮同样可用。未重新设计或替换现有 dialog 焦点策略。此轮未做原生 Tab 焦点圈定或屏幕阅读器验证。

检查时 tab console warn/error 为空。临时 viewport 已 reset，模拟对话已停止，自建 tab 仅标记 handoff 供主代理交付，未关闭用户任何 tab。截图与 fake 回归不等于真实语音、真人新手或跨设备验收；正式入口由用户主动体验，不自动打开真实案件 intro 或开启真实语音。

## 服务与用户体验入口

| 字段 | 当前来源与停止条件 |
| --- | --- |
| owner | 本 Chat `01a19748-009d-7842-9c37-e8ab059d91f3`，执行子代理 `/root/implement_help`；主代理负责接管消费者与收尾 |
| WT / branch / source | 本 WT / `codex/first-use-help-assessment` / 实际实现已具名提交 `5d85b9e1e3e18de64e13c271e1ef338131a11475`；启动时 HEAD+dirty 与该提交四文件哈希完全一致 |
| 启动授权 | 总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` 明确分配 5544；5176 已属 WebMCP，不动其他端口 |
| 监听 / PID / 原 PTY | `127.0.0.1:5544` / `64673` / exec session `63756`，实际 lsof 核 listener 与 cwd `apps/web` |
| 命令 | `LIE_VOICE_GATEWAY_URL=http://127.0.0.1:8788 node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5544 --strictPort`，PATH 为上述 Node24.22.1 runtime |
| consumer | 本项真实 Vue 的 fake 自动检查已结束；用户要求的本地版本体验尚待进行，因此保留服务 |
| 用户入口 | 正常应用 `http://127.0.0.1:5544/`；免麦克风演示 `http://127.0.0.1:5544/?demo=1`，两者均为本次真实 Vue 实现，不是独立 HTML Demo |
| stop | 用户表示体验结束/释放后，优先原 PTY Ctrl-C，再核 PID 和 5544 listener 消失；未收到释放前不提前停，不连带清理任何文件/WT |

首次起服务在 sandbox 内 listen EPERM，限定相同已分配 loopback 命令经自动审批后成功；没有换端口或绕过未知占用。未启动/复制/停改 8787/8788 gateway 或 launchd，不读 secret；5177/5198 保持原样。当前只保留该 Web 服务，供用户体验。

## 源文件身份（执行交付截点）

| 文件 | SHA-256 |
| --- | --- |
| `apps/web/src/App.vue` | `eefe9119ab0c09f463150fee96dfa2a59c5226ae9d2fa0d4fc683c7992b2672a` |
| `apps/web/src/style.css` | `752e740b9bd90baf4e0706e274b8753e2247306ab5b8ea0ef2b2231ba7fe62bb` |
| `apps/web/test/App.test.ts` | `782cf50ebe061059bf8dca728e8b8e28df2458da74308f13e5211bd91f9e685b` |
| `packages/ui/src/components/VoiceControl.vue` | `9459953c1c76ff3e59c18812a95f65b92756bfb72451db370ca244f9bac064cd` |

旧研究与独立设计 Demo 原件全部保留。主代理已逐行 review 全部四文件 diff 与周边控件/CSS，实际查看桌面展开、391px 展开、320px 展开和指认截图，并独立核对本表四文件 SHA-256 及 5544 精确 listener。代码已具名提交 `5d85b9e1e3e18de64e13c271e1ef338131a11475`，无后续产品改动；仍待用户本地体验，未合入 main、未 push 或部署。
