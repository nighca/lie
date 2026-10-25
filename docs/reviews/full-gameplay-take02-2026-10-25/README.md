# 736fae1正式失败take02独立只读审验

冻结source736fae1ac67b7a27f2fc64dbbb2400734e53b293，parentbb1834f8cd9e1a7ce7828cb119df0763b34ee79d。producer审前/审后clean、HEAD同source，全部11路径只docs/promo-video/2026-10-25/full-gameplay-take02。完整读README、ESM factory、recorder、实际probe入口、全部JSON和冻结失败图；未改原始执行记录/库/源/main。无阻塞历史归档问题，不表示未来录制入口每条异常路径都已安全。

实际检查：JSON/JS/MJS语法、本地链接、敏感模式与diff检查；flow body与前轮完整factory逐字相同，仅新增named export。recorder仅fs import、write回调注入/默认值和named export，其采集行为仍前轮逻辑。入口实际使用已审白名单classifier，原batch仅临时在内存传accept，落盘snapshot不含URL/query/rawID/headers/frames正文。

network保存1created(elapsed null)→empty frame-error(elapsed0)→closed(elapsed4)。新增纯Node合成事件回放得到同snapshot形状；这不是从未保存的原raw事件重新验证，不能填造HTTP码或连接总耗时（created没有timestamp，零点取首个有效timestamp）。本次未observe willSendHandshake/response/loadingFailed，不据此断言没到Worker/手动激活猜测成立。Browser warn/error空数组不是已排除网络错误。

持久WAV3轨实际各402944样本/48k/monoPCM16/8.3946667秒，逐样本峰值0，与JSON相同，三轨ffmpeg -xerror完整解码通过。520索引对应实际JPEG均1280×800，metadata全1280×800/scale1。持久库session/outcome/network/capture-flow/recorder与冻结Git文件逐字相同。失败段真实保留但outcome.segments为空为非接受段语义，没有导出正式视频。旧37.53秒与73.4秒MP4相对parent完全同字节。

outcome首错Voice failed before ready shen、questionAt null；session无question事件，终态三ctxclosed/三trackended/cleanup errors0。Network closed和UI inactive共同支持此次连接停止；socketCount0只是未代理WS。失败图08:00/空转写/语音暂时中断，未见账号、凭据或个人通知。未全520帧人工审片，没有真人/provider语音成功。

API-check只读回名称/native字符串和临时API/指针消失，不是安装前后逐引用比较；README已正确说明。Network.disable/Emulation/reset/user-tab保留为作者实际执行回执，本批无browser独立复查，不扩大成引用同一或全资源反射可证。

## 外围安全局限与后续最小建议

probe-entry.js的catch仍nodeRepl.write({error:String(error),outcome})，不是bb1834f纯函数runner返回的规范JSON。当前落盘首错是固定有限Voice failed before ready文本，未发现本次敏感泄露；但原异常字符串可能在未来包含locator/DOM/URL等内容。不能把classifier/runner的输出白名单承诺扩成整个外围入口已过滤。此处作为历史实际源码保留，不改写成未实际执行过的“修正版”。后续新入口宜只输出stage/kind/固定枚举及规范outcome，首异常保留本地不可枚举，不打印任意String(error)。

当前safeStep覆盖flow动作失败→音频/UIcleanup；但probe-entry在exportAll/Network read/write/截图之后的外部Network.disable/移除API/Emulation/reset是串行序列，未放在分项finally。若其中一项将来异常，后续外部清理可能跳过；本次API-check和完整结果不显示该问题发生。下一新窗口前应离线故障注入验证：export/截图失败也执行disable/reset，外层清理分项catch不覆盖首错。无需重连或改生产来补历史证据。

不建议为此次失败做provider/token/Origin/超时修复，没有根因证据。用户提出同页同装置亲手点击的对照仍是待明确授权/协调方案，本批没有准备或执行额外真实窗口。

证据audit.py/result.json保存有限本机只读检查，脚本用冻结Git源和持久raw库，不读凭据或发请求。没有CF/网络/browser/provider/service、录制脚本执行、重编码或Git变更；owned WTclean，待root正常批归档，不独立发布。
