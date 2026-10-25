# 共享品牌组件：右下方接触笔触

2026-10-25 用户批准右下方方案并要求：‘下划线再往左一点，跟 logo 有接触；其他我没问题了，直接实现吧’。本批实现该批准，不要求重复设计确认。

ProductHeader 移除右侧“语音推理”，保留原 Logo SVG 路径、圆点交互动效、首页无障碍名称和调用者导航。品牌链接框桌面136×64、窄屏114×54；伪元素复用 /brand/underline.svg，−8°，桌面约x62/y45/68×9（相对上一设计x70/y49向左上接触E下缘）。Logo z-index1，笔触0并pointer-events:none，重叠处Logo在前。样式仅组件内部，不改首页/App样式或其他手绘标题。

实际检查：UI 5文件59测试通过；packages/ui vue-tsc通过；web build及postbuild通过，8预设121素材检查通过。构建存在现有Vite native config导入后缀提醒及哈希underline路径构建期未解析提示，产物实际包含该哈希SVG；未作为无警告构建报告。

原生IAB自建tab48查看1280×878首页、391×844首页和调查页：品牌尺寸136×64/114×54，无横向溢出；查看截图确认笔触接触及层级。桌面截图和窄屏调查截图分别归档于 design/header-logo-implementation/desktop.png、mobile-investigation.png。未重验编辑器行为或真实语音。首次窄屏截图处于视口过渡不用于证据；回首页最后一次导航ERR_ABORTED，未盲重试，随即恢复视口并关闭tab48。此前调查页截图有效。

5544临时服务原PTY78961停止exit130，lsof核无listener后已交还主协调排队；未碰8787/8788/5355或用户tab/草稿。测试首次命令config路径重复导致启动失败，修正后曾因默认沙箱无法写Vite缓存失败，授权owned-WT执行后59项通过；无审批拒绝。

源branch codex/header-logo-implementation，base8aa7ec967dfad45bf1646cdd27c6d909bebec437，WT /Users/nighca/.codex/worktrees/background-character-names/lie。仅ProductHeader、删除旧品牌文字断言、本文档与两张真实截图。由主协调审阅/集成/发布，本chat未改main/push。
