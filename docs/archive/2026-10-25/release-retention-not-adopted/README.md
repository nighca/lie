# 旧版本资源保留方案 — 未采用

2026-10-25，用户明确决定：**“不需要考虑旧版本兼容，老版本资源可以删除。”** 本决定替代候选中等待确认的旧版本保留政策。取消61a4f4d → cad7fd7 → 14a32fb实施队列，以及14天artifact保留、current＋最多两旧代、累计256MiB发布预算的选择/审批门禁；不接入CLI/CI，不再为这些选项询问用户。现有hash构建仅交付current资源即可，无需新增实现。

本批只存档、更新状态，**没有实际线上删除、推送或部署**。允许删除旧版本产品资源，不等于授权删除Git设计历史、分支/worktree、凭据或广泛账号/GitHub工件。必要设计及审查历史永久保留；归档不使方案生效，也不授权执行旧命令。旧页面请求未缓存旧hash可能404，是不提供跨版本兼容的已知取舍，不把新字节冒充旧hash。

## 保存内容与来源

- [候选README原文](README.md.txt)、[修正记录原文](corrections.md.txt)：从最终候选14a32fb原字节保存。原文“仍等用户确认”等措辞只表示当时状态，已被上述不采用决定覆盖。`.md.txt`内链接/命令按原source上下文解释，不能当现行运行入口。
- [完整来源与代码方案引用](sources.json)：记录原base、完整有序三SHA、各原始路径/Git blob及副本SHA256。代码/CI/测试/verifier/构建证据仍在冻结Git来源，不重放到现行生产路径；可用`git show <source_commit>:<source_path>`恢复。不得仅因不采用就清理唯一来源refs。
- [独立代码审查](../../../reviews/release-compatibility-2026-10-25/README.md)：RC01/RC02及后续修复属于候选技术历史，不是发布或用户采用证据。root实际读完修正、独立Node24 21/21通过；source另报本地build/Miniflare17，均非远程部署。

来源base：`be83810d1dafcf1cc1270520e669885661b24088`；branch：`codex/production-release-compatibility`。有序提交：

1. `61a4f4d9975cb7aaf259ebdb6f136c9ad8c03bb0`：最初有界保留候选。
2. `cad7fd7e387f3797a941785b51545bce2c87778a`：过期API缺失/历史分页修正；含随后修复的fixture语法失败历史。
3. `14a32fb39a95caa33bcce6bdbe1c3cd5cb3e283c`：fixture独立修复，最终候选。

本存档未复制凭据、认证头、私人配置或临时执行日志；未启动服务、浏览器、provider或麦克风，未修改自动化。现行安排见[项目计划](../../../project-plan.md)与[协调handoff](../../../coordinator-handoff.md)。
