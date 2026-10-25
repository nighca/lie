# PC 调查立绘下移

2026-10-25，用户直接反馈大立绘下姓名移除后底部像空了一块，希望立绘往下移些。经主协调确认此scope，基于已审main b3f9bf69029cb04aa0c21c58080192ee53f71b2a 独立分支 codex/investigation-portrait-position。

只新增 min-width:1151px 桌面并排布局 CSS：.game-shell--investigating .portrait-backdrop :is(img, canvas) 的 top:32px。人物本体下移、光晕与舞台边界不动；动画Canvas及静态img定位一致。移动/原中宽堆叠布局不改，App/controller/动画组件与素材/Editor/result-actions不改。空白变紧凑，保留原舞台overflow裁剪规则；较矮窗口仍按原规则裁切下半身，未扩大舞台或修改缩放。

## 实际验收

- before-desktop.png / after-desktop.png：1280×878原生前后对照；正常默认沈禾，未开启对话。
- after-short-desktop.png：1280×720较矮窗口，头部与操作栏保持可见。
- after-gu.png / after-chen.png：切换顾遥/陈拓并等待各自canvas可见后捕获；不会把加载空白当成最终结果。顾遥图受原生键盘聚焦滚动影响有少量页面纵向偏移，未重绘/拼接。
- mobile-unchanged.png：391×844；before.json / after.json证明top仍0px，桌面均0→32px，舞台边界尺寸不变，全无横向溢出。
- qa-entry.html：复制到apps/web/__portrait_position_qa.html即可在既定5507重放，实际应用 /?game=empty-medal-box&demo=1。无需真实麦克风/供应商/keys。

PNG均IAB41/CDP原生截图，未图像后处理；截图仅逐个显示临时iframe容器，不改AppDOM、不改全局viewport。所有最终截图已逐张查看。初次顾遥截图发生在动画pending阶段，后等待canvas可见重新捕获覆盖临时文件，归档为最终加载完成图。静态fallback与canvas共用同一CSS选择器，未另强制真实网络失败以截图。

这是纯位置CSS，运行实际浏览器对照和git diff --check，不重复无关全suite/type/build。源码hash见source.json。

## 服务与交付

owner调查视觉chat 01a16d5c-de69-7452-8d6a-280d15a87e9e；WT background-character-names/lie 已切新branch；唯一5507启动前核空闲，PID8323/原PTY85340，source b3f9bf6+此CSS，消费者IAB41。完成原PTY Ctrl-C exit1，后lsof核无监听，tab41关，临时HTML删。无viewport/network/cache/media overrides，8787/8788/5544和其他服务/标签未动。保留所有旧refs，不main/push/PR/deploy；提交交唯一root实际review/候选串行集成。
