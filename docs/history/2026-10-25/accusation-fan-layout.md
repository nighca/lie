# 多人物指认扇形布局

用户明确建议指认弹窗沿案件介绍采用扇形人物卡、hover上移后点击具体角色。主协调在夜间常规视觉实施授权内分配本专项，从reviewed main `31db7c9f3d4f1224612d1017b37ef27520651fd3` 实施。没有更改玩法、结果页、controller、人物资源、首页、intro时长或共享组件。

## 改动

- 复用已有intro扇形容器、按人数计算的fanStyle及多人物网格；1—5人物桌面轻叠，hover和focus-visible升起置顶。较多人物、窄屏、无hover设备采用网格，实际人数来自内容，不写死三人或四人。
- 整卡为原生button，type=button、aria-label为“指认 姓名”，可见动作文字保持“指认 姓名”；点击任意卡片区域或键盘激活都只调用既有controller.accuse(character.id)。hover或聚焦不会提交。
- 移除旧200px头像+独立大按钮及移动一行一张的冗余布局。窄屏四人两列，更多人物按需在原生dialog内滚动，返回/关闭操作保持。
- 浏览器实测单人网格会把头像拉宽而裁脸，遂局部限制卡片width:min(100%,180px)、grid居中；四人仍随网格收缩。姓名可自然断行。
- 现有流程测试改为尊重按钮aria-label；介绍页断言限定main，避免把closed dialog中复用的intro-card class也当介绍内容。新增1/4/7人可访问选项及仅激活才提交的行为检查。

## 检查和证据

- Node24.22.1：Web179项通过，Web类型检查、生产构建及8形象/60资源检查通过，最终width修复后重新运行同套检查。
- 独立IAB5507：duck-finale四人桌面1280×878，dialog660×542.586，clientHeight/scrollHeight539/539，四张卡均在同一扇形行并完整位于dialog内。实际原生mouseMoved hover得z-index2；键盘Tab得focus-visible/3px outline/z2，均未提交。返回取消保留调查，重新打开正常。
- 391×844四人两列，卡片各148.5px，dialog clientHeight/scrollHeight609/609且横向349/349。375×667仍能完整显示四人和返回按钮；键盘ShiftTab触达周乐，Enter错误指认后进入失败终局，不显示完整经过。
- 临时七人fixture：桌面4列每列132px、7个按钮；391两列、dialog clientHeight792/scrollHeight944，键盘聚焦最后一人后scrollTop152，卡片bottom706.469在dialog bottom820之内，Enter激活指定第七人进入正确结果。
- 临时单人fixture：修复前卡309px/头像305px且裁脸；最终391时卡180px/头像176px，头像完整，整卡点击正确提交；随后四人窄回归仍各148.5px/无溢出。单人/七人临时JSON已删除，不作为正式案件提交。
- browser warn/error均[]，没有启动麦克风、模拟会话或供应商。真实触屏硬件未测；窄屏grid已实际验证，无hover样式沿既有shared media规则，不把它称为真机触摸验收。
- 最终viewport已reset，全部自建tab30/31/32关闭，未触碰用户tab；5507/session81667候选服务保留。先前自有5505/session40547已停止并确认无监听。
- 截图目录`/private/tmp/lie-accusation-fan/`：desktop.png、focus-desktop.png、mobile-final.png、short-mobile.png、many-desktop.png、many-mobile.png、single-before.png、single-after.png。

原生浏览器第一轮调用曾长时间等待工具返回，返回wall_time22713秒，原因不可见；未重复、绕过或重发审批动作。恢复后仅按实际已返回结果认定桌面部分，独立补测所有上述窄/短/多人物结果，不把等待期间当成已验。

## 交付

工作树`/Users/nighca/.codex/worktrees/accusation-fan-layout/lie`，分支`codex/accusation-fan-layout`，原base如上。无额外commit依赖；root应在最新main组合review并保留期间已集成的controller result投影，不覆盖整个App。root唯一review/集成/发布；本专项未修改main或push，不把专项自验写为用户已批准最终新排版。

当前计划状态建议：多人物指认扇形、整卡激活与窄屏触达实现/独立验收完成，待rootreview集成。结果页展示被指认者及两态动画仍是独立后续项，未合并进本弹窗。
