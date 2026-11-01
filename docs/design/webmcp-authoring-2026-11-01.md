# WebMCP 与 LIE 案件创作：首轮研究

2026-11-01。状态：研究与讨论提案，未批准正式实现、外发作者内容、模型调用、资源配置或部署。

## 工作区与范围

- 本 Chat 独立 managed worktree：`/Users/nighca/.codex/worktrees/c4e9/lie`。
- 起点 HEAD/local main/origin tracking main 均为 `35e987a7516493dcdccb8392cb8817f3b82744e4`，初始 clean；未 fetch，不以 tracking ref 代替本轮远端实测。
- 从 attached detached HEAD 建立 `codex/webmcp-authoring-research`，不切换其他 worktree 分支。
- 仅本研究文档；中央计划、正式产品、旧源包均不改。集成和 push 由总协调 Chat `01a18baa-4fac-71f2-a81f-c39be0640fe8`负责。
- 未启动服务、调用模型、发送草稿、安装依赖/扩展、更改 flags/账号或触碰受保护端口。

## 历史接续与证据

已读取旧 Chat `01a1919a-3c32-774d-8c79-48710a7580ed`（host `durable`）的可用历史，以及 review worktree 中完整 v3 README、技术稿、验证说明/结果、HTML 脚本和相邻独立报告。旧体验专项 `01a19193-9ded-71d6-a3fb-f6edd77410c4` 是不同提案。

历史源：`/Users/nighca/.codex/worktrees/lie-ai-authoring-design-review/lie/docs/design/ai-authoring-2026-10-31/`；报告为其相邻 `ai-authoring-2026-10-31-review.md`。顶层七件与 `/Users/nighca/Documents/Codex/2026-10-31/task-2/lie-ai-authoring-design/` 逐字节相同，19 条 SHA256SUMS 均通过。本轮没有重新执行旧测试，没有改写旧包及 v1/v2/versions。

确认的阶段状态：v3 是待用户决定的产品/技术提案与隔离模拟 Demo；旧独立审查记录24项离线通过，修过采纳、撤销、ABA、迟到结果、全文外发披露及 DOM 焦点目标。没有真实模型、浏览器视觉验收或作者收益实证。

旧推荐“当前人物笔记整理”与新文本网关、供应商、DO 配额、邀请资格、预算、保留政策均未获实施批准。WebMCP 探索不继承这些推荐为固定合同，也不追认旧方案。旧包目前仍在 review WT untracked，必要轻量版本史的正式保全待总协调安排；本文件不替代原件。

## 当前产品事实（本基线源码）

`apps/web/src/editor/Editor.vue`、`draft.ts`：三步表单、可变人物、纯文本、预置形象；单槽 `lie-editor-draft`，deep/sync watch 自动本地保存，保存失败保留内存稿并提示。draft 可以不完整；`draftIssues` 另检查有效形象、姓名重复、答案引用等，`validateGame` 不是全部编辑器要求。源码没有完整的 AI 候选/撤销或多标签并发保护，不能把旧 Demo 逻辑当现有产品。

`share.ts`：分享已改为 POST 保存不可变快照再返回短链，旧 fragment 只读兼容。短链可让持有者读取完整内容；不是单纯本地编码。改编入口已实现，不能复用旧技术稿的过时描述。

`packages/game-core/src/{content,context}.ts`：浏览器持全案，程序比较答案；角色对话仅传公共背景、当前人物设定及本人历史。作者 AI 与语音角色供应商是两项能力，不能复用 voiceagent 代替创作授权。不新增服务端判案、事实规则 DSL 或必填知识表。

## WebMCP 查证（2026-11-01）

1. [2026-10-27 草案](https://webmachinelearning.github.io/webmcp/)仍是 Community Group Report，非 W3C 标准/标准轨道。网页用 JavaScript 向 agent 暴露有描述、输入 schema、执行回调的工具。
2. 当前规范入口是 `document.modelContext.registerTool()`。[官方 explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md)明确 declarative form API 另行探索、不在当前规范；Chrome 文档仍介绍两种，不能混为同一成熟合同。实施时需固定验证的浏览器/API版本。
3. [Chrome 官方文档](https://developer.chrome.com/docs/ai/webmcp)列出 Chrome149起 origin trial 和本地 testing flag。[规范仓库实现清单](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)另列 Edge150 trial、ChatGPT Desktop支持、Brave Leo实验支持；Firefox/Safari仅链接跟踪项。它不是跨浏览器普遍可用功能；清单不能证明本机客户端、版本、开关或桥接已可工作。
4. WebMCP 不等同于一个普通远程 MCP 服务。当前草案 §5.2 明确浏览器向 agent 暴露工具的格式由实现决定，未强制 MCP 网络传输。一个普通 MCP 客户端不会仅因网页注册工具就自动连上它。
5. 与 DOM 自动化不同，工具可复用应用动作、接收结构化输入和返回保存结果；仍须浏览器/agent访问页面并支持发现和调用。网页没有因此获得自己的模型。
6. [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)提供 readOnlyHint/untrustedContentHint/consequentialHint 等注解。它们是语义提示；应用仍须检查输入、权限、当前稿归属及副作用，不能把注解当确认/撤销/安全保证。

推断：在已支持的外部 agent/浏览器组合下，LIE可以只提供编辑器能力，不自建文本模型调用网关。推理、账号、费用、内容外发和留存责任转到所选 AI 产品及其配置；不是消失，也不能保证 agent 只看工具返回字段（它可能同时看 DOM/截图）。

未验证：本机指定 agent 能否发现/调用当前 API、消费者版本差异、真实作者总耗时、中文内容质量、事实与人物知识边界保真、工具提示注入抵抗。未据搜索摘要承诺 Gemini/任意客户端支持或确定正式发布日期。

## 可选路径

| 路径 | 价值 | 主要代价 / 状态 |
| --- | --- | --- |
| 原生 WebMCP + 作者外部 AI | 直接操作当前浏览器草稿，可省去 LIE 文本推理网关 | 浏览器和 agent 都须支持；推荐先验证具体一组客户端 |
| 扩展/桥接到普通 MCP agent | 可能覆盖另一种常用 AI 工作流 | 额外安装、权限、桥接运维；不能算原生 WebMCP通用能力，本轮不安装 |
| LIE 自带模型辅助 | 能在普通浏览器提供一致入口 | 重新面对旧网关、预算、模型、隐私选择；仍是未批准备选 |

## 最小工具面讨论稿

具体名称仅用于说明；不承诺一次实现全部工具，不暴露任意 JavaScript、URL fetch、localStorage key 或自由对象路径。

| 能力 | 候选输入/输出 | 副作用与边界 |
| --- | --- | --- |
| 读取创作契约 | 草稿字段、作者说明、有效形象 ID；注明结构检查不懂剧情 | 只读，无私人内容 |
| 读取当前稿 | 显式读取范围，草稿身份与本次编辑代次 | 草稿内容将进入外部 AI 上下文，需先决定全案/局部；不默认跨标签读写 |
| 修改局部或导入整案 | 预期草稿身份/代次 + 白名单字段或完整候选；返回实际改动和保存结果 | 可逆本地编辑；未知字段、重复ID、无效引用拒绝。允许未完成稿，不能强制每次全案可玩 |
| 校验当前稿或候选 | 结构/必填诊断及定位 | 只读；不能输出“剧情一致/保证可推理” |
| 预览 | 通过已有编辑器验证后进入预览 | 导航不等于无副作用，需核现有后台 prepare；首轮不自动开语音/麦克风 |
| 分享/投稿 | 后续单独讨论是否暴露 | 分享会外部持久保存；投稿是另一个外部流程。首轮建议保留作者现有按钮，不能与写稿绑定 |

两种可逆编辑方式均可讨论：AI按作者指令直接改当前稿、页面可见并撤销；或提交独立候选、作者采纳。前者操作少，后者确认更明确但审核成本可能更高。旧候选方案不是强制答案，需根据实际作者任务选择。

## 必须覆盖的编辑边界

- 页面中的当前内存稿是读写权威；不能只写localStorage让界面与返回结果分离。整案变更先校验再一次替换，避免同步watch持久化半成品。
- 工具读后人工输入、撤销、清稿、改编、人物删除或路由生命周期变化，应使旧写入资格失效；用编辑会话内代次及草稿身份即可讨论验证，不给案件内容增加版本字段。恢复旧字节不恢复旧调用资格。
- 重复同一写入不得重复添加人物；首次可只接受明确值替换，避免toggle式命令和复杂重试账本。
- 返回“已在当前页修改”和“本地已保存/保存失败”必须分别真实；失败不能让agent误报完成或盲目重试造成覆盖。
- 撤销仅恢复本批次且不覆盖后续人改；没有安全撤销时返回冲突，不能静默回滚整份新稿。全局历史系统不是首轮前置要求。
- 单槽草稿存在多标签覆盖风险。内存revision不提供跨标签事务；需明确限制单活跃编辑页，或在观察到外部storage变化时阻止工具写并提示处理。产品级多标签并发方案另讨论，不虚称已解决。
- 草稿含角色扮演指令，agent应当作创作数据。schema只能检查形状，事实否定、时间线与谁知道什么仍需作者核对和真实试玩；不新增知识图谱。

## 用户已明确的方向与客户端补充查证

用户确认首轮只支持 Chrome 可以接受，目标 AI 为 ChatGPT，若 ChatGPT 内置浏览器支持则更好；优先“从一句灵感生成整案”，“讨论并修改已有稿”也有价值。此前以局部改稿为首个作者任务的建议据此被替代，不扩展为正式实施/外发/资源批准。

[OpenAI 官方 Site tools 文档](https://learn.chatgpt.com/docs/webmcp)已明确 ChatGPT 桌面应用内置浏览器支持 ChatGPT Work/Codex 发现和调用网页工具。要求更新应用，文档列 GPT-5.6 Sol/GPT-6 Sol；可用性仍取决于 rollout、页面和设置；Enterprise需管理员许可，Edu不提供。Settings > Browser > Permissions 有 Enable site tools。支持顶层页面的JS注册，不支持 declarative form API或iframe工具。此为文档查证，未验证用户当前账号/安装状态。

[Chrome origin trial 说明](https://developer.chrome.com/docs/web-platform/origin-trials/)允许网站注册并提供域名token，在试验适用条件内让访问者使用功能，无须逐人改flag；最新Chrome本身不意味着已全局默认开启。[WebMCP文档](https://developer.chrome.com/docs/ai/webmcp)的本地测试路径仍为手动开启testing flag并重启。本轮未注册trial或改flag。

[ChatGPT Chrome扩展文档](https://learn.chatgpt.com/docs/chrome-extension)证明外部Chrome的浏览器控制路径需要连接应用/扩展及站点权限，但没有据此证明该路径可直接发现WebMCP工具。普通Chrome里仅打开ChatGPT网页与LIE两个标签不构成已支持的工具连接；Chrome原生API与ChatGPT消费者要分别验。建议优先验证官方明确支持的内置浏览器，再验证外部Chrome组合。

## 推荐首个验证与待决定项

首要作者任务改为固定虚构灵感→ChatGPT读取LIE创作契约/形象列表→生成完整案件候选→结构检查→作者审阅并放入草稿。可有必要的澄清或讨论，不用大量必填问卷代替生成。保留后续局部修改能力；不默认分享、投稿或开语音。整案候选如何采纳、是否允许直接可撤销写稿，仍待讨论。

先用隔离 fake 验证读写/保存失败/陈旧调用/撤销，证明合同；再在明确选择的客户端、获准外发的虚构材料上测真实发现和执行，不能把普通函数调用冒充原生 WebMCP。真实模型/浏览器试验另获具体授权，不通过安装扩展或改flags自行解除限制。

验收看同一作者任务与手动或复制粘贴的对照总耗时：含讨论、输入、阅读审核、返工、失败恢复；能否保留事实/知识边界和人工修改。单纯调用成功/填满字段/采纳率不足以证明收益。本轮无作者实验结果。

优先需讨论：读取全案与外发范围；直接编辑可撤销还是先候选采纳。目标已收敛为ChatGPT，内置浏览器先验证、外部Chrome次之；首要任务为灵感起整案。分享、投稿与真实语音启动是否可由agent执行留到后续独立决定。

本轮交付仅此研究文档。旧包保全、正式代码、客户端探针、作者收益实验和新资源均未完成，不能报为已上线或已验证。
