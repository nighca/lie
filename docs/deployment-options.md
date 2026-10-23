# 在线部署方案与状态

更新：2026-10-23。用户已选择 **Cloudflare 静态网站 + 薄 serverless 网关**；Vue + TypeScript 前端、浏览器游戏引擎、静态 JSON 内容包，不依赖传统常驻服务端或游戏数据库。模块架构已确认。这里区分独立公网技术探针和正式应用部署。

## 当前边界

- 浏览器：加载完整内容包与独立形象资源，维护本局、逐角色历史、指认规则和界面；采集麦克风、播放 PCM、处理端侧 MCP。公开 JSON 可被玩家检查，符合已确认产品取舍。
- Worker：保管平台管理凭据和连接配置，补灵矽握手头，转发 WSS 文本/音频与关闭事件，并按实际接入需要管理专用语音资源。不承载游戏真相判定、云端游戏存储或云端 MCP 服务。
- 静态资源：Vue 产物、故事 JSON 与形象素材同源提供。当前不引入 D1、KV、Durable Objects、对象存储或独立状态 API。

Worker 是托管执行环境，不是完整 Node.js 进程。TypeScript 和 Node.js 生态偏好不意味着可以直接运行所有 Node 原生依赖；当前透明中继和浏览器 PCM 实现无需服务端音频转码库。[Workers Node.js 兼容性](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

## 已验证的托管能力

旧探针使用 Workers Static Assets 提供生产构建与 JSON；同一域名的 Worker 处理 health、WebSocket echo 和受保护的灵矽中继。真实本地 workerd 和公网验证已经通过：静态加载、文本/二进制/关闭、补头握手、端侧 MCP、文本触发 TTS 与 PCM 返回。无游戏数据库、KV 或 Durable Objects。详见 [验证记录](validation.md)。

协议需要 Authorization、Device-Id、Client-Id、Protocol-Version 等握手头，浏览器构造器不提供任意 headers 参数，因此当前通过薄网关接入。[灵矽连接协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)、[WHATWG WebSocket](https://websockets.spec.whatwg.org/#the-websocket-interface)

Worker 两端显式设置 `binaryType = 'arraybuffer'`，避免二进制默认 Blob 被错误转换。静态内容请求与未知 API/缺失 JSON 分开处理，不能用 SPA HTML 伪装为内容加载成功。[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)、[Workers WebSockets](https://developers.cloudflare.com/workers/runtime-apis/websockets/)

## 正式部署与 CLI 状态

正式网关位于 `apps/gateway`，代码交付与 root review、正式部署验收需分别记录，不能把旧探针 URL 当作正式游戏地址。正式网关已完成源码 review、本地 workerd 测试、网页/Worker 组合构建与部署 dry-run，完整线上游戏尚未发布。

正式新项目使用 **cf CLI**；其独立登录尚未完成。旧 Wrangler 的现有 OAuth 登录不能被描述成 cf 已登录，也不以更换 CLI 绕开正式项目的登录前提。原探针目录已有 `wrangler.jsonc`，因此仅对该旧项目使用项目本地 Wrangler 完成指定临时 secret 清理，符合项目工具约定。

现阶段可继续做源码 review、离线模块/协议测试、fake 浏览器流程与部署配置检查；正式部署前需完成 cf 登录和对应账号权限确认。实际部署成功后还要检查页面、内容、网关、关闭及错误路径，不能只凭上传命令成功宣布上线验收完成。

## 凭据与旧探针生命周期

管理 key 只保留在本地忽略文件或托管端 secrets，不进入静态产物。端侧 MCP 通过现有语音连接响应角色工具，不另开公网 HTTP/SSE MCP 端点。[Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)、[灵矽端侧 MCP](https://linx.qiniu.com/docs/xrobot/mcp/hardware-mcp)

旧技术探针 [lie-cloudflare-spike.nighca.workers.dev](https://lie-cloudflare-spike.nighca.workers.dev) 保留静态/health/echo，但四项专用语音 secret 已撤销，当前列表为空。记录的旧灵矽测试设备已解绑、测试智能体已删除，私密临时 runtime/Cloudflare 凭据文件已删除。无凭据 `/api/voice` 返回 403，清理后静态与 echo 复查通过；不表示删除 Cloudflare 全部历史版本或供应商日志。

正式公开体验仍需确定设备/会话资源分配、访问与额度边界、失败后的回收、超时关闭和多人隔离。临时探针访问码不是正式用户方案。

## 尚待上线验收

1. cf CLI 登录与正式应用部署；确认当前配置、同源静态资源和 API 路由。
2. 用户完成供应商预付费并允许恢复测试后，验证真实浏览器麦克风、ASR、PCM 播放与打断。
3. 浏览器角色上下文工具的当轮读取、三角色往返、跨局重开及多用户供应商隔离。
4. 每轮新连接的握手开销、端到端延迟、稳定性与实际消耗。当前不承诺免费额度、并发量或体验时延。
5. 正式首案、角色资源与外部玩家试玩。fake 演示和较早的协议样本均不能替代这些验收。

当前较新的 generic 角色请求因额度不足未完成工具验证；等待用户预付费期间不继续触发推理。已有较早 PCM/MCP 样本仍是基础可行性事实，两者的范围见 [技术记录](technical-discovery.md)。
