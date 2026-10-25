# 正式结果页 R 方向接入

日期：2026-10-25。状态：离线实现与自动验证完成，等待发起者实际源审查、正式素材组合和浏览器验收；未合入 main，未发布。

## 来源与范围

- 工作树：`/Users/nighca/.codex/worktrees/result-reactions-game-ui/lie`
- 分支：`codex/result-reactions-game-ui`
- 原始/唯一依赖 base：`462d8a4ddebe1df3703caace2f2db2aa5c8eeb89`（主协调已审 main）。结果契约已在该 base 内，不另 replay 契约或设计依赖。
- 批准依据：[R 方向](../result-outcome-design/approval.md)、[珊瑚加强样片与后七位授权](../result-outcome-design/coral-review.md)。旧 scene 原型仅作视觉依据，不覆盖最新改编入口决策。
- 仅改 App 结果区域、结果专属全局 CSS、已有实际 App 动画回归文件以及本记录。没有正式 preset/素材激活、runtime/parser/load/generator/lockfile、Editor、游戏事实投影、调查布局、height、loading、provider 或中央 project-plan 修改。

## 行为

正确结果有大勾、放射状章、薄荷标题区、圆润开放舞台；错误结果有大叉、斜纹、珊瑚标题区、倾斜棱角舞台。图形与纹理静止可辨，不依赖颜色或角色资源。

真实 `GameView.result.characterId` 选择被指认者，其 `correct` 选择 `accusedCorrectly` / `accusedWrongly`，沿现有 `AnimatedPortrait` 的单次末帧保持、reduce 与缺态行为。结果阶段实际挂载，重开离开阶段卸载；使用 contain 构图。静态回退按可选对应结果图 → 默认图 → 姓名首字；不硬编码生产图片 URL/扩展名，不用 speaking/default 动画代替结果动画。

完整经过仍使用 CharacterNameText，错误仅显示被指认者及本局已结束提示。保留重新开始/返回和 quiet 最右“我要改编”，preview 的 allowRemix 隐藏/父 handler guard 与弹窗实现均未改。

## 验证

Node 24.22.1；按 lock 离线 npm ci，未改依赖文件。

- 首轮目标回归：result-scene / animated-game / App / editor-navigation 共 57 tests passed。
- Web 全套 35 files / 335 tests passed。
- Web vue-tsc passed。
- Web build passed，99 modules；正式旧八人 89 assets generate/check 均通过。Vite 仍报告 underline.svg build-time URL 未解析并保留 runtime URL；对应 hash 文件实际 emitted，未把该 warning 当新结果素材验证。
- 简化最终 wrong 静态测试 fixture 后，animated-game 8 tests rerun passed。生产代码未再变化。
- git diff --check passed。

新增实际 App 回归覆盖两种结果选择真实被指认者（不同于最后询问者）、传入正确结果状态/contain、支持包可渲染、重开卸载、旧四态包/加载失败/无动画时对应静态、图片逐级失败到首字和错误结果正文不泄露真相。减动态/不重播边界继续由既有 AnimatedPortrait 组件测试负责，不重复镜像实现。

## 服务与待办

本任务没有启动/停止任何服务、没有创建浏览器 tab、没有占用/修改任何端口或 viewport。父 5355 和图片 5356/5357 均未操作。无 PID/PTY 要交接。自动测试与 build 不代表浏览器视觉验收。

发起者应先 review 本提交完整 diff，再将结果资源与 UI 组合到其专项候选；在明确的既有 5355 QA 窗口完成真实 App 桌面/391、静态/reduce/失败回退、长正文、键盘/滚动、改编位置与 preview 按钮检查并保存证据。正式素材激活仍由父任务协调，不属于本批。

旧源设计/方案及其证据未改写或删除。git tracked handoff 不含临时日志、认证信息或个人数据；生成的 node_modules/public/dist 均为既有 ignored 工作产物，不进入提交。
