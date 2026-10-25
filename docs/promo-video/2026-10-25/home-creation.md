# Chrome 从首页创作完整录像

> 历史预览：用户于2026-10-25要求重录完整流程并允许删除旧视频；本稿对应MP4已从当前交付目录移除，制作记录与Git历史保留。现行成片见[完整创作、试玩与分享](complete-create-preview-share.md)。

2026-10-25；已制作，待用户审看。用户认可 Chrome 对比样片，要求清掉本地草稿再从首页重录；随后对《空盒里的纪念章》不可撤销清除给予再次明确确认。确认后实际点击“确认清除”，UI 显示空字段、仅一位空人物，随后返回首页。清除过程不进入视频，成片从线上首页起始。

## 实际内容

首页“创作案件” → 空白编辑器 → 演示案件《谁藏起了生日蛋糕？》的标题、简介、公共背景和8分钟额度 → 小夏的人物设定/薄荷双丸子 → 添加阿哲/人物设定/设为答案/赭黄雀斑 → 完整经过 → 试玩接案 → 进入调查页。最后停在“开启对话”之前，未请求麦克风或调用真实 provider；新演示草稿由产品自动保存并保留，没有投稿或公开分享。本文不对该演示案件的模型行为、盲测质量作验收结论。

录制使用用户 Chrome 自建 tab 1910329662，入口 https://lie.agency/，实际视口1280×800、DPR1、100%缩放。所选稳定产品为第四案发布5a9a31c26b1e8f7be57b4147c2886b785b052111：录制前后实际加载脚本均为 `/assets/index-CRRGYc8t.js`，与该版本仓库发布证据一致。本次核对页面已加载 URL，没有重新下载整套构建核验哈希。正式头部保持现行版本，未采用尚未批准的视觉提案。

使用真实页面采集和实际控件输入。录制提示层复用获用户认可的白色深边箭头/650ms点击圆环，400ms过渡跟随真实鼠标输入；不是产品功能或 OS 指针录制。长段文案直接填入控件，没有伪造逐字输入。四个顺序录制段在相同界面状态衔接，去掉工具调用间停顿；没有对实际操作加速，也不作为真实语音延迟证据。必要的原生页面滚动保留。

## 产物与核验

- 视频：../../../media/promo-video/lie-home-create-game.mp4，56.333333秒，2668777 bytes，1280×800，30fps，H.264，实际 `pix_fmt=yuv420p`、`color_range=tv`，无音轨。相较旧样片，本次显式把JPEG full-range转换为limited-range并标记tv；旧视频保持原字节和full-range说明。
- 空白编辑器、最终调查页与每5秒接触表：同目录 `home-create-blank-editor.jpg`、`home-create-final-screen.jpg`、`home-create-contact-sheet.jpg`；页面截图实际为JPEG/1280×800。
- ffprobe核验参数；FFmpeg全片解码到null无错误；接触表目视确认首页、空白表单、两人物、选形象、结局、进入调查，箭头可见，未见凭据/账号/个人通知。未进行逐帧人工审片，完整时长/节奏仍供用户评审。接触表最后一格黑色为tile空位，不是视频黑帧。
- 录制前已获用户对清除旧草稿的明确确认，旧数据没有另行复制、上传或入库。留存的原始录像仅包含本次虚构示例与公开产品画面。

## 素材与重建

原始帧、每段frames.json/segment.json、recording.ffconcat与segments.json已持久保存于：

`/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/home-create-game-take01`

本目录 `rebuild-home-creation.py` 根据传入素材根目录重建FFconcat并编码，使用每帧原始时间戳和每段实际结束时间保留静止尾帧；FFconcat每图的framerate=1000提升时间精度，最终统一30fps。输入路径不写死到临时目录，可在任意路径复现：

```sh
python3 rebuild-home-creation.py /absolute/path/to/home-create-game-take01
```

依赖为现有Python标准库与FFmpeg8.0，不向游戏引入制作依赖。`recording-pointer.js`保存录像提示层源码，由录制owner在自建页通过CDP临时注入。实际视口、线上脚本、片段时长、编码probe和视频SHA256记录于 `home-creation-metadata.json`。

录制已停止，提示层/监听已移除，viewport reset，自建Chrome tab已关闭；新生日蛋糕草稿保留供后续分享录像。无本地服务/端口/PTY启动；8787/8788/5355与其他owner标签页、WT/refs均未操作。本批只有制作文档、脚本与成片附件，未修改应用代码、主线、账号权限或部署，未push。原base为5a9a31c26b1e8f7be57b4147c2886b785b052111；在最小格式更正c63360b之后追加，所有已交提交不变，由root审查集成。
