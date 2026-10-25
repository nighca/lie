# main里程碑发布核验 — 2026-10-25

用户授权“空了之后把当前main推到远端，这样正式环境验证”。root唯一publisher执行普通push：`abb12db..4831654 HEAD→main`；本reviewer只读核远端main确为 **`48316544ea9fd22afbf1eee8db6f81e326026821`**。owning main、远端发布与线上实际部署分别确认，本报告是发布后本地归档，不自动再次push。

## CI与实际部署

- [CI run40159380539](https://github.com/nighca/lie/actions/runs/40159380539)，event=push，attempt1，head_sha精确48316544；completed/**success**，API updated_at `2026-10-25T03:47:20Z`。
- job `121067525837`：npm ci、全workspace types、应用/脚本coverage、coverage上传、Web/Gateway build、prebuilt dry-run、latest-main检查、**Deploy verified production build实际执行**均success。部署step的if条件是`steps.latest.outputs.current == 'true'`，该条件下实际执行并成功确认latest=true；不把日志里打印的shell脚本文本当输出证据。
- 实际部署日志安全摘要：`Uploaded lie-game (5.75 sec)`，时间03:47:17Z；`Current Version ID: 2279b179-314f-4264-9ae9-6c67d0ef7c69`，03:47:18Z。未手工Cloudflare部署、重跑workflow或读取secret。
- GitHub connector查run返回404，改用既有gh只读API/日志。起初in_progress按有界30/45秒等待，无重试发布或猜测等待原因。无原始全日志、认证头/凭据入库。

## 线上静态指纹

核验时间 `2026-10-25T03:49:38.487144+00:00`，origin [lie-game.nighca.workers.dev](https://lie-game.nighca.workers.dev/)。只读GET首页及其实际HTML引用JS/CSS/logo、当前hash manifest，以下**每份响应body均逐字节等于最终aa6fc190构建的本候选dist**（48316544只追加已审文档，生产/依赖身份不变）：

| 资源路径 | HTTP / 字节 | SHA256 |
| --- | --- | --- |
| `/` | 200 / 546 | `d9841a11c0cf254cba0b3dc2843f48a249e46ebea9e22986eb4786766bea08cb` |
| `/static/162d54b712d988ecf64de7b9ea823c1186407f41b1be6be168698859e57221fb/brand/logo.svg` | 200 / 879 | `162d54b712d988ecf64de7b9ea823c1186407f41b1be6be168698859e57221fb` |
| `/assets/index-B_70PirB.js` | 200 / 221212 | `4833cfd46baec18e26c459a06114bb1fc760608fd2b021975ab3b05b77bab423` |
| `/assets/index-C856Qxrd.css` | 200 / 53819 | `3b99123f4b57f673806c27024c91b413c979ee499a8c06c7a299f587e06473ea` |
| `/static/a569fd2622d84c9b584c1b7fbc3aa2182a07e7a3b438033f2780c77bb3f58a29/appearances/manifest.json` | 200 / 7657 | `a569fd2622d84c9b584c1b7fbc3aa2182a07e7a3b438033f2780c77bb3f58a29` |

首页Content-Type=text/html、`Cache-Control: public, max-age=0, must-revalidate`；其余SVG/JS/CSS/JSON类型正确、均`public, max-age=31536000, immutable`。CSS含真实`.background-character-name`的`margin-inline:.12em`；预设去名/可访问名、RSM修复等由精确JS产物身份与[本地288项组合检查](../editor-state-recovery/combined-verification.md)对应，不冒称HTTP触发了交互测试。

初次系统Python urllib因本地CA证书链查找失败未取得响应，随后用curl默认TLS证书验证完成，无`-k`或证书绕过。首次额外CSS值断言误写.08em，已根据实际已审源码改为.12em后通过；body身份此前已一致，不归为线上缺陷。

## 范围与后续

此次发布包含已审动画/缓存/内容/改编/Editor状态恢复与两项小UI；只证同SHA CI实际部署与线上静态交付，不等真人mic/provider、长会话、GPU/帧率、浏览器点击、草稿或多用户隔离验收。本轮无浏览器、服务/端口操作、voice/API/WS请求，不碰用户草稿/8787/8788。source浏览器未归因MutationObserver异常仍见原实施限制，未声称修复。

发布后新任务不在此SHA：调查连接提示loading动效在制；用户已在动画专项批准R结果辨识/指认表情方向及分阶段生产，source1c354425待root全文review入库，契约/珊瑚样片在制、具体样片用户验收另记。它们不改变本次核验目标或追溯发布结果。鉴权/视频/付费门禁不变。本报告及中央状态更新只交root审查归档，本轮不再push/部署。
