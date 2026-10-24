# 阳光小胡子动画正式资源接入

2026-10-24。用户明确确认“阳光小胡子验收没问题”，批准对象是候选源码 `c8914851ac57ee95d4f367ca7871f635f2d6f626`、发起者复验 `68c2f7b4927f17b71e44cc02fda354a5682e737f`；记录见 `design/animation-candidates/sunny-moustache/user-acceptance.md`。本次从 reviewed main `78c7530ca5254ffe1391c25a95a2fb69084c577a` 准备接入，经本轮总协调review与组合验证后本地集成，未push/发布。

## 接入范围

- 原始候选来自 `62b3846eecce8e902cd8bfe1764c87a337551e4b`，顺序为 `4e59d7d4f16ff3c02ae8f8642b0a8b213ae1014d` → `c8914851ac57ee95d4f367ca7871f635f2d6f626` → `68c2f7b4927f17b71e44cc02fda354a5682e737f` → `dcf759331af83e97cdb7f06a3108f6d74acb8859`，均只含本角色候选与来源/验收记录。
- 把已批准的 package 和其引用的五份 PNG 原字节复制至 `design/character-presets/assets/sunny-moustache/animation/`；仅给 manifest 的 sunny-moustache 条目增加 `animation: "assets/sunny-moustache/animation/package.json"`。
- package SHA256：`baa81c21f615780b3a4e35d6f89c96281dd08c29d7cf29fe9abbcdbba560414c`。五份1254×1254 PNG、20节点、4态循环，画布加全部活动PNG为9,435,096像素，低于严格解析器33,554,432上限；PNG压缩总量4,303,793字节。
- 生成器输出 `/appearances/sunny-moustache/animation/package.json`，生成物不提交。没有改动静态五图、其他人物、UI、runtime、案件、供应商、引擎或命名；沿用既有通用动画加载和静态回退。

## 本次验证

使用 Node24.22.1 的锁定依赖，完成候选 verify、JSON重建、生成器21测试、动画runtime/loader33测试、UI35测试、Web169测试、全仓类型检查和完整生产构建。public及dist严格资源检查通过（8人物/60资源）。既有通用测试覆盖加载失败、静态回退、减少动态效果、卸载及状态映射；这些是自动化替身结果，不代表本角色浏览器实测。

候选 verifier 实际通过：严格v1/PNG签名尺寸和hash/四态canonical源hash、960采样、四循环闭合、唯一头嘴与状态附件、接触组配准、100次未完成settle中断的连续有限数值。重建JSON后与批准版本无差异。另逐字节比较候选→正式源→public→dist的package和五PNG，全部一致；public静态avatar/default/listening/waiting/speaking与原canonical五图一致。

只读 `check-coverage.py` 重新运行与历史报告一致：六个同源肩袖区域零缺口断言通过；listening右侧仍有324个alpha/2047个黑描边参考点未匹配，speaking左侧仍有14个alpha参考点未匹配。这是neutral pose、2px网格、局部选区的异源参照诊断，未计算世界变换/运动极值/最终叠色，不记为全coverage PASS。批准对象的原实际视觉复验另见 `initiator-review.md` 及原生截图。

## 浏览器验收交接

本次尝试创建独立 Codex IAB tab，实际返回 `Browser is not available: iab`，已向总协调报告。未改用Chrome，未占viewport；以下游戏内检查尚未完成，不能把原候选视觉批准或自动测试写成本次已通过。

独立预览：`http://127.0.0.1:5501/?game=empty-medal-box&demo=1`，首人沈越使用本角色。demo明确不使用麦克风或供应商。定相位检查页位于同一服务的 `/@fs/Users/nighca/.codex/worktrees/sunny-moustache-activation/lie/design/animation-candidates/sunny-moustache/qa.html`；它是已有候选工具，不进入产品入口。

待可用IAB专项执行：

- 桌面与实际391px宽：四态播放、无水平溢出、全身/双手完整；25%/75%相反极值检查肩腋、颈部、掌下与腰腹。
- 游戏内换人卸载与切回，确认没有残留canvas/迟到姿态；模拟会话结束回default。
- tab范围模拟减少动态效果，确认动画隐藏且当前状态静态图显示，恢复偏好后正常加载。
- 临时阻断本角色package，确认静态回退；解除并换人切回后动画恢复；清除全部阻断。
- 页面隐藏/恢复时暂停与继续，无异常加速；检查console error/warn并记录，结束reset viewport并关闭自建tab。

本次没有访问麦克风、真实供应商或付费模型。嘴为合成开闭时序，没有音素同步、自然抬放transition、眨眼或网格变形；状态专用附件立即切换，数值由既有240ms settle衔接。等待上胸/头手同接触组，腰腹独立呼吸，不声称全关节独立活动。


## 总协调组合review与独立IAB回验

root实际读取候选装配/verify/coverage/provenance/生成记录/批准、正式manifest及接入差异，检查原生torso、等待/聆听极值及391游戏截图。当前main `c845f22`上的五提交候选末尾 `d91b9ab71fffa0220979327c2ba26951de57eab9` 独立全仓369测试（Web176/voice34）、类型和Web/gateway构建通过，8人物/60资源通过；tmp重建与批准包逐字节相同，六文件候选/正式/public/dist相同、原静态五图不变。原源提交顺序见上文，未混入未批准银发。

调查专项在独立5501实际IAB回验：1280×720无横溢、单canvas；实际391×844/DPR1（innerWidth=scrollWidth=391，底栏844）；四态25%/75%八张完整canvas图无明显背景洞、缺手、颈腰分离，聆听腋下保留已批准的层叠纹理，不作全像素coverage保证。减弱动态和阻断sunny包均回静态，恢复偏好/解除阻断并换人切回后恢复单canvas；demo结束回default，console warn/error空。源码未变，所有block/cache/media/device override已清，自建tabs关闭、viewport reset。原生证据和报告在 `/private/tmp/lie-sunny-qa/`，截图扩展名可能为png但原生内容是JPEG。

明确限制：1280×720短桌面舞台裁到腰部、双手下端不可见，属于既有130% canvas/低高舞台布局，不能称该视口全身完整；完整canvas极值和391图双手完整。真实页面隐藏/恢复未验证，IAB后台tab仍visibilityState=visible、协议不支持visibility override，未造假hidden或记PASS；共享runtime单测与真实生命周期证据分开。无真人麦克风/供应商/口型同步验收。
