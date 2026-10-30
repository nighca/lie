# v1.0.0 发布记录

2026-10-26用户明确要求发布v1。[正式Release](https://github.com/nighca/lie/releases/tag/v1.0.0)已发布，非draft/非prerelease；远端tag精确指向 `f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`，main当时相同。未修改应用或手工部署。

此前该提交的[CI40197058052](https://github.com/nighca/lie/actions/runs/40197058052)与[CD40197191660](https://github.com/nighca/lie/actions/runs/40197191660)均attempt1/success，root读全部必要记录：[result](result.json)、[CI](ci-final.json)、[CD](cd-final.json)、[artifact](artifacts.json)、[部署摘录](deploy-evidence.txt)、[运行身份](runtime-identity.json)。artifact12600168036 expected/actual SHA256一致，CD恢复256文件，Worker9acfdca6-45f1-4e15-ac5e-10d48e90f266。未独立下载ZIP；运行对象与713相同，复用其TLS/27项标题检查，不冒充新线上浏览器验收。

本记录随下一正常工作树清理资料补存，不将归档提交当v1标签源码，不为报告单独反复发布。
