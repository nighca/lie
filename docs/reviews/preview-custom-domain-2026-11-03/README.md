# 原生预览自有域名：2026-11-03

状态：原生域名绑定和当前直连 / PR #5 的 HTTPS 验收完成；可信 publisher 的自有域名链接策略已冻结于同批源码提交 `cc06edd35c991b368c19985ab77cb532656f19a1`，等待审查集成。此次没有重新上传任何应用 Worker 或 Preview。

用户要求当前直连及后续预览使用 `lie.agency` 子域，继续公开访问。经协调 review，采用原生父域 `preview.lie.agency`，不改正式站 apex / www，不引入代理 Worker，不扩套餐或凭据权限。

## 平台变更

唯一写请求是官方 `PUT /accounts/{account_id}/workers/domains`，body 为：

```json
{
  "hostname": "preview.lie.agency",
  "service": "lie-pr-preview",
  "zone_id": "22a541830c9ee4c3a3288243d908aaff",
  "enabled": false,
  "previews_enabled": true
}
```

写前重新确认：目标 zone 为 active / unpaused 且属于既有账户；exact hostname 无 Workers Domain；DNS `name.endswith=preview.lie.agency` 完整一页 count / total_count 为 0；`lie-pr-preview` 的 previews base config 为空、无既有域名；正式域名仍属于 `lie-game`，仅 production enabled；直连最新部署 ID 与已冻结部署一致。没有 override 参数，也没有读写 provider 管理凭据。

返回并精确回读的新 Domain ID：`d1568d5afe38461bee272a084ec6158ed00683a1`；certificate pack：`06530893-0c81-48b9-90ad-6b8e7db0a0c8`。Cloudflare 自动创建一条 proxied AAAA `*.preview.lie.agency` → `100::`，DNS ID 为 `affd8e8b51d050418b4d0d1ded7d787f`。域名回读 `enabled=false`、`previews_enabled=true`。

首次 HTTPS 握手失败时，证书 API 状态为 `pending_validation`（00:52:57 UTC）；随后同一 pack 转为 `active`，hosts 包含 `lie.agency`、`preview.lie.agency` 和 `*.preview.lie.agency`。未手工添加 TXT / CAA、未跳过证书校验。返回的 certificate type 为平台自动 `advanced`，本次没有下单、启用 ACM 或更改套餐。

## 当前地址与身份

| Preview | 稳定地址 | 不可变部署地址 | 最新部署 ID |
| --- | --- | --- | --- |
| direct-test-20261103 | https://direct-test-20261103.preview.lie.agency | https://b134ad51.preview.lie.agency | b134ad51-108b-4740-af20-4a487e3bee23 |
| pr-5 | https://pr-5.preview.lie.agency | https://b8223712.preview.lie.agency | b8223712-4301-4096-9ed3-60669f374089 |

这些地址来自绑定后的精确 Preview / deployment API 返回，原 `workers.dev` 地址仍存在。实际 API 的不可变地址为 `<UUID首8>.preview.lie.agency`，并非官方文档示例中的 `<id>-<preview-name>`。本地锁定 cf beta.18 的 `previews` 输出函数直接复制 `preview.urls` / `deployment.urls`，没有自行拼接域名。publisher 必须验证实际输出和 exact deployment 元数据；不能把自己构造的地址作为平台已配置的证据。

父 Worker ID 保持 `18bb3844b2684d34a75c14cbf574ccfd`，base config 仍为空，原 workers.dev 设置保持 production disabled / previews enabled；此次新增域名是唯一 domain reference。正式 apex 的原 domain ID / `lie-game` 映射 / flags 均回读一致。直连仍是 58b8207fdd498f307663fcafe658599446c40e73 对应的冻结部署，latest deployment ID、created_on `2026-11-03T00:23:07.56194Z` 及 6 个 binding 名均保持原状；没有变更 Device、Client、Cookie secret 或 expiry。

精确 GET `pr-2`、`pr-4` 返回 404，未恢复已关闭预览。`pr-3` 也返回 404；其后续发布须由协调者按当前 PR head / CI / artifact 的既有可信流程进行，域名绑定本身不创建设备或恢复 Preview。

## 验收与边界

两个稳定域名均在正常 TLS 校验下完成 `/`、`/editor`、`/api/health`、`/api/voice/status` 的 4 个 GET，全部 200，均无 Location 重定向。直连 status 为 `ready` / `transport:direct`、health 为 `storage:none`；PR #5 status 为 `ready`、health 为 `storage:r2`。status 返回新 hostname 的 HttpOnly + Secure Cookie，未记录 Cookie 内容。

静态验收后，按已有最多 2 次浏览器握手预算使用剩余 1 次：复用冻结 58 的 `verify-browser.mjs`，在 ignored 临时副本中仅将硬编码 origin 改为新自有域名，仍从冻结 58 的真实 channel 源码构建。原私密 verification 先以不覆盖方式备份，ledger 内部确认 attempt 从 1 增到 2；不再有剩余握手额度。副本与原脚本逐字反向替换一致，未修改 tracked 58 文件。

该次浏览器验证经过正常 prepare / connection OTA 后，仅一个 provider WSS、零 relay WSS；bad Origin 403、missing Cookie 409、relay 404、prepare 204、descriptor no-store、固定身份内部比对、channel ready 均通过。无麦克风调用、listen、binary audio 或业务推理，socket 和 browser 确认关闭。这只证明新域名下浏览器握手链路成立，不证明 provider 业务鉴权或大陆语音连续性。

原 verifier SHA-256 为 `c101445f41fb238ce62ce94a29dec8ab424f5efc7a628b08e9184bfe02454155`，仅改 host 的副本为 `61ab86798f122dd560304c1d4ec77892db749cda5be24c3fa44577c6d05a73b2`。未保存或输出 Cookie、Device ID、Client ID、OTA token、私密 ledger 内容。

直连稳定 / 不可变地址首页 SHA-256 同为 `036c829171b5a63f87a2773d33d67992a1eaa48e1d70d8288ea3165df8949582`；PR #5 两地址同为 `2f1a8e8db9f8f52fe9475f2dd1fcf4d5534445529c9461d0f1778a33f4908f69`。直连首页的同源 JS / CSS 均 200、无重定向；HTML 无 workers.dev 引用。`/assets/index-CfgsfD3y.js` 在稳定 / 不可变地址均为 281245 bytes，完整 SHA-256 `c281939071e7494c5c7355ecbbb8e294e8d91f266f2f81cda61ba643b54e9b93` 与冻结 58 的本地构建产物完全一致。直连页面没有 HTTP 或 meta CSP，本次没有改动策略，浏览器握手已验证新 Origin 不妨碍连接。无 Cookie 的同源 connection POST 为 409，外源为 403，均未触及 provider。

HTTP 成功仅证明当前执行机网络可达与 TLS / 路由正确，不能代替用户大陆实际网络的可达性或语音体验验收。

后续 PR 的自有稳定域名由该父域原生覆盖。关闭 PR 仍只删除对应 native child，不能删除共享父域、共享 DNS / 证书或其他 Preview。回滚若确有必要，只能对本次返回的 Domain ID 重新核验 hostname / service / zone / flags 后删除；不能猜测删除 DNS 记录或重部署 parent。此次没有执行回滚。

## 官方依据

- [Worker Previews custom domains](https://developers.cloudflare.com/workers/previews/custom-domains/)：preview-only flags，自动 wildcard DNS / SSL，以及首次证书异步。
- [Attach Worker Domain API](https://developers.cloudflare.com/api/resources/workers/subresources/domains/methods/update/)：本次确切 endpoint 与参数。

当前 cf beta.18 的匿名命令发现未提供 Workers Domains 资源命令，`cf schema workers domains list` 返回 schema not found。因该已验证能力缺口，经实际 review 后使用现有 Cloudflare 连接器调用上述官方 endpoint；没有读取 CLI 内部认证配置或调用内部函数。
