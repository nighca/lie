# B方案实施记录

2026-11-02。用户已明确要求“按B实现并推进合并上线”。候选完成，发布由总协调review与唯一integrator推进，不再次询问已批准的平台/视觉/上线范围。

## 差异与基线

新managed worktree `/Users/nighca/.codex/worktrees/lie-compatibility-b/lie`，branch `codex/voice-compatibility-b`，实际clean base `fae16961a2f90d6268bba6721b259cf2f93f478b`。只cherry原设计`00127fab05c585ac30e99a204dca5eb274b8717b`得到`ec9d418b310e69b59ec7182802948677e7e1479f`，不重放已上线98dd/a6，不修改冻结的原worktree/提交。

运行时只改App和VoiceControl：无框info图标＋“兼容模式”，保持同一说明入口/弹窗；回答及尾保护时为静态声音符号＋“听完再问”，颜色/字重/间距按B稿。两个图标aria-hidden、不可单独聚焦，文字名称保留。VoiceControl只有当前inputNotice有效时使用声音图标与轻样式，连接/错误优先原样，不新增public prop或修改原波形。

采集、channel/player、provider、UA策略、300ms、预算/连接期限、普通平台分支未改。没有新观测、网络接口、录音或任何真实语音调用。此更改是已批准兼容模式的视觉/文案优化，不宣称修复AEC根因。

## 必要检查

独立锁定依赖217packages，Node24.22.1；按新checkout既有脚本生成8presets/121assets，未复制secret或共享node_modules。

- App25项＋原真实channel/player fake门控7项，2files/32tests通过；共享控件9tests通过。
- App检查入口的装饰图标、说明/焦点、暂停及尾保护文案、恢复/错误重开；控件检查连接/error仍原class/无声音图标，notice清空恢复波形。原普通模式断言保留。
- Web与UI的vue-tsc --noEmit均通过。文档链接、截图真实JPEG签名和hash、预览源与临时副本逐字核对通过。
- 最终clean提交Web生产构建与确切SHA由handoff报告；不重复无关gateway/provider测试，不把fake当真机声学证明。

## 实际组件截图

使用[implementation-preview.html](implementation-preview.html)：真实App/controller＋既有fake voice，明确的合成回答/恢复/错误按钮，不导入main/liveVoice或调用prepare/mic/provider。说明/错误/普通模式为实际组件交互，尾保护flag用明示合成状态，真实门控仍以离线7项为证，不冒充本次Safari音频验证。

实际手机viewport390×844，平板布局实测745×1072（向viewport API请求820×1180，但按innerWidth及JPEG实际尺寸记录，未猜测缩放原因）。两宽均无横向溢出。入口border0、装饰图标隐藏于AX名称；说明打开/Escape还焦点；暂停显示声音图标/听完再问，恢复波形，普通模式无该提示；合成错误只有原错误class/文案、无声音图标。连接优先由控件测试验证。

完整短窗口reload→fake start→回答→恢复→end共50项事件、truncated=false/hasMore=false：voice请求0、AudioContext0、runtime exception0，唯一socket为Vite HMR。没有读用户store/clipboard或真实tab。原截图JPEG逐字保全，未编辑或重编码，hash与源身份见[implementation-results.json](implementation-results.json)：

- [手机入口](implemented-phone-idle.jpg)、[手机回答提示](implemented-phone-speaking.jpg)。
- [平板入口](implemented-tablet-idle.jpg)、[平板回答提示](implemented-tablet-speaking.jpg)。

## 服务退出与交付

root授权新短5176窗口，启动前核空。owner为Safari负责人chat `01a19770-ee7d-7c31-96fe-b80657c3ee5d`；单Vite strict127.0.0.1:5176，PID98807，cwd本WT/apps/web，原PTY69001，起点ec9d＋B dirty源hash见results。唯一consumer自建IAB tab7，停止条件为本轮截图完成。

验收后viewport reset、tab7关闭、IAB列表空；原PTY Ctrl-C退出，精确ps PID/pgrep children/lsof5176核空，无保留consumer或服务，不触其他owner端口。原设计源及A/C备选保留，不回写原图；本次新实装图片单独命名。完整ordered commits、clean状态、构建与限制一次交总协调；未自行main/push/deploy。
