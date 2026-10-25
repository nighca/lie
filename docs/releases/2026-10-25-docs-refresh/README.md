# 2026-10-25 文档批发布验收

发布提交 `9e1c998ae4f44a32f0dc72e3f6fdd496ddec69f3`，与上一发布 `a0e1a326a08df47c44d28a6cd42c100996a6b599` 的 apps/packages/content/scripts/design/workflows 及 package/lock 输入恒等。本目录保存已完成检查的必要脱敏证据；归档时没有重跑网络或构建，也没有发起另一次部署。

[CI 40174362619](https://github.com/nighca/lie/actions/runs/40174362619) 和 [CD 40174509906](https://github.com/nighca/lie/actions/runs/40174509906) 均 attempt1、completed/success。CD唯一deploy job `121112187640` 实际部署成功，Worker版本 `b6cf1433-58cd-4190-8676-0b8477d14385`。本次平台聚合状态已完成，不沿用上一轮的聚合滞后状态。

- [结果摘要](result.json)记录发布身份、范围与限制。
- [CD步骤](cd.json)记录精确SHA及全部实际成功步骤，含latest main/CI attempt检查。
- [产物元数据](artifacts.json)及[部署摘录](deploy-evidence.txt)证明本SHA、CI run、attempt1对应产物 `12591562243`，下载digest校验通过，恢复256文件后部署；不是重建或替换成其他main。
- [线上静态证据](online.json)只包含正常TLS首页与其JS两次GET，字节与本轮已验证构建一致；其余静态资源验收复用[a0e发布证据](../2026-10-25-single-json/README.md)。[探针](static-probe.py)可审阅；重放会请求网络，且要求当前本地 `apps/web/dist` 身份与被测发布一致，不能用任意新构建冒充历史结果。

未进行浏览器、真人试玩、voice/API/WS或供应商请求；没有rerun、手动Cloudflare部署、服务启动或账号配置写入。未归档原始完整job日志、认证环境/headers、下载URL和临时缓存。保留的内容仅为公开run/job/产物标识、必要部署日志摘录及无凭据静态响应摘要。证据来源为owned WT的 `tmp/docs-refresh-release/`；本目录是其必要持久副本，后续可随正常功能批集成，不单独触发发布。
