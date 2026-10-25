# 语音连接交互组合验收

2026-10-25，执行owner `/root/character_preset_migration`。root借用候选 `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`，分支 `codex/integrate-voice-connection-interaction`，冻结应用HEAD `fa4f02c35cb3de2cc405ee07611b8a4c76ab5d60`，开始时clean。集成基线main `2f064238be5eb4e0574932fe272c8935489b18de`，已review源序列 `fc635b56` → `dba2d641` 在候选有序cherry为 `b0025ee` → `fa4f02c`。本轮只提交本报告，不改应用实现、中央页或main，不push/部署。

## 身份与复用范围

- 沿用候选真实本地node_modules，根目录不是symlink，六个@lie工作区链接均解析到候选自己的apps/packages；223条安装锁记录的version/integrity/resolved/link逐项与根lock一致。本轮不安装或变更依赖，Node **24.22.1**。
- [source-hashes.json](../../../design/voice-connection-interaction/source-hashes.json)七个SHA256全部与候选文件相等，包括App/style/controller/voice及三份新增测试。整个7249→dba2d641增量20路径的Git blob对象也全部与候选相等，涵盖原生图、fixture及实施文档。
- 相对source的唯一实质组合差异是main36a龙三叔声线manifest/presetVoices测试（另有文档）；候选canonical manifest与presetVoices测试均与36a06de对应Git blob完全相同。没有用source测试结果代替本组合Web运行。
- root已实际完整review生产diff/controller周边、三新tests、两docs、fixture/JSON及桌面/手机native图；本轮补充组合运行及产物核验，不声称独立重做该源码review。

## 本轮实际检查

按顺序执行，全部退出0，无失败重跑：

| 检查 | 结果 |
| --- | --- |
| `npm run test --workspace @lie/web` | **31套266项通过**，包含presetVoices、准备期收音边界和切人状态隔离 |
| `npm run typecheck --workspace @lie/web` | 通过 |
| `npm run build --workspace @lie/web` | 通过，产物入口 `dist/assets/index-Bnc9YmzX.js` |
| postbuild strict | **8预设89资源通过** |
| fixture源入口隔离 | `apps/web/__voice_connection_qa.html` 与 `.ts` 均不存在 |
| 产物QA隔离 | dist无qa-entry或__voice_connection_qa文件，HTML/JS/CSS/TS无 `__voice_connection_qa`、`QA connection failure`、`模拟收音就绪`、`旧连接不应串入`、`qa-controls` 标记 |

设计目录下的可重放fixture属于归档证据，未复制到应用入口或生产包。类型与生成的资源只写忽略产物；完成检查时HEAD仍fa4f02c、tracked diff为空。

## 声线与生产manifest

实际调用候选fingerprintAssets重新计算计划，逐字节断言生产hashed manifest等于plan对应输出；其URL摘要等于文件SHA256。canonical、生成fixed、生产hashed三份manifest的全部8个id→voiceId映射逐项相等；fixed public/dist manifest也逐字节相等。

| 项目 | 值 |
| --- | --- |
| 生产manifest | `/static/4c0b4d28c65deab8a4ca7225a4cb1a1d1d88696c79b74ee20625d36afbd5781d/appearances/manifest.json` |
| 生产manifest SHA256 | `4c0b4d28c65deab8a4ca7225a4cb1a1d1d88696c79b74ee20625d36afbd5781d` |
| fixed manifest SHA256 | `3650cf01b7fdc69068b8e289e5b52e0c76d48d8f119bdefe709533f0197ecbb1` |
| salt-pepper-beard / sunny-moustache voiceId | 两者均为用户接受的龙三叔 `2e7965636b0d4472ae51e75f419dff41` |
| hash输出 | 92项派生资源，8预设 |

这证明组合产物保留获准声线及正确hash引用，不是新声音真人试听、provider成功或线上部署证明。

## 原生QA与服务边界

本轮**不启动服务/浏览器、不打开mic、不发真实provider请求**，无PID/PTY/port/override需要清理。复用[owner原生QA](../../../design/voice-connection-interaction/README.md)及[实施记录](../../voice-connection-interaction.md)的证据范围：App/controller/voice的7哈希和完整交付路径同源，IAB1280×878/391×844的连接准备、取消、快切、成功、失败与背景停止证据仍有效；其中离线替身不等真人硬件/服务。source末尾一次无URL MutationObserver错误来源未定，不能因本轮测试绿而改成console零错误。本轮没有冒称该组合进行了新的原生浏览器验收。

原owner5507回合：调查chat01a16d5c-de69-7452-8d6a-280d15a87e9e，background-character-names/lie上的codex/voice-connection-interaction，PID50346、原PTY39627，消费者IAB39；原PTY Ctrl-C exit1、lsof无监听、tab39及临时HTML/TS已清，未留下viewport/network/cache/media覆盖。此为已root review的owner回执，本轮未重复扫描或操作。用户8787/8788、5355、5544/5507及其他tab/服务未触碰。

## 交回与协调补记

语音实施现为**候选组合验证通过，待root审核本报告并快进main**；不要在root ff之前称已main/部署。只新增并提交本报告，用户暂停四小时换chat的决定及原root active/唯一integrator保持。

root最新明确已向原动画chat01a16d44-aeea-7552-b184-5118072e75f3发出独立PR候选准备turn：fresh fetch远程基线、仅动画23链＋可选9aa技术报告、独立WT与有界checks，a432源对象可恢复。用户视觉已验不重复视觉；这是准备turn，**暂不push、不开PR、不改main**，仍需root审新候选/范围后另给发布turn，不升级为最终集成通过。本验收者没有执行动画操作或远程fetch。
