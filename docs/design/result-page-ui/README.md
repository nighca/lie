# 调查结果页 UI · 2026-10-30

状态：用户已确认最终成功/失败动效及成功页按钮层级，并明确要求整理提交交总协调review和合入。专项只提交，不自行main/push/deploy。owner 为本结果页专项；唯一 main integrator 为总协调 Chat 01a18baa-4fac-71f2-a81f-c39be0640fe8。

## 基线与范围

独立 worktree `/Users/nighca/.codex/worktrees/4ea5/lie`，分支 `codex/result-page-ui`，原始基线 `fd0493773e3b47ee934b2a391e8f69b49f632c58`，无新增依赖。生产改动仅 App.vue 结果区与 scoped 样式；必要测试为result-scene与editor-navigation各一处按钮语义/顺序断言；不涉及 Transcript、PageVersion、全局 CSS、controller 或 voice。

用户本 Chat 明确反馈：胜利界面情绪价值应更强；成功和失败标题下划线都去掉。

第一版：移除两种标题下划线；成功新增肯定文案、金色结果徽章与彩色点缀、暖黄色人物衬底；实际被指认角色姓名沿用 CharacterNameText。其余标题、按钮语义、完整经过、角色动画及回退保持。

用户反馈“方向还对的，可以再加些动效不？这样情绪价值会更足”。新增一次性徽章弹入650ms、标题450ms/延迟120ms、角色550ms/延迟220ms、正文500ms/延迟320ms，18片彩屑1250ms/最大延迟220ms，总庆祝约1.47秒。按钮始终可用，角色内部沿用既有动画。不增加声音、依赖或JS动画状态。全部新增动效仅在prefers-reduced-motion:no-preference启用。用户随后要求失败页也增加简单动效。失败新增错误标记轻晃550ms、角色450ms/延迟100ms、提示400ms/延迟180ms，约580ms结束；标题本身不晃、按钮始终可用，没有循环或新增答案信息。同样尊重reduce。用户在本Chat回复“可以，就这样吧，整理提交后交给总协调review和合入”，确认动效；随后确认按钮布局“可以，这样就合理了”，再次授权提交交付。失败仍为错误指认终局，不揭晓真相；phase failed 仍仅为加载错误，不在本次范围。

用户最新提出：成功后主要意图并非重玩。当前预览将成功页“返回案件列表”（编辑试玩沿用returnLabel）提升为首位主按钮，重玩降为次按钮，改编仍为quiet；失败页仍以重玩为主。事件/目标页面不变，未增加“自动下一案”机制。该具体布局已获用户确认。结果测试相应断言成功/失败主按钮与原有点击行为，12项通过，类型检查通过；success-actions.png是当前按钮布局截图。

## 可交互预览

`http://127.0.0.1:5176/docs/design/result-page-ui/`

同一真实 App + 真实 controller + 正式案件数据，直接指认进入结果，不调用 provider/mic。可选择四个案件与成功/失败；iframe 分别为1280和391宽，避免改全局 viewport。重开进入真实 intro；返回/改编仅显示预览回执。夹具禁止创建 voice connection。不是线上模型或真机验收。

`success-desktop.png` 为第一版真实 IAB 截图；`success-motion-preview.png`为正常速度重播时的真实入场截帧，`success-motion-settled.png`为动画结束截图。不是绘制稿。预览顶部“重播结果入场”通过iframe新URL重播，不修改生产游戏行为。

## 验证

- 结果场景与 controller-result 共12项测试通过。
- Web类型检查、git diff --check、正式Web build/postbuild通过（Node24.22.1）。构建首次被沙箱DNS阻断，获准后正常下载校验固定libwebp1.6.0，82张编码、无PNG保留，8预设121资源检查通过。产物assets/index-BfcW3jSu.js与index-DY1-3kcO.css位于本WT ignored dist；构建时仍为dirty身份，不当成发布版本。既有Vite扩展名与品牌underline运行时URL提示保留，非本任务新错。
- 最终Web完整测试使用Node24.22.1、--maxWorkers=2，41文件/378项全通过。首轮默认并发376/378：两项路由时序断言失败；单独复跑17/17通过，不能据此证明根因。受限并发首轮暴露编辑试玩旧按钮顺序断言，已按获批成功/失败差异同步，该测试仍验证原稿与返回路径保持。未修改生产路由或测试等待来补偿。
- 第一版 IAB 成功/失败 DOM 与桌面截图已查看。动效轮IAB控制报browser.user不可用，保留用户当前IAB不动，改用自建Chrome1910332130补验，现已关闭。
- Chrome1280/391 iframe实际成功/失败均可显示；错误指认无彩屑，真相仍隐藏。CSS动画结束彩屑opacity0；模拟reduce后徽章animation为none、标题opacity1，随后清除媒体模拟。未修改全局viewport/storage/provider。初轮iframe边框造成实际1278/389，已修为content-box并确认实际1280/391且无横向overflow。尚未完整验收手机底部滚动/所有角色/fallback；不是Safari或真机通过。
- 失败动效补验：自建Chrome1910332134（已关闭），实际1280/391宽、无横向溢出，标记wobble/角色与提示arrive均只播放1次；reduce模拟后三者均animation:none，随后清除模拟。错指仍仅显示结束与重开提示，无真相/彩屑。截图failure-motion-settled.png记录动画结束状态。12项结果测试再次通过；无JS/类型合同改动。
- 本 worktree 独立 npm ci --offline，无共享 node_modules。安装时默认 Node24.17低于仓库要求；预览服务使用用户现有 Node24.22.1。未改变锁文件。

## 服务登记

5176 启动前 lsof 无 listener；总协调已明确分配串行 turn。owner 本 Chat；WT/base 如上加本轮 dirty 改动。实际 Node PID89418，原 exec session92966，命令为 Node24.22.1运行本目录 vite.config.ts，严格绑定127.0.0.1:5176/strictPort。消费者为用户审看与本专项 IAB tab2。首轮用户确认后已从原session Ctrl-C，exit130，lsof无监听；精确ps被沙箱拒绝，未声称ps确认。用户随后要求新调整，复核5176无监听后同源恢复，现PID27393 / session12370，dirty增加按钮调整。最终用户确认后原session12370 Ctrl-C exit130；精确ps27393与lsof5176均空。没有保留服务，端口交还总协调。用户当前IAB标签未操作；旧自有IAB2因控制不可用未能确认关闭，不冒充已关闭。三次自建Chrome验收标签1910332130/2134/2138均已关闭。此前受沙箱限制的 session24459启动失败exit1，未创建监听，不沿用。

不触碰其他端口、用户 storage 或用户 tab；不自行 main/push/deploy。

## 交付总协调

用户最终确认原文：“可以，这样就合理了，整理提交后交给总协调 review 和合入吧。”此批准覆盖最终按钮层级及前面已确认视觉/动效。

原始base保持fd0493773e3b47ee934b2a391e8f69b49f632c58；无新增依赖提交。总协调告知最新reviewed main为bda3ddbf7b69f7f28ee2f112183477e617a2bbd0，不追main改写本任务，交总协调组合review。App改动只在结果区/scoped CSS，外部Transcript/PageVersion/Header没有改动。两个测试文件只同步结果按钮优先级并保留行为验证。

有序提交分为生产实现/必要测试、完整预览与设计验收附件；完整SHA随交付消息发送。专属文档与全部5张迭代截图保留，未删除已完成的前版。中央plan建议：结果页UI已获用户确认、专项交付等待review；5176已停并释放；总协调候选组合后验证、普通push。不要把专项本地提交当成main集成或已上线。

未覆盖边界：未做Safari/真机/所有角色视觉矩阵；本批没有真人语音或provider、没有生产部署。游戏错指终局不揭真相、成功完整经过、角色数可变与UGC复用合同保持。无需为本纯UI批重测真实provider。
