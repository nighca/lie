# 银发盘发发起者复验

2026-10-24；候选源码 tip `a96521186e45101b838e5388831036517c0112da`。未获用户视觉批准，未激活生产。

发起者已读取候选与各次修订完整差分及周边装配、原生素材和页面。独立 QA 另核来源输出/canonical/parts SHA256、实际PNG尺寸与资源预算、JSON/provenance可重建，均通过；6活动资产、13节点、11,008,218总像素。所有PNG原字节保留，本轮仅数据/验证器/记录改动。

实际 IAB 正式 AnimatedPortrait 桌面四态播放及切换通过；全身页检查四态1s/3s八个相反相位，另检查肩颈与衣领放大图。旧左肩缺口、锁骨肤色尖片、聆听衣摆斜白缝、讲话默认右手残留、右手描边和聆听左肘截断已处理，最终未见明显脱接或上述残片。原生截图 `silver-revised-live-*.jpg` 和 `silver-revised-full-extrema.jpg`。

在新选中专用tab设置391×844，实际DOM innerWidth=scrollWidth=391。四态均实际点击并阅读完整动画画幅，头/手/衣摆可见且没有页面横向溢出；证据 `silver-final-*-391.jpg`。console error/warn为空。结束已reset并关闭窄屏tab，不持有共享viewport。

发起者在clean a965211实际执行 `node --experimental-transform-types design/animation-candidates/silver-bun/check.mjs` 与 `python3 design/animation-candidates/silver-bun/audit-shoulders.py` 全PASS。较早dirty audit曾将相接裤边误算成右臂，修订明确按皮肤及8px邻近描边检查；这是有范围的source-mask检查，不能视为合成画面每个像素的证明。

限制：聆听/等待上身与头手共享接触父链，因此独立扭动较少；仍有body呼吸及其他部件微动。没有自然抬放、眨眼、网格或真实语音口型，嘴为合成时序。未在本候选另测减少动态、页面隐藏暂停或资源失败；通用组件测试不冒称本候选浏览器实测。需用户逐人判断最终形象与运动效果。
