# 改编→草稿→编辑→分享/试玩状态review

2026-10-25；冻结base **29987714c8df1cd85fba88684680d902106ad673**。owner `/root/character_preset_migration`，WT `/Users/nighca/.codex/worktrees/character-preset-migration-dawn/lie`，独立branch `codex/remix-state-review`。复用前核clean，原 `codex/preset-loading-recovery` 及860ead8提交保持，未操作root/architecture reviewer借用候选。只有本review目录有新增；不修生产，不作main/push/部署。

## RSM-01 — P2：保存失败后正常试玩返回会丢失当前编辑

触发无需刷新、关页或多标签：

1. 正常载入一个有效的已保存改编稿B。
2. 将标题编辑成C；此时setItem因存储额度/权限失败，Editor显示“草稿未能保存，请勿关闭页面”。内存仍为C，localStorage仍为B。
3. 点击现有“试玩”，真实Application进入/editor/preview，controller实际标题为C。
4. 从介绍页点“返回编辑器”，不关闭网页；真实Editor重新挂载，只从localStorage读回B，标题变回B，并显示“已恢复此浏览器的草稿”。C丢失。

[实际探针与结果](probes.test.ts)、[结构化观测](probe-results.json)均确认 `previewTitle=C` → `afterReturnTitle=B`。模拟的存储失败在返回前已恢复，仍不会恢复C，因此不是故意让重载永久失败。这里只改了标题，未虚构其他字段或真人浏览器表现。

定位：[Editor.vue](../../../apps/web/src/editor/Editor.vue)29–32只在挂载时loadDraft；43–48自动保存失败仅设置提示；105–107的preview不保留未保存draft或阻止丢弃。[Application.vue](../../../apps/web/src/Application.vue)57–64/106–110/157–159只保留可玩previewGame，路由切换卸载Editor，返回时重新从单槽存储恢复；不保存原编辑内存。保存故障下的正常内导航因此有实际内容丢失，不是已知QA003“返回步骤位置重置”。这是新确认的错误恢复缺口，不声称由改编提交新引入。

最小修复方向供owner选择：内部试玩往返必须保留当前编辑副本，即使持久化失败；或在丢弃唯一未保存副本前明确阻止/确认。不要将此扩为云同步/多槽版本库。本review未实施任何方向。

## RSM-02 — P3：迟到的旧复制完成污染新分享弹窗

1. 为稿A生成链接，点击复制；writeText Promise暂未完成。
2. 关闭弹窗，修改标题，生成不同的新链接B。
3. 旧writeText完成，新弹窗显示“已复制”，但writeText只调用过一次、参数为旧链接A，B从未交给clipboard。

探针使用真实Editor及真实gzip编码，仅clipboard Promise为可控替身。结果记录 `oldAndNewUrlsDiffer=true`、`clipboardCallCount=1`、`clipboardWasOldUrl=true`、`newDialogSaysCopied=true`。它证明错误成功反馈，不声称实测了浏览器权限延迟或操作系统剪贴板内容。

定位：[Editor.vue](../../../apps/web/src/editor/Editor.vue)125–127在await后只检查mounted，缺少内容/弹窗/复制意图身份；43–46与115/122将新内容的copied清为false，但旧完成随后又设true。用户可能把旧案链接当成新案已复制；一般需剪贴板完成延迟，故列P3。可使完成仅更新其所属内容/弹窗意图；本review不改实现。相同共享copied还服务投稿，但本轮只确认了新分享弹窗，不虚增另一个finding。

## 已核范围及非finding

实际读Application的remix确认/存储重读、取消/discard、route revision与preview流程，Editor保存/清除/校验/分享/copy，draft/share helper，controller getRemixSource/load边界及core validateGame/session合同，相关已有导航/分享测试与已审改编方案。

- 第三个独立probe通过：真实controller结算后getRemixSource与createRemixDraft为独立副本；修改草稿title/profile/ending不改原案或下一次快照；运行转写不进入静态snapshot，新caseID独立。未确认局内状态泄漏。
- 原始草稿存在/坏JSON、读写失败、确认期间raw变更/删除时，Application重读与重新确认路径有明确守卫；route/discard取消pendingRemix，分享decode有revision/unmount失效检查。这里是源码/已有测试review，不冒称本轮重跑了所有这些场景。
- 方案明确保留原多标签写入策略、不承诺跨页CAS/多草稿；Editor不监听storage事件这一既有取舍未单独列为bug。没有重复CR01/02、QA001/002、QA003或quiet CTA样式问题。

## 执行与限制

最终小型probe **1套3项通过**（约614ms）：两项断言确认当前错误表现、一项验证静态隔离；不是功能已修复或应用全套验收。现有Node24.22.1，已核实际依赖版本与冻结lock一致：Vue3.5.44、router5.4.0、Vitest5.0.5、Vite8.3.5、jsdom30.1.3、Vue Test Utils2.5.1、vue-plugin6.0.10；无安装。所有fetch均设为抛错替身，三个probe均断言零调用；voice为本地fake，localStorage是jsdom临时数据，未读写用户浏览器草稿。

从本repo根目录重放：

```sh
node node_modules/vitest/vitest.mjs run --config docs/reviews/remix-state-review-2026-10-25/vitest.config.mjs
```

命令只会更新本目录probe-results.json。初次独立config漏publicDir导致资源导入失败；深复制正向fixture漏openAccusation、结果写入误用被Vitest变换的import.meta.url也已仅在探针补正。没有为获得结论改生产代码；两个缺陷断言在这些收尾修正之前即通过，最终整套退出0。未运行全suite/build、新浏览器/server、网络、mic/provider或付费/凭据操作，无PID/PTY/tab清理尾项。报告仅供root审查/归档及另行排期修复。
