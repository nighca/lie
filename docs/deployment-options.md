# 在线部署与免运维服务端可行性

状态：供架构评审的提案，供应商尚未选定。2026-10-23 核验官方文档；未创建账号、部署或进行真实链路测试。

技术基线已确定为 Vue + TypeScript 前端；如需服务端或 Worker，采用 TypeScript 并优先 Node.js 技术生态。选托管平台时还需检查实际运行时：Workers 官方提供部分 Node.js API 实现与兼容垫片，部分可导入模块没有可用实现，不能默认任意 Node.js 依赖都能执行。若关键依赖需要完整 Node.js，应在架构评审中选择相应的托管运行方式。[Workers Node.js 兼容性](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

## 结论

**无需部署、运维常驻传统服务器的方案有官方能力依据；纯静态直连目前尚未证实可行。** 静态 Web 加托管 serverless 执行环境，可以承担灵矽连接网关，以及需要时的游戏状态和云端 MCP。这里仍有托管执行的代码，只是服务器生命周期由平台管理。以下均为设计可行性判断，尚未完成真实语音链路验证。

目前明确的协议障碍是：灵矽公开 WSS 协议要求 Authorization、Device-Id、Client-Id、Protocol-Version 等握手头，而浏览器标准 WebSocket 构造器只接收 URL 和子协议，不能设置任意鉴权头。因此现有设备接入方式不能直接照搬到浏览器。官方确有网页体验，但第三方可复用的 SDK、临时凭证和替代语音握手尚未查明，不能断言产品没有其他浏览器方案。平台管理 API key 不能公开；受限设备语音 token 是否适合交付浏览器则需核实其作用域、期限和撤销方式，不能任意改用 URL 参数。[灵矽连接协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)、[WHATWG WebSocket 标准](https://websockets.spec.whatwg.org/#the-websocket-interface)

游戏规则本身可以在浏览器运行。是否对玩家隐藏完整剧情与答案、是否要求服务端维护不可篡改的成绩，是产品与架构取舍，不是已确认的防作弊要求。角色知识过滤仍需要正确实现，但不因其存在就必然需要独立服务端。

## 最小候选路径

优先验证 **一个托管应用：Web 静态资源 + serverless 网关/API/MCP + 一个必要的会话状态实现**。不为首版先增加数据库、缓存、队列和对象存储全家桶。下表是能力比较，不代表已选型。

| 方案 | 官方能力依据 | 项目判断与限制 |
| --- | --- | --- |
| Cloudflare Workers + Static Assets | 可在同一项目托管静态资源和 Worker；Worker 支持入站 WebSocketPair、出站 fetch Upgrade、请求 headers 与二进制消息 | 适合先做协议验证；网关可在私密执行环境补灵矽头并双向转发，API/MCP 可放在同一应用。需验证真实链路和音频处理，不等于已经兼容灵矽 |
| Vercel 静态资源 + Functions | 最新官方 WebSockets 主文档明确支持入站 WS；2026-10-20 已 GA，不能再沿用“不支持 WS server”的旧说法 | 也是可行候选；连接达到 Function 最大执行时长会关闭，重连不保证同实例，需恢复机制与共享状态。不能只因支持 WS 就视为与 Workers 的生命周期等价 |
| 纯静态托管 | 能托管浏览器资源；游戏引擎可在本地运行 | 灵矽第三方浏览器直连方式尚未证实；若采用浏览器内容包，熟悉开发者工具的玩家可查看答案。端侧 MCP 可望免除外部 MCP 服务，但不解决语音握手问题 |

来源：[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)、[Workers WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/)、[Workers Request headers](https://developers.cloudflare.com/workers/runtime-apis/request/)、[Vercel WebSockets](https://vercel.com/docs/functions/websockets)、[Vercel GA 公告](https://vercel.com/changelog/websocket-support-is-now-generally-available)。

## Workers 具体适配边界

- **WSS 网关：** 用 fetch Upgrade 向上游发起握手并设置必需头；接收入站 WS，双向保留 JSON 文本和音频 binary 消息。显式设置 `binaryType = "arraybuffer"`，避免默认 Blob 导致错误处理；联动关闭上下游，限制消息和缓冲，处理旧连接事件。以上 API 有文档依据，灵矽兼容性尚未实测。
- **API 与 MCP：** Worker 的 HTTP handler 可承载游戏 API，Streams 可产生 SSE。灵矽目前文档指定 `GET /mcp` SSE 和 `POST /mcp/message`，不能直接假定仅提供新版 Streamable HTTP 就兼容；需按平台实际 transport 做发现、初始化、调用与错误测试。平台携带的设备/智能体/会话头用于映射，仍需验证请求来源，不能把任意来访者自报的头当授权。[Workers Streams](https://developers.cloudflare.com/workers/runtime-apis/streams/)、[灵矽云端 MCP](https://linx.qiniu.com/docs/xrobot/mcp/software-mcp)
- **凭证与私密内容：** 平台凭证放 Worker secrets；本地用未入库的 `.dev.vars` 或 `.env`。完整内容包编入私密服务端模块，公开素材才进入 Static Assets，不能将整个内容目录打包到浏览器。[Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- **本地测试：** Wrangler/Miniflare 在本地 workerd 运行，可本地测试 HTTP、WS 与模拟资源；纯规则模块使用普通自动化测试，adapter 使用假平台及协议回放。灵矽主动访问本地 MCP 则需可访问的临时 HTTPS 入口或预览部署，不能用本地 fake 成功替代真实接入。[Workers 本地开发](https://developers.cloudflare.com/workers/local-development/)

## 两种运行取舍

| 模式 | 引擎与角色工具位置 | 托管端需要做什么 | 代价与待验证项 |
| --- | --- | --- | --- |
| 浏览器运行游戏 + 薄 serverless 网关 | 浏览器保存本局，按角色过滤知识，经语音连接中的端侧 MCP 响应工具 | 保管管理凭据、补上游握手头、转发文本与音频，按实际接入方式管理设备 | 可能省去独立云端 MCP 与共享游戏数据库；玩家可查看内容包答案，不能提供可信排行榜。需验证端侧 MCP、设备隔离、语音与状态时序；这是提案，未实测 |
| 托管端维护游戏状态 | Worker/function 中运行引擎并提供云端 MCP，浏览器只拿公开视图 | 除网关外提供会话一致性和内容投影 | 可将答案与平台配置留在托管端，但增加会话状态设施和本地集成工作 |

端侧 MCP 使用既有 WebSocket 的 JSON-RPC 工具请求与响应，浏览器或 Worker 可以实现协议处理是合理推论，平台实际兼容性仍需测试。不能把云端 MCP 当作唯一选择。[端侧 MCP](https://linx.qiniu.com/docs/xrobot/mcp/hardware-mcp)

## 采用托管权威状态时的要求

浏览器动作、灵矽云端 MCP 和重连属于不同请求，不能假设都落到同一个 Worker 实例，也不能依赖全局 Map 维护一致状态。会话至少需支持版本检查、动作去重、逐角色隔离，以及平台会话到游戏局的可靠映射。

此模式中架构先保留 `SessionRepository` 一类接口，以内存 fake 做独立测试；上线实现须保证并发一致性。若采用 Workers 且需要 MCP/WS/API 共同操作单局，**每局一个 Durable Object** 是可评估的实现：协调同局请求并使用其内置存储，可能无需再加 D1 或 KV。是否采用、存活与清理策略待架构确认。只做 WS 透明中继本身不必引入 DO；理由应是共享权威会话，而不是“用 WS 就必须 DO”。[Durable Objects 能力](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/)

## 音频对部署方案的影响

透明转发音频可减少托管网关的计算和依赖，前提是浏览器能够处理灵矽实际返回的音频。灵矽示例有 PCM 输入和 Opus 响应，需核验上下行各自格式、采样率、包边界及额外协议头；不能因上传 PCM 就假定返回 PCM。

原始 Opus packet 不能直接当作 MediaRecorder 的 WebM/Ogg 文件或可播放 URL。若由前端解码，需要确认原始包与 WebCodecs `EncodedAudioChunk` 的匹配、时间戳、解码配置及目标浏览器的 `AudioDecoder.isConfigSupported`，并处理 AudioWorklet 播放队列和打断清空；不支持时评估 WASM decoder。W3C 注册定义了 Opus 的 WebCodecs 数据契约，但未要求每个浏览器实现该 codec。[Opus WebCodecs 注册](https://www.w3.org/TR/webcodecs-opus-codec-registration/)

若最终选择服务端 Opus 转 PCM，必须另验 Workers 可用的 WASM 解码器、CPU/内存与部署体积；不能假定 Node 原生音频库能直接运行。音频实现路径仍待技术试验与架构确认。

## 选型前必须通过的试验

1. 浏览器 → 候选托管网关 → 灵矽：带私密头完成握手，连续转发二进制音频和文本事件，验证中断、关闭与重连。
2. 目标桌面浏览器真实收音与播放：确认原始 Opus 数据形态和实际解码支持；如需转码，再测目标托管运行时。
3. 灵矽 → 公网 MCP：验证 SSE/POST transport、请求身份、初始化/工具发现、状态版本与并发读写；UI 出示证据后当轮可见。
4. 多外部试玩用户同时开局：设备分配和角色历史不串局；刷新、超时、服务重启/发布后恢复或明确重新开局，不能悄悄丢状态。
5. 测量用户所在地到托管地区、再到灵矽的延迟与稳定性；核验当时计划的执行时限、CPU/流量费用、公开访问保护与额度。没有实测前不承诺免费额度足够或具体延迟。

当前文档研究与本地模块设计不需要用户创建部署账号。架构确认后可由专责 agent 列出试验所需的账号、权限与额度，并用无秘密测试内容验证候选公网环境。
