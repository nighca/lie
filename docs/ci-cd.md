# CI检查与CD部署

2026-10-25，用户授权拆分实现；本地候选，远程Actions尚未执行。CI与CD仍使用现有仓库及Cloudflare Worker，不新增账号/资源或手工部署入口。

[CI](../.github/workflows/ci.yml)在main push或手动workflow_dispatch时检查源提交：Node24.22.1/npm ci、handoff guards、全workspace类型检查、应用与脚本覆盖率及原14天coverage artifact、Web/Gateway构建、cf prebuilt dry-run。CI不读取Cloudflare部署secrets。正常一次main push只跑一轮CI；最终成功后上传一次完整预构建产物供CD取用。

[CD](../.github/workflows/cd.yml)只监听CI的workflow_run completed/main；job只允许本仓nighca/lie、本仓head、push或workflow_dispatch且结论success。签出的始终是**上游head_sha**，不是workflow_run中指向默认分支最新提交的github.sha。随后再经只读REST确认固定CI workflow ID/path、run ID、同一attempt、SHA、来源仓库和main分支。两次latest-main检查（接收前、部署前）阻止旧SHA部署；生产并发组仍是lie-production、cancel-in-progress=false。CI用独立lie-ci-ref并发组，互不误取消。

手动重验只从CI入口发起：选择main时完整通过后可触发CD；选择其他branch只检查，不上传部署产物、不部署。CD不提供任意run/SHA的workflow_dispatch绕过入口。人工rerun CI采用新attempt产物名；CD若遇到event与API当前attempt不一致则失败，不捡旧attempt。人工rerun CD仍重新验证CI身份/latest-main及产物可用性。没有force、跳检查、失败自动重跑或手工Cloudflare兜底。

## 完整预构建交接

实际cf1.0.0-beta.18产物是`apps/gateway/.cloudflare/output/`完整树，含`v0/config.json`、`v0/workers/default/worker.config.json`、`bundle/index.js`及map、隐藏`bundle/.vite/manifest.json`、完整`assets/`（含Webdist及cf fallback entry）。仅Webdist不足以部署；不把node_modules、cloudflare.config.ts或私密.dev.vars放进artifact。`cf --prebuilt --mode production --worker lie-game --provision=false`只消费恢复的Build Output，不重build/test/图片编码。官方支持跨job恢复[完整Build Output及mode匹配](https://developers.cloudflare.com/cf/projects/#deploy-a-prebuilt-build)。

CI helper只复制完整output到`tmp/verified-build/bundle`，附receipt：repository/SHA/run ID/attempt、lockfile SHA256、每份文件路径/大小/SHA256。artifact名`production-build-<sha>-<run-id>-<attempt>`，upload-artifact v4不overwrite；仅1天保留用于紧接的CI→CD交付，**不是旧版本资源兼容保留方案**。coverage原14天策略独立不变。缺失/过期/上传失败不回退其他run或重建，重跑main CI产生新已验产物。产物会占GitHub artifact储存，1天尽量减少积累；不承诺共享账户额度。

CD按该run列出artifact（完整单页最多100项，否则失败）、精确名称选唯一ID，并核artifact元数据的仓库/分支/SHA/run及digest。download-artifact v8使用同仓只读token、明确run-id和artifact-id，解压到runner.temp，digest-mismatch=error，**校验失败直接停**；单ID直接落在指定目录。随后helper核receipt身份/lock/完整inventory、禁止symlink/路径逃逸及.env/.dev.vars，恢复到全新`.cloudflare/output`，不混旧文件。包含hidden files是为保留`.vite`，范围只含已检查output，未扫描项目私密配置。

只有最终deploy step获得现有CLOUDFLARE_API_TOKEN/CLOUDFLARE_ACCOUNT_ID；前面checkout/setup/npm ci --ignore-scripts/验证没有这些secrets，GitHub权限仅contents:read/actions:read。生产CLI按签出的同一lock安装，不需要构建或图片编码器。安全边界是已获信任的本仓main CI；绝不执行fork/PR分支artifact代码。receipt不能替代GitHub来源检查；二者共同保证取到该次已验产物。

## 图片专项接口及合入顺序

原base为reviewed main6b126c997299c9d94bbd3400b639f7062a46a687。图片owner已释放CI，精确cache补丁来源72148739fdd8fb87452842c913f48d6880ef073d，仅取其CI七行，无整个构建提交cherry；actions/cache@v5的tmp/image-build/key/restore-keys逐字保留在CI，CD不重做编码。图片完整生产实现待root审/main后，root再组合本拆分候选；这是显式CI文件重叠，不覆盖其cache或复制未审实现。后续default cf output接口由owner确认；实际只读9e7f9f130cbcafac107151b4d0c0237d5b98c75e的gateway Vite/cloudflare/package配置与原base一致，本机也已实际重建核过。

## 本地实际验证与边界

- 独立managed WT `split-ci-cd-workflows/lie` / branch `codex/split-ci-cd-workflows`；既有离线npm cache按相同lock执行npm ci --offline --ignore-scripts，217包，无新依赖/lock改动。Node24.22.1/npm11.13.0。
- 17项[handoff测试](../scripts/ci-release.test.mjs)通过：失败/取消/未完成、其他branch/workflow、fork、旧SHA/run/attempt、精确手动CI、过期/缺失/重复/截断artifact、无digest、错误provenance、stale main无需下载、CD github.sha不同不改变上游SHA、receipt/lock/payload篡改、hidden文件、逃逸/symlink、preview mode/错Worker/缺web与新目录拒绝混入。
- 复用base对应已验Webdist，实际在本WT跑gateway cf build（2模块/358ms）；完整产物195文件/134,220,738bytes（未接图片转换的此base），含`.vite`；本地假run123/attempt2的receipt SHA256为`a7970d6e59f823a277d71bcf180eb37ca072a1c7fa2e7fd1950d7dbce24fdbfe`，不是GitHub实际CI身份。helper pack→restore到没有应用源码或项目cloudflare配置的隔离目录，按相同本地依赖cf --prebuilt dry-run **exit0**，无Cloudflare凭据、上传或部署。图片实现合入后的实际字节/大小仍应随正式CI产出，不把此旧PNG体积当q90结果。
- 初次本地新目录copy测试16/17：mkdir后cp同名新目录触发Node EEXIST，已改为原子创建目标目录后逐项复制，17/17通过，不隐藏失败或改生产来迎合。
- 两workflow YAML解析、所有run shell语法、本地链接与图片cache逐字身份已查；actionlint未安装，未网络安装。没有镜像YAML的低值测试、无关应用套件或再编码。
- **尚未远程触发Actions、上传/下载GitHub真实artifact或真实部署**，因此跨workflow token/运行上下文及Linux首轮实跑仍以首次获授权发布后的CI/CD结果为准。本轮无服务/端口/browser/provider/secret读取，不push/main；root实际review后按有序候选集成。

官方依据：[workflow_run的SHA/权限/分支与conclusion语义](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run)、[受信代码边界](https://docs.github.com/en/actions/reference/security/secure-use)、[跨run下载与单ID目录/严格digest接口](https://github.com/actions/download-artifact/tree/v8)、[v4不可变artifact/hidden/保留期](https://github.com/actions/upload-artifact/tree/v4)。这些来源解释接口，不当成本机或远程执行成功证据。
