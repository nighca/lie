# 低调页面版本标识：发布核验

2026-10-30（Asia/Shanghai）。总协调完成实际review和独立复验后，将页面版本标识合入main并普通push。精确发布提交为 `0d753ec74c03b9d35ae8505942ab56a5f02fa651`；本记录随实际断连调查归档批保存，不另开报告发布循环，后续归档提交的页面版本自然变化不改写本次身份。

| 证据 | 结果 |
| --- | --- |
| [CI 41050806049](https://github.com/nighca/lie/actions/runs/41050806049) | 精确完整headSha为上述提交、attempt1、success；types、coverage、build、production dry-run、产物打包上传均实际通过。 |
| [CD 41050950581](https://github.com/nighca/lie/actions/runs/41050950581) | 同完整headSha、success；精确CI产物、下载、restore、latest guard和deploy步骤均实际成功，部署非skipped。 |
| 精确产物 | artifact `12973879232`，名称 `production-build-0d753ec74c03b9d35ae8505942ab56a5f02fa651-41050806049-1`；下载digest `sha256:6329a5627043a0a3066f3ad8416ada4b35b695a85a8110607a706b955aff9b3a` 匹配，恢复校验256文件。 |
| 实际部署 | 该完整提交git tag的prebuilt部署执行成功；日志列出 `VOICE_MAX_SESSION_SECONDS ("600")`。Worker版本 `61a449e7-7997-4b33-8e34-295a02bd138a`，北京时间2026-10-30 19:50:56完成。 |
| 线上页面身份 | 普通TLS首页实际引用 `/assets/index-CboKEfYD.js`，脚本240736 bytes，SHA256 `0bd764925c24250a3e0d8c1975776aceb34379466c8c08fae5ad4f844759024f`，与本地最终clean build完全一致。线上JS仅一处build metadata，commit为完整 `0d753ec74c03b9d35ae8505942ab56a5f02fa651`、dirty=false。 |
| 可用性 | 首页、实际入口JS、`/api/health`均普通TLS200、证书校验通过、0重定向；health为 `{"status":"ok","storage":"none"}`。 |

页面右下低调原生details展示短7位hash，展开完整hash可选择；DEV/unknown/dirty诚实标记。仅表示页面构建版本，不能当gateway版本或真实语音已修证明。root Web类型检查、版本/nav14目标复验通过；源ownChrome在IAB不可用后实测391/1280，无横向overflow，mobile Enter展开、desktop click展开/Space收起，完整hash一致、user-selectall；未读写clipboard。相关[交付](../../page-version/README.md)与[集成复验](../../page-version/integration-verification.md)保留。

只读上线核验未打开浏览器、调用provider/mic、开启长语音、启动服务、修改refs、再push或手动部署。页面实际输入发布成功不解决CPU超限或保证连接持续600秒；固定597版本窗口的[断连运行证据](../../voice-disconnect-investigation/README.md)另行审查，未严格关联用户浏览器连接ID。
