# 视频新增整批只读审验：3c81036..f62309c

冻结base `3c8103693ebc7343131da643883c44fb27aff75f`；有序SHA：
1. dcc52a14d6569d124708f4db096221d21d195c96
2. 3ee9b07be142414da59e99d25f031d68daaf22ee
3. 904fd863bbb3cf6d547711fe1c340f8c9d4448a8
4. 43486d91f2cd92e98bd63cb33b9b7856a010f78e
5. f62309c89ca32a7417a2f32eb0658eee8d7546d4

producer WT审前/审后clean、HEAD f62309c；读取固定Git对象，不改原始库或作者refs。整批36paths/30文本文件，只docs/media，无应用/依赖/workflow改动。前dcc和3ee既有完整审验按Git身份复用，新增3ee README纠正用户普通Chrome成功反证已实际读；不存在将1006当普遍线上故障或实施生产修复。上一两份诊断报告仍在owned ignored live-short-dcc-review/take02-3ee-review，可随本正常批必要归档。

结论：无阻塞归档问题。可交的是双向有声效果预览，**不是完整回答、正式成片、多角色/指认录制或公开发布批准**。本批没有新连接、provider、browser、服务、权限/config/凭据操作、应用build/test或原片重编码。

## 新增用户tab连接probe

完整读434五路径。仅虚拟gUM，WS/Context/connect保持原生，Network记录唯一/api/voice HTTP101；这证明该组合当时可连，不能独立隔离原临时tab与proxy原因。实际未question，wrapper ready赋值前出错，finally同名取消匹配2按钮掩盖原错，作者另次结束会话并保存结果，未暗中重连。清理记录输入ctxclosed/2tracksended/gUM恢复、用户tab保留，UI07:34/原2条记录。input-only.js把音频base64替换为声明占位符，属脱敏源码而非可直接执行的完整输入；保留既有question.wav可重放依赖。截图中仅产品/虚构案及用户已授权保留的原问候，无浏览器栏或凭据；旧问候不是本probe新对话成果。

## 新有声片实际验证

ffprobe及完整`ffmpeg -xerror ... -f null -`通过：37.533333秒、4181726 bytes、1280×800、30fps、H264/yuv420p/tv、AAC48k mono。Git冻结对象/verification/持久库MP4 SHA一致：`e5c546fd8cf6693e43cb69354577d0d7fca562d3fe7eb1b01dd0b878c9438064`。旧73.4秒创作分享MP4与base逐字节一致。

原始3轨WAV独立严格解码通过；各1805056样本/37.605333秒，输入峰17339、输出/混音峰27104。已重算全部每秒RMS与JSON相同，逐样本mix-input-output最大差0；编码MP4临时解码后0秒RMS0，6秒输入区RMS约0.1092，18秒输出区约0.1185，30秒输出区约0.0832。证明成片不是误封装的静音或只一条轨，不以转写代替声音存在。

3030个持久原帧索引唯一且实际JPEG尺寸1280×800，metadata全1280×800/scale1；voice.ffconcat的3031个引用（含末帧重复）覆盖全部帧，所有文件存在，工程路径已指向持久库。render-command.json用真实首帧timestamp减record-start epoch，音频前裁0.06009793281555176秒，公式复算一致；命令明确两输入/视频和音频映射/shortest。实际时基对齐有证据，不代表AudioContext时钟到屏幕输出延迟已经精密校准，AAC有损也不可能逐样本等同原WAV。未重新执行会编码输出的命令或改raw。

实际查看新增3JPEG（probe after、录制preview/after），并从新MP4解码约5/15/25/35秒接触图。画面由连接中→新问题转写→沈禾回答逐步出现，角色视觉从等待到说话，剩余时间下降；与输入约6–10秒、输出约16–36秒的能量区间及session事件相容。没有做主观听感或逐音素/口型精确同步判定；不是全1126编码帧人工审片。图中没有token、账号/个人通知，用户原两条问候/回答被保留并与新增两条清楚区分。

outcome明确ready/questionSent true、initial2articles/final4articles；30秒上限时still speaking，answerComplete false，主动结束，07:34→07:03，新增回答显示被打断。transcript把用户旧问候/旧回答与本次问题/回答一同记录，不能把全部四条算本次成功。当前回答转写完整句子不等于声音已播放完成。

## 录制代码与清理边界

实际读168行audio-harness与完整record-once。harness去掉WS代理，仍用原生WS；socketCount0仅表示未追踪，Network本轮只有close，不能填造此轮101。output-tap同时有GainNode和多个AnalyserNode，此次真实输出非零，区别于前次只有mic保活GainNode。harness owned资源跟踪/60秒watchdog保留，watchdog先结束该页语音；wrapper采用同步短轮询，语音region中精确按钮，首错errors数组保留，UI/audio/export清理分步catch，不再由重复取消locator覆盖原错。

持久库session/outcome/network/harness/wrapper与冻结Git文件逐字节一致。终态3ctxclosed/4tracksended、context close errors0；用户tab和原记录保留，其他恢复/Network disable/viewport reset由producer回执，本批不重新触碰用户tab验证。单次wrapper只一次启动按钮/一次question，无自动重试；不把这些材料当成本/时长硬上限或零费用证明。

源码无已证实产品bug。一个非阻塞的未来健壮性点：record-once对question Runtime.evaluate返回未像state()一样检查exceptionDetails；本次非零输入和新STT证明question真实成功，但未来应检查该字段再设置questionSent，继续保留错误原因。本报告不擅自修owner或开始新连接。

## 留存与检查

全部30文本文件JSON/JS语法/本地Markdown链接/敏感模式扫描通过，diff whitespace通过；旧失败/反例留在原专题和持久库，未删除或改写。新MP4全部解码、WAV全部解码/数值复算，脚本和有限结果在本目录。audit.py包含只读本机路径，重放时从冻结Git对象建立临时媒体并只解码到临时PCM，不依赖本轮已有/tmp输出；原始素材/FFconcat在作者文档明确的持久库，不能仅凭checkout在另一机器重建，清理WT前应保留这些依赖。它不是新录制入口，不调用provider。

实际制作与用户指定tab操作属于已授权制作；本批未核新的公开上传许可，也没有上传/传播。报告仅ignored目录待root下一正常批归档，无Git/main/push操作，不制造报告独立发布。
