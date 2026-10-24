# 调查页控制与背景回看：候选设计

一套沿已批准A结构的整体优化，等待用户确认，未改生产。推荐“询问记录”、底部右侧“我有答案了”、顶部只读“案件背景”，时间始终最左。**回看打开即结束语音/暂停计时、关闭不自动开麦是待确认提案。**

- [可点击模拟样片](index.html)
- [详细规格/规则边界与验收](../../docs/investigation-controls-proposal.md)
- 本机运行：仓库根目录 `python3 -m http.server 5344 --bind 127.0.0.1`

| 场景 | 桌面 | 窄屏 |
| --- | --- | --- |
| 未启用 | [图](screens/off-desktop.jpg) | [图](screens/off-mobile.jpg) |
| 玩家讲话（模拟幅度） | [图](screens/input-desktop.jpg) | 可在状态菜单查看 |
| 角色回答 | [图](screens/output-desktop.jpg) | [图](screens/output-mobile.jpg) |
| 询问耗尽 | [图](screens/exhausted-desktop.jpg) | [图](screens/exhausted-mobile.jpg) |
| 只读公共背景 | [图](screens/background-desktop.jpg) | [图](screens/background-mobile.jpg) |
| 打开人物选择 | [图](screens/answer-desktop.jpg) | [图](screens/answer-mobile.jpg) |

自然接案时长：[10分钟](screens/duration-600.jpg)、[5分30秒](screens/duration-330.jpg)。秒数比较按钮与顶部状态菜单都是原型控件，不作为产品文案。

`model.mjs`/`prototype.mjs`为离线假数据，不是生产controller/真实音量实现。`public-example.json`只保留公开字段，现有图片/Logo直接引用，无新物料或供应商。先前voice反馈提案为技术输入，本稿不承诺partial能力，不把模拟波形当真实收音/播放器验证。

检查命令：`node --test design/investigation-controls/model.test.mjs`、`node --check design/investigation-controls/prototype.mjs`。真实IAB验收尺寸/截图缩放边界见规格文档。
