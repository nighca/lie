# q90 实际构建浏览器验收

2026-10-25，约12:50–12:52 Asia/Shanghai。代码为 `9e7f9f130cbcafac107151b4d0c0237d5b98c75e`，含离线证据的服务启动HEAD为冻结 `0e42397c5a023cac8b28e0edde98127c7dfb1451`；文档新增不改变应用bytes。[190文件构建身份](built-identity.json)与前批相同，没有重新造测试专用产品或绕过生产loader。

**实际built Worker与IAB验收完成**：主页WebP、第一案三人canvas、切换、正误结果静态WebP和reduced-motion静态fallback均正常。此前5356占用由root取得原owner释放后再核空闲，才启动本批服务。

## 执行人与范围

子任务的CUA上下文只暴露Chrome1，选择iab与父任务已知id3均返回not available；自身`open_in_codex`仅queued到隐藏child（`01a1713c-0915-72a2-a1d7-0c84d2087cdb`），未形成可操作child tab。没有Chrome回退。专项initiator在其实际可用IAB3创建**自己的tab2**，执行同一已授权5356验收；子任务保留服务/HTTP/证据归档责任，并实际读取全部JSON、查看全部8张截图，归档4张必要截图。这个工具上下文接力不冒充由子任务直接操作IAB。

使用桌面1280×720、窄屏391×844。只操作首页、第一案介绍、接案、三位人物切换及按钮指认；**没有点击开启对话，没有mic/provider/API/WS或编辑器/草稿操作**。不属于跨浏览器、真实手机或真人语音验收。

## 实际证据

- [首页网络](browser/home-network.json)：8个WebP图片均200、`image/webp`、cache=false，Content-Length合计 **1,133,890B**，与离线预期完全一致；原PNG同集合7,468,258B，减少84.82%。initiator另观察已解码natural尺寸1254×1254；网络JSON不伪装记录了DOM字段。首页已实际查看，未重复归档该截图。SVG品牌资源正常，未归入这8张bitmap字节。
- [首次调查网络](browser/sunny-network.json)：重写后的sunny package与5个相对`.webp`部件均200（Fetch）；native构建对应5图595,822B。真实HTMLImageElement已解码供canvas渲染，sunny已实际查看；归档[桌面coral](browser/coral-desktop.jpg)、[391px blue](browser/investigation-mobile.jpg)。这是可见canvas图像证据，未宣称逐帧像素动画计时或真实voice状态切换。
- [切换与结果网络](browser/switch-results-network.json)：coral的11parts、blue的6parts为WebP200，错误结果sunny/default.webp和正确结果coral/default.webp正常解码1254×1254。见[错误391px](browser/wrong-mobile.jpg)、[正确桌面](browser/correct-desktop.jpg)；正确结果另已在391px实际查看。当前base只有可选结果契约，尚无新的结果原画，故实际结果用原default的q90派生；新可选结果引用由单元fixture覆盖，不冒称浏览器已验未来素材。
- 减少动态效果模拟触发真实静态fallback；[DOM记录](browser/fallback-dom.json)中canvas **rect为0×0**（DOM仍存在，不是声称canvas卸载），可见sunny/default.webp natural1254×1254、displayWidth约527px。静态fallback截图已实际查看，DOM量化证据保留。网络错误触发fallback的分支由loader单元测试覆盖，本轮浏览器使用reduced-motion分支。
- [请求事件摘要](browser/request-summary.json)：81行，hasMore=false/truncated=false；实际解析无`/api/`、无WebSocket事件/URL、无PNG URL。按阶段保存的响应均为WebP；blob解码不重复计入HTTP字节。没有HAR、请求认证头或响应正文转储。
- [浏览器日志](browser/browser-logs.json)是空数组，仅表示本次捕获窗口无日志条目；不扩称所有场景永无错误。

截图中1280×720既有高度/滚动表现未因图片任务修复或改动；主协调另有高度专项。本次不把旧布局问题冒充q90回归，也不宣称解决布局。透明边缘与脸部在当前截图正常，质量方案已获用户选择，不另请求批准。**没有LCP/INP/CLS trace、线上部署或端到端延迟改善结论。**

## 实际HTTP与缓存行为

[http-acceptance.mjs](http-acceptance.mjs)对同一ASSETS-only built Worker执行5次有界静态请求，[结果](http-acceptance.json)：

1. hash manifest 200/7697B，与dist相同；
2. sunny/avatar.webp 200/135318B、`image/webp`，与dist逐字节相同；
3. If-None-Match返回304/空body；
4. HEAD返回200/空body；
5. 不存在的hash图片返回404、`no-store`、`Asset not found`，没有SPA HTML伪成功。

成功静态响应和304均一年immutable。这些是**本地真实Worker**的头，不改写成生产 `lie.agency` 已部署q90或实测LCP。manifest响应未显式Content-Length，报告使用实际body长度，不编造该头。

另在浏览器前进行第二次真实warm Web build：0encoded/50cache hits/0preserved，Vite报告292ms；实际190文件SHA与首次组合build记录逐一相同（cmp相同）。292ms是Vite自身报告，不包含整个shell/npm lifecycle时间，不与1.83s fingerprint时间混为一个分母。

## 服务与清理闭环

| 项目 | 事实 |
| --- | --- |
| source / worktree | 0e42397；`/Users/nighca/.codex/worktrees/image-q90-build/lie` |
| listener / server | 127.0.0.1:5356；Node PID92431，实际workerd listener PID92889 |
| originating PTY/session | exec session39359（tty=true） |
| consumer / stop condition | 同专项initiator的自建IAB3 tab2；HTTP与浏览器验收结束立即停止 |
| shutdown | initiator释放consumer后，原39359 Ctrl-C，exit130；随后lsof5356和ps92431/92889均exit1且无输出，确认listener与两进程已消失 |
| browser cleanup | initiator关闭自己的tab2，恢复cacheDisabled=false、Network.disable、Emulation features=[]及viewport.reset；未操作他人标签或5355/8787/8788 |
| child queued UI request | 隐藏child open_in_codex请求只有queued回执，没有实际child tab/handle；未取得cancel API，不伪称取消了该队列；未为清理打开额外页 |

本批未创建临时HTML fixture、未修改canonical/public PNG或用户草稿。浏览器截图/过滤后的JSON与HTTP证据已在本目录保存，临时原件不作为唯一交付。没有遗留本批服务或实际tab，无main/push/deploy；CI lease已交还root的新CI owner，不再改workflow。
