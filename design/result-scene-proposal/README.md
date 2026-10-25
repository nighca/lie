# 结果页布局原型 · 待用户确认

2026-10-25，来源 main `abb12dbf7a40689be593c2a1e580f23cfcc5611e`。用户授权具体设计，未授权应用实施、新人物素材或可选结果态契约。[完整提案](../../docs/result-scene-visual-proposal.md)区分布局、A 默认图与未来 B/C 两态方向。

以仓库根目录为静态服务器根访问 `design/result-scene-proposal/`。不能只打开 file URL，因为正确页需读取现有案件 JSON。不要为此复制新的 Web/Worker 服务。

- [审阅入口](index.html)：391 正误对照、1280 桌面画布、单页与压力入口。
- [反应方向](reactions.html)：现有默认图配未来姿态说明，不是新人物素材成品。
- [固定画布验收页](qa.html)：七个同源 iframe，不修改浏览器全局 viewport。
- [六场景测量](measurements.json)与[桌面长文测量](desktop-long-measurements.json)。
- [资源字节基线](source-assets.json)：只引用共享 UI、品牌、两张默认立绘和已有示例案，不改正式资源。

## 实际检查

IAB 自建 tab33，固定画布实际 innerWidth 为 1280 或 391（早期带 border 的 389px 观测已废弃，最终 frame 无 border；审阅入口 iframe 为 content-box）。两宽 scrollWidth 均等于 innerWidth，卡片左右留白分别 120/120 和 16/16。桌面人物舞台 300×310，手机 220×180，contain 保留已有图像全部内容；缺图舞台尺寸不变。

普通正确例保留原四段经过；手机文档高1214，长中文/长姓名压力文档高2018。桌面长文文档高1217。手机长页键盘从“重新开始一局”Tab到“返回案件列表”，滚动1174、末按钮 top737.74/bottom790.14（844高）、focus-visible且outline3px；桌面对应滚动339.5、末按钮 top747.02/bottom803.02（878高），focus-visible。不是固定底栏遮住正文，也没有内层记录框滚动。

wrong三种画布均无完整经过/顾遥真相文本，且 performance 资源列表没有案件 JSON 请求。此为静态原型边界检查，不是 session/controller 端到端安全证明；生产仍必须从 result.characterId 取实际人物。缺图 fixture 故意请求 missing-portrait.png 404，首字“来”与完整长姓名沈禾可见。

reduce 媒体覆盖下初始六场景实测为 true、CSS/WAAPI 动画数均0；桌面长文复用完全相同静态源码，未另外重复 reduce 覆盖，随后 features[] 已清除。无 RAF/定时器、麦克风、供应商和新动态资源。未验证未来播放器的隐藏恢复、迟到加载、动画失败或正式路由焦点；不以本原型代替这些实施验收。

浏览器日志保留一条无来源 URL 的 MutationObserver.observe 参数错误（首次打开对照页时）。本原型没有 MutationObserver 引用，不能据此归因或宣称全程零错误；最终 DOM、资源和键盘检查均完成。初版下划线绝对资源路径404已修正为原型相对路径并成功加载；故意缺图404保留。没有重试或绕过浏览器权限。

## 初版必要截图（错误页已由下方 v2 取代）

原生 IAB CDP 捕获，DPR2：1280×878 输出2560×1756，391×844 输出782×1688。保留原始 PNG，无改图。部分窄屏离屏裁切上边包含少量 QA 外层灰底/标题边缘，画布尺寸以实际DOM测量为准；长页底部图为键盘自动滚动后的画面，不能当作初始首屏。

| 场景 | 截图 |
| --- | --- |
| 桌面正确 | [desktop-correct](previews/desktop-correct.png) |
| 桌面错误 | [desktop-wrong](previews/desktop-wrong.png) |
| 391正确首屏 | [mobile-correct](previews/mobile-correct.png) |
| 391错误与操作 | [mobile-wrong](previews/mobile-wrong.png) |
| 391长姓名/长文首屏 | [mobile-long](previews/mobile-long.png) |
| 391长文到底及焦点 | [mobile-long-bottom](previews/mobile-long-bottom.png) |
| 391缺图/长姓名 | [mobile-fallback](previews/mobile-fallback.png) |
| 桌面长文到底及焦点 | [desktop-long-bottom](previews/desktop-long-bottom.png) |

## 服务生命周期

owner：调查/视觉 chat `01a16d5c-de69-7452-8d6a-280d15a87e9e`。独立工作树 `/Users/nighca/.codex/worktrees/result-scene-proposal/lie`、branch `codex/result-scene-proposal`、base如上；运行内容是此目录设计原型，无应用改动。

只启动一套 `python3 -m http.server 5507 --bind 127.0.0.1`，PID95633、原PTY/session12356；消费者仅本次tab33设计排版验收，停止条件为截图/测量完成。实际已关闭tab33，媒体覆盖清除，原PTY Ctrl-C退出0并显示 Keyboard interrupt received, exiting；lsof核5507无监听。没有保留服务或未知归属，没有新增端口，未动8787/8788/5355或他人tab/全局viewport。以后需要审阅时按固定5507登记并按需启动，不把此链接当常驻在线承诺。


## 用户反馈后的错误页 v2

用户表示两稿整体无大问题，建议错误页因正文少进一步调整布局。现在错误页为最大760px宽的居中单列卡片：桌面舞台260×230，短说明在姓名下方，操作在底部；手机舞台仍220×180，文案居中。正确页不变，原稿与原测量保留，不将本次布局细化解释为新素材或应用实施批准。

- [桌面错误 v2](previews/desktop-wrong-v2.png)
- [391错误 v2](previews/mobile-wrong-v2.png)
- [391缺图长姓名 v2](previews/mobile-fallback-v2.png)
- [v2 实际测量](wrong-revision-measurements.json)

1280画布卡宽760，左右260/260，卡底805.23<878；391画布左右16/16，普通卡底739.68、长姓名回退卡底771.58<844。两宽scrollWidth等于innerWidth；正确页卡宽1040/左右120、舞台310实测保持。手机普通末按钮bottom713.68<844，原生Tab到返回按钮focus-visible。三图原生PNG已保存，桌面与手机普通图实际看过；fallback由尺寸和首字DOM沿用检查，不额外宣称本轮逐图美术验收。

本轮仍只用5507，PID66158、原PTY/session2561，消费者仅自建tab34；已关tab34、原PTY Ctrl-C退出0、lsof核无监听。不动用户页面或全局viewport，无保留服务。前版日志与范围限制仍适用；本次不重复运行无变化的长文/reduce/应用测试。
