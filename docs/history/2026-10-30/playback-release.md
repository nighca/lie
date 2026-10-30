# 100ms起播缓冲与连续调度：发布核验

2026-10-30（Asia/Shanghai）。总协调完成实际diff审查与独立组合验收后，将用户批准的100ms起播缓冲及消除分片人为gap组合合入 main 并普通push，确认发布提交 `95cb5cf02277a5c3f380d0a18158d3672a9bfcdd`。本证据随下一次正常工作批归档，不另作报告提交循环。

| 证据 | 实际结果 |
| --- | --- |
| [CI 41046222803](https://github.com/nighca/lie/actions/runs/41046222803) | 精确完整headSha为上述提交、attempt1、success；types、coverage、build、production dry-run、打包及上传均实际通过。 |
| [CD 41046380232](https://github.com/nighca/lie/actions/runs/41046380232) | 同一完整headSha、success；精确CI产物检查、下载、restore、latest guard及deploy步骤均success，部署非skipped。 |
| 产物身份 | CI attempt1 artifact `12971858538`，名称 `production-build-95cb5cf02277a5c3f380d0a18158d3672a9bfcdd-41046222803-1`；下载digest `sha256:1348bc58ed248667e88a6d1b3a185c0e32619f1926d39ffc601c9ee52fac09ce` 匹配，restore校验256文件。 |
| 部署 | 使用该完整提交 `git-…` tag 的prebuilt部署实际执行；日志确认 `VOICE_MAX_SESSION_SECONDS ("600")`。Worker版本 `597aa83d-8b31-4564-a7f4-c16e2345d872`，北京时间2026-10-30 19:12:49完成。 |
| 正式页面身份 | 普通TLS GET首页实际引用 `/assets/index-JyPHfPjh.js`；脚本239769 bytes，SHA256 `9b3feb93e4fa4256be304f6dd3bd57cefe26c1c3566f8f9a9dac36414b0497b7`，与已审构建一致。首页、脚本和 `/api/health` 均200、TLS校验通过、0重定向；health为 `{"status":"ok","storage":"none"}`。 |

[组合验收](../../voice-playback-smoothness/integration-verification.md)确认全部types、voice54/Web目标34/gateway34及完整build通过，源与候选生产JS相同。首播及真实耗尽恢复使用100ms PCM储备和单一有界timer；连续排队不逐片插gap，短尾flush，打断/close立即清理。DEV数值诊断默认关闭，不加淡出或Worklet。

此发布输入与线上脚本身份不等于真实声音验收。未执行真人provider、麦克风、手机/外放或长会话实测；48k接缝异常及真实爆音仍未全闭环，600秒绑定也不能证明所有实际连接可持续10分钟。用户后续持续问答约179秒中断及专项CPU超限日志线索另列当前队列，尚未关联用户并确认根因，不能被本次发布成功覆盖。

只读发布跟踪没有修改文件/refs、再次push、手工部署、启动服务或调用provider。[100ms实施及边界](../../voice-playback-smoothness/prebuffer-implementation.md)；此前[600秒上限发布](voice-session-limit-release.md)证据继续保留。
