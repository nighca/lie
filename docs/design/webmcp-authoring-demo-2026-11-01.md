# WebMCP 整案创作 Demo · 实现与验收

2026-11-01。用户已授权：若对现有应用侵入不大，可直接基于当前代码制作 Demo；有重大架构影响则先讨论。本次仅开发版编辑器增量，无新模型/后端/云资源/部署。用户另提供 WebMCP origin-trial token，明确要求本批添加。

## 实际接入

入口：`http://127.0.0.1:5176/editor?demo=1&webmcp=1`，仅 Vite DEV 与 `webmcp=1` 同时成立才启用；普通编辑器默认流程保持。`demo=1` 使用已有 fake voice 路径，未触发任何试玩或语音。URL普通打开不等于生产WebMCP上线。

- `Editor.vue`接入一个 composable 和一个候选面板；`draft.ts`读写支持可选存储 key，默认仍为原 key。
- Demo 只读写 `lie-webmcp-demo-draft`，不读取/替换普通 `lie-editor-draft`；原案件schema、引擎、路由、网关和供应商配置未改。
- 不安装WebMCP依赖、扩展或polyfill，不改browser flags；直接使用内置浏览器提供的 `document.modelContext.registerTool` 和 AbortSignal 生命周期。
- 三个工具：`lie_authoring_guide`（规则/schema/形象），`lie_editor_state`（会话代次和是否已有内容/候选，不返回正文），`lie_submit_candidate`（整案结构与现有编辑器校验后，只暂存独立候选）。模型需使用工具发现得到的实际名称，客户端可能附加不透明后缀。
- AI候选不写localStorage；作者看全文并点击“采用这份整案”后，一次替换当前Demo稿，复用现有同步保存/失败提示。撤销只在没有后续变动时可执行。没有agent采纳、分享、投稿、预览、麦克风或语音工具。
- 编辑、撤销、清稿、退出/重新激活令旧代次永久失效；角色/答案变化沿深度同步watch覆盖。KeepAlive退出注销工具，旧回调绑定旧signal，不随重新进入复活。异步旧注册失败不能覆盖新注册状态。
- 观察到外部storage变更就阻止工具写入；采纳前比对原存储字节。它不是跨标签原子事务，不建设全局锁或云版本库。

首轮不提供整份原稿读取，因此不主张已支持“AI读取现有全文后局部修改”；作者仍可手工编辑已采纳的稿。工具内没有模型调用，生成发生在作者正在使用的ChatGPT中。直接输入给ChatGPT的内容及浏览器常规页面观察，仍沿其正常数据/权限边界。

## 自动审批拒绝与收窄

首次实现曾包含完整 `lie_read_draft`。实际内置浏览器成功调用规范工具，但完整读稿被自动审批拒绝：Demo一般授权未明确覆盖可能含私密人物设定/结局的外发。该调用未成功，未重试、分片、编码、DOM/CDP绕过或安装新权限。

随后删除完整读取工具，改为只提供无正文的版本/布尔状态；生成新案只需规范、预设和版本，不依赖旧原稿。此为减少返回信息的安全替代，未恢复被拒正文。收窄后的原生状态及候选提交调用成功。新增“先写真相”测试保证非空布尔准确，且输出严格只有版本/布尔，不回传故事。

## Origin trial token

用户提供token已加入`apps/web/index.html`的head，位于模块脚本之前。它本就是页面公开的origin-trial凭据，不作为供应商secret配置。

本地解码声明：origin `https://lie.agency:443`、feature `WebMCP`、`isSubdomain=true`、expiry `2027-03-30 08:00 Asia/Shanghai`。只核payload，不宣称已验证签名、My Registrations实际Valid Until、生产浏览器或未来trial可用性；上线后仍需在Chrome DevTools Application检查实际状态。token不匹配本地5176来源，本地成功依靠内置浏览器现有能力；不能以此证明Chrome生产trial已验收。

## 实际检查

- Node `24.22.1`，npm来自既有`~/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64`；未改全局runtime。依赖在本WT用`npm ci --offline --ignore-scripts --no-audit --no-fund`安装，lockfile无变化。首次系统Node24.17安装告警后已切到项目要求版本完成验证。
- Web typecheck通过。
- `editor-webmcp.test.ts`11项＋既有editor-page/editor-draft/editor-navigation，共4文件88项通过：暂存不写稿、采纳/撤销、原草稿隔离、未知预设/重复姓名/ID/坏引用、ABA、撤销使下一候选失效、后续人改保护、保存失败、storage冲突、KeepAlive旧回调、迟到注册失败和无正文输出。
- Web build及预设postbuild检查通过；首次因沙箱无法解析Google的固定WebP工具下载地址失败，后复制其他WT已有的固定工具/图片缓存到本WT忽略目录重跑。构建脚本复核工具SHA与图片源hash，最终为82缓存命中，无更改源素材或远端资源。既有Vite扩展名及underline.svg警告保留。
- token加入后重新build通过，产物HTML精确保留token且位于模块脚本前。生产的DEV条件为false，不会开启Demo或注册工具；打包结果仍含部分未启用的辅助模块代码，不宣称已完全移除该模块字节。
- 独立只读代码复核发现并修复测试变量、旧注册失败覆盖新ready、真相起稿的非空判断；相应回归已通过。复核者再次检查修正后未发现阻塞项，没有冒称其独立重跑了测试。

## 原生内置浏览器验收

独立IAB tab2在上述入口发现三项真实WebMCP工具，规范/预设读取成功。使用本Chat即时创作的虚构办公室午餐故事（非用户原稿、非固定回填结果）生成三人物完整候选，经原生`webmcp.fetchTools()/tools.call()`提交。

实际观察：候选返回`awaiting_author_review`、`draftChanged=false`、`saved=false`，页面展示全文；作者按钮模拟验收后，标题/背景/人物/时间进入编辑器并显示本地已保存；撤销恢复空Demo稿；用撤销前旧revision提交被拒；重新获取无正文revision再提交成功。最终留一份待审阅候选供用户体验，未替用户决定采纳。

没有独立文本API/付费模型/真实voiceagent请求，无WS/mic/分享POST/投稿。上述验证证明当前客户端工具链和本地保护流程，不证明所有ChatGPT账户/模型、外部Chrome、生产trial或作者总负担下降；故事未做真实语音或可推理性质量验收。

截图：[桌面候选](webmcp-authoring-demo-desktop.jpg)。截图只含本Chat生成的虚构故事，无用户原稿/账号内容。

## 服务台账与交接

owner：本Chat `01a19745-f36c-79b3-ad70-90c14d93b56b`，独立managed WT`/Users/nighca/.codex/worktrees/c4e9/lie`、branch`codex/webmcp-authoring-research`。原始base `35e987a7516493dcdccb8392cb8817f3b82744e4`；研究提交`80e4a2ef3912548258c55783c33a57ceb59a695d`、`0619d1ba716207e15dd837e2804629773e0faf30`保留，后续代码提交另列交接消息。

总协调明确授予5176窗口；起前核无listener。服务strict `127.0.0.1:5176`，Vite PID48877、exec session/PTY35629；启动来源为0619d1b+本批dirty，后随本WT修改HMR。命令使用Node24.22.1、`LIE_VOICE_GATEWAY_URL=http://127.0.0.1:8788`、`npm run dev --workspace @lie/web -- --port 5176 --strictPort`。consumer=本Chat内置浏览器验收＋用户体验；用户体验结束/明确释放后在原session Ctrl-C，并核精确PID/listener停止。当前为交付用户体验而保留，非无限闲置许可。初次沙箱bind失败的session26559已退出，无额外服务器。

不触碰8787/8788、5177/5198或其他Chat5544服务；不新开gateway，不读取复制secret，不关闭用户tab。中央计划和development登记由总协调批量维护。本分支不自行main/push/部署。

## 下一步边界

请用户在当前待审阅候选上体验，或在旁边ChatGPT给出新的虚构灵感并要求调用本页工具生成整案候选。采纳、后续手改、放弃、撤销均可在页面完成；刷新会丢未采纳候选，已采纳Demo稿本地保留。若要让AI理解现有全文进行改写、上线或接入其他浏览器，需另明确数据面和正式范围，不能将此Demo或token添加等同批准。
