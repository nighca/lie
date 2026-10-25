# <img src="design/brand/logo.svg" width="160" height="86" alt="LIE">

**轻松开口，认真推理。**

[English](README.md) · 简体中文

[![CI](https://github.com/nighca/lie/actions/workflows/ci.yml/badge.svg)](https://github.com/nighca/lie/actions/workflows/ci.yml)
[![Application lines snapshot](docs/coverage/application-lines.svg)](docs/coverage/README.md)
![Node.js 24](https://img.shields.io/badge/Node.js-24-075BFA?style=flat-square&logo=nodedotjs&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue-3-075BFA?style=flat-square&logo=vuedotjs&logoColor=white)
![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-075BFA?style=flat-square&logo=typescript&logoColor=white)

![LIE：明亮黄蓝与原创卡通人物的语音推理游戏](design/brand/readme-hero.png)

与 AI 角色自由语音交流，对照各自的说法，最后选出事件的责任人。画面轻松，人物却未必把话说全——问什么、先问谁、相信哪一句，由你决定。游戏界面使用中文。

[开始游戏](https://lie.agency/) · [创作案件](https://lie.agency/editor)

## 一局怎么玩

| 接案 | 开口问话 | 换个人聊 | 做出指认 |
| --- | --- | --- | --- |
| 读公共背景，认识在场人物 | 开启语音对话，自由追问、直接开口打断 | 对照说法，回看各人的只读转写 | 点击人物，查看结果 |

选对后揭晓完整经过。选错也会结束本局，不揭晓答案；想再试只能重新开始。角色交流只有语音，切人、开始或结束对话、最终指认保留按钮操作。没有文字聊天输入，也不要求填写推理说明。

询问额度由所有人物共享，累计语音启用时间，包含停顿、等待和回答；连接准备不计。时间用完会停止询问并进入指认，不自动判负或揭晓。离开正在调查的页面需要确认，确认后丢弃本局，不保存进度。

| 案件 | 人物 | 询问额度 |
| --- | ---: | ---: |
| **《空盒里的纪念章》**：摄影社合影前，一枚纪念章不见了 | 3 | 8分钟 |
| **《压轴怎么是鸭叫》**：木偶剧谢幕，钢琴曲突然变成鸭叫 | 4 | 10分钟 |
| **《盐和糖的小乌龙》**：社区烘焙的小饼咸过了头 | 4 | 9分钟 |

每案人数可以不同，引擎没有写死三名嫌疑人。

## 创作并分享自己的谜题

编辑器分为故事设定、故事人物、真相结局三步，可以自由往返。用纯文本写公共背景与各人物设定，选择预置形象，选定唯一正确目标并设置时长。八套预置形象提供立绘、状态素材和已配置音色；形象名称与案件人物姓名相互独立。

未完成的草稿也会自动保存在当前浏览器。试玩使用同一个游戏引擎；分享把完整案件压缩到 URL fragment，朋友打开链接即可玩，不需要故事数据库或账号。当前完整链接预算为16,000字符，跨浏览器边界验收仍待完成。修改草稿不会改变已经发出的链接。

官方投稿准备支持复制或下载 JSON，再由作者在 GitHub 继续操作；不会自动创建 PR 或发布案件，当前私有仓库尚未开放外部投稿。详见[编辑器实施说明](docs/game-editor-implementation.md)与[案件作者规格](content/games/README.md)。

覆盖率徽章是**application lines 的采样快照**，Node脚本另行统计。见[采样SHA、时间、范围与更新命令](docs/coverage/README.md)和[真实计数](docs/coverage/summary.json)。CI上传当次报告artifact，不会自动改写仓库内徽章。

## 本地体验

需要 **Node.js 24.22.1+ 的 24.x 版本**与 **npm 11**。

```sh
npm ci
npm run dev
```

打开[本地开发演示](http://127.0.0.1:5176/?demo=1)，选择案件后点击 **“开启模拟对话”**，假数据问答会循环进行，点击 **“结束对话”** 停止。此模式不采集麦克风、不调用模型、不播放声音，仅在 Vite 开发环境启用；生产构建忽略 `demo=1`。

真实语音需要同源 Worker 和服务端灵矽配置。完成本地配置后：

```sh
npm run build
npm run dev --workspace @lie/gateway
```

通过 `http://127.0.0.1:8787/` 使用 Worker 提供的页面与 `/api/voice`。服务或配置未就绪时会显示错误，不会自动替换成假回答。配置细节及历史实验见 [Web 应用说明](apps/web/README.md)、[网关说明](apps/gateway/README.md)与[开发指南](docs/development.md)。不要把管理 key 或私有配置放进前端变量、URL 或提交记录。

## 工程检查与部署

```sh
npm run typecheck
npm test
npm run build
```

自动化覆盖内容校验、指认规则、角色上下文、异步归属、语音协议、UI 流程和 Worker 边界。替身供应商通过不代表真实麦克风、识别、播放或模型行为通过；真实服务另行验收，证据见[验证记录](docs/validation.md)与[案件真实复核](docs/case-live-followup.md)。

[GitHub Actions](https://github.com/nighca/lie/actions/workflows/ci.yml) 在 main push 或手动触发时执行干净安装、检查、构建与部署 dry run；若该提交仍为最新 main，则使用仓库 secrets 自动部署已验证的构建到 Cloudflare，旧构建跳过部署。[最新已核发布](docs/releases/2026-10-25-main-refresh.md)区分了 CI 成功与真实部署；[编辑器里程碑记录](docs/deployments/2026-10-24-editor-milestone.md)保留早期证据。私有仓库的 CI 徽章可能需要登录后才能显示。

本地与线上开发预览已支持真实语音。应用访问鉴权按项目负责人决定临时关闭，供应商凭据仍保留在 Worker。正式访问、并发分配和账户级支出控制仍暂缓；浏览器内的询问倒计时不是供应商费用硬上限。持续语音真人试玩与受控模型检查不等于已具备不受限的多人正式服务能力；见[线上语音预览边界](docs/online-voice-preview.md)。

## 架构一眼看清

```mermaid
flowchart LR
    Content["静态故事 JSON · 独立形象素材"] --> Browser["浏览器：Vue 界面、游戏规则、逐角色历史"]
    Browser <-->|"同源 WebSocket · 端侧 MCP"| Worker["薄 Cloudflare Worker"]
    Worker <-->|"鉴权 · 文本与音频"| Linx["灵矽：语音与模型"]
```

故事以公共背景和各角色设定的纯文本为主，只保留程序需要的少量元数据；形象通过独立资源配置复用。同一玩法下，新增故事通过内容包与配置完成。游戏内容和单局逻辑在浏览器运行，完整答案可被开发者工具检查；平台管理凭据留在托管端。无需游戏数据库或传统常驻服务端。

| 位置 | 职责 |
| --- | --- |
| [apps/web](apps/web) | Vue 页面、浏览器对话编排与展示 |
| [packages/game-core](packages/game-core) | 独立 TypeScript 内容校验、会话、指认与角色上下文 |
| [packages/ui](packages/ui) | 统一视觉的公共 Vue 组件 |
| [packages/voice](packages/voice) | 灵矽协议、PCM、麦克风与播放 |
| [apps/gateway](apps/gateway) | 静态资源与薄语音网关，不处理案件规则 |

## 继续了解

- **玩法与内容：** [首版玩法](docs/gameplay-proposal.md) · [完整剧情与作者核查，含剧透](docs/case-options.md)
- **产品与美术：** [视觉方向](docs/visual-direction.md) · [界面设计规范](design/ui/spec.md) · [可复用人物预设](design/character-presets/README.md)
- **工程与上线：** [架构设计](docs/architecture.md) · [开发说明](docs/development.md) · [部署方案](docs/deployment-options.md) · [验证记录](docs/validation.md)
- **项目协作：** [计划与决策](docs/project-plan.md) · [AI agent 协作规范](AGENTS.md)
