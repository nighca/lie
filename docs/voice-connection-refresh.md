# 角色语音连接等待提示

2026-10-30。**用户已确认最终纯文字方案，并明确要求“提交 review & 合入吧”；本批已接入正式 App，待发起者 review 与唯一 integrator 合入。** 批准仅针对等待提示，不包含隐藏版本、语音预热、供应商或会话策略变更。

## 最终行为

| 时间 | 主句 |
| --- | --- |
| 0ms | 正在请{name}过来… |
| 1000ms | 搬个椅子… |
| 2000ms | TA 正在入座… |
| 3000ms之后 | 等 TA 坐稳… |

卡片只保留主句、底部“等 TA 坐定，再开口哦”和取消；没有插画、气泡、圆点、副句或技术百分比。首句通过既有 `CharacterNameText` 使用当前人物预设的姓名背景色下划线。底栏保持原生“正在连接”。样式沿用用户批准的奶油底/深蓝描边、55dvh位置及局部非模态提示。

时间只编排候场旁白，不表示技术任务完成。原 `interrogating && conversationActive && busy` 可见条件保留；实际就绪、取消或失败立即退出，不为播完而延迟。准备不扣询问预算、快速切人旧scope保护继续由既有controller决定。App订阅准备状态上升/目标变化产生渲染key，保证同人重新连接即使在同一Vue batch内也从首句重来。controller、VoicePort、网关、引擎、共享姓名组件合同及首页/header未改。

正式组件：[VoiceConnectionNotice.vue](../apps/web/src/presentation/VoiceConnectionNotice.vue)。旧spinner模板/CSS已移除；正式App没有旧demo slot。离线设计入口只创建fake VoicePort并消费同一个正式App/组件，没有重复的候场组件或attempt状态。

## 历史与批准

用户从“更丰富有趣的提示”开始，逐步删去人物/椅子插画、气泡、步骤圆点和说明副句，确认最终文案并要求首句姓名沿用角色色。完整旧Demo源码、App slot桥接、配置、测试和原方案文档在[归档入口](archive/2026-10-30/voice-connection-refresh-demo/README.md)；[设计目录](../design/voice-connection-refresh/)保留三案图片、生成源、历轮截图和必要QA JSON。旧备选不等于批准，旧文案/未批准表述、绝对路径及PID只代表历史。

初版700ms间隔及离线2.5/1.7秒预设参考[2026-10-25小样本调查](voice-connection-latency/README.md)：首开2536.2ms、停止后重开1799.6ms、active切人1687.5ms，每场景仅一次本地样本；不是当前线上分布、平均、p95、SLA或本次优化成果。

2026-10-30 用户线上体验后确认将每步停留从700ms改为1000ms，末句从第3秒开始保持；实际就绪即退出的行为不变。此次仅调整正式组件、既有时间边界测试及本说明；下方验收记录与截图对应初版，保留为历史证据。此次独立工作树 `connection-step-duration/lie` 基于 `fd0493773e3b47ee934b2a391e8f69b49f632c58`，正常锁文件 `npm ci` 后，连接提示原有 7/7 测试通过（含1000ms边界、末句保持、重连归零及ready/cancel/fail）。没有启动预览服务或重跑真人语音。

## 实施身份与独立环境

- 新工作树：`/Users/nighca/.codex/worktrees/connection-waiting-product/lie`，分支 `codex/connection-waiting-product`，精确reviewed base `f86206611dbc0a10260fb1605d9a616b22493dc3`。
- 有序提交先保存设计/最终旧Demo历史，再接入正式组件、测试和新验收证据；旧 `codex/lie-connection-design` 工作树/ref保留。中央project-plan/development不复制覆盖，不操作main/push/部署。
- Node24.22.1 / npm11.19.1，在新工作树正常npm ci成功（217包/6秒）。只读复制旧npm公共tarball cache加速；node_modules是本树实际目录，`@lie/*`链接均指本树源码。cache、generated appearances和构建产物均在本树ignored路径，不共享main可替换依赖。
- npm对workerd/fsevents部分安装脚本保留allowScripts提示，未扩大许可或运行Worker；Web工具、正常types/build通过。锁文件及业务清单未改。

## 验证

正常命令使用上述独立Node/npm环境：

```sh
npm run typecheck --workspace @lie/web
npm run typecheck --workspace @lie/ui
npm run test --workspace @lie/web -- test/voice-connection-notice.test.ts test/voice-switch-controller.test.ts test/voice-capture-readiness.test.ts test/CharacterNameText.test.ts test/App.test.ts
npm run build --workspace @lie/web
```

- Web/UI types通过；5 files / **47 tests通过**，覆盖四句时间边界、末句保持、真实ready前提示保留/ready即退、取消后迟到、失败、切人/背景停止、同人同batch重连归零、姓名色及既有App流程。
- 正常Web build/postbuild strict通过：82 unique图冷编码，8 presets/121 assets。保留既有native-config扩展名与underline.svg构建时不解析警告，产物资源存在。正式dist只有原index入口，离线Demo不是生产路由。
- 独立Chrome iframe实测391×844及1280×878，横向scrollWidth等于视口；卡片分别359×137及380×143。验证姓名色、快切最终陈拓、提前ready立即退、同人重连归零、取消/失败退出、候场前后预算相同、底栏“正在连接”。本页捕获的error logs为空。
- [正式来源手机截图](../design/voice-connection-refresh/production/mobile-391.jpg)、[桌面截图](../design/voice-connection-refresh/production/desktop-1280.jpg)、[浏览器检查](../design/voice-connection-refresh/production/checks.json)、[源码身份](../design/voice-connection-refresh/production/source.json)。剩余时间包含先前模拟接通后的消耗，不是候场扣时。

语音行为全部为离线替身：没有真实麦克风、供应商、语音WebSocket、权限/账户/存储操作；仅有Vite自己的本地HMR。未操作用户现有IAB/游戏、其他标签或全局viewport。IAB新建接口仍不可用，按已授权fallback使用专属Chrome1910332091，验收后关闭。未验证真人语音、320px/200%缩放、系统减少动态或屏幕阅读器；减少动态CSS保留，替身测试不消除这些限制。

## 服务已释放

唯一协调者先批准新base与5176 source turn，才串行切换。owner为本专项 `connection_design` / 发起Chat `01a18adf-d929-7060-969c-8c2d40415d04`：

| 来源 | 进程与原session | 消费者/结果 |
| --- | --- | --- |
| 旧设计WT，60c11f7加dirty demo | PID13931/session83334，127.0.0.1:5176 | 用户review已结束；原session Ctrl-C exit130，核5176无listener。旧源码/ref保留。 |
| 新生产WT，归档40cc974加本批dirty production | PID54852/session7499，127.0.0.1:5176 | 正式App离线验收；自建Chrome关闭后原session Ctrl-C exit130，再核5176无listener。 |

旧Demo配置直接merge新基线Vite callback首次失败，未形成listener；调用实际base(environment)后正常单实例启动。首次截图因模拟已就绪未拍到卡片，不作为最终证据；最终在重播后文字入场动画收束时捕获并实际看图。

最终无保留服务、浏览器覆盖或待释放消费者；未触碰5198/5544/8787/8788及其进程/配置。后续复验由协调者重新分配窗口，不把旧端口登记当常驻授权。
