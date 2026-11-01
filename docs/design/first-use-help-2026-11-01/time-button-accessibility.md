# 时间按钮的可访问名称

2026-11-01，总协调独立审查发现固定“怎么算时间”aria-label覆盖了可见剩余时间。按其补充要求，按钮名称改为动态“剩余询问02:00，怎么算时间”形式，同时包含剩余值与打开说明意图；没有aria-live、可见UI或计时行为变化。

修改仅App.vue的aria-label绑定与App.test.ts既有计时帮助检查：选择器改为稳定class，验证初始08:00与计时后的07:58均进入名称。本WT基线`b6582eb6873c13ddd3f7e9777f0c8dbddbe02dee`。执行时公共背景任务仅只读检查，尚无段落源码改动，不混入本次独立修复。

Node24.22.1执行`npm run test --workspace @lie/web -- App.test.ts --maxWorkers=2`，既有22项通过；无新增测试、类型/构建或浏览器重复检查。未启停服务，5544仍保留用户消费者，未stage/commit/main/push，交主代理实际review具名提交。
