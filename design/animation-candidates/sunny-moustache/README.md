# 阳光小胡子动画候选

未激活生产，待发起者独立视觉review和用户逐人验收。本轮仅阳光小胡子，不继续其他人物。基于reviewed main `62b3846eecce8e902cd8bfe1764c87a337551e4b`；候选数据只依赖该版本已有v1播放器。

## 来源与装配

已实际查看canonical四态：深蓝短卷发/粗眉/小胡子、黄Polo与深蓝长裤；默认双手放下、聆听拢耳、等待交叉承托并点下巴、讲话掌心向上。保留各态眉眼表情，不重新设计角色。

5份1254×1254 RGBA PNG，19节点、4循环、无显式transition。4份canonical源PNG原字节复制，1份内置imagegen生成的无头无臂共享躯干。生成图与原输出hash相同，未裁切、抠像、改像素或重采样；只做运行时polygon mask/rig。`generation-records.json`保存唯一一次真实prompt/输入/输出，`provenance.json`保存四态源及全部parts的SHA256、尺寸、alpha范围和不透明边界。实际1次首轮生成，0次修复生成。

共享躯干排除生成袖片，普通袖臂直接使用canonical完整轮廓；生成袖筒不叠在裸臂前。聆听与托腮袖臂使用原图同源、同contact-root、identity配准，复杂交叉肘/手不拆成两套皮肤。上臂完整袖片在躯干后，托腮前臂手在前；讲话短袖与精确skin独立节点、同speaking-root，避免手掌下缘夹带胸前衣片。四态头部共享装配但选对应原画表情，讲话在default闭嘴头与speaking开嘴头间互斥切换。

四态都有躯干上下4逻辑像素/约±0.4°，普通头约±1.5°，普通袖臂约±1.3°；聆听/托腮接触组约±0.9°和1.2像素；讲话袖臂约±2°。各通道幅度和反向节奏有差异，未只摆动整张静态立绘。头颈/肩袖重叠与手掌轮廓尚须浏览器实看正负极值，不能仅据数值宣布接缝通过。

## 可复现预览

本工作树使用已锁定依赖及Node24.22.1：

```sh
npm run appearances:generate
./node_modules/.bin/vite --config spikes/animation-preview/vite.config.ts --port 5355
```

正式组件实时预览：
`http://127.0.0.1:5355/?appearance=sunny-moustache&src=/@fs/Users/nighca/.codex/worktrees/sunny-moustache-animation/lie/design/animation-candidates/sunny-moustache/package.json`

正式采样器/Canvas定相位页：
`http://127.0.0.1:5355/@fs/Users/nighca/.codex/worktrees/sunny-moustache-animation/lie/design/animation-candidates/sunny-moustache/qa.html`

定相位页可选四态及25%/75%极值，仅制作检查，不是编辑器。`python3 design/animation-candidates/sunny-moustache/build.py`可重复生成package，脚本不读写图像像素。

## 实际检查

- `node --experimental-transform-types design/animation-candidates/sunny-moustache/verify.mjs`通过：严格v1/像素预算；5份实际PNG签名/IHDR尺寸/hash/alpha记录；四态canonical源hash一致；960时刻有限transform/单头嘴/状态专属附件；4循环闭合；聆听托腮同源同父identity配准；100次settle未结束前再次中断的所有数值通道连续、每步数值有限及显隐立即符合目标采样。Node transform-types用于播放器parameter property，不修改引擎。
- 现有播放器`npm run test --workspace=@lie/appearance-animation`：33/33通过；`npm run typecheck --workspace=@lie/appearance-animation`通过。
- `npm run appearances:generate`成功，正常静态参考已在本worktree ignored public生成；未新增正式动画引用。原四态hash未变，未改播放器/UI/manifest/其他候选。
- IAB尝试打开5355返回“Browser is not available: iab”。没有实际看过候选实时播放、四态正负极值、391或组件失败回退/暂停恢复等视觉行为；不声称自动检查证明这些通过。需发起者从两个预览入口独立实际review，重点看头颈、肩袖、交叉臂接触、袖口椭圆、掌下衣片、遮挡和halo。没有调整共享viewport。
- 未运行全仓build，未接麦克风或真实供应商。素材自动自检与播放器单测不等于真实语音或美术验收。

## 当前局限

没有自然抬放transition，状态专用附件立即切换、数值通道由既有240ms settle衔接；无眨眼、网格变形、音量驱动或真实音素同步，讲话为合成开闭嘴。共享躯干按默认姿态重建，等待/聆听被遮挡衣服的褶皱可能与原图略有差异。未用生成图替换头部身份，但仍需实际确认头颈遮罩和所有极值轮廓。未获用户美术通过，不激活生产。
