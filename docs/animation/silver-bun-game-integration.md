# 银发盘发动画正式资源接入候选

2026-10-25。基于 reviewed main `31db7c9f3d4f1224612d1017b37ef27520651fd3` 准备；尚未集成 main、push 或部署。用户对嘴位/微动的反馈修订以及 waiting 改为局部呼吸已完成动画发起者和独立 QA 复验。此次按用户至08:30的小修自主推进授权准备接入，**不声称用户已亲自验收最终 waiting，也不把用户睡眠当作批准**。

## 来源与接入范围

候选原 base 为 `c9c2e765b19ad84b70f54a5cefc8ad45b6f90479`，14个提交从 `24c7814bf0d0e5d908eeb2bb551d556efd55e184` 到 `e46f6ccf3fa19d0627aa01b45530eeccd70f38eb`。最后数据修改为 `ebbf81f82ad72c45c0a1fef633a4bdc1c34e6196`。源owner另追加纯文档夜间代验记录 `79258ad5f51582aed981a1596e7bedcbfd5e7255`（parent e46f6），已review并按新commit纳入；15个来源提交无资源变化。该记录允许团队代验后交协调review，仍不冒称用户亲自验收最终waiting。较早 d68ad39 的图和复验只描述历史；当前参考为 `feedback-review.md`、`waiting-review.md`、silver-feedback-* 与 silver-waiting-breath-* 原生图。既有通用 runtime/contract 依赖已经在当前 main，不重放，不增加兼容分支。

正式源为 `design/character-presets/assets/silver-bun/animation/package.json` 与引用的六份 PNG，均原字节复制。仅在 manifest 的 silver-bun 条目加入 `animation: "assets/silver-bun/animation/package.json"`，生成 `/appearances/silver-bun/animation/package.json`。生成物不提交。旧四态静态图和头像引用均保持，其他人物/UI/引擎/案件/provider/命名不改。候选作者 inspection.html 的唯一import另以独立commit改为相对当前工作树的 `../../../packages/character-animation/src/index.ts`，避免引用原作者工作树旧runtime；不扩大Vite文件白名单。

package SHA256：`be2eb0fe31534d371dd1ebe960363a75b418122ebf006f2712ddfe94fca0b22a`。1254²逻辑画布、14节点、六PNG；头1362×1155、嘴图集2172×724、四份原姿态1254²；画布加活动纹理预算11,008,218像素，低于严格解析器33,554,432上限。PNG压缩合计5,112,497字节。被拒绝的生成躯干没有复制到正式资源。

## 当前运动与限制

waiting 腰以下层挂固定 body-root；上身/头/嘴/托腮双臂挂同一 head-root，固定 x/rotation/scaleX，围绕 y850 作纵向±0.6% scaleY 呼吸。4秒周期以17个正弦采样 key 线性插值；上下层在 y842—858 有16px同源重叠。头部垂直变化约5逻辑像素，肩约2.7，无整身侧摆。头/接触组最多0.6%纵向伸缩，不称为全关节独立活动。相对 reviewed feedback 7509b19，其他三clip、非waiting既有node、所有asset字段精确一致。

其他三态呼吸±4px；普通头±1.2°、聆听接触组±0.85°，普通臂±1.2°、讲话臂±1.9°。开闭嘴按同一位移/裁剪中心−9°注册，讲话为合成时序。没有自然抬放transition、眨眼、网格变形或真实音素同步；姿态专属附件立即切换，数值沿既有settle衔接。生成头保留身份但不与原静态逐像素相同，waiting沿共享default视线。没有麦克风、真实供应商或付费模型调用。

## 本次独立验证

Node24.22.1 的现 main 严格 parser 可直接读取候选。实际运行 check.mjs，核 PNG尺寸/hash、原canonical四态hash、25ms四态有限采样/互斥嘴/循环、接触组、waiting下身全部transform固定与零侧摆、真实纵向呼吸、快速中断的逐node逐数值通道连续和目标显隐。没有修改runtime。

原 build-package.py 在临时目录执行，package和六PNG与候选字节完全一致；依赖历史内置生成输出路径的作者构建器没有假装成可移植生产依赖，已提交正式包可独立加载。本次逐字节核候选→正式→public→dist的package+六PNG一致，静态四图source/public/dist保持main原字节（头像引用default）。manifest除新增silver动画字段外与base相同。

全仓372测试、全仓typecheck、Web/gateway生产构建通过；public/dist严格check为8人物/67资源。自动化验证包括通用失败静态回退、减少动态效果和卸载/状态映射，不将替身测试写成本角色IAB实测。

只读 source audit 实际通过：default/waiting肩带各46,450/46,155个源像素；排除头下多余锁骨与旧放下右臂，保留聆听腰身21,714、普通手臂/近邻描线15,249、聆听肘弧7,898及讲话手掌1,225个有界像素。audit-seams.py实际调用正式sampleClip，default/listening/waiting各32相位、完整父链、非空内部源alpha区域断言通过。它检查袖内/腰线有界选区的nearest-source alpha，**不证明全canvas、所有过渡帧、Canvas抗锯齿、颜色重影或美术验收**。

## IAB验收交接

本任务创建IAB tab实际返回 `Browser is not available: iab`，已报总协调；未改用Chrome、未占viewport。激活后的游戏内桌面/391、减少动态/阻断失败回退、隐藏恢复仍待可用IAB专项，不能从源候选的实际验收记录推导本次已经完成。

独立作者极值页：同端口 `/@fs/Users/nighca/.codex/worktrees/silver-bun-activation/lie/design/animation-candidates/silver-bun/inspection.html`，可加 `?detail=face`、`waist` 或 `shoulders`；HTML及当前runtime模块实际HTTP200，只证明入口可达。

独立服务：`http://127.0.0.1:5504/?game=salt-sugar-mixup&demo=1`，首人陶老师即silver，模拟模式不使用麦克风/provider。待检查：桌面/391四态与完整手/衣摆、waiting腰下固定及脸/下巴接触、1s/3s肩腋/袖内/腰线、换人卸载与切回、reduced-motion静态回退与恢复、阻断本角色package后静态回退及解除恢复、隐藏/恢复和console。若1280×720存在既有舞台裁切须与素材问题区分并如实记录；PointerEvent模拟不作真机触控证据。结束须清除模拟/阻断并关闭自建tab、reset viewport。
