# 调查舞台人物加载占位

2026-10-25；用户明确要求调查页动画尚未加载时给简单loading。base `9e1c998ae4f44a32f0dc72e3f6fdd496ddec69f3`；WT `character-preset-migration-dawn/lie`，branch `codex/investigation-portrait-loading`。仅调查舞台启用，不扩结果页/Editor。按nighca-fe general/vue及仓库AGENTS执行。

实现为三个生产行：AnimatedPortrait在原fallback分支之后、尚未ready时渲染可选`#loading`；App调查舞台提供`role=status`静态文本“人物加载中…”；CSS将其absolute/inset0居中放在既有portrait-backdrop内。没有新状态、请求、计时、spinner或延迟阈值；不改变舞台布局分配。明确无动画、reduce/能力不可用及失败仍直接走原静态回退；首帧成功后占位消失，加载期间不先挂静态图。未传slot的Editor/结果消费者保持原样。

## 实际验证

Node24.22.1，复用现有依赖，无安装/lock变化。

| 检查 | 结果 / 耗时 |
| --- | --- |
| UI animated-portrait suite | 28/28 PASS，856ms；原21项＋新增7项 |
| Web animated-game suite | 8/8 PASS，754ms；无新增case，在两个现有调查集成case补状态文本/成功移除/静态与失败不显示占位断言 |
| UI typecheck | PASS，实际wall1.17s |
| Web typecheck | PASS，实际wall1.79s，pre生成8preset/121assets |
| CSS PostCSS解析 | PASS |
| canonical生成strict检查 | 8preset/121assets PASS |
| git diff whitespace | PASS |

目标共36项，新增7项：deferred首帧/可访问文本、加载失败、render失败、无动画、reduce、偏好能力缺失、快速换src/迟到响应/reduce运行切换/恢复后取消unmount。原单RAF、visibility、一次性结果及结果静态回退等生命周期测试同suite通过。自查未引入重复状态/取消机制，沿用既有资源所有权与fallback优先级。

## 原生边界与清理

本轮CUA只核inventory一次，仅有Chrome `type=extension`，没有IAB；本次没有设备锁定错误，不能沿用旧轮次错误。未选择其他chat的browser id、未回退Chrome、未操作用户标签。原生慢网/失败时真实舞台视觉、屏幕阅读器播报及桌面/391px尺寸未测；上述DOM测试不是浏览器视觉证明。未执行生产build或全仓测试，此小范围以两目标suite、UI/Web类型及CSS/121资源检查验证，不声称新产物验收。

没有启动服务或申请额外端口，PID/PTY/consumer均无；8787/8788/5355与其WT、用户tab/草稿、viewport、mic/provider完全未触，无清理长尾。检查生成物仅既有ignored public；canonical/artwork/包锁及中央plan/handoff未改。root后续仅docs归档不改变本批base运行身份；交付后源提交冻结，root实际review/隔离集成，不在此main/push/PR。
