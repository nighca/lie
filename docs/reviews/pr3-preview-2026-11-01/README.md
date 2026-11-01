# PR3 文件名与 Preview 修复证据

2026-11-01；来源：总协调委派、用户经 Chat `01a196c0-41a3-77e6-a323-0763c478c018` 的实际授权和执行回执。此目录是后续正常批次的归档候选，不授权再次推送、部署或合并 PR。当前 PR 仍 OPEN，`[DO NOT MERGE]` 保留。

## 授权与最终选择

1. 最初仅只读排查 CI 邮件；后用户明确授权按案件实际 ID 修正文件名。总协调实际核对后，执行纯 100% rename，并普通 push 原分支 `nighca-patch-1`。
2. rename 的 CI 成功，Preview 在 select 阶段出现独立身份失配。调查阶段只读、离线复现，未 rerun、未改共享发布流程。
3. 用户随后要求解决 Preview，并优先提出同步最新 main。先报告普通 merge 与 rebase 的差别及不确定性；没有擅自重写用户提交。
4. 用户最终明确授权普通 merge 最新 main 到原 PR 分支并 push。总协调实际 review 合并候选后给 push GO；自动 CI 和实际 Preview 均成功。没有 rebase、force push、合并 PR、编辑标题/正文/labels 或修改共享发布流程。

## 事实与来源

完整公开身份投影：[evidence.json](evidence.json)。不复制故事正文或原始凭据上下文。

| 阶段 | 提交 / merge | 实际结果 |
| --- | --- | --- |
| rename | `0aace235cb354f0b833c5369190582a1e1b6adf8` | 0 内容增删；blob `8157f8db62d1f1e111d62d975a4c5513ef0efe74` 不变；本地既有内容校验 2 files / 12 tests 通过 |
| rename 后 CI | `af4e4fe15758512c49343561a073f804bfc232c3` | [CI 41301208031](https://github.com/nighca/lie/actions/runs/41301208031) verify/gate success；[publisher 41301344598](https://github.com/nighca/lie/actions/runs/41301344598) select failure，未上传 |
| 普通 merge | `d67d69ccc916fe64ea9cf3bb4e8ce4f8a1b38ed8` | parents 为原 PR `0aace235…` 和 main `1e881802…`；无冲突；相对 main 仅用户案件文件；内容 blob 不变 |
| 同步后 CI | `c60da48cec7b8ebc07f0bf88e5a1452d86354cac` | [CI 41302052728](https://github.com/nighca/lie/actions/runs/41302052728) verify/gate success；打包 head/base/merge 与真实 merge parents 一致 |
| 新版 Preview | 同上 merge | [publisher 41302167123](https://github.com/nighca/lie/actions/runs/41302167123/job/124835294235) receipt 校验、上传、HTTP smoke 和 publish 均 success；部署 `7472389265` 于 `11:31:21Z` success |

新产物 `13082041632` 的 digest 与 GitHub deployment payload 一致。稳定入口为 [PR3 Preview](https://pr-3-lie-pr-preview.nighca.workers.dev)，本次确已更新，未使用旧版成功状态冒充。

版本专属 URL 仅写入 job summary，公开日志/API 未提供其具体文本；没有为取链接扩大云管理查询。成功部署路径包含返回 URL 与精确 deployment metadata 校验，但本归档不补造 URL 或声称做过独立 immutable GET。

## 旧 base 失配机制与局限

失败时 PR API、CI 事件和 producer 输入的 base 均为 `f504e1acc1044f58c5b455daeb62b96fa5b9047c`；它也是当时 PR 与 main 的实际 merge-base。受测 merge `af4e4fe…` 的实际第一父提交却为最新 main `1e881802…`，第二父提交正确等于 PR head。

固定源码锚为 default main `1e88180239684db1ef5d3bddde3375639ee4bec7`：

- `.github/workflows/pr-ci.yml` 的 `PR_BASE_SHA` 使用事件 `pull_request.base.sha`。
- `scripts/pr-preview-artifact.mjs` 的 `identityFromEnv` 将该值写入 receipt。
- `scripts/pr-preview.mjs` 的 `provisionalReceipt` 使用当前 PR API `base.sha`。
- `scripts/pr-preview-github.mjs` 的 `validatePreviewRun` 先比较 PR base 与 receipt，再要求实际 merge 第一父提交等于同一值。因此真实不一致输入稳定触发 `Preview is not the current PR test merge`。

截至 `11:24:47Z` 再次查询仍一致复现原数据，不能把它当作已证实会自行消失的短暂竞态；GitHub 为什么保留旧 base 的内部机制未确定，不视为官方合同。同步后 API/event base 实际更新到 `1e881802…`，本次成功说明普通 merge 足以解决当前 PR；未来 main 再前进时仍可能复现该流程假设。

[GitHub 官方事件说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request) 明确默认 PR CI checkout 测试 merge 分支，与本次日志一致。共享流程的候选长期修复是从真实受测 merge 提取 base，贯穿 receipt，并由 publisher 独立校验目标分支当前 tip、两个 parents、head/run/artifact 和部署前后 freshness；不能仅删除 guard。当前 checkout 默认 depth 1，若未来用 `HEAD^1` 则必须先解决浅克隆父提交可用性（例如明确 depth 2）。此方案未实施，不改变本次授权范围或当前代码。

## 离线复现

在含上述历史提交的 clone 中，使用 Node 24.22.1：

```sh
node docs/reviews/pr3-preview-2026-11-01/reproduce.mjs
```

无需 npm install、GitHub token、Cloudflare/provider、服务或浏览器。脚本仅 `git show` 固定历史对象，校验四个模块 SHA256 后在自有临时目录加载原样源码；fake API 不调用网络，`fetch` 被禁用，临时文件在 finally 删除。浅 clone 若缺该历史对象会明确失败，不自动 fetch。

四项实际通过：原样 prepare 重现失配且无 API writes；只改 receipt 仍 stale；producer 保留旧事件 base；原有一致身份对照成功。它证明校验机制，不证明真实云行为，也不模拟修复后的生产实现。

## 验证范围与保留边界

普通 merge 后本地既有内容校验 2 files / 12 tests 通过，diffcheck 与 clean 通过；全套验证使用本轮真实自动 CI，未为归档重跑。自动 smoke 仅 `/`、`/editor`、`/api/health`、`/api/voice/status` 四个有界 GET，不 prepare voice、不录音、不做 R2 写入或真人模型验收。没有证明案件对话体验。

main 始终保持 `1e881802…`；用户 PR 分支才更新到 `d67d69cc…`。本目录不含案件正文、Cookie 值、provider ID、认证头、secret/env dump、临时依赖或大 artifact。公开提交、run、artifact 与 GitHub deployment 标识保留用于追溯；不把 GitHub deployment ID 当作 Cloudflare deployment ID。原诊断脚本在临时目录的版本由本归档可移植方法替代，不作为唯一证据。
