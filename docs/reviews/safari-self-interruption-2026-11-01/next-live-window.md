# 真实游戏被动时序：下一窗口方案

2026-11-02 联合诊断接替：用户要求自打断与声音间断共用一次测试，现由[联合诊断说明](../voice-diagnostics-2026-11-02/README.md)作为唯一待协调者审查的测试说明。本页保留既有权限边界与尚未批准的opt-in设计，不另行安排用户实验。用户最新反馈iPad当前未复现、准备稍后试iPhone，设备按联合说明选一台即可。

2026-11-02。状态：**先询问用户能否使用Mac远程Web Inspector；尚未进行真实会话。产品侧观测仅提案，未确认/未实现。** 依据：[ABBA结果](ipad-abba-2026-11-02/README.md)。目标是把本次合成音的启播输入峰与真实STT/中止顺序区分，不再用总RMS直接选产品参数。

## 首选：不改产品，用已有远程Web Inspector

用户本人操作，仅在其愿意进行一次正常游戏时执行；Agent不点击开始、不代发问题、不接受mic权限、不录音或上传。优先观察一次原问题，发生后停止，不自动重复或扩展成本。

1. 用户在Mac Safari设置→高级打开“为网页开发者显示功能”；iPad Safari设置→高级打开Web Inspector，以线缆连接，并由用户处理设备信任提示。具体菜单随系统版本核对，不改Feature Flags或使用暂停调试。
2. Mac Safari“开发”菜单→该iPad→已有LIE页面；在用户正常开始会话前打开Network。只查看该页面精确`/api/voice` socket；不使用Headers/Cookies导出，不导出HAR或完整frames。
3. 用户手动进行正常问题并等角色回答；角色播放时本人保持沉默。发生错误玩家气泡/自打断后停止对话。仅抄录事件类型、方向、相对时间与`tts.stop.is_aborted`布尔；可注明用户“已听见角色出声/本人未说话”，不复制STT/TTS正文、MCP设定、binary、身份或认证信息。
4. 目标顺序：`tts.start → 首个下行binary → stt → tts.stop(aborted) / close`；以本轮首个`tts.start=0ms`为相对基点。具体UI若没有某时间或事件就标未提供，不填造数据。收尾关闭Inspector/正常结束用户对话，不清用户tab/storage或擅改配对/其他服务。

这个路线只能观察网络收包；**下行binary到达不等于实际声音播放**，也看不到应用内部player stop原因/全部input RMS。若不能定位关键顺序，停止这一路线，不要求用户绕过工具限制或提交完整敏感日志。

官方依据：[WebKit启用Inspector](https://webkit.org/web-inspector/enabling-web-inspector/)、[Apple检查iOS/iPadOS](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios)、[Network Tab](https://webkit.org/web-inspector/network-tab/)。Network能显示WebSocket，但其Sharing导出是完整HAR，不适合作为本次白名单证据。菜单/设备项以用户实际版本为准，不承诺已在其Mac/iPad验证。

## 若首选不可行：产品内最小opt-in提案（需用户范围确认）

现有批准仅覆盖独立无provider诊断页，**不自动授权产品内观测**。该页继续不接Linx。下面只供用户/root审查，不作为实现许可。

- 隐藏入口候选：正常游戏URL的明确`voiceTrace=1`仅显示小型Vue诊断面板，普通入口无该面板；面板仍默认关闭。显示“开始记录（不启动对话）”“结束记录”“清空”“复制事件”。只有用户另按原有正常语音按钮才开mic/连接provider，诊断按钮不调用voice.start/prepare/open。
- 数据白名单：从用户显式开始记录起的相对毫秒、事件枚举、局部连接/回答计数、文本长度（无正文）、PCM帧字节数（无帧）、已有input/output RMS的低频汇总、context sampleRate/state、player计划调度/queue/gap/stop枚举原因。绝不记录provider/session/device/角色/案件ID、URL、Cookie/token、工具参数/正文、原异常或音频。
- 关键点：记录`tts.start`、首个接收audio、首次计划schedule、STT收到、tts.stop.aborted、player.stop请求原因/返回及会话关闭。统一主线程相对时钟，保留audioTime为另一个数值，不把schedule/调用返回说成硬件已经出声/停声。协议没有可靠speech_started事件，不发明该事件。
- 仅有界内存（建议最多2000条/不足时明确truncated并结束**记录**，不停止游戏）；RMS汇总最多5Hz，调度只保留首次/间隙/耗尽等有区分力事件，不逐样本存储。用户手动结束/离页即关闭采集这些metadata，清空/刷新即丢弃，复制需显式点击；无localStorage/上传接口/后台传输。
- 不改provider配置/请求内容、mic constraints、PCM、16k播放、缓冲、VAD、自然插话或任何转发/打断条件。观察回调异常不能影响原有动作；默认关闭时不创建新context/node/timer/socket/状态持久化。

### 拟议ownership与可复用接口

| 文件/模块 | 只读发现及拟议最小作用 |
| --- | --- |
| `apps/web/src/application/liveVoice.ts` | 已接收STT/TTS/audio并执行interrupt；这里可在原动作边界投影白名单metadata，现有`onPlayback`/`onStartup`可复用。当前只读取，没有改实现。 |
| `packages/voice/src/player.ts` | 已有PlaybackObserver，含schedule/stop/buffer/context-state；优先在应用层过滤，不改播放器行为或公开合同。 |
| `packages/voice/src/channel.ts` | 现有VoiceEvent已含必要上游类型；优先复用liveVoice接收到的事件，不包装原生WebSocket或读取headers。 |
| 新应用层trace store/隐藏Vue面板、必要`main.ts`接入 | 如获得批准，需root明确文件ownership/开关/停止语义后实现；普通玩家界面、controller和独立音调页不改。 |

以上hook/入口仍需实际root与用户审查，现阶段未新增这些文件、跨模块接口或生产入口。用户若选择页面方案，先确认这份数据/行为边界；不把选择偏好默认为任意产品改动许可。

### 独立检查与退出条件

实施前后检查：默认off零记录/零新资源；白名单投影拒绝正文/身份字段并以人工secret seed断言不外泄；内存/时钟/清空/结束/复制/异常隔离；fake验证加观察前后原channel输入/播放/stop顺序及次数相同。候选完整差异/相关应用检查由root负责review/串行集成，不以fake代替Safari或真实ASR。

一次用户真实窗口若得到STT先于本地stop，可定位到上游输入/识别链而非仅UI；若aborted先到，保留独立供应商中止路径。无STT但出玩家气泡则检查实际build身份和controller来源。未捕到不声称修复，不自动继续烧额度/要求更多音调组；再据具体缺失决定下一步。
