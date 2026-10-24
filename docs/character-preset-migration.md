# CharacterPreset 命名迁移范围与执行建议

只读调查，2026-10-24，基线 `2de0f22ff529ab66ecfa2aecf181e94c77a0f62c`。顾遥动画已集成，满足用户批准的命名前置条件；本文件没有实施生产改名，也没有改变 IDs、清单、包名、锁文件或既有数据。

## 建议 root 采用的最小方案

一次完成内部概念、源码路径和播放器包名迁移：`Appearance` → `CharacterPreset`，`@lie/appearance-animation` → `@lie/character-animation`。故事中的 `CharacterDefinition` 仍是本案人物，预设是可跨故事复用的图像、四态、动画、音色与主题色集合，二者不合并。

**建议本次保留两个稳定外部拼写：JSON 字段 `appearanceId`、资源 URL 前缀 `/appearances/`。** 它们分别是持久化字段名与既有资源命名空间，不再作为源码领域类型名。保留它们即可让已有浏览器草稿、gzip 分享链接和已导出的 JSON 原样工作，无须双字段、版本管理、数据库或 URL alias。不能以全仓 `appearance` 字符串归零作为迁移验收；有意保留的边界必须注明含义。

root 在派实施任务前只需明确这一边界取舍。若“统一”还要求改这两个外部拼写，下面给出影响与最小替代，但不在本只读任务默认执行破坏性变更。

## 已核对的实际状态与数据流

- 唯一源为 `design/appearances/manifest.json`，8 个稳定 ID；仅 coral-bob 当前有 animation。`name` 是预设名，不是故事人物姓名；`voiceId` 是已配置声音标识，不是管理凭据。
- 正式源规格 `manifest.types.ts` 中 `AppearanceManifestEntry/AppearanceManifest` 使用相对素材路径、必填 voiceId/四态；前端 `presentation/appearances.ts` 中 `Appearance/readAppearances` 使用站点 URL 与资源容错。它们是同一概念的制作源/运行时两层契约，不能为了改名把可空规则混成一套。
- 生成器 `scripts/appearances.mjs` 的 `syncAppearances` 从上述源生成未跟踪的 `apps/web/public/appearances/`；Web 的 predev/pretest/pretypecheck/prebuild 与 postbuild 均消费它。postbuild 检查 `dist/appearances`。
- `main.ts` 请求 `/appearances/manifest.json`，传 `appearances` 给 Application；Application 再给 App/Editor，并在解码分享时使用该表。`resolveVoiceId` 通过故事字段中的 ID 查相同预设。
- `CharacterDefinition.appearanceId`、`GameView.characters[].appearanceId`、`DraftCharacter.appearanceId` 是同一个引用值。controller 不含素材清单，只调用注入的 resolveVoiceId；voice 和 gateway 不认识 Appearance 类型或素材 URL，无须为改名调整供应商协议。
- `validateGame` 读取 `appearanceId`，缺失/空值规范化为 null。官方三案源与 public 副本、core/web 测试 fixture 使用该字段；编辑器试玩/分享另要求有效预设。`culpritId`、人物 id、姓名和 profile 与预设改名无关。
- `DRAFT_KEY = 'lie-editor-draft'`；`saveDraft` 直接 JSON.stringify，`loadDraft` 要求每个人物的 appearanceId 为 null 或 string。当前没有草稿版本号。
- `encodeGameLink` 先 validateGame 再把完整规范化游戏 JSON gzip/base64url 放入 `/play#game=...`；decodeSharedGame 先解压/validateGame，再验证非空 appearanceId 在当前预设表中。链接没有内嵌图像/动画 URL。
- 投稿 `prepareSubmission` 只导出相同 GameDefinition JSON 与 GitHub filename 链接。因此 wire 字段变化也会影响已下载/未来提交的案件 JSON；GitHub 投稿通道本身不用改。

## 建议的名字与路径清单

| 当前 | 建议目标 | 性质 |
| --- | --- | --- |
| `Appearance` / `readAppearances` | `CharacterPreset` / `readCharacterPresets` | TS 运行时展示契约和解析函数；字段/容错不变 |
| `presentation/appearances.ts` | `presentation/characterPresets.ts` | 内部模块路径；同步所有 web imports |
| `AppearanceManifestEntry` / `AppearanceManifest` | `CharacterPresetManifestEntry` / `CharacterPresetManifest` | 制作源契约；保持严格源校验 |
| `design/appearances/{manifest.json,manifest.types.ts}` | `design/character-presets/{manifest.json,manifest.types.ts}` | 移动唯一权威源，不复制第二份 |
| `design/appearances/assets/<id>/` | `design/character-presets/assets/<id>/` | 只移动清单引用的 8 个 ID 子目录，PNG/动画字节不变 |
| 当前正式源 README | `design/character-presets/README.md` | 新制作入口；旧目录仅留历史说明/指向新入口 |
| `scripts/appearances.mjs` / `.test.mjs`、`syncAppearances` | `scripts/character-presets.mjs` / `.test.mjs`、`syncCharacterPresets` | 源目录默认值改新位置，输出目录保持旧稳定 URL |
| `appearances:generate` / `appearances:check` / `test:appearances` | `character-presets:generate` / `character-presets:check` / `test:character-presets` | 内部 npm 命令；同步 lifecycle/root test/docs，不留不必要旧命令别名 |
| `packages/appearance-animation` / `@lie/appearance-animation` | `packages/character-animation` / `@lie/character-animation` | 用户已批准；工作区路径、包 name、UI dependency/import、锁链接一起改 |
| `appearances` prop/局部变量、`appearance()`、`currentAppearance` | `characterPresets`、`characterPreset()`、`currentCharacterPreset` | Vue/TS 内部；不要误改 serialized `appearanceId` |
| Editor `chooseAppearance`、overlay `'appearance'`、issue field `'appearance'` | `chooseCharacterPreset`、overlay/issue field `'preset'` | 内部 UI/定位状态；对应 data-field、测试和聚焦保持一致 |
| Editor `.appearance-grid/.editor-appearance` | `.preset-grid/.editor-preset` | 内部 CSS；只在 Editor owner 交付后迁移，不夹带布局改造 |
| UI 形象选择文案 | 人物预设 / 更换预设 / 选择人物预设 | 反映视听语义，不把故事姓名改成预设名；不新增选择能力 |
| `CharacterDefinition`、`AnimatedPortrait`、`AnimationPackage/AnimationState` | 保持 | 分别表达故事人物、展示组件、独立动画数据；不是待替换的 Appearance 领域类型 |
| 稳定 ID、`voiceId`、source 内 `assets/<id>/...` 相对值 | 保持 | 源根目录移动不要求重写这些相对字段，更不重生素材/改音色 |
| `appearanceId`、`/appearances/...`、`lie-editor-draft`、`/play#game=` | 保持 | 推荐方案的持久化/公开兼容边界；无 aliases/shims |

不要直接 `mv design/appearances design/character-presets`：旧目录同时含 state-studies、expansion-complete、diversity-studies、prompts 等历史记录。`assets/` 下还存在 **6 张平铺历史 PNG**，不是正式清单的第二份资源；README 头图可重建源 `design/brand/readme-hero.html` 正在引用其中 coral-bob/sunny-moustache/blue-glasses 三张。保留这些原始出处即可保留品牌重建能力，不因目录改名重画人物或重导 hero。正式子目录本次引用 35 张静态图 + 11 张动画部件 + 1 份动画包，共47个文件；旧 assets 总计53个跟踪文件，不能把6张平铺原稿误当待迁移的正式库。

## 一次可执行的实施顺序与所有权

这是一项跨接口但机械性的迁移，建议 **一个实施 owner** 持有下列源码命名改动，由 root 统一 review；不要把 App、Editor、入口类型、生成器各给不同代理同时替换同一接口。其他独立人物素材候选可继续，但不能在迁移期间并发激活源清单。

| 批次 | 具体文件/职责 | 所有权与启动条件 |
| --- | --- | --- |
| 0 | 确定保留 wire/URL；记录最新 reviewed base | root；等正在写 Editor.vue/css 与调查 style/CharacterChoice 的 owner clean handoff，先集成它们，避免凭本调查旧 base 覆盖 |
| 1 | 移动正式 manifest/types/8目录/制作README；改 generator/tests、root scripts、web package lifecycle、`.gitignore` 源注释 | 新命名实施 owner；旧公开输出仍 `/appearances/`，所以 `.gitignore` 的实际输出行不换 |
| 2 | 改前端展示模块/导出、main/Application/App/Editor/draft/share 的 imports、props/变量/内部定位字段；controller 仅必要术语注释/参数名 | 同一 owner；core 的 appearanceId 字段与验证行为、ControllerView wire 投影保持 |
| 3 | mv 动画 workspace，改包名/UI dependency/所有 import/export 与测试 fixture 路径；重建 lock 的 workspace link | 同一 owner；Node24.22.1/npm11，保留安全 overrides，不升级任何第三方包 |
| 4 | 同步活文档、活 preview 和测试、删除过期内部导出；运行全部检查 | 同一 owner；root 另做独立验收/集成，不能用字符串数量代替行为验收 |

批次1–3可以在一个隔离任务内完成并一起验证后提交，不应把半改名、不可构建的中间态送入 main。root 对最终 diff 指定唯一整合时机；后续两角色动画候选的交付需以新制作入口/包名为基准重新核引用，保持原图与 IDs。

### 实际消费者覆盖范围

- 根 `package.json/package-lock.json`，`apps/web/package.json`（5个生成 lifecycle），`.gitignore` 注释；CI 直接调用根 scripts，无须改 CI Node 或安全策略。
- `apps/web/src/presentation/appearances.ts`、`main.ts`、`Application.vue`、`App.vue`、`editor/{Editor.vue,editor.css,draft.ts,share.ts}`；`application/controller.ts` 如做术语注释仅改相应局部，不能改语音逻辑。
- `packages/appearance-animation/**`、`packages/ui/package.json`、`packages/ui/src/components/AnimatedPortrait.vue`、`packages/ui/test/animated-portrait.test.ts`；包内 src 的 type-only import/契约相对路径无需机械改类型名。
- `scripts/appearances*`，web 的 `appearanceManifest.types.ts/appearances.test.ts` 可重命名，`animated-game.test.ts`、`staticContent.test.ts`、`presetVoices.test.ts`、`thirdCaseContent.test.ts` 直接读源/生成物或导入类型；其他 App/controller/navigation/editor/transcript tests/helpers 的 props/import/局部名一并跟进。
- 正式说明 `README.md/README.zh-CN.md`、`docs/architecture.md`、`content/games/README.md`、`docs/animation/{contract,production-workflow,coral-game-integration}.md`、源制作 README。`AGENTS.md`/`docs/project-plan.md` 由 root 原位同步，不授权实施 owner 顺手改协作规则。
- `spikes/animation-preview/Preview.vue` 当前确实 import 旧包/readAppearances 并 fetch 稳定公共 manifest；应更新 import/变量，URL按本方案保持。其他仍在使用的独立 chat/候选预览，由 root 告知其 owner 新包与源根目录，不改其已 handoff 分支。
- 设计历史/旧 proposal/来源绝对路径/过去部署记录保留原名与原始陈述，必要由入口 README 链到新规范；不批量重写历史截图或 provenance。可接受历史文档仍出现旧名，不产生第二份权威清单。

## wire 字段和公共路径若也改，实际影响是什么

### 字段：不是纯 TS rename

将 `appearanceId` 直接替换成 `characterPresetId` 会破坏已有数据：loadDraft 现有逻辑会拒绝缺旧字段的草稿；validateGame 对不认识的新字段不会报错，而会规范化 appearanceId 为 null。反过来，新校验器只读新字段时，旧分享也可能静默丢失预设，而不是显式迁移成功。声音/头像都会受影响，故事姓名与正文虽仍在，却不能算兼容。

若 root 确认也改字段，最小额外工作只能是 **两个入站边界的旧键读取**：core `validateGame`（覆盖旧官方 JSON、旧分享与导入）和 Editor `loadDraft`；都规范化为唯一新键 `characterPresetId`，此后 UI/draft保存/share编码/投稿只写新键，不双写、不版本树。新/旧键同时出现且不一致应显式拒绝，不猜谁优先；null、缺失、空串的原校验含义保留。`DRAFT_KEY` 保持，否则旧草稿变不可发现。官方三案源和public副本、fixtures与内容字段文档必须一并改，并保留旧格式兼容测试。这是小但真实的长期兼容承诺，不能伪装成“零兼容代码”。

旧应用解析新分享可能丢掉预设；没有服务器协商可保证已打开旧标签自动升级。因此生成新格式链接应在统一上线新解析器后，或接受旧页面需刷新这一边界。推荐本次不承担这项不必要的 wire 变化。

### 路径：与草稿兼容是两回事

把 `/appearances/` 改为 `/character-presets/` **不会直接改变** gzip JSON或草稿（它们只存ID）。但必须同时改 source generator 输出目录/严格 animation URL 检查、main manifest fetch、首页3张图、测试assert、`.gitignore`、postbuild `--output dist/...`、运行中 preview/静态设计稿的硬路径；旧标签/缓存JS/外部引用的新请求可能404。历史原型可以保持历史而不长期提供旧alias，但仍在给用户看的预览必须由其 owner补新提交。

如果确需改，采用一次切换、只维护新路径，不重新引入先前已移除的 publicDirectory/publicAvatar 或多URL alias。生成器现有“删除输出目录内陈旧文件”不会自动删除另一根目录：应处理自己生成过的旧 `public/appearances`（先确认 ignored 生成物），防止旧目录混入 dist 造成假兼容。考虑这些额外成本，本轮建议保持既有公开前缀。

## 自动校验与验收清单

1. 先保存8个条目的 ID/name/voiceId/accent、静态/动画源hash与输出 URL/字节快照；移动后逐项完全相等。不得因命名变化增减正式人物、激活两个候选或重绘图片。
2. 按旧 `lie-editor-draft` 键准备基线完整/未完成/null/失效预设草稿，用新代码 load/save 验证文本、答案和 ID不丢；失效ID仍定位选择，不自动换人。推荐方案应无需迁移任何数据。
3. 保存旧编码器生成的真实 gzip fragment fixture，用新 decodeSharedGame 打开、验证 IDs/voice lookup；新编码器仍写相同 appearanceId。避免只测“新编码→新解码”而漏掉历史输入。
4. 运行生成器的确定性/缺失/坏路径/陈旧输出/PNG字节/动画契约测试；运行独立动画、core、voice、controller、Editor/navigation/share、UI回退/reduced-motion测试与全仓 typecheck/build。
5. 新clone在无 public 生成物时 `npm ci` 后根 type/test/build及直接workspace命令能生成；postbuild确实按权威源检查最终dist。README里的新命令可执行，不保留两套源/两套生成器。
6. 比较lock：仅workspace link/名称和UI本地 dependency 改动；两套Undici7.30.1、Zod4.6.6、jsdomUndici8.12.3和Node24.22.1要求保持，不顺手升级外部包。
7. 检索当前源码/活预览旧类型、旧包、旧模块路径应无残留；appearanceId、稳定/appearancesURL和明确历史记录列为允许项。分别搜 exact identifier，禁止全局无区别替换。
8. 最后IAB检查首页/编辑器8预设名/旧分享/旧草稿、三案静态人物与顾遥四态/回退/音色ID解析；无真实mic或付费供应商。独立视觉布局owner已改内容不在此任务回退。

建议执行检索（只读，实施时基于当时最新base重跑）：

```sh
rg -n 'Appearance|readAppearances|syncAppearances|@lie/appearance-animation|presentation/appearances' apps packages scripts
rg -n 'design/appearances|scripts/appearances|appearances:|test:appearances' package.json apps/web/package.json .gitignore README* docs/architecture.md docs/animation content/games/README.md
rg -n 'appearanceId|lie-editor-draft|/appearances/' apps/web/src packages/game-core/src content/games
```

本调查未运行生产测试或浏览器，因没有生产变更；已实际读核心验证/草稿/分享/声音解析/生成器/动画桥与消费者，并核清单8ID、三案3/4/4人物、source/URL边界。正式迁移仍需新任务、最新reviewed base及上述行为回归，不把本清单当实施已完成。
