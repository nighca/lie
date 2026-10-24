# GitHub 原生投稿预填：浏览器实验

2026-10-24，Codex内置浏览器id3，**未登录**。仅GET页面和非敏感合成数据，未创建fork/分支/commit/PR，未登录、读取凭据、改可见性或使用Chrome。详细字段矩阵、官方来源与后续最小验证见[主文档实测章节](../../docs/editor-official-submission-proposal.md#2026-10-24-独立内置浏览器实测)。

| 观察 | 原生截图 |
| --- | --- |
| 私有目标仓、未登录404 | [查看](screens/private-404.jpg) |
| 公开仓短预填链接进入登录门槛 | [查看](screens/public-new-file-login.jpg) |
| 9280字节中文合成JSON，27334字符URL被明确拒绝 | [查看](screens/long-url-rejected.jpg) |
| 公开compare能查看差异，未登录无PR编辑表单 | [查看](screens/compare-logged-out.jpg) |

`short.json`与`synthetic-case.json`全为虚构测试，后者仅UTF-8字节数与首案9280相同，**不是首案正文或同等真实字符分布**，没有复制任何私有剧情到公开仓。`observations.json`保留实际访问短链接与compare链接、长度和边界。没有HTTP响应码证据，不把错误页写成414；不把return_to保留参数写成表单全文相等。

运行 `node spikes/github-prefill/verify.mjs` 可复核URL长度及本地编码全文相等。脚本不联网、不提交；本地round-trip测试不证明GitHub会填入编辑框。
