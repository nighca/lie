# v6 素材与真实证据

2026-11-02。当前C-only；用户要求首页回到原C构图，正文参照v5最后五页简洁版式，技术图专业且美观。

- `cover-C.jpg`：以内置image_gen对`visual-direction-v4/C-editorial.jpg`做极小编辑，删除临时LIE字形与“01/产品”，保留大字/人物握问号原构图。精确prompt与原PNG路径在`cover-prompt.json`，原PNG另保留ignored build；正式logo由`design/brand/logo.svg`原样生成PNG覆盖，未用生成logo。封面是位图品牌稿，其标题不作为原生可编辑文字；其余正文/原生技术图可编辑。
- `investigation-dialogue.jpg`：从已获认可并保存的历史实录`media/promo-video/lie-demo.mp4`第32秒抽帧，同尺寸JPEG压缩，没有改文字/人物/数据。原片SHA256 `5d662845a39ad08db9a7936651bd85eabecee406d800bbd7113f48f1c5b69c2a`，原片与28.5秒备用均保留。本图为纪念章案真实问答界面，不是江苏同局，也不证明最新UI/设备性能；本轮没调用语音服务或重新录制。
- `webmcp-before.jpg`：固定main `bb5fe51`下`docs/design/webmcp-authoring-demo-desktop.jpg`原字节提取，73,808 bytes，SHA256 `256ab7c8091d679d4e0d7109d7c498c6bb6698d6a827aeb2455db48d050901fb`，旧独立候选方案已被替代。
- `webmcp-after.jpg`：同main `docs/design/webmcp-entry-polished.jpg`原字节提取，84,483 bytes，SHA256 `12dde198414ee7f852d62028e429ba0c868febb139653d66042885bad1b73cad`，当前直接表单入口/验收虚构示例，不是用户原稿或新的实时生成。

两个WebMCP截图在本地build裁取相关区域，原图保留。工程例子发生11月1日，明确不属于10月23–25三天统计窗口；批准、实现、测试、审查与集成依`engineering-evidence-v6.md`和main直接编辑设计文档。

游玩架构、WebMCP方案、Router–Worker三图均为原生文字/边界框/连线，不再使用v4动漫概念图；节点与箭头为技术关系说明，不冒充真实产品截图。骨骼页采用正式coral-bob部件/结果态，不再作为工程案例重复使用。
