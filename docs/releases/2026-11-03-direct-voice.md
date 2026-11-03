# 浏览器语音直连正式上线

2026-11-03。正式版本 `7ff082483481f9e94979eb867c2ca575d5eff8b3` 已合入 main 并发布。用户验收同一 SHA 的 Cloudflare preview 后明确授权推进合入与上线；总协调已核对原始确认、main/remote/生产身份、CI/CD成功及生产100%该版本。本记录据本轮总协调发布回执及已完成的脱敏安全记录整理，取代旧设计资料中“候选待验收/未合入”的当前状态表述，不倒写那些资料当时的事实。

## 发布身份与证据

| 项目 | 实际结果 |
| --- | --- |
| 正式源码 | [7ff0824](https://github.com/nighca/lie/commit/7ff082483481f9e94979eb867c2ca575d5eff8b3) |
| 同版本预览验收 | 用户明确“我测试没问题了，可以推进合入&发布上线”，总协调已核对原确认 |
| CI | [41585128790](https://github.com/nighca/lie/actions/runs/41585128790)，success |
| CD | [41585316225](https://github.com/nighca/lie/actions/runs/41585316225)，success；生产100%同版 |
| 脱敏生产读回 | source完整7ff、clean=true，首页/JS/health均200；health为ok、storage=r2、voice ready/direct |

[脱敏摘要](2026-11-03-direct-voice.json)只保留版本、HTTP结果、就绪配置及协调回执事实，不含Cookie、token、管理密钥或Agent/Device身份。生产结果由总协调已审的最终safe receipt中的production字段逐项提取；同SHA用户接受与CI/CD来源为本轮总协调正式发布回执。较早preview receipt的`userAcceptancePending`是验收前快照，不是当前发布状态。

## 当前运行方式

- 案件介绍加载后发起一次同源`POST /api/voice/prepare`；Worker按签名Cookie为浏览器选择或建立Device/Client，进行OTA、必要绑定及Agent归属检查，返回本局连接描述。
- 浏览器只在本局内存持有Device token。开聊等待同一pending结果；切角色、停止后重开复用。显式重试刷新准备，新局、重开或离开会清除/取消本局准备；不增加自动TTL刷新或自动重连。
- 浏览器以原生WSS连接Linx `/v1/ws/`，URL只携Device/Client，token在hello中；音频、转写、STT/TTS与端侧MCP上下文不再由Worker中继。管理API key、Cookie签名密钥及服务端relay回滚共享key仍保留在Worker。
- Cloudflare继续提供静态资源、prepare/身份与设备管理、分享API及私有R2快照；游戏状态、判定和询问计时在浏览器。relay仅为服务端显式运营回滚，无客户端自动fallback。
- `/api/voice/status`已删除；`GET /api/health`仅检查配置/storage就绪，不签Cookie、不调用OTA或创建语音连接。默认direct下`/api/voice`不启用relay升级。

正式合同和实现固定于7ff：[每局准备设计](https://github.com/nighca/lie/blob/7ff082483481f9e94979eb867c2ca575d5eff8b3/docs/reviews/voice-case-prepare-2026-11-03/README.md)、[网关说明](https://github.com/nighca/lie/blob/7ff082483481f9e94979eb867c2ca575d5eff8b3/apps/gateway/README.md)、[浏览器准备生命周期](https://github.com/nighca/lie/blob/7ff082483481f9e94979eb867c2ca575d5eff8b3/apps/web/src/application/liveVoice.ts)。设计文档保留候选阶段的部署门槛，当前发布状态以本记录为准。

## 验证范围

同SHA用户预览接受与正式发布已完成；这不推导所有设备、完整长会话、供应商隔离/TTL或性能提升已经全面验证。总协调生产安全读回没有重新拨号；本次文档更新仅只读源码和限定脱敏记录，没有新prepare、OTA、WS、麦克风或推理请求，也没有新服务或资源清理。冻结的V7–V9路演源/导出/手递保留其当时状态，本次只维护当前README、亮点及讲述资料，不重新渲染大产物。
