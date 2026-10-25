# q90 / CI-CD首次发布核验

2026-10-25，root普通push成功后只读确认远端main为 `297666a69286e067d4a28135f9331ef4bd5f7726`。**代码已推送，但CI失败，CD跳过；本轮未部署线上。** [精简实际证据](verification.json)保留run/job及失败数据；没有复制认证头、凭据或一次性完整日志。

## 首次触发与实际结果

仓库只读API确认default_branch=main。GitHub[官方workflow_run文档](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run)规定文件须存在默认分支；本次push同时带入CD后，实际[CD40165091706](https://github.com/nighca/lie/actions/runs/40165091706)确已由workflow_run产生，证明首次注册不需要另一轮单独推送。它因上游失败按门禁skipped，deploy job没有steps，没有绕过或手工兜底。

[CI40164981567 attempt1](https://github.com/nighca/lie/actions/runs/40164981567)的checkout/setup/npm ci/cache、CI交接17项及workspace typecheck成功；失败在step8 `Test with application and separate script coverage`。应用57files中56通过/1失败，573tests中572通过/1失败。错误为：

```text
apps/web/test/page-title.test.ts:28
uses the formal brand before JavaScript is loaded
ENOENT: no such file or directory, open 'index.html'
expect(readFileSync('index.html', 'utf8'))...
```

`scripts/coverage.mjs`明确以仓库root为cwd启动多项目Vitest；该新测试依赖cwd在apps/web，因此独立Web334通过而覆盖率入口失败。本批最小修复新增 `import { URL as NodeURL } from 'node:url'`，测试使用 `readFileSync(new NodeURL('../index.html', import.meta.url), 'utf8')` 按模块位置取实际HTML；不改产品、删断言或放宽CI。初稿直接用global new URL在浏览器/Vite环境触发 `URL must be of scheme file`；最终NodeURL别名沿用现有文件读取测试约定，两个入口均通过。需root审查后正常发布新提交，不能重跑不变SHA期望消失。

CI未走到build/上传verified产物，Linux图片工具/产物交接/真实CD部署仍未验证。部署后HTTP探针因此未执行，避免把旧线上当本轮新成果。最后已证部署仍48316544，未在此失败后重新采集线上版本，不以远端main=297当Worker已更新。

## 复用与边界

静态Git核对297与已测746718a的apps/packages/scripts/.github、package/lock及canonical assets/manifest零差异；本地334/80/24/17/types/build、195文件pack→restore与隔离dry-run仍按[组合证据](../../performance/image-build-optimization/combined-main-verification.md)保留，不能代替CI coverage入口。GitHub connector本轮404，改用既有gh只读REST/failed-step日志；无新登录/secret读取。

本批仅一项测试路径修复及失败/验证文档，独立branch `codex/published-q90-ci-cd-verification` 从发布297开始；原CI设计ref90c冻结。无workflow trigger/rerun、push、手工Cloudflare部署、账号操作、浏览器/端口/麦克风或provider调用。准备的有限HTTPS探针待成功部署后执行：首页/editor/官方案query、HTML实际JS/CSS及当前hash manifest/WebP MIME/cache/SHA；不把HTTP200等同真人游戏验收。

## 修复实际验证

Node24.22.1/npm11.13.0，既有同锁依赖，无安装。真正从仓库root执行 `npm run coverage` 完整成功：57test files/573应用tests、33原生脚本tests；覆盖应用52source files，行1743/1817（95.92%）、脚本275/300（91.67%，独立分母）。coverage sample诚实记录source297、dirty=true、采样2026-10-25T05:22:05.037Z（采样时测试/docs尚未提交），不伪称发布SHA已远端通过。

Web workspace执行单文件page-title20tests及Web typecheck通过，8preset/89assets生成正常；没有其他同类路径失败。改动仅测试，不改变构建输入，复用先前真实Web/Gateway构建/产物验证，无重复编码或浏览器。CI/CD文件、产品、资源和lock与发布297相同，待root实际review/正常新push后再次监测真实CI/CD及线上静态资源。
