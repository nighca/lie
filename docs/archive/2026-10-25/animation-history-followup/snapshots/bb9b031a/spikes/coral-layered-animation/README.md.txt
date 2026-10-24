# 原画分层Canvas关节样片

独立验证，无npm、WASM、商业运行时或真实语音。仓库根目录运行 `python3 -m http.server 5323 --bind 127.0.0.1` 后打开本目录。

详细生产记录、实际视觉限制、关节配准、浏览器验收与可复用成本见 [docs/coral-layered-animation.md](../../docs/coral-layered-animation.md)。素材/真实prompt与原始工具输出来源在 [design/coral-layered-animation](../../design/coral-layered-animation/)。

`study.mjs`只在浏览器绘制6张透明PNG并做肩/肘/头父子变换，不改素材文件、不从整图平移冒充骨骼动画。仍是刚性切片；没有网格、连续衣袖变形、眼嘴分层或音频同步。不要接入生产或批量扩展，先看实际静止/动态接缝是否达到用户要求。
