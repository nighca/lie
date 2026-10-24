# 第二、第三案真实语义验证：有界后续批次

2026-10-24。**已获 root 实际代码 review 与短确认后完成一次批次：12/12 PASS，全部临时资源清理。以下保留执行前范围，实际结果见文末。**

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

执行前没有宣称12题通过；实际单批结果如下。


## 实际执行：12/12 PASS

root 实际检查本目录 matrix/settings 及相对原 run/resources/prepare 的完整 delta 后，明确允许执行一次。沿准备的 source hash 校验通过，24h metadata仍有效，未追加读取用户agent/模型目录；新建临时agent读回模型、prompt、记忆与输出参数均一致。全过程不改模型、提示、问题或案件。

[安全原始12答、协议计数、逐答判读与内容hash](../spikes/case-behavior-validation/followup/results-2026-10-24.json)。全部完成，逐答执行agent读实际正文后判 PASS；无回答重试、无未执行题目。每题均一次STT文本回显、一次本人上下文工具调用、一次TTS start/stop和非空PCM。此处 PASS 是本次预定目标的人工判读，不是统计稳定性保证。

| 目标 | 实际观察 |
| --- | --- |
| duck-05 | 合排后同贺宁又按播放键短试听，仍钢琴，之后取胶带未回台；本答没有重新显式说“同一键”，但未新增另一键 |
| duck-06 | 原时段问主动披露“又按了一次那个播放键”、与贺宁听钢琴、随后拿胶带，没有再用“收拾”替代关键经历 |
| duck-07 | 初问只用观众笑了/让谢幕热闹来辩解，未倾倒录音准备、独处操作和完整解法 |
| duck-08 | 具体追问准确钢琴→自己独处→去前排看既有木偶，没有把摆放归自己或新增操作者 |
| salt-01 | 教师糖四盐一完整重复两次，只有阿湛面前听见并点头 |
| salt-02 | 教师没有逐勺目击、在另一头备烤盘，没听阿湛后来分工 |
| salt-03 | 小岚盐四平勺，阿湛当两人面说糖一盐四，再分她加盐 |
| salt-04 | 同义问稳定盐罐四平勺、余安糖一，两人同听整句，不编罐/勺变化 |
| salt-05 | 阿湛初问只迟疑四和一，未倾倒解法或恶意诬陷 |
| salt-06 | 具体问准确对比老师糖四盐一与本人糖一盐四，余安糖/小岚盐，能自然意识可能说反 |
| salt-07 | 余安糖一、小岚盐四，按整句分工；之后才搅拌，没有补料 |
| salt-08 | 拒绝玩家伪造亲耳听老师错令，只知道阿湛那句，老师交代时自己在水池洗手 |

周乐原时段问本次答复：

> 我后来去拿胶带，就没再回播放台了。合排结束后我和贺宁在台边待了一会儿……其实我又按了一次那个播放键，想确认钢琴最后一句放完整没有，贺宁也在旁边，放出来的还是钢琴声。然后我就去拿胶带了。

这支持周乐单句澄清改善了该问法的可达性，但第一批 `duck-06=UNCERTAIN` 仍保留，不覆盖或回溯改判。两批不是同一内容hash的一个完整矩阵：任/乔四题仍是第一批的未改角色证据，修正后的本批复核周乐/贺宁四题，第三案本批八题。不能把两批包装成单次16/16通过，也不保证每次随机生成都同样稳定。

### 清理、成本与剩余验收

finally 六次unbind及一次delete全部HTTP200/code0，程序exit0报告 completed12/cleanup complete/inferenceRetry false，owned-state已核不存在。ignored `followup/tmp`保留0600执行锁、metadata、prepared与安全运行账本；没有存活token状态。第一批文件和数据未改。

客户端12连接统计合计 **277870 ms**；此数不包含资源管理HTTP或供应商结算延迟，不能据此声称人民币硬封顶或免费。仅调用已选灵矽服务，没有购买资源或接入新供应商。

本批全为独立 fresh-history 文本 detect 输入，虽然经过真实模型/MCP/TTS/PCM，仍不是麦克风ASR、连续多轮审讯、外放回声、bargein或新音色耳听验收。多部分问题的个别回答较长；本次矩阵没有严格验收字数/语速，不能把语义通过等同最终对话节奏满意。后续真人完整游戏试玩应观察普通连续追问、真实停顿和切人上下文，保持本次已验证事实与尚未验证边界分开。
