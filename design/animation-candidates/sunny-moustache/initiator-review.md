# 阳光小胡子发起者复验

2026-10-24；候选源码 `c891485`。提交JSON SHA256 `baa81c21f615780b3a4e35d6f89c96281dd08c29d7cf29fe9abbcdbba560414c` 与实际浏览器复验时保存的hash一致。本候选已完成发起者独立复查，待用户逐人视觉验收，未激活生产。

已读取初版及修复完整差分/周边装配、原生素材/来源记录。首轮实际IAB发现右肩V缺口、腋下白缝、托腮肩角缺失与错领；修订后继续实际检查，定位并修复托腮颈部楔形空洞，未把自动测试成功当视觉通过。

最终正式AnimatedPortrait桌面四态播放和切换、定相位四态25%/75%均已实际逐图检查。托腮最后颈部修订后再次检查两极值；其余三态和数值轨道未改。头颈、肩袖、袖口、掌下、交叉臂与腰腹未见上述明显白缝/错线/残片。原生实时图sunny-final-live-*.jpg、相位图sunny-revised-{default,listening,speaking}-{positive,negative}.jpg与sunny-final-waiting-{positive,negative}.jpg。

在新选中专用tab设置391×844，实际innerWidth=scrollWidth=391，四态全部点击并逐图阅读，头/手/衣摆与舞台完整，无横向溢出；原生sunny-final-*-391.jpg。console error/warn为空。结束已reset并关闭专用tab，向总协调报告释放。

严格v1/PNG实际尺寸/source hash、960采样/循环/单头嘴/状态附件/100快速中断有限数值与即时显隐检查已实际PASS。5共享PNG、20节点、9,435,096总像素；本轮无PNG字节变更，原四态不变。check-coverage只是限定肩袖区域、中性姿势、间隔采样诊断，不能用exit0证明全身/相反极值像素覆盖；最终视觉证据仍是实际页面。

限制：托腮上胸、颈部与头手共用接触组，腰腹/裤子在body-root独立呼吸；上胸不独立扭动。无自然抬放过渡、眨眼、网格变形或真实语音口型，嘴为合成时序。未在本候选单独浏览器实测减少动态、隐藏暂停、资源失败或迟到换人；不把通用组件已有测试当本候选视觉实测。作者工具仍沿当前main的appearance命名，正式CharacterPreset迁移由总协调统一处理。

独立QA最终在clean c891485复核通过：来源hash/PNG实际元数据、严格解析/预算、JSON重建与复验JSON hash一致，所有增强tracks未改；真实verifier PASS。coverage六个同源区零缺口断言通过，两个异源参考区非零计数与文档相符，未泛称全覆盖通过。
