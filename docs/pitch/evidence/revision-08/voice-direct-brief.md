# V8架构资料：已确定的直连分工

2026-11-03，本轮用户要求按已确定、正推进合入的直连方案制作。总协调给出最新合同，并转达用户进一步决定：架构图直接当完整直连方案呈现，不上“正在实现”等状态，不加旧relay对照。该视觉呈现不改变正式preview验收及发布门禁。

- 进入案件阅读背景时，浏览器POST gateway prepare一次。gateway依据签名Cookie/namespace为各浏览器分配Device/Client，向Linx OTA并按需绑定/检查Agent归属，返回transport、DeviceClient、token和期限。
- 浏览器只在本局内存保存、复用凭据；点击开始等待同一个pending prepare，再以原生WSS直连Linx `/v1/ws/`。URL只含device/client，token放hello，不放URL或长期存储。
- 麦克风音频、STT/TTS、MCP角色上下文由浏览器与Linx直接交换。Linx完成STT→LLM→TTS；浏览器维护角色背景/本人历史、游戏状态、指认、计时和展示。
- gateway保管设备管理API key、Agent归属及签名secret；Cloudflare继续托管静态资源、prepare/设备管理、分享短链API→私有R2。Worker不转发实时语音，不执行游戏硬配额；连接期限由客户端关闭。
- token足够一局是用户批准的工程假设；主动重试可重新prepare，新局新准备。没有复杂TTL状态机。server-only relay只是运营显式回滚，非自动fallback；主图不画此历史支路。

只读背景资料：专项`lie-formal-direct-integration/lie/docs/architecture.md`及`docs/reviews/voice-direct-formal-2026-11-03/README.md`。其中旧status/per-open fresh条目被本轮上面的明确合同覆盖，不能照搬旧流程。最新最小实现尚未冻结新SHA，旧ec26仅是较早preview版本，非此最新合同身份。

内部事实边界：协调回执时正式main为3de59d67412366634211ecc79341741e28f35864，仍旧relay。直连必须在同候选Cloudflare preview获得用户明确接受，再合main及正式发布。演示架构不是上线/真人语音/性能改善验证，不新增任何服务或provider操作。该状态仅留制作证据，不上架构图。
