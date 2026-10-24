# 转写节奏与左右头像微调

用户明确要求保留逐字效果但放慢，并把玩家头像放到气泡右侧。本次是同一转写组件的可逆体验修整，不变更会话/历史/语音服务。

## 阅读节奏

`packages/ui/src/presentation/transcriptReveal.ts`：帧间隔从32ms调为50ms，单段未完成回答的追赶窗口从800ms调为2400ms。保留原算法和deadline的建立位置：同一未完成回答接到流式追加时，沿原deadline追赶，不为每个块重新排队或延长窗口。超过窗口时一次追上已收到文本；浏览器调度可能带来一帧和调度误差，不把2400ms描述成真实环境严格时限。先前块已经完全显示、之后又收到文字时，仍可为这批新增内容开始新的有界显示；没有旧文字积压。

短句按每50ms至少一个字素逐步出现；40–60字比旧800ms窗口明显慢，长段仍在约2.4秒追上，避免无限排队。单条40/60字的假时钟行为测试要求800ms时未完成、最终在1800–2400ms内完成且无剩余计时器；持续23次追加的压力测试仍以原2400ms deadline收敛。原有pending→final同一行、历史/玩家即时显示、新轮补齐旧轮、字素边界、打断/停止/修正/销毁与reduced-motion回归保留。

只影响新角色回答的展示文字。玩家转写与首次挂载的历史立即显示；停止、打断、切换后历史回看和减少动态效果依旧补全。ARIA策略未改，展示中的每个字不逐字播报，完整文本仍可读取。

## 左右排布

只修改 `.lie-transcript__message--mine`：保留右对齐，改为预留右margin40px、左margin0；玩家头像left:auto/right:-40px。同为30px头像，离气泡10px；NPC保持原左侧位置与全部样式。长玩家消息维持原max-width约束，并允许无空格长串换行，不把头像挤出转写区域。获批帽檐侦探SVG、头像外圈、大小与top7px保持。

## 实际验收

独立工作树从 `fd73cdd52da09873359b1d9252b097c2bbba3549` 起，IAB独立5322隔离页面使用真实Transcript组件+应用CSS，无真实语音。桌面DOM1280和窄屏391的玩家/NPC头像均30px；玩家在右，NPC在左，各距气泡10px；长短消息与回看历史均实看，窄屏document.scrollWidth=clientWidth391；另加120字符无空格长串，转写log的scrollWidth/clientWidth同为291px，右侧头像不挤出。实际计时由本地fixture观察最终显示文本：40字2064ms，60字2322ms；不同设备可有调度差异。两次新60字分别点击打断/停止，收到的完整60字当次显示，历史回看即时恢复。

现有UI20项（含新增2组节奏检查）、web120项通过，UI与web类型检查、web构建通过。独立npm ci，不共享root依赖或修改锁文件。不增加镜像CSS快照测试。

本地截图 `/private/tmp/lie-transcript-tuning-desktop.jpg`、`/private/tmp/lie-transcript-tuning-mobile.jpg`，另有`/private/tmp/lie-transcript-tuning-long-mobile.jpg`。ignored交互fixture为 `apps/web/tmp/transcript-tuning.html`，不作为生产页面提交。原生IAB截图有75%缩放带来的黄色外沿，尺寸证据用DOM值；未CDP截图校准、未碰用户8787或麦克风。临时viewport已reset。
