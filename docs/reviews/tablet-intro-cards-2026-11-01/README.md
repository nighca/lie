# 平板宽度接案人物卡修复

2026-11-01。用户经总协调明确授权本 Chat 修复约1024×768介绍/接案页卡片过宽、头像放大裁切的问题；Safari语音自打断另属独立专项，不在本批。专项 WT `/Users/nighca/.codex/worktrees/a92e/lie`，branch `codex/first-use-help-assessment`，本轮基线为主代理已审计时弹窗提交 `2a661cd168631de75d3b73ef4932c36c18a50088`。执行开始时clean；不跟进其他Chat的新main、不修改refs或其他WT。

## 用户证据与复现

原始证据只读来源为 `lie-disconnect-evidence-integration/lie/docs/backlog/2026-11-01-safari-audio-tablet-cards/`。将与本项相关的两图逐字节保全，不复制或处理Safari语音图：

| 原始截图 | SHA-256 |
| --- | --- |
| [介绍页异常](evidence/tablet-intro-cards.png) | `f9daf458180c7483aee4e1dcf31bf95cb69069a3be28542b67553379ff5a2616` |
| [同尺寸指认对照](evidence/tablet-accusation-comparison.png) | `cfd4aca4cb1063630ce12994f2eff8cbf36c38eff1eb3c393fae59d570ee218a` |

本轮使用真实应用、既有5544 Web与新建专属Chrome tab `1910332581`。IAB不可用事实已在前一项[计时弹窗验收](../../design/first-use-help-2026-11-01/revision-time-dialog.md)核实，沿主代理允许的Chrome fallback，不重复探测。只访问带`demo=1`的DEV案件页，未读取用户正常模式tab、草稿、Cookie或storage，未自动开启真实语音。

触控复现使用已读文档的 tab CDP capability：`Emulation.setTouchEmulationEnabled` 的 enabled=true、maxTouchPoints=1；鼠标对照为enabled=false。每轮以实际 `matchMedia('(hover:none)').matches` 核分支，**不是仅resize后假定已模拟触屏**。1024×768下，基线鼠标为false/flex/180px，触控为true/grid/322px；同触控条件下指认卡仍为180px。原始复现截图：[修前接案](screenshots/before-touch-1024-intro.png)、[修前指认](screenshots/before-touch-1024-accusation.png)。不把Chromium触控仿真等同于真实iPad或Safari实机。

## 根因与最小修复

`@media (hover:none) and (min-width:701px)` 把 `.intro-characters` 改为 `auto-fit/minmax(120px,1fr)` 网格。介绍卡只有 `flex:0 1 180px`，在grid中不能约束宽度；两位人物各填满约322px的列，内部头像仍固定148px高、图片按容器宽度200%呈现，于是脸被放大裁切。指认卡另有 `width:min(100%,180px)` 与 `justify-self:center`，因此正常。

正式代码仅在 `apps/web/src/style.css` 增加一条介绍页范围规则：

```css
.intro-card .intro-character { width: min(100%, 180px); justify-self: center; }
```

保留现有网格、可变人物数、手机/鼠标规则与形象图片适配；不修改指认规则、卡片组件、案件或计时/语音代码，不引入案件/人数硬编码。

## 实际浏览器验证

- [修后1024×768双人接案](screenshots/after-touch-1024-intro.png)：两卡180px，完整脸部恢复；[同尺寸修后指认](screenshots/after-touch-1024-accusation.png)仍180px，与基线一致。
- 1000/1001/1023/1024/1025/1100六个相邻宽度、高768，分别切实际mouse与touch媒体分支，12轮均为两卡180px且document.scrollWidth等于viewport。完整[量测结果](measurements.json)保留grid/flex和hoverNone实测值。
- 1024×768触控，[三人案](screenshots/after-touch-1024-three-characters.png)各180px，[四人案](screenshots/after-touch-1024-four-characters.png)各153px，均无横向溢出，角色均显示且不被固定为双人；[人数量测](case-measurements.json)。当前官方人数2/3/4已覆盖，不伪称存在官方七人案。
- 小屏触控320×844为115px、391×844为150.5px，仍自然填入原有两列；[391截图](screenshots/after-touch-391-intro.png)。桌面鼠标1440×900仍180px，[桌面截图](screenshots/after-mouse-desktop-intro.png)。[边界与指认量测](edge-measurements.json)同时记录无横向溢出。

主要修前/修后、三人/四人和手机截图均已实际打开检查。CSS经既有Vite正常HMR更新，未重启服务；没有刷新或操作用户正在玩的页面、触碰其mic/WS。tab console warn/error为空。自建tab完成后关闭，触控仿真设回false、viewport reset，无额外浏览器消费者保留。

## 检查与身份

实际`git diff`确认产品仅一行CSS变化；App.vue、App.test.ts、VoiceControl.vue、package.json及package-lock.json与基线完全一致。以下源码hash与前一计时修订交付一致，复用其59项目标tests、55项导航/姓名tests和Web类型检查，不为CSS新增镜像单元测试，也不冒称本轮重跑这些检查。布局由本轮实际浏览器和生产构建验证。

| 文件 | SHA-256 |
| --- | --- |
| 本轮 `apps/web/src/style.css` | `8f4ea423b7f7adefd1e145d1edd1572d8d671f02ca2911cf7ff2465604f919a4` |
| 未变 `apps/web/src/App.vue` | `fd1a60228a38c0701e807a2c75a81f3c1060ddf46af328ca14a3373dac617e4d` |
| 未变 `apps/web/test/App.test.ts` | `1c3080fc49b50357ef12a8f5a23b06ad26ebc41626c9c6dfc3f95de94393fc08` |
| 未变 `packages/ui/src/components/VoiceControl.vue` | `91ed7d7a9d349ac58bba97952c4444d2e7cf49f83c2a09ee953858d710c6be46` |

本WT现有独立Node24.22.1与依赖，实际执行`npm run build --workspace @lie/web`通过；8套预设/121资源postbuild检查通过，82图像缓存命中、0新编码，无新下载。已有configLoader无扩展名import与underline静态路径提示保留。入口`apps/web/dist/assets/index-CnGG0LxQ.js`，SHA-256 `d877695958b5e3916ead91a84baa08be81e621fb10719ac5e0e66f5f52ce727e`；源为基线HEAD+本轮dirty CSS及主代理文档更新，不是clean发布包。`git diff --check`通过。

## 服务与交付

沿用本Chat获分配的唯一5544 Web：PID64673、原PTY63756，cwd本WT `apps/web`，proxy既有8788，最终lsof仍为该PID监听。无新服务/端口，无重启、无secret或provider操作；8787/8788、5176/5177/5198未动。自动fake消费者已结束，用户本地体验消费者继续保留，入口仍`http://127.0.0.1:5544/`（免麦克风`/?demo=1`）。用户表示结束后owner优先原PTY Ctrl-C，再核PID/listener消失，不连带清理文件/WT。

执行子代理未stage/commit/main/push，交主代理实际review与具名提交。旧计时修订源码未变，first-use README状态由主代理拥有。截图与触控仿真仅证明本轮浏览器布局，不扩大为真实设备/Safari/语音验收。

主代理已独立检查一行产品 diff、相关介绍/指认 CSS、三份量测记录和本文件，实际查看用户两张原图、本轮修前/修后1024触控介绍页及四人案截图；独立重核本表四文件 SHA-256、未变代码/依赖的 diff 为零、5544 精确 listener 仍为上述 PID。检查范围符合本次最小响应式修复授权，具名提交后交总协调作独立实际 review；不将本地完成等同合入或发布。
