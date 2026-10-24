# 阳光小胡子动画候选

未激活生产，待发起者独立视觉review和用户逐人验收。本轮仅阳光小胡子，不继续其他人物。基于reviewed main `62b3846eecce8e902cd8bfe1764c87a337551e4b`；候选数据只依赖该版本已有v1播放器。

## 来源与装配

已实际查看canonical四态：深蓝短卷发/粗眉/小胡子、黄Polo与深蓝长裤；默认双手放下、聆听拢耳、等待交叉承托并点下巴、讲话掌心向上。保留各态眉眼表情，不重新设计角色。

5份1254×1254 RGBA PNG，20节点、4循环、无显式transition。4份canonical源PNG原字节复制，1份内置imagegen生成的无头无臂共享躯干。生成图与原输出hash相同，未裁切、抠像、改像素或重采样；只做运行时polygon mask/rig。`generation-records.json`保存唯一一次真实prompt/输入/输出，`provenance.json`保存四态源及全部parts的SHA256、尺寸、alpha范围和不透明边界。实际1次首轮生成，0次修复生成。

默认/聆听/讲话的生成中央躯干与canonical完整肩帽/袖臂在衣料内部留足重叠，不再把外肩/腋部当作两选区的对接边；生成袖筒不叠在裸臂前。普通袖臂直接使用canonical连续轮廓，讲话短袖与精确skin同speaking-root，避免手掌下缘夹带胸前衣片。等待完全隐藏generated torso：头、真实颈部、衣领/上胸/完整袖臂来自单一waiting-source、contact-root、identity配准，避免两套领子/皮肤轮廓；腰腹/整裤仍waiting-source但挂body-root，y860~890同源衣料重叠。四态头部共享装配但选对应原画表情，讲话在default闭嘴头与speaking开嘴头间互斥切换。

四态都有躯干上下4逻辑像素/约±0.4°，普通头约±1.5°，普通袖臂约±1.3°；聆听/托腮接触组约±0.9°和1.2像素；讲话袖臂约±2°。各通道幅度和反向节奏有差异，未只摆动整张静态立绘。等待上胸与头/手作为接触约束共同微动，不声称其能独立扭动；腰腹保持body-root呼吸，其余三态仍有独立头/肩臂通道。发起者已实际查看四态正负极值，不能把这一约束写成全关节独立动画。

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
- 制作代理IAB打开5355返回“Browser is not available: iab”，没有声称亲自浏览器通过。发起者实际复验四态实时播放和25%/75%正负极值：先发现肩角/腋部白缝、等待双领/色块和颈部楔洞，逐项修正后确认目前无明显裂缝、单套领子连续、腰腹接缝正常。发起者随后实际完成391正式组件四态（innerWidth=scrollWidth=391，四图完整，console为空），并reset释放viewport；截图与完整parent review由发起者追加。
- `python3 design/animation-candidates/sunny-moustache/check-coverage.py`仅为neutral pose肩/袖区域2px网格的只读alpha/原黑描边选区局部诊断，不计算世界变换/运动极值/最终叠色。有效同源区域增加零缺口断言；listening右侧324个alpha点、2047个黑描边点未匹配，speaking左侧14个alpha点未匹配，因这两侧共享default-source而诊断参照各态源图，保留真实计数，不记全coverage PASS。实际两极值与live以发起者图像复验为主证据，未为计数改已通过视觉。
- 未另做组件失败回退/暂停恢复/减少动态效果/换人卸载实测；这些仍是既有通用组件能力，不能借播放器单测冒称本候选浏览器通过。未运行全仓build，未接麦克风或真实供应商。素材自动自检与播放器单测不等于真实语音或美术验收。

## 当前局限

没有自然抬放transition，状态专用附件立即切换、数值通道由既有240ms settle衔接；无眨眼、网格变形、音量驱动或真实音素同步，讲话为合成开闭嘴。生成中央躯干按默认姿态重建，聆听被遮挡衣服褶皱可能略有差异；等待上胸与手采用接触组约束，局部独立活动较少。未用生成图替换头部身份。未获用户美术通过，不激活生产。

## 发起者最终复验记录

实际桌面/391/四态相反极值与原生截图见 `initiator-review.md`。候选源码 c891485 与实际复验JSON hash相同；仍待用户逐人视觉验收，未激活生产。
