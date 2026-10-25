# 2026-10-25 第四案发布验收

本目录归档发布 `5a9a31c26b1e8f7be57b4147c2886b785b052111` 已完成的必要脱敏证据。归档没有重跑网络、构建或部署。[结果摘要](result.json)记录身份、实际范围和限制。

[CI 40176764338](https://github.com/nighca/lie/actions/runs/40176764338)和[CD 40176928339](https://github.com/nighca/lie/actions/runs/40176928339)均attempt1、completed/success。[CD步骤](cd.json)的唯一deploy job `121119503254`全部成功，包括精确上游产物验证、latest main/CI attempt检查及实际Deploy。

[产物元数据](artifacts.json)与[部署摘录](deploy-evidence.txt)证明产物 `12592966238`来自本SHA、CI run、attempt1，下载digest `a48c132ba25d7af4a40bbbd07449edd4954aaa81d7f1f88d72fe729c4da345b4`验证成功，恢复256个已验证文件。Worker版本为 `b1866411-b431-4f59-80f1-a6bd0f9e6eed`。

[线上证据](online.json)仅有正常TLS首页及其JS两个GET。`/assets/index-CRRGYc8t.js`包含`hackathon-old-project`、标题「这真是今天做的吗」和完整手写简介，SHA256 `641ceb42be4cc78f0330ae4ba269c435608162c2e003d9b0766ec6e0e0fa054f`与已审第四案源构建一致，MIME与immutable缓存正常。[探针](static-probe.py)保存实际检查逻辑；重放会请求网络，检测的是当时目标指纹，不应把未来线上响应覆盖成旧证据。

本次跟进没有新增本地构建、浏览器、真人游戏、voice/API/WS或供应商验证，没有rerun、手动部署、权限或服务修改。静态一致性与部署成功不表示真人推理体验已验收。没有读取或修改其他owner工作树；使用root已审源构建指纹作线上字节比对，不把旧dist当新产物。

六份证据来自owned WT的 `tmp/hackathon-case-release/`，逐字节复制。未归档完整原始job日志、认证环境/headers、下载URL、缓存或凭据，仅保留公开标识、必要脱敏部署摘录与静态摘要。由root随下一正常设计批审查集成，不为报告单独发布。前次[人物加载发布证据](../2026-10-25-portrait-loading/README.md)保留独立版本身份。
