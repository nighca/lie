# 语音连接等待：趣味提示三案

## 已授权的动态 Demo（2026-10-30）

最新姓名呈现：首句角色名复用既有 `CharacterNameText`，从当前人物预设读取 accent，沿用相同背景色和下划线；其余文字、阶段和时长不变。

最新连贯性调整：用户指出“准备开聊”夹在搬椅子与坐稳之间不构成连续动作；第三句改为“TA 正在入座…”。当前顺序为“正在请{name}过来… → 搬个椅子… → TA 正在入座… → 等 TA 坐稳…”，时间与纯文字小窗保持。

最新简化：用户要求步骤圆点也去掉，当前小窗仅保留顺序切换的主句、开口提示和取消按钮；此前插画/气泡/副句/圆点版本均为历史探索。

最新文案微调：用户确认系统向玩家说明进展的口吻，首两句改为“正在请{name}过来…”、“搬个椅子…”，后两句及节奏不变。下文早期文案与截图保留为历史。

用户随后授权将“请人 → 落座 → 准备开聊”放进当前具体 UI 做可运行 Demo；这不等于正式产品实施批准。独立工作树：`/Users/nighca/.codex/worktrees/lie-connection-design/lie`，分支 `codex/lie-connection-design`，基线 `60c11f72b71ead4b8e744f2281d5dbecb796d11a`。入库仍交协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8` review/合入，本专项不提交、main、推送或部署。

- [可运行 Demo](http://127.0.0.1:5176/connection-demo.html)；右上“演示工具”提供重播、短 0.9 秒、切人参考 1.7 秒、首开参考 2.5 秒（默认）、长 8 秒以及立即模拟接通/失败。
- [独立尺寸验收页](http://127.0.0.1:5176/connection-demo-viewports.html)，iframe 支持手机/窄屏/桌面，不改变浏览器全局视口。
- 文案依次为“去请{name}过来…”、“搬把椅子…”、“准备开聊…”、“等 TA 坐稳…”；在 0 / 0.7 / 1.4 / 2.1 秒推进，副句固定“等候不占询问时间”，最后一段保持。时间只编排戏剧过场，不表示技术进度；旁白及图形不入询问记录。实际就绪随时退出，不强制播完整段，1.7 秒预设会在第三段提前结束。
- 真实 App 舞台、人物选择、询问记录、底栏继续使用当前组件。App 只增加连接提示 slot，默认正式提示原样保留；独立入口提供候场组件与可控离线 VoicePort，不加载真实语音适配器，不使用麦克风、供应商、账户凭据、声效或存储。
- 每轮重播/切人重置过场；提前模拟就绪立即退出，取消/快切/失败沿原 controller 合同处理。按用户后续反馈，已删除底栏 CSS 替换，底栏保留原生“正在连接”，弹窗保持叙事文案。
- 用户最后明确“只是指移除插画，气泡和步骤圆点先留着看看”。本次仅删除小窗内人物头像/招呼及椅子插画，保留中性省略号/问号气泡与 4 个步骤圆点；整套过场使用同一小气泡区，图形区收至 64px，前两段没有空洞、后两段不跳高。正式人物舞台和左侧人物头像未改，文案/700ms节奏/取消/预设/底栏均不变。

最新审看版本：用户随后明确气泡也属于要移除的插画，并要求删除“等候不占询问时间”。当前卡片只保留主句、4 个步骤圆点、底部“等 TA 坐定，再开口哦”和取消；图形区/气泡/气泡内动画点及副句的模板与 CSS 已移除，不留图形占位。舞台与人物头像、700ms节奏、默认2.5秒等预设、底栏原生“正在连接”不变，未涉及其他隐藏版本任务。

最新实际浏览器截图（非合成）：[纯文字小卡](../design/voice-connection-refresh/demo/text-only-final.jpg)。[391×844 首尾检查](../design/voice-connection-refresh/demo/text-only-checks.json)显示第0/3段均高 **154px**，均保留4个步骤圆点；无高度跳变。8目标tests、专属typecheck及diff check通过，仅HMR，原 PID13931/session83334 和根依赖链接未变，独立依赖仍 prepared。自建 Chrome1910332081 iframe验收后关闭，未动用户IAB/全局viewport/storage/真实语音。

[曾保留气泡的上一版](../design/voice-connection-refresh/demo/lightweight-final.jpg)、[加快节奏但尚含插画的前一版](../design/voice-connection-refresh/demo/rhythm-final.jpg)、[首轮请人](../design/voice-connection-refresh/demo/mobile-invite.jpg)、[首轮落座](../design/voice-connection-refresh/demo/mobile-chair.jpg)、[首轮持续候场](../design/voice-connection-refresh/demo/mobile-wait.jpg)、[首轮桌面](../design/voice-connection-refresh/demo/desktop-1280.jpg)保留为设计历史，其旧图形/文案、7.5 秒预设和底栏替换不代表当前 Demo。

本次微调复验：[391×844 iframe 首尾检查](../design/voice-connection-refresh/demo/lightweight-checks.json)显示第 0/3 段均高 **255px**，均保留气泡与 4 个步骤圆点，卡片内 img/svg 均为 0。运行原 PID13931/session83334，仅 HMR，没有重启或切依赖；独立依赖仍只 prepared。使用准备目录的 Vitest/vue-tsc CLI，8 目标 tests 与专属完整 Web 类型检查通过，未做完整构建。原 Chrome1910332005 已不存在（本任务未关闭），本轮新建 Chrome1910332071 独立 iframe 测试，验收完成后已关闭，仅保留用户 IAB review 与原服务；未操作用户 IAB/游戏、storage、全局 viewport 或真实音频。

### 节奏参考依据与本轮复验

用户要求将过场节奏贴近曾观察到的等待量级。[2026-10-25 原始调查](voice-connection-latency/README.md)及[原始记录](voice-connection-latency/native-results.json)给出首开 2536.2ms、停止后重开 1799.6ms、active 切人 1687.5ms。每场景仅一次本地样本，场景与热身混杂；不是当前线上分布、平均、p95、SLA，也不是本次实测。新 0.7 秒间隔与 2.5/1.7 秒预设是据小样本拟定的设计假设，不是连接优化成果。

沿同一服务、同一自建 Chrome tab 的 391×844 iframe 复验：底栏实际文字为“正在连接”；2.5 秒模拟首开经过最后一段后立即退出，1.7 秒模拟切人在“准备开聊”后退出，没有被延长到最后一段。[UI 操作到退出的浏览器观察记录](../design/voice-connection-refresh/demo/rhythm-checks.json)分别约 2631/1783ms，包含自动化交互及观察开销，仅证实离线 Demo 预设行为，不是产品连接延迟。

### 验证与局限

首轮专属 Chrome tab `1910332005`，IAB 当时明确不可用后经协调者批准 fallback；全程未改全局 viewport、storage、其他标签、麦克风/供应商。首轮 391×844 iframe 实测卡片 359×273，1280×878 iframe 卡片 380×291，横向 scrollWidth 均等于视口；最新去插画版高度以本次 255px 检查为准。实际检查请人/椅子/最终等待、目标顾遥和快速切换沈禾→顾遥→陈拓最终只保留陈拓、同人物重播归零、提前就绪/取消/失败退出。桌面截图中的预算已扣去先前模拟接通后的时间；这不是候场计时。320px、200% 缩放、屏幕阅读器、系统减少动态尚未原生验收；减少动态 CSS 会禁用装饰动画，自动测试不证明真实语音。

首次浏览器发现 demo 请求 ID 与实际案件 ID 不同导致加载失败，已改为实际 ID 并复验加载。首张气泡因未显式定位产生竖排遮挡，已改中性省略号及明确左右位置，目检三张修正截图，旧失败图不再作为交付入口。展开工具会临时覆盖手机人物区，切人验收先收起工具；默认收起且不遮底栏。

Node `24.22.1`，复用现有第三方依赖，没有安装新包。`node_modules` 是指向 owning main 依赖的**未跟踪本地链接，不可入库**；Vite/Vitest aliases 强制 `@lie/*` 使用本工作树源码，缓存显式位于本树 ignored `tmp/connection-demo/{vite,vitest}`。最初默认 Vite 缓存的 realpath 是本树 `apps/web/node_modules/.vite`；没有删除主树旧缓存。人物 generated 121 资源也仅在本树 ignored public/appearances。

实际检查：更新节奏后专属 Vitest 配置下 **2 files / 8 tests 通过**（4 项新时序/生命周期 + 4 项原正式提示），含 699ms 仍为首段、700/1400/2100ms 推进及原生底栏文案断言。专属 tsconfig 对完整 Web source/tests 的 `vue-tsc --noEmit`、`git diff --check` 通过。默认 Web tsconfig 本轮因共享 node_modules 的 workspace 链接解析到较新 main 播放器（新增 flush 合同）而失败；新增 `connection-demo.tsconfig.json` paths 明确绑定本工作树包源码后通过，不修改业务/生产测试来适应另一工作树。未跑全仓构建/长套件。Vite 保留 native-config 扩展名警告。

```sh
# 在 apps/web 中，使用 Node 24.22.1
node ../../node_modules/vitest/vitest.mjs run --config connection-demo.vitest.config.ts test/connection-design-demo.test.ts test/voice-connection-notice.test.ts
# 在仓库根目录
node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p apps/web/connection-demo.tsconfig.json
node node_modules/vite/bin/vite.js apps/web --config apps/web/connection-demo.vite.config.ts --host 127.0.0.1 --port 5176 --strictPort
```

### 保留服务交接

owner：本专项 `connection_design` / 发起 Chat `01a18adf-d929-7060-969c-8c2d40415d04`；来源为上述独立工作树，HEAD `60c11f7` 加本批 dirty demo，未包含后续 main `a742b1e` 网关修复，因本 Demo 不调用网关而不依赖该改动。仅 `127.0.0.1:5176` Vite，**PID 13931 / 原 session 83334**；消费者为用户当前设计 review，保留至用户结束 review 或协调者接管/明确停止。优先原 session Ctrl-C 后核 listener 消失，禁止按端口/进程组停止未知服务。启动前已核无监听，不启 Worker，不碰 5198/8787/8788。

初始 session 2450、过渡 session 27009 均已在原 session Ctrl-C，退出码 130；当前唯一监听由 lsof 核为 PID 13931。Chrome 自建 tab 保留为用户审看入口，工具验收页回到直接 Demo 后交付；无其他浏览器 override 需恢复。

### 独立依赖过渡准备（尚未切换）

2026-10-30，用户授权恢复 main 跟随环境，其 runner 后续 `npm ci` 可能替换当前共享依赖，因此先准备专项副本。**用户仍在 review，未释放服务窗口；本批没有停止、重启、切换 PID 13931/session 83334，没有移除或替换当前根 `node_modules` 链接。** 8787/8788、main 及其依赖未修改。

准备目录为本工作树 ignored `tmp/connection-demo/isolated-deps`；只复制本树根 package.json/lock 和 6 个 apps/packages 工作区 package.json 骨架，没有复制 main/node_modules、源码或凭据。Node **24.22.1** / npm **11.19.1** 在此目录执行锁定安装；npm cache 位于本树 `tmp/connection-demo/npm-cache`，userconfig 用 `/dev/null`、globalconfig 用 staging 内空 `empty-global.npmrc`，注册表为 npm 官方源。文件写入与联网安装经沙箱提权审查执行。

首次安装因下载 `@cloudflare/vite-plugin` 时 ECONNRESET 失败；复用本树 cache、同一锁文件有界重试后 **npm ci exit 0，217 packages，9s**。npm 提示 workerd 两版本及 fsevents 的安装脚本未获 allowScripts 覆盖；本批没有扩大脚本许可或启动 Worker。最初空 user/global 配置都指 `/dev/null` 触发重复配置错误，改为两个不同空配置后继续；不是锁文件或应用错误。

安装命令（工作目录 `tmp/connection-demo/isolated-deps`；PATH 使用上述 Node runtime）：

```sh
npm ci --cache=../npm-cache --userconfig=/dev/null --globalconfig=./empty-global.npmrc --registry=https://registry.npmjs.org --prefer-offline --fetch-retries=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=5000 --no-audit --no-fund
```

安装完成后，仅在**新目录**的 `node_modules/@lie/` 将 gateway、web、character-animation、game-core、ui、voice 共 6 个链接从 staging 空骨架重定向到本工作树实际 apps/packages，逐个 readlink/realpath 核实。Vue 3.5.44、Vite 8.3.5、Vitest 5.0.5、TypeScript 5.9.3、vue-tsc 3.3.13、plugin-vue 6.0.10 的真实路径均位于新依赖目录；直接运行其 Vite/Vitest/vue-tsc 版本命令通过。所有依赖符号链接扫描未发现其他外部目标（工作区源码链接不向内递归），没有第三方包指向 main。8 份复制清单/锁文件与源逐字节 hash 一致；根 `package-lock.json` SHA256 为 `2efd70fe940997ce63746a05a6d5574974560a67d6a737f4801e9f9e254e82e0`，业务清单/锁未改。

本地准备回执保存在 ignored `tmp/connection-demo/isolated-deps/{preparation,verification}.json`；这是尚未启用的依赖，二进制版本检查不等于完整运行验收。当前根链接仍为 `/Users/nighca/code/nighca/lie/node_modules`，5176 listener 仍为 PID 13931，source/aliases/专属 tsconfig 和用户消费者保持。

待用户 review 释放后另行串行切换：原 session 停服务并核销 listener；复核上述 hash、6 个 workspace 源码链接与当前根链接归属，仅替换本工作树根链接到准备目录；保留 Vite aliases/tsconfig paths，执行目标 tests/types 并核对实际模块来源；在原 5176 strictPort 启动一次并记录新 PID/session，做最小浏览器复验。**这些步骤本批均未执行。** 后续若重新对 staging 执行 npm ci，会重建 workspace 骨架链接，必须再按本节重新定向与校验。

## 首轮静态选型稿

2026-10-30。**方案讨论稿，待用户选择；没有修改正式 UI、连接流程或供应商配置。** 用户希望以更丰富、有趣且符合项目风格的文案和样式，缓解首次连接及切换人物时的等待。此稿在已批准奶油小卡的基础上探索，不撤销历史批准，也不将新方案视为实施许可。

视觉沿用 [中文 B](visual-direction.md)、[规范](../design/ui/spec.md) 与 [tokens](../design/ui/tokens.json)：阳光黄、奶油阅读面、钴蓝、深蓝描边及正式卡通人物。三案均为系统提示，不是角色台词，不进入询问记录，不通过紧张、汗滴、躲闪、撒谎等文案或表情暗示嫌疑。

## 最新方向：准备开聊的小过场

用户后续确认采用符合游戏背景的轻松旁白，替代“正在连接语音”等技术表述；进一步提出多句按固定时长顺序播放，形成几个步骤向前推进的感觉。此方向覆盖下文旧稿的“正在连接”常驻和每轮仅一条文案建议；旧图仍保留为首轮探索，尚未按新方向重绘。具体文案和时长仍待确认，未进入正式实现。

首组节奏提案（时间为设计建议，非实际技术阶段或服务耗时）：

| 展示时间 | 文案 | 视觉提议 |
| --- | --- | --- |
| 0–1.5秒 | 去请顾遥过来… | 当前人物小像出现，第一枚圆点点亮。 |
| 1.5–3秒 | 搬把椅子，坐下聊… | 小椅子图形落定，第二枚圆点点亮。 |
| 3–5秒 | 问题放嘴边，开场白备好… | 小问号出现，第三枚圆点点亮。 |
| 5秒后 | 等 TA 坐稳，咱们就开聊。 | 保留最后一段的轻微等待动效，不循环回第一步。 |

这些是虚构候场旁白，不对应服务端任务完成；避免百分比、全部完成打勾或按固定时间宣称已经可以说话。真实就绪可随时打断过场，立即进入原有可开口状态，不要求播完；失败或取消同样立即停止。用户在等待时切换人物，新目标从第一句开始，不残留旧名字。视觉优先只保留当前一句与少量进度圆点，不把所有句子列成长清单。

最后一步不再自动增加“完成”状态。若等待异常久，建议一次性换成“这位来得有点慢，等候不占询问时间”，保留明确退出操作；长等待阈值及按钮是否由“取消”改为“先等等”仍待讨论。不得把权限/设备错误藏进趣味文案。

## 三案与推荐

![三案总览](../design/voice-connection-refresh/overview.png)

| 方案 | 主要文案 | 视觉及适用取舍 |
| --- | --- | --- |
| A 候场小卡（推荐） | 请顾遥来接个话… / 把下一句问题先放在嘴边。 | 延续奶油卡，加入目标人物小像和轻拟人旁白，亲切且容易识别正在接通谁。 |
| B 漫画接线牌 | 下一位，顾遥！ / 正在接通语音… | 钴蓝标题带、抽象接线插画，切换感最强，存在感也最大。首次连接可用“和顾遥聊聊”。 |
| C 侦探便签 | 下一句，先问什么？ / 先打个招呼，还是直奔主题？ | 奶油便签、轻量通用思考提示，不增加证据或提示答案。后续连接可替换为“也可以翻翻刚才的询问记录”。 |

三案常驻明确“正在连接”与“接通后再说话”，保留“取消”。此次静态卡片约 343×167px（移动合成）/ 420×204px（桌面概念），比当前 312×68px 小卡更大；这是等待内容更丰富的空间代价，选定后应再收敛紧凑度、长姓名及窄屏布局，不直接按图落地。整体仍是局部非模态提示，不增加全屏遮罩。

[A 移动上下文](../design/voice-connection-refresh/a-mobile.png)、[A 桌面上下文](../design/voice-connection-refresh/a-desktop.png)、[三案移动对比](../design/voice-connection-refresh/mobile-comparison.png)。上下文为静态重绘/合成，品牌字标裁自已有浏览器图，人物来自正式预设；不冒充当前运行截图，也没有真实角色证词。

## 文案、动效和等待长度

- A 的小像可做很轻的上下浮动或点头，省略号慢慢循环；不使用心虚、汗滴等表情。B 的接线头轻摆，永不显示伪造波形/百分比。C 的便签短暂落下后保持安静，减少重复观看疲劳。这些是动效提议，PNG 不演示动态。
- 不论首次还是切人，每轮连接只选一条趣味旁白，保持稳定；不要快速轮播文案。A 的备选如“请沈禾来接个话…”、“下一句，准备问什么？”、“问号准备好，对话马上开始”中，最后一句包含时间承诺，应避免使用；推荐前两类不承诺速度的句子。
- 若等待明显变长，可把趣味副文案一次性换成“连接得有点慢，询问时间还没开始计时”，始终保留取消。何时算长等待（例如 8 秒）属于待确认细节，不将该数字当作实际服务承诺或现有状态。通常连接期间就保留现有预算数字，避免再堆一条常驻说明。
- 失败停止装饰，显示现有具体错误和重试/返回入口，不继续趣味旁白或假装仍在接通；权限错误仍需明确设备/权限提示，不能被泛化文案掩盖。
- 真正就绪后立即退出提示，继续现有真实收音反馈；不为完整演完动画、展示完文案或制造仪式感延长等待。连接准备不扣询问预算是当前既有行为，非新提案。

## 后续实施边界

保留当前 `Conversation.open()` / 收音就绪边界、取消与快速切人保护、错误处理、计时合同；不新增预热、并行连接、后台 AI 请求、声效、角色证词或玩法。窄屏、320px、长人物名/200% 缩放、键盘取消、至少 44px 点击区以及减少动态设置需在选型后的实际 Vue 界面验收。减少动态时保留静态标记，屏幕阅读器只播报连接阶段/目标变化，不播每个装饰动画或频繁文案变化。

## 素材与检查

生成源：[generate.py](../design/voice-connection-refresh/generate.py)；基线、素材哈希和局限：[source.json](../design/voice-connection-refresh/source.json)。使用系统 Hiragino Sans GB W3/W6，明确正文与标题字重；W6 在该 TTC 中实际是 index 2，而非 index 1。

本批实际执行图片生成、PNG 解码及尺寸检查，目检总览、A 移动、B/C 卡片及桌面图；卡片圆角外透明，人物小像限制在头像区域。未启动任何服务、浏览器、麦克风/供应商调用，未运行应用构建/测试；静态合成不证明真实响应式、动效、语音或可访问性行为。
