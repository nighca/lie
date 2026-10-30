# 隐藏页面版本入口

2026-10-30，用户在总协调要求隐藏常显版本，并点 Logo 红点弹窗查看、不导航；后在本专项直接确认“确认实现红点弹窗显示版本号”。第一轮审批因跨 chat 授权来源被拒绝，读取原 userMessage 补证仍被拒绝；当前直接确认后原动作重审获准，未换工具规避门禁。

## 交互与边界

保持 Logo inline SVG（含红 circle）及原动画；非交互 brand 容器内，原导航 anchor 和透明原生 button 为兄弟。button 命中区主要朝红点上方空白扩展，避免覆盖 i/E；默认没有新可见装饰，键盘焦点有轮廓。button 只发出 `showVersion(trigger)`，不依赖构建元数据。

Application 统一拥有一个 PageVersion/UiDialog；首页、游戏 App、Editor 转发同一事件。关闭或 ESC 后显式回焦触发点；原 Logo 其它区域沿旧导航及离开确认。保留实际构建 SHA、DEV/unknown/dirty 和完整 hash 选择，不新增 API、剪贴板权限、依赖或遥测。首页旧页脚和专属样式移除，不带入等待提示实现。

## 来源与准备

新 managed WT `/Users/nighca/.codex/worktrees/lie-hidden-page-version/lie`、branch `codex/hidden-page-version`；原指定 base `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`，经总协调许可，在自身 clean 分支 `merge --ff-only` 到已审查生产 base `f86206611dbc0a10260fb1605d9a616b22493dc3` 后实现。独立 npm ci 安装217包，缓存、生成资源和临时验证在本 WT；未复制或共享 main/node_modules，锁文件不变。最初错误 runtime 路径使 npm 以24.17启动，确认本任务 PID/cwd 后 SIGINT停止（exit130），随后正确 Node24.22.1/npm11.19.1安装成功；workerd/fsevents未批准脚本未扩大许可，前端检查不启动 Worker。

此专项不改 gateway/voice/controller/audio/工作流/中央文档，不更新 main、push 或部署。原5544 turn在审批阻塞时已归还，后由gift-case用户占用，本任务不触碰；新5176 turn待原等待提示owner停机并由root核无listener后才使用。

## 验证记录

以下是候选在本独立工作树的实际结果；尚未合入或发布。`prepare-qa.mjs` 仅向 ignored Web dist 生成本地 QA 入口，不修改正式构建入口或生产 source。iframe 在应用加载前替换自身 localStorage 为内存 Map，避免读写用户草稿；外层拥有独立桌面/手机尺寸，不修改全局 viewport。


### 实际检查结果

- Web/UI `vue-tsc --noEmit` 通过；Web 目标 6 files / **71 tests** 通过（page-version、hidden-page-version、home-presentation、navigation、editor-navigation、editor-page），UI 全 5 files / **60 tests** 通过。新增测试验证 default closed、dot 只发版本事件、普通 anchor 导航、关闭/ESC回焦、活动游戏与 fake voice scope/history不变、Editor route/draft不变。原 Editor 三处 class 点击改为语义 anchor，防止 wrapper 改为 div 后测试失真。第一次类型检查仅新测试 `dialog.open` 选择器泛型不完整失败，改为 `get<HTMLDialogElement>` 后通过，无业务补丁。
- Web 正式 build/postbuild strict 通过：8 presets /121 assets；独立冷缓存82个源编码。保留既有 Vite native-config 扩展名与 hashed underline SVG 构建时不解析警告，未压掉。构建时真实 HEAD 为 `f86206611dbc0a10260fb1605d9a616b22493dc3` 且 source dirty，故原生弹窗如实显示该完整 SHA 和“本地改动”；不是最终集成 SHA。最终提交/集成会改变版本注入，主协调需对最终 SHA 构建，不通过反复修改报告追逐自身 hash。
- IAB 在本轮 browser inventory 中不可用；经已授权 fallback 使用自建 Chrome tab `1910332099`。原生 production dist，独立 iframe1280×878和391×844，未改变全局 viewport；默认页没有常显版本/footer，弹窗初始关闭。红点中心实际命中兄弟 button，L/i/E采样均命中导航 anchor；透明目标28×24 CSS px（主要向上方空白扩展，非真实手机硬件验收）。原 SVG path/circle attributes 与正式 logo 完全相同，原动画和 reduced-motion CSS不变。
- 鼠标点击、原生键盘 Enter/Space 打开、ESC/关闭按钮关闭及回焦通过，键盘返回焦点有3px轮廓。弹窗桌面560px、手机351px，完整hash可读且 `user-select:all`；手机文档scrollWidth391=视口，没有横溢。
- 真实首页→案件→调查期间开/关版本保持 route和08:00预算；普通 Logo 导航仍进入原离开确认。Editor 填入合成“版本弹窗验收草稿”后开/关版本，标题/route保持；普通 Logo仍可回首页。没有点击真实语音开启、无 provider/mic/WS/profile操作。QA iframe在模块前替换自己的localStorage为Map，实际证明memoryStorage=true；读取时0个 `/api/voice` 资源请求。不会读写用户草稿/其他标签。
- 测试期间一次只读 CDP 核对内存隔离调用工具异常等待约576秒后返回成功，此后未重复；普通 Playwright只读scope不支持cross-frame contentDocument/localStorage，失败的探测未改变页面。浏览器error logs最终为空。DOM录像、Safari/真实触屏、200%缩放和原生 reduced-motion切换未做；不能将自动测试称为这些体验通过。

### 视觉与可复现附件

[默认桌面](evidence/desktop-default.jpg)、[桌面弹窗](evidence/desktop-version.jpg)、[默认手机](evidence/mobile-default.jpg)、[手机弹窗](evidence/mobile-version.jpg)均为实际浏览器截图。[脱敏DOM观察](evidence/browser-results.json)与[源文件指纹](evidence/source-fingerprint.json)用于对照；图片只截专属iframe，不含浏览器账号或其它窗口。Cua工具不能直接写入新WT，曾短暂放在自己创建的 `/private/tmp/lie-hidden-version-*` 传输目录，经提权逐文件SHA核验复制入本WT后已全部删除；主目录未写图片。

复现（本WT独立依赖、Node24.22.1/npm11；先由协调者分配端口）：

```sh
npm run typecheck --workspace @lie/web
npm run typecheck --workspace @lie/ui
npm exec --workspace @lie/web -- vitest run test/page-version.test.ts test/hidden-page-version.test.ts test/home-presentation.test.ts test/navigation.test.ts test/editor-navigation.test.ts test/editor-page.test.ts
npm run test --workspace @lie/ui
npm run build --workspace @lie/web
node docs/hidden-page-version/prepare-qa.mjs
node node_modules/vite/bin/vite.js preview apps/web --host 127.0.0.1 --port 5176 --strictPort
```

访问 `/__hidden-version-qa.html`，只操作新建QA页内iframe；勿修改用户已有origin storage。辅助HTML只写入 ignored dist，生产 source/构建配置不含QA入口；本轮服务停止后已删除该两份临时dist HTML，重放时由脚本重新生成。

### 服务与清理回执

owner `/root/hidden_page_version`，发起chat `01a18adf-d929-7060-969c-8c2d40415d04`；本WT source HEAD `f862066`+本文候选dirty，仅`127.0.0.1:5176` Vite生产preview。root明确移交turn后，起前lsof无listener才启动；**PID27291 / 原PTY49676**，consumer仅本次离线原生QA，结束即停。实际原PTY Ctrl-C退出码**1**，随后 `lsof -nP -iTCP:5176 -sTCP:LISTEN` exit1空、`ps -p27291` exit1空。自建Chrome1910332099已关闭，未保留consumer/viewport/storage覆盖。没有碰5544/5545/5546、8787/8788、旧等待提示服务或main/push。

工作树保留给主协调review，未archive；独立node_modules、工具cache、生成资源均ignored且仍在本树，未共享main依赖。所有候选源/有效测试/本文/必要截图准备为具名文件提交，主协调独占集成和发布turn。
