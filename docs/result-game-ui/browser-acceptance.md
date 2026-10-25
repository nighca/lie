# 正式结果页与八人资源组合验收

2026-10-25。发起者已完整审查 UI45dc、canonical激活51d、b1b3独立legacy测试修正、私有QA配置及所有子任务结果。当前组合以已审且发布main297666a69286e067d4a28135f9331ef4bd5f7726为base，未对main或线上做修改；根主协调仍是唯一integrator/发布者。完整离线340 tests/types/build121见combined-offline，原81PNG/旧四态/源40文件字节身份与生产WebP闭包见activation verify。

## 本次实际浏览器

单一原5355端口，真实Application/router/controller与正式内容，通过DEV demo=1完成真实接案/人物选择/指认/重开/改编/编辑器试玩流程；只voice为现有模拟端口，未使用麦克风或付费provider，不声称live voice验证。App为当前源代码经Vite编译，资源用本次正式build生成的immutable manifest及WebP；不把它说成已部署或对最终bundledJS的线上验收。

私有配置game-qa.vite.config.ts新增LIE_RESULT_QA_BUILT_ASSETS=1：明确选dist/public根和唯一构建manifest，原生路径/图片仍由生产hash结果决定，源码没有改preset/runtime。启动前loadConfigFromFile实际核dist根和21d97c04ac9d87fa58636a243fef27e6cf52b19537aeb83c93efe48d5d1096ff manifest；不是fake App或替代游戏规则。

- 桌面1280×900正确：空盒案最后选择陈拓，却指认顾遥，实际结果显示顾遥新无奈反应，非最后询问者；大勾/放射章/薄荷圆舞台，完整经过仍按CharacterNameText高亮。重新开始卸载并正常再次进入案件。
- 桌面错误：指认陈拓，新疑问表情/抬手，大叉/斜纹/珊瑚棱角舞台；正文只有被指认者及“本局已结束、请重新开始”，不含顾遥/完整经过/真实答案。
- 减少动态：正确时Canvas切为隐藏，实际img为本次构建/static/.../coral-bob/accused-correctly.webp，解码1254；恢复偏好不自动重播。对应terminal来自真实动画末帧。
- 官方结果quiet我要改编在最右：实测三个按钮right=817/983/1117，保留原逻辑；点击后进入真实编辑器（没有确认任何覆盖草稿对话），从真实试玩入口进入/editor/preview，正确/错误均没有“我要改编”，返回按钮为返回编辑器。
- 391×844：正确完整正文/图/按钮纵向布局、错误紧凑布局通过，html clientWidth=scrollWidth=391；正确卡宽359、标题font28px。正文完整可滚动，Tab从聚焦结果h1可达重新开始按钮（AX焦点已证）；correct-keyboard为截图API实际返回391×220，仅辅助记录，不拿它当844高完整视口证明。fullPage窄屏截图保留完整底部动作。
- 真实资源失败：只在own tab62用CDP临时阻断本机/static/*/appearances/*/animation/package.json，重开并在真实preview错指陈拓，Canvas display:none，img使用对应blue-glasses/accused-wrongly.webp，已解码1254；无真相、无改编。阻断随后urls=[]复原。无对应图/默认图/首字的更多失败组合由实际App自动回归覆盖，此轮未伪称全部手测。
- 灰阶：own tab62临时achromatopsia，错误叉/斜纹/棱角仍可识别；随后type:none恢复。结果识别不只靠颜色。
- 本次error/warn日志接口返回空数组，保存在evidence/browser-logs.json；这不否认故意阻断资源这一失败测试。构建warning仍按离线记录保留。

## 服务与清理

旧父服务PID1851在原PTY55257 Ctrl-C exit130，实际lsof5355无listener后，才从组合WT启动同5355 strict的新服务。当前owner本专项，cwd /Users/nighca/.codex/worktrees/result-reactions-combined-qa/lie，branch codex/result-reactions-combined-qa，启动源f294f5e加本次私有built-manifest配置修订，PID37202 / 原PTY40865，仅127.0.0.1:5355。命令：PATH指定Node24后，LIE_RESULT_QA_BUILT_ASSETS=1 node node_modules/vite/bin/vite.js --config design/result-reactions/game-qa.vite.config.ts。

用户统一八人页仍同URL /design/result-reactions/、tab60保留；gallery元数据/PNG艺术源与source73一致。5355保留仅供当前统一检查，不假设未来永远存活，结束这项用户检查后owner应原PTY停并核listener。私有制作tab61和真实App验收tab62已关闭；62的network block/media/vision/viewport覆盖均已复原，60的media/viewport也已复原。无新5356/5357 listener，无fs.allow扩展，不碰8787/8788。编辑器试玩测试沿官方改编流程留下此origin的空盒案草稿，没有清除浏览器草稿以免误删用户数据。

所有必要截图实际为原生JPEG，未转码/图片编辑；PNG终态/源素材仍原始PNG。证据哈希/真实尺寸在evidence/identity.json。旧样片历史PNG扩展截图保留其原始字节与历史URL，不把它们算作PNG源素材/terminal校验。

此批可交根主协调做隔离本地集成审查，不再等待逐角色用户确认；未push/部署。后续用户意见按独立修订正常追加。
