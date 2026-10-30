# 3ee9b07受限真实诊断只读审验与下一步提议

2026-10-25。冻结source `3ee9b07be142414da59e99d25f031d68daaf22ee`，parent `dcc52a14d6569d124708f4db096221d21d195c96`。作者WT已clean前进到904fd863bbb3cf6d547711fe1c340f8c9d4448a8；本批通过Git对象读取原7路径，未把后续文档混入范围，未改作者WT。已读完整180行harness、完整wrapper、README/三个JSON、冻结失败图；对照上一dcc报告、production gateway/index/config、liveVoice/controller/channel/player/microphone源码和已有本地发布日志。必要核验结果见result.json。

## 结论

用户新直接反证必须优先：root转达用户在同一电脑Chrome、同一案件普通真实对话成功。因此不能把1006当线上普遍故障，更不能据此修生产或改provider配置；临时tab、注入harness和浏览器session差异是下一步比较对象，但现有证据没有证明其中某项就是根因。

冻结events证实：2026-10-25T09:55:06.097Z构造唯一WS，+2435ms触发error，无open/hello/tools-list/send/question；+1ms记录app主动close(1000,Aborted)，再3ms收到native close1006/wasCleanfalse。错误发生在wrapper finally前；不能把后续Aborted本身当最初根因。三个AudioContext在创建和state事件中均running，虚拟gUM已走到后续capture context构造；这反对“纯录制context未resume”猜测，但不等同完整micReady/握手验证。1006不是服务器返回的HTTP错误码。

唯一连接失败发生在浏览器WS打开前；不能定位为网络/Chrome session/Origin/Worker升级拒绝/上游某项。完全没有HTTP握手状态证据。没有question/STT/TTS，三轨WAV离线读得各217728样本/48kHz/mono PCM16、峰值0。268帧metadata实际1470×779，与verification和截图相同，不符合正式1280×800，应保留为失败诊断材料，不能交作成片。

## wrapper/harness审查

本次补交实际wrapper，补齐上一dcc仅README声明finally的归档缺口；与持久库run-live-diagnostic.js/session/outcome逐字节相同。ready等待优先识别“语音暂时中断”/“暂时无法”/closed，成功才question，第一失败直接return，finally调用cleanup后导出3轨和snapshot；不重连。harness保留单WS限制/60秒watchdog、owned资源清理、4接口恢复源码；新WS观察只记事件/控制类型白名单，不保存帧正文、transcript、header/token。WS构造URL仍原args，send/close仍调用绑定的native方法，源码没有主动改目标或Origin，未找到能确定解释pre-open失败的注入代码错误。

本次终态一socket readyState3、三contextclosed、三trackended、context close errors0。仅构造器名称回读不证明逐引用相等，README已正确降级。wrapper finally若cleanup/导出命令本身异常，后续记录可能中断，但本次session/WAV/outcome实际完整，不能据此解释本次连接失败。失败图只有产品及虚构案件，未见凭据/个人通知；未做全268帧人工审片。源码JS syntax与JSON parse通过，无真实执行。

## /api/voice现有链路能确定什么

`apps/gateway/cloudflare.config.ts` 将/api/*交Worker-first，生产entry是index.ts，observability已在源码启用。`index.ts:16–20,40–78`：status只检查三绑定是否存在，不验证token有效性或上游连通；voice GET先检查Upgrade和同源Origin/无query，缺配置503；再fetch固定上游，throw记录`voice_upstream_unavailable`并返回502，上游无webSocket记录`voice_upstream_rejected`及status并返回502；仅上游升级成功后对浏览器返回101。因此浏览器未open可以对应Worker前网络失败，也可以对应上述非101响应，不能从当前events选定一条。不要把status ready当真实上游健康检查。

既有CI/CD日志证明对应Worker成功部署/资源恢复，不包含本次09:55Z运行请求或握手码；静态发布成功不能诊断这次运行连接。现有产品voice源码相对8aa/main无相关变动，没有基于此次单tab失败做生产回滚或更换provider的依据。

## 最小安全下一步（提议，未执行，不新增turn授权）

1. **先查已有历史数据而非再连接**：若账号可读留存Worker request/exception日志，则限定09:55:05–09:55:10Z、本Worker、GET /api/voice，只提取是否命中、最终HTTP状态、event枚举和upstream拒绝状态。源码已有两个脱敏console事件可直接区分部分502。不要读取headers、绑定值、认证token、URL query或原始WS帧；没有留存数据就明确未知，不以缺日志推断未到达，也不启动新的provider请求来“补日志”。此报告未调用CF账户/API或读取凭据。
2. **下一新明确单次turn若获批**：producer提出的native WS/AudioContext、无tee、CDP纯被动观察是合理最小基线。先把被动Network.webSocketWillSendHandshakeRequest/ResponseReceived/loadingFailed观测准备好，只导出目标路径、status、error类别和相对时间；不导出request/response headers、session参数或frames。不要为了拿HTTP码发curl Upgrade或另造WS，这本身也是新连接。
3. 原生产品基线成功后，按独立获批窗口逐项引入虚拟输入、输出tee、PCM采集，保留相同Chrome/profile/origin/已发布JS/案件，并记录哪些注入启用；失败即停，不在一turn自动跑完整矩阵或换角色。音频输入需事先明确：不能因去掉harness意外触发硬件麦克风权限/真实用户录音，也不能带着不同gUM失败条件把比较做成假基线。
4. 尺寸覆盖及268帧不符单独在离线/无provider页面验证，不为画幅问题再消耗语音资源。新test没有开始前先在离线fake审wrapper cleanup及诊断过滤；这些准备不等于已获真实重试许可。

本批不发网络/WS/provider、不改Worker/供应商配置、权限、服务，不读凭据，无browser/应用build/编码/main/push。原turn已耗尽且释放。本报告与JSON仅owned ignored目录保存，待root下一正常批归档，不制造单独发布。

## 交付前新事实（root转达，尚未进入本次冻结source）

producer按用户指定现有tab做了另次probe：native WS/AudioContext/输出不包装，仅虚拟mic，捕获到`wss://lie.agency/api/voice` HTTP101、UI结束对话和计时下降。这证明该组合当时可连接，进一步反对普遍线上故障判断；仍不能单独归因原临时tab或proxy。runner在ready赋值前异常，finally取消locator匹配2按钮又掩盖原错，未question，不能称真实录音成功。新材料未完整handoff，本报告不把转述当已独立源码审验。

据此下一步应优先**离线修测试wrapper/locator**：原异常与cleanup异常分别保留，清理使用确切scope/唯一目标，取消失败不能覆盖首错；以无provider fake状态覆盖两个按钮/ready异常/cleanup异常。先补完整新source交审，不为继续收窄原因追加真实连接或改生产。用户tab保留和资源恢复是producer回执，本批没有触碰该tab或重复检查。
