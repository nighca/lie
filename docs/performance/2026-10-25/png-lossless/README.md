# PNG无损重压实测与接入建议

2026-10-25；reviewed main/base `d47ae21767038176da71bf6dd03478b3806bcee5`，独立branch `codex/png-lossless-build`，WT `/Users/nighca/.codex/worktrees/png-lossless-build/lie`。用户授权性能/图片无损优化；本轮先做实际全部语料测量。**建议当前不把此重压探针接入build：收益有限，新增逐PNG重压/格式维护与约一分钟压缩成本不成比例。生产优化未实施。** 这是可review的工程建议，不冒称没有进一步压缩空间，也不扩到其他格式/有损处理。

## 实测结果

使用现有Node **24.22.1** / 内置zlib **1.3.2.1-motley-285e94b**，没有安装依赖、下载工具、启动服务、浏览器或接触provider。实际扫描当前8正式preset目录中全部**81 PNG文件**（50种不同原字节），覆盖静态/头像/动画parts；不是47/60旧语料，不包含历史README截图、旧六张平铺PNG或未main动画PR候选。每文件一次level9/default strategy，合并原连续IDAT后实际构造一个新IDAT，其他chunk原字节/顺序不变；如变大本应保留原文件，本轮81张均减小。

| 范围 | 原字节 | 候选压缩字节 | 节省字节 | 比例 |
| --- | ---: | ---: | ---: | ---: |
| 全部81PNG | 66,486,773 | 62,976,798 | 3,509,975 | 5.28% |
| 动画parts46张 | 35,080,450 | 33,091,428 | 1,989,022 | 5.67% |
| 独立avatar3张 | 2,701,442 | 2,549,502 | 151,940 | 5.62% |
| 静态状态32张 | 28,704,881 | 27,335,868 | 1,369,013 | 4.77% |
| 首案三头像＋sunny五parts的文件集合 | 7,005,235 | 6,522,498 | 482,737 | 6.89% |

最后一行仅按现有引用求和，不是新浏览器网络/LCP/用户时延实测；不是全站首次加载，亦不把按URL分开的相同图片字节当HTTP自动去重。既有hash暖缓存命中时无传输字节的范围不能再算PNG冷字节收益。固定89资源仍原样保留，因此潜在派生压缩也不能消除固定兼容副本体积。

本机一次实测：压缩累计 **66,726.09ms**，解析/filtered/RGBA/alpha等验证约 **5,497.66ms**，总wall **72,371.07ms**；单文件压缩median781.08ms、P95 1330.62ms、max2579.50ms。这不是CI机器性能保证。探针对当前每路径测量，未实现按相同源SHA缓存（50种字节），不把未来缓存/并发的估计当实测加速。输入设128文件/128MiB总量、16MiB单PNG/64MiB单filtered流、两分钟批预算；本轮全部在界内。

旧[3.92%调查](../png-investigation.md)为另一个zlib运行时的估计，未构造输出/CRC/像素验收；本轮实际输出和版本不同，**当前证据以5.28%为准**，不把两者混成同一个实验。逐文件bytes、耗时、源/新PNG与filtered/RGBA/alpha/non-IDAT SHA256见[measurement.json](measurement.json)。

## 无损与边界证明

[measure.mjs](measure.mjs)只在内存构造候选PNG，**没有写出或修改任何PNG**：

1. 对81张原图验证PNG signature、chunk长度/边界/CRC、IHDR首位唯一、IDAT连续、IEND与无尾随数据；限定当前全部实际满足的RGBA8/noninterlaced输入，遇未来不同格式失败，不静默泛化。
2. level9只重压解压后的原filtered scanline stream；重新解析实际候选验证全部CRC，再逐字节比较filtered bytes、完整非IDAT raw chunks（包含length/type/payload/CRC与顺序）。IHDR及当前caBX等元数据不重写、去除或排序；如存在PLTE/tRNS，其raw chunk也在该逐字节不变集合，但本次语料没有这些chunk，不声称测了其他color type。
3. 独立执行PNG row unfilter，比较两次实际RGBA buffer全部字节，包括透明度；同时记录RGBA与alpha摘要。原filtered与IHDR/其他chunk本来就完全相同，此解码检查再提供当前RGBA8语料的具体见证，不是浏览器/sips对照或色彩管理硬件测试。
4. 逐文件读回原图核对不变；源码hash保存在JSON，可复核。没有缩放、量化、重画、改filter、变palette/alpha/color profile，未用Python图片处理。

保留caBX等chunk bytes不等于检查其中可能存在的内容绑定/签名等语义仍有效；本轮没有做这类元数据验证，也不把合法PNG CRC当其他签名有效的证据。当前选择不接入生产，原字节及其原语义均不受实验影响。

## 现有构建路径与资源身份

读完现有 `apps/web/build/static-assets.mjs`、static-assets集成测试和正式generator上下文。当前fingerprint是在原PNG bytes上生成hash，动画目录摘要包含排序路径/长度/所有包与parts bytes；原package JSON仍用相对parts URL。若以后接入压缩，必须先选最终PNG bytes，再算单文件与整个动画目录hash，随后改写manifest并hash入口，不能先hash后改bytes。不得改canonical/动画PR源/固定89兼容资源，不在本轮偷偷接线。

实际执行现有 `scripts/character-presets.mjs` 与 `--check`：**8预设89资源通过**；调用实际fingerprintAssets，逐一证明全部81PNG的canonical→fixed public→派生output与测量前source SHA相等。8个原animation package bytes原样，**46相对parts均存在**，92派生输出；当前manifest仍 `/static/4c0b4d28c65deab8a4ca7225a4cb1a1d1d88696c79b74ee20625d36afbd5781d/appearances/manifest.json`。具体结果和分组见[resource-identity.json](resource-identity.json)。本轮没有改变hashplugin、loader、资源或依赖，不把静态推导叫新的浏览器/Miniflare实测。

此分支只有研究doc/探针/数据。没有安装依赖，**未重新跑Vite/CF完整构建及应用全suite**；执行了真实资源生成/strict及指纹构建函数。因为没有生产改动，不为文档批引入新依赖或重复应用全检，也没有留下未完成生产实现尾项。

## 探针验证与重放

[8项Node原生测试](measure.test.mjs)全部通过：独立标准CRC向量、五种filter已知RGBA向量、Sub的像素步长、实际重压/元数据保留、坏CRC、截断/尾随数据、非连续IDAT和不支持格式fail closed。使用同一现有Node运行：

```sh
node --test docs/performance/2026-10-25/png-lossless/measure.test.mjs
node docs/performance/2026-10-25/png-lossless/measure.mjs
```

第二条会在本目录更新measurement.json（耗时可变），仍不输出PNG或改生产资产。开发浏览器/trace能力虽存在，本任务未启动服务或做页面trace；没有LCP/CLS/真实冷网加速结论。

## 接入建议与收尾

现在保持原build和原资源，先保留这份完整实测供review。若以后重新评估，应明确可接受的冷字节收益/构建时间，先比较更快的zlib level及去重方式，再以实际产物在最终字节上hash并重验8包/46parts/原固定89身份；这些是未来选项，**本轮没有实施或借此扩范围**。不要引入有损工具、新依赖、原画编辑或改动独立动画PR来源。

服务/浏览器/付费/凭据操作均为零，无PID/PTY/tab或临时服务器需要清理；只产生忽略的固定生成资源，工作树保留正式Git证据。root唯一integrator，未main/push/部署/PR。
