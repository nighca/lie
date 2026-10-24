# main 的持续部署

> 本文保留具体时间点的验证/交付记录，其中早期“当前”字样不代表最新环境；当前模块、发布和待验状态统一见[项目计划](project-plan.md)。

2026-10-24。目标为现有 `lie-game` Worker 和同次构建的静态网站；不新增部署平台或运行服务。实现文件为 `.github/workflows/ci.yml`。

## 执行流程

每次 main push，以及手动运行 CI，均使用提交自身的锁文件和 Node.js 24.17.0 执行 `npm ci`、类型检查、自动测试和完整构建。任一步失败便不部署。构建顺序仍为 Web → gateway，gateway 将该次 Web dist 收入静态资源。

之后运行项目锁定的 `cf@1.0.0-beta.18`：

```sh
npm exec --workspace @lie/gateway -- cf deploy --prebuilt --mode production --worker lie-game --provision=false --dry-run
```

仅 main 的运行可以进入部署；非 main 的手动运行只检查。部署前使用只读 GitHub token 查询 main 当前 SHA，过期提交跳过部署。在同一 job、同一 checkout 内用 `--prebuilt --mode production` 上传刚才已验证的 Build Output，不再次构建、不下载其他 run 的产物。Worker 版本标记包含提交 SHA，成功后写入 Actions summary。

固定并发组 `lie-production` 序列化整个工作流，`cancel-in-progress: false` 不中断正在部署的上传。GitHub 默认只保留一个 pending run，较晚排队的运行会替换已有 pending，且不保证按提交先后处理。因此不承诺每个中间提交都上线；还有最新 main SHA 检查，防止旧 run 在新版发布后覆盖线上。若人为重跑旧 run 导致最新 pending 被替换，应重跑最新 main。若新 push 恰在检查后到达，当前上传可先结束，较新 run 只能在其后部署。此保障适用于这份 Actions 工作流；人工部署也须由唯一 integrator 协调，不应另开部署旁路。

## 一次性凭据准备

目前只查询了 `nighca/lie` 的 Actions repository secrets/variables 名称元数据，结果均为空；未读取任何值、创建 token 或修改账号授权。

请在 Cloudflare 创建专用 CI API token，并在 GitHub 仓库 **Settings → Secrets and variables → Actions → Repository secrets** 保存：

| 名称 | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 专用部署 token；不要使用 Global API Key、个人 OAuth 缓存或灵矽管理 key |
| `CLOUDFLARE_ACCOUNT_ID` | 当前 `lie-game` 所属账户 ID，明确指定部署账户 |

按 Cloudflare 当前的细粒度权限界面，选择现有的 **Individual Worker → lie-game → Editor**，仅限该账户和 Worker。Editor 支持部署已有 Worker，无须授予创建/删除 Worker 的 Admin；本项目没有修改 Routes/Custom Domains、读取数据库或资源自动创建的需求，不授予 Zone/DNS/KV/R2/D1 权限。设置合理有效期并在到期前轮换 repository secret。若实际 token 界面仍只有旧权限模板，或 beta CLI 报额外权限不足，先检查具体失败请求再讨论最小授权，不直接改成账户全权限。

仅最后的部署 step 接收上述两个 secrets，安装、测试、构建和 dry-run 不接收。工作流不调用 `cf auth login`；GitHub runner 不复制开发机登录状态。token 创建及 repository secret 写入是额外账号授权操作，由用户完成或在具体操作确认后进行。未配置时部署 step 明确失败，不退回本地身份或无凭据发布。

## 保留生产语音配置

`cloudflare.config.ts` 已声明 `LINX_WS_TOKEN`、`LINX_DEVICE_ID`、`LINX_AGENT_ID` 三个 `bindings.secret()`。CI 不获取、回显、上传这些值，不设置 `--secrets-file`，不把它们写入 Actions secrets、静态文件或构建变量。部署复用当前 Worker 上已有的秘密绑定，既不自动启用新供应商，也不改变访问策略。

核实依据包括项目锁定的 cf npm 包实现：`containers-*.mjs` 的部署路径设置 `keepSecrets: true`；`addRequiredSecretsInheritBindings` 为缺少新值的已存在 Worker 秘密绑定生成 `inherit`。静态 Build Output 中三项仍为 `secret` 引用，不含值。CLI dry-run 不访问生产，因此它证明构建和部署输入通过本地验证，不能证明 token 权限或线上秘密继承已经实际验收。第一次真实 CI 发布后仍需核对生产语音状态和版本。

若目标 Worker 被删除或秘密绑定缺失，本流程不能从零恢复供应商值；应由维护者单独恢复生产配置，不能临时把管理 key 加入工作流。

## 运行与故障处理

- 质量检查失败：修复后正常提交 main；不手动跳过检查上传。
- 缺少凭据或 token 过期/权限不足：只修复 repository secrets 或精确授权，再重新运行最新 main 的 CI。不要粘贴 token 到聊天、issue 或日志。
- 旧 SHA 显示 skipped：正常保护；应检查最新 main 的运行状态。
- CLI 上传/发布失败：检查 Actions 和 Cloudflare 版本记录，区分上传成功与流量切换成功，不把 job 开始当成上线成功。只重新运行最新 main，避免将旧提交当回滚。
- 需要回滚：由 integrator 先核实已部署版本，按项目发布规范准备显式回滚或修复提交；工作流不自动猜测回滚目标。

交付时仅完成本地工作流校验、构建和 cf prebuilt dry-run；尚未写入 Actions 凭据、推送工作流或执行真实部署。正式验收须观察一次 main CI 成功部署，核对 SHA 标记、静态网站及现有生产语音状态。假服务测试不代表真实语音验收。

## 官方依据

- [cf 的 CI 身份与 prebuilt 部署](https://developers.cloudflare.com/cf/ci/)
- [cf 的构建、mode、dry-run 与部署选项](https://developers.cloudflare.com/cf/projects/)
- [单 Worker Editor 权限与作用域](https://developers.cloudflare.com/workers/authorization/workers/)
- [GitHub Actions 并发与顺序限制](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

## 首次真实运行验收

2026-10-24 用户配置两项repository secrets后，main `a5ed1e4f0d8a30eb5d607b076e5d25505c35472f` 的 [Actions运行40063253520](https://github.com/nighca/lie/actions/runs/40063253520) 全流程成功，含真正Deploy步骤。root只读核对Cloudflare活动版本 `63f438a8-d6d1-4ec5-ae36-0e0f71fb3faf` 承载100%，部署消息带相同提交SHA。线上首页/静态目录正常、health ok、voice status ready，生产供应商配置仍在；本次没有重新测试麦克风或语音回答，不把ready当作完整语音验收。
