# 前端页面标题统一

2026-10-25。来源：用户报告线上title仍为“LIE · 开发预览”，要求整项检查修复。当前状态：完整实施、专项自审/自动/实际IAB/产物验证完成，待主协调独立审查集成，未push/部署。基线7d09e23f4e72bb981647e9dde410724fdf2252b9，分支codex/page-titles，工作树/Users/nighca/.codex/worktrees/page-titles/lie。原editor-state-recovery工作树已由协调清理，本次新建managedWT，未改旧refs。

## 接口与范围

正式访问域名由用户确认为https://lie.agency/，本次不硬写host或修改分享origin；正式品牌统一“LIE · 语音推理”，开发入口同样使用正式标题；不增加环境分支。HTML在脚本加载前以品牌作兜底。SPA唯一写入点为usePageTitle(route, controllerRef, shareErrorRef)，Application仅import+一行调用。标题只订阅当前controller公开getView/subscribe，不读private session，不增加fetch/额外解码。controller变更/组件scope销毁清理订阅；仅在最终标题字符串变化时写DOM，无关controller发布不反复写title。分享加载与失败沿用既有ref，迟到结果由现有route revision失效。

query仅判定是否请求案件，从不把query值、hash或错误原文当title；只有已验证并公开展示的案件名进入title，不包含答案/设定/转写。未知路径沿用真实catch-all行为：无game是首页，有game走原官方加载/失败，不新增404行为。标题通过document.title文本属性设置，不将内容写为HTML。

## 标题矩阵

| 实际入口/状态 | 标题（均在末尾附正式品牌） |
| --- | --- |
| HTML未加载脚本 | LIE · 语音推理 |
| / 或未知路径，无game | 首页 |
| /editor（包括草稿/预设失败） | 创作案件 |
| 官方请求pending / failed | 正在加载案件 / 案件无法打开 |
| /editor/preview pending / failed | 正在准备试玩 / 试玩无法打开 |
| /play解码pending / 失败 | 正在打开分享案件 / 分享案件无法打开 |
| 官方intro/interrogating/solved/lost/ended | 案件介绍/正在调查/指认正确/指认不正确/本局已结束 · 公开案件名 |
| 试玩相同phase | 试玩 · 对应阶段 · 公开案件名 |
| 分享相同phase | 分享案件 · 对应阶段 · 公开案件名 |
| /editor/preview刷新无临时副本 | 按原逻辑回/editor，创作案件 |
| 取消离开 / 重试 / back-forward / persisted pageshow | 随真实未离开状态或重新加载状态更新，不沿用旧结算名 |

实际生产入口为apps/web/index.html，Vite无额外多页input。仓库中voice-feedback-preview.html、packages/ui/index.html是独立开发展示页，不是产品子路由，不扩改其展示标题；ProductHeader/SVG内部title也不是document.title。最终dist需确认只有产品index且无测试fixture。

## 最终验证

- Web全量33文件 **315项通过**，其中20项pure/composable/HTML＋7项真实Application接线；Web typecheck/build及8 presets/89assets检查通过。既有underline.svg构建提示不变。
- 真实Application测试覆盖官方全部phase、取消离开、重试、back-forward、未知/非法query、实际分享publictitle和一次decode、加载/解码迟到、新路由不被覆盖、试玩及无快照刷新fallback、pagehide/persisted pageshow。fake voice断言不调用；标题读取不增加官方read或共享decode。
- [最终产物检查](evidence/build-check.json)：dist仅index.html产品入口，HTML标题正式品牌，HTML/JS均无“开发预览”，记录最终HTML/JS哈希。Vite静态预设检查通过，无QA夹具混入。
- 独立IAB专项5402、自建tab27及最终复核28；不改共享viewport/8787或8788服务/用户draft。未造QA页面，也未改本浏览器测试槽已有内容；仅读取5402前一轮专项完整测试稿做preview。全程demo、不启用voice/mic/provider/付费。
- [19次实际标题观测](evidence/browser-titles.json)：首页、官方介绍/调查/失败/重启/成功、真实back-forward、editor、preview/return/无副本刷新fallback、实际分享/刷新、损坏分享/重试、无效官方、未知路径。分享使用公开官方内容的本地gzip测试副本，公开标题“分享标题验收 🌊”，仅localhost解码。实际title均正确，无warn/error记录。
- [结果页截图](evidence/official-result.png)仅证明页面场景，不声称截图包含浏览器标签栏；标题证据以同次浏览器tab.title观测JSON为准。最后仅将writer由watchEffect改为watch字符串变化（避免无关发布重复DOM写入），全315/types/build重跑通过；最终tab28又复核首页→官方介绍正确，未重做全部点击矩阵。
- 浏览器瞬时loading/迟到竞态和真正persisted恢复时序由受控自动测试覆盖，不声称本次真机延迟/真实bfcache矩阵。无额外跨浏览器/移动设备声称；标题逻辑无CSS/布局变化。
- 清理：自建tab27/28均关闭，服务原exec87991 Ctrl-C退出，最终lsof5402无listener。没有临时public文件/持久fixture/新键，没有需要恢复的用户storage；旧5402专项稿保持读取前原字节。本次无main/push/PR/deploy。

首个独立提交d3250a87c6b701adb78edc5a4249bb04d141d362保留冻结，后续追加Application两行接线、最终按字符串变化写入和全矩阵/证据。不cherry调查在制af8141→d4a1→5afa，root将与它们合并审查；本次未修改App/controller/style/main.ts或调查布局。
