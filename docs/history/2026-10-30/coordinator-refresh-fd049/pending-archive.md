# 待独立归档/集成的精确依赖

2026-10-30 截点：下列提交已通过本地 Git 对象/父链/文件范围核对，均不在文档基线 fd049 祖先内。本任务没有 cherry-pick 任何一项；root 对已有专项回执的审查不等于这些资料已进入默认分支。以下用 `SHA:path` 文本定位待归档文件，避免相对链接指向尚不存在的目标。完整事实或媒体由精确提交/refs承载，不依赖旧WT目录存在。归档review已完成：6dd+d242+事实六链经独立审查；546全19文件、72case JSON/source identities/checker/图经独立review且root已读README/verification；0e163/da3的md+JSON及cce恢复已由root实际审查。上述纯文档均为**已review、待集成默认分支归档**，按既定流程串行集成；不因chat archived而恢复服务。

| 范围 | 完整 SHA / 依赖 | 文件范围 |
| --- | --- | --- |
| CPU发布后续 | `6ddbe141b597b2c60d4fc32d052f8fdaf91b3726`<br>parent `f86206611dbc0a10260fb1605d9a616b22493dc3`<br>独立于f862；proposal授权状态＋实际release md/json | `docs/voice-cpu-budget-proposal.md`<br>`docs/voice-cpu-budget-release/2026-10-30-verification.json`<br>`docs/voice-cpu-budget-release/2026-10-30.md` |
| 红点发布后续 | `0e1634a4853a4cce85867cdd6a26f0c27b1e23f8`<br>parent `fd0493773e3b47ee934b2a391e8f69b49f632c58`<br>独立于fd049；实际release md/json | `docs/hidden-page-version/release-2026-10-30.json`<br>`docs/hidden-page-version/release-2026-10-30.md` |
| 本地main恢复 | `cce53e8da69e8b3490f15095fae1924c2709a816`<br>parent `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`<br>独立于12c；恢复md/verification.json，旧PID只是当时快照 | `docs/local-main-preview/2026-10-30-restore-verification.json`<br>`docs/local-main-preview/2026-10-30-restore.md` |
| 断连事实① | `087d72a2e6e1395231ad52ee15b1bfe8011fee69`<br>parent `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`<br>链首，base12c | `docs/voice-disconnect-investigation/README.md`<br>`docs/voice-disconnect-investigation/cpu-options.md`<br>`docs/voice-disconnect-investigation/cpu-text-guard-probe.cjs`<br>`docs/voice-disconnect-investigation/cpu-text-guard-results.json` |
| 断连事实② | `8d6c4b8f38e6358da35d9b21e8dc2f5a25466757`<br>parent `087d72a2e6e1395231ad52ee15b1bfe8011fee69`<br>依赖087d72a | `docs/voice-disconnect-investigation/README.md`<br>`docs/voice-disconnect-investigation/cpu-options.md`<br>`docs/voice-disconnect-investigation/post-upgrade-evidence.json` |
| 断连事实③ | `c8dbd3e610bea04d1938f5db6f680ba28c98847b`<br>parent `8d6c4b8f38e6358da35d9b21e8dc2f5a25466757`<br>依赖8d6c4b8 | `docs/voice-disconnect-investigation/README.md`<br>`docs/voice-disconnect-investigation/cpu-options.md`<br>`docs/voice-disconnect-investigation/post-upgrade-disconnect-evidence.json`<br>`docs/voice-disconnect-investigation/post-upgrade-disconnect.md` |
| 断连事实④ | `3b745182633266a0cd22d8cfada0ebffa86f37ad`<br>parent `c8dbd3e610bea04d1938f5db6f680ba28c98847b`<br>依赖c8dbd3e | `docs/voice-disconnect-investigation/README.md`<br>`docs/voice-disconnect-investigation/post-upgrade-disconnect-evidence.json`<br>`docs/voice-disconnect-investigation/post-upgrade-disconnect.md` |
| 断连事实⑤ | `29a97d52337aebe2cba7cadbd0b693b280c1af2f`<br>parent `3b745182633266a0cd22d8cfada0ebffa86f37ad`<br>依赖3b74518 | `docs/voice-disconnect-investigation/linx-night-comparison.md` |
| 断连事实⑥ | `1ee049e5036b515880bc38daf8230fd700a66771`<br>parent `29a97d52337aebe2cba7cadbd0b693b280c1af2f`<br>依赖29a97d5；人工CPU发布后近4分钟观察，非600秒保证 | `docs/voice-disconnect-investigation/post-cpu-manual-acceptance.md` |
| 13:09事件 | `d242bfedae92854b60b1f13cb933d2be9fe7d407`<br>parent `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`<br>独立于12c；固定窗口/截图/脱敏JSON，浏览器请求身份未逐一关联 | `docs/voice-disconnect-investigation/incident-1309-evidence.json`<br>`docs/voice-disconnect-investigation/incident-1309-ui.png`<br>`docs/voice-disconnect-investigation/incident-1309.md` |
| 离线接缝调查 | `546f61fe52d02db01e5b7a6736570e76219f7604`<br>parent `12c4e4d29135c7e30083c8ecf08c2fc95bcaf150`<br>独立于12c；离线矩阵/波形/必要合成源，不能称真实音爆已全解 | `docs/voice-audio-seams/` 共19文件；入口 `README.md`、`verification.json`、`native-results.json`、`source-manifest.json` 和必要合成源/波形/复验脚本。 |
| 视频修正版候选 | `b4c26c8ca2abb6444cfcc254409ae5aadde644fb`<br>parent `fd0493773e3b47ee934b2a391e8f69b49f632c58`<br>独立于fd049；已review并本地main ff至843985前缀，远端push传输中，尚未确认published；指定横v3/竖v5许可范围 | `media/promo-video/production-2026-10-30-v3/`＋`2026-10-30-landscape-v3/`＋`2026-10-28-mobile/v5/`，共360 named（350 payload / 131416998 bytes）；以该提交 `STAGING-FILES.txt` 和 `HANDOFF.md` 实际路径为准。 |
| UI合批发布后续 | `da3d2ef56e35776fc9d245e599d3176df00ea446`<br>parent `bda3ddbf7b69f7f28ee2f112183477e617a2bbd0`<br>独立release文档，不重复产品链 | `docs/transcript-version-release/2026-10-30.md`<br>`docs/transcript-version-release/2026-10-30.json` |

断连事实链必须依 `087d72a→8d6c4b8→c8dbd3e→3b74518→29a97d5→1ee049e` 的原有顺序评审，不能重复 replay 已存在依赖或把旧“待批准/观察中”覆盖后续已批准CPU发布。13:09事件、离线研究、本地恢复与两份release后续是独立12c/f862/fd049分支，要从当时最新main建立候选进行组合审查；不同base并不授权覆盖新业务。

当前UI源有序 `d76e780→83125e0`、`af96013→9549278→a6bf862`、`74687a7b45b75f84ce68eb1f231a7ec85f17558d` 已按总协调回执正常合批main/push至 `bda3ddbf7b69f7f28ee2f112183477e617a2bbd0`，完整CI/CD/serving/local已由最终owner回执通过；该产品链不再列为待合入，也不重复cherry，仅上述da3d2ef发布证据待归档。结果UI `2a677d847ab76531a8eda6a5e6a14805daf54c07`→`23abd80ebfb7f8fa29d4aaa5b545ee08a4563f68` 已获用户具体设计批准及review合入要求，且独立/root review通过；设计门禁已满足，仅当前视频＋纯文档维护窗口不含它，必须另排产品发布窗口，不混本档案或视频。

必要截图只在本次日期档案保存一份；其05:25图不与13:09事件的06:24图互换。本地恢复记录旧PID、raw草稿旧预览清单和视频旧v1/v2/原SFX许可门禁都不当最新运行授权。每批必要资料完整审查进入默认历史后才可清理其worktree，不能只依赖聊天或ignored文件。

语音旧chat现为archived，多个旧WT不在worktree list；1ee049e等精确Git对象/refs仍可用，归档不以恢复chat/旧WT/服务为前提。视频843985为本地回执前缀，不当完整published SHA或CI/CD成功；其最终远端/serving结果留发布owner下一批回执。
