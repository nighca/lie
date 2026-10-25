# 结果页 A 方案实施

2026-10-25。用户在调查专项chat审阅correct左右稿与wrong v2居中稿后明确“没问题，按现在的版本实现吧”。该授权用于当前布局和现有default立绘，不含未来两态表情/短动作或资源契约。设计与变更脉络见[视觉提案](result-scene-visual-proposal.md)；本批base为reviewed local main `30385c296eafe68b0403706f6ac63a37ce96487b`，由主协调给定独占App/style turn。主协调仍唯一集成者。

App复用已有GameView.result.characterId查实际被指认者，查预置default立绘、accent；结果页不播放动画；没有形象或图失败时保留姓名与首字，不能回最后询问人物或显示另一人。correct/wrong共用结果壳，正确页左人物右完整经过、按双换行分段并保留段内换行；错误页最大760px居中单列，短说明且无完整经过。保留原controller.restart、navigateHome和returnLabel语义，不更改wrong终局/指认次数/返回策略。原生结果h1挂载后获得焦点，随后Tab进入原两操作。

结果样式独立定尺寸：桌面correct舞台300×310/wrong260×230，contain完整立绘；700px及以下均220×180单列，正文16px正常流动、两按钮跟在末尾，无固定底栏/内层长文滚动。清理旧结果装饰方块及过时直子按钮间距规则；未改变调查/Editor舞台、动画/供应商/引擎/controller或正式资源。

## 验证

- 独立 `result-scene.test.ts` 五项行为测试：最后选择者与实际指认者不同的correct/wrong、默认图与姓名、标题焦点、完整经过/错误短说明、定制returnLabel与navigateHome、重开清理、缺预置/图失败首字、长姓名/显式换行和长段落。
- 完整Web 19文件/196测试通过；Web typecheck通过；production build与8人物89资源严格检查通过，Node24.22.1。首次跑测仅一条既有editor-navigation旧“本局失败”文案断言失败，经协调授权只把该行与App.test对应一行改为已批“本局结束”；新测试一处 get().exists() 类型误用已删除后类型检查通过，最终checks均过。
- IAB实际Application/controller：1280/391，正确/错误、实际人物、分享长文、无形象、真实图失败、原生键盘焦点/滚动、错误后重开再正确、分享返回首页、reduce。具体量值、七图、限制及服务登记见[实施验收证据](../design/result-scene-implementation/README.md)。不用fake成功当真人语音证明；未另操作真实Editor草稿，返回编辑器接口由定制returnLabel/emit与既有Editor导航测试覆盖。
- 源码diffcheck、本地文档链接、证据JSON/PNG/哈希检查在交付前完成。无新依赖、mic/provider调用、main更新、push或部署。

## 所有权与交接

生产只改App.vue/style.css；测试仅新增结果UI文件及两处获批旧文案断言。额外证据路径design/result-scene-implementation/**已获主协调批准。Application.vue/main.ts/Editor.vue/现有加载与动画测试未动；并行catalog任务会改Application props和导航测试挂载，组合时需保留双方的接口变更和新wrong标签，不回滚另一方。

临时同源fixture已删除，原PTY30600停止PID44546并核5507释放，两自建tab与网络/媒体覆盖均已释放，无保留服务。所有源/必要图/限制在本批提交中留存；原设计源0c65ea1→e743283保持冻结且已在base，不重放。结果新情绪素材仍另行确认后才可生产。

## 主协调组合审查

root已实际核source d97a13b11ed5e38f9bdc3acfe39c9c83aa91d43a clean、完整18文件diff/周边生命周期/新增5tests与原生错误页、长文到底、图失败3图，无blocker。从最新main c540b70有序cherry为候选7b4d96a759fb61455c8a9fa03897155e0f59b621；editor-navigation自动合并后同时保留同步catalog挂载与“本局结束”断言，root逐hunk核实。独立执行者在固定真实候选Node24.22.1复验完整Web24文件220测试、Web类型/生产构建8预设89资源strict全通过，前后HEAD未变/tracked clean。root另核App/style/lock/形象source hash与原QA身份一致，复用原IAB画面/键盘/回退证据；未另外声称真实组合IAB或真人语音通过。main快进前重核SHA/clean，未push/部署。
