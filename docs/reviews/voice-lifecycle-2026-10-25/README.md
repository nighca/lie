# Controller / voice lifecycle review

2026-10-25，独立只读审查固定已审main **`600fb4dd5d60e7370cb1f6315c9c8628b7df0c99`**。WT `/Users/nighca/.codex/worktrees/split-ci-cd-workflows/lie`、branch `codex/voice-lifecycle-review-20261025`；旧CI及发布审查refs保持冻结。**本轮没有证实新的bug或架构阻塞**；这不代表穷尽所有事件排列，也不替代设备/真实provider验收。

## 实际审查范围

全文读取 [controller](../../../apps/web/src/application/controller.ts)、[liveVoice](../../../apps/web/src/application/liveVoice.ts)、[channel](../../../packages/voice/src/channel.ts)、[microphone](../../../packages/voice/src/microphone.ts)、[player](../../../packages/voice/src/player.ts)与PCM编码/解码；核对voice接口、game-core quota/history/session、Application的discard/attach与pagehide/pageshow恢复、navigation/page lifecycle以及gateway relaySockets。查看现有controller/liveVoice/channel/microphone测试的相关上下文，不重跑全工程或构建。

- controller当前性同时约束epoch/session/character/abort；stop先结算ready后时间并flush pending text，再使旧scope失效、abort/close。切人保留A历史和已用额度，B准备期间不计时。loadEpoch隔离旧load，dispose使等待中的open与load失效。
- live bridge的current/closed门禁覆盖迟到channel、音量及mic回调；close幂等，晚到microphone会stop，不因channel已ready就提前开启捕获/计费。answer drain与interrupted分工保留分段转写；context工具仅读取当前人物历史。
- channel ready等待hello＋tools/list；握手timeout/abort清timer、工具AbortController和socket callbacks；close/error重复通知不跨入新scope。PCM player停播放/移除sources，microphone在权限返回后检查abort并清理stream/context/worklet。上述低层设备代码为源码/既有测试审查，本轮不把fake bridge当原生Audio API实测。
- gateway每对连接独立closure、终止幂等并清timer；既有180秒transport watchdog为现存边界，本轮不把它自行认定为产品bug或改动。Application实际使用navigation lifecycle，pagehide丢弃controller、persisted pageshow重载；没有把旧独立pageLifecycle helper误当生产挂接路径。

没有重复已修context frame/RSM01/RSM02、结果UI审美或正式激活验收。未发现需要删除重构或新增耦合层的依据；未改任何生产/已有测试/central docs。

## 新的有限组合验证

[原探针](probe.test.ts)通过实际controller＋live bridge＋channel及game-core运行；仅socket/status、设备/播放器和时钟为fake。[配置](vitest.config.mts)独立于CI应用套件；[结果](results.json) **4/4 PASS**，Node24.22.1 / Vitest5.0.5：

1. A已ready并有转写后切B；保留的A message/close回调迟到无污染。B准备500ms不计费，A300ms+B200ms后剩余1500/2000ms；回A仍保留partial且interrupted，两个设备/context各清理一次。
2. 400ms后断线；已产生user/partial转写不丢、剩余1600ms不复位。重连的实际MCP context回复仅含该人物历史，再用1600ms进入最终指认，结束后timer为0。
3. transport已ready但mic permission未返回时dispose；socket/context各close一次，迟到mic仅stop一次，不进入capture/计费，timer为0。
4. handshake始终未ready，10000ms超时走error；全部已建资源各清理一次，剩余额度仍2000ms，无历史及残留timer。

复跑（仓库root、同lock现有依赖，无安装）：

```sh
node node_modules/vitest/vitest.mjs run --config docs/reviews/voice-lifecycle-2026-10-25/vitest.config.mts
```

先执行前三个组合用例3/3通过，增加握手超时场景后的最终批4/4通过；没有改生产迎合探针。此次不连真实provider、不使用麦克风/AudioContext原生实现、不启动listener/browser，不扫描/停止5355或8787/8788。fake验证不了浏览器权限UI、真实getUserMedia取消时机、声卡驱动异常、网络/平台调度或provider帧顺序；这里未提出没有真实可达证据的假想缺陷。所有必要探针/结果均已入库候选，root实际review后再决定归档；未main/push。
