# Run 01 云端/产物 driver 方法归档

状态：**历史方法，窗口已释放，不可重放**。实际turn为2026-11-01 07:24:30–07:44:30 UTC，07:42:14已收尾。下列命令是已执行调用的脱敏保全，不含任何secret值、author或完整云响应；不是新的执行授权。实际helper/Node API身份见[回执](release-ops-run-01.md)。所有CLI stdout/stderr当时写0700状态根下0600日志，未提交原log。

固定执行路径：

```sh
export PATH='/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin':"$PATH"
LIE_CF='/Users/nighca/.codex/worktrees/b1b9/lie/node_modules/.bin/cf'
LIE_RELEASE_STATE='/Users/nighca/Library/Application Support/LIE/voice-device-release/2026-11-01'
```

## 旧产物

最初`gh api repos/nighca/lie/actions/artifacts/13068829177/zip`向状态根old.zip下载，进度较慢；原session48259 Ctrl-C退出后停止该下载，无存活gh/python子进程。partial由本owner保留为`old.download-partial.zip`，不当成验证产物。

随后root明确批准从下面**唯一指定源**只读复制：

`/Users/nighca/.codex/worktrees/lie-share-release-integration/lie/tmp/share-release/ci-artifact.zip`

复制至状态根old.zip，自己验证113388669bytes与SHA256 `f35109580ebadfd16bf555b0ac04ed3e82163fdafab73b63ac07603e66d07ee5`；ZIP条目拒绝绝对路径、`..`、反斜杠及symlink后解至fresh old-unpacked。没有修改/删除源ZIP，也没扫描其他tmp路径。

复用本repo已审函数实际执行：

```js
import { restore } from './scripts/ci-release.mjs'
const root = '/Users/nighca/Library/Application Support/LIE/voice-device-release/2026-11-01'
await restore(root + '/old-unpacked', root + '/bridge/.cloudflare/output', {
  repository: 'nighca/lie',
  sha: '98d71fb9ebc2f517010598c4796c8db3014a73c7',
  runId: '41270879240', attempt: '1',
})
```

实际receipt/lock/256files逐字验证通过；不是从旧SHA rebuild。

## 私密准备与bridge

父review修正行替换/部分失败恢复后，实际执行：

```sh
node docs/reviews/device-concurrency-2026-11-01/release-ops.mjs prepare --approved-20261101
```

结果仅输出`backups:true, distinctSecrets:true, secretBytesValid:true`。local-config/local-restore均未执行。prepare读取白名单管理key、原配置/plist作opaque备份，生成两独立签名secret和临时production-additions.json；不修改目标配置。

CLI driver用Python subprocess捕获所有输出至0600日志。桥之前有限GET`workers deployments list --worker lie-game --per-page 1`核原deployment/100%旧version；初次driver误读JSON的`result`键而KeyError停止，发生在dry-run/上传之前。修正为实际`deployments`字段后重新只读核对通过。

以下各versions create均cwd为状态根bridge；dry-run通过后另一次实际调用，未自动反复重试：

```sh
"$LIE_CF" workers versions create --prebuilt --mode production --worker lie-game \
  --secrets-file "$LIE_RELEASE_STATE/production-additions.json" \
  --tag cookie-config-bridge-20261101 \
  --message 'Old verified code and assets; add Cookie Device secrets' --dry-run
# 实际上传：相同参数，去掉--dry-run；subprocess timeout180s，exit0。
```

返回`V_BRIDGE=3e83c77c-85f8-40b8-abe7-6ce0340513a7`。GET其metadata，仅过滤并保全binding name/type，确认旧Agent/Device/WS及新增API_KEY/COOKIE_SECRET共5个secret names，不保留author或值。再核旧active未变。生成0600 bridge-100.json：

```json
[{"version_id":"3e83c77c-85f8-40b8-abe7-6ce0340513a7","percentage":100}]
```

先dry-run，再另一次实际激活（timeout60s），均exit0；不使用bypass/force：

```sh
"$LIE_CF" workers deployments create --worker lie-game --strategy percentage \
  --versions "@$LIE_RELEASE_STATE/bridge-100.json" --dry-run
# 实际激活：相同参数，去掉--dry-run。
```

只读核active为bridge后，对正式origin GET旧固定Web asset、health与status。hash/长度/结果见回执；没有游戏load/prepare/WS/provider。

## 候选上传超时

cwd专项apps/gateway，使用已审c9d237 clean build，未传secrets-file，继承已激活bridge的同组secret。先dry-run exit0，再一次真实upload：

```sh
"$LIE_CF" workers versions create --prebuilt --mode production --worker lie-game \
  --tag cookie-device-candidate-20261101 \
  --message 'Reviewed c9d237 Cookie Device candidate; no traffic activation' --dry-run
# 唯一实际upload去掉--dry-run，subprocess timeout120s。
```

真实upload超时，subprocess停止，未回可用ID/URL。**无重复upload、无candidate激活。** 桥activation已核后，inactive upload与正式旧asset GET并行；两者的先后如实保留，不改成串行成功叙事。

本次tag的两次有限reconciliation：先`workers versions list --worker-id lie-game --per-page 5`仅过滤精确tag；后在“继续一次有限核对”指令下已发起`--per-page 100`（实际41条），随后“不要再追加metadata”消息到达，已发起请求完成后不再查询。两次均无精确candidate匹配；这不证明远端绝无创建，状态始终uploadunknown/无可用URL。末次同批GET active仍bridge，未读取modules/secret值。

## 收尾

状态根内精确删除本次临时production-additions.json；保留两个独立signing恢复源、原vars/plist before备份，权限0600。以private byte equality核目标vars/plist均与before相同，仅输出布尔值。没有执行job bootout/bootstrap、local-config、API executor或Node provider命令。ps有限匹配本次tag/driver/download/API命令，无存活owned进程；不kill未知PID，不操作用户服务。结果写私密window-01-summary.json（未提交）。
