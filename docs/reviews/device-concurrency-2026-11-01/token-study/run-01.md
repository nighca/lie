# token共享验证第一轮：创建响应未确认，未进入WS

2026-11-01。父owner在实际审查方法后给予一次专用资源turn：最多1新Agent、2Device、8次准备HTTP、2WS、3次清理HTTP，180秒实验／WS阶段30秒／60秒清理；0listen、0mic，不使用原固定或生产token。执行前核对方法SHA256：

- `probe.mjs`：`ceddb29c24ee037b310e86e4d7af67d5d3fadff49a149b4818ad7119617f28d1`
- `runner.mjs`：`c624a7df4fd2073df3a1a84368afdd0b68993ca084a07d577891553b68fdc44c`

shell默认Node为24.17.0；实际执行采用`docs/development.md`已登记的项目专用Node24.22.1绝对路径，加`--use-system-ca`。未安装或更改runtime、依赖、key文件或源码。执行命令是计划所列runner，仅将`node`解析为该固定24.22.1可执行文件。

## 实际结果

[脱敏原结果](result.json)记录本轮：

| 阶段 | HTTP状态／业务码 | 实际观察 |
| --- | --- | --- |
| create-agent | null／null | 17ms后进入固定错误路径，未收到可记录的HTTP响应 |
| 后续准备、Device/OTA/绑定 | 未执行 | 0Device |
| WSS | 未执行 | 0条WS、0hello、0listen、0输入音频 |
| 清理 | 未发管理清理请求 | `agentId=null`且createAttempted，保留“不确定创建”状态，未擅自列账户或重试创建 |

同步exec返回exit1，未产生运行中的PTY/session或服务；没有建立任何WS。`allSocketsClosed=true`在本轮只是空集合，`allSocketClosesNormal=false`，不能当实际close ACK。providerturn已释放，没有后台测试继续运行。

失败发生很快且无HTTP状态；既有证据不能区分本机网络／sandbox／DNS／TLS失败与服务端接受后响应丢失。探针按计划不输出或保留原始error；因此不能声称“肯定没创建Agent”，也不能宣布token或API权限无效。本轮未触及T1，**跨Device共享token仍未知**。

后续经授权做了不带凭据的DNS／公共HEAD诊断，均投影为`ENOTFOUND`；首轮exec确为默认`use_default`，但其原错误类别已丢弃，不能追溯认定同错。具体范围、证据局限与未执行的单页只读核对方案见[reconciliation-plan.md](reconciliation-plan.md)。没有因此追加provider业务请求。

## 私密state与未结清事项

只对本轮私密state做字段投影复核：文件mode0600、owner符合专项、createAttempted=true、agentId缺失、devices.length=0、cleanupComplete=false。管理key/token未写入state或结果；实际唯一Agent名称保留在ignored `tmp/p0-token-study-run01/state.json`供后续受权核对，不打印或复制进仓库。

`resourcesRemoved=false`如实保留。需要父owner授权一次最小只读核对：按此次唯一Agent名称匹配，若API无按名过滤则另定有界分页范围；只在内存匹配，不输出其他账户记录。若找到唯一且名称／owner证据匹配的资源，再仅清理该owned Agent。未获追加turn前不发此请求，不修改attempt标记、不盲重试或覆盖本轮result/state。

后续追加只读turn已执行，见[核对回执](reconciliation-run.md)：一次limit20成功响应、match0、hasMorefalse，该完整响应快照未发现此次Agent。未发DELETE；首轮原result/state标记保持原样。token测试仍未进入WS，没有因核对成功而自动重跑。

## 检查与结论边界

执行前语法、6项离线fake、无参数runner安全运行通过；真实方法的两个hash与审查值一致。fake只验证本地控制流与脱敏。真实运行只证明“首个创建请求没有获得可确认响应，后续未执行”，不证明共享token允许／禁止，更不涉及原固定本地值或生产secret。
