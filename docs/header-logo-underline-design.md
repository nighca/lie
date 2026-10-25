# 头部Logo下划线推荐设计

2026-10-25，状态：proposal，待用户确认。用户要求移除Logo右侧“语音推理”，把现红色手绘下划线移到LiE正下方，先给效果图；本轮仅设计，没有生产实施授权。

[直接查看效果图](../design/header-logo-underline/recommendation.png)；[完整源文件/参数/检查/限制与交付](../design/header-logo-underline/README.md)。推荐保留原Logo尺寸和矢量几何；下划线96×9贴近105×56 Logo底部并保持−5°倾斜，组合105×68，移动约88×57。系统字体/品牌原色不变，正式头部未改。

原生SVG/离线HTML可复用；QuickLook本地渲染效果图已看，桌面/391px上下文为静态排版，不冒充实际App/browser验收。没有启动服务/浏览器，不触碰用户草稿或现有监听。base2268f84f02576d4384f0d30f9f117a70164f135a，隔离branch codex/header-logo-underline；交唯一root审查归档，待用户确认后才安排实现。

root审查：source `94319222d28f525ca0278339dd734c6faa0e8408` clean冻结；已阅读11文件完整变更及生成源、核SVG/XML/Python/JSON与canonical path/circle逐项相等、用户参考PNG字节一致，并实际查看1280效果图。基线2268至当前5a9之间ProductHeader及品牌资源未变；隔离cherry为a6ea1bc，归档不代表用户批准。此批仅设计/文档，未重跑应用构建或浏览器。
