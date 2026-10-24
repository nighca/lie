# 用户反馈修订复验

2026-10-24，发起者独立复验，范围为 `0843fe5` 后的 `c0b4f4b → 1d4b2b3 → fe8f313 → b2efc4e`。本轮仍为候选，等待用户美术验收，未激活 manifest 或游戏。

- 阅读完整数据/构建器/验证器差分及周边装配关系。独立 QA 核对 PNG 来源 hash、6 活动资产/19 节点、11,007,612 像素预算、JSON 重建与真实 Timeline 验证均通过。PNG 无像素改写。
- 正式采样页实际检查四态 25%/75% 相位。托腮白椭圆袖筒、上臂台阶、黑悬线、重复扣子/腰带和讲话掌下胸前白衣残片均已处理；最终 waiting/speaking 两个相反相位截图见同目录 `*-final-positive.jpg`、`*-final-negative.jpg`。
- 刷新用户同一 5351 对比页面，实际检查 default/listening/waiting/speaking 实时显示和切换。袖口与皮肤连续，头颈及手部接触处未见明显分离；身体和手臂增强微动正常播放。控制台 error/warn 为空。`blue-revised-live-waiting.jpg` / `blue-revised-live-speaking.jpg` 为原生页面截图。
- 本轮没有取得共享 viewport 的测试窗口，因此未新增391宽度复验。旧 `owner-*-391.jpg` 与 `initiator-review.md` 是首版历史证据，不能表示本次数据修订已测窄屏。没有修改预览布局、播放器或 Vue 组件。
- 没有真实语音、音素或麦克风检查；嘴形仍为合成时序。用户最终视觉判断待反馈。
