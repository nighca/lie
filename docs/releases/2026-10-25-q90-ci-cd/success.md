# q90与独立CI/CD发布成功

2026-10-25：root正常push修复后的 **`a64bf6c1674b9755dbacc4d7519e92675ee5f4bf`**，只读再次确认远端main相同；[CI40165378030](https://github.com/nighca/lie/actions/runs/40165378030)及[CD40165634861](https://github.com/nighca/lie/actions/runs/40165634861) attempt1均实际success，正式入口 [lie.agency](https://lie.agency/) 静态指纹已更新。[结构证据](success.json)、[8次HTTPS结果](online-static.json)、[探针](static-probe.py)。旧297的[失败/修复记录](README.md)保留，不能把旧failure当本轮状态，也不抹去首次漏测。

## 真实交付链

- CI17项guard、workspace types、完整coverage573应用tests/57testfiles及33脚本tests、Web/Gateway build、strict89、prebuilt dry-run、pack/upload均成功。应用行95.92%（1743/1817）、脚本独立分母91.67%（275/300）。Linux-X64首次构建真实50encoded/0cache/0preserved，随后cache保存成功，不再仅本机macOS证明。
- 精确artifact `production-build-a64bf6c1674b9755dbacc4d7519e92675ee5f4bf-40165378030-1`，ID12588780677、ZIP77,403,693B、digest `sha256:4197a4617daed1d7bfe4514aec36c8cfaf51982d8c3dc9a6471aef17e78f10e2`；metadata同main/head SHA/run，repository/headRepository ID均1430668532、expired=false。ZIP大小不混成本机195文件内容大小。
- CD job121085989436实际checkout a64；download日志确认artifact12588780677及run40165378030；receipt恢复195 verified files，部署前latest-main/attempt复核成功，step9 `Deploy the verified CI build`实际success。Cloudflare日志给出Current Version ID **`dabb77da-39b5-4b69-bf90-bddbced1628e`**，不是只有green run或dry-run。
- 上游CI `head_sha`与CD API `head_sha`此次均a64；工作流签出/receipt/tag使用上游SHA。GitHub `workflow_run`的`github.sha`语义是默认分支latest，并非通用的上游SHA；此次两者一致，job未单独打印该环境变量，不能把本次当成不同SHA场景的远端证明。不同SHA拒绝/精确上游使用仍见本地guard tests。CD未重做build/test/编码，仅同锁CLI安装及同一产物部署。

## 正式域名静态核验

正常TLS、无凭据8次GET：首页、`/editor`、`/?game=duck-finale`均200 HTML546B，未重定向；JS `/assets/index-C7s2itfc.js` 225,401B及CSS `/assets/index-BL6zBtBy.css` 54,973B均200、immutable。实际JS引用currentmanifest `30a60c…`，8presets JSON7,697B，URL SHA与内容SHA相等；coral avatar/default均200 `image/webp`、RIFF/WEBP头及140,386B内容SHA与hashURL相等，缓存`public, max-age=31536000, immutable`。HTML为max-age=0/must-revalidate。

**全部8份响应body SHA逐项等于已实际验证候选746的对应index/JS/CSS/static文件hash**，因此不仅HTTP200；本轮发布相该候选的运行时代码/资源/依赖相同，仅测试修复与docs/design追加。数据完整SHA见JSON，不重复图像或请求全部资源。

首个Python urllib请求因本机issuer CA解析失败，未降低证书校验；改用系统curl正常TLS成功。这里没有浏览器交互、Editor操作、真人mic、API/WS或provider调用，不能替代这些验收。未新启listener、未动5355/8787/8788或用户存储。只读gh监测，无dispatch/rerun、手工部署/账号修改或secret读取。

报告在独立branch `codex/deployed-q90-ci-cd-verification` 从发布a64追加，原cd344交付ref冻结。本提交是发布后本地归档，root另行review/集成，不自动二次push触发部署。
