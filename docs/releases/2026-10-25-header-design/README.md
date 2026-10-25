# 2026-10-25 头部设计归档批发布验收

本目录保存发布 `0abc82d1acdfbaedab19888cd94ac5eaad166ab1` 已完成的必要脱敏证据。该批仅设计提案和文档，正式头部未修改；提案入库不等于产品实现或用户批准。应用、内容、脚本、workflow、package/lock及character-presets运行源相对第四案发布 `5a9a31c26b1e8f7be57b4147c2886b785b052111`无差异。归档时不复跑网络或构建，不发起新部署。

[CI 40177361453](https://github.com/nighca/lie/actions/runs/40177361453)及[CD 40177506678](https://github.com/nighca/lie/actions/runs/40177506678)均attempt1、completed/success。[结果摘要](result.json)记录范围；[CD步骤](cd.json)中唯一deploy job `121121289792`全部成功，包括精确上游产物验证、latest main/CI attempt检查及真实Deploy。

[产物元数据](artifacts.json)和[部署摘录](deploy-evidence.txt)证明产物 `12592222833`属于本SHA、CI run、attempt1，下载digest `3106d614aa1269ae6a5398903e9a982d088fb2f02aaec8dfe692320ddc570e71`验证成功，恢复256个已验证文件。Worker实际版本为 `01ee0776-6218-45d8-84c3-28a226f0ec87`，无未知的聚合状态。

[线上摘要](online.json)只记录正常TLS首页与其JS两个GET；`/assets/index-CRRGYc8t.js`的SHA256仍是 `641ceb42be4cc78f0330ae4ba269c435608162c2e003d9b0766ec6e0e0fa054f`，MIME及immutable缓存正常。[探针](static-probe.py)复用第四案的精确指纹与案件文案检查；它验证运行版本未变，不验证头部设计已经落地。重放会请求网络，不应将未来线上结果覆盖成此历史证据。其余已有资源验收复用[第四案发布证据](../2026-10-25-hackathon-case/README.md)。

没有重建、八资源重复请求、浏览器、真人游戏、voice/API/WS或供应商验证；没有rerun、手动部署、服务或权限操作。六份证据来自owned WT的 `tmp/header-design-release/`，逐字节复制。未归档原始完整job日志、认证环境/headers、下载URL、缓存、凭据或用户浏览器inventory。仅保留公开标识、必要脱敏部署摘录和静态响应摘要，由root随下一正常批审查集成，不为报告单独发布。
