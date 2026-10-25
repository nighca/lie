# 调查页外层高度修复：原生测量与证据

2026-10-25，基线0621804a86806507878e4b3233268645d1481fbb（生产同483），独立branch codex/investigation-viewport-height，WT /Users/nighca/.codex/worktrees/background-character-names/lie。旧loading/preview来源冻结，未夹入/重放；本轮只改style.css调查布局，App/Application/路由tests/共享ProductHeader均未修改。

## 实测根因

before.json：1280×878中shell padding上下48px、header84.765625px、margin-bottom20px、main由calc(100dvh -132px)固定为746px，总计898.765625px，document.scrollHeight899，比窗口878多21。1289×878 header85.125同样多21；长标题header134.390625，总页948，超出70。固定132只预留64px header，实际内容高于64。

## 修复与边界

851px以上调查shell改纵向flex、height100dvh/min-height:min-content，header不收缩，main flex1/height:auto，现有480px最低调查内容高度保留。实际header/间距/padding共同分配空间，不减固定20、不设全局overflow:hidden。正常页填满视口，内容不足空间时按最低可用内容自然增长/滚动。

移动原shell锁高overflow:hidden在391×430把log压到4px。改min-height:min-content/overflow:visible，调查区最低360px（168人物+12gap+180记录面板）；短窄屏最低326px（136+10+180）。正常391×844不变；极短屏允许必要外层滚动，底栏仍fixed，底部132px+安全区padding保留，内容可滚至底栏上方。

## 矩阵与证据

| CSS视口/场景 | 修复前docHeight | 修复后docHeight | 结果 |
|---|---:|---:|---|
|1280×878|899|878|无多余外层滚动|
|1289×878|899|878|小数header高度也适配|
|1280×720|741|720|操作栏底部696，留24px|
|391×844|844|844|正常窄屏保持|
|1280×878长标题/四人物|948|878|动态页头正确分配|
|853×585长标题|730|730|保留必要滚动，内容/操作可达|
|1280×480|633|633|保留480px main，必要滚动可达|
|391×430|430/log4px|572/log110px|允许滚动查看记录|
|391×844长标题/四人物|未取旧值|844|列表内部scroll32px选择第四人|

853×585是约150%桌面缩放后的等效CSS布局视口，不是实际修改浏览器原生zoom；本轮没改用户全局缩放/DPR/viewport。不能宣称跨设备/真实软件键盘/非零安全区硬件验证。

- after-empty.json / long-transcripts.json / internal-scroll.json：每帧48条真实controller离线转写，log内容5086或6391px，client110—472px，维持内部滚动，document高度不随长记录增加。
- notice.json / dialog.json：1289×878与391×844真实连接notice、背景modal开关均不增doc高度；其他矩阵亦测于connecting/background-open阶段，不重复归档大段相同JSON。
- reachability.json：缩放等效视口列表scrollTop56，实际选择第四人；矮桌面操作栏滚至viewport455.8以内，保留24px底隙。该文件short-mobile是初次键盘End仅滚2px的状态，不冒充已到底。
- short-mobile-natural-scroll.json：IAB46实际鼠标滚动到scrollY142=max，log bottom284、底栏top312，记录区确可到达。short-mobile-at-bottom.png为这一最终状态。
- long-mobile.json：IAB47长标题四人物header140px，doc844，列表scrollTop32后第四人已选。
- assertions.json：从上述原生DOM测量检查正常视口吻合、长记录内部滚动、notice/modal无额外高度、短窄屏滚动可达。
- 六张原生PNG已逐张查看，无图像后处理。desktop-long-log / short-desktop / long-title-four / connecting-no-outer-scroll / short-mobile-at-bottom / long-mobile。只逐帧显示临时iframe与隐藏fixture工具按钮，不改应用DOM或globalviewport。

本轮纯CSS：Vite HMR/实际布局解析、矩阵与DOM断言、git diff --check通过；无新镜像样式tests，不重跑无关全suite/types/build。固定notice是基线实际组件，loading新图标和preview另批由root审查，不回退它们。临时四人物和离线文字只在fixture内，无新官方内容，无mic/provider/keys或用户draft读写。

## 重放与清理

qa-entry.html / qa-entry.ts复制为apps/web/__investigation_height_qa.html/.ts，既定5507下打开主入口；?single=long-mobile可只跑最后窄屏场景。正常进入调查后，fixture的准备就绪/填入长对话驱动实际controller。

owner调查视觉chat01a16d5c-de69-7452-8d6a-280d15a87e9e；唯一5507启动前核空闲，PID29602/原PTY38417，source0621804+本CSS；消费者自建IAB45/46/47。完成原PTY Ctrl-C exit1，核无监听；三个tab均关闭，两临时文件已删除，重放副本只在design归档。未用media/network/cache/globalviewport覆盖，8787/8788/其他服务/标签不动。旧refs保留，不main/PR/push/deploy。

完整clean handoff后释放全局style布局写turn给root串行调度；Editor删除旧背景规则由root独立候选进行，本任务不碰该规则。App/Application自始释放给标题，未抢写。最终source身份见source.json。
