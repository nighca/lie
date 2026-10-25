# 最新已审main语音异步生命周期复核（离线）

固定main1232ef884a6841065a73db5a1080d81eeb2fe03e。仅报告本轮可证事实：**未确证新的bug或非预期架构耦合**。有限覆盖不等于所有调度/浏览器/硬件通过。没有生产修复建议需要立即实施。

## 避免重复与实际范围

先读已有docs/reviews/voice-lifecycle-2026-10-25报告/4探针与结果、相关controller/liveVoice/microphone/navigation tests和既有native QA/出戏调查。出戏属于模型指令/供应商组合边界，不以客户端fake宣称解决；共享device隔离、旧开发非101、真实硬件/visibility仍不擅自关闭。未重复context-frame、RSM、结果/动画与录制harness问题。

全文/相关完整实现复核controller、liveVoice、channel、microphone、player、PCM、voice接口；navigationLifecycle是生产实际接线，pageLifecycle独立helper不误认App入口。读取Application的attach/discard/loadRevision、router离开确认、pagehide/pageshow和App当前点击/取消/切人/背景弹窗消费。实际执行的模块来自自有clean WT，对main逐字节身份已核，未用旧App模板冒充当前UI（probe不挂载App）。报告result.json列精确文件hash与相对前600fb4d identity。

controller/live bridge/transport/navigation等生命周期文件自上次600fb审查未变；Application现有差异已按实际上下文看，内容summary/catalog/title/展示变化没有引入新的voice生命周期规则。旧4项组合PASS仍是历史证据，不把未复跑项目列本轮新PASS；核心内容可选summary差异亦不当成语音调度改变。

## 实际判断

- stopVoice先结算ready后的预算/flush pending，再失效epoch、清active并abort/close。loadEpoch与epoch/session/character/signal一起隔离旧load/open/event/tool；A→B自动重连不复用A history/context。busy早期事件门禁与完整voice.open的Promise组合保持准备阶段不计询问。
- liveVoice close幂等，channel callbacks/音量/current门禁和mic晚到stop覆盖；晚status返回在current检查前不能创建device/socket。player排队/interrupt/idle和pending转写flush分工未发现新可达错序证据。
- 可见性隐藏只endConversation，保留本局历史和已用时间，不自动结束局或恢复语音。pagehide丢弃controller及preview快照，persisted pageshow重载当前route；共享fragment异步加载有revision检查。beforeunload取消不dispose、router取消留局是现有明确行为，不当成bug。
- 没有凭静态代码把设备断开、权限撤销、后台AudioContext原生状态或provider异常帧顺序等硬件边界宣布通过，也没有把理论listener抛错/任意外部调用已dispose对象当生产可达缺陷。

## 唯一新增有限fake组合

probe.test.ts（独立config，Node24.22.1/Vitest5.0.5）实际controller+liveVoice+channel+navigationLifecycle+core组合，只有status/socket/设备/事件宿主/时钟为fake。一个有意义时序：

1. A状态请求pending，页面hidden，取消且不创建任何设备/socket、额度1000ms不变。
2. visible不自动重连；显式B连接完整ready。
3. A旧status响应无视abort迟到，不能创建第二组资源/污染B，B仍active。
4. B收到新转写，50ms后hidden，准确剩950ms并保留该转写；socket/mic/context各清理一次。
5. pagehide disposal/persisted pageshow回调路径发生，全部timer0。

1/1通过；probe-result.json保存本次结果。不是重跑旧4项，也不是新镜像测试套件。此组合验证EventTarget级接线，不等同真实Application挂载、bfcache或原生浏览器事件调度实测。

## 收尾

无源码或Git/main/push/centraldocs改动，自有WTclean。无browser/用户音频/在用录制页/麦克风/真实provider/网络/服务/构建或无关全suite。报告、原探针、config和结果在owned ignored目录，root可在下一正常批按必要范围归档。若要继续缩小真实硬件或provider边界，仍需新明确矩阵与资源turn；本次无新产品决策或权限请求。

归档说明：root已全文读取本目录五份文件。probe/config原字节保留当时在tmp/lifecycle-1232-review运行的相对路径；重放须置回同等目录上下文，不将本归档路径误当已重新执行的测试入口。无新确证缺陷，不扩大fake事件覆盖。
