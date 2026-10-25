# 编辑器人物姓名唯一校验

2026-10-25。用户在稳定版探索 QA 的 LIE-QA-002 后明确选择“编辑器要求姓名唯一”。本记录是实施与验证交付，不代表已合入 main 或发布。

## 行为

- 草稿可临时重名，照常自动保存和恢复，不打断编辑。
- 现有编辑器校验在试玩、分享（以及复用同一校验的投稿准备）前拒绝重名。错误为 `人物姓名“小林”重复，请使用不同姓名`。
- 每个重名人物各生成一条 `step: 1 / field: name / characterId` 问题，复用现有错误摘要和定位机制；点击第二条会选择第二个人物并聚焦其姓名。
- 比较时对姓名使用现有 JavaScript `trim()`；`小林` 和 ` 小林 ` 判为重名。只比较去首尾空白后的原字符串，不扩展为大小写折叠、Unicode归一化或内部空格合并。
- 空姓名仍走原必填提示，不为两个空姓名额外显示重名错误。改为不同姓名后重复问题即时消失，试玩/分享恢复。
- 比较不修改作者输入；可播放快照继续保留既有的姓名原文行为。
- 通用引擎、案件契约、分享编解码、历史分享包及正式资源均未改。旧分享包存在同名时仍能打开；本次新增约束只在编辑器草稿校验层。

## 实现与所有权

基线 `03fcb06b40ad9dc85ce92af5c1dd6723afc10d4a`；独立 worktree `/Users/nighca/.codex/worktrees/editor-unique-names/lie`，branch `codex/editor-unique-names`。旧探索 QA 的 `0a25d05c0aee251f8fa19ece73b40328155dd68e` 保持冻结。

- [draft.ts](../apps/web/src/editor/draft.ts)：先统计 trim 后姓名次数，再在既有逐人物校验中给每位重复人物产生 name issue。
- [草稿测试](../apps/web/test/editor-draft.test.ts)：持久化重名草稿、边界空白、改名恢复、两组重复的四个定位、空名必填、旧同名分享包可读。
- [独立组件测试](../apps/web/test/editor-unique-names.test.ts)：分别实际挂载 Editor，触发试玩/分享，验证拒绝、错误摘要、切换/聚焦两个重复字段、aria-invalid，以及改名后事件/分享弹窗恢复。

未修改 Editor.vue 或它原有的 editor-page.test.ts，避免与人物清单恢复专项的所有权重叠。没有新接口、额外状态、服务或存储迁移。

## 实测

Node24.22.1/npm11；使用原 package-lock 离线安装，未升级依赖。

```sh
npm run test --workspace @lie/web -- test/editor-draft.test.ts test/editor-unique-names.test.ts test/editor-page.test.ts test/editor-sharing.test.ts test/editor-navigation.test.ts test/character-preset-compatibility.test.ts
npm run typecheck --workspace @lie/web
npm run build --workspace @lie/web
```

- 6个测试文件、59项测试通过，含两个新实际组件入口用例。
- Web类型检查通过。
- Web生产构建通过；postbuild校验8预设、89资源通过。
- 新增测试首轮误预期原有引擎会去掉姓名首尾空白，58/59；确认原有语义是保留原文后，仅修正测试预期，再执行以上6文件得到59/59。没有借此修改引擎或姓名内容。
- 文档相对链接、diff whitespace及最终文件范围检查通过。

本轮没有开任何dev server或浏览器tab；5544由清单恢复专项持有，未争用。以上UI证据为真实Vue组件＋jsdom事件/焦点测试，不冒充浏览器像素或真人语音验收。root可在两个修复组合后安排同源浏览器复验。本轮无设备/供应商/凭据动作，未修改8787/8788或其他专项服务，无需服务清理。
