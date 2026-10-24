# CharacterPreset 命名迁移落地计划

2026-10-25，只读评估与执行提案，核对基线`08cf274bcd733afa0ace90dddcd870743b8e4331`。**尚未实施命名迁移**。本文延续[原范围调查](character-preset-migration.md)，补齐新消费者、并行所有权和常驻runner依赖；旧调查中的资产数量/在制状态不代表当前事实。

## 已批准边界

内部领域类型`Appearance`→`CharacterPreset`、解析函数`readCharacterPresets`、制作源`design/character-presets/`和包`@lie/character-animation`已获批准，不重新询问定名。故事角色`CharacterDefinition`与跨案预设保持分离。

保留JSON字段`appearanceId`、稳定人物ID、`voiceId`、公开`/appearances/`、草稿key`lie-editor-draft`及gzip分享格式；不做双字段、URL alias或旧命令长期兼容层。原图/动画字节和声音不变，行为不改。

## 为什么不能重放旧提交

原`cb86dd6e25e22444dc93b892c2d609c0a0d6ac08`改107文件，只作为命名映射参考。它的基线尚无后来调查波形、Editor动画/布局、作者预览选源等更新；不得以旧App/Editor/Preview整文件替换新实现，也不重放旧candidate中已main的调查或预览提交。

旧正式源47文件，当前基线已60；silver接入及后续动画还会增加。迁移必须从届时最新manifest动态列正式资源，不能恢复旧清单或硬断言47文件。6张平铺历史PNG继续留在`design/appearances/assets/*.png`；README中英两张头图的HTML源仍使用其中coral-bob/sunny-moustache/blue-glasses三张。只移动manifest引用的8个正式ID子目录，不直接移动整个旧design目录，不重做品牌图。

## 一个实施owner的文件范围

| 批次/范围 | 必须一起考虑的文件与消费者 |
| --- | --- |
| 制作源/生成链 | 正式manifest/types/制作README及8个ID目录；`scripts/appearances.mjs/.test.mjs`→`character-presets.*`、`syncCharacterPresets`、root npm命令、Web所有生成生命周期、`.gitignore`源注释。输出仍`public/appearances`及`dist/appearances`。 |
| Web内部接口 | `presentation/appearances.ts`→`characterPresets.ts`；main/Application/App、Editor/draft/share的imports、props/局部变量、issue字段/overlay及Editor专属CSS与测试。序列化键不变，不混布局修复。 |
| 动画workspace | `packages/appearance-animation/**`→`character-animation/**`，包name、UI依赖、AnimatedPortrait imports/测试、generator直接import、lock workspace链接；第三方版本与安全overrides不变。 |
| 新运行消费者 | `scripts/main-preview.mjs`默认generate命令、相关runner验证与development说明；旧命名提交没有此文件。 |
| 新制作消费者 | 已main blue/sunny verify与qa直接import旧包；待合silver/plum check、audit-seams内嵌JS、inspection及gray verify/qa同样需核。不得编辑其他owner已交/在制分支，应在新基线统一接入。 |
| 活文档/作者预览 | README双语、架构/内容/Editor说明、动画contract/workflow/blue/sunny/coral说明、相关voice说明；`spikes/animation-preview/Preview.vue/README.md`。保留selected选源、src.<id>及多root env，不还原旧模板。 |

原制作源types与运行时展示类型是两层契约，不能为改名混合严格源校验和可空展示资源。controller/voice/gateway不引入预设清单，不改供应商协议。历史文档/截图/provenance只保留原陈述，不要求全仓appearance字符串归零。

## 依赖与推荐执行顺序（提案）

1. **等待fan、Editor、silver当前交付review合main**，再记录最新reviewed SHA。fan持App/CSS，Editor持Editor/CSS，silver会改manifest/正式目录；实施owner取得这些文件的明确所有权。gray/plum若仍制作则先取得clean交付或协调激活冻结窗口，候选制作可继续，不允许迁移期间并发改正式源。
2. 在新独立worktree由**一个owner**完成正式源、生成器、Web内部接口、包名及消费者迁移，机械改名基于最新源码做局部变更；代码批次可分提交，但送main的候选必须整体可构建，不能先交一半接口。
3. 可独立准备包名批次（不碰App/Editor），但也要同步generator/UI/预览/候选工具，且待合动画又会带回旧路径；当前建议不抢先实施这批，避免额外往返。现在可独立做的只有映射/依赖准备，未授权本轮动代码。
4. 对比迁移前后manifest投影及所有正式资源字节；核旧草稿恢复、真实旧gzip分享和重新分享、音色映射、UI静态/动画回退、多候选预览。用Node24.22.1/npm11跑生成器/runner/全仓测试、类型、构建/输出严格检查，不能只看字符串替换数。
5. 由环境执行owner负责下面的runner受控重启/验收，root保持唯一integrator，独立review后按AGENTS集成；不自动push/部署。

## 常驻runner的实际运行依赖

`runMainPreview()`启动时把`commands.generate`固定为`[process.execPath, 'scripts/appearances.mjs']`。while循环发现main变化只停止/重建子进程，**不会重载runner自身JS**。因此只把磁盘文件/命令改成`character-presets.mjs`，旧常驻进程下次更新仍调用旧已删除脚本，预计先失败再靠launchd退避重启，不能当作无缝自动更新已通过。

最小提案：在迁移集成窗口由环境owner受控重启runner，使其加载新命令，再核生成成功、实际SHA、8787与同源8788及原私密文件隔离。保持原launchd/plist/端口，不为迁移新增常驻系统或旧命令shim；本轮没有执行重启或修改服务。此操作责任必须整项委派，不能把配置/排障/验收尾巴留给root。

## 本轮检查与限制

只读核原提交diff、当前消费者、manifest/目录数量、runner循环与已在制候选工具。本批仅保存文档计划与当前入口校准，未改生产代码或既有候选refs，未开服务/browser、使用mic/provider，也未宣称迁移测试通过。本文是执行方案，不是已完成迁移或新产品批准；具体开始由root在依赖交付后分派。
