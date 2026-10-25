# 2f刷新后的间歇语音连接失败：只读诊断

结论：根因未知，无生产/供应商配置修复依据。已完整执行可用的历史观测查询，不把排障尾巴当成等待root重跑。用户普通Chrome同案成功、之前同tab真实STT/TTS成功和本次失败均保留；不能称普遍故障，也不能将失败归因新header/spacing发布。

## 源码身份与冻结事实

8aa7ec967dfad45bf1646cdd27c6d909bebec437→已发布2f5496d61fca524dca04cf23da4ade8778513924的liveVoice/channel/player/microphone、gateway index及cloudflare.config均无diff。精确Git blob见result.json。沿用此前已读完整生命周期/两次失败/一次有声素材审验，不改旧记录。

root提供新失败冻结源721baec5f54402c794a40e6cfd117e91eb4f4304；实际读其README、network、session、outcome。记录开始1792923530630、open-shen1792923537567、gUM1792923541111、终止1792923549132，Network只created83831.955→空FrameError→closed，无握手HTTP码，未question/STT/TTS。失败即停，三ctx/track已closed/ended，0socket是无WS代理的计数含义，不是无连接。未抓producer在制dirty或重试。

## 已实际查到的历史观测

项目只有cloudflare.config.ts、无Wrangler配置；已读cf-cli技能并用现有cf CLI。匿名命令发现和API schema确认Workers observability临时query，dry:true。只查询字段名和calculation聚合，避免events/raw invocation数据、请求headers、私有WS正文。账户/用户标识等API envelope没有保存进脱敏材料。没有登录、读取凭据、tail、开启采集或变更日志配置。

- 失败精确窗口10:18:50–10:19:15Z，service lie-game，路径ends_with /api/voice/status：1条200/outcome ok（status-control.json）。这是本窗口status接口可见的正对照，不能把它当上游健康或WS101。
- 同窗口精确ends_with /api/voice：无聚合匹配（failed-status.json），HTTP/WS scheme不影响该过滤。不将“没查到”写成绝对未到Worker/浏览器问题；这也受现有日志覆盖/字段表示影响。
- 先前有声成功10:05:58–10:06:40Z（以epoch1792922758000..2800000为准）同一精确路径过滤：1条status字段0/outcome ok（known-success-status.json）。说明此类路径有可见历史数据，但此字段0不是HTTP握手码，不填造101。
- 失败放宽窗口10:18:45–10:19:30Z，只查询代码定义的`voice_upstream_`脱敏message聚合：无匹配（upstream-events.json）。因此目前没有Worker主动上游拒绝/异常的正证据，但日志缺项不能排除。

最初exact https URL过滤无匹配，后来改用经正对照验证的路径后缀，避免协议表示差异误判；宽/includes查询找到的200也用精确status路径复核。没有为了拿错误码新发curl Upgrade、健康探针、WS或provider请求。

## 代码能区分的路径

index.ts:46–78先判断Upgrade（426）、Origin/query（403）、三绑定存在（503），随后fetch上游；throw记录voice_upstream_unavailable→502，上游无webSocket记录voice_upstream_rejected和status→502，仅成功升级后返回101。status入口只是三绑定存在性，不验证token有效/上游连通；不读取绑定值来验证。

channel.ts的socket创建/open/hello/tools-list/ready及liveVoice的status、playbackResume、micReady是不同阶段；目前新失败没有实际HTTP码，不能选定某条分支。源码显式10秒上游/握手等待和统一UI“语音暂时中断”也不能单独解释8秒左右的外围计时。既有CI/CD日志只有部署事实，没有这次运行级握手证据。

## 最小可审查的下一步，均未执行

1. 暂不修产品、换token/device/provider或延长超时。现在最有价值的缺口是浏览器到edge的pre-open分类与同session差异。下一次必须新明确单次资源turn；不要为了诊断再开并行WS或接管用户tab。
2. 先离线准备被动CDP事件白名单：created、willSendHandshake的布尔到达、handshakeResponse.status、frameError的枚举类别、loadingFailed的net::错误类别/blockedReason/canceled。剔除headers、URL query、Cookie/token、原始frames。已有Network只有空FrameError，不臆造更细原因。
3. 如果获新turn，采用已知可连的用户指定session，先不包装native WS/AudioContext/输出；按明确输入授权避免采集硬件麦克风。比较同origin/已发布JS/案件、记录启用哪些注入，首错停并清理。不能在一个turn自动遍历多种配置。只有被动证据确需改诊断时才提交最小代码方案，不因此改生产传输行为。
4. 离线可验证方案：现有gateway fake覆盖426/403/503/101/上游拒绝502；补充fetch抛错/Abort/协商关闭等假对象，用假时钟检查日志只含阶段/状态、无header/body。浏览器诊断adapter用合成CDP事件验证过滤、空错误和loadingFailed映射；wrapper fake验证单次click/question、首错不被cleanup覆盖、未ready不question、失败不重连。现有startup可选observer可供局部fake，不挂全局生产日志或混用未测新入口。本轮只提议，未为源码没变重跑全suite。

本报告只做现有代码/冻结证据/历史CF聚合读取。必要JSON全部脱敏，未存原始CLI envelope、credentials、headers或private frames。无browser/service/资源写/main/push；owned WT clean，证据待下一正常批归档，不单独发布。
