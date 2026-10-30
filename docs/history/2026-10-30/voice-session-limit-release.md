# 可配置600秒语音连接上限：发布核验

2026-10-30（Asia/Shanghai）。总协调审查后，将调查及已批准的方案B实现合入 main，并普通 push；确认发布提交为 `a742b1ecbe2a6227d53958ed3275a9f4089c5b96`。本记录随下一次正常工作批归档，不单独触发报告发布。

| 证据 | 结果 |
| --- | --- |
| [CI 41031475179](https://github.com/nighca/lie/actions/runs/41031475179) | 精确完整headSha为上述提交，attempt1、success；typecheck、coverage、build、production dry-run、打包上传步骤均实际成功。 |
| [CD 41031654559](https://github.com/nighca/lie/actions/runs/41031654559) | 同一完整headSha、success；精确CI产物检查、下载、恢复校验、部署前latest guard及实际部署步骤均success，部署未跳过。 |
| 精确产物 | CI attempt1的 `production-build-a742b1ecbe2a6227d53958ed3275a9f4089c5b96-41031475179-1`，artifact ID `12965054097`；下载digest `sha256:d385cf5405d0870b29de0a0dd3a49ad032722e8279446688de07a3f3f2f8611f` 匹配，恢复校验256文件。 |
| 实际部署日志 | `--prebuilt` 部署使用完整提交的 `git-…` tag；日志直接列出 `env.VOICE_MAX_SESSION_SECONDS ("600")`。Worker版本 `082b7ad7-16dd-4c43-bec5-bd35d2f1f2c2`，北京时间2026-10-30 17:12:25完成。 |
| 正常TLS只读GET | `https://lie.agency/` 与 `/api/health` 均200、TLS校验通过、0重定向；health为 `{"status":"ok","storage":"none"}`。只证明响应可用，不能由页面JS或health反推网关timer值。 |

计时仍从relay创建开始、包含准备阶段，与游戏共享询问预算独立。生产绑定由部署日志和已核构建产物证明；未进行真实provider、麦克风或600秒长会话验证，不承诺provider/网络不会提前断连。有限单连接上限不等于累计费用封顶。

只读跟踪没有修改refs、再次push、启动应用服务、真实provider调用、账号配置或手动部署。[实现与边界](../../voice-session-limit/implementation.md)及[集成复验](../../voice-session-limit/integration-verification.md)。
