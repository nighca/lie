# PR4 CI 的超限上传 EPIPE 调查

2026-11-01；仅调查归档候选，未修改共享实现、原测试、用户PR或main，未运行provider/云写。本归档记录专项获准重试的结果，不另授权重试、部署或代码修复。

## 已确认事实

[PR4 CI41312338210 job124865150864](https://github.com/nighca/lie/actions/runs/41312338210/job/124865150864) 在 `apps/gateway/test/shared-games.test.ts:101` 唯一失败。恰好1MiB请求在上一行已成功200；超出1字节的第二个 `Miniflare.dispatchFetch` 抛 `TypeError: fetch failed`，cause `write EPIPE`，尚未取得Response供原413断言检查。其余75files/760tests通过，不能将此写为徒步内容断言失败。

main `35e987a7516493dcdccb8392cb8817f3b82744e4` 的 [CI41310357616](https://github.com/nighca/lie/actions/runs/41310357616) 已成功。该main与PR4 head `b80dfcc03c9eb67ac4b9d9f452e5bbe083546e0b` 的gateway、game-core、lock及coverage配置diff为空。相关SHA256：

| 文件 | SHA256 |
| --- | --- |
| `apps/gateway/test/shared-games.test.ts` | `32a7c4ae75498bef4999c949833d3977218fc91040be5aa52518a15e552f7967` |
| `apps/gateway/src/shared-games.ts` | `393f6f7dcfac53334899d6d0366d481410b99180713b853bfb359dba0faec500` |
| `package-lock.json` | `b28f328a0807b38833ba62f860871d29625689aab1cc6223d898c4c62531b277` |

## 机制判断与未证明部分

原测试dispatch helper先将Request转完整ArrayBuffer，Miniflare再经本地HTTP/undici上传给workerd；它不是直接在同一JS栈调用handler。实际 `readContent` 对已知超限Content-Length立即返回null，业务层可在上传尚未完成前生成413；无Content-Length或虚假长度另有逐chunk计数/取消的直接单测。

该路径与“服务端提前响应、客户端还在写socket”出现EPIPE的机制相符。[Node官方issue54366](https://github.com/nodejs/node/issues/54366) 有同类报告，只作机制佐证，不是本次Miniflare版本已确诊证据。日志没有记录本次Worker是否确实生成/发出413；不能声称该因果已实际抓到，也不能将网络错误直接当413通过。

生产handler/大小限制没有本次源码回归证据；现有证据更支持Miniflare/undici上传传输的间歇性失败，但并未排除共享测试fixture或runtime缺陷。测试里exact200的body未显式消费也值得将来独立核查，当前没有证明它导致这次EPIPE，不据此改实现。

## 本轮独立有界实验

方法：[transport.mjs](transport.mjs)；实际结果：[transport-results.json](transport-results.json)。独立managed诊断WT基于35e987a，使用独立offline npm ci --ignore-scripts依赖；Node24.22.1、Miniflare5.20261019.2-beta、undici7.30.1，darwin arm64。没有重复源owner正在跑的原singlefile/fullsuite。

一个toy workerd、无provider/R2/secret绑定，只发送八个本地已知1048577字节请求：三次提前413，三次读取完固定大小测试体后413，两次direct binding提前413。8/8均取得413，Worker计数8请求/8响应；**本机未复现EPIPE**。读完测试体仅是有界toy对照，不是生产端无限drain上传的修复建议。方法没有修改或替代原1MiB/+1断言，也不证明真实线上上传合同。

如未来单独获准复验，从仓库根、已安装锁定依赖运行 `node docs/reviews/pr4-ci-epipe-2026-11-01/transport.mjs`；会创建临时本地Miniflare监听，finally dispose，不做网络provider/云写。此次已执行完，不为归档再次执行。

临时parent PID66194、已知runtime入口127.0.0.1:58092；finally dispose后原命令exit0，精确ps66194及lsof58092均空。没有停止用户端口/服务；不将已知入口核空冒称扫描了所有未知内部PID。原始临时结果另存ignored tmp，必要方法/结果以本目录保全，不包含secret、Cookie或用户故事。

## 其它证据层与恢复路径

源owner经总协调回执：同Node24.22.1/Vitest5.0.5/Miniflare5.20261019.2-beta、darwin arm64，原shared-games单文件9/9通过（3.76s），原coverage配置下仅该文件9/9通过（737ms）；后者0/0 coverage不能当全套coverage通过。其test/handler/lock身份与上述一致。此为源owner回执，不冒称本调查者重新跑过。

总协调最终回执：首次且唯一 `--failed` retry 的 [CI41312338210 attempt2](https://github.com/nighca/lie/actions/runs/41312338210/attempts/2) success，[publisher41312905401](https://github.com/nighca/lie/actions/runs/41312905401) 实际Preview部署success；head仍为 `b80dfcc03c9eb67ac4b9d9f452e5bbe083546e0b`、base `35e987a7516493dcdccb8392cb8817f3b82744e4`、受测merge `3831f8fa54e5b723f3e5ca124a4791136e9fe1ab`。GitHub deployment `7473884244`，artifact `13086620385`，digest `sha256:d9ac7c77b4749a0e9b8ce39ae8553744be31fe94ec4d4de78ebc5a06672eb8ca`。这是专项完整跟踪后由总协调转达的结果，本调查没有再次查询、rerun、dispatch或部署。

本次保留全部断言/guard，同精确代码的完整CI重试及实际Preview均已成功，门禁已恢复；没有证明EPIPE根因或完成共享代码修复。若未来复现同错，优先另建Linux/CI等价的有界传输观测，明确handler生成413与socket写错误先后，再讨论fixture/runtime修复。禁止靠catch EPIPE当413、放宽断言、跳过测试或无界读完攻击体掩盖问题。现阶段无需将共享产品代码修改设为徒步PR的必经修复。
