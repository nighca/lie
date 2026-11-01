# 公共背景自然段间距

2026-11-01。用户反馈公共背景中的两段文字仅有类似自动换行的行距，要求一起修复。用户原图由主代理保全，本轮未读取用户分享作品或草稿，仅使用已有官方内容与独立测试文本。

## 实现与无损契约

官方五案的公共背景均以单个LF分自然段；仅识别双LF会漏掉现有内容。新增专属展示组件`PublicBackground.vue`，由接案介绍和调查中的公共背景弹窗共用：按捕获分隔符的`/(\r\n|\r|\n)/`拆分，正文片段作为段落，分隔符仍原样渲染为段间纯文本节点。无trim/filter、HTML解析或文本改写，父容器normal，段内原CharacterNameText保持pre-wrap、姓名高亮和安全字面展示。

相邻段落间距`.75em`，自动折行仍用原行高。空段保留且有1lh最小高度，连续空行、前后空格与换行不丢失。App只替换两个展示入口，移除原`.background`和`.public-background`的父级pre-wrap，避免分隔符再次产生额外换行；不改案件文本、编辑器、引擎、计时/语音或背景弹窗原停聊行为。

本WT `a92e/lie`、分支`codex/first-use-help-assessment`。源码基线为已独立提交a11y修复`0a96b27fce210bcfabbe063be9d4ac14d9bf2aa6`；期间主代理仅将历史JPEG附件正确rename并提交纯文档`720c02535bc3a4832240bbd06ae5b4a3fc01c8e5`，本轮产品dirty变更保持原样。本记录不混入先前独立a11y或附件批次。

## 检查

Node24.22.1、现有独立依赖，实际执行：

- `npm run test --workspace @lie/web -- background-character-names.test.ts App.test.ts CharacterNameText.test.ts --maxWorkers=2`：3文件33项通过。
- 将新增参数表改为无类型断言的同值对象写法后，重跑`background-character-names.test.ts`，8项通过。覆盖单LF、双LF、CRLF、CR、前后空格/tab/换行、空段、两个入口textContent严格等原文、姓名高亮、HTMLliteral安全和既有背景停聊/保持暂停契约；不新增镜像CSS测试。
- `npm run typecheck --workspace @lie/web`通过。
- `npm run build --workspace @lie/web`和postbuild通过：8套预设/121资源检查，82图像缓存命中、0编码，无新下载。既有configLoader无扩展名import与underline静态路径提示保留。
- `git diff --check`通过。

生产构建入口`apps/web/dist/assets/index-CXY223lG.js`，SHA-256 `f6ccb3965315405df093b27dfe31c1768cc1da43eda8b5f6fc2fb6c1a4911334`。该构建来源为当前HEAD+dirty实现及主代理文档更新，不是clean发布包；用户体验使用Vite DEV，不将其等同线上bundle。

## 真实浏览器

使用主代理已允许的Chrome fallback，新建专属tab`1910332601`；所有URL保留`demo=1`，只用已公开官方江苏三段背景和纪念章两段背景。没有真实provider/mic/WS、用户tab/storage/草稿或分享写入。

实际保存并查看主要布局：

- 1280×800：[江苏接案](background-screenshots/desktop-intro.jpg)、[公共背景弹窗](background-screenshots/desktop-dialog.jpg)。intro段内行高28.8px，段距12px；dialog行高27.75px、段距11.25px，正好为各自字号的.75em。自动折行与显式分段已有清楚区别。
- 391×844：[江苏接案](background-screenshots/narrow-391-intro.jpg)、[背景弹窗](background-screenshots/narrow-391-dialog.jpg)。三段和人物高亮可读，弹窗宽353px、左19/右372、顶220/底624。
- 320×844：[纪念章两段接案](background-screenshots/narrow-320-two-paragraph-intro.jpg)、[两段弹窗](background-screenshots/narrow-320-two-paragraph-dialog.jpg)。两段间距清楚，弹窗宽282px、左19/右301、顶211/底633；无横向溢出。接案页允许正常纵向滚动，不把长背景压入固定高度。

完整[DOM量测](background-screenshots/measurements.json)记录三宽度scrollWidth均等于viewport。截图保存为真实JPEG并经`file`魔数检查，扩展名`.jpg`，没有重编码或处理旧截图。

浏览器中先开启模拟对话再打开背景，按钮恢复“开启模拟对话”，确认原停聊行为保留；关闭不自动续聊。原生Escape返回正常，console warn/error为空。检查完成reset viewport、关闭自建tab，未操作用户当前页面。浏览器假对话与桌面Chromium截图不等于真人、Safari或移动真机验收。

## 源码与服务交付

| 文件 | SHA-256 |
| --- | --- |
| `apps/web/src/App.vue` | `23c89e8c02ddbb4dd77207a82cc6649b1138cbfb177fcca19ba4bf055616868a` |
| `apps/web/src/style.css` | `5dd5f6e6f55d239763db5000e0a08a601ca626430bbecfb4138a57a3f8d91484` |
| `apps/web/src/presentation/PublicBackground.vue` | `000e32e3fafe6ce0f2b21854ed579ff4cff3804966007550f357a3f52fd26d25` |
| `apps/web/test/background-character-names.test.ts` | `e3940071ea35369f904e18d98df44bd058532d2b5b6b97e8e349ca9f142cd19d` |

既有5544 Web继续PID64673/原PTY63756、cwd本WT `apps/web`、proxy8788；最终lsof仍为同PID监听。本轮仅正常HMR，无重启/新增服务。自动验收consumer结束，用户本地体验consumer保留；正常入口`http://127.0.0.1:5544/`，免麦克风入口`/?demo=1`。用户表示结束后由owner原PTY停止并核PID/listener，不连带清理文件/WT；其他端口与服务不动。

未stage/commit/main/push，交主代理实际review与具名提交。主README及用户反馈原图归主代理，本记录保留本项实现、检查与限制。

主代理已完整审查组件、两入口、相关CSS与测试diff，独立核对上述四文件hash；实际查看桌面三段接案与320px两段背景弹窗，并阅读完整DOM量测，确认显式段距与段内行距分开且无横向溢出。具名提交后的版本继续供用户本地体验，不据此称已被用户接受、合入或发布。
