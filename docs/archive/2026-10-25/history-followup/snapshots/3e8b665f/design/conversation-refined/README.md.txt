# A 人物舞台：去冗余执行稿

用户倾向 A，并明确删除不影响理解的说明文字。本目录是对应实施规格的静态稿，**不是新增候选方向或实际语音应用**。开发契约见 [对话页设计规格](../../docs/conversation-design-spec.md)，图像只引用正式 logo 和三位既有默认形象，未启用四态 v2。

打开 [状态索引](index.html)。桌面画板1280×720；390px采用纵向流，分上下实际视口截图。对白为无剧透假数据，语音、连接与错误为固定展示状态，按钮没有业务动作。

| 状态 | 可查看 HTML | 本地截图 |
| --- | --- | --- |
| 初始空会话 | [empty.html](empty.html) | [桌面](screens/desktop-empty.jpg) |
| 正在聆听 | [active.html](active.html) | [桌面](screens/desktop-active.jpg)、[390上部](screens/mobile-active-top.jpg)、[390控制区](screens/mobile-active-controls.jpg) |
| 正在连接 | [connecting.html](connecting.html) | [桌面](screens/desktop-connecting.jpg) |
| 连接异常 | [error.html](error.html) | [桌面](screens/desktop-error.jpg)、[390恢复区](screens/mobile-error-controls.jpg) |
| 长转写列表 | [long.html](long.html) | [桌面](screens/desktop-long.jpg) |

## 重建与边界

`python3 design/conversation-refined/build.py` 从固定样例写出五份 HTML，`refined.css` 是共同原生样式。可从仓库根目录以静态 HTTP 服务打开。本轮未修改 App、业务投影、声音协议或公共组件；实施负责人可以保留真实业务所需的错误/恢复文案及可访问性。静态30px消息头像只用于视觉密度示意，不要求推翻已有公共50px头像规范。

必要文案保留人物名、消息发言人、“对话转写”、真实语音状态、动态剩余时间、操作标签；删除阶段副标题、回看说明、只读胶囊与页底常识。总额度仍在接案说明，这里不硬编码通用 `/08:00` 后缀。“对方回答时，可直接开口打断”只在适合的真实语音状态出现。失联与 EA02 等具体错误以实现语义为准，静态错误只是可读布局样例。

## 实际验收

内置浏览器逐页查看五个桌面状态和390px布局，全部图片加载完成；脸部/头发完整、头像不变、按钮和剩余时间可见。桌面页面实际1280×720，无横向溢出，语音区无内容溢出；长列表独立滚动，首屏定位末条（示例脚本，不替代运行时滚底逻辑）。窄屏五状态均实测整页宽390、肖像220px、转写卡380px，语音区无横向溢出，长列表定位末条。截图实际JPEG：桌面1280×720、移动390×720。

IAB超出宿主视口的窄屏fullPage导出曾出现空白/重复合成，因此最终只保留真实390×720视口上下两段截图，没有脚本拼接或位图编辑。临时设备尺寸已恢复。静态设计无实际服务调用，故未把这些画面描述为实时语音验收。
