# 顾遥原画动画第二轮

用户已授权继续同一coral-bob打磨：待机更明显、聆听手靠耳、讲话动嘴；效果满意后再扩其他人物。本轮仍为独立研究，不接正式UI，不做其他七人。

- [可观看关节动画](../../spikes/coral-layered-animation-v2/index.html)
- [完整制作/来源/验收与局限](../../docs/coral-layered-animation-v2.md)
- [聆听对比](previews/listening-desktop.jpg)、[讲话对比](previews/speaking-desktop.jpg)
- [嘴闭合](previews/mouth-closed.jpg)、[嘴打开](previews/mouth-open.jpg)
- [待机0秒](previews/idle-phase-a.jpg)、[待机6秒](previews/idle-phase-b.jpg)
- [窄屏聆听](previews/listening-mobile.jpg)、[窄屏讲话](previews/speaking-mobile.jpg)

内置imagegen实际7次：6个新层+一次说话前臂alpha清理尝试，清理未明显改善，因此保留两原始输出，不再无界重生。PNG只复制未脚本编辑，完整实际prompt在`prompts/`，`sources.json`含原路径/参考/hash/尺寸/alpha。第一轮8次来源仍在原目录，不重复计入本轮。

在仓库根运行`python3 -m http.server 5345 --bind 127.0.0.1`，打开`http://127.0.0.1:5345/spikes/coral-layered-animation-v2/`。无麦克风、音频播放、外部CDN或WS；开口为合成时序，不是中文音素/真实语音同步。等待姿态未完整还原静态托腮参考，不能称四态都已生产就绪。
