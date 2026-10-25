# 结果页 A 方案 · 实际应用验收

2026-10-25；基线 `30385c296eafe68b0403706f6ac63a37ce96487b`，独立 WT `result-scene-implementation/lie`。不是设计静态原型截图：同源六个 iframe 实际运行 Application、GameController 与真实内容加载，所有 URL 均 demo=1，未开启任何语音，未访问 mic/provider。没有修改用户草稿/localStorage。

| 原生截图 | 场景 |
| --- | --- |
| [desktop-correct](desktop-correct.png) | 1280×878，最后选沈禾、指认顾遥，实际人顾遥与四段经过 |
| [desktop-wrong](desktop-wrong.png) | 1280×878，最后选顾遥、指认沈禾，紧凑错误卡；无真相 |
| [mobile-correct](mobile-correct.png) | 391×844，正确页首屏/正常整页滚动 |
| [mobile-wrong](mobile-wrong.png) | 391×844，错误页与原两个操作 |
| [mobile-fallback](mobile-fallback.png) | 391×844，分享案件 appearanceId=null，长姓名与首字“摄” |
| [mobile-long-bottom](mobile-long-bottom.png) | 分享长文页面到底，原生 Tab 到返回按钮的 focus-visible |
| [broken-portrait](broken-portrait.png) | 独立实际 App 阻断 coral 默认 PNG 后，“顾”与顾遥姓名回退 |

固定 iframe 实际 innerWidth=1280/391（不是缩放模拟图），scrollWidth 相等，左右留白正确页120/120、错误页260/260、窄屏16/16。普通正确页四段原文，长文两额外段落共六段，文档高3218；错误页只有短说明，不含顾遥或完整经过文本。数据见[全场景测量](measurements.json)。此前已选人物不会冒充结果人物，wrong仍终局。

自编测试由官方样例在内存复制，保留三人，名称改“摄影社特别来宾顾遥的长姓名测试”；在真相后加“这是临时长中文排版压力样例。”60次与“末段保留完整内容。”40次。fallback 版本三个 appearanceId 都为 null。标准 gzip/base64url 分享片段交真实 /play 解码，不改内容文件、catalog 或正式资源。临时 HTML 壳已经删除，dist 未含该壳；它不是第四个官方案件。

实际键盘指认后，当前活动 frame 的 h1 自动获得焦点；直接 Tab 到主操作，再 Tab 到返回，长页滚动2374、返回按钮bottom774.04<844且focus-visible。见[长页测量](long-bottom.json)。其他 frame 失去活动焦点后的 BODY 观测不当作各次入页焦点失败或成功证明。独立图失败场景 h1Focused=true，见[失败测量](broken-portrait.json)。

原生 Enter 走完整指认流程；最初 iframe 中一次指认入口的 locator click 没有生效，观察到 dialog.open=false 后换用原生键盘完成，不重复盲点，不把这次坐标点击记为通过。测试覆盖点击事件及 restart/returnLabel。实际分享案件返回首页后 path=/、hash清空、result-card=0；错误后重开经intro再次正确指认显示顾遥，没有沈禾残留。

结果页使用默认静态PNG，无结果canvas。reduce媒体覆盖下五个仍处结果态的 frame 均matches=true、getAnimations=0、结果canvas=0；之后features[]清除。独立缺图 tab36 仅阻断一张默认PNG并禁缓存，回退后已clear blocked URLs、restore cacheDisabled=false，再关tab。未制作或验证任何新两态动作，不验证未来播放器生命周期，不冒充真人语音。

日志仍出现一条初始加载时无来源URL的 MutationObserver.observe 参数错误，和设计原型时同类；本次改动没有该API，未归因或宣称零浏览器错误。所有上述DOM/资源/键盘检查完成，故意阻断的图失败不当作正常资源加载通过。没有保存原始日志/请求头/个人草稿。

截图为 IAB 原生PNG、DPR2，七图已查看，无图像编辑。部分离屏 clip 顶部包含外层 QA 标题/灰底；手机正确首屏不表示全文只有一屏，long-bottom为滚动后，broken为1280×720实际页面完整872px高捕获。最终源字节见[source-identity](source-identity.json)。

服务owner为调查chat `01a16d5c-de69-7452-8d6a-280d15a87e9e`，唯一Vite端口5507，PID44546、原PTY/session30600，cwd为本WT，base如上加本批工作字节。消费者只有自建tab35/36，条件为本批QA完成即停。两tab已关，网络/媒体覆盖已清，原PTY Ctrl-C退出1、lsof5507无LISTEN；没有保留/未知服务，未触8787/8788/5355/5544、他人tab或全局viewport。Node24.22.1/npm11离线安装锁定依赖，无新增依赖；未批准workerd安装脚本，本批不需要网关。
