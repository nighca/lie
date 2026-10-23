# 灵矽接入技术记录

更新：2026-10-23。当前采用浏览器游戏引擎、静态 JSON 内容包、浏览器端侧 MCP 与薄 serverless WebSocket 网关；模块拆解已经用户确认。详细实测与清理结果见 [验证记录](validation.md)，部署边界见 [部署方案](deployment-options.md)。

## 已确认的接入边界

浏览器原生 WebSocket 构造器不能任意设置灵矽公开协议要求的 Authorization、Device-Id、Client-Id、Protocol-Version 等头。网关在私密环境补充这些头，转发文本与音频；浏览器不接触管理 API key。静态前端直连不是当前路径，也不需要先证明供应商不存在其他浏览器方案。[灵矽 WebSocket 协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)、[WebSocket 构造器](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket)

平台管理 key 用于管理 API；OTA 返回的设备 token 用于语音连接，两者不是同一种凭证。专用探针已实际完成创建测试智能体、设备绑定和再次 OTA 取得语音配置。不要把测试设备可用推导为生产并发设备分配政策已经解决。[OTA 协议](https://linx.qiniu.com/docs/xrobot/platform/OTA)、[设备 API](https://linx.qiniu.com/docs/xrobot/api/device)

端侧 MCP 把 JSON-RPC initialize、tools/list、tools/call 包在同一语音 WebSocket 中。独立 Node 探针已完成真实发现与调用，不需要另建云端 HTTP/SSE MCP 服务。正式浏览器角色工具返回当前人物的公共背景、本人纯文本设定与本人历史，不接受模型指定其他角色或任意游戏状态。[端侧 MCP](https://linx.qiniu.com/docs/xrobot/mcp/hardware-mcp)

## 音频格式

本次 hello 请求采用 PCM 输入，返回参数也实际协商为 PCM 输出：16 kHz、单声道、signed int16 little-endian、20 ms；320 个采样点对应 640 字节输入帧。此次文本触发没有测试麦克风二进制上传。公网中继收到 79 个输出二进制帧、50,560 字节。该样本由文本 detect 触发，不能证明真实麦克风识别与浏览器听感。

当前 `packages/voice` 实现 PCM 编码、播放、麦克风采集、取消和协议处理，并拒绝不支持的协商格式。供应商文档及其他配置可能使用 Opus，不能假定所有配置都返回 PCM；如将来出现不同协商，应明确报错并另行评估适配，不能把原始 Opus 包当成 WebM 文件播放。[WebSocket 音频协商](https://linx.qiniu.com/docs/xrobot/platform/websocket)

## 游戏与供应商会话

案件内容只需公共背景纯文本、每人设定纯文本，以及程序使用的 ID、显示名称、形象关联和结局数据。内容和答案允许进入浏览器，不需要游戏数据库。形象配置独立于故事与角色知识，模型不依据配色或表情判断真假。

浏览器 controller 是本局确定性状态的所有者：切人保留逐角色历史，按钮指认调用规则，只有成功后展示结局。UI 读取显式公开视图；模型收到的是当前角色工具投影，不能因玩家声称某事实而改写案件内容。

当前编排每轮使用新连接，以局、角色和连接 epoch 拒绝旧事件、旧工具和旧音频。已显示的回复先以单一 pending 文本展示，完成或中断时写入本人历史；中断文本标记 interrupted，不能声称所有字都已播放。切人、指认、结束和重开都会停止旧设备资源。相关自动化已通过，但每轮握手开销和真实模型上下文续接仍需实测。

无记忆配置被平台接受，不等于所有供应商历史都已隔离。设备绑定切换默认可能迁移历史；历史删除 API 也不等于活跃上下文、音频留存或长期记忆立即清除。不要把新连接、新 session ID 或本地历史清空当作供应商隔离证明。[智能体切换](https://linx.qiniu.com/docs/xrobot/api/agent)、[聊天记录 API](https://linx.qiniu.com/docs/xrobot/api/chat-history)

官方“大语言模型 API”页面描述模型配置管理，未据此确认独立通用文本推理入口；当前沿语音通道接入，不额外依赖未验证的 HTTP 推理服务。[大语言模型 API](https://linx.qiniu.com/docs/xrobot/api/llm)

## 继续验证的前提

较早的专用协议探针成功；较后的 generic 角色验证因额度不足，6 次请求中上下文工具调用为 0。不能把前者写成正式角色工具已验收，也不能把后者抹去为“全部语音从未成功”。两轮专用资源的清理情况记录在 [验证记录](validation.md)。

待用户预付费并允许恢复真实测试后，再测真实收音/播放、当轮角色工具、连续问答、三角色/跨局/多用户隔离，以及延迟和稳定性。在此之前不新增推理请求。模块 fake 测试和内置浏览器演示可以继续推进；其通过不代表供应商质量或生产部署通过。
