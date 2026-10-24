# 2026-10-24 调查页与动画里程碑：线上持续部署验收

目标提交：`32d89bf91f441168148884593a0f49b816ad7162`。正式站点：[LIE](https://lie-game.nighca.workers.dev/)。本次独立核对 GitHub 实际运行、Cloudflare 当前活动流量版本和公开 HTTP 资源；未触发部署、重跑 workflow、修改凭据或推送代码。

## GitHub Actions

[CI push run 40093890628](https://github.com/nighca/lie/actions/runs/40093890628) 的完整 `headSha` 与目标一致，event=`push`，最终 status=`completed`、conclusion=`success`。创建于 `2026-10-24T12:25:52Z`，最后更新于 `12:27:21Z`；`verify` job ID=`120872016742`，运行时间 `12:25:54Z`—`12:27:20Z`。

| 实际步骤 | status / conclusion |
| --- | --- |
| Run npm ci | completed / success |
| Run npm run typecheck | completed / success |
| Run npm test | completed / success |
| Run npm run build | completed / success |
| Validate production build without uploading | completed / success |
| Check whether this commit is still main | completed / success |
| Deploy verified production build | completed / success |

部署步骤实际成功而非 skipped。首次查询时测试进行中；准备验收工作树、读取工作流及 CLI 命令后再次查询已全部完成，没有频繁轮询或重跑。使用已有 `gh run list --commit <SHA>` 与 `gh run view --json ...` 只读读取。工作流使用 Node `24.22.1`，先验证 prebuilt 再部署，并将完整提交 SHA 写入 version tag/message。

## Cloudflare 当前活动版本

按项目 `cloudflare.config.ts` 使用已安装的官方 `cf` CLI。读取 cf-cli 技能，匿名动作搜索后检查 help，并 dry-run 部署列表 GET；随后读取活动 deployment 及其精确 version。未请求 modules，未输出或保存 bindings、env、身份凭据或 secret 内容。

| 项目 | 实际观察值 |
| --- | --- |
| Worker | `lie-game` |
| 首个活动 deployment | `e914ca59-f45d-4d41-85e2-a6c79fe1c01e` |
| deployment 创建时间 | `2026-10-24T12:27:15.743421Z` |
| 流量 | 100% 指向下列 version |
| version ID / number | `d2f7139c-316a-4262-a080-920928774606` / `10` |
| version 创建时间 | `2026-10-24T12:27:15.214173Z` |
| version tag | `git-32d89bf91f441168148884593a0f49b816ad7162` |
| deployment / version message | `GitHub Actions commit 32d89bf91f441168148884593a0f49b816ad7162` |
| source | `cf_cli` |

实际命令为 `workers deployments list --worker lie-game --per-page 1` 与 `workers versions get d2f7139c-316a-4262-a080-920928774606 --worker-id lie-game`。以活动 deployment 的流量引用为准，没有拿“最新上传版本”替代线上活动版本。

## 正式站公开资源

同轮公开 HTTP 检查完成于 `2026-10-24T12:28:41.729Z`：

| 项目 | 结果 |
| --- | --- |
| `/` | HTTP 200，实际引用下列新 JS/CSS |
| `/assets/index-B4vtANW-.js` | HTTP 200，175786 bytes |
| `/assets/index-CZKqS1Kw.css` | HTTP 200，46511 bytes |
| v4 CSS 规则 | 实际下载内容含移动列宽 `148px`、调查页 `height:100dvh`、短屏行高 `136px` |
| `/api/health` | HTTP 200，`{"status":"ok","storage":"none"}` |
| `/api/voice/status` | HTTP 200，`{"status":"ready"}` |
| `/games/index.json` | HTTP 200，三案及 480/600/540 秒额度 |
| `/appearances/manifest.json` | HTTP 200，8 套预置形象 |
| Coral animation URL | `/appearances/coral-bob/animation/package.json`，HTTP 200 |
| 动画 package | 含 default/listening/waiting/speaking 四态、11 个图层资源 |
| 47 个生成资源 URL | 逐个 HEAD 均 HTTP 200，无失败 |

47 项路径来自该已发布源码在本地预览中生成的完整 `apps/web/public/appearances/` 文件清单，排除 manifest 本身，覆盖静态图、动画 package 与 PNG；最多 4 个并发请求。不是只测 avatar 后推断动画图层存在。新 JS/CSS 名称及字节数与同 SHA 的本地 Web 构建一致。

## 验收范围与限制

本记录确认 CI → 实际活动部署 → 正式公开资源链路。`voice/status=ready` 仅是网关配置状态，不是灵矽推理、麦克风、持续语音、额度或音色听感验收。本次没有创建语音会话、收音、付费调用，也没有操作用户正式标签页、浏览器草稿或本地 8787 进程。

移动 v4、动画与 Editor 的组合交互已在发布前由独立 IAB 对同一候选代码验证，见 [组合验收记录](../history/2026-10-24/combined-ui-animation.md)。本轮没有重复正式浏览器交互或将静态 HTTP 检查说成动画逐态目视通过。既有桌面 1280×800 页面约 21px 外层纵向滚动、说话短窗口未可靠定格等先前明确边界不因部署成功而消失。

安全临时证据位于本机 `/private/tmp/lie-animation-{deployment,version,public}.json`，不作为生产资源提交。版本响应仅提取 ID、number、annotations 等允许字段；未保留私有配置。本验收提交只新增此文档，不更改生产代码、主干或发布状态。
