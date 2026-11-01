# 同一 iPad 的 Safari / Chrome 首轮结果

2026-11-01，用户在专项Chat提供六个JSON文件，并确认：六组都能听到信号，全程未说话、系统音量和摆放一致，没有某组明显变轻/变响或改从听筒播放。文件按原字节保存；文件名来源为用户的`Downloads/lie-test`，SHA256和bytes见[分析结果](analysis.json)。仅含诊断设置/音量/清理元数据，无音频、原话、设备ID或凭据。

以每份`current`为当次结果。B/C中的`completed`与此前A/B的current逐字一致，故是**六次实验、每环境每模式一次**，不是重复验证。

| 环境 | 静默前 RMS | 播放 RMS | 静默后 RMS | 播放 peak |
| --- | ---: | ---: | ---: | ---: |
| Safari A，16k直接播放 | .0001890 | .0017429 | .0002199 | .0708923 |
| Safari B，默认48k直接播放 | .0007257 | .0010306 | .0004752 | .0445862 |
| Safari C，16k媒体流播放 | .0003297 | .0028728 | .0004429 | .0984802 |
| Chrome A | .0002221 | .0025068 | .0002055 | .0952148 |
| Chrome B | **.0132152** | .0008906 | .0007876 | .0310364 |
| Chrome C | .0004170 | .0005651 | .0001879 | .0217590 |

六组均无error、播放200帧/4秒、静默约100帧/2秒，tracksEnded/contextsClosed为true。采集48k、AEC=true在三个阶段均报告；NS/AGC/channelCount/latency未报告，不能解释为关闭。最终context closed是正常释放，不是播放时失败。

结论及限度：

- C在Safari相对A的播放期采集RMS **+4.34dB / 1.65倍**，Chrome则 **−12.94dB / 降77.5%**。不支持按媒体流路径C修Safari。
- B相对A两边较低：Safari **−4.56dB / 降40.9%**，Chrome **−8.99dB / 降64.5%**；这是重复A/B的候选，不能当成已验证的AEC改善。
- Chrome B的静默前RMS比播放期高14.84倍、比静默后高16.78倍。用户确认未讲话/条件一致，仍只能称基线不稳定；不能替用户补造触碰、提示音或具体处理原因。
- Safari A播放RMS还比Chrome A低3.16dB。这批合成音没有复现“Safari必然比Chrome串入更多能量”，不能用总能量直接解释Safari的真实STT自打断。
- 播放peak约为RMS的34–43倍；当前只保留全段聚合值，可能受短瞬态影响，但无法据此确定发生时间、频率或持续性。dB差为`20 log10(RMS比)`，不是声压级、ERLE或已分离回声的衰减。
- 同系统音量与主观响度一致提高可比性，但未量测实际声压；无真人语音、ASR/VAD/STT事件或精确声学时间。settingsByPhase是阶段中最后一次值，也不能证明期间无瞬态切换。

下一步只加强独立诊断：v2增加每10个PCM帧（约200ms）的RMS/peak和首末帧主线程到达时间，不存PCM；保留原aggregate。一次少量Safari **B→A→A→B**反序/重复，先区分启动瞬态、持续输入和基线漂移；不机械重跑全部六组，不改产品16k或采集/打断。如果仍没有可重复差异，停止仅据合成RMS选参数，转向用户手动真实游戏中的STT/TTS/aborted时序；不自动开真实provider或录音。

## 前次线上无mic验收证据补存

[必要截图](production-initial-page.png)来自本专项对已发布730ba84 canonical HTTPS页的自有IAB标签页验收，此次随真实结果调查正常批次保全，未为截图单独部署。首次加载及受控reload：inlineJS的start click listener存在、自有CSS hash匹配且排版正常，0 AudioContext / WebSocket / runtime exception / audio元素；A↔C选择未触采集，结果空，无权限提示，未点击开始。自建tab已关闭，IAB tabs list空，无新应用服务，未动用户tab/权限。

浏览器DOM有Cloudflare注入的beacon脚本，attempt被本页CSP阻断（loadingFailed reason=csp、无外部response/执行），不能写成“无请求尝试/console零告警”。另一个被阻inline style来自验收工具的`codex-browser-sidebar-comments-root`；本页自有样式hash实算匹配且生效。未放宽策略/改全局统计，未将HTTP构建源hash等同于边缘DOM无注入。显式disable某个CDP观察方法不受支持后，直接关闭自建tab销毁会话；没有改用其他手段绕过。
