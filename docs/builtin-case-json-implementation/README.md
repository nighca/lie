# 单 JSON 官方案件实施与验收

2026-10-25；基线 `4b3aa05562c9356cfac5293de60960c25df0400b`。用户明确批准「案件json就按上面我们最后讨论的结论推进吧，你说的点我没有问题」。[原提案和最后建议](../builtin-case-json-proposal.md)及[投稿历史提案](../editor-official-submission-proposal.md)全文保留；本文记录本轮实现，不表示已合入、推送或部署。

官方唯一源为 `content/games/NN-<id>.json`。纯 TypeScript `readOfficialCases` 统一执行文件命名、正安全整数数值排序、重复前缀/ID、ID一致和非空简介校验；Vite 构建插件先读正式目录校验，浏览器 eager glob 生成同一目录与开局内容。插件按自身模块 URL 定位源目录，测试或调用者改变 Vite root 不会改变内容来源。core 新增纯内容子导出供 Node 构建校验使用，不引入 Vue、DOM 或宿主依赖。删除独立 catalog 和 public/games 副本。

三案仅改文件名并移入原卡片手写 summary，内部 ID、人物、故事、时长不变。Editor 故事步骤可填写简介，draft/预览/export/压缩分享/remix 保留；旧草稿缺字段补空，旧分享继续接受缺字段，空简介不阻止试玩/分享。官方目录与投稿要求非空。投稿建议当前最大数值前缀+1，至少两位、支持100；仍由作者在 GitHub 网页确认，同号由维护者合入核对，没有分配服务或自动 PR。保留非有限时长保存 guard 和限定保存错误 notice 的既有行为。

## 实际检查

Node 24.22.1 / npm 11.13.0，既有依赖无安装或 lock 变化。

- 完整 root coverage：596 应用测试、33脚本测试通过，53生产源文件进入分母；应用行95.95%，脚本行91.67%。Web 单独37文件356项、core52项也通过。没有用历史 fixture 探针代替修复回归。
- workspace typecheck 通过；真实 Web/Gateway build 通过，Web100模块、Worker4模块、fallback2模块；strict8包/121资源。最终构建0编码、82缓存命中。首次构建因本WT无缓存编码82项；未改其他WT。
- [单文件探针](single-file-probe.test.ts)实际使用 Vite glob、Application/Home、真实 controller：仅添加 `100-single-json-proof.json` 即出现卡片和手写简介，点击进入保持原内部ID的路由并开局；最大序号建议101，无 fetch/语音。使用[独立小型临时案](single-file-fixture.json)，结束删除正式目录里的临时文件，最终仍只有三案。
- 实际加入 `001-single-json-proof.json` 重复01前缀后 Vite build exit1，报 `01-empty-medal-box.json: duplicate numeric prefix 1`；移除临时文件后正式三案构建通过。普通测试还覆盖非法命名、不安全序号、重复ID、文件ID不符及缺简介、2/10/100数值排序。
- [只读审计](verify.py)与[结果](identity.json)：三案除 summary 外深度相同，原简介逐字相同，保护路径资源/动画/voice/lock逐字节相同，Web输出与Worker assets逐字节相同，静态引用闭包存在，无QA或案件JSON副本进产物。旧历史 golden fixture 不改，缺简介兼容断言显式记录规范化空值。
- 活跃供应商 spike 仅迁移路径并执行 `node --check`，未运行真实供应商探针。文档本地链接和 diff whitespace 已检查。

首轮发现并修复：构建插件原先依赖 Vite root 导致 main-preview 临时root测试 ENOENT；现改模块URL定位，脚本33项复验通过。最初4条旧兼容断言未预期恢复后的 summary 空值，修正断言且保留旧fixture字节。coverage最后分母审计曾因新源文件未stage而拒绝；登记文件后用同次全量通过的采样重新执行报告成功，未放宽检查。

## 重放单文件证据

在仓库根目录，先确认 `content/games/100-single-json-proof.json` 不存在；复制本目录 `single-file-fixture.json` 至该精确路径，运行 `node node_modules/vitest/vitest.mjs run --config docs/builtin-case-json-implementation/vitest.config.mts`，然后删除该临时文件。不要覆盖已有同名文件。该人工集成探针不加入普通suite，避免正式三案之外常驻测试案。`python3 docs/builtin-case-json-implementation/verify.py` 在正式构建完成后重放身份审计。

## 限制

没有新的浏览器或真人供应商验收。浏览器inventory只有Chrome扩展，无IAB；遵循要求未回退Chrome、未创建tab/服务。组件集成证明功能，不声称原生布局或真人行为验证。root coverage 自有测试会短时启动其既有临时安全测试服务并自行关闭，没有新增开发服务或触碰稳定端口。

Vite当前构建成功，但提示两个新增extensionless TS config imports在未来 native configLoader不受支持；当前锁定Vite loader可用，未为未来版本更改编译策略。已有underline.svg静态URL解析提示仍存在。未触发远程CI、推送、PR、Cloudflare操作或部署；合入由root实际审查执行。
