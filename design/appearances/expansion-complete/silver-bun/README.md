# silver-bun：默认修订与后续状态素材

用户要求新增五套中的一套调整为亚洲形象，其余四套默认保持。此处将既有 silver-bun 的原创美术设定明确为东亚年长女性，保留盘发、耳饰、原衣服、圆润体型与放松姿势；不在系统中根据视觉推断种族，不绑定剧情身份或性格。

当前只完成默认修订，待 root 目检后才以此为身份输入制作三态。尚未覆盖既有 `design/appearances/assets/silver-bun.png`、公共 manifest 或运行时。

## 默认来源

2026-10-24，先实际查看原图，再调用内置 `image_gen.imagegen` 引用编辑一次，`transparent_background: true`。原输入 `/private/tmp/lie-appearance-assets/design/appearances/assets/silver-bun.png`；完整实际 prompt 在 `prompts/default.txt`。输出原样复制到 `assets/default.png`，原始来源为：

`/Users/nighca/.codex/generated_images/01a16847-d9d7-7520-b05b-68e81fdf240e/exec-ab19557b-27d2-4c66-806a-8785a22d3096.png`

未脚本裁切、抠图、调色或缩放，没有重试或额外变体；五人完整化批次额度已使用 1/16，剩余五人各三态待按排期执行。

## 实际 QA

输出逐张 view：发髻/脸/手完整，服装与体型保持；修改集中在眼睑和眼鼻比例，面部细节较旧稿更丰富，需 root 评估与整套卡通风格是否协调。实际 PNG1254×1254、RGBA、alpha0–255，alpha>32包围盒 `(279,20,1025,1254)`。保留原画幅与头顶位置，没有文化服装、旗帜、道具或夸张族裔符号。素材尚未用于游戏或角色状态映射，不宣称已获最终验收。
