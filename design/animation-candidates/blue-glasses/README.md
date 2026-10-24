# 蓝衣眼镜动画候选

2026-10-24，未激活生产。首版完成发起者review后，用户反馈微动偏小及袖口白弧遮臂；本次纯数据修订待发起者刷新5351实际复验，再交用户验收。使用内置imagegen，共3次首轮调用，0次额外修复调用；真实prompts、参考图和保留的原生输出见`generation-records.json`。所有PNG均原字节复制；没有脚本改像素、抠图或缩放导出。

## 形象与部件

来源为canonical蓝衣眼镜四态：深蓝卷发、圆黑框眼镜、白T恤、亮蓝背带工装。default双臂放下；listening手拢耳边；waiting一手点下巴、另一臂承托；speaking张嘴并掌心朝上解释。原四态完全未改。

6份活动1254×1254 RGBA共享PNG、19节点（另保留1份未使用的原生生成臂作制作来源记录）、4循环。生成共享无臂躯干、托腮姿态无臂躯干及完整交叉手臂接触组；其余头部、普通臂、靠耳臂和讲话臂从原生源PNG按运行时多边形遮罩取样。闭嘴头供四态共享，讲话开嘴头与闭嘴头用显隐互斥切换。未把整张静态人物只做缩放冒充部件动画。

托腮和靠耳手与头同属contact-root；头颈留有遮挡重叠。用户指出首版微动偏小及白袖弧线盖臂后，本次纯数据修订：躯干上下4逻辑像素/约±0.4°；等待聆听接触组约±0.9°/1.2像素；普通头约±1.5°/1.5像素；普通完整袖臂约±1.3°；讲话袖臂约±2°。头、身体、左右臂存在不同幅度/偏移/相位。普通臂枢轴上移至肩部，袖臂一起微动；等待前后两层仍复用同一接触组PNG。

首版生成的完整袖筒内部为不透明灰白椭圆，前盖在裸臂上造成附加白弧线，用户截图已实际阅读确认。修订将生成躯干的两袖区域排除，普通/讲话采用canonical完整袖臂，聆听保留canonical靠耳袖臂，托腮也改为canonical完整袖臂接触组，放弃生成臂与原画袖片拼接。没有把所有裸臂简单提到顶层，也没有生成新PNG。讲话进一步分成同canonical来源、同speaking-root、identity配准的短袖片与精确skin节点；skin沿手掌下缘和指尖收紧，防止移动时夹带胸前白衣碎片。两节点共用现有肩部枢轴和增强微动，托腮节点及所有四态微动轨道保持上一已验版本不变。

生成返回均1254方形，首条prompt误写1024×1536，但实际返回保留源画布；未据该错误文字做像素重采样。此前生成托腮臂经非等比rig配准，仍与canonical袖片交接形成方形台阶/悬线。该生成臂现已退出活动资产集合，仅保留原生PNG和prompt/hash记录；当前袖臂比例回到原画且不再使用非等比配准。托腮无臂躯干仍使用生成重建的被挡衣服，口袋细节略有变化。

## 可复现预览

在本工作树使用Node24.22.1和已锁定依赖：

```sh
npm run appearances:generate
./node_modules/.bin/vite --config spikes/animation-preview/vite.config.ts --port 5351
```

正式AnimatedPortrait实时页：
`http://127.0.0.1:5351/?appearance=blue-glasses&src=/@fs/Users/nighca/.codex/worktrees/blue-glasses-animation/lie/design/animation-candidates/blue-glasses/package.json`

本目录`qa.html`由Vite的`/@fs/绝对路径`访问；使用正式loadAnimationPackage/sampleClip/createCanvasRenderer，可选四态与25%/75%正负极值。该页只是制作自检，不接语音。`build.py`仅生成JSON数据，可重复运行；不会修改PNG。

## 实际检查

- `node --experimental-transform-types design/animation-candidates/blue-glasses/verify.mjs`通过：严格v1解析、6份活动PNG实际头部尺寸/hash、960时刻有限变换/互斥嘴形、循环闭合、共用接触父链、canonical托腮三袖臂同源/identity配准及上臂在躯干后/前臂在躯干前的遮挡约束、讲话袖/臂同源同父identity配准、100次在240ms settle完成前再次中断（setState前后advance(0)所有节点数值transform连续、每步数值有限、嘴形显隐互斥、所有部件显隐立即符合目标clip当前采样）、canonical源hash。Node仅strip类型不支持播放器parameter property，故明确使用其transform-types标志。
- `npm run test --workspace=@lie/appearance-animation`：25/25通过。`npm run typecheck --workspace=@lie/appearance-animation`通过。没有运行全仓build，未更改应用或播放器代码。
- 以下浏览器记录属于本次修订前的首版，不证明修订通过：IAB实际正式组件桌面四态播放、快速切换均能显示候选；console error/warn为空。额外用正式采样器逐态检查25%/75%截图，已实际逐图阅读。未见头颈/托腮接触大空隙、重影或裸露袖口截线。初版等待背带切缝、讲话手下夹带白衣区已修正。
- 首版391实际innerWidth=391。正式组件default/waiting/speaking的全页证据可用；listening的截图下半间歇截断，定相位页部分截图出现布局畸变，不能当作通过。已reset释放viewport；发起者随后以新选中tab、实际innerWidth=scrollWidth=391完成四态实时组件复验，见`initiator-review.md`及`owner-*-391.jpg`；早期截图不替代该证据。只保留可读证据，没有将坏截图归为通过。
- 未另测本候选减少动态效果/隐藏暂停/资源失败/迟到换人/卸载；这些属既有通用组件能力与已有测试覆盖，不能把播放器单测当成本候选浏览器实测。发起者最终review仍需包含关键实际兼容检查。

- 本次第二次托腮修订由发起者实际代验：其刷新5354定相位页检查waiting 25%/75%，确认白袖筒、右上臂台阶、左上臂黑悬线已消除，单套原画袖臂连接正常，左胸扣子与腰带重复碎片已清理。制作代理IAB调用返回“Browser is not available: iab”，没有声称亲自通过；没有重启其他owner的服务或占用viewport。其后发起者复验其余三态相反相位，default/listening正常，speaking 25%仍发现掌下胸前白衣碎片；本次拆同父袖片+精确skin后，发起者实际reload5354复验speaking 25%/75%，确认掌下游离白黑锯齿衣片已消除，袖口/皮肤连续，两个极值无明显脱接。制作代理没有声称亲自浏览器通过。实时播放、新391复验和最终用户截图由发起者继续补充。现存screenshots与initiator-review.md针对旧版本，不能代表本次修订。

## 已知边界

尚无自然抬放过渡（特殊臂即时切换，数值通道由既有240ms settle）；没有眨眼、网格变形、音量驱动或真实语音/音素口型。当前开闭嘴为合成时序，并非真实供应商验收。未连接麦克风，未在正式游戏激活。源码引用与assets命名保持appearance，统一CharacterPreset迁移不在本候选范围。

本目录截图是原生IAB截图，不做像素后处理。`provenance.json`记录原四态与parts SHA256、实际尺寸、alpha范围和主要不透明边界。发起者负责独立读取diff/素材/页面，确认后再交用户逐人验收。
