# LIE

轻松开口，认真推理。与三名 AI 角色自由语音交流，对照各自的说法，最后用按钮选出事件的责任人。

首案为《空盒里的纪念章》。前端使用 Vue + TypeScript，游戏内容和单局逻辑在浏览器运行；Cloudflare 静态托管与薄 Worker 网关连接灵矽，无游戏数据库。角色形象独立复用，新增同玩法故事通过静态内容包和配置完成。

## 本地运行

需要 Node.js 24.15+（24.x）和 npm 11。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:5176/?demo=1 查看明确标注的模拟对话演示。生产构建不启用此模式。真实语音需配置网关及供应商额度，尚未完成真实麦克风与角色行为验收。

```sh
npm run typecheck
npm test
npm run build
```

## 项目资料

- [开发与检查](docs/development.md)
- [架构设计](docs/architecture.md)
- [玩法与首案](docs/gameplay-proposal.md) / [完整剧透与逻辑核查](docs/case-options.md)
- [视觉设计](docs/visual-direction.md) / [预置形象](design/appearances/README.md)
- [技术验证与清理记录](docs/validation.md) / [部署方案](docs/deployment-options.md)
- [项目计划与决策](docs/project-plan.md) / [AI 协作规范](AGENTS.md)

当前已有完整页面、独立模块自动化和本地 Worker 构建。正式在线体验尚未发布；模型调用等待供应商额度恢复。测试替身通过不代表真实语音或 AI 表现已经验收。
