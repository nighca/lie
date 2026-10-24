# 蓝衣眼镜动画生产资源接入

2026-10-24。用户在 `fdcb016583225167b358e1d70519ada75a8ff7e3` 候选上完成视觉验收，原话及验收边界保存在 `design/animation-candidates/blue-glasses/user-acceptance.md`。本次接入基于 reviewed main `925b1da3dec4ea8118e32d450181df079fd97e4b`，不重新设计素材。

## 来源与接入边界

- 正式源为 `design/character-presets/assets/blue-glasses/animation/package.json` 和其引用的6份 `parts/*.png`，均从已批准候选原字节复制。package SHA256：`1b2702529a50c58537dd3b5abccae3f1acc306da0061a7efd5f56a97cc2f8f53`。
- 仅在 `design/character-presets/manifest.json` 的 blue-glasses 条目增加 `animation: "assets/blue-glasses/animation/package.json"`，生成器输出 `/appearances/blue-glasses/animation/package.json`。生成物不提交。
- 6份1254×1254活动PNG、19节点、4态循环；画布加活动资源预算为11,007,612像素，低于严格解析器33,554,432限制。PNG压缩合计4,490,323字节。停用 waiting-arms 只留在候选来源记录，不进入正式资源。
- 制作prompt、来源/部件SHA256及历史截图保存在候选目录。本次不修改静态四态、头像、其他人物、引擎、UI、案件或provider；继续使用当前appearance目录，命名迁移另行协调。
- 浏览器通过既有通用清单/加载器自动启用动画，沿用静态四态回退和既有语音状态映射。无需新增人物ID分支或公开内容序列化字段。

## 本次代码与资源验证

使用 Node24.22.1，完成：

- 动画runtime/loader 33测试、生成器21测试、Web全量169测试通过；现有测试已覆盖资源清单及静态资源同源检查，无需修改测试。
- Web类型检查、生产构建、public和dist资源严格check通过（8人物/54资源）。
- 候选verify通过：严格v1、PNG尺寸/hash、960采样、循环闭合、互斥嘴形、接触层级、100次中断数值连续性及canonical静态四态hash。
- 逐字节核对候选→正式源→public→dist的package和6 PNG一致，正式源没有停用waiting-arms。PNG没有像素处理。

## 验证边界与后续验收

本次没有占用浏览器viewport，未做激活后的游戏内桌面/391播放、减少动态效果、隐藏恢复、资源失败或换人生命周期实测；这些游戏兼容检查由主协调或另派QA完成后再记录。候选已有用户视觉批准，不把该批准或既有fake测试当作本次游戏内检查。嘴形仍为合成时序，未接真实音素、未做自然抬放过渡；没有麦克风、真实供应商或付费模型调用。此文档不代表已合main或发布。

## Root组合review与本地接入

root从main23b396c新建隔离候选，读原九候选提交与激活完整diff/构建器/验证器/provenance/实际最终参考截图；未重放通用runtime祖先。候选顺序cfe91d3→848f31b→3ad1790→007509f→8d1ea0d→9a8a3e7→5253144→9632f96→c5becb1→fff0507。root再次逐字节核准已批准候选→canonical→public→dist package+6资源一致。Node24.22.1全仓345测试、全仓类型/构建通过，资源54项严格check通过。

root真实IAB隔离5489在首案陈拓检查：游戏内default canvas正常，模拟对话经原状态通道（无真实mic）运行；切人会关闭原对话并保留转写，切回可恢复自己的动画。实际391/scrollWidth391，底栏bottom844，canvas可显示；窄屏截图输出缩放异常，未把小图当完整细部美术复验。桌面截图可正常检查全身轮廓。用tab-scoped CDP模拟prefers-reduced-motion:reduce时canvas隐藏、静态speaking.png显示；恢复偏好后重载正常。临时阻断blue package请求时静态default.png回退，解除阻断并切回后canvas恢复、静态slot移除，console error/warn为空。已清除阻断/媒体模拟，reset viewport并关闭自建tab。未重复实测真实隐藏/恢复及最后修订四态定相位，相关loader/播放测试和专项原视觉验收分开报告。

review通过后仅本地集成，不自动push/部署/刷新8787；Logo目录的探索提案/交互预览单独提交同候选，仅本地设计页，不改变正式Logo。
