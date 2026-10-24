# CharacterPreset 命名迁移实施与验收

2026-10-25。实施owner：character_preset_migration；独立工作树 `character-preset-migration-dawn/lie`，分支 `codex/character-preset-migration-dawn`，reviewed base `2982e6a77046d9f3c3744e529c08166149e3eddc`。命名与边界已批准，原[范围调查](character-preset-migration.md)和[落地计划](character-preset-migration-plan.md)继续保留；本记录为实施候选，不代表已集成main、已push、已部署或runner已切换。

## 实施范围与保留边界

- 运行时 `CharacterPreset` / `readCharacterPresets` 与制作源 `CharacterPresetManifestEntry` / `CharacterPresetManifest`仍是两层契约；前者保留可空展示容错，后者继续严格校验。
- 唯一正式源迁到 `design/character-presets/`，仅移动manifest、types、制作README及清单引用的8个ID子目录。旧目录保留6张平铺历史PNG、状态研究、prompts、provenance及指向新制作入口的说明，README品牌头图HTML引用不动。
- `scripts/character-presets.mjs` / `syncCharacterPresets`、根与Web生命周期命令、runner默认生成入口一并迁移。公开产物继续是 `public/appearances`、`dist/appearances`；不增加第二套源、旧命令shim或URL alias。
- workspace改为 `packages/character-animation` / `@lie/character-animation`，UI、五个已完成候选的检查器/inspection/QA/生成脚本、内嵌审计JS及多root作者预览引用同步更新。lock仅workspace名称、路径、链接和UI依赖改名，无第三方版本变化。
- App、Application、入口及Editor/draft/share内部props与变量改为characterPresets；Editor内部定位字段/overlay/CSS为preset，选择文案为人物预设。现有fan、文本折行、Editor立绘定位、最小结果投影和动画生命周期均保留。
- `appearanceId`、所有人物ID/voiceId、`/appearances/`、`lie-editor-draft`及gzip JSON格式保持。作者预览既有 `appearance=<id>&src=…` 入口继续原样工作，src.id、selected及多root配置语义不变。wire/公开URL与作者query是有意保留的边界。
- 未改core/voice/gateway协议、供应商、权限方案、mint/ochre在制目录或其他worktree；不重放旧cb86dd6，不整文件还原旧App/Editor。

## 自动化与字节证据

使用现有Node24.22.1 / npm11.13.0，执行独立worktree的标准 `npm ci`、全仓 `npm test`、`npm run typecheck`、`npm run build`。候选预检通过后又从锁安装复核；最终结果以本记录的交付核验追加为准。

新增5项旧格式兼容检查，fixture由base的真实 `encodeGameLink`、`saveDraft`、`createDraft`捕获，不使用“新编新解”冒充历史输入：

- 完整、未完成/null预设及已失效预设的旧JSON恢复和保存保持内容、答案、人物及appearanceId；无效引用仍定位preset选择器，不自动换人。
- base真实gzip链接由新读取器打开，重新分享后的完整JSON相同；所有音色映射仍对齐正式源。

另新增1项runner默认命令进程检查：不覆盖commands，fixture只在独立临时仓库模拟npm与两个服务，实际执行新的生成器入口，断言安装→生成→服务启动顺序；未启动真实8787/8788，也不把fake服务当正式环境证明。

[迁移前运行时清单与79资源SHA-256](character-preset-migration-evidence/asset-sha256.json)在移动前捕获。源manifest字节不改；迁后全部正式源资源、public与dist共79资源加manifest逐项完全相等。6张平铺历史PNG及README头图HTML无diff。新源生成仍动态读取8条清单，不硬编码79来生成或限制未来人数。

五个已main候选的blue/sunny/silver/gray/plum原validator均以 `node --experimental-transform-types`执行通过，包含各自PNG/canonical hash、严格契约、循环、接触关系与中断连续性等原有检查。最初漏加该现有flag的调用因strip-only不支持parameter property而失败；按既有文档flag重跑通过，未因此修改播放器代码或声称第一次通过。审计Python和素材生成脚本仅核对引用/内嵌JS；没有重新生成或改写任何位图、包或provenance。

## 真实IAB验收

独立5541应用与5542作者预览服务，唯一自建IAB tab1，全程未改global viewport，未碰用户8787草稿、mic、provider或其他owner服务。

1. 真实首页所有已呈现群像图加载，3个官方案件可见。真实Editor预设弹窗8个中文标签和图像完整加载，选中薄荷后静态图为原mint默认图，隐藏canvas不计为活跃动画。
2. 临时本地HTML夹具按钮把base真实保存的完整草稿放入5541的 `lie-editor-draft`，随后正常导航Editor。标题/背景/沈禾、顾遥、陈拓及设定恢复；动画正常，分享按钮生成5976字符链接。浏览器生成链接与捕获的base链接一致；Node回归另验证JSON与音色ID。
3. 通过实际anchor打开base真实gzip分享链接，intro标题、背景、3人物及8分钟正确；实际reload后仍正确，接案进入idle调查页。未点击开启对话，随后正常结束确认。
4. 5542配置两个明确外部候选root（已完成silver与plum作者目录，只读），分别通过 `VITE_ANIMATION_PREVIEW_CANDIDATES` 的/@fs包URL读取。银发→waiting→紫衣→银发，原静态参考依次为对应waiting图，单个可见1254方形canvas，waiting保持。两root目录未修改。
5. 选择无动画mint，canvas display:none且两侧均为加载成功的mint/waiting.png。再用既有单角色 `appearance=silver-bun&src=/__preset-qa-missing.json` 指定失效包，speaking状态回到silver/speaking.png；切plum后动画正常且speaking保留，再切silver保持回退。单角色覆盖未污染其他人物。
6. 本轮读取的应用及作者页warn/error均为空。第二次createBrowserTab显式visible:false返回“子agent不支持IAB visibility”，一次tab inventory确认未产生第二tab后复用已有tab继续；未反复重试、不切Chrome、不据此宣称真实hidden pause/resume。

原生截图已目视并保存入库：[8预设](character-preset-migration-evidence/editor.jpg)、[旧草稿](character-preset-migration-evidence/legacy-draft.jpg)、[旧分享intro](character-preset-migration-evidence/legacy-share.jpg)、[多root预览](character-preset-migration-evidence/multiroot.jpg)、[失败静态回退](character-preset-migration-evidence/failed-animation.jpg)。它们是运行时原生截图，无裁图/像素改写。

边界：没有真人语音、真实后台隐藏/恢复、新一轮reduced-motion浏览器覆盖、移动硬件或跨浏览器矩阵。已有自动化继续覆盖动画减少动态/加载失败/取消隔离，不冒充上述真实浏览器证明。此次只验命名迁移，无新视觉设计。

清理：临时QA HTML已删除；自建tab1正常结束测试局、清除5541测试草稿后关闭。5541/5542自有Vite均Ctrl-C退出，端口无监听；无全局viewport覆盖需复原。临时捕获模块/测试已删，正式历史fixture与证据保留在本提交，未依赖tmp-only设计或决策。

## 审批与后续服务窗口

自动审批曾拒绝一次递归扫描全部animation-candidates并替换相对源路径的写操作，理由是可能包含受保护mint/ochre在制目录；该操作未执行。随后先只读核明确8个文件与受保护目录无diff，再将写操作收窄到blue/sunny/silver/gray/plum五目录这8个已授权文件，获准且完成，不绕过边界。此后未再做宽范围候选写入。

常驻runner仍未操作。root实际review并串行集成后，必须明确给本实施owner服务turn；owner负责一次原 `dev.nighca.lie.main-preview` launchd受控kickstart，以及8787/8788回环监听、`/__lie/main-status`=集成SHA、79资源与manifest、前端私密路径403（不输出body）和runner日志成功检查。步骤在[development](development.md)“人物预设命名迁移的runner切换”。不创建新daemon、不停其他服务、不删除活锁、不自动部署。服务结果在完成后以独立新提交追加，不把该尾巴转交root。

## 交付核验

标准 `npm ci`退出0、audit零漏洞；npm提示既有workerd/fsevents安装脚本未纳入当前allowScripts，本次未修改该策略或升级依赖，已有本机二进制支持后续Worker test/build成功。最终全仓 **388项通过**：runner9、生成器21、gateway11、Web191、character-animation33、core51、UI38、voice34；全仓typecheck及Web→Worker build通过，postbuild严格输出检查8预设79资源通过。Web中新增5项历史兼容、runner新增1项，共比base382项增加6项。最终一次全检后仅对staticContent测试的局部变量做同义改名及文档补录，未改变应用/资源/依赖身份，按最新用户要求复用已通过证据，不再重复同一应用全检。

浏览器重新生成的完整URL已与base编码器输出逐字符比较相等；完整资源hash对比已通过。差异检查无空白错误。只提交授权源码/正式移动/现有消费者和本文证据；不包含临时HTML、临时capture模块、生成public/dist、私密配置、日志或其他owner在制文件。全局main、发布与真实服务切换由root后续审查/操作窗口分别确认。

### Root review 后的测试夹具修正

Root发现新增runner测试把 `process.execPath`直接写入shebang；正式运行时路径含`Application Support`空格，不能据无空格临时运行时通过而认定可移植。已将fixture改为`#!/usr/bin/env node`，受控PATH先含fixture bin、再含当前Node二进制目录，确保解析同一运行时；等待runner退出失败时仍由finally恢复原PATH。仅测试夹具变化，无生产代码、资源或依赖变化。

使用实际 `/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin/node --test --test-name-pattern='default runner generates' scripts/main-preview.test.mjs`，1项通过、退出0；不重复388项、类型或构建。此修正以独立后续提交交付，不改写原候选commit。正式8787/8788仍未操作，继续等root服务turn。
