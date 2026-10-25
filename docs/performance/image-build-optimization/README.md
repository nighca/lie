# 构建期图片派生：实测与待确认方案

2026-10-25；**研究/提案，未启用生产，待用户选择质量范围。** 基线 `4bd7ada61f4b68373768641c45078acde8673891`（应用同已发布 `48316544ea9fd22afbf1eee8db6f81e326026821`）。独立 WT `image-build-optimization/lie`，分支 `codex/image-build-optimization`；主协调 `01a17012-fa00-7170-ac0a-21c1900d71cd` 是唯一 integrator。本目录不修改 canonical、共享构建/锁文件/运行时。

**建议首先采用严格无损 WebP，保留原始 PNG，美术无需新增导出、命名或压缩步骤。** 整个现有语料减少约 34.2%，已有充分理由接入自动构建；有损方案更小，但必须另行得到用户明确选择，不能叫严格无损或默认启用。本提案不缩放、不量化、不重画。此前单纯重压原 filtered IDAT 的5.28%研究仍有效于其路径，不代表本次新编码收益。

## 实际数据

十进制 MB，表中是独立 URL 对应的图片 bytes 之和，**不含请求头、JSON、JS、logo和其他资源**。保留路径方案没有把同 bytes 不同 URL 当浏览器自动去重。

| 集合 | 原 PNG bytes | 新 PNG 基准 | WebP 严格 RGBA 相同 | WebP 节省 |
| --- | ---: | ---: | ---: | ---: |
| 全81路径 | 66,486,773 | 59,662,469 | 43,745,602 | 34.20% |
| 50种独立源bytes（编码去重） | 38,533,620 | 34,400,816 | 25,162,572 | 34.70% |
| 首页实际8图片 | 7,468,258 | 6,727,166 | 4,963,440 | 33.54% |
| 第一案首次调查新增5parts | 4,303,793 | 3,762,803 | 2,811,900 | 34.66% |
| sunny错误结果新增default URL | 963,360 | 842,995 | 631,376 | 34.46% |
| 46动画parts路径 | 35,080,450 | 31,264,897 | 22,873,880 | 34.80% |
| 3独立avatar路径 | 2,701,442 | 2,418,074 | 1,800,528 | 33.35% |
| 32静态状态路径 | 28,704,881 | 25,979,498 | 19,071,194 | 33.56% |

PNG基准是 Pillow12 `RGBA.save(optimize=True, compress_level=9)`，重新选行过滤并删除来源元数据；不是旧zlib探针重跑，也不量化。WebP 是现有官方 `cwebp1.6.0`：`-lossless -exact -m 4 -q 75 -metadata icc`。lossless模式的q75控制压缩努力，不代表有损75质量。当前无ICC，实际无额外profile保留成本。所有81源文件均比候选大。源/派生SHA、逐文件尺寸、chunk、alpha、完整RGBA哈希、时间见 [full](measurement-full.json)；路径分组和合计见 [summary](summary.json)。

50种源bytes各编码一次，串行 PNG 编码wall20.19s/CPU19.53s，WebP wall19.26s/CPU17.49s；两种编码加解码校验的全批wall41.97s。macOS ARM64/Python3.13.11/Pillow12.0.0/libwebp1.6.0，当前机器存在并发其他工作；不是CI速度承诺。Node当前24.17.0，项目CI配置24.22.1；实验Python只是验证工具，**不是建议给生产构建加Python依赖**。尚未实测CI/Linux、冷安装、warm disk cache、并行编码或peak memory，不推算其耗时。重复源只编码50次，但仍有81URL传输成本。

### 网络证据与界限

root 2026-10-25约12:06 CST使用专有IAB自建tab、CDP Network.setCacheDisabled(true)后在 `https://lie-game.nighca.workers.dev/` 重载，按最新navigation请求过滤旧in-flight响应。实际首页8PNG均200/fromDiskCache=false，Content-Length与当前canonical一致。查看第一案详情无额外bitmap；“接案”加载sunny包及5parts；“我有答案”后错误指认沈禾新增sunny/default。blob解码响应不重复计入网络图片。无麦克风/provider。恢复缓存、Network.disable、关闭自建tab，无服务端口动作。详见 [network-evidence.json](network-evidence.json)。

新官方域名 `https://lie.agency/` 的只读普通TLS HTTP GET另核 manifest和sunny/avatar身份，见 [http-identity.json](http-identity.json)。旧IAB证据仍明确标注workers域名，**没有新域名浏览器性能测量**。测得的页面图片集合与离线候选字节关联，只证明潜在冷字节收益，没有启用候选、trace、LCP/INP/CLS或加载时延改善结论。warm-cache零传输不计收益。返回头有一年immutable，不能据此推断跨路径同bytes会命中。

## 内容、透明与色彩

81 PNG全部RGBA8，72张1254×1254；其余包括动画parts1024×1536、1362×1155、2172×724等，不裁切重采样。81路径中50种源bytes，重复主要是avatar/default/parts source；源图片总66.49MB，独立bytes38.53MB。完整尺寸和重复别名在full JSON中，**文件名avatar不是小尺寸头像**，其画布仍1254平方。

实际chunk只有IHDR、IDAT、caBX、IEND；81个caBX总1,845,054B，IDAT总64,635,806B，无ICC/iCCP、sRGB、gAMA、cHRM或EXIF。caBX仅作为来源/provenance载体进行结构与大小盘点（41个23654B、40个21881B，各自首box长度等于chunk payload且type为`jumb`，未展开内部声明），不展开身份信息，不把PNG CRC当C2PA/签名验证。原始canonical保留全部字节；派生不复制caBX，不能把派生描述为持有经验证的原签名。未来若要带来源证明，应独立处理派生声明/签名，不能简单复制旧绑定。

校验通过：所有50种候选PNG和WebP与源解码尺寸、RGBA每字节、alpha每字节严格相同；因此包括全透明RGB和半透明边缘，不只肉眼相似。别名通过源SHA关联全部81路径；没有忽略透明RGB。`-exact`是关键，官方说明无该参数时全透明RGB可能变化。原图包含83,181,596全透明像素和44,086,499半透明像素（81路径计数）。Pillow和cwebp使用libwebp1.6.0，故不冒称独立浏览器解码证明；实施时仍须真实HTMLImageElement/canvas/browser验收。

当前无嵌入profile，未对色域做转换；数字RGBA相同是本语料的严格证据。未来带ICC的图保留ICC并验证色彩管理；有gAMA/cHRM/sRGB/EXIF orientation/未知关键chunk等语义时，不盲目删光转码：保留原PNG或fail closed并给出诊断，单独评估颜色转换。默认不让优化器自动转sRGB改变像素。来源和非显示元数据可从派生删去，原件保留；色彩/方向语义必须审查。

## 可选画质曲线（尚未获批）

[对照图](samples/comparison.png)展示珊瑚全身与脸部、银发脸部、透明边缘在白/深/棋盘格背景。原图和严格WebP可逐RGBA证明相同；有损q95/q90的视觉选择不能靠文件名或均值替代用户验收。没有内嵌文字图片，未构造“文字锐度通过”结论；小眼睛/睫毛/耳饰用原分辨率裁切检查。

| 样本 | 原PNG | 无损m4 | 无损m6/q100 | 有损q95 | 有损q90 |
| --- | ---: | ---: | ---: | ---: | ---: |
| coral avatar/default（同bytes） | 873,526 | 586,048 | 564,252 | 170,042 | 140,386 |
| silver default | 990,099 | 640,696 | 613,778 | 181,252 | 143,674 |
| coral fore-right part | 1,006,698 | 650,646 | 599,904 | 74,172 | 59,184 |
| silver head part | 1,011,518 | 637,812 | 608,940 | 170,886 | 134,112 |

有损均 `-m6 -alpha_q100`：尺寸和alpha完全相同，**RGB不同**。q95可见像素RGB绝对误差均值1.31–1.77/255，最大通道差60–255（包括接近透明的像素）；q90均值1.55–1.94。该均值不代表感知质量，透明边缘合成对照更有用。没有将“q95看起来近似”称为视觉无损已验收。无损m6比m4再省约3.7–7.8%，样本每图3.9–8.6s，对应m4约0.37–0.57s，优先m4降低构建成本；没有做全部m6或全部有损以节省实验成本。样本coral/default与avatar重复执行一次（同源SHA/输出SHA一致），[sample JSON](measurement-sample.json)保留实际重复计时，曲线表按独立bytes列一次。

## 构建接入提案

1. 美术继续仅维护 `design/character-presets/assets/**/*.png` 和现有manifest/package契约，不新要求命名/尺寸/导出格式。现有 `scripts/character-presets.mjs` 的源PNG校验和固定public生成继续原样；`--check`仍比较原PNG，优化只在build派生阶段，dev可继续原PNG。
2. 在 `apps/web/build/static-assets.mjs` 的 inputs 读取后、任何hash之前，按源bytes SHA+编码器完整身份+选项+元数据策略版本生成派生；同源SHA只编码一次。输出选择：严格RGBA/尺寸校验通过、bytes更小才用`.webp`，否则原`.png`。源不支持色彩语义/编码超时/损坏：普通转换失败保留原并警告；契约安全错误依旧构建失败，不能以fallback绕过安全验证。CI可提供strict模式让编码器缺失/版本不符直接失败，避免“成功但完全没优化”的静默漂移。
3. 静态avatar/portrait/portraits和未来可选result资源用明确已知字段重写；不要仅沿用当前只列3个字段而漏新契约。没有资源的可选字段保持缺省。动画每包clone JSON，把`assets.*.src`中的`parts/name.png`改成实际派生`parts/name.webp`，仅相对安全路径；别把WebP bytes藏在.png后缀下。先形成包JSON最终bytes+part最终bytes，再对**排序路径+长度+bytes**计算目录digest；原包/源文件不改。最后重写runtime manifest并hash，再交Vite hash JS/CSS。不能先hash后编码或让包引用源目录。
4. 维持同源`/static/<hash>/...`和一年immutable；MIME与真实格式一致。hash内容含最终包路径与bytes，新增可选结果也纳入。固定`/appearances`原PNG暂时仍随现行public政策交付，不能把派生节省说成部署总包减少；旧版本保留政策已取消，不新增retention。不在此专项自动删除固定目录。
5. 初版维持路径以少改接口；本表计81路径，不许把编码去重说成网络去重。以后可把静态相同图别名映射到共同content URL，动画parts当前安全相对路径约束会限制跨包复用；为这点省份引入全新全局资源协议不适合作为首轮必要复杂度。应用尺寸、形状、玩法不改变。
6. 增量缓存落忽略目录，例如`.cache/lie-images/<sha+tool+options>`，保存最终bytes+输出SHA并在命中校验；CI按同工具身份保存恢复，缺缓存仍可从零完成。写临时文件后原子rename，单进程promise去重，限制并发2–4、超时和总像素，避免无界子进程。缓存版本/CPU平台纳入键；不能承诺不同libwebp/架构输出完全相同。发布hash始终按实际最终bytes，完整身份锁定后再做跨平台重现验收。

### 必须先协调的运行时依赖

现行 `packages/character-animation/src/package.ts` 的src正则**只接受`.png`**，`load.ts`在decode前还强制检查PNG/IHDR并按大端读尺寸；因此只改manifest/package绝不会成功。实现turn需动画owner明确释放/协调这两文件（当前另有结果资源工作），增加严格PNG/WebP格式sniff和解码尺寸防护。保留同源/安全相对路径、asset计数/总像素限制、3并发、AbortSignal、objectURL revoke、失败释放和静态fallback语义；WebP VP8L/VP8X header尺寸验证不能误读PNG offsets，也不能只信Content-Type。解码前保持尺寸预算防护，解码后自然尺寸仍核对。Canvas本身drawImage接受已解码HTMLImageElement，不需要换动画引擎或编码成animated WebP。兼容PNG旧包继续支持；它是格式加法，不改变canonical源PNG要求。

### 工具/依赖取舍与实施验收

**建议首轮用本次实测官方cwebp1.6.0命令行，Node24 spawn调用，不加载Worker运行时。** Google提供Linux/macOS预编译；实施时锁定下载地址+实际包SHA256、工具版本及平台，不使用apt/brew latest或每build无校验拉取。本轮未下载Linux包或改CI，二进制大小/安装耗时/Linux精确产物尚待实施测量，不能把本机现有工具当CI已有。也可选择当前官方文档支持`exact:true`的Sharp（Node-API9/Node>=20.9，Linux/macOS预编译），但这是**未实测替代**，需要新增devDependency/lock协调，验证strip metadata、默认sRGB转换与`keepIccProfile()`等行为及完整RGBA；不把本次cwebp数字冒充Sharp数字。Python/Pillow只用于研究与独立数字对照，不进生产构建。

接入后的独立验收应包含：真实全部源RGBA/alpha/尺寸、元数据allowlist、fallback/timeout/坏输入、缓存命中/损坏/版本切换、相同输入重复build bytes；每个manifest URL可取到，8包46相对parts全存在且格式正确；PNG与WebP loader、错误/取消/切人/结果可选资源、reduced-motion/static fallback；build最终hash逐bytes核对及fixed源PNG身份；真实IAB冷网络集合和HTMLImageElement/canvas合成画面对比、MIME/year-immutable；Node24 CI干净安装与冷/热build时间。fake/provider/mic不是此任务所需。当前未跑应用全suite或部署，因为无生产修改。主协调独立重跑4独立样本×5变体，20输出SHA256全部与原样本一致，严格候选RGBA/alpha/尺寸断言通过；另以dwebp CLI解码珊瑚无损样本为PNG，完整RGBA同源（同libwebp后端，非浏览器独立解码证明）。

## 重放、证据与收尾

```sh
python3 docs/performance/image-build-optimization/tools/benchmark.py --root "$PWD" --out /tmp/lie-image-replay --full
# 去掉 --full 只跑4种代表性源bytes、无损m4/m6和有损q95/q90；保留原件不改
python3 docs/performance/image-build-optimization/tools/build-plan.py --root "$PWD" --candidates /tmp/lie-image-replay --out /tmp/lie-image-plan.json
# 可选：样本重放后生成对照图
# python3 docs/performance/image-build-optimization/tools/visuals.py --root "$PWD" --candidates /tmp/lie-image-sample --out /tmp/lie-image-visuals
```

需要现有Pillow12和PATH中的cwebp1.6，编码/解码版本写入JSON。脚本每子进程90秒timeout，当前81路径/50种bytes；这是当前有界研究探针，不是可直接接入不可信文件上传的生产库。完整二进制全语料候选留在/tmp，不重复提交约60MB；保留代表性WebP样本、对照图、逐文件SHA与可重放工具即可恢复结果。原图片已有Git历史。

本轮无服务/PID/PTY/tab（浏览器由root采集并已清理）、无mic/provider/账号/付费/CI/部署/PR/push。完成方案及备选保存在本目录，交root完整review后依流程集成；本轮不自行main。尚待用户确认严格无损首轮方案/有损是否另开质量选择，及root协调共享文件turn。

## 官方主要资料（2026-10-25核实）

- [cwebp参数](https://developers.google.com/speed/webp/docs/cwebp)：lossless、exact、q在lossless下的努力含义、metadata/alpha。
- [WebP浏览器支持与检测](https://developers.google.com/speed/webp/faq)：lossless+alpha支持Chrome23+、Edge18+、Firefox65+、Safari14+/iOS14+（macOS Big Sur+）。这是格式能力下界，不是本产品支持合同或实机验收。
- [官方工具下载](https://developers.google.com/speed/webp/download)：提供Linux/macOS预编译。
- [Sharp输出选项](https://sharp.pixelplumbing.com/api-output/)与[安装](https://sharp.pixelplumbing.com/install/)：当前exact:true、元数据默认行为、Node-API/平台二进制；仅候选库资料。

[构建dry-run计划](build-plan.json)与[工具](tools/build-plan.py)在真实50编码输出上形成90个appearances派生输出（81图/8包/1manifest，不含brand），核对8包46相对parts和全部manifest目标存在、源81未变、最终bytes后hash。JSON序列化与生产不同，候选hash仅探针；尚不能经当前PNG-only运行时读取，不冒称完成生产构建。

本报告应用web-perf技能，以实际网络/源数据量化；性能trace工具可用但此有界专项未trace，不填造Core Web Vitals表或LCP改善。
