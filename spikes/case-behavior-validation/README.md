# 第二／第三案的有界真实语义检查

现阶段：root已review并放行首批有界真实执行；实际6答为5 PASS、1 UNCERTAIN，随后停止并清理，详见`results-2026-10-24.json`与`docs/case-live-validation.md`。本轮执行授权已消耗，不因看到下面命令就重复调用；后续批次需先review内容修正及新范围。只读metadata证据为`metadata-2026-10-24.json`。

## 无网络检查

```sh
LIE_DEPENDENCY_ROOT=/Users/nighca/code/nighca/lie/package.json node spikes/case-behavior-validation/prepare.mjs
node --test spikes/case-behavior-validation/offline.test.mjs
```

prepare只读现有core与两案，输出忽略tmp中的本人上下文和源hash。测试使用fake WebSocket和fake管理API，没有网络、账号、密钥或付费回答。

## Root审核后才可执行的路径

```sh
LIE_DEPENDENCY_ROOT=/Users/nighca/code/nighca/lie/package.json node --use-system-ca spikes/case-behavior-validation/run.mjs --execute-reviewed --key-file /Users/nighca/code/nighca/lie/.linx-api-key
```

需要交互式PTY人工读每答后输入PASS、FAIL或UNCERTAIN。每答先原子保存到0600 `tmp/live-results.json`，再展示问题、输出和本地判读标准；只有PASS继续。标准不发送给模型。重命名/删除attempt文件来重跑不属于本轮授权。`metadata-attempt.json`和`execution-attempt.json`的wx锁有意保留，防止意外重复查询或重复消费。

模型/提示hash与只读metadata相符、metadata不超过24小时、prepare源hash未变，脚本才允许继续；不擅自追加只读查询来刷新metadata。创建1个独立generic agent、8个不同role设备，不读取/绑定生产设备。语义问题只传自己profile，不把其他人的设定或ending交给角色。

文本detect会生成真实TTS/PCM并计实际会话用量，只丢弃音频，不是免费HTTP文本调用，也不是麦克风／ASR／连续语音验收。max_tokens160和客户端连接/流量上限都不是严格人民币费用封顶。

## 清理与失败

正常、协议失败、人工FAIL/UNCERTAIN或可处理的SIGINT/SIGTERM都会走finally，仅解绑本次生成且记录过bind attempt的MAC、删除本次create返回的agent ID。不碰原有设备。未确认的create响应不会猜ID；保留私密ledger让root核对。运行中若系统强杀/掉电，finally不能保证运行，需要root查看ledger后执行cleanup-only：

```sh
node --use-system-ca spikes/case-behavior-validation/run.mjs --cleanup-reviewed --key-file /Users/nighca/code/nighca/lie/.linx-api-key
```

cleanup-only不创建资源、不推理；清理失败保留ledger，不转成setup重跑。解绑/删agent不等于删除供应商日志或未绑定设备记录。原始问题与安全回答可在review后另行提交证据，不能把带token的owned-state、完整账号响应或API key加入Git。
