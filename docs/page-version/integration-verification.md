# 页面版本标识：集成静态复验与最终构建门禁

2026-10-30（Asia/Shanghai）；独立验收 owner `session_limit_acceptance`。本记录在最终构建之前提交，避免新增验证文档把生产版本标识变成dirty。最终clean构建的实际SHA、产物哈希与结果另报总协调并留在ignored日志，不通过追加本文件制造新版本循环。

## 候选与静态审查

worktree：`/Users/nighca/.codex/worktrees/lie-version-integration/lie`；branch `codex/lie-version-integration`。起始main为`95cb5cf`，源码提交`efdc96f102346e750f41965a21ede4c0435f9c0e`已cherry-pick成候选`0d7d2caf0ddbf33fb4a991be2a18a24f270b83f5`。本轮不操作refs/main/push，不修改应用。

实际diff核对：候选apps/web与源efdc96f无差异；gateway、voice、workflow与main95cb5cf无差异；锁文件未变，SHA256仍为`2efd70fe940997ce63746a05a6d5574974560a67d6a737f4801e9f9e254e82e0`。

已审查readPageBuild、Vite定义注入、Application首页挂接、PageVersion原生details/summary与选择文本、环境类型和相关测试；未发现阻碍集成的问题。Git HEAD从实际构建目录读取，不采用手填版本或浏览器运行时查询；tracked/untracked非忽略改动会显示本地改动。Git不可用时展示未知，DEV展示开发版，不冒充发布SHA。仅在首页footer展示短hash，展开完整hash，并明确只代表当前页面构建。

CI保持既有checkout→安装→types/coverage→build链；浅克隆也能rev-parse当前HEAD，不需要tag或历史推断。既有生成资源、coverage、图片缓存等均为ignored。标识在Web构建时固定，不是实时服务器版本或自动刷新保证，也不代表网关独立版本。source追加交付文档不改运行代码时，不需重做相同静态检查；若源码变化则重新核对影响。

## 实际独立检查

- Node.js `v24.22.1` / npm `11.19.1`；候选独立`npm ci --ignore-scripts`成功（217 packages、0 vulnerabilities），无复制或软链其他WT的node_modules。TMPDIR/cache/logs仅在候选ignored`tmp/page-version-integration/`。
- `npm run typecheck --workspace @lie/web`通过，包含8预设121资源生成。
- `npm test --workspace @lie/web -- test/page-version.test.ts test/navigation.test.ts`通过，2文件14项；版本Git夹具只在本WT临时目录。
- `git diff --check`通过。
- 图片缓存复用前，逐文件SHA256核对前一已验收候选与本WT的127份tracked图片输入/工具文件全部相同；复制后逐文件核对166份ignored缓存文件全部相同。只复用内容寻址图片缓存，未复用node_modules、Web dist或Worker产物。最终构建仍由本候选重新执行。

未启动浏览器或应用服务；源owner负责5544原生391/1280验收，本轮不与其竞争该资源。本记录的静态检查不能冒充源原生验收已经完成。

## 最终clean构建步骤（尚待执行）

1. 等总协调审查源后续交付与中央文档并全部提交，收到精确最终candidate SHA。
2. 独立检查HEAD精确相等，`git status --porcelain --untracked-files=normal`为空；之后不再修改任何tracked文件。
3. 在该clean HEAD执行根`npm run build`，完整生成Web＋gateway，检查121资源strict校验。
4. 从实际dist入口读取生产JS，核注入commit等于上述完整最终SHA、dirty=false；记录入口路径及SHA256，核版本文字/折叠组件仍在且DEV诊断和QA夹具标记未进入产物。
5. 单独读取实际Worker生产配置，确认`VOICE_MAX_SESSION_SECONDS`仍为text字符串`600`；核结束HEAD未变、Git状态仍干净。
6. 验收结果只报总协调/存ignored日志，不再编辑本记录或其他tracked文件。若失败，停止交付并报告，不带未验证版本更新main。

本记录不表示最终clean构建、main集成、push或线上版本已完成。无真实语音、provider/账号/部署操作，没有触碰5176/5544/5198/8787/8788。
