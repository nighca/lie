# iOS Safari临时语音兼容模式候选

2026-11-02。用户已明确选择iPhone和iPad Safari轮流说话，并确认开启前低强调“兼容模式”按钮、点击解释弹窗，回答期间提示、可提问时波形。尾音保护期间继续提示，连接/错误仍用原提示。**本候选已实现并离线验收，未集成或发布，未验证真实Safari音频效果。**

Owner：Safari共同负责人chat `01a19770-ee7d-7c31-96fe-b80657c3ee5d`。新managed worktree `/Users/nighca/.codex/worktrees/lie-ios-safari-turn-taking/lie`，branch `codex/ios-safari-turn-taking`，实际起点clean `bb5fe51c641d65b61593aa5e820072f81d1350f2`。原`9423/lie`调查分支冻结保留9302，未复制旧App、重放旧main依赖、修改main或其他分支。提案9302与调查7685/f87/374/427是历史依据，runtime候选不依赖重放这些提交。

## 实际行为与接口

- 独立`voiceInputPolicy.ts`用iPhone/iPad UA，或受限的MacIntel＋多触点线索识别iPad桌面模式，再要求Safari/Version标记、排除其他浏览器标记。main只判一次，统一传给liveVoice及Application→App。macOS、其他iOS浏览器及未知保持原模式。UA可能被宿主伪装，不能保证区分所有内嵌浏览器，不称全WebKit检测。
- liveVoice在TTS start后直接丢弃onFrame回调的上行PCM；不排队、不补发、不用静音替代。保持同mic/context/encoder/socket及realtime、16k、AEC/降噪、预算/连接上限；不额外发listen.stop/start或abort，不改变STT和aborted处理。
- 普通stop保留现有flush/drain，等整轮answerEnded且真实player队列排空才启动300ms尾保护；句间queue空、outputLevel=0或onIdle本身不会解锁。aborted/STT有效本地中止后同样经尾保护恢复，新TTS取消待恢复。close/失效scope阻止旧回调和timer恢复。
- `VoiceFeedback.inputPaused?`只在兼容模式反馈中附带；controller显式投影并沿用原close/reset清空，普通模式原feedback shape不变。App从这个同源状态派生inputNotice，避免网络stop后提前显示可提问。没有新增GameView/engine状态或packages/voice公共合同。
- VoiceControl新增默认null的inputNotice和可选idle slot；preparing/error优先。兼容入口在idle的既有波形区域，灰色细框小按钮；开启后不显示入口，暂停上传时替换波形为“请等角色说完再提问”。关闭解释和Escape还焦点，开启、离页/终局、其他模态/模式切换关闭解释。解释不启动语音、不停止会话/计时，不称物理麦克风关闭。

## 验证结果与限制

Node24.22.1/npm11，独立`npm ci --ignore-scripts --no-audit --no-fund`217packages；未共享node_modules/复制私密vars。最初裸vue-tsc因新checkout缺忽略的appearance manifest失败，随后按既有character-presets脚本生成8presets/121assets恢复，Web与UI类型检查通过。最初sandbox测试缓存mkdir被拒，按已授权worktree测试请求升级后执行，没有绕过浏览器或资源权限。

- Web完整离线回归50files/488tests通过；共享UI9tests通过。最终App错误重开断言与平台收紧后，目标App25项、policy14项再通过；没有重新跑无关Worker/provider suite。
- 新7项真实channel＋真实player＋fake mic/socket/context验证实际sent二进制序列：start即抑制（含首100ms pending）、句间耗尽不恢复、normalstop短尾直到ended＋300ms才恢复、不补历史帧、aborted及lateSTT恢复、新回答取消旧恢复、close/旧scope隔离、缺normalstop用户结束后新scope正常、普通模式继续上传且STT可打断。无额外listen/abort，firstForwardedPcm仍只由实际channel.input后报告。
- Web生产构建初轮通过（含原独立诊断HTML），最终clean提交构建结果由handoff列明；已见的Vite未来native-config扩展名提醒及underline.svg构建解析提醒属于原配置，不扩改本任务。诊断HTML12915B/SHA256 `d51a71e8829333b70b31cd86d872ff89fc1bae041529ea357cce1959eff196a1`保持。
- `packages/voice`、gateway、锁文件相对bb5 diff为空。原播放排程/缓冲、provider配置、原诊断入口及其他浏览器采集路径不改。

这只是workaround：已在途输入不可撤回；worklet消息可能延迟、encoder可能有不足20ms半帧，回调没有声学采集时间，恢复的第一帧不保证全是drain之后的声音。onIdle不测声卡或声学尾音，300ms是临时策略值而非保证；其他背景误检/上游中止仍可能存在，未确认AEC根因。真实可用性仍需root统一安排必要的真机验收，fake和合成UI不冒充修复成功。

若provider永远不发任何有效结束且只是暂时drain，无法安全判断整轮已完，继续阻断，不用idle/任意timeout重开上传；用户原结束、切人和离开仍可清理，新scope恢复正常输入。错误关闭由原controller路径负责。没有新增watchdog或更改预算来掩盖协议缺失。

## 原生合成UI验收

[preview.html](preview.html)挂实际App/controller与既有fake voice，手动明确的合成阶段控件；不导入真实liveVoice或调用prepare/mic/provider。为避免被误纳入产品，Vite临时入口仅逐字复制到忽略`apps/web/tmp/voice-compatibility.html`，未改产品URL/平台开关；harness直接注入明确的展示policy，不修改浏览器UA或全局状态。初轮harness误用测试helper的未绑定浏览器timer导致fake会话error，已在保全harness用window包装纠正；不是产品语音错误，未为此开真实连接。

IAB自建tab5验证390×844、820×1180，无横向溢出；手机初态/弹窗/Escape还焦点/blocked/恢复波形、普通模式回答仍波形、结束回idle、平板弹窗与关闭正常。harness状态切换只验证UI，上传时序靠上述真实bridge/player fake断言验证。

初次较长CDP窗口truncated，不据此声称全程0请求；另取完整短窗口覆盖reload→fake start→blocked→恢复→end：50项事件、truncated=false/hasMore=false，`/api/voice`请求0、AudioContext创建0、runtime exception0，唯一socket为Vite HMR。没有读取用户tab/store/clipboard，也没接受麦克风权限。结束后viewport reset、自建tab关闭，IAB列表空。

必要原截图按JPEG真实编码逐字复制、未重编码，大小/hash见[results.json](results.json)：

- [手机初态](phone-idle.jpg)、[手机解释](phone-dialog.jpg)、[手机回答/尾保护提示](phone-blocked.jpg)。
- [平板初态](tablet-idle.jpg)、[平板解释](tablet-dialog.jpg)。

## 服务与交付

总协调明确分配短5176窗口，owner启动前lsof确认无listener；单个Vite strict127.0.0.1:5176，PID75509，cwd本WT/apps/web，原PTY/session28344，基线bb5＋本候选dirty源（最终runtime hash见results）。consumer仅本owner IAB自建tab5，stop条件为上述UI验收结束。原PTY Ctrl-C后退出；精确ps PID/pgrep children/lsof5176均空，自建tab已关，无保留消费者。未碰8787/8788、5177、5198或其他owner服务，root批量维护development登记。

提交只含候选runtime/必要tests及本目录证据。最终有序SHA、clean状态、相关checks与限制交总协调实际review，未main/push/deploy；平台、位置、短文案及解释方式已经用户确认，不重复请求同项批准。候选审查与正式发布仍由总协调统一负责。
