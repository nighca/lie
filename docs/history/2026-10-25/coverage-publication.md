# 覆盖率徽章及已集成成果发布

2026-10-25，Asia/Shanghai。用户明确“推送吧，我看看效果”，随后暂停邀请码/访问鉴权实现。本轮只发布已review集成的main；auth代码和待用户验收的动画新修订都不在发布树。

- fetch确认远端main `32d89bf91f441168148884593a0f49b816ad7162`是本地祖先，remote无新增或分叉；root独占publication turn，不重写远程历史。
- 独立publication-readiness WT基7bf5388，Node24.22.1/npm11.19.1，同锁223package entries逐条相同且npm ls无problem，复用依赖；实际运行当前组合coverage388测试、全仓typecheck、Web/gateway build、strict与public/dist精确90文件通过，无archive/rejected混入。应用45文件358tests，lines1501/1630=92.08%；原生脚本30tests另报263/288=91.32%，与tracked快照完全一致；Vue模板映射限制仍公开。
- 首次fresh coverage失败原因：Web测试import尚未生成的manifest，collector把generator放在test discovery之后；未隐去此失败。仅移动同一generator调用到discovery之前，源唯一fix `fad5d862f239dd5f85cc00bbb1c712a9119d3cd0`，从缺失自有ignored public资源起点直接coverage复验通过，未依赖typecheck prehook掩盖。tracked快照不改采样来源或百分比。
- root实际review fix完整diff/报告，候选从67ad3fc有序cherry为 `abb12dbf7a40689be593c2a1e580f23cfcc5611e`；实际证明应用/collector/依赖/CI/正式资源与验证源相同，其他差异仅docs/暂停证据。干净main快进，普通`git push origin HEAD:main`成功；随后`git ls-remote origin refs/heads/main`实返abb12db，local同SHA clean。
- GitHub连接器读取该SHA徽章文件返回404，原因未证实；不将其当push失败或猜repo不存在，亦不调整可见性。后续通过已有GitHub CLI只读核对文件及push触发CI；连接器workflow查询仅支持PR-triggered，不能用于本次push。

已确认发布：**abb12dbf7a40689be593c2a1e580f23cfcc5611e**。[中文README](https://github.com/nighca/lie/blob/main/README.zh-CN.md)、[workflow](https://github.com/nighca/lie/actions/workflows/ci.yml)。徽章是明确标注来源的本地SVG快照，CI上传14天artifact，不自动改trackedbadge。

当前CI包含既有自动部署步骤；push只证明远程main发布，不代表CI/部署完成。独立owner继续只读核验，最后已证实线上部署仍32d89bf，结果据真实回执另记。未手动dispatch/deploy、未新建Cloudflare资源/凭据、未操作用户8787/8788/5355或麦克风。后续当前状态文档会推进本地HEAD，不自动再次push。
