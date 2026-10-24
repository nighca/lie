# 灰白胡须动画候选

未激活生产，尚待发起者独立视觉review和用户逐人验收。任务base为reviewed main `62b3846eecce8e902cd8bfe1764c87a337551e4b`，无额外依赖提交；仅本角色候选目录。

已实际查看canonical四态：灰白卷发与短须、珊瑚红毛衣/白内领、深蓝长裤；默认放下双臂、聆听拢耳、等待交叉承托/点下巴、讲话摊掌。保留四态表情，不重新设计脸或服装。

## 素材和装配

5份1254×1254 RGBA PNG、22节点、4循环。四态source全部原字节复制。一份内置imagegen输出补齐原手遮住的裤子轮廓，仅取y>=935；生成的头颈/衣领/肩袖均不参与显示。实际1次首轮生成、0次修复生成；`generation-records.json`保留真实prompt/参考/原输出，`provenance.json`记录各PNG真实SHA256、尺寸、alpha与边界。没有脚本改像素、抠图或重采样。

默认与聆听躯干使用各自canonical源选区，原生完整肩帽/长袖/袖口向衣料内部重叠；聆听右普通臂也来自listening-source。讲话共享default中央躯干和左普通袖臂，右肩袖与精确手掌/裸臂同speaking-source、同speaking-root。通过原生袖臂保留袖口边缘，避免生成空袖筒盖住皮肤；主躯干排除原下垂裸臂，裤子补底不含原手。

等待的颈部、衣领、上胸与完整交叉袖臂全部waiting-source、contact-root、identity配准；下腹/整裤仍waiting-source、body-root，y895~925同源衣料重叠。约束取舍：等待上胸与头/双臂共同微动，不声称局部能自由扭动，腰腹仍保留body呼吸；其余三态头/身体/肩臂有分部活动。没有把全画布只做一次整体摆动。

躯干约±4逻辑像素/±0.4°，普通头约±1.5°，普通袖臂约±1.3°，聆听/等待接触组约±0.9°/1.2像素，讲话袖臂约±2°，左右/各部件幅度及方向不同。讲话在default闭嘴与speaking开嘴头间互斥切换，非真实音素同步。

## 复现

使用Node24.22.1及锁定依赖：

```sh
python3 design/animation-candidates/salt-pepper-beard/build.py
node --experimental-transform-types design/animation-candidates/salt-pepper-beard/verify.mjs
python3 design/animation-candidates/salt-pepper-beard/check-coverage.py
npm run appearances:generate
./node_modules/.bin/vite --config spikes/animation-preview/vite.config.ts --port 5357
```

正式组件实时页：
`http://127.0.0.1:5357/?appearance=salt-pepper-beard&src=/@fs/Users/nighca/.codex/worktrees/salt-pepper-beard-animation/lie/design/animation-candidates/salt-pepper-beard/package.json`

正式采样器/Canvas定相位页：
`http://127.0.0.1:5357/@fs/Users/nighca/.codex/worktrees/salt-pepper-beard-animation/lie/design/animation-candidates/salt-pepper-beard/qa.html`

## 已做与未验

- verifier通过：严格v1/资源预算；实际5份PNG签名/IHDR尺寸/hash/alpha记录、四态canonical源hash不变；960时刻有限变换/单头嘴/专属附件、四循环闭合、接触同源同父identity、100次未完成settle的中断前后advance(0)数值连续/每步有限/目标显隐。
- 现有播放器33/33测试及typecheck通过；公共静态参考生成成功。未修改通用播放器、UI、manifest或其他候选，未跑全仓build。
- `check-coverage.py`是2px网格neutral pose局部alpha/原黑描边选区诊断，不计算世界矩阵、极值、最终颜色叠合或衣摆全域。它帮助定位并补齐聆听左躯干与左袖内缘的漏选点；七个有效区域零漏点加断言。讲话右侧保留实际4个alpha/63个黑描边差异点的诊断，因为中央躯干共享default-source而参考是speaking-source，不能写完整coverage PASS。原始计数见`coverage-report.txt`。该计数不替代真实视觉验看。
- 制作代理尝试IAB打开5357返回“Browser is not available: iab”；没有亲自查看实时四态、正负极值或391，不声称通过。需发起者独立验看头颈/白内领、肩帽/腋部、袖口、交叉承托、掌下旧衣片、衣摆描边、残留旧臂和halo。没有调整共享viewport。
- 未另测本候选减少动态效果、隐藏暂停/恢复、失败回退、换人晚到或卸载；它们属既有通用组件能力，不能把单测当本候选浏览器验收。没有接麦克风/真实供应商。

## 局限

无自然抬放transition（专用附件即时切换、数值通道由既有240ms settle）；无眨眼、网格变形或真实语音/音量驱动。讲话中央躯干/左臂复用默认源，衣料折痕可能略异其静态原图；补底裤子为原生生成输出，需检查其外形/衔接。等待接触约束减少了上胸与手臂的相对活动。尚未视觉通过，不自动激活或开始第三角色。
