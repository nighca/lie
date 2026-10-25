# 草稿状态移到步骤条下方

2026-10-25 用户新增授权：把编辑器原页头左侧的保存/恢复提示与清除草稿入口整体移到三步导航下方，水平居中。基于同批公共高亮消费者之后独立提交，未更改draft/KeepAlive/路由或任何存储逻辑。

原saveStatus != null条件、role=status、busy禁用与overlay=clear点击行为全部保留。Editor局部flex-wrap + justify-content:center，13px muted文字、行间距6px、距步骤条8px；窄屏能换行，不挤步骤条。不写global style.css或ProductHeader共享组件。

既有editor-page品牌/恢复测试改为检查新区域及其上方为创作步骤nav；清除取消/确认/失败、草稿出现与消失、缓存/预览等行为沿用原回归。相关3文件52项/types通过。桌面/391实际图与最终全套结果随本批公共高亮最终验收补齐。
