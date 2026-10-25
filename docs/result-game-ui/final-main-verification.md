# 正式结果最终主线组合验收

2026-10-25，借root冻结WT `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`、branch `codex/integrate-result-game-final`。base为实际main `b3874d9f3ddd7a9d7ac91e380bed10f9c55bc3dd`；原候选 `cb2d96838bfdf9a904f7658e811deb68b0656ccd`；补测试后的被测HEAD **`ab7a3e1b66998f6180156f63647f98a1701a5938`**。root另行实际review/ff；未main/push，线上仍[a64](../releases/2026-10-25-q90-ci-cd/success.md)。

有序候选：`3224400d392820e45b9fcd186b27814e4a8b3f63` → `9dfdcaefeec75783df59a7199b31acbf8a4ba2a1` → `3449b242e44f9413536b8f9c716151b124122198` → `4ce9d871e9d741bea345b77387fb150170ddd6d3` → `7930a32c0383a3c3c7498313dbc4c287c456f4ea` → `cb2d96838bfdf9a904f7658e811deb68b0656ccd` → `ab7a3e1b66998f6180156f63647f98a1701a5938`。最后一项是本轮root授权的单独测试修复，无runtime/产品变化。

## 实际执行与发现

Node24.22.1/npm11.13.0、既有同锁依赖。首轮完整root coverage **577/579，56/57files**：`packages/character-animation/test/animation.test.ts`两旧夹具断言失败（11assets变13；canonical已有结果态，使“不可用结果态”不再抛错）。源parent只重跑Web340且以旧runtime未变复用，未发现canonical输入依赖变化；此次完整检查捕获，不把它写成纯产品bug。

root审原测试后授权最小修复：`fixture()`明确schemaVersion1及四基础states，保留源全部assets/clips/nodes；首测验证assets完整同source，四态/听臂断言保留。`reactionFixture()`再自行添加正确结果mapping，错误mapping初始不存在；拒绝/预算契约未放宽。补后同SHA完整root coverage **57files/579应用tests＋33脚本tests成功**，其中Web36files/340。行覆盖应用1749/1823（95.94%）、脚本275/300（91.67%，独立分母）；sample为ab7、dirty=false，2026-10-25T05:49:02.755Z。

CI17 guards、全workspace types、真实Web/Gateway build通过；Web100modules、Gateway4＋fallback2modules，strict **8preset/121assets**。候选先核source d7工具/helper/policy及82缓存records与各WebP hash再只读copy：锁定cwebp/dwebp分别`07ba910950253f18ca227d085848ff39be530f6ef22005e778cd48d4850734f2` / `7b341872a316596df8e517b6d5b1bcb9e2ca6b6489521d328f2db38d22881ca6`；q90-m6-alpha100-icc-v1，实际0encoded/82cache/0preserved，无下载/安装。Vite underline.svg runtime URL warning保留，文件实际存在；不称warning-free。

## 身份、资源与复用

- App/style/animated-game test及canonical manifest与源 `d7dd95afa00f6782b41771f573878efbf558996d`逐字节相同；全apps/packages/scripts/.github/lock/canonical差异仅保留main的Editor文案/3断言、NodeURL修复和本轮明确的animation测试夹具修复。Editor/其测试及page-title test逐字节同baseb387。运行时公共姓名/height/loading/preview门禁未被覆盖。
- activation `verify.py`本轮实际通过，40项source-identity SHA均核；81旧PNG/声音/旧四态保留。真实新构建8包由runtime parser读取、62parts由实际PNG/WebP header reader核尺寸；16结果静态＋16新增part为WebP。[实际激活结果](final-activation-checks.json)。
- 124个static文件hash全部同源d7实际dist；254个Web文件与Worker assets逐字节一致，无QA/fixture/design/docs入口。manifest为`21d97c04ac9d87fa58636a243fef27e6cf52b19537aeb83c93efe48d5d1096ff`。[完整构建身份](final-build-identity.json)记录254SHA/113,195,838B；不把总dist体积混成仅WebP体积。
- [独立activation审计脚本](activation-audit.py)/[原结果](activation-audit-result.json)已核读原样归档：40文件/source73身份、manifest仅两结果字段、81PNG/声音/旧态、各包像素预算及严格121。该child未build，本轮上项实际构建补上闭包；不重复1936采样或Canvas艺术末帧审核。
- 源[真实App/391/reduce/失败/preview验收](browser-acceptance.md)及统一八人gallery按相同App/style/canonical/124static身份在其原范围复用。本候选Editor两文案差异由全coverage包含；不是本候选新浏览器/GPU、真人provider或线上部署验收。此前45dc只读架构审查无确定阻塞，错指无真相、实际被指认者及一次播放/静态回退边界保持。

## 服务与交还

本轮无listener/browser/端口动作，source WT/dist/deps未改。owner回执旧5355 PID1851在PTY55257 exit130后无listener；现同5355 `/Users/nighca/.codex/worktrees/result-reactions-combined-qa/lie` PID37202/PTY40865保留用户统一页tab60，启动f294＋built QA修订、最终source d7；仅127.0.0.1，LIE_RESULT_QA_BUILT_ASSETS=1。tabs61/62关，block/media/vision/viewport覆盖复原；试玩留下空盒案草稿，未删用户数据。保留消费者结束后由owner原PTY停止并核listener。本轮不据历史退出记录关服务，不archive源WT，不动8787/8788。文档追加后clean交回root，root仍唯一integrator；无服务/长检查尾项。

## 用户统一验收补记（2026-10-25）

用户在动画专项chat `01a16d44-aeea-7552-b184-5118072e75f3`、turn `01a17245-f3cd-7660-a896-bdb53e8677f5` 明确确认已在统一检查页看过8个角色的两种新状态，没有问题。root已独立读取直接用户消息；据此将本批 accusedCorrectly / accusedWrongly 图片与动画记为用户视觉验收通过。它们已随既有成果集成发布，不重复制作/合入或扩大为真人语音/全设备验收。5355统一检查页继续保留，不因已通过而擅自停服务。
