# 第二、第三案真实语义验证：有界后续批次

2026-10-24。**准备完成，尚未执行；须 root 审查本次补丁并短确认后才运行。**

基线 reviewed `main`：`a0c4b3ded9c1162a53c68becbf546fa9c2bd856b`。周乐 profile 只澄清“问合排后在播放台的操作、声音或离开前经过，也算具体追问；不要求玩家先猜出试听，不用未设定的收拾/准备代替”，未改变固定真相或其他角色。第一批原始6答、5 PASS + 1 UNCERTAIN 证据保持不变，不覆盖、不改判为通过。

## 本批固定范围

沿用原矩阵的 **duck-05、duck-06、duck-07、duck-08、salt-01…salt-08**，共12题，问题与判据原文不变。新 matrix 从已review原 matrix 精确筛选；不重跑已通过的任爷爷/乔姨4题。周乐直接问与原时段问各一次，是修改角色文本后预先指定的独立复核，不是运行失败后的自动重试。

12题涉及6个 case/character：duck/zhou、duck/he、salt/tao、salt/lan、salt/zhan、salt/yu。临时设备数量由矩阵唯一身份派生，不再把8设备/16题写死。一个全新通用 agent，加六个独立随机测试设备；不使用用户的线上或8787设备，不修改全局服务或其他 agent。

每题新连接，仅带本题 user 的 fresh history，周乐两种问法之间不传前答；其他本人profile和公共背景由现有 core 投影。其他人物profile、ending、矩阵与判据不传供应商。模型、generic prompt、Memory_nomem/history0、default voice 与第一批保持一致；模型 `f3626c105383d71654a57f2bb8a973f3`，对应当日已核 deepseek-v4-flash，不更换模型或提示来换结果。

## 执行与安全边界

- 独立实现目录 `spikes/case-behavior-validation/followup/`，独立 ignored `followup/tmp/` 的0600执行锁、owner state、metadata、prepared上下文/hash与结果。第一批脚本、状态、结果均不改写。
- 复用当日24h内的只读metadata；不额外GET用户agent详情或模型目录。运行前仍检查metadata时效、源码prompt hash、模型ID等；不匹配就停止。临时agent创建后的配置读回只核本次新资源。
- 1次创建、1次配置/1次读回；6设备各至多2 OTA/1 bind；最多12顺序目标回答。六角色身份与设备数由matrix derive；单次执行锁阻止误重跑。
- 复用原已review `collectAnswer`：实际socket固定 `wss://xrobo-io.qiniuapi.com/v1/ws/`；OTA metadata允许官方host的ws/wss及既定path，但拒绝其他port、query、hash、userinfo，不降级实际连接。
- 每答45s上限、10s握手、1s关闭强制终止；音频4MB/4000帧、JSON64KiB、输出8192B、最多3上下文工具调用等原边界不变。最多12答不等于精确底层模型请求数或人民币硬封顶。
- 每答先保存安全原始正文与协议计数，再由执行agent读实际问答判PASS/FAIL/UNCERTAIN。只有PASS继续；首FAIL、UNCERTAIN或协议异常立即停止剩余并finally清理。无自动重试、无临时改问题或profile、无前答注入；不要求用户逐答判定。
- finally仅解绑本批6个已记录自有设备，删除创建响应所得自有agent。模糊创建保留owner state供查证、不猜ID；清理失败保留状态，不能覆盖后重建。管理key原文件读入内存，不写日志/参数/结果，不拷token。

本批通过 `listen.detect` 输入文本，会调用真实模型/MCP/TTS并返回PCM；不采麦克风、不播放/保存PCM。**不是免费纯文本接口，不是ASR、真人多轮语音或新音色验收。** 费用只能证实操作/连接上限，不能保证严格现金预算。

## 离线结果与最小变化

新增matrix/settings、followup自己的prepare/run/resources与7项离线测试；原答复collector直接import，原base脚本保持immutable。run与prepare仅调整层级路径和batch-derived上限；resources只换本批owner prefix并将设备数量按唯一身份derive，沿用已review OTA白名单及finally安全逻辑。

- 离线prepare：12 targets / 2 games，其他profile和ending排除，按最新内容重新hash。
- 原24项安全测试 + 本批7项：**31通过**。本批覆盖精确题目/无任乔、6唯一设备、6解绑+自有agent删除、判读失败只执行一次、bind失败清理唯一尝试设备、拒绝非官方OTA、新鲜独立history。
- run/resources语法检查通过。准备阶段供应商调用0，资源创建0，旧结果无变化。

审核后唯一执行命令（本机现有依赖路径；key内容不在参数）：

```sh
LIE_DEPENDENCY_ROOT=/private/tmp/lie-integrate-text-architecture/package.json node spikes/case-behavior-validation/followup/run.mjs \
  --execute-reviewed --key-file /Users/nighca/code/nighca/lie/.linx-api-key
```

离线检查：

```sh
LIE_DEPENDENCY_ROOT=/path/to/installed/package.json node spikes/case-behavior-validation/followup/prepare.mjs
node --test spikes/case-behavior-validation/offline.test.mjs spikes/case-behavior-validation/followup/offline.test.mjs
```

真实执行后另追加安全原始回答、逐答理由、未执行题目、实际清理响应与局限。不在执行前宣称12题通过。
