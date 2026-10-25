# a0e 单JSON批次：发布证据归档

发布SHA `a0e1a326a08df47c44d28a6cd42c100996a6b599`。CI[40171557739](https://github.com/nighca/lie/actions/runs/40171557739) attempt1成功，CD[40171731533](https://github.com/nighca/lie/actions/runs/40171731533)最终completed/success；deploy job121103798852所有12个返回步骤completed/success。Worker版本`a1e6ed12-5aeb-4f97-a94c-5caa2f52c7c6`。

原始必要脱敏材料来自architecture专项`split-ci-cd-workflows/lie/tmp/single-json-release/`，此处按原bytes归档：[result](result.json)、[CI](ci-final.json)、[当时CD快照](cd-final.json)、[artifact元数据](artifacts.json)、[部署关键摘录](deploy-evidence.txt)、[线上静态检查](online.json)、[静态探针脚本](static-probe.py)。未复制完整日志、下载缓存、凭据、请求认证头或一次性资源。

**时间边界：** 原result/cd-final记录聚合in_progress/conclusion null，虽然当时deploy job已success。该返回是历史事实，原因未知，不能改写成当时已聚合成功。本归档轮独立只读`gh run view`确认了最终success，见[最终确认](cd-confirmed.json)；没有重试或触发workflow。

精确CI产物12590287145，digest `sha256:9f3be6a4194fd8fe64fe80709c300f2007227207f5670a2d83cd37d117a277d2`，来自上述run/attempt，CD恢复并逐字节核256文件。此数为部署artifact文件数；Web源验收的251文件不是同一集合，不混用。root已全文读原脚本/JSON并独立核八响应与本轮251源产物身份，又正常TLS GET首页/JS吻合；这些是既有root核验，本归档者未重跑线上探测/build/tests。

线上证据包括home/editor/官方案query、JS、CSS、current manifest及两张WebP，共8个200响应，SHA相等；仅静态交付与cache/MIME，不等价于真实浏览器、游戏流程、mic/provider、盲测或多人验收。原探针输出后来由owner/root补充localCandidateEqual；脚本仅保留原网络采集逻辑，不冒称它自身计算了本地产物对比。

本发布包含正式八人结果激活/UI、CB01草稿保存保护、单JSON内置案与当时Hackathon14链。单JSON语义/验收见[实施记录](../../builtin-case-json-implementation/README.md)，正式结果见[最终报告](../../result-game-ui/final-main-verification.md)。新Hackathon平台定位修订由root另批审查，不在本归档中预宣称已发布。

政策：每次实际review/验证合main后由唯一root按仓库流程普通push，并监测既有CI/CD；报告放下一正常批次，避免报告循环。本次仅文档，未GitHub写/服务/新部署/账号操作。JSON解析/脚本AST/证据关联及链接检查通过。
