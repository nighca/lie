# 五套形象完整化素材交付

用户认可新增五形象，并要求其中一套改为亚洲形象，其余默认保留，补齐后可供游戏引用。本目录交付美术源资源；正式注册、音色与游戏引用由运行时 owner 后续接入，本目录没有修改运行时。

先看 [五人索引图](overview.jpg)、[可点击预览索引](index.html)。每套 `assets/` 均含 `default.png`、`listening.png`、`waiting.png`、`speaking.png`；头像可共享默认图由 CSS 裁切。默认是静态回退；三态依据真实公开对话活动映射，不绑定罪责、秘密、可信度或推测情绪。

| 稳定 appearance ID | 资源与四态对比 | 主题色沿原catalog | 默认来源 |
| --- | --- | --- | --- |
| silver-bun | [银发盘发](silver-bun/README.md)、[对比图](silver-bun/preview.jpg) | #78DDD7 | 用户指定东亚年长女性方向，一次编辑后 root 目检接受 |
| salt-pepper-beard | [花白胡须](salt-pepper-beard/README.md)、[对比图](salt-pepper-beard/preview.jpg) | #FF665B | 原默认逐字节保留 |
| plum-crop | [紫色短卷](plum-crop/README.md)、[对比图](plum-crop/preview.jpg) | #AFA0F5 | 原默认逐字节保留 |
| mint-puffs | [薄荷双丸子](mint-puffs/README.md)、[对比图](mint-puffs/preview.jpg) | #78DDD7 | 沿候选catalog引用的 mint-puffs-v2.png，逐字节保留 |
| ochre-freckles | [暖黄雀斑](ochre-freckles/README.md)、[对比图](ochre-freckles/preview.jpg) | #FFCF43 | 原默认逐字节保留 |

## 生成与原始来源

使用内置 `image_gen.imagegen`，不是 CLI。严格共16次：silver默认一次（先供root review），随后五人各三态各一次，全部成功，没有追加或重试候选。20张PNG包括4张原默认复制、1张默认修订、15张新增状态；全部1254×1254 RGBA，alpha0–255，原样复制保留透明度，没有脚本抠图、裁图、缩放或调色。

每套 `sources.json` 逐文件记录真实输出路径；`prompts/` 保存完整实际 prompts，共16个。原图均先实际查看；每一态独立引用最终默认，不沿某张生成态继续重绘。四套未修改默认的对应原图可通过来源路径逐字节核验。silver保留旧正式资源，本目录新默认就是root已review版本。

## 视觉与边界检查

20张图均逐张实际看过，并在内置浏览器逐套查看四态及面部近看；同组衣服、脸型、发型、体型保持，聆听靠耳、等待托下巴/支肘、讲话胸前小掌心手势可辨。整体深蓝轮廓/扁平色块与顾遥v2一致；年长与青少年保持原年龄/体型差异。头发和活动手完整，未见明显额外手掌或多肢；卡通手指含自然遮挡，不声称精确写实解剖。

状态编辑不是逐像素锁定。逐套README列出alpha>32包围盒：不要按每图包围盒自动居中/缩放；同一套应统一方形画布尺度、top对齐、contain限制，正式接入时仍需在A舞台检查不同状态与屏幕的手势/裁切/切换。静态图不是动画、没有口型同步，也不把视觉姿势作为推理线索。

预览仅原生HTML/CSS组合；`build-previews.py`可从已保存资源与sources重建五套HTML/README。JPEG由内置浏览器导出，实际每套1440×915，索引1280×618；只进行浏览器画板取景，未脚本修改PNG或JPEG像素。素材路径与HTML引用检查、格式/透明度、四套default一致性、prompt数量及diff检查通过。未运行应用测试，因为本批没有应用代码/协议变动，不能把静态预览当真实语音验证。

文件所有权仅本目录；正式manifest、public资源、声音配置、游戏内容、项目计划均保持。未制作新第六人、头像选择器、3D、动画框架或宣传视频。
