# 2026-10-25 人物加载占位发布验收

本目录归档发布 `2268f84f02576d4384f0d30f9f117a70164f135a` 已完成的必要脱敏证据。归档时不重跑网络或构建，不触发另一次发布。[结果摘要](result.json)记录身份、实际范围和限制。

[CI 40175520817](https://github.com/nighca/lie/actions/runs/40175520817)与[CD 40175677095](https://github.com/nighca/lie/actions/runs/40175677095)均为attempt1、completed/success。[CD步骤](cd.json)中的唯一deploy job `121115703645`全部步骤成功，包括精确上游产物校验、latest main/CI attempt检查及真实Deploy。

[产物元数据](artifacts.json)和[部署摘录](deploy-evidence.txt)记录产物 `12591569308`，来源SHA/CI run/attempt与本发布一致；下载digest `e653654827373600a362d6c048ea6ca8c7322fc3d321672ebec47d5b9d28a063`验证成功，恢复256个已验证文件。Worker实际版本为 `45919e35-3bf2-4a33-a550-199c0d18ceaf`。

[线上静态证据](online.json)只有正常TLS首页与其新JS两个GET：新资源 `/assets/index-BMjLEyzW.js` 的SHA256为 `72d64451370afa0be147b035d2ee5d100b26f7d47344affc5c1c06dbf603ffb9`，包含「人物加载中…」及`portrait-loading`，MIME与immutable缓存正常。[探针](static-probe.py)保存实际逻辑；重放会请求网络，且检测的是当时目标版本，不应把未来线上结果覆盖成历史证据。

没有使用旧dist作当前版本比对，没有本地重建或新增浏览器、真人试玩、voice/API/WS及供应商验证。没有rerun、手动部署、服务启动或权限/账号配置修改。此证据证明实际部署与静态版本，不证明真人游戏或GPU呈现。

来源是owned WT的 `tmp/portrait-loading-release/`，六份证据逐字节复制；没有归档完整原始job日志、认证环境/headers、下载URL、临时缓存或凭据。这里只保留公开run/job/产物标识、必要脱敏部署摘录及静态响应摘要。合入由root审查，随正常功能或设计批归档，不为报告单独触发发布。上一轮文档发布证据见[归档入口](../2026-10-25-docs-refresh/README.md)。
