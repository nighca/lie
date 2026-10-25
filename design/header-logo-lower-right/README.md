# Logo 右下方下划线 · 完整页面设计

状态：proposal，待用户确认。用户指出上一版在 Logo 正下方，应改为右下方，并要求带完整页面看效果。本版取代上次的位置建议，不构成生产实施批准。

- desktop-page.png：1280×1280展示板，内含1280×1180完整首页与说明区；四个当前案件、人物和玩法流程。
- mobile-page.png：1280×1280展示板，内含391×1580窄屏长页缩略图及391px首屏原尺寸对照。
- desktop-page.svg / mobile-page.svg：独立完整页面矢量源。
- brand-mark.svg：142×64 组合框，Logo 字形保持 105×56。下划线 x70/y49、68×9、旋转 −8°；从 E 下缘附近向右伸出。下划线先画，Logo 后画，重叠处字形在前。
- preview.html：离线完整页面预览，按窗口宽度选择桌面/窄屏源图，无应用行为或外部网络请求。
- generate.py：可复现SVG/HTML/JSON源文件，不生成PNG；PNG为已检查的QuickLook展示快照，不声称跨环境逐字节重渲染。source.json记录基线、品牌资源身份和参数。

只使用既有 Logo/underline 路径与颜色、现有人物 avatar PNG（sips 缩小到384px）、当前四案标题与摘要、系统字体。没有新增字体或人物图。完整页面是依据当前 Application.vue/style.css 的静态重绘；人物位置、换行和角色计数为上下文示意，案件卡片未重绘角色小头像，不作为其他页面布局改版提案。不是实际应用截图或浏览器响应式验收。

已检查两张 macOS QuickLook 原生 PNG；SVG XML、JSON、Python语法、PNG格式尺寸和本地引用已核对。只改本设计目录及配套 docs，无生产代码改动；没有服务/浏览器/应用测试/构建。用户确认后再由主协调安排正式实现。

源基线 0abc82d1acdfbaedab19888cd94ac5eaad166ab1，分支 codex/header-logo-lower-right；由主协调审阅归档，未集成main/推送/发布。
