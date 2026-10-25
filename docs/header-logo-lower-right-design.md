# Logo 右下方下划线设计

待用户确认的新 proposal：下划线移至 Logo 右下方，从 E 下缘附近向右伸出；用完整首页桌面/窄屏上下文评估。保留原路径、配色和字形比例，重叠处字形在前。取代上一版正下方的位置建议。

[桌面完整效果](../design/header-logo-lower-right/desktop-page.png)、[窄屏完整效果](../design/header-logo-lower-right/mobile-page.png)、[参数与静态上下文限制](../design/header-logo-lower-right/README.md)。本批仅设计，没有正式组件变化，不因归档而自动批准。

原始 base 0abc82d1acdfbaedab19888cd94ac5eaad166ab1，branch codex/header-logo-lower-right。源图与素材检查通过，未启动服务或浏览器。由主协调 review/cherry-pick，实施另行等待用户方向确认。

归档审查：root阅读完整15文件差异并实际查看两张效果图，独立审验确认SVG/JSON/Python/PNG格式、全部本地引用、品牌/人物素材身份及7份生成源字节复现；生产文件无变更。PNG为1280方形展示板，页面SVG尺寸另列README。没有原生应用验收或实施批准。

最新决定（本稿输出之后）：用户在专项chat `01a16d5c-de69-7452-8d6a-280d15a87e9e` 的直接消息 `01a17268-4218-7ae0-bb05-09f79d06d5ff` 明确要求“下划线再往左一点，跟logo有接触；其他我没问题了，直接实现吧”。root已实际读取，UI专项据此从8aa7ec9实施ProductHeader局部；以上静态文件保留输出时待确认标记，批准范围含该左移调整，不自动批准其他页面重排。
