# 计时帮助修订：时间旁小图标与弹窗

2026-11-01。用户体验真实界面后反馈整行说明存在感太强，明确要求在剩余时间旁放小图标，点击时间或图标均打开“怎么算时间”弹窗。本轮按该要求直接调整真实 Vue 界面，保留先前[实现记录](implementation.md)、旧设计 Demo 与附件。用户反馈截图由主代理另行保全，不在本文件覆盖旧证据。

## 实现范围

- 移除操作条整行说明、原生 details、VoiceControl help 插槽及其跨行样式；撤掉为说明展开增加的 desktop 自适应末行、mobile 额外行/底部 padding/`:has` 规则，恢复原紧凑操作条。
- “剩余询问”标签保留；数字和淡色圆形 i 图标放在同一个原生 button 内，数字保持原字重和字号。点击任一部分均打开弹窗，`aria-label="怎么算时间"`、`aria-haspopup="dialog"`，图标对辅助技术隐藏；没有给持续变化的倒计时加 aria-live。App 专属桌面时间列为100px，容纳数字与图标；移动端沿用原两列控制布局。
- 复用既有 UiDialog，完整说明共享额度、准备不计时、就绪后说话/停顿/等待/回答计时、结束暂停、切人共享、耗尽仍可回看与指认，并明确查看说明不会暂停计时。打开/关闭不调用 controller、不重连或停止对话。
- 一个 `timeHelpOpen` 布尔值与触发按钮 DOM ref；主动关闭后 nextTick 返回焦点。调查阶段结束或自动指认开启时关闭帮助，防止终局残留或两个弹窗同时打开。既有指认后果文案和黄底保持原样。
- 原有 App 测试的首个语音区 button 选择器随新增时间按钮改为明确 `.lie-voice__actions button`；首个 dialog 断言改为指认 dialog。新增覆盖自动指认前关闭时间帮助、离开调查后关闭的检查，原计时帮助测试改为验证弹窗开关不影响连接及共享额度。

## 基线与实际验证

WT `/Users/nighca/.codex/worktrees/a92e/lie`，branch `codex/first-use-help-assessment`，本轮基线 `360ac9140bbff18272ea93c4082e02f4ac0cbded`。开始时 clean；local main 已前进到其他 Chat 的文档提交，本专项不切换、合并或修改 main。README 由主代理更新，不由执行子代理改写。未 stage/commit。

使用本 WT 既有独立依赖与 Node24.22.1，不重新安装或联网下载。实际检查：

```sh
npm run test --workspace @lie/web -- App.test.ts controller.test.ts voice-switch-controller.test.ts --maxWorkers=2
npm run test --workspace @lie/web -- character-name-consumers.test.ts navigation.test.ts --maxWorkers=2
npm run typecheck --workspace @lie/web
npm run build --workspace @lie/web
git diff --check
```

- 首组3文件59项通过。
- 检索新增 dialog/时间按钮对既有选择器的影响后，仅补跑受影响的导航/姓名消费者；Vitest 名称匹配实际包含 navigation、editor-navigation、page-title-navigation、preset-loading-navigation 与 character-name-consumers，共5文件55项通过。未跑无关全套。
- Web 类型检查通过。加入 aria-haspopup 后完成最终生产构建与 postbuild：8套预设、121份资源核对通过，82图像缓存命中、0编码，无新工具下载。
- 最终入口 `apps/web/dist/assets/index-VjGUHk6v.js`，SHA-256 `e6d64c54a8fa729a564317883cb6c9780379fb16751c05396abe5ffe579082a5`。构建来源是上述 HEAD 加本轮 dirty 修改，不是 clean 发布包；Vite DEV 本地体验也不等同线上 production bundle。
- 保留既有 configLoader 无扩展名 import 提示与 underline 构建期静态路径提示，没有扩范围修改构建系统。无 gateway build、provider 配置、部署或远端资源操作。

## 真实浏览器检查

本轮尝试创建新的 IAB 隐藏 tab 时明确返回 `Browser is not available: iab`。先读浏览器故障文档，再核当前可用入口只有 Chrome；主代理确认可用 fallback。创建全新专属 Chrome tab `1910332577`，session“🕒 帮助验收”，只访问 `http://127.0.0.1:5544/?demo=1&game=jiangsu-local`。未操作旧 IAB handoff tab 或用户当前正常模式 tab，不刷新用户页面，不读取/清理/写入其草稿、storage 或 Cookie。

实际体验了时间数字点击、图标点击、Enter 打开、关闭按钮、继续调查按钮和原生 Escape：均打开/关闭同一时间弹窗，关闭后 `document.activeElement` 的 aria-label 为“怎么算时间”。活动对话期间打开帮助，倒计时从02:00持续减至01:22；关闭帮助后手动结束对话，再打开/关闭帮助和切换视口，仍为01:22，操作仍为“开启模拟对话”，没有重连。自动指认与离开阶段的互斥由真实 App/controller 集成测试覆盖，不把常规浏览器检查说成跑完两分钟耗尽。

截图来自真实应用，并已逐图查看主要桌面/窄屏结果：

- [桌面紧凑条](revision-screenshots/desktop-compact.jpg)、[桌面时间弹窗](revision-screenshots/desktop-time-dialog.jpg)：1280×800。
- [391px 紧凑条](revision-screenshots/narrow-391-compact.jpg)、[391px 时间弹窗](revision-screenshots/narrow-391-time-dialog.jpg)：391×844，document.scrollWidth=391，弹窗左19/右372、宽353、高约432px。
- [320px 紧凑条](revision-screenshots/narrow-320-compact.jpg)、[320px 时间弹窗](revision-screenshots/narrow-320-time-dialog.jpg)：320×844，document.scrollWidth=320，弹窗左19/右301、宽282、高约511px，标题/全部说明/操作均在视口内。

控制条不再有整行规则，手机转写区域恢复空间；弹窗布局无横向溢出。原生 Escape 与回焦已实证，未做屏幕阅读器、Tab 圈定、移动真机或真人新手研究。tab console warn/error 为空。模拟对话已停止，临时 viewport 已 reset，自建 Chrome tab 已关闭，未保留额外浏览器消费者。仅使用既有 DEV demo port，无真实模型、mic、provider 或 WS 调用；不将 fake 当真实语音验收。

## 既有服务与消费者

本轮沿用已分配的唯一 `127.0.0.1:5544` Web，PID `64673`、原 PTY `63756`，cwd本 WT的 `apps/web`，proxy既有8788。未重启或另起服务；最终 lsof 复核仍为该PID监听。源码为上述HEAD+本轮dirty修改，主代理提交后补最终身份即可，Vite按既有方式提供实际修改。

owner仍为本Chat `01a19748-009d-7842-9c37-e8ab059d91f3`，执行子代理 `/root/implement_help`；自动检查消费者已结束，用户本轮本地体验消费者继续保留。用户正常入口 `http://127.0.0.1:5544/`，可选免麦克风入口 `http://127.0.0.1:5544/?demo=1`。用户表示结束体验后，由owner在原PTY Ctrl-C并核PID/listener消失；不提前停服、不连带清理文件或WT。8787/8788、5176/5177/5198均未操作。

## 执行交付源码身份

| 文件 | SHA-256 |
| --- | --- |
| `apps/web/src/App.vue` | `fd1a60228a38c0701e807a2c75a81f3c1060ddf46af328ca14a3373dac617e4d` |
| `apps/web/src/style.css` | `4123cf3aa39ec8fe6bb270476e0d6b15dc69bbc23a45b86c441124f9f979b594` |
| `apps/web/test/App.test.ts` | `1c3080fc49b50357ef12a8f5a23b06ad26ebc41626c9c6dfc3f95de94393fc08` |
| `packages/ui/src/components/VoiceControl.vue` | `91ed7d7a9d349ac58bba97952c4444d2e7cf49f83c2a09ee953858d710c6be46` |

未合入 main、未 push 或部署。旧设计和旧实现记录保留为已被本次用户修订取代的历史，不将旧截图当本轮界面。
