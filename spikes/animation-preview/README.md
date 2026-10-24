# 动画候选预览

作者页使用正式 AnimatedPortrait，不激活生产清单、不连接麦克风。

- `appearance=<id>&src=<package URL>`：旧单角色链接仍支持，src只属于初始人物，不能全局覆盖其他人物。
- `src.<id>=<package URL>`：在URL中配置多位候选。
- `VITE_ANIMATION_PREVIEW_CANDIDATES`：开发服务启动时配置JSON对象，键为人物ID、值为包URL。共享候选目录让旧单角色链接也能切到其他已完成候选。优先级为旧src对应人物覆盖 > src.id覆盖 > 服务目录 > 正式清单 > 静态回退。
- 外部worktree的包URL可用Vite的/@fs路径；`ANIMATION_PREVIEW_CANDIDATE_ROOTS`为允许读取目录的JSON数组，兼容原单个`ANIMATION_PREVIEW_CANDIDATE_ROOT`。只给明确需要的候选目录，不允许整个家目录。

5351共享入口和5352/5355历史候选入口应运行同一模板、同一已完成候选目录；不要从旧候选分支再次启动带全局query.src的旧Preview.vue，否则又会发生换参考图却不换动画。端口只是作者服务配置，不属于动画包契约。运行环境配置不入生产manifest，候选仍需制作owner实际自验与root独立review后接入，银发之后按已批准流程不逐人等待用户。

2026-10-24：在用户原5355链接实际用下拉切银发、回阳光、再回银发，参考图与动画均正确，waiting状态保留，console error/warn为空。原生证据见本目录preview-5355-silver-switch-fixed.jpg。
