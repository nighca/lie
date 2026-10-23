# 在线部署方案与状态

更新：2026-10-24。用户已选择 **Cloudflare 静态网站 + 薄 serverless 网关**；Vue + TypeScript 前端、浏览器游戏引擎、静态 JSON 内容包，不依赖传统常驻服务端或游戏数据库。模块架构已确认。这里区分独立公网技术探针和正式应用部署。

## 当前发布状态

| 环境 | 已核实状态 | 尚未完成 |
| --- | --- | --- |
| 已发布源码 | `0416de6` 包含持续语音、8 分钟共享询问额度及头像尺寸修复；远端 CI 成功，110 项测试、类型检查与构建通过 | 源码发布不等于生产部署 |
| [生产静态预览](https://lie-game.nighca.workers.dev/) | 实际部署源码 `90e3a45`；Worker version `a90684b8-6a50-4ea3-a172-9434126190db`；已验证页面、JSON、路由和缓存校验 | 公开语音未开放，尚未部署 `0416de6` 应用实现 |
| 本地 `127.0.0.1:8787` | 已更新 `0416de6` 的应用实现，保留真实灵矽配置和用户测试资源 | 整合版真人麦克风、播放与打断复验 |

cf CLI 登录已由用户完成并核验有效；用户也已购买灵矽资源包，之后六次专用上下文检查成功。它们不再是等待中的上线前提。独立持续语音 harness 已获用户“已试，多轮与打断体验可以”的反馈；真实首案 AI 表现、整合版音频与外部用户资源隔离仍需分别验收。

公开语音的下一步见[上线提案](public-voice-launch-proposal.md)：它尚待用户决策，不代表已经批准、部署或完成资源配置。

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

正式网关位于 `apps/gateway`，代码交付与 root review、正式部署验收需分别记录，不能把旧探针 URL 当作正式游戏地址。正式网关已完成源码 review、本地 workerd 测试、网页/Worker 组合构建与部署 dry-run；静态游戏开发预览已经部署，公开语音尚未开放。当前版本与验证范围见本文开头。

正式新项目使用 **cf CLI**；其独立登录已由用户完成并核验有效。旧 Wrangler 的现有 OAuth 登录不能被描述成 cf 已登录，也不以更换 CLI 绕开正式项目的登录前提。历史探针项目当时已有 `wrangler.jsonc`，因此其指定临时 secret 清理使用项目本地 Wrangler，符合项目工具约定；不应据此假定该探针目录已并入当前仓库。

正式静态部署已验页面、内容、健康检查、404 与无凭据语音错误路径。持续语音的新源码仍需与实际生产版本区分；后续公开语音需按批准方案单独验证，不能只凭上传命令成功宣布体验验收完成。

## 凭据与旧探针生命周期

管理 key 只保留在本地忽略文件或托管端 secrets，不进入静态产物。端侧 MCP 通过现有语音连接响应角色工具，不另开公网 HTTP/SSE MCP 端点。[Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)、[灵矽端侧 MCP](https://linx.qiniu.com/docs/xrobot/mcp/hardware-mcp)

旧技术探针 [lie-cloudflare-spike.nighca.workers.dev](https://lie-cloudflare-spike.nighca.workers.dev) 保留静态/health/echo，但四项专用语音 secret 已撤销，当前列表为空。记录的旧灵矽测试设备已解绑、测试智能体已删除，私密临时 runtime/Cloudflare 凭据文件已删除。无凭据 `/api/voice` 返回 403，清理后静态与 echo 复查通过；不表示删除 Cloudflare 全部历史版本或供应商日志。

正式公开体验仍需确定设备/会话资源分配、访问与额度边界、失败后的回收、超时关闭和多人隔离。临时探针访问码不是正式用户方案。

## 当前尚待上线验收

1. 整合版主应用真人麦克风、ASR、PCM 播放、多轮与打断恢复，以及权限/取消/后台隐藏等路径；独立 harness 的真人反馈不能替代整合版验收。
2. 真实首案的角色上下文、模型扮演、三角色往返、跨局重开和玩家盲测。六次成功检查仅覆盖文本 `detect` 与专用独立设备，不证明共享设备并发隔离。
3. 持续连接端到端延迟、稳定性、回声与实际消耗，以及 3 分钟网关连接上限和 8 分钟跨会话游戏额度的组合行为。当前不承诺免费额度、并发量或即时打断。
4. 公开语音资源分配、访问与额度边界、超时及回收方案经用户确认后的实现、部署与外部试玩。
5. 候选音色的试听选择与正式映射；现有两份实际样本尚未耳验，第三次失败原因未确定，不能把这轮实验描述为三音色全部通过。

额度不足属于已恢复的历史阻塞。早期 PCM/MCP、恢复后的六轮上下文、独立真人 harness 与当前本地环境分别记录在[验证记录](validation.md)，各自范围不能互相替代。

## 历史部署：首次正式静态开发预览（2026-10-23）

2026-10-23，已将源码 `af7832b` 部署到 https://lie-game.nighca.workers.dev/，Worker version `d435842d-1d27-4eb4-8c3d-eacadd7ca644`。cf 首次上传需要所有声明为 required 的 secret，因此静态首发仅声明 ASSETS，语音秘密作为可选运行时配置，未写入任何占位凭据。普通页面、首案 JSON、形象清单、health 均 200；缺失内容与 API 为 404，普通 HTTP voice 为 426。真实 WSS 客户端在同源 Origin、无凭据时返回 503；浏览器可进入调查并看到语音失败提示。这是首次静态预览的历史记录，后来已更新至本文开头所列 `90e3a45` 版本。公开语音仍未开放；额度已经恢复，后续重点是整合版真人音频、正式首案与公开资源方案。
