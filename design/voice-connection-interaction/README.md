# 语音连接交互原生验收

2026-10-25，基于 reviewed main 7249a6f94106ce9fa7aaefdf640222f77ff70188。源码身份见 source-hashes.json；控制器已审 child commit 854dbcf40ddeba98620dee787bc0174dd6855db4 → 父分支 fc635b5。所有截图为真实 App/现有动画与 UI 的 IAB/CDP 原生 PNG，没有后处理或生成素材。

## 证据

- connecting-desktop.png / connecting-mobile.png：1280×878、391×844，连接中全局提示、取消入口，未收音且询问预算停在08:00。
- switching-to-chen.png：原沈禾对话开启后连续选择顾遥、陈拓，目标陈拓正在准备；旧连接迟到文本不进入记录。
- connected-desktop.png：最后目标收音就绪，全局提示消失、结束对话按钮与静止玩家波形出现。
- connection-failed-mobile.png：新目标失败，提示退出，保留手动开启入口，不自动循环重试。
- browser-checks.json：准备、成功、取消迟到、快速切人、失败、背景关闭后的实际 DOM 记录。桌面活跃后结束并切人预算为07:37，没有补时。

截图前仅把临时验收容器中的对应 iframe 放在原点，隐藏 fixture 自带控制区；不修改应用 DOM、不改全局 viewport。控制按钮只控制本地替身的 open Promise，就绪不等于真实硬件/供应商成功。人物实际动画、App及控制器为生产源文件。

## 重放

将 qa-entry.html / qa-entry.ts 复制为 apps/web/__voice_connection_qa.html / __voice_connection_qa.ts，执行仓库资源生成，按服务所有权使用5507运行Vite apps/web，打开 /__voice_connection_qa.html。不要提交/发布复制出的临时入口。按钮“模拟收音就绪/失败/旧连接迟到”仅为离线验收；演示代理不访问 status/channel/microphone，不读任何凭据。每 iframe 的 view 仍由真实 controller 驱动。

## 运行记录与限制

5507 单服务：owner 调查视觉 chat 01a16d5c-de69-7452-8d6a-280d15a87e9e；worktree background-character-names/lie（本次已切独立 codex/voice-connection-interaction，原分支refs保留）；source 为 controller fc635b5 加 source-hashes 最终UI；PID50346、原PTY39627。消费者仅自建IAB39；完成后原PTY Ctrl-C exit1，lsof核无监听。tab39关闭，临时HTML/TS删除；无viewport/network/cache/media override。8787/8788/5544及其他服务/标签未改。

浏览器末尾存在一次无URL的 MutationObserver.observe 非Node错误，与早期IAB回合相同文本，但来源未定，不能声称console零错误或归因应用/工具。页面交互与检查结果记录如实。背景弹窗打开时其原生 inert 阻止 fixture 控件输入；先正常关闭背景，再触发迟到就绪，确认仍不重连，没有绕过模态约束。

准备期真实麦克风/播放/通道边界另由 voice-capture-readiness.test.ts 调用实际 createLiveVoicePort + controller、延迟mic替身验证；不开真实麦克风、不调用真实付费服务。硬件关闭时延、真实供应商连通和移动设备软件键盘/安全区未实测。
