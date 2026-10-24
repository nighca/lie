# 主协调交接快照 — 01a16e3d-d2f9-75e0-a09f-d39d5ab927dd

轮换发起：2026-10-25 02:28 Asia/Shanghai（root指令/紧凑专项快照）。新鲜只读复核：2026-10-25 02:30:29+08:00；监听/cwd随后复核。基线main：`43a98e6b12b55ed0cb6791d436a3398fe5b8547a`，owning main clean。

**生效界限**：这是本代最后文档候选的交接登记；只有旧root review并将最后文档本地集成后才actual release。旧root随后不再写main；successor尚未创建，接任者认领后才重新成为唯一integrator。02:02的`/private/tmp/lie-rotation-preflight-2026-10-25.md`是历史盘点，不代表释放或接任成功。

## 协调与权限

- 旧root/predecessor：`01a16e3d-d2f9-75e0-a09f-d39d5ab927dd`。当前登记phase released-for-successor、coordinator none、integrator none；按上方生效条件执行。
- 用户授权创建全新本地项目接任chat，不fork历史；项目ID `ec01ea33-d2f9-4986-98e0-ed1644ba1772`，创建前list_projects复核。只建一个，成功接手再归档旧chat。
- Night授权准确截止 **2026-10-25 08:30 Asia/Shanghai**；轮换不延长。小实现/排版/局部视觉可自行review验证推进，重要产品/玩法/架构/供应商/范围及明确后置仍待确认，沉默不算通过。
- 每代30分钟推进/4小时交接、整项委派（含环境/排障/IAB/长检查）、唯一integrator、隔离候选、内部无PR、无自动push/部署继续。新协调恰建自己两项heartbeat，安静通知规则不变。

| 旧任务 | 实查状态 | 实查target | 频率 | 工具更新时间（Asia/Shanghai） |
| --- | --- | --- | --- | --- |
| `lie` | PAUSED | `01a16e3d-d2f9-75e0-a09f-d39d5ab927dd` | 30分钟 | 2026-10-25T02:29:32.232000+08:00 |
| `lie-2` | PAUSED | `01a16e3d-d2f9-75e0-a09f-d39d5ab927dd` | 4小时 | 2026-10-25T02:29:34.248000+08:00 |

两次automation_update(view)仅返回可视卡片，独立从这两个命名TOML读取status/target核实；未写TOML、未修改任务。本快照不复制prompt或凭据。接任者不得恢复旧任务冒充自己的新任务。

## main、已完成与远程界限

- main及root夜间检查WT均clean @`43a98e6b12b55ed0cb6791d436a3398fe5b8547a`；该文档集成会推进main，接任读实际HEAD。
- 本地origin/main跟踪`32d89bf91f441168148884593a0f49b816ad7162`；本轮未fetch。最后部署证据亦为该SHA，不能推定最新远程/线上。当前本地新增仍未push。
- 17条UI、Logo/双语头图、home/CJK/Editor既有批次/蓝衣sunny等已main，不重做。最小result投影及WS诊断已main 0a67498；正式结果UI/新素材/动画契约未实现。Cloudflare Vite宿主丢非101拒绝状态仍未修复，诊断不是补丁。

## fresh工作树与未提交文件

| 路径 | branch | HEAD | 状态 |
| --- | --- | --- | --- |
| `/Users/nighca/code/nighca/lie` | `main` | `43a98e6b12b55ed0cb6791d436a3398fe5b8547a` | clean |
| `/Users/nighca/.codex/worktrees/investigation-review-takeover/lie` | `codex/integrate-night-checkpoint` | `43a98e6b12b55ed0cb6791d436a3398fe5b8547a` | clean |
| `/Users/nighca/.codex/worktrees/accusation-fan-layout/lie` | `codex/accusation-fan-layout` | `31db7c9f3d4f1224612d1017b37ef27520651fd3` | dirty，见下 |
| `/Users/nighca/.codex/worktrees/editor-portrait-alignment/lie` | `codex/editor-portrait-alignment` | `4fde8d43aaadb6ab0664a748cb2565c88952d957` | dirty，见下 |
| `/Users/nighca/.codex/worktrees/ochre-freckles-animation/lie` | `DETACHED` | `596866140893ed08f5bc247c6fd8758947a85003` | clean |
| `/Users/nighca/.codex/worktrees/silver-bun-activation/lie` | `codex/silver-bun-activation` | `0404805bb30e8c9f7b2599a3ad542f052c8f03f7` | clean |
| `/Users/nighca/.codex/worktrees/gray-plum-activation/lie` | `codex/gray-plum-activation` | `822e9b5bb8064f10c00178f9c5643dff6f3418dd` | clean |
| `/Users/nighca/.codex/worktrees/accusation-result-projection/lie` | `codex/accusation-result-projection` | `6ca375176fa922f9d5bef566277257c810598460` | clean |
| `/Users/nighca/.codex/worktrees/dev-websocket-rejection/lie` | `codex/dev-websocket-rejection` | `929acef88f7f6b09221fa3993f986d2ffb85f54c` | clean |
| `/Users/nighca/.codex/worktrees/silver-bun-animation/lie` | `codex/silver-bun-animation` | `79258ad5f51582aed981a1596e7bedcbfd5e7255` | clean |
| `/Users/nighca/.codex/worktrees/salt-pepper-beard-animation/lie` | `codex/salt-pepper-beard-animation` | `5c02f2203b8aca411a0bd8155599e864da1a8f9c` | clean |
| `/Users/nighca/.codex/worktrees/plum-crop-animation/lie` | `codex/plum-crop-animation` | `00881f691140ae14042fc3f3fa90ffc8347549cc` | clean |

### accusation-fan-layout：必须原样保留
`/Users/nighca/.codex/worktrees/accusation-fan-layout/lie`

```text
M apps/web/src/App.vue
 M apps/web/src/style.css
 M apps/web/test/App.test.ts
 M apps/web/test/navigation.test.ts
?? apps/web/public/games/layout-check-1.json
?? apps/web/public/games/layout-check-7.json
```

### editor-portrait-alignment：必须原样保留
`/Users/nighca/.codex/worktrees/editor-portrait-alignment/lie`

```text
M apps/web/src/editor/editor.css
 M docs/game-editor-implementation.md
?? apps/web/public/portrait-alignment-qa.html
```

fan与Editor不是clean交付，owner负责临时JSON/QA壳的最终取舍。不得stash/reset/清理/替其提交。ochre仍detached clean于5968661，未见制作文件，不假定已开始或擅建其branch。现有source refs/工作树保留，不随本代归档删除。

## 待合三角色：完整有序提交

- base：`0a67498cb58f0dd8403a57556bd786c854150276`。候选ref：`codex/integrate-three-characters-current`，HEAD `a440ec99cc0b5fab81ec0fb17278df5b2eb847ef`。当前该ref不占root WT；root WT已回到night-checkpoint，不应按旧路径直接操作。
- `git rev-list --reverse 0a67498cb58f0dd8403a57556bd786c854150276..a440ec99cc0b5fab81ec0fb17278df5b2eb847ef`实际核30条（silver18＋gray/plum12），如下；重建时依赖只包含一次，禁止与原source链重复回放。

```text
915620ab1866c3219069d90adc3a6799dbafdac5
c594a5e8297cc5c523d97e6aa96143309ebd8020
323564790d4007990b8cd7d3026853d9b00c51cc
99036082a568fa2097a0814a147d1583a3090fb5
67ec675c67b3a56b16b259506484a289841570b6
ed06916c1c27b999acc8df4597649fbdaeb03c4e
7248223428a260d542f83ffb90db2483adfe0b4a
0974a5d4de5727bda67a43c68ea1abdd67b266ea
9e16732c887ee051a4aec5b473d00087344fbe88
e5318e621ccb411fcddab34fea0ab05e59c85b3b
22e259d0f9d181ba172a5d517f286b750998ad6b
4db07afef8626fd3e26dde463c4b17bf29002963
3515481bfa29c1da216937951f6e9a2c76387af7
4035609c4fffc9003c6c0da0d04585acfa1def3d
32aa9d4c13234899e3532d0c215af47ca159e828
e12e4eacfd96e627a356d9097b7a302020e4d08d
1606c20607f8a12c3f2a20078d93a9dc11ac438d
f67d622c4aaafa05bceab4435cc05b02cd8a9ccb
4a4a5976f6ab8d815b80c1123bf3c013c68ceede
24d9ddfe45206444d33fa76cac7ac16c2a3cca77
f15a4054c34ac66bb560741321ad9f1523ec0ec4
6f2686130b5608bec0e46f992bad8cc95217cd87
02dc2311be5385415ab42c4e9116ea04c24e96f5
f0117fe728cf946d956e349c1bb8b71050d7a3eb
4b34ed80406e071ec6f6825d40c691d6bc4e9f83
871daeca10e71340016bf7844961124616dc4da5
1c2dcabefe41be37556a9015e601090fe292a1a1
e18338b5d6d66916ee1b98d2e8747dee15f3eb33
54f28d1b61381e9c2f2b1865a4d2c99174a7ad0b
a440ec99cc0b5fab81ec0fb17278df5b2eb847ef
```

- 已独立通过：Node24.22.1全仓379测试/全类型/Web＋gateway构建/79严格资源；3package＋16PNG哈希同已review旧候选，35旧静态/头像source/public/dist逐字节不变。两builder与有界fullparent证据此前已过，本次交接未重跑。
- **正式游戏IAB未通过/未交付**：three chat等待原因不可见。作者页391同源iframe四态/8图不是顶层游戏/真触屏验收，临时壳MutationObserver非Node异常原因仍待正式页复核。不得据自动检查合main或写视觉PASS。
- 新main43a98e6比候选base继续有文档提交；正式集成需从届时main新候选按30链review/组合，若再有功能变更追加影响检查，不能直接fast-forward到旧a440。专项integration docs在候选中，尚不属于main。

## 专项owner、等待与后续第一步

| 专项 | chat ID | 当前状态与下一步 |
| --- | --- | --- |
| 调查 | `01a16d5c-de69-7452-8d6a-280d15a87e9e` | 02:28紧凑快照仍waitingOnApproval；fan5507/viewport保留，待实际交互/clean交付。 |
| 编辑器 | `01a16d90-27cc-77c2-9e0a-4b28b1135371` | waitingOnApproval；iframe初轮居中通过，冷/热多角色反复切换/cleanup/完整交付待做，顶层slot未取消。 |
| 动画 | `01a16d44-aeea-7552-b184-5118072e75f3` | waitingOnApproval；5504银发/5505gray-plum游戏QA待交。其后mint/ochre按canonical配色制作，最多2角色。 |

waitingOnApproval只是可见flag；只读排查未获pending request/原因/拒绝证据，保留未测项，未重发/绕过/改权限，不能要求用户批准一个不可见事项。新协调向三个专项通知新ID，普通反馈继续完整批量交付。

接任第一步：核main/登记phase及是否已建successor；认领唯一协调后创建自己两任务并确认target/status，通知专项；紧凑wait取最新交付，不全读旧chat。先推进fan/Editor/正式游戏QA并保留dirty工作，完成后再按新main整项委派命名迁移（含runner环境owner受控重启）。角色主题/结果页完整方案、真人盲测/耳验/长URL/外部投稿等仍见当前计划，不因轮换丢弃。

## fresh服务归属与保留

02:30后只读lsof监听/cwd复核；以下PID仅本次观察，**禁止按快照PID操作进程**。全部观察地址127.0.0.1。

| 端口 | 本次PID | cwd/归属 | 交接要求 |
| --- | --- | --- | --- |
| 8787 | 77167 | owning main / 用户launchd | 独立于chat，保留用户tab，不停/不重复启动 |
| 8788 | 77264 | owning main/apps/gateway / 同源Worker | 与8787一起保留，ready不等真人 |
| 5507 | 80894 | accusation-fan-layout/apps/web / 调查 | 保留；原共享viewport owner未释放 |
| 5402 | 58594 | editor-portrait-alignment/apps/web / Editor | 保留 |
| 5403 | 63672 | owning main / Editor QA关联服务 | 保留，来源需按Editor最新交付核，不据cwd误停 |
| 5504 | 82560 | silver-bun-activation / 正式接入QA | 保留 |
| 5505 | 72234 | gray-plum-activation / 正式接入QA | 保留；不是已停的旧home服务 |
| 5351/5352/5355 | 5119/4647/4072 | animation-comparison-preview / 作者预览 | 保留，不重启旧模板 |
| 5356/5357 | 49992/63280 | plum-crop-animation / salt-pepper-beard-animation | 保留 |
| 5497 | 29992 | logo-easter-egg-design / 原探索预览 | 保留 |

launchd `dev.nighca.lie.main-preview`不受chat轮换影响，Node24.22.1与plist/日志位置见当前handoff及development。旧root任务停止不意味着停止服务。没有信号、重启、浏览器或凭据操作。

## 不变的门禁与恢复

- 重大产品/玩法/架构/供应商/范围仍先确认；08:30准确截止不延长，不能把提案或新素材写成已获批准；局部实现按现行夜间授权和owner边界评估，重大改变仍待确认。
- 宣传只方法/工具研究；脚本/分镜/录屏/旁白音乐/生成媒体/制作仍等用户判断成熟并明确放行。
- 仓PRIVATE，未来公开不是现在变更可见性或代建fork/commit/投稿PR的授权；内部仍无PR。正式访问/并发/费用硬限额/回收策略暂缓，无新DO/DB批准。
- 真人mic/外放/长会话/三案盲测/新增声音耳验/多用户与长URL/外部投稿未闭环，fake/ready不能替代；付费复核固定矩阵/单次上限/首异常即停。Sunny真实隐藏恢复与1280×720裁切仍保留。
- root子agent handles不会随新chat继承，依赖冻结提交、refs、工作树与书面交付，不自动接管旧控制句柄。
- 创建失败且明确没有successor时按rotation恢复；已创建但接手不明时旧root保持released/两任务PAUSED，先查状态，不重复创建/双integrator。接任确认前不归档旧chat，不能把此文档当接任成功。
