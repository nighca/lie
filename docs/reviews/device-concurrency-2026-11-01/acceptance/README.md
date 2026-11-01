# Cookie Device 本地验收记录

2026-11-01；实施 owner `/root/cookie_device_implementation`。本记录为真实 Web + 真实 Worker + fake provider 的本地验收，**不是线上/真实 Linx 多设备或 token scope 的验证**，不替代 token-study 的独立证据。

## 代码与构建身份

- Worktree：`/Users/nighca/.codex/worktrees/b1b9/lie`；branch `codex/voice-device-isolation`。
- 原 source base：`6cae1234571b0f0940aa6a41f19f40171b3c2c4c`（设计）；产品 source commit：`a17870f80a8eb7922f33a1629886cf953bf5314b`。
- 构建/浏览器 HEAD：`cf37595810d320032f273d95f708aa1608c99992`（在 source commit 后仅文档/离线研究）。全 build 开始及完成后实际 `git status --porcelain` 均为空；主 bundle 内版本为此 SHA，`dirty:false`。
- Node `24.22.1`，本 WT `npm ci --ignore-scripts`；未改依赖/锁文件，未跨 checkout 软链。
- `npm run build` 成功。首次 sandbox 构建因官方 libwebp 下载 DNS 被拒失败；按授权升级重跑，从官方 storage.googleapis.com 下载仓库已固定且校验 archive/二进制 SHA256 的 libwebp 1.6.0。82 unique PNG 首次编码，0 cache hit、0 preserve。后续 Web/Gateway 构建及资源检查通过。
- Web `apps/web/dist/assets/index-CwfqgHDd.js` SHA256：`b60b0c654305cbe8de3fa9c11c812dbc5b5b23153a7deed731d0a5021dfcfccb`。
- Gateway `.cloudflare/output/v0/workers/default/bundle/index.js` SHA256：`3eea732c0b4c082967260d0e8627671f7efad1512ab78391892d0bcee50c553a`。
- cf 生成的 worker config 实含 compatibility `2026-10-23` 与 `enable_request_signal`。这证明配置成功编译，不单独证明生产环境断连行为。

## 自动化检查

- 完整 workspace suite 通过：Gateway 61、Web 412、character-animation 80、game-core 54、UI 61、voice 54，main-preview 脚本 9、资源脚本 24。
- 用户后续要求把触发移到 intro 成功加载后：再次完整 Web 43 files / **413 tests** 通过；全 workspace typecheck 通过。覆盖失败、superseded、disposed load 零 prepare，以及跨 controller/restart 共享准备与不计玩法预算。
- 最后加强 late-aborted upgrade 的明确零 browser relay 断言后：gateway browser-device 6/6 与 gateway typecheck 再通过；未重跑无关 suite。
- `git diff --check` 通过。gateway HTTP/workerd 测试含 0 字节 request stream、错误 stream、响应大小/读取超时、Cookie 身份、双实例 prepare、绑定冲突/归属失败、身份竞争与 WS 替换；Web 测试含取消共享准备、旧 generation 回调、20 秒共用预算与一次 bootstrap 上限。
- main-preview suite 中显示的 8787 字样来自独立临时 fixture/fake child；未启动或控制用户 launchd 服务。

## 服务和浏览器方法

执行脚本的原始身份保存在本目录：`server.ts` SHA256 `cab18f49e495448370f8d61cbbbb02bce73487a589dae43445ec87a2dd69684b`；`media-injection.mjs` SHA256 `8aeb306cdb2733028b3b1b9c9203fb785bbe6cbc4346201e0115175a2730b005`。脚本保持实际执行版本；重放时从 repo root 复制回原位置，不能直接在归档目录执行相对 import：

```sh
mkdir -p tmp/p0-cookie-browser
cp docs/reviews/device-concurrency-2026-11-01/acceptance/server.ts tmp/p0-cookie-browser/server.ts
cp docs/reviews/device-concurrency-2026-11-01/acceptance/media-injection.mjs tmp/p0-cookie-browser/media-injection.mjs
# 先核对服务登记/监听、取得 turn、完成 clean build，再执行：
env PATH='/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin':"$PATH" node tmp/p0-cookie-browser/server.ts
```

- strict `127.0.0.1:5182`，启动前检查端口；占用即失败，不换口。一个 Miniflare 包含真 Web dist、真 gateway 源码 bundle、同源 fake 控制端点与拦截所有 outbound 的 fake provider；固定 fake keys，无真实 secret/provider IO。
- 本次原 PTY `64276`；Node PID `41692`（自有 internal loopback `63075`），子 workerd `41766`（`5182`）。未产生其他子 listener。
- IAB 在此工具环境 unavailable；使用 DevTools 专用 `isolatedContext=lie-p0-cookie-20261101` 的 owned pages 2/3，共用 Cookie；page 4 使用 `lie-p0-cookie-other-20261101` 独立 Cookie/storage。没有以不同 port 充当 Cookie 隔离，也未读/清/覆盖默认用户 Cookie。
- 每个新 document 在实际语音 UI 点击前注入 media 文件，并单独核验 fixture=true、函数源码确为 `createMediaStreamDestination`、没有 native getUserMedia fallback。没有调用真实麦克风、接受权限提示或修改权限/viewport。
- 合成输入是原生 AudioContext 的 MediaStreamDestination，native capture AudioWorklet、AudioContext.resume、PCM player 均真实执行。spy 只记录真实调用与 state，不伪造成功。fake 输出是明确标为 fake 的固定转写和零 PCM，不代表真实 ASR/LLM/TTS。
- 实际语音使用 UI click。首次“接案”被自动审批拒绝，理由是同一次工具调用中的注入验证尚未进入其可信上下文；独立只读核验并回传五项 true 后，重试原 UI action 获准。未改用间接触发或真实 mic。
- `pending-gate.mjs` 是独立 evaluate function：在页面背景 prepare 的 POST **真实提交前**等待真实“开启对话”UI click，捕获当刻的 pending/mic/context 状态并释放；返回值仍是实际 HTTP response。它防止工具往返时间把测试退化为 ready 路径，不替换 response、不模拟点击，也不重置产品 20 秒总预算。fake OTA 由同源 `/__fake/control` 配置为 3500ms，追加一例 5500ms 检查 transient activation 过期。

## 浏览器实测结果

| 情形 | 实际观察 |
| --- | --- |
| intro 预热，未点对话 | OTA2 / bind1 / WS0；getUserMedia0 / native context0；介绍页正常展示。 |
| ready 后点击 | WS1；native capture/playback 两 context 与 synthetic source context 均 running；worklet module1；native playback source.start12；fake 上游收到 PCM（首个采样379帧）。 |
| same Cookie 第二 tab | 共一 Device、bind 仍1；WS2；旧 tab 显示既有“语音暂时中断”反馈且无自动重连；旧 capture/playback/source 全 closed、track.stop1；新 tab 两 context running。 |
| 独立 identity | 第二独立 Device 注册后 bind2；B 与 A 同时保持原生 contexts running；A track.stop0，没有被不同 Device 替换。 |
| pending + OTA3500 | click 时 POST 未提交/未完成、mic0/context0；点击释放 gate 后实际 prepare POST `3509.4ms`，204；等待期间无 mic/context；完成后两 native contexts + source running、worklet1/player12。 |
| pending + OTA5500 | click 时仍 pending、mic0/context0；实际 POST `5506.4ms`，204；3次真实 native resume 均记录 `state=running, activation=false`；worklet1/player12；最终仍正常对话。 |
| console | pages2/3/4 均未发现 warn/error；page4 含 preserved 导航记录再次检查为0。 |
| 最终采样 | fake 累计 OTA12 / bind2 / list3 / WS5 / PCM20478；始终只2个 Device。PCM计数含实际等待时间，不作为吞吐性能指标。 |

3500ms pending 的相对时钟：点击 `30091.4`；POST submitted `30091.4`，end `33600.8`；点击前 mic0/context0。5500ms 例：点击 `21058.2`；POST submitted `21058.2`，end `26564.6`。都是页面 performance.now 毫秒，非线上时延/p95。

原生截图在本次工具结果 inline 展示了 warm 及 activation 过期后正常对话的页面与明确 fake 转写。DevTools 的 filePath 写本 WT 和 `/tmp` 均因其另行配置的 workspace roots 拒绝；未绕过文件访问限制，未再申请资源。这里保留文字/时钟与可重放方法，截图未存进仓库。

## 清理和边界

- 两活跃对话先通过原 UI 正常结束；各自 native capture/playback/source 全部 closed、track.stop1。被替换旧 tab 已单独证实同样清理。
- owned pages **4/3/2 已关闭**；最终 list_pages 仅保留原来的 page1 about:blank。没有遗留注入、默认用户 Cookie 操作、viewport override 或权限修改。
- 原 PTY `64276` Ctrl-C，exit130；随后 `ps -p 41692,41766` 只有表头、两 PID 已不存在；`lsof` 核 `5182` 与 `63075` 均无 listener。没有杀未知进程或停止用户服务。所有本专项服务已停，无保留 consumer。
- 构建/浏览器 source 身份仍为上述 clean SHA。验收完才新增此 acceptance 文档与必要方法文件；父 owner 的 token-study 修改不属于本实现范围，未读改。
- 这是单一本地 Chrome 环境的 native audio 验收，不保证其他浏览器/设备的 autoplay 或生产网关取消行为。fake 内按 MAC 替换 WS 是可控协议模型，不能冒充真实供应商替换的证明。
- 同 Agent 的 MAC 归属查询不能区分极低概率的两个 Cookie 随机 MAC 碰撞，不声称检测任意碰撞。Cookie 不代表物理设备 MAC。
- 保留每 WS OTA 的当前实现；真实 token scope/TTL/refresh 结论由独立研究处理，本验收未验证或要求跨 Device token 必须不同。
