# 主协调定时轮换

## 用户授权与工作模式

2026-10-24，用户明确要求在自动compact之外，每4小时将当前工作、后续任务等写入合适文档，启动一个新的chat接替主协调，然后停止旧协调及其定时任务。接任者持续按同样模式运行：每30分钟推进、每4小时交接。这是持续授权，覆盖创建接任chat、向既有专项chat通知接手、创建接任者两项定时任务、暂停旧任务及成功后归档旧chat；不扩大产品、供应商、发布或付费测试权限。

执行入口为[当前交接状态](coordinator-handoff.md)及[项目计划](project-plan.md)。各代只需这些当前文档和必要专项最新交付；不fork旧chat、不全读其历史。原用户17条反馈已授权安排实施，不是长期“只记录”门禁。

## 历史夜间临时授权（用户已回来）

2026-10-25用户随后已明确回来，临时无法回应模式结束，此前有效已授权工作继续。以下保留当时边界，不再假定用户睡眠或无法审批：原约00:20至08:30，用户睡眠无法回应，明确授权当前及接任协调继续既定工作，小的实现/排版/局部视觉修复由agents判断、review验证后推进，不以常规验收阻塞；重要产品/玩法/架构/供应商/范围决定及明确后置工作仍留待确认。继承该准确截止时间，不因轮换重新计算八小时或把沉默当批准；不需另建唤醒/提醒，用户会主动告知回来。过期后按已有常规权限继续，重大门禁始终保留。

## 每代常态

主协调保持响应：简短评估后，只要有一定工作量，就把整项任务交给subagent或专项chat，包括配置、启动、排障、浏览器验收和长检查；不能只委派写代码却把耗时收尾留给自己。主协调做接收/排期/所有权与接口协调/用户决策/实际交付review/串行集成/报告，并继续负责结果。执行中发现工作量增加立即交接，不继续埋头做。接任者完整继承这条规则。

- 每代恰好两项heartbeat：30分钟推进与4小时交接，均target本代chat。使用automation_update管理，不手写automation.toml、不建立外部cron。沿用户通知意图：推进无实质变化时安静，重大进展/完成/失败/用户决策再通知；交接完成或失败可通知。
- 每次推进先核本chat是否仍是coordinator-handoff登记的active coordinator。若已退任，不推进代码，停用本代两任务并退出，不能凭一次旧heartbeat夺回协调权。
- 及时原位更新项目计划、交接摘要和当前自动化ID。四小时到了先到安全边界交接：完成或中止自己拥有的候选Git操作，保留全部有用提交/dirty work，不能把半途merge/集成锁留给新协调而不说明。独立专项制作可继续，不必等待所有工作结束。
- 用户的固定main验收服务 `dev.nighca.lie.main-preview` 独立于chat，轮换/归档时保持运行，不重复启动或关闭8787/8788；具体本机管理见development和handoff。
- 集成始终只有一个owner；遵循AGENTS隔离worktree/有序cherry-pick/干净main快进规则，无内部PR。交接不是自动push/部署授权。

## 四小时交接步骤（旧协调）

1. 查最新用户输入、project-plan、pending-ui-feedback、专项chat紧凑wait快照、实际git status/log/worktrees及已有任务。列全已授权待办、当前优先级、owner、依赖/有序完整SHA、审批门禁和检查限制。活跃root子agent应先提供可恢复handoff；新chat不自动拥有旧agent控制句柄，保留其工作树和依赖refs，不能清理在用分支。
2. 在独立文档worktree更新coordinator-handoff.md，按实际时间在docs/history/YYYY-MM-DD/下保存带旧chat ID的交接快照并索引。核对diff后本地集成。记录核验时间/main基线，提醒文档自身提交会推进main，接任者须读取实际HEAD。不存凭据、完整tool输出或流水历史。
3. 若当前仍持有集成权，完成最后必要文档集成并明确释放。登记phase为released-for-successor、integrator为none、predecessor为自己；从此禁止旧协调再次改main。暂停本代30分钟和4小时两个任务，保留完整prompt/规则便于明确失败恢复。只停本代ID，不能误停其他项目/已建接任者任务。
4. 用list_projects核本机lie项目ID；create_thread创建全新本地项目chat（environment local，默认模型，不fork/不worktree），交初始提示见下。不需要立即改变其他制作owner。只创建一个接任者。返回threadId立即保存于本代交接运行记录（tmp或工具结果），后续按其ID检查；创建结果不明时先查list_threads/read_thread，不重复创建。
5. 新chat在初始提示中得到唯一接任授权。旧协调仅观察其接任，不再集成；用wait_threads等候，单次不超过60秒，长任务退避且用户更新不超过60秒。不因超时认定失败；可保留handoff待续，不必持续轮询。若接任者需要新输入，明确按用户既有授权协调。
6. 验证接任者已在交接登记认领active、实际能读仓库、两个新heartbeat均ACTIVE且target新ID、已通知专项；原两个任务均PAUSED。成功后给用户新chat链接，并发create_thread要求的created-thread指令。使用set_thread_archived归档自己，终止本代工作。无需删除chat、清除历史或删除旧任务。
7. 失败恢复：创建明确失败且无接任者时，可在原协调独占状态下恢复active登记和原两个任务并报告；有接任者但接手状态不明时，旧协调保持released/任务暂停，先查其状态，不能与其并行集成或重复建chat。文档/新chat/工具不可用则保存已有证据，保留旧chat，不归档，报告具体限制。接任未确认时不能宣称已完成交接。

## 接任者初始提示（代入真实ID及路径）

“用户已明确授权每4小时轮换主协调。你是LIE下一代主协调，接续PREDECESSOR。请先读/Users/nighca/code/nighca/lie/AGENTS.md、docs/coordinator-rotation.md、docs/coordinator-handoff.md、docs/project-plan.md及docs/pending-ui-feedback.md，不读取旧chat全量历史。旧协调已暂停其推进/轮换任务、释放唯一集成权，不会再改main；核实交接phase/predecessor与实际仓库后认领active。继承排期、授权范围、协调、review、单integrator、集成与验收责任及报告职责；有一定工作量的执行、运维、服务配置、排障和浏览器/长检查须整项委派，不把耗时收尾留给主协调。已有专项chat仍各自负责制作，通知它们以后向你批量交付，不重复启动。核对已有定时任务后，以automation_update为你自己创建且仅创建两项heartbeat：每30分钟推进和每4小时按轮换文档再次交接。每代旧任务须暂停，新任务target必须是自己；保留安静通知规则。把你的chat ID、两自动化ID、接手核验状态和时间写回交接登记并按隔离review规则本地集成。确认后在本chat给出一份接任完成摘要，便于旧协调用wait_threads核验并归档；这不是要求你向旧chat发消息。然后继续最高优先级可执行工作，不止报告下一步。不要擅自push/部署或绕过用户门禁。项目ID须经list_projects核实。用户同时授权你以后重复本轮换流程。”

## 接任者自己的定时任务内容

- 推进prompt：先读rotation/handoff/project-plan和最新用户输入；校验自己为active协调；检查专项实际状态，推进授权任务、review、集成和验收；保持门禁/唯一integrator/批量handoff；无可执行事项或无实质变化时安静。规则为每30分钟。
- 轮换prompt：按本文四小时步骤更新当前文档及历史快照，暂停本代两任务、释放集成权、创建全新接任chat，接任者再建同样两任务，核实后归档自己；失败不盲退、不重复创建、不产生双integrator。规则为每4小时。
- 创建后检查返回ID和实际status/target；未知结果先查现有任务，避免重复。不复制旧chat ID到新prompt/target。使用工具生成的真实ID登记，不能把“已安排”当实际创建。

## 当前交接内容最低要求

当前协调/前任/接任ID与phase、唯一integrator、核验时间和实际main/remote跟踪/部署版本；所有专项ID与文件所有权；每项待审base/orderedSHAs/clean状态/依赖与用户验收；正在实施/待决策/后置任务；已通过和未执行检查；开发服务端口/来源SHA/需要保留的进程及浏览器窗口；两个自动化ID/状态/target；新协调第一步和失败恢复位置。不要把旧交接快照当比新用户决定更高的依据。
