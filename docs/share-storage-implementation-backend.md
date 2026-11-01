# 分享存储：后台实现交付

2026-11-01。实现基线 `a8be75823ceb67966390b5534d725a3a8bf1505b`，独立 worktree `lie-share-storage-backend/lie`，分支 `codex/lie-share-storage-backend`。用户已确认整体设计并要求推进，包含1 MiB写入上限、128 bits／22字符标识；UI先由独立Demo评审。本提交只实现协议与后台，不改正式前端，不创建资源或部署。

## 已实现

- `@lie/game-core` 根导出纯TypeScript的 `serializeSharedGameV1`、`SHARED_GAME_BYTES_LIMIT`、`SHARED_GAME_API_PATH`、`SHARED_GAME_ID_PATTERN`。不改原内容契约、规则、控制器或判案逻辑。
- v1序列化先校验案件，再用固定字段次序投影JSON，保留文本/数组次序/UUID/summary缺省语义，去掉未知字段；不依赖未来校验器输出的属性次序。
- `POST /api/shared-games/v1`：同源Origin、JSON媒体类型、非压缩请求，按实际流读取UTF-8 bytes，原始请求和规范化存储各至多1,048,576 bytes；校验预设ID来自现有权威manifest，null沿core语义。
- Worker计算SHA-256，取前16 bytes、无padding Base64URL编码，保存 `games/v1/<22字符ID>.json`，成功返回 `200 { id }`。直接put，无HEAD、条件写、映射表或客户端指定key。
- `GET /api/shared-games/v1/:id`：验证标识格式、直接流式返回R2对象；不做读取体积检查、不重新计算hash、不解析存储正文。前端后续仍需正常案件结构/预设校验。
- 安全错误JSON统一 `{ error: code }`；400 invalid_content/invalid_id、403 forbidden、404 not_found、413 content_too_large、415 unsupported_media_type、503 storage_unavailable；不输出内部异常、正文或secret。所有分享响应 `Cache-Control:no-store`，不开放CORS。
- 原Worker接线及health同步：storage字段只表示当前配置了R2 binding（r2）或缺失（none），不代表主动检查云可用性。语音与静态资源代码未改。
- 无IP限流、停写开关、读取上限、用户删除/修改/列表接口，不加入用户已否定的保护。

固定身份fixture：测试案件规范化内容的128bit ID为 `gmlvKTOY_GNRWutf2yaZBw`，已用Node独立SHA实现核对并固定断言。哈希不是认证、加密或恶意攻击安全保证。

## 配置与本地持久化

沿锁定 `cf@1.0.0-beta.18` / `@cloudflare/config` 声明：

```ts
SHARED_GAMES: bindings.r2({
  name: process.env.LIE_SHARE_BUCKET_NAME ?? 'lie-shared-games',
  dev: { remote: false }
})
```

`LIE_SHARE_BUCKET_NAME`仅用于配置目标桶名，不是secret或上传开关。默认生产名称是配置建议，实际资源尚未创建；隔离在线开发部署须明确改为开发桶名，不能复用生产桶。未更改账户、现有资源或权限。

现有Vite插件 `remoteBindings:false` 保持不变。已核安装包实现：插件默认persistState=true，目录为gateway root下 `.cloudflare/state/v3`，即本worktree `apps/gateway/.cloudflare/state/v3`；已有gateway `.gitignore` 忽略 `.cloudflare/`，无需自研模拟或新增忽略规则。每个checkout有独立root，不共享本地存储。测试使用Miniflare临时目录，已验证dispose→重新创建后的R2内容仍存在；测试完成删除自有临时目录。

gateway新增到已有workspace包 `@lie/game-core:0.0.0` 的依赖。根lockfile仅新增该workspace依赖元数据，无版本升级或额外安装包。

## 检查结果

使用项目现有独立Node 24.22.1／npm 11运行，不改全局runtime：

| 检查 | 结果 |
| --- | --- |
| game-core typecheck | 通过 |
| game-core tests | 6 files / 54 tests通过 |
| gateway typecheck（两个tsconfig） | 通过 |
| gateway tests，排除未改的game-cache.test.ts | 8 files / 44 tests通过 |
| 根npm run build | Web、121预设资源校验及cf Worker完整构建通过；Worker bundle17.17kB |
| git diff --check | 通过 |

新增有意义覆盖：JSON字段排列/未知字段/null/summary/人物顺序/UUID；真实本地workerd＋R2的保存后立刻读取、重复分享、修改后旧快照不变、1 MiB UTF-8边界、非法UTF-8/案件/形象/请求类型/Origin/ID、无删除入口；实际分块体积和虚假Content-Length、规范化后增大超限、读写异常安全错误、缺失binding；R2本地重启持久化；cf配置到部署格式的R2映射。

旧gateway workerd测试由单文件TypeScript转译改为Vite内存打包，以支持新增模块导入，继续覆盖既有语音握手/消息转发/关闭及静态资源语义。`game-cache.test.ts`未运行：它会启动Vite dev listener，本专项明确不获预览服务窗口；其文件与相关游戏缓存逻辑未改。其他gateway测试中的Miniflare实例均已dispose，无保留服务/消费者，不操作受保护端口。

构建仅有既有Vite未来native configLoader扩展名提示、workspace lockfile提示及underline静态路径提示，不影响成功。npm ci报告5项moderate既有依赖告警，未运行audit fix或升级依赖。

## 后续资源与接入（尚未执行）

1. 总协调审阅并安排资源许可；核目标账户/桶名/Standard存储，不为此读取或复制provider secret。
2. 已用本地 `cf cli search 'create R2 bucket'`、`cf schema r2 buckets create`、对应 `--help`核命令。获许可后先对 `cf r2 buckets create --name <已确认桶名> --storage-class Standard --dry-run` 检查预期请求，再执行不带dry-run的命令；账户选择按既有cf授权配置。此文不是执行许可。
3. 桶保持私有、不启r2.dev/公网自定义域、不配置浏览器CORS、不设自动TTL/生命周期删除。独立开发桶需独立批准，不把本地模拟当云端资源。
4. 前端owner接POST、GET和旧fragment只读兼容、15秒超时/安全文案/异步结果失效；web dev代理增加对应API路径。本提交不实现这些正式UI变化，也不将Demo当生产接入。
5. 后续隔离在线环境检查真实binding、刚分享跨客户端立即读取；平台强一致性、全球持久性和账户计费尚无项目级线上验证。无需真实语音即可验证分享。
6. 未创建备份系统、账户后台或内容治理闭环。部署/代码回滚不能删除生产桶或案件。实际集成/普通push/部署仅由总协调指定唯一integrator安排，不直接main。

官方依据：[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)、[本地binding支持](https://developers.cloudflare.com/workers/local-development/bindings-per-env/)。具体cf beta API同时以已锁定的安装包声明与配置测试为准，未用Wrangler替换项目工具链。
