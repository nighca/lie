# 2026-10-24 编辑器里程碑：线上持续部署验收

目标提交：`376ce64efb4c035d083d47a93852da22a923a2cc`。正式站点：[LIE](https://lie-game.nighca.workers.dev/)。本记录独立基于该已发布提交，只做读取和浏览器验收；未部署、重试workflow、改权限/secret或推送代码。

## GitHub Actions：实际运行与步骤

[CI push run 40084031747](https://github.com/nighca/lie/actions/runs/40084031747)，`headSha` 与目标完整SHA一致，event=`push`、status=`completed`、conclusion=`success`。运行创建于 `2026-10-24T09:58:06Z`，最后更新 `09:59:30Z`；job `verify` ID=`120843198960`。

| 实际步骤 | status / conclusion |
| --- | --- |
| Run npm run typecheck | completed / success |
| Run npm test | completed / success |
| Run npm run build | completed / success |
| Validate production build without uploading | completed / success |
| Check whether this commit is still main | completed / success |
| Deploy verified production build | completed / success |

部署步骤是实际success，**不是skipped，也不是仅CI绿就推断部署成功**。同时核对了下述Cloudflare活动版本与正式HTTP内容。

查询目标push run时使用 `gh run list --commit <SHA>`；GitHub connector的workflow jobs读取返回404，故用已有可用 `gh run view --json ...` 只读读取该run的实际job/steps。没有因connector404更改token、权限或重新登录。首次查询时run已经完成，没有轮询等待或重跑。

## Cloudflare：活动部署、版本与SHA

使用项目已安装的官方 `cf` CLI `1.0.0-beta.18`；先匿名动作搜索、help/schema与dry-run，再执行只读GET。身份检查只记录成功，不保存身份邮箱或凭据。没有读取管理secret值、modules代码或环境绑定详情。

| 项目 | 真实观察值 |
| --- | --- |
| Worker | `lie-game` |
| 最新活动deployment ID | `f57ee64c-5a88-4e6e-b0d6-81114fb535a6` |
| deployment时间 | `2026-10-24T09:59:25.120134Z` |
| 流量 | 100% 指向以下version |
| version ID / number | `8079aea6-6a1e-491a-86b2-02d04792770f` / `9` |
| version时间 | `2026-10-24T09:59:24.580055Z` |
| version tag | `git-376ce64efb4c035d083d47a93852da22a923a2cc` |
| deployment及version message | `GitHub Actions commit 376ce64efb4c035d083d47a93852da22a923a2cc` |
| source | `cf_cli` |

读取的是 `workers deployments list --worker lie-game --per-page 1` 返回的首个活动部署，以及它指向的精确版本 `workers versions get <version-id> --worker-id lie-game`；没有以“latest上传版本”替代活动流量版本。两处annotation与已成功部署的Actions目标SHA一致。

## 正式HTTP与静态内容

公开端点在 `2026-10-24T10:04:12Z` 同轮检查：

| 项目 | 结果 |
| --- | --- |
| `/api/health` | HTTP200，`{"status":"ok","storage":"none"}` |
| `/api/voice/status` | HTTP200，`{"status":"ready"}` |
| `/` | HTTP200，引用新bundle `/assets/index-CPqSMV_C.js` |
| 新bundle | HTTP200、159427 bytes，含新首页标题、公共ProductHeader和编辑器步骤文本 |
| `/games/index.json` | HTTP200，三案：空盒里的纪念章480s、压轴怎么是鸭叫600s、盐和糖的小乌龙540s |
| `/appearances/manifest.json` | HTTP200，8套均有中文name、8个独立voiceId，所有图路径为统一 `/appearances/<id>/...` |
| manifest的8个avatar入口 | 逐项HEAD均HTTP200、`image/png` |

`voice/status=ready` 是网关可用配置的状态检查，**没有建立语音会话，也不是灵矽实际推理/额度/收音成功证明**。health的storage字段按接口报告为none，本次没有新增DB或查询secret。

## 正式IAB小范围验收

在独立新建的正式域名IAB tab操作，未使用用户现有标签页或本地8787，未申请麦克风、点击语音、播放TTS或调用推理：

- 首页 h1 是“有人在说谎”，三个案件卡片可见；三张群像实际加载新 `/appearances/<id>/avatar.png`，naturalWidth均大于0。
- 进入正式Editor，三步“故事设定/故事人物/真相结局”均可打开；只有当前步骤h1，已使用公共品牌和右侧“返回首页”，草稿notice保留。
- 1280×800首页：Logo105×56、文字18px、underline5px；实际391×844编辑器：Logo88×47、文字14px、underline5px，document.scrollWidth=391，没有新页面横向溢出。
- 形象picker显示8个中文名与canonical路径。刚展开时仅首图已解码、其余仍pending，未把pending当成404，也**未宣称8图均已在浏览器解码**；上表的8项HEAD200为独立服务器资源证据。
- “返回首页”实际回正式首页且标题正确。该tab观察到的console warning/error为空，没有404日志。
- 本轮只切步骤/开关picker/返回，没有填写或修改线上草稿，没有重做完整创作、分享、投稿或真人语音流程。

截图为本机验收材料，不是发布资源：

- `/private/tmp/lie-production-milestone-home.jpg`
- `/private/tmp/lie-production-milestone-editor-391.jpg`

viewport override已reset，所有本轮新建正式tab已关闭；未改变线上配置或用户浏览器权限。已验证CI→真实活动部署→正式静态内容链路；未把这次CD验收替代既有或未来的真实语音/游戏内容稳定性验收。
