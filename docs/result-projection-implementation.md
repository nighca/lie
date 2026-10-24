# 被指认人物结果的只读投影前置

2026-10-25，基于reviewed main `bf0583753c518adc5f6e61e7dd80d2b0ce99ff84`，按主协调明确分派实现结果页两态需求的数据前置。原方向与后续视觉/动画契约门禁仍见 `result-character-states-proposal.md`；本次未实现结果人物UI或两种反应素材。

GameView新增 `result: { readonly characterId: string; readonly correct: boolean } | null`。getView逐次从session.result显式复制这两个字段，不使用最后询问者、不返回核心result对象本身，不投影culpritId/profile或result.reveal；已有顶层reveal仍只在solved返回。调用方修改旧view里的结果对象不会改变session或后续view。

没有改accuse/stopVoice/epoch、wrong终局、restart/load/end或核心规则。restart回intro和load开始立即清旧结果；加载失败保持null；新局正常结束没有旧结果。既有endSession只允许interrogating，solved/lost直接end仍invalid-phase，本次不为结果前置引入新命令语义。

新增独占controller-result.test.ts的7测试，覆盖问甲指乙的correct/wrong、错误不泄露真相、语音已关闭及旧epoch事件隔离、旧快照修改隔离、restart/后续end和load中/失败清理。初次load成功fixture曾因请求id与返回game.id不一致失败，修正fixture后全Web183测试、Webtypecheck/build和60资源严格检查通过；diffcheck通过。无其他测试fixture改动，也无App/style/Editor/动画/manifest/服务/浏览器/mic/provider改动。尚未合main或发布。
