# 自编内容信任边界审查与草稿保存修复

2026-10-25，固定base **`2e24d32c098773728ae18c636c0492d622ce859d`**；独立WT `/Users/nighca/.codex/worktrees/split-ci-cd-workflows/lie`、branch `codex/content-boundary-review-20261025`。root唯一integrator，后续main0d仅文档且产品身份未变，不重建或改base。一个新确认P2已在候选有界修复，未main/push。

## CB01 — P2：异常时长被静默保存为null，导致整份草稿无法正常恢复

触发：已有完整可恢复草稿，真实Editor的数字输入填有限值`1e308`分钟。`Editor.vue:42`乘60得到Infinity；原`draft.ts:70–72`直接JSON.stringify将其变成null，setItem成功，界面仍说“草稿已保存至此设备”。下次挂载`loadDraft`因number字段为null拒绝整份草稿，标题等变成空白新稿。原JSON中的其他文字当时仍存在，但普通恢复入口不可用；按界面提示继续新创作会再覆盖它，不把这一点夸大为原文本字节在首次写入时已全部消失。

[修复前结果](before.json)及原探针在 **`3c44d530e4776b28cd842a53e5d0d1b4215d64e7`** Git历史完整保留（该提交的3/3断言是确认原错误，不是功能正确）。精确位置当前为[saveDraft:70–72](../../../apps/web/src/editor/draft.ts)、[分钟换算:42及保存watch:47–53](../../../apps/web/src/editor/Editor.vue)。预期是不可JSON保真的字段不能覆盖最后可恢复raw，也不能声称保存成功；实际造成完整案件恢复失败，故为P2。此前RSM01/02涉及试玩内存/复制竞态，本问题不是重复。

root明确授权的修复 **`5ceb7d5de718d8c0a7aeab4a4159562f3e5526a6`**：

- `saveDraft`在任何setItem前以Number.isFinite拒绝NaN/±Infinity（JSON不能保真表示），throw带修正询问时长提示的RangeError；原raw逐字节不动。
- Editor保留未保存警告；仅RangeError使用具体时长提示，普通存储错误原“浏览器不允许保存草稿或存储空间不足”文案保留。跟踪本次保存错误文本；下一次真正保存成功，仅在notice仍匹配该保存错误时清除，不清除草稿读取/分享等其他功能提示。
- 修正时长后保存全部最新内存编辑；重新挂载仍能读取原先可恢复故事。未增加任何任意时长上限、core规则/兼容协议、云同步或多槽草稿。已有有限但暂不可玩的编辑值仍可按原编辑草稿语义保存；core正安全整数规则不变。

## 实际范围与另两项探针

先读既有remix-state审查、released-share/editor八场景、native-share600未执行矩阵及RSM修复记录。实际源码涵盖share流式解压/UTF8/JSON/core验证、draft读写/移除人物/改编复制、Editor保存/分享/恢复、Application fragment revision/remix raw重读、core内容/会话/上下文，及公共纯文本姓名展示/投稿文件名边界。现项目没有单独任意JSON文件上传入口；此处“导入”指fragment解码与本地JSON草稿恢复，不虚构产品接口。

总共只做三个有依据场景，无fuzz：

1. CB01上述真实Editor复现；修复后同一场景正向核原raw、恢复、内存新标题及错误提示消失。
2. CB02经真实gzip链接解码的`__proto__`/`constructor`角色ID，进入真实core并分别写历史，归属隔离；额外assetURL字段被正规化丢弃，没有原型污染。不是新增ID限制。
3. CB03 gzip本身有效但UTF8非法的payload，解码失败且原有草稿原始字符串不变；没有把既测CRC/解压炸弹或RSM场景重跑当新发现。

后两项没有新finding。既有128KiB解压限制/16k暂定URL、重复姓名兼容、纯文本边界与异步revision均按已约定范围审查，不自行缩小内容/人数/时长契约或宣称全部极端输入安全。

## 验证、交付与限制

[最终正向探针](probe.test.ts)/[独立配置](vitest.config.mts)、[修复后结果与源码SHA](after.json)均入库。Node24.22.1/Vitest5.0.5，既有同锁依赖，无安装。修复后3/3通过；受影响editor-draft/editor-page/editor-navigation/editor-sharing四文件 **78/78**，Web typecheck通过（pretypecheck生成8/121）。新增回归包括NaN/±Infinity不触写及正常恢复，真实输入overflow保留raw/在修正后保存新编辑并清notice。没有其他失败或未完成长检查。

```sh
node node_modules/vitest/vitest.mjs run --config docs/reviews/content-boundary-2026-10-25/vitest.config.mts
npm run test --workspace @lie/web -- test/editor-draft.test.ts test/editor-page.test.ts test/editor-navigation.test.ts test/editor-sharing.test.ts
npm run typecheck --workspace @lie/web
```

复现前态可在独立checkout取原证据提交3c44及其源码再跑同配置，不在共享WT回退。探针只用隔离jsdom localStorage，所有fetch设为抛错且逐项核零调用；未读写用户草稿。无native browser、监听器服务、provider/mic、付费、账号、build/编码或全工程测试，不代表浏览器原生数值控件或未执行native矩阵验收。普通浏览器溢出机制由JS Number/JSON确定，UI触发由真实Vue组件/jsdom实测，边界如实区分。refs/其他owner文件/5355与8787/8788均未动，无清理尾项。

## root审查后的notice范围收敛

root指出5ceb成功保存时无条件notice=null超出保存修复范围；原提交冻结保留。追加仅记录saveNotice文本归属，成功保存时只清仍匹配该错误的notice。新增回归证实原有草稿读取失败提示在成功编辑保存后按旧语义保留，overflow修复后保存错误仍能消失。最终局部editor-page **25/25**、原边界三probe **3/3**、Web types通过；未扩探针/构建/全套。78项通过属于5ceb初版，最终仅此notice范围差异按上述受影响检查复验，证据口径分开。

## root最终组合核验

实际干净main0d8bf05上有序cherry source3c44→5ceb→5af→8f1193为候选ebc067c→1c205ac→91f5f6e→84f7b44。root实际检查完整diff与Editor/draft/share/core周边，确认最终仅两个生产文件；2e24至0d8四路径全部文档，生产、依赖及组合未变。四个生产/回归文件与source最终SHA逐字节一致，after.json哈希均相同；故按原范围复用source25page/types（及初版78历史检查），不冒称最终重新全套通过。候选独立重放原3项正向探针3/3通过（930ms），无网络/服务/浏览器/用户草稿访问；不重复build/编码或无关测试。文件名核对首次受Git引号转义影响断言失败，改用NUL分隔重查4条实际docs路径通过；不是应用或测试失败。root最终本地快进后以实际main为准，未push。
