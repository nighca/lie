# 原固定本地token：单新Device有界方法

2026-11-01；父owner及独立reviewer后续实际审查后，总协调已授一次具体turn，[真实回执](original-fixed-run-01.md)原本地固定token配新Device通过，正常关闭并解绑，session已退出/turn释放。下文保留原评审计划，不是重跑许可；未改既有方法或产品源码。

来源scope只允许probe进程从`/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars`逐行按键解析`LINX_WS_TOKEN`、`LINX_AGENT_ID`；其他行直接丢弃，不解析或使用`LINX_DEVICE_ID`或其他变量。不输出、复制、hash、写回token/config，不读取生产secret作同一性比对。管理key仅使用既有批准路径，实际读取仍等新turn。

## 为什么本轮必须多1次GET

原Agent配置不改，当前问候状态没有本轮必要白名单回执，因此**必须先GET原Agent，只投影`extra.disable_greeting`**。明确true才继续；false、缺失、无法解析或业务失败都停止，连新Device初始OTA也不发，不擅自关闭原Agent问候或影响现有8787/8788、5544消费者。即使该标志为true，provider仍可能异常主动发声；探针发现TTS/音频就停止并关闭，不承诺provider绝无计费用量。

## 单轮预算（proposal，待review后给turn）

- 0新Agent、最多1新专用Device；不连接原Device、不更改原Agent配置，不启动服务或触碰消费者。
- 最多**4次HTTP**：1次原Agent必要GET、1次新Device首次OTA取激活码、1次绑定到目标Agent、1次只解绑本轮Device。最多1条WSS。没有取新Device token、fallback、retry、Agent创建/修改/删除或全账户列表。
- 总实验90秒、WS阶段20秒、清理另30秒；单HTTP15秒，WS握手＋hello10秒，成功hello后静默保持3秒。所有阶段共用硬上限；失败即停后续操作并清理。
- 0listen、0mic、0输入音频、无问答。固定官方WSS、原固定token、来自同一批准配置的目标Agent、新Device/Client身份。不得用newT1替代原固定值。

## 顺序及收尾

入口要求显式配置路径、来源授权标记和本次执行turn；路径必须等于上述白名单，无默认来源。未给turn先拒绝，不能在导入时读取secret。实际runner为`original-fixed-runner.mjs`，仅直接执行且唯一flag`--execute-original-fixed-approved`才运行；导入/无flag无执行IO。独立私密state为ignored `tmp/p0-original-fixed-run01/state.json`，结果`result-original-fixed-01.json`，wx拒覆盖；Node24.22.1/systemCA/require_escalated。具体命令及hash已随[实际回执](original-fixed-run-01.md)保全，不能凭flag自行重跑。

先创建专用0700目录与0600私密state；在进程内读取两字段与管理key，state只保存必要目标Agent和owned Device/attempt标记，不存token。原Agent GET只读回问候标志，明确禁问候后才生成并落地新Device。OTA、绑定前各原子落attempt，确认业务成功后才推进。OTA若意外返回已有token就停以核所有权，不复用碰撞身份。

绑定完成后以原token连接新Device，收到PCM hello和非空session并保持3秒仍OPEN为本样本接受；不保存session ID，token仅允许iat/exp安全标量投影且未验签。正常主动close1000并观察CLOSED后，才解绑本轮Device；超时本地terminate要另记，不能当正常close通过，也不把解绑当终止ACK。

绑定响应不确定、意外已有设备或清理失败，保留原子私密所有权state；不得丢弃后换新Device重试。原Agent、原Device以及本地配置始终不变。公开仅白名单配置／阶段时序／HTTP和业务码／固定网络异常分类／关闭状态／布尔结论，不输出秘密、完整ID、响应正文或其他配置。

静默也可能消耗UID时长。1WS保守20秒实验加30秒极端清理约50设备秒乘当前倍率；这不是账单封顶，管理API费用与provider内部终止计时未核。成功只证明这份**本地**原固定token与该目标Agent/新Device在当时可用，不证明线上secret同一、跨Agentscope或长期期限/刷新。只读来源scope不等于新资源执行授权。
