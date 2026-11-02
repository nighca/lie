# v4 正式稿素材与图解来源

2026-11-02。用户确认C正文＋B开场/转场、三段大纲并要求正式logo，授权在此方向制作正式稿；整稿最终视觉未因此获接受。

- `comic-background.jpg`：由已选B风格稿经内置image_gen衍生，去除所有生成文字和假字标，保留两位人物与斜切漫画构图；源PNG只读保留原generated_images和ignored build。最终封面/现场切页上的文字均为原生文字，logo由`design/brand/logo.svg`原样光栅化，不采用生成字形。
- `voice-architecture.jpg`：概念图，浏览器—语音网关—模型、分享快照旁支。两端箭头合起来表达双向语音，正式原生图注明确“语音双向传输”；R2保存快照在图注/备注说明，不能把图中纸张当浏览器本地快照实现。
- `webmcp-architecture.jpg`：概念图，用户Agent经WebMCP页面动作修改表单并尝试保存本地草稿。没有产品侧新创作模型服务，无自动分享或开语音，不承诺全兼容/总工时效率。
- `router-worker.jpg`：工程职责概念图，人与Router双向决策，Router向三个示例Worker分工，所有Worker经共同返回路径交证据给Router审查集成。圈中产品人物仅品牌化Router符号，非真实运行角色/供应商模型，也不代表只有三个Worker或使用同名SDK。

四张均为概念插画而非真实产品截图或模型行为证据。完整精确提示词/原PNG路径见相邻两个JSON；JPEG是同尺寸格式压缩，未修改画面语义。图解标签属于位图，PPTX中的正文/指标/标题与原生布局可编辑，但不称三图所有元素可编辑。

真实产品截图复用`../revision-03/time-help.jpg`（第4页裁实际时间说明）及`../revision-03/webmcp-entry.jpg`（第5页历史验收虚构样例）。原始来源与版本在revision-03/README.md保留，未新开浏览器、访问用户稿或冒称实时生成。骨骼与工程页部件/人物来自仓库真实coral-bob assets，与概念图分开。

工程数字的固定SHA、时间、仅聚合SQLite方法/排除项/无工时依据见`../../engineering-evidence-v4.md`。本轮没有应用/服务/模型/mic/浏览器操作；新的image_gen图形制作不等于调用游戏provider。旧v1–v3所有大产物、已选两视频和原PNG均保留。
