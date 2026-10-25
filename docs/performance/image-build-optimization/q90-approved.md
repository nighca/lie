# 已确认采用 q90：批准范围与实施证据

2026-10-25（Asia/Shanghai）。本记录初写于12:32:56（04:32:56 UTC）；批准原chat的秒级时间未随任务转交，不以记录时间冒充批准发生时间。**用户已明确采用有损q90，无需再询问质量批准。** 用户在本专项chat `01a1713b-683e-7bf3-abe0-44aff7bdf059` 的直接原话：

> 这次就用有损 q90 吧，看起来能减少不少体积。“原图保留、构建自动处理”这个没问题

此决定替代56b2adad研究报告的“建议先严格无损、q90尚待选择”当前建议；旧实验/备选/当时门禁完整保留于该提交，不删除或伪装为当时已批准。实际选择为 `cwebp1.6.0 -q 90 -m 6 -alpha_q 100 -metadata icc`，不缩放、不量化、不编辑canonical；lossy RGB已获确认，尺寸和alpha仍必须完全相同。美术继续提交既有PNG，无新制作、命名或导出步骤。部署/发布仍由主协调另行授权，本批准不构成自动push/deploy许可。

## 完整 q90 语料实验

基线研究56b2adad应用同已发布48316544；81PNG路径/50种独立源bytes，全部转换完成。每张尺寸和alpha逐字节相同，RGB变化为有损预期。[逐文件数据](measurement-q90.json)包括源SHA、chunks、像素/alpha摘要、候选SHA、误差和时间；[集合汇总](summary-q90.json)保留实际网络阶段路径，网络原证据仍是当时workers域名的8首页+5调查parts+错误结果，不冒充新域名WebP性能实测。

| 图片集合 | 原PNG bytes | q90 bytes | 减少 |
| --- | ---: | ---: | ---: |
| 全81路径 | 66,486,773 | 9,746,332 | 85.34% |
| 50独立源bytes | 38,533,620 | 5,549,782 | 85.60% |
| 首页实际8图 | 7,468,258 | 1,133,890 | 84.82% |
| 首次调查新增5parts | 4,303,793 | 595,822 | 86.16% |
| sunny错误结果额外default URL | 963,360 | 135,318 | 85.95% |

单次Python/Pillow/Homebrew cwebp实验：编码wall244.28s/CPU204.59s，含逐可见像素误差计算的全批wall272.20s。该探针串行，与生产Node两worker编码和官方静态二进制是不同执行路径，不能用一个时间覆盖另一个。源与输出SHA连接两者，所有50官方工具实际产物SHA都与此实验相同。[复现工具](benchmark-q90.py)增加`--q90`全量模式，保持原图不改，单次批预算600s/每编码90s。

## 构建实现（本机验收完成，待主协调集成）

独立实现WT `image-q90-build/lie`、branch `codex/image-q90-build`，初始base3fdec3de；正式最终组合base/提交以交付记录为准。只做build派生，固定public PNG及canonical完整保留；产物仍包含固定PNG兼容副本，因此上表是运行时图片URL冷字节节省，**不是部署整体包减少85%**。

`image-tools.mjs` 在首次build自动从Google官方正常TLS地址下载精确1.6.0档案，校验archive和两可执行文件SHA；按OS/CPU身份隔离，缓存至既有忽略目录`tmp/image-build`。当前实现目标为本机macOS arm64与CI Ubuntu x64；其他平台明确报错，未声称全Node24平台已验。Node24通过child_process执行，不需要Node native addon/npm codec依赖，不增加锁文件。下载/安装/版本或校验失败明确fail build，不伪装压缩成功。

`image-codec.mjs` 校验PNG结构/CRC，再解析现有RGBA8行过滤。普通合法图片若超优化预算、非本次验证颜色类型、带ICC/gAMA/sRGB等显示元数据则保留源PNG并告警；不把优化预算变成美术导出规则。坏CRC/损坏源明确失败。当前81源全为RGBA8且仅IHDR/IDAT/caBX/IEND，全部可转。派生删除caBX，保留原图来源元数据，不声称原C2PA签名仍绑定派生或已验签；当前无需色彩空间转换。未来ICC图先保留原件，待专门验证后再放宽自动转换。

`image-optimize.mjs` 用官方cwebp编码、dwebp PAM解码，独立核对尺寸与完整alpha；不符合、编码失败/超时或候选不小于原件时保留原PNG并告警。RGB按批准方案有损。cache key涵盖源bytes SHA、平台和真实encoder/decoder SHA、完整选项/元数据策略版本；缓存hit核对源/alpha/尺寸/输出SHA及WebP头，损坏JSON（含null）或图片重新编码。对完整源SHA去重，最多2个worker，临时目录finally清理。CI新增actions/cache@v5复用工具和已验证派生，按平台/helper内容/素材集合分键，恢复前缀允许新素材只编码新增项。没有实际CI执行证据，不把本机通过叫Linux通过。

`static-assets.mjs` 先选最终bytes与真实扩展名，改写clone动画包的相对parts引用，再按排序后的最终路径/长度/bytes计算包目录hash，重写所有portraits状态（含新可选结果态）、avatar/portrait/animation，最后hash manifest；JS/CSS经现有Vite流程使用最终URL。不把WebP放到.png文件名下，原包/源manifest不改。构建日志明确显示encoded/cache/preserved计数。

### 已完成本机原生证据（旧81语料，组合验收将追加）

Node **24.22.1**、官方mac-arm64 cwebp/dwebp1.6.0。首次工具安装实际正常TLS/双SHA/版本校验：**12,725.93ms**；50独立源、2worker真实冷fingerprint：**74,251.19ms**、50encoded/0cached/0preserved、81WebP/总92派生输出；后续warm：**1,832.97ms**、0encoded/50cached/0preserved，50输出SHA与独立q90全量实验相同。sourcealpha由Node parser抽取与Pillow既存inventory全部81路径SHA匹配，主协调独立Node24.17.0执行；这条不是24.22完整build证据。无peak memory或Linux耗时结论。

[原生冷记录](native-cold-81.json)与[热记录](native-warm-81.json)保留实际URL/统计。时间受二进制编译和机器并发影响，不承诺同样CI耗时；CI既有15分钟预算没有偷偷加大。候选完整build/Web suite与混合PNG/WebP守卫已在[组合验收](combined-acceptance.md)通过，真实IAB和本地Worker HTTP见[浏览器验收](browser-acceptance.md)。不以这些原生旧81记录代替组合验收；未来新增结果原画仍需针对新增bytes验收。

## 官方工具供应

官方下载入口：[WebP预编译工具](https://developers.google.com/speed/webp/docs/precompiled)、[cwebp参数](https://developers.google.com/speed/webp/docs/cwebp)。

| 档案 | 下载bytes | SHA256 |
| --- | ---: | --- |
| libwebp-1.6.0-mac-arm64.tar.gz | 5,283,875 | bc6bf84cc70f3f8574fba797d1e4a7dea4feebe9fa4be919f202413ea2b3b8f2 |
| libwebp-1.6.0-linux-x86-64.tar.gz | 11,907,270 | 1c5ffab71efecefa0e3c23516c3a3a1dccb45cc310ae1095c6f14ae268e38067 |

Mac encoder/decoder SHA分别07ba9109…/7b341872…，Linux分别5ac7ece6…/f4b035af…，完整值在image-tools.mjs。供应review独立正常TLS下载再次确认相同archive SHA；Linux是static-pie ELF x86_64（file报告GNU/Linux3.2+），Mac只链接系统libSystem/libc++，没有Homebrew codec dylib依赖。Mac实际可执行；Linux在Mac不能执行，不虚报CI验证。archive/binary pin证明本次官方TLS下载内容身份，不等于单独签名验真。仅提取cwebp/dwebp，档案/其他库不打包进站点。

官方许可为[BSD3 COPYING](https://raw.githubusercontent.com/webmproject/libwebp/v1.6.0/COPYING)及[额外PATENTS授权](https://raw.githubusercontent.com/webmproject/libwebp/v1.6.0/PATENTS)。缓存二进制为构建工具，未提交/随站点分发；若另行重新分发工具，须保留其许可声明，不把图片产物当工具再分发。[GitHub cache v5](https://github.com/actions/cache)使用Node24且需要runner>=2.327.1，当前ubuntu-latest预期具备；实际CI留待主协调发布验证。
