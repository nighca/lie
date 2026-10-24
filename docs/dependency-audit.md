# 工具链依赖审计

观测时间：2026-10-24。基线 `30be593e4e6501917270cc55b4d10b6239b7654c`。本轮只读调查，不修改 package/lock/CI/产品源码、不升级 Node、不运行 fix、登录或部署。

结论：锁文件审计复现 **6 high / 2 moderate / 0 critical**，对应 **4 条底层 advisory**；另外 6 个包名是依赖链传导，不是 8 个独立漏洞。当前没有证据证明这些 npm 包随生产浏览器或 Worker 部署。构建/本地代理/部署 CLI 仍会执行相关库，应按 P2 修复工具链，不能因 devDependencies 就忽略。额外发现 CI/本地 Node 24.17.0 的安全更新缺口，建议优先与此批兼容升级一起处理。

## 可重现证据

独立工作树运行 `npm audit --json`（exit 1，发现漏洞，非命令失败）；`npm ci --ignore-scripts`（exit 0，按锁安装）；`npm ls cf @cloudflare/config @cloudflare/vite-plugin miniflare undici zod --all`（exit 0）；`npm audit --omit=dev --json`（exit 0，0 漏洞）。完整去敏结果在 [audit-full.json](../spikes/dependency-audit/audit-full.json)、[audit-production.json](../spikes/dependency-audit/audit-production.json)、[observations.json](../spikes/dependency-audit/observations.json)。npm 11.13.0，Node 24.17.0。安装忽略生命周期脚本，未安装额外包或主版本；现有锁本地构建仍成功。

`--omit=dev` 只证明 npm 依赖分类视图，不证明产物安全。进一步实际运行 `CF_SEND_TELEMETRY=false npm run build`，web/gateway 均成功；Worker JS 4.15kB，source map 的唯一 source 为 `src/index.ts`，无 runtime import/require。浏览器 JS 与 Worker JS 中搜索 `undici|zod|@cloudflare/config` 均 0 命中（3 个 JS 文件，323005 字节）。结合源码只有 type-only 的 `cf/config` 引用，支持“当前业务产物未带入这些库”；字符串扫描不是完整软件成分证明，也不替代供应商 runtime 审计。构建记录仅见 workspace 自动配置提示，未修改配置。

## 实际路径

| 路径 | 锁定版本 | npm 分类 / 备注 |
|---|---|---|
| gateway → cf → @cloudflare/config → zod | cf 1.0.0-beta.18 / config 0.27.0 / zod 4.6.5 | dev；构建/部署配置解析 |
| gateway → @cloudflare/vite-plugin → @cloudflare/config → zod | plugin 2.0.0-beta.v.4 / config 0.28.0 / zod 4.6.5 | dev；同一个 hoisted zod |
| gateway → cf → miniflare → undici | miniflare 5.20261012.1-beta / undici 7.29.1 | dev；独立嵌套副本 |
| gateway → miniflare → undici | miniflare 5.20261019.2-beta / undici 7.29.1 | dev；plugin/runtime-types 同时复用 |
| root → jsdom → undici | jsdom 30.1.3 / undici 8.12.3 | dev；已高于这三条 advisory 的 8.x 修复下限，不要把它一并降成 7.x |

`@cloudflare/build-output-utils`、`@cloudflare/config`、`@cloudflare/runtime-types`、`@cloudflare/vite-plugin`、`cf`、`miniflare` 是本次 npm 传导项；其上游摘要 severity 不代表每一个包都含独立同级漏洞代码。

## 四条底层问题及当前适用性

| Advisory | 实际受影响版本 / 修复下限 | 触发前提与本项目判断 |
|---|---|---|
| [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685)，moderate | undici 7.29.1；7.x 修复 7.30.1 | EventSource 连接恶意 SSE peer 可能累积解析内存。业务只用浏览器/Worker 原生 WebSocket 与 fetch，未见 npm EventSource 调用；没有复现经开发代理触发的路径。 |
| [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472)，moderate | 同上 | Node undici fetch 使用混合/大写算法 SRI 元数据时可能放过校验。项目没有设置 fetch integrity；Miniflare 存在转发 userRequest.integrity 的代码，因此不声称工具永远不可达。 |
| [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c)，high | 同上 | 恶意响应给出过多 content-encoding 并提前断开，可能导致 Node 未处理错误退出，即便调用方捕获 fetch reject。本地代理/工具向外请求构成潜在边界；未做恶意响应 PoC，不代表已经确认可远程攻击本项目公网 Worker。 |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)，high | zod 4.6.5；修复 4.6.6 | 超大无效集合的校验问题累积可耗尽内存。config 实际 import zod，包含数组 schema；通常输入来自可信仓库配置，而不是公开请求。业务游戏 JSON 使用自有 validator，无 zod import。未完成所有 CLI 远程配置输入的数据流分析，不能断言绝无攻击面。 |

以上均是可用性/完整性风险的适用性评估，不是生产利用证明。Miniflare 自身打包文件另含内联 schema/Zod 代码，npm override 不会改写已经打包的源码；本轮没有确认其内联版本和受影响函数，不把 audit 归零等同整套工具代码无漏洞。

## 官方当前版本：单升 CLI 不解决

同日查询 npm 官方注册表（`npm view`）：

- `cf` latest **1.0.0-beta.21** 仍精确依赖 config 0.28.0（zod 4.6.5）、Miniflare 5.20261019.2-beta（undici 7.29.1）。新 engines 为 `^22.23.0 || ^24.22.0 || ^26.12.0`，当前 Node 24.17.0 不满足，不能只改 cf 一行。
- `@cloudflare/config` latest 0.28.0，仍 pin zod 4.6.5；未见已修补父包发布。
- `@cloudflare/vite-plugin` beta 仍为项目已用 2.0.0-beta.v.4；latest 指向 1.65.0（包含 Wrangler），不是本项目 beta 的无风险前进升级。
- Miniflare beta 仍为 5.20261019.2-beta，latest 反而是 4.20260730.0 且依赖 undici 7.28.0。不要盲用 `@latest`。
- zod latest 4.6.7；官方 advisory 最低修复 4.6.6。undici 7.30.1 已发布、Node engines `>=20.18.1`，满足本项目 Node 24 主线。[Undici 发布记录](https://github.com/nodejs/undici/releases/tag/v7.30.1)、[Zod 发布记录](https://github.com/colinhacks/zod/releases/tag/v4.6.6)。

本次 npm `fixAvailable` 给出 cf **0.8.0**、plugin **1.12.4**、Miniflare **4.20250906.0**，均标 `isSemVerMajor: true`；这是求解器绕开 vulnerable parent 范围的降级候选，不是验证过的新版修复。`npm audit fix --force` 可能破坏已选 cf beta 配置/Build Output 与 Vite 8 组合。[npm audit 官方说明](https://docs.npmjs.com/cli/v11/commands/npm-audit/)明确 force 允许超出声明范围，包括重大版本。

## Node 运行时单独处理

本地 `process.version=v24.17.0`、`process.versions.undici=7.28.0`；CI `.github/workflows/ci.yml` 固定 24.17.0，README/engines 仍允许 24.15 起。Node 内置 fetch 的 Undici 不在 npm lock 中，不会被 npm overrides 修复。Worker 使用 Cloudflare runtime，浏览器使用浏览器 runtime；不能把本地 Node 的版本直接套到这两者。

[Node 官方 24.22.1 安全发布](https://nodejs.org/en/blog/release/v24.22.1)（2026-10-21）明确升级 Undici 7.30.1，同时修复 Brotli、TLS、DNS 等问题；[官方安全公告](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)给出各问题触发前提。当前构建/部署 Node 低于该安全版本；这独立于 npm 的 8 项计数，未做其全部问题的可达性或利用分析。建议将 CI 固定版本和开发最低文档/engines 一起评估为 **24.22.1**，保持 Node 24 主线，不以升级 cf 替代 Node 安全更新。本轮没有下载/安装新 Node。

## 最小修复候选（只提案，未执行）

建议后续独立实现顺序：

1. 在新独立候选中将工具 Node 固定到 24.22.1，核对 npm 11 与 CI 安装/原生二进制。当前 package engines 原本允许该版本；是否提高最低版本与文档一并 review。
2. 保持 cf/plugin/Miniflare 主线暂不变；若上游仍未发布补丁，在根 package.json 增加仅命中父包的精确 overrides：

```json
{
  "overrides": {
    "miniflare": { "undici": "7.30.1" },
    "@cloudflare/config": { "zod": "4.6.6" }
  }
}
```

这是有意覆盖父包精确 pin，虽然子包 patch/同主线也必须测试兼容。嵌套配置命中两套 Miniflare/config，但保留 jsdom 的 Undici 8.12.3。[npm 官方 overrides 规则](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides)要求放在根清单。

3. 修改清单后只在该候选运行 `npm install --package-lock-only --ignore-scripts`，检查 lock diff 只含预期两类子包；再 `npm ci`、`npm ls ... --all`、`npm audit --json` 与 `--omit=dev`。不能提前承诺归零：元数据会变，内联代码不由 override 修补。若上游已修复则优先正常父包升级并删除临时 override。
4. 可选 cf beta.21 单独排在 Node 更新之后；它不是修漏洞的必要条件，本次没有证明其 CLI/config/部署输出兼容，不顺手升级 plugin 或迁移回 Wrangler。

### 后续必要回归

- 全仓 typecheck、内容/引擎/分享/Editor/UI/voice/gateway 自动测试、web 与 gateway build、35 张生成素材检查。
- 检查 config schema parse 与 `cf build`，本地独立端口 `cf dev` 的健康路由/同源拒绝/静态资源、模拟 WebSocket relay；不调用收费模型或用户麦克风。
- Node 更新后打印 `process.versions.undici`；npm tree 核两套 7.x 均已修、jsdom8.x 未降级；产物 source map/导入再次检查。
- `cf deploy --prebuilt ... --dry-run` 仅在下一负责人检查参数与无上传语义后做；本次没有执行 dry-run/部署，也没有读取凭据。正式部署继续沿项目发布门禁。
- 若 scoped override 报 schema/API 兼容错误，保留候选失败证据，报告上游与 root；不通过 force/降级工具链掩盖失败。

## 本轮边界

已完成：官方 advisory/registry/Node 发布核对、锁文件与安装树、omit-dev 审计、现有锁的本地构建及 JS/source map 检查。未完成：override 后的安装/审计/兼容回归、新 Node 实际验证、恶意响应 PoC、所有工具远程配置路径、Cloudflare 托管 runtime 内部依赖审计。未改 package/lock/workflow/source，未联网模型、登录、创建资源或 push。当前检查通过仅证明现状可构建，不证明候选修复已验证。
