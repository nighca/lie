# 蓝衣眼镜动画候选

2026-10-24，未激活生产，尚待发起者独立review与用户逐人美术验收。使用内置imagegen，共3次首轮调用，0次额外修复调用；真实prompts、参考图和保留的原生输出见`generation-records.json`。所有PNG均原字节复制；没有脚本改像素、抠图或缩放导出。

## 形象与部件

来源为canonical蓝衣眼镜四态：深蓝卷发、圆黑框眼镜、白T恤、亮蓝背带工装。default双臂放下；listening手拢耳边；waiting一手点下巴、另一臂承托；speaking张嘴并掌心朝上解释。原四态完全未改。

6份1254×1254 RGBA共享PNG、17节点、4循环。生成共享无臂躯干、托腮姿态无臂躯干及完整交叉手臂接触组；其余头部、普通臂、靠耳臂和讲话臂从原生源PNG按运行时多边形遮罩取样。闭嘴头供四态共享，讲话开嘴头与闭嘴头用显隐互斥切换。未把整张静态人物只做缩放冒充部件动画。

托腮和靠耳手与头同属contact-root；头颈留有遮挡重叠。躯干持续上下2逻辑像素/±0.18°，等待聆听接触组±0.32°/0.5像素，普通头±约0.6°，普通臂±0.35°，讲话掌臂约±1.4°。姿态专用臂稳定节点、专用显隐。等待接触组保留一体手肘关系，前后两层复用同一PNG，让袖口遮住上臂端点。

生成返回均1254方形，首条prompt误写1024×1536，但实际返回保留源画布；未据该错误文字做像素重采样。生成托腮臂没有保持原生配准，故以rig的非等比缩放/平移配准（.7/.65，170/198）；手臂比例与原画有轻微差别，应由用户判断。托腮躯干重建了被挡住的衣服，口袋和袖内阴影细节存在轻微变化。

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

- `node --experimental-transform-types design/animation-candidates/blue-glasses/verify.mjs`通过：严格v1解析、6份PNG实际头部尺寸/hash、960时刻有限变换/互斥嘴形、循环闭合、共用接触父链、100次快速中断、canonical源hash。Node仅strip类型不支持播放器parameter property，故明确使用其transform-types标志。
- `npm run test --workspace=@lie/appearance-animation`：25/25通过。`npm run typecheck --workspace=@lie/appearance-animation`通过。没有运行全仓build，未更改应用或播放器代码。
- IAB实际正式组件桌面四态播放、快速切换均能显示候选；console error/warn为空。额外用正式采样器逐态检查25%/75%截图，已实际逐图阅读。未见头颈/托腮接触大空隙、重影或裸露袖口截线。初版等待背带切缝、讲话手下夹带白衣区已修正。
- 391实际innerWidth=391。正式组件default/waiting/speaking的全页证据可用；listening的截图下半间歇截断，定相位页部分截图出现布局畸变，不能当作通过。已reset释放viewport；391整体仍待发起者重新实际验看。只保留可读证据，没有将坏截图归为通过。
- 未另测本候选减少动态效果/隐藏暂停/资源失败/迟到换人/卸载；这些属既有通用组件能力与已有测试覆盖，不能把播放器单测当成本候选浏览器实测。发起者最终review仍需包含关键实际兼容检查。

## 已知边界

尚无自然抬放过渡（特殊臂即时切换，数值通道由既有240ms settle）；没有眨眼、网格变形、音量驱动或真实语音/音素口型。当前开闭嘴为合成时序，并非真实供应商验收。未连接麦克风，未在正式游戏激活。源码引用与assets命名保持appearance，统一CharacterPreset迁移不在本候选范围。

本目录截图是原生IAB截图，不做像素后处理。`provenance.json`记录原四态与parts SHA256、实际尺寸、alpha范围和主要不透明边界。发起者负责独立读取diff/素材/页面，确认后再交用户逐人验收。
