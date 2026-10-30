# 旧工作树清理前的必要资料补存

2026-10-27。盘点/补存基线 `f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`。用户要求清理旧 LIE 工作树、只保留当前 main；此批仅保存默认历史尚缺的设计与必要附件，不恢复旧实现，不授予旧方案批准，不修改生产或执行清理。

## 保存内容

[逐文件来源与原字节 SHA256/Git blob](sources.json)共 50 项，4,508,157 bytes：

- `interaction-prototype/`：`/private/tmp/lie-interaction-prototype`、冻结 HEAD `d494d34b9b3b994f11a452d548fdfc1d42e6fa75` 的 12 个缺失文件，含 README、低保真 Vue 原型、测试及构建配置。原型是已完成的历史流程设计，模拟数据、不接真实服务，早期错误指认后可继续等行为不代表当前规则。全部保存为 `.txt` 原文，非当前可执行项目。
- `browser-architecture/`：旧工作树的四份 dirty 原文（AGENTS、README、deployment-options、validation）。后两份 SHA256 与 [10月25日旧 dirty 映射](../../2026-10-25/history-followup/README.md)一致；彼时只有实质内容映射，尚未保存原字节。此次补齐。归档 AGENTS 是历史文本，不是当前指令；未改其旧审批、探针状态或相对链接。
- `ignored-design-evidence/`：23 个早期设计附件，包括未采用 mint 初稿、玩家头像/指认/界面对齐/窄屏/转写的截图与有限展示 harness。均未在 main 历史找到同 blob；原图和源文本原字节保留，文本 harness 加 `.txt`。UI 对齐图是[现行历史说明](../../../ui-alignment.md)所引用的早期本地证据，模拟画面不作为新增真人、麦克风或当前视觉通过证明。未采用初稿补足[来源说明](../../../../design/appearances/diversity-studies/batch-two/README.md)，不替换正式形象。
- `review-handoffs/`：原 review 所有者工作树 ignored tmp 中尚未在 main 历史找到原 blob 的 11 份必要脱敏审查/探针/结果。已有对应归档不删除；本批补齐原交付，避免清理后仅剩聊天。保存为 `.txt`，旧绝对路径与运行命令只表示历史来源。

## 覆盖与排除

只读检查 19 个 `/private/tmp/lie-*` 登记工作树的 status、HEAD docs/design/prototypes blob，并对这些分支相对 main 的上述目录历史对象核对；除本批原型外未发现该有限范围中的新缺口。不是全机器、已删除分支或所有任意 ignored 内容的无遗漏保证。必要附件按已知设计/验证引用筛选，不复制 node_modules、dist、工具/图片编码缓存、派生 public/appearances、供应商原始输出或一般执行日志。

`invite-access-design/lie` 中未跟踪的 `docs/archive-inbox/invite-access-paused-2026-10-25/README.md` 及三张图已与 [main 的暂停归档 manifest](../../2026-10-25/invite-access-paused/source-manifest.json)逐项 SHA256 相等：README 对应 implementation-handoff.md.txt，三图对应 evidence 同名，故不重复存放。

凭据文件仅识别路径，不读其正文、不入 Git。其他 unknown ignored 素材和必要私密状态由清理执行者另外保存在仓库 `.git/worktree-cleanup-preserved/2026-10-27` 私密备份；该位置不是设计默认历史的替代，也不是本批已检查其原始内容的声明。真实音频/私密协议/凭据不会因本批而获上传授权。

## 检查和清理边界

所有快照与来源 SHA256/字节一致，来源未改动；来源 JSON 可解析，新索引相对链接可解析，文本凭据模式检查、diff whitespace 检查通过。旧原文内的路径和旧命令有意不改写，不将它们当现行入口或重跑探针。无应用测试、构建、浏览器、供应商、网络或服务操作；未删除工作树/文件、未更改源分支或 main、未 push。

由 root 完整审查并把本批纳入默认历史后，清理执行者才能结合私密备份、服务所有权和实际状态完成删除；本补存提交本身不是已经完成清理的证据。
