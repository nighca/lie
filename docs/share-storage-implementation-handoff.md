# 分享存储：首批实施与交互原型交付

2026-11-01。用户已明确批准整体方案并要求推进，1 MiB写入上限、128 bits／22字符标识已确认；涉及UI先提供可交互Demo。后台已完成专项review，Demo已供用户审看，**正式UI尚待用户批准，不创建云资源或上线**。总协调负责中央队列、资源协调及唯一main集成/发布turn；本批不直接main/push。

## 来源与提交

各实施分支均从已审local main `a8be75823ceb67966390b5534d725a3a8bf1505b` 创建并核实HEAD，不含其他专项提交。

| 交付 | worktree / branch | 有序提交 |
| --- | --- | --- |
| 设计与用户批准记录 | `f6dc/lie` / `codex/lie-share-storage-design` | 已交设计链 `1a35d8f035f0f954c93fa2c155c28e901e88abac` → `03bd0fbe407e14e3cb42f51e473bffeae3c423d6` → `c7511c6814902ea0845189c75378a9c5a3581646` → `ad7bfb32b37d076688cec8243266a84f5c6fcca6`；本批追加 `ae7ef8cebebfbb270ad5146619e76d52fd941d0c` 记录实施批准与UI Demo范围 |
| 后台与协议 | `lie-share-storage-backend/lie` / `codex/lie-share-storage-backend` | `b9b403b083271fb526900bcb669483a54ab017d8` |
| UI交互Demo | `lie-share-storage-ui-demo/lie` / `codex/lie-share-storage-ui-demo` | `c4ee640e0691b36d429051f8df5307e2f0669c3a` → `0e8baa77482e038bd3454fa747a7b0428d0e3f67` |

worktree根均为 `/Users/nighca/.codex/worktrees/`。后台与Demo没有彼此的代码依赖；两者以已确认的分享设计为合同。此文档的提交作为设计链后续补交。各owner source工作区交付时clean，无未跟踪文件；后台与Demo未被cherry-pick到本设计worktree。

## 实际范围与review

后台只改 `apps/gateway`、`packages/game-core` 新增分享协议及根lockfile必要workspace依赖元数据；不改既有内容契约、控制器或判案规则。规范化JSON、服务端生成ID、R2保存和读取、写入1 MiB上限、错误响应、binding与health配置状态已实现。没有读取体积检查、读取hash校验、限流、停写开关、列表或用户删除接口。

Demo只增加 `design/share-storage-demo/**` 和 `docs/share-storage-ui-demo.md`，复用现有Vue组件/中文B样式。作者等待、复制成功、上传失败重试、超限和玩家加载/接案/不存在/网络失败均可交互切换。顶部工具栏是原型控制，不进入正式产品；没有正式Editor/Application接线，没有写用户草稿或真实存储，没有语音。

用户审看后提出等待与保存异常都放在分享弹窗，Demo追加提交已落实：点击立即打开弹窗，内部等待→成功或失败，失败可重试/继续编辑，超限仅继续编辑；关闭等待不会因迟到结果重开。专项owner实际审完整追加diff并在根chat IAB验证等待→失败，桌面/移动证据已查看，具体UI仍供用户评审，不把建议改动当用户最终批准。

专项owner已读所有源码、配置、tests、完整base diff和交付文档，检查实际status与提交；桌面及移动成功截图已实际查看，root可见IAB实际操作分享等待/成功。review发现的快照测试前置数据依赖已由后台owner修正，并独立执行该test验证；Demo成功弹窗内的额外原型导航已删除，统一用外部工具栏。

## 验证与局限

- 后台owner：core 54 tests及typecheck；gateway 44 tests及两个tsconfig；完整Web/Worker build和预设资源校验通过。未运行未改的 `game-cache.test.ts`，因其会起Vite dev listener；其他相关网关回归已通过。后台交付文档为 `docs/share-storage-implementation-backend.md`。
- 本地Miniflare真实R2 binding覆盖写后即读、重复内容同ID、修改保旧快照、1 MiB边界、重启持久化及异常。所有临时runtime已dispose；没有后台保留服务。
- 专项owner独立复跑 `shared-games.test.ts` 与 `shared-games-config.test.ts`，2 files / 10 tests通过。初次因sandbox不能写该WT的Vite临时缓存未启动，获准正常缓存写入后复跑通过，不是产品失败。
- Demo owner：锁定Node24.22.1类型检查、Vite build及IAB 1280×720／390×844交互通过，真实复制成功，390px无横向溢出，无console warn/error；未人为触发clipboard拒绝分支。专项owner另独立typecheck通过。
- 弹窗状态修订后类型/构建通过。子agent该轮IAB不可用，经协调用独立Chrome原型tab检查桌面与390×844状态、重试、继续编辑、超限、等待关闭后不重开；验后关闭并重置viewport。root可见IAB另独立验证，未操作用户其他tab。新增截图为 `share-loading-desktop.jpg`、`share-error-desktop.jpg` 与移动对照。
- 各分支diff whitespace检查通过。局部模拟或本地R2不证明云端可用性、全球传播或实际账户费用；云端桶尚未创建，未部署。Demo的分享链接是示例，不是真实上传结果。

## 保留服务与浏览器

唯一临时服务为UI Demo：

- owner `/root/share_ui_demo`；发起专项Chat `01a194d9-e260-7cd2-a8df-89b1478a1120`。
- worktree `/Users/nighca/.codex/worktrees/lie-share-storage-ui-demo/lie`，当前源码 `0e8baa77482e038bd3454fa747a7b0428d0e3f67`，clean；DEV启动时为a8加原型dirty，随后同一服务HMR至当前提交，不冒称clean production bundle。
- loopback `127.0.0.1:5177`，PID `29883`，原exec session `99739`。专项owner已用lsof独立核listener匹配；ps受sandbox限制，未为此扩大权限。
- 命令：Node24.22.1执行 `node_modules/vite/bin/vite.js --config design/share-storage-demo/vite.config.ts --host 127.0.0.1 --port 5177 --strictPort`。
- consumer：用户UI评审；URL `http://127.0.0.1:5177/`，root可见IAB tab已markDeliverable；Demo owner隐藏验收tab已关闭，viewport已reset。
- 停止条件：用户释放评审后，由Demo owner在原session Ctrl-C并确认listener与精确PID退出；现阶段保留，不停止或复制其他服务。无未知owner服务被更改。

8787/8788、5544、5198及其内部child listener未操作；中央服务登记由总协调正常批次更新，不另行发版。

## 后续

1. 用户审看Demo并确认具体UI；总协调再分配正式Editor/Application/代理接线所有权，协调其他UI专项，不能把后台授权当UI审批。
2. 后台源码已可review，勿将带新R2 binding的配置贸然部署到未创建桶的环境。资源步骤、桶名与本地路径见后台交付说明；后续由总协调明确目标环境/创建许可/发布窗口。
3. 正式接线完成后验证新短链全流程、旧fragment兼容、草稿与导航异步失效、真实网络错误；取得云开发环境许可后做实际binding读写验收。不用真实语音验存储。
4. 完整联合候选由唯一integrator审阅/验证后再更新main与普通push；当前只保留各分支提交与用户可交互Demo。
