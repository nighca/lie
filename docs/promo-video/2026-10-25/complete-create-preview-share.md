# 完整创作、试玩与分享录像

2026-10-25；已制作，待用户审看片段。当前交付为 `media/promo-video/lie-create-preview-share.mp4`，替代前三部预览。用户认可 Chrome 录制与指针效果，并明确要求重新录完整流程和允许删除此前视频；随后再次明确确认清除上一轮生成的生日蛋糕演示草稿。

## 本次范围与实际流程

全部重新录制，没有拼入前三版画面：线上首页 → 空白编辑器 → 演示案件《谁藏起了生日蛋糕？》 → 两位人物/预设/答案 → 真相结局 → 试玩接案/进入调查 → 结束本局/确认结束 → 返回编辑器 → 生成分享链接 → 实际复制（已复制反馈） → 新 Chrome 标签页打开同一生成链接 → 接案/进入调查。作者试玩与接收方均停在开启语音之前，没有麦克风、provider对话或假语音。

录制前实际清除旧演示草稿，UI检查空白表单，清除过程不进入视频；新草稿保留。作者tab1910329666、接收方tab1910329669均为自建；接收方是同一个Chrome浏览器的新页面，不冒充另一台设备或陌生真人。新页面独立从 `/play#game=…` 加载故事，最终页面URL与生成链接逐字匹配（1349字符）。没有向他人发送消息、投稿、公开上传或发布视频。

选定稳定产品基线为发布5a9a31c26b1e8f7be57b4147c2886b785b052111。线上实际加载脚本 `/assets/index-CRRGYc8t.js` 与仓库该发布记录对应；没有重新核全套线上资源hash，也没有采用头部等尚未批准提案。

## 输出与检查

73.400000秒，3751699 bytes，1280×800、30fps，H.264/yuv420p、color_range=tv，无音轨/片头/音乐。3070张正式采集帧分八段顺序衔接，仅去除工具等待；保留实际页面滚动和点击，不加速操作、不将它作为真实语音延迟证明。箭头与650ms点击圆环为临时录像提示层，不是产品UI或OS指针采集。

- 每段所有采集帧metadata均核deviceWidth1280/deviceHeight800/pageScaleFactor1；ffprobe输出格式与全片解码到null通过。
- 首帧实际为首页；每5秒接触表已目视包含空白创作、人物、结局、试玩、退出、分享弹窗、已复制、接收方接案与调查。未见凭据、账号或个人通知；没有逐帧人工审片，最终节奏仍待用户评价。接触表最后黑格为tile空位，不是成片黑帧。
- 页面验看图为JPEG：complete-blank-editor.jpg、complete-share-link.jpg、complete-receiver-game.jpg；接触表complete-contact-sheet.jpg。所有文件位于media/promo-video。
- 本次未运行应用测试/构建。只检查实际操作、媒体与文档，不扩大为跨设备/跨浏览器分享、真实AI质量或盲测验收。

## 制作工程与失败备选

原始帧/frames.json/segment.json/FFconcat/segments.json已从临时目录保存到持久素材库：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/complete-create-preview-share-take01`

本目录complete-metadata.json记录实际probe/sha256/身份与时长；complete-demo-case.json是从实际分享链接解压的虚构演示内容，不纳入官方案例；complete-share-link.txt保存实际链接。rebuild-complete.py以素材根目录为输入，验证八段采集画幅、根据原时间戳及段末结束时间生成FFconcat，并用现有Python标准库和FFmpeg8.0编码；没有游戏依赖变更：

```sh
python3 rebuild-complete.py /absolute/path/to/complete-create-preview-share-take01
```

capture-recorder.js保存本次在cua_repl中实际使用的工厂函数，依赖该环境的fs/nodeRepl；pointer源复用recording-pointer.js。不作为独立Node可直接执行程序。

接收方首次新tab未继承viewport覆盖；后续resize/reload与采集中截图也出现不一致metadata。检查发现后拒绝相关片段，单tab显式锁定Emulation尺寸、将截图移出采集时间窗，分别重录复制链接与接收方部分，最终八段全量metadata通过。原因尚未进一步隔离，不断言某单一API已证明是根因。素材库rejected-*保留未采用试段，不参与合成。曾尝试从字符串eval加载录制工厂，执行环境拒绝，随后直接声明函数；无外部代码执行或产品改动。

## 旧版与收尾

用户允许删除旧视频；本批从当前交付目录移除 lie-editor-creation-preview.mp4、chrome-pointer-preview.mp4、lie-home-create-game.mp4，旧制作记录/验看图与Git历史保留，旧原始帧素材库仍供既有归档复核，不做广泛文件清理或历史改写。旧文档的同名视频记录现在表示历史产物，当前交付以本稿为准。

全部Page采集已停止，两专用tab提示层/监听移除，Emulation override清除、viewport reset，两tab关闭，新生日演示草稿保留。没有服务/端口/PTY启动，没有动8787/8788/5355或他人tab/WT/refs。原任务base5a9a31c，当前追加base e3d3dc4441c8cf8f776af04157b92515532ae2cb；已交提交immutable，main/push/部署仍由root唯一集成人负责。
