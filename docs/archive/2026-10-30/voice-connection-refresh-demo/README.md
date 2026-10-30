# 语音候场设计与最终 Demo 快照

日期：2026-10-30。来源：`codex/lie-connection-design`，原基线 `60c11f72b71ead4b8e744f2281d5dbecb796d11a` 的最终未提交设计；本次生产任务基线 `f86206611dbc0a10260fb1605d9a616b22493dc3`。完整文件清单见 [source.json](source.json)。

用户先要求文案/样式方案并强调符合既有风格，再授权可运行候场 Demo。历次探索逐步移除人物/椅子插画、气泡、步骤圆点及副句。最终批准版本只保留顺序主句、开口提示和取消；首句姓名沿用既有角色色背景下划线。最终文案为“正在请{name}过来…”、“搬个椅子…”、“TA 正在入座…”、“等 TA 坐稳…”，0/700/1400/2100ms 推进，真实就绪即退出。用户随后明确要求“提交 review & 合入吧”，授权将这版等待提示接入正式产品；不授权隐藏版本或更改语音生命周期/供应商。

## 保存范围

- [完整阶段方案/原运行记录快照](docs/voice-connection-refresh.md)。快照中的“当前”、未批准表述、旧 PID/服务端口和绝对路径只代表当时状态，以当前任务文档为准。
- [最终旧 Demo 组件](apps/web/src/connection-demo/ConnectionWaiting.vue)、[原 App slot 桥接](apps/web/src/App.vue)、控制器 fixture、入口、局部配置与测试；完整目录作为历史源码快照，不直接作为新生产入口执行。其相对 imports 保留原工作树结构，需在原基线恢复对应位置才能重放。
- [全部方案、历次 PNG/JPG、生成脚本、来源 hash 及必要 QA JSON](../../../../design/voice-connection-refresh/)。旧插画、气泡、步骤点截图均为被替代方案；尚无旧 Demo 最后一次姓名色微调的独立位图，最终源码在本快照保存，正式集成后另留实际验收截图，不补造旧运行证据。

本归档不重放旧 App 修改到新基线，也不覆盖中央 project-plan。排除根 node_modules 链接、依赖/cache、generated appearances、普通日志、凭据及用户数据；独立安装准备回执的必要结论已保存在文档，不复制运行缓存。

生产组件与当前实施/验证入口：[voice-connection-refresh.md](../../../voice-connection-refresh.md)。归档只保存历史，不代表任何旧备选获得批准。
