# 独立线上语音试玩资源

用户授权暂时停用应用鉴权并在线上启用真实语音；本脚本只准备灵矽专用资源，源码由root review后才执行setup。Cloudflare配置、部署和是否对外分享由root负责，本脚本不调用cf，不更改应用鉴权。

`apps/gateway/scripts/linx-preview-resources.ts` 固定创建1个 `LIE-online-preview-*` generic agent和1个随机专属设备。系统提示与本地 `linx-check.ts` 完全相同，使用默认模型选择、不指定音色、不应用失败沉浸候选；Memory_nomem、history=0、disable_greeting、max_tokens=160和禁搜索沿用本地配置。只调用管理API/OTA，不建立WSS或推理。1device不是已验证的多人并发方案，线上此阶段供用户独立试玩。

## Root review后的执行

```sh
node --use-system-ca apps/gateway/scripts/linx-preview-resources.ts --setup --key-file /Users/nighca/code/nighca/lie/.linx-api-key
```

key只在原文件读取到内存，日志仅操作/状态码/无记忆配置，不打印凭据。以下都在已有Git忽略的 `apps/gateway/tmp/`，文件0600：

- `online-preview-state.json`：此脚本专属所有权与恢复状态，必须保留以便后续清理，不能交给浏览器。
- `online-preview-secrets.json`：仅 `LINX_WS_TOKEN`、`LINX_DEVICE_ID`、`LINX_AGENT_ID` 三项字符串，供root的 `cf --secrets-file` 上传。没有管理API key或VOICE_ACCESS_TOKEN。

本任务worktree中的绝对目录为 `/private/tmp/lie-shared-ui-kit/apps/gateway/tmp/`；如果root在别的worktree执行，以该执行脚本的位置为准。不要输出文件内容、提交、复制到静态assets或把路径当成公开URL。

setup完成后资源为用户线上试玩保留，**不自动cleanup**；不使用本地8787/5188的agent、设备或状态。重复setup最多恢复本脚本同一个agent/device，不生成第二套；配置阶段确认后不反复修改配置。创建或绑定发出前保存attempted状态，若成功与否未确认，拒绝盲重建/绑定，应检查所有权后处理。网络/TLS失败时保留状态，只重试经确认安全的恢复阶段，不重跑推理。

## 显式退出试玩后清理

先由root停用/撤下对应线上语音凭据，避免浏览器仍在使用；本脚本不替root操作Cloudflare。

```sh
node --use-system-ca apps/gateway/scripts/linx-preview-resources.ts --cleanup --key-file /Users/nighca/code/nighca/lie/.linx-api-key
```

只解绑该state所记录的独立device、删除独立agent、删除匹配agent/device的专属secrets-file及state。没有state时不创建新state或资源；发现前缀/数量/文件所有权不一致或未确认绑定即停止。部分清理失败保留已成功阶段和剩余所有权，排查后只重试cleanup，不移除用户其他资源。清理不代表供应商历史日志被立即删除。

## 验证状态

脚本静态syntax、提示逐字对照、ignored路径检查通过；尚未执行setup，未创建供应商资源。实际执行后由操作者另记安全计数，不把setup成功当作真实语音或多人隔离验收。

2026-10-24 root已逐行review后在 `/private/tmp/lie-integrate-text-architecture` 执行setup：create/configure/read/bind均HTTP200/code0，Memory_nomem/history0，1设备完成；实际私密state/secrets位于该worktree的 `apps/gateway/tmp/online-preview-{state,secrets}.json`。root核对三字段非空且0600，并确认agent/device均与本地环境不同；资源为线上试玩保留，不自动清理。此时尚未部署/推理，后续结果另记。

## 正式地址验证（2026-10-24）

源码c8f3d24已发布并部署，Worker version `aadc9f53-59ba-4c48-8b76-12b67322d735`。线上 `/api/voice/status` 返回ready，不需要应用Cookie；部署的是独立线上资源三项secrets，静态包扫描未发现其值。

Root使用既有试听探针的有界逻辑，经 `wss://lie-game.nighca.workers.dev/api/voice` 只发正确Origin、不发供应商或Cookie凭据；一次本地合成PCM问题获得hello、tools/list、一次context、一次STT/TTS start-stop和129帧PCM，固定中文句匹配，2.58秒音频。安全计数结果见 `../spikes/voice-audition/results-online-preview.json`；没有真人收音，不宣称整合版真人或多人验收。1agent/1device仍为当前受控预览资源，访问与限额正式方案未实施。
