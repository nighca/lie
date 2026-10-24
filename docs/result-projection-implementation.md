# 被指认人物结果的只读投影前置

2026-10-25，基于reviewed main `bf0583753c518adc5f6e61e7dd80d2b0ce99ff84`，按主协调明确分派实现结果页两态需求的数据前置。原方向与后续视觉/动画契约门禁仍见 `result-character-states-proposal.md`；本次未实现结果人物UI或两种反应素材。

GameView新增 `result: { readonly characterId: string; readonly correct: boolean } | null`。getView逐次从session.result显式复制这两个字段，不使用最后询问者、不返回核心result对象本身，不投影culpritId/profile或result.reveal；已有顶层reveal仍只在solved返回。调用方修改旧view里的结果对象不会改变session或后续view。

没有改accuse/stopVoice/epoch、wrong终局、restart/load/end或核心规则。restart回intro和load开始立即清旧结果；加载失败保持null；新局正常结束没有旧结果。既有endSession只允许interrogating，solved/lost直接end仍invalid-phase，本次不为结果前置引入新命令语义。

新增独占controller-result.test.ts的7测试，覆盖问甲指乙的correct/wrong、错误不泄露真相、语音已关闭及旧epoch事件隔离、旧快照修改隔离、restart/后续end和load中/失败清理。初次load成功fixture曾因请求id与返回game.id不一致失败，修正fixture后全Web183测试、Webtypecheck/build和60资源严格检查通过；diffcheck通过。无其他测试fixture改动，也无App/style/Editor/动画/manifest/服务/浏览器/mic/provider改动。尚未合main或发布。

## root组合候选独立验证

原生产来源`6ca375176fa922f9d5bef566277257c810598460`已cherry-pick为候选`17fb2ee2f269c7c4d2de03cae2415f5af84a5542`，base为reviewed main `345a3135f3dec0c18003b0a5cd9302a4c606725d`。独立复核完整diff与getView/accuse/end/restart周边，生产仅controller两行新增；不改UI、玩法或新动画契约。Node24.22.1下Web17 suites/183 tests、Web typecheck、production build及60资源严格检查全部通过，测试使用fake，不替代真人语音。本批后续只校准三份文档；候选准备由root本地集成，尚未main/push。

三角色旧候选`d4b0580`的检查属于旧基线；本投影进入main后，三角色必须从新main重建并复跑组合checks，不能用旧候选hash直接合main。正式结果UI和新素材仍未实现，新两态动画播放契约未获批准，沿原提案门禁。

本轮root实际review生产两行、7项测试和周边命令语义，独立Web183/类型/构建60资源通过；同批仅另加无凭据开发WS诊断与文档，没有改变运行逻辑。随本轮已验证候选快进本地main，未push；实际main SHA以仓库HEAD为准。
