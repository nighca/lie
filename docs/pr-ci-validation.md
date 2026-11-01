# PR 自动验证

2026-11-01；第一批仅增加无凭据检查，预览发布另行实施。

## 触发与结果

[PR CI](../.github/workflows/pr-ci.yml) 检查目标为 `main` 的贡献 PR，在打开、更新提交、重新打开、转为 ready 时运行；draft 同样检查。不按文件路径跳过整个 workflow。默认 checkout GitHub 的 `refs/pull/N/merge`，检查 PR head 与当时 base 的测试合并结果；`github.sha` 和 coverage artifact 对应该 merge SHA，不应误认成 head SHA。

同一 PR 的新 run 取消旧 run。固定 `gate` job 使用 `always()` 等待 `verify`，仅其结果为 `success` 时成功；失败、取消和跳过均不能通过。workflow 整体被取消时不承诺 gate 一定运行，但不能据此认定检查成功。

检查命令与现有 main CI 一致：handoff guard 测试、全 workspace typecheck、应用和脚本 coverage、Web/Gateway build、生产 prebuilt 无上传 dry-run。coverage artifact 保留 14 天。此批不增加预览 artifact，也不打包生产部署产物。

## 权限与生产边界

PR 代码只在 GitHub 托管临时 runner 执行，workflow 权限为 `contents: read`，checkout 不持久化凭据，不引用 Cloudflare/Linx secrets，不使用 self-hosted runner、`pull_request_target` 或持有写权限的后续 job。沿用图片构建缓存；PR cache 不是受信生产产物，生产 CD 不读取该缓存。

独立 workflow 名称 `PR CI` 不匹配生产 CD 监听的 `CI`。现有 `ci.yml`、`cd.yml` 和生产 artifact/helper 拒绝条件均不修改。此批不设置 required checks、main 分支规则或 bypass；AI 内部 worktree → review → main 直接集成流程保留。

## 验证范围

本地 Ruby/Psych YAML 解析及各 `run` 的 `bash -n` 通过；gate 的 success/failure/cancelled/skipped 四种输入核查通过，仅 success 返回成功。现有生产 handoff guard 测试 17/17 通过，`git diff --check` 通过。actionlint 未安装，未为此安装工具。当前本机 Node 为 24.17.0，低于 CI 锁定的 24.22.1；本地脚本测试通过不替代远端锁定环境验收。未修改应用实现，不重复运行无关应用全套。

首次真实同仓 PR 和受控 fork PR 仍需远端验收：触发事件、merge SHA、GitHub fork Actions 审批、coverage 上传和失败显示。GitHub 对首次贡献者的 Actions 审批是额外门禁；此 workflow 不改变其设置。合并冲突时 GitHub 不运行 `pull_request` 检查，需先解决冲突；base 更新也不保证自动给所有已打开 PR 重跑。尚未创建测试 PR、配置 secrets、部署、集成 main 或 push，不能以本地检查声称远端链路已通过。
