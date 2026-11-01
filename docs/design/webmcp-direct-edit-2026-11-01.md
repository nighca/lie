# WebMCP：直接编辑当前案件

2026-11-01，用户已确认内置浏览器测试通过，并明确调整交互：检测`document.modelContext`，支持时显示小提示，点击后弹窗介绍；不要独立Demo草稿、整案候选或采纳/放弃步骤；工具直接操作当前表单。本文替代[此前候选Demo](webmcp-authoring-demo-2026-11-01.md)的当前推荐与实现，旧文档/截图和提交保留历史，不改写旧审查事实。

后续体验反馈：用户确认整体逻辑正确，但否决悬浮长蓝链入口和技术说明式弹窗，要求符合现有界面的入口与普通用户能实操的内容。本次据此调整视觉/文案；最终clean3efe3c5获用户明确“这个版本可以，推进提交合入吧”接受；现组合于main730ba84基线交review，待CI/CD与线上核验。

## 当前行为

- 编辑器只检查当前Document的`modelContext`是否存在。它是浏览器向页面提供的WebMCP能力接口，不证明Agent已连接或在线；[规范API定义](https://webmachinelearning.github.io/webmcp/#extensions-to-document)。此前默认“旁边ChatGPT”的文案删除。
- 支持时在步骤标题同行显示紧凑描边按钮“让 AI 帮你写”，去掉单独占一行的长蓝链。无接口时不显示AI入口，原表单继续工作。按钮不声明Agent在线；正常注册状态不占用用户文案，注册失败仍在弹窗给出恢复提示。
- 复用EditorDialog给普通用户三步指引：在能操作网页的助手中打开本页→描述题材/人数/反转并要求直接填写→看着表单继续调整。配一段可通过现有copy函数复制的完整示例，简短提醒核对故事再试玩；不再堆接口/检测/Agent在线或内部返回数据的技术解释。试玩、分享、投稿手动触发。入口与工具写入都尊重现有分享busy状态。
- 删除AuthoringDemo组件与独立候选状态，删除专门的采用/放弃/撤销流程和`lie-webmcp-demo-draft`读写。原存储中该旧key不迁移、不删除，也不覆盖普通稿；当前统一沿用既有`lie-editor-draft`。
- 不再依赖DEV或`webmcp=1`查询参数；有接口的编辑器页面即可注册。旧链接仍可打开，但该参数无功能。是否正式集成/发布仍由总协调单独处理，本分支未自行main/push/部署。`demo=1`仍仅为既有fake语音开关，不是创作草稿模式。

## 工具合同

| 工具 | 作用 | 输出及副作用 |
| --- | --- | --- |
| `lie_authoring_guide` | 创作规则、可编辑字段和有效形象 | 无原稿正文，无模型请求 |
| `lie_editor_state` | 当前内存编辑代次及是否已有内容 | 只返回revision/布尔；不返回姓名、profile、background或ending |
| `lie_update_draft` | `revision + changes`直接修改当前表单 | 白名单局部更新；一次ref赋值，现有watch同步尝试保存；返回revision、保存结果、无正文诊断位置 |

changes允许`title/summary/background/interrogationLimitSeconds/characters/ending`。未提供字段精确保留，id不可改。ending按`culpritId/reveal`局部合并；characters若提供则整列表替换，必须包含全部要保留的人物，工具schema/说明明确此语义。删除答案人物时须同时清空或修改答案，不暗选新答案。

草稿可不完整：允许空文本、无人物/空答案；试玩就绪诊断不阻止写稿。仅验证请求提供的外部形状与技术约束，包括非空唯一人物ID、有效或null形象、提供的时长为正安全整数、涉及答案的改动有有效引用；无关旧未完成字段保留。`readDraft`从原loadDraft提取可编辑形状校验，直接验证合并对象，避免JSON往返损坏已有未保存的Infinity时长值。未增加内容schema/规则引擎/必填知识表。

工具修改不强制切到第一步或第一位人物：保留当前步骤和仍有效的人物选择，当前选中人物被移除才选剩余第一位或null。

## 保存、并发和外发边界

- 写入前验证编辑器仍active、调用signal未注销、revision未变，及本地存储没有外部替换。任意本稿编辑（含恢复旧字节、工具写入、清稿）都递增当前会话代次；重复旧调用不得覆盖新稿。
- 单次同步写入复用原保存watch，并比较实际持久化JSON：保存成功`updated/saved:true`，内存已改但保存失败`updated_unsaved/saved:false`。后者保留现有“请勿关闭页面”提示，不伪装成拒绝或建议盲重试。
- storage getter失败时，工具写入在赋值前拒绝，不把“读不到”当作空稿。观察到storage事件后永久阻止本轮工具写，旧字节恢复也不解除；缓存离开期间有外部变更，回来时也能识别。它不是跨标签原子事务，不扩建锁/云版本库。
- KeepAlive deactivation/unmount注销工具并失效旧回调；再次进入使用新代次。旧异步注册失败不能覆盖新注册状态。
- readiness诊断只返回step/field/characterId，不返回可能含私有人名的message。此前完整读稿被自动审批拒绝的边界保持，完整read工具未恢复，也没有DOM/CDP绕读用户原稿。浏览器常规页面观察仍按其正常权限处理，弹窗说明不承诺整页绝不被助手看到。
- 无供应商/后端/secret/网络权限或资源变化；不自动分享、投稿、开局、麦克风或真实语音。既有origin-trial meta不变，签名和生产Chrome接受仍未核验。

## 验证证据

- Node24.22.1，Web typecheck通过；4文件96项测试通过，其中当前WebMCP19项。覆盖小入口/弹窗、无API普通表单、完整与局部直接写、未提供字段/ID/步骤/人物选择保留、未完成稿、未知深层字段/人物ID/形象/答案引用、无正文输出、ABA/重复调用、保存失败、溢出时长下其他字段可改、sharing busy、storage读取失败/事件/即时对比/缓存期间变更、旧回调与迟到注册失败。
- Web生产构建及预设postbuild检查通过。复用本WT原hash校验图片缓存，未新增下载或改资源。
- 独立只读实际代码审查无数据完整性/lifecycle阻塞；发现的分享busy入口问题已修并加回归，复核通过。审查者没有独立重跑测试，不混称双重运行。
- 原生IAB在同一5176服务的`http://localhost:5176/editor?demo=1`独立测试来源验收，未在用户`127.0.0.1`来源写任何表单或localStorage。新页初始表单为空；实际guide/state/update工具发现成功，局部标题/背景更新立即显示并保存，再用本Chat先前创作的虚构三人物午餐故事完整填入，返回`updated/saved:true/issues:[]`，表单/三步完成标记/人物预览正确，无候选面板。
- 新入口及原生dialog开/关已检查；当前桌面截图：[入口](webmcp-entry-polished.jpg)、[实操说明](webmcp-help-polished.jpg)。原[表单](webmcp-direct-edit-form.jpg)/[技术说明](webmcp-direct-edit-help.jpg)保留作被替代的历史样式。四图均经file确认JFIF JPEG后使用.jpg，只含本Chat生成的虚构内容，无用户原稿/账户信息。每次测试页均临时打开并于验收后关闭，不增加长期消费者。
- 本次UI增量额外通过Web typecheck、editor-webmcp/editor-page两文件49项，以及Web build/postbuild；独立只读源码复核无阻塞。工具数据/写入/存储保护未改，只有成功状态不再显示技术文案（status初始/ready为null，失败保留）；此前96项是直接写入版本的基线检查，不冒称本批又重跑四文件。浏览器本批未调用写工具、未碰用户127来源稿件。
- 以上是工具与UI验证，不证明中文创作质量、推理趣味、真实角色表现或作者总耗时收益；未触发真实voiceagent/模型API/WS/mic/分享POST。

## 所有权与交接

继续使用独立WT`/Users/nighca/.codex/worktrees/c4e9/lie`、branch`codex/webmcp-authoring-research`。原始base35e987a；本次相对已冻结旧头`3e68803a722492f3a09dfffa6dc8a8026770501a`追加提交，旧四笔不amend。当时实施基线local main8449b1a相对原base只有文档变更，无Editor源码交叉；当前组合基线为main730ba84，不将历史文档状态当已发布证明。

原服务PID48877/exec session35629曾strict127.0.0.1:5176供用户体验；最终接受后owner原session Ctrl-C exit130，精确ps48877与lsof5176 LISTEN均空，consumer已释放。无新服务、无端口/代理/受保护资源修改。用户原127页/草稿未被验收工具修改；原独立Demo槽不作自动迁移。总协调负责全diff审查、中央计划/服务登记和后续集成发布判断。
