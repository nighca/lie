# 结果页被指认人物与两种反应：接入提案

2026-10-25；源码调查基线 `08cf274bcd733afa0ace90dddcd870743b8e4331`。用户倾向 **A：保留现有指认流程，在结果页加入被指认者，区分指认正确/错误**；合并指认界面为备选。本文件保存只读调查与建议，不代表视觉反应、动作播放方式或新动画契约已获批准；不授权新素材制作或依赖实现。方案需主协调和视觉owner进一步确认，不能以轮换或用户未回复作为批准。

## 已有行为与最小数据接口

[规则中的 AccusationResult](../packages/game-core/src/session.ts)第14–18行已有characterId/correct/reveal；93–98行accuse保存实际被指认者，依据correct进入solved/lost，并将currentCharacterId清空。wrong的reveal原本为null。规则不需要重设计，案件、人物数目和id都应保持内容驱动。

[GameView及投影](../apps/web/src/application/controller.ts)第7–20、65–78行目前只投影reveal，未暴露result；254–259行指认已先stopVoice再提交结果。建议最小新增只读投影：

```ts
result: { characterId: string; correct: boolean } | null
```

直接从session.result复制上述字段，不投影culpritId或错误结局的完整经过，不将最后询问人物作为被指认者。App通过result.characterId在已有view.characters中解析姓名和appearanceId，再查形象清单；不新增案件专属分支或写死三人。

[当前结果页](../apps/web/src/App.vue)第140–153行：solved已展示完整经过，lost已是终局且只提供重新开始/返回；165–175行指认对话框独立。建议保留这些规则与路由语义，在两个结果分支增加同一个被指认人物呈现；A不需要合并弹窗或增加一次确认。wrong仍不揭真相、不得在同局继续指认；restart/load/end等状态按真实session结果清空投影，防止旧人物残留。已有完整案件数据可在浏览器检查，不等于错误结果UI应主动展示真相。

## 兼容方案与待确认点

[动画类型](../packages/character-animation/src/types.ts)当前只有default/listening/waiting/speaking；[严格解析器](../packages/character-animation/src/package.ts)第95–96行只允许并要求这四态。直接在包里增加两态会被当前parser拒绝，不能先投素材再假定播放器支持。

1. **最小第一步**：结果页先显示被指认者的现有default立绘/idle动画，用文案区分correct/wrong。无需改动画契约，但不能把它称为已完成两套新人物反应。
2. **拟议兼容扩展**：保留原四态必填，新增两个可选结果态（最终命名待定），旧包缺少时统一解析到default。类型应区分必需基础态与可选结果态，避免将全部旧包、旧预置或自定义案件变成必须六态。Timeline统一解析有效clip，沿用现有采样/加载/取消/回退，不为单个人物加分支。新parser向后读取旧包；旧strict runtime仍会拒绝新字段，所以runtime和新资源要组合验证，不能宣称旧页面无条件向前兼容。
3. 若视觉只需静态两种表情，可只扩充可选结果静态图，不先扩播放状态机；这仍需要内容工具链契约review。为结果另造一套播放器或复制人物规则没有必要。

[现有Timeline](../packages/character-animation/src/playback.ts)第53–57行按state选clip，sampleClip已支持loop:false后保持末帧；如视觉选择一次短动作，可复用此能力，无需因新场景引入新引擎。动作是一次后停、持续小循环还是仅静态，两种反应的表情/身体语义与强度，需视觉owner给方案并确认。建议用“被指认正确/错误”的人物视角命名，避免把玩家胜负情绪直接套在角色上。合并指认界面、扩大规则或增加额外结局仍是独立产品决定。

## 静态回退、减少动态与窄屏

[AnimatedPortrait](../packages/ui/src/components/AnimatedPortrait.vue)第14–26、44–56行已有reduce静态slot、加载/版本/尺寸/渲染失败回退、隐藏暂停、卸载与迟到换人隔离，可直接沿用。结果无动画时先回default立绘，缺图回姓名首字。若reduce也必须显示对应的正确/错误表情，则应为清单提供可选结果静态图：需要一起review [CharacterPreset读取](../apps/web/src/presentation/characterPresets.ts)、[源清单类型](../design/character-presets/manifest.types.ts)及[生成器](../scripts/character-presets.mjs)的严格字段、固定路径、实际PNG与确定性输出；未具备的角色仍回default。

AnimatedPortrait第68–69行是display:contents和绝对定位130%高canvas；调查img也有同样取景。当前结果卡只是文本流，不能直接嵌canvas而没有定位/尺寸容器。建议结果场景独立的明确尺寸舞台，统一img/canvas取景；391下人物和长经过上下排、正常纵向滚动、不遮返回/重新开始操作，焦点与姓名可访问。具体裁切/比例由整体视觉方案确定，不能顺手改调查舞台或Editor布局。

## 允许分工建议（尚未授权实施）

| Owner | 独占范围 | 依赖与交付 |
| --- | --- | --- |
| 应用接入owner | controller.ts、App.vue、style.css及controller/App/导航测试 | 保持result.characterId与wrong终局约束；待fan/Editor当前App与style所有权释放后串行接入 |
| 动画契约owner | character-animation types/package/playback及测试；AnimatedPortrait必要类型/测试 | 视觉和契约确认后，先实现旧包兼容与缺态回退，不触voice或规则 |
| 内容工具链owner | CharacterPreset读取、manifest.types、character-presets生成器及测试 | 仅在确认结果静态资源需求后增加可选字段；与动画契约先对齐名称/路径 |
| 视觉owner | 独立单人候选目录、两种反应及静态/末帧方案 | 先方向确认，再逐人成品验收；未批准资产不写正式manifest |

主协调持有集成队列，统一分派共享App/style，不允许各owner并行覆盖这些文件；新动画资源和契约先分别review，再组合接入。此文档不替代当前活跃owner的交付，也不自动启动实施。

## 具体验收条件

- controller：询问甲后指认乙，result.characterId必须为乙；solved只展示正确经过，lost的reveal仍null；lost不能继续询问/改指认；restart/load/end正确清空旧结果。保留语音先关闭和旧epoch隔离，不为结果播放再开mic/provider。
- App：correct/wrong均显示实际被指认者姓名/形象；wrong不出现经过或真凶提示；correct保留完整经过；重新开始和返回原行为不变。覆盖预置缺失、缺图、动画失败、无动画、状态切换晚加载，不能残留前一人物。
- 契约：旧四态包仍解析；仅实现一个可选结果态与两态都缺省均可回default；坏引用仍严格拒绝；新非循环动作末帧保持、切换/中断/卸载/隐藏恢复正确，不遗留RAF或部件。若支持新结果transition，另明确端点规则，不自动放宽所有未知字段。
- 工具链：可选静态图缺省合法；提供时按明确命名/路径与实际尺寸校验，生成/strict check/public/dist字节一致，不修改旧静态或其他角色。
- 内容与布局：覆盖可变人数、用户自定义案件/形象引用；桌面和实际391、长中文经过正常流动；reduce及系统偏好运行切换保留静态表达，失败回退不空白，姓名/焦点/按钮可访问。先自动化/假供应商验证，再独立浏览器视觉验收，二者不冒充真人语音或逐人成品美术批准。

此次仅保存调查：没有修改源码/素材/总计划，没有启动服务/浏览器或运行真实语音；文档diff与本地链接检查作为本次完成标准。
