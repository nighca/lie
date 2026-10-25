# 头部品牌下划线改版 · 待确认设计

2026-10-25；用户要求UI负责人出效果图确认：移除Logo右侧“语音推理”，把原红色手绘下划线放到LiE正下方。本稿是proposal，未获方向批准，不作为生产实施授权。主协调已向用户展示recommendation.png，等待确认。

## 推荐稿与来源

- recommendation.png：1280×1280可直接显示效果图；包含当前对比、推荐标记、桌面调查页头部与391px窄屏头部静态上下文。
- recommendation.svg：完整原生矢量设计板。
- brand-mark.svg：可复用推荐组合105×68；原Logo仍105×56，下划线96×9，x4.5/y52、旋转−5°，保留原path和配色，不重画Logo。
- desktop-context.svg / mobile-context.svg：独立上下文矢量源。窄屏沿原Logo88px宽，同一组合缩放为约88×57。
- preview.html：离线HTML/CSS响应式设计预览，内嵌相同矢量源，无网络/存储/行为。
- generate.py：从现有apps/web/public/brand/logo.svg和underline.svg生成设计源；source.json记录基线与资源身份。几何校验保证组合中的所有path/circle参数与原资源逐项相同。
- reference-current.png：用户提供的当前250×99品牌截图，原样归档。

下划线约为Logo框宽度91%，视觉上略宽于实际字形，保留左低右高的手绘收尾；贴近字形底部留轻微空隙。新增组合高度用于容纳下划线，字形自身大小与比例不变。桌面新增组合可放入现调查页标题约85px的头部内容高度；移动组合比原47px Logo框多约10px，正式实施后仍需验证实际头部高度/内容分配。

## 实际检查与限制

所有SVG XML可解析；canonical path/circle逐项一致；macOS QuickLook原生渲染SVG至PNG，最终1280×1280效果图已查看并调整一次，仅去掉上下文中多余的示意分隔线/说明文字。不是imagegen重画，不需外部字体；PNG没有裁改/拼接。HTML源可离线复用。

这是静态矢量排版的头部上下文，不是实际应用运行截图；没有执行浏览器路由、hover Logo动画、指针/键盘交互或设备安全区测试。未修改正式ProductHeader/App/style/资源，未启dev server/浏览器/新端口，未动8787/8788/5355或用户tab/草稿。仅design/header-logo-underline与配套docs提交，等待root审查归档和用户方向确认；未main/push/PR/部署。

原base2268f84f02576d4384f0d30f9f117a70164f135a；WT /Users/nighca/.codex/worktrees/background-character-names/lie，branch codex/header-logo-underline。源提交冻结后再启动下一项独立设计；本稿不会因为继续其他设计而默认批准。
