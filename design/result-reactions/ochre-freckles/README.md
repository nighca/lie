# 赭黄雀斑 · 结果反应候选（待统一画面验收）

2026-10-25 / root/result_lane_one。依据用户批准的珊瑚加强版方向与“后续人物自行验收后常规本地集成、不逐个等用户”授权。基础 reviewed main 365269b6185be586b69c0fac2b7ba15defeb7a6f；本目录单独候选，正式 manifest 尚未激活。

## 已完成

两张原生新表情由内置 image_gen 从原 default-source.png 编辑，完整原生透明PNG输出保存 parts/accused-*-source.png，未进行栅格裁剪/修改。每张1254×1254 RGBA；完整提示词、输入、原始生成路径、alpha、原生SHA256见 generation-records.json。旧 PNG 全部按字节复用，头部通过原rig的 sprite.mask 提取新脸，注册固定、没有头部缩放。

正确：下垂眉眼、明显不对称尴尬嘴角，点头松肩。错误：挑眉、睁眼、疑问圆嘴，歪头小回弹并抬手。 抬手复用 speaking-arm / speaking-fill / speaking-cap 三个已验收独立部件，保留固定肩帽，旋转下臂段。结果状态始终隐藏旧 mouth-open 片，不做头大小变化；需特别看袖肘补片和脖颈。

新增2个隐藏的表情节点和2个非循环 clip（1.15秒 / 1.05秒）。动作只使用刚性旋转和平移；一次后保持末帧。原四态 clips/nodes/assets 与旧 parts 完整保持原结构/字节，原静态图未改。

## 数据检查与待验收项

Node24 `--experimental-transform-types design/result-reactions/ochre-freckles/check.mjs --source-only` 已通过，checks.json记录来源资源SHA与检查结果：正式v2 parser、原四态/节点/资源恒等、242个刚性采样、非循环终态保持、PNG文件头与原生尺寸。`--source-only` 明确跳过终态PNG文件校验。

**尚未导出两张结果静态PNG，尚未进行正式Canvas整体画面与中段接缝验收。** 此提交是 source-data-ready / pending-QA，不能当作视觉通过或正式游戏集成完成。按父协调指示，由父在现有5355同源样片读取本候选，使用 createCanvasRenderer 在clip.duration原生导出 accused-correctly.png / accused-wrongly.png，再看端点、中段、重播与停止保持，追加验收记录及截图。随后运行本目录 check.mjs（不带 --source-only）完成末帧PNG尺寸/hash检查。必要修订由新提交补充，已交付提交不重写。

## 服务协调

本角色未启动服务或新tab。此前lane sunny私有5356服务 PID57333 / 原PTY79237 已因图片专项优先turn立即 Ctrl-C 停止（exit130），lsof确认无listener，自己的tab1已关闭。未动5355、8787、8788或他人tab。后续只用父协调的5355验收，不自行开新端口。sunny较早README写“临时保留”是停止前快照，本段记录覆盖其当前服务状态，不修改已交付sunny提交。


## 发起者完成验收

2026-10-25 父专项已在既有5355实际看原始/正确/错误端点及55%动作中段，检查头颈与袖手接缝；两张终态由正式Canvas renderer原生导出，末帧像素一致通过。当前已自行验收，可交主协调常规本地集成，不再处于上文历史pending状态。parent-mid.jpg、parent-end.jpg与generation-records.json保存证据。正式游戏接入另由组合UI验证，不将此素材验收冒充App集成。
