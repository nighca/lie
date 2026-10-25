# 珊瑚短发结果反应 · 首对样片

状态：2026-10-25 制作与自行检查完成，待用户确认这对人物反应后再扩展其余七位。用户已经确认结果视觉方向 R；本样片确认不重复索取总体视觉方向审批。

## 内容与边界

- 指认正确：小幅垂头、松肩，闭口的无奈表情，1.15秒后保持。
- 指认错误：疑问眉、微张口、歪头与单手掌心向上，1.05秒后保持。
- 同一包复用原四态部件、装配和动作；新增两张原生透明头部 PNG。没有纵向拉伸轨道，没有循环结果反应。原有头部、嘴片仅在结果态隐藏；两种新脸的源尺寸与装配比例一致。
- 两张静态终态由正式 Canvas renderer 对对应 clip 的末帧原生导出，未做图片重绘、拼贴或外部栅格编辑。
- 此页仅验收人物反应，不是游戏结果页；不含游戏逻辑、解释文本、分享按钮或改编入口的最终集成。最新“改编在最右，editor/preview隐藏”要求由正式页面 owner 保持。
- 未激活正式 manifest、替换原预置目录、修改 App/style/controller/main 或开 PR。下一阶段需协调人确认共享文件所有权；其余七位制作依首对样片确认继续。

## 运行与检查

使用项目 Node24.22.1 工具链，安装锁定依赖后：

```sh
node node_modules/vite/bin/vite.js --config design/result-reactions/vite.config.ts
node --experimental-transform-types design/result-reactions/check.mjs
```

页面：`http://127.0.0.1:5355/design/result-reactions/`。重播按钮重新挂载正式 AnimatedPortrait，两种动作播放一次；静态开关显示同一 renderer 生成的末帧。制作检查按钮比对实际组件 Canvas 与导出图的完整 PNG 数据。

Node直接读取 playback.ts 需要 transform-types（类的参数属性不支持 strip-only）。第一次未加该标记的候选脚本失败，改用上述实际命令后通过；没有修改运行时语法来迁就测试。实验特性提示保留。

检查证据：

- `evidence/checks.json`：v2严格解析、所有原 clips/nodes/transitions、11张源 PNG逐项一致；242个结果采样的所有节点比例恒定；两态末帧钳制/完成；静态画布及13张资源头尺寸检查、SHA256。
- `evidence/coral-endpoint-check.png`：真实组件完成后与原生静态导出像素一致，页面可见检查通过。
- `evidence/coral-reduced.png`：浏览器 reduce 时显示两种静态终态；恢复偏好后仍是静态，不自动重播。
- `evidence/coral-narrow.png`：391px；实测html clientWidth=scrollWidth=391。
- 手动复查：头颈连续、手腕袖口连接、无额外嘴片/重影/头部拉伸；新表情为克制无奈与疑问，不引入真实人物个性或案件答案。正式页内容和规则不在本页模拟。
- 本工作区复验：runtime43、UI52、生成器23；全workspace typecheck通过。Web回归与构建结果见交付记录。
- 浏览器错误日志检查：加载样片时error/warn为空；自动测试与静态检查不代替用户对新表情的验收。

## 来源与临时服务

`coral-bob/generation-records.json`记录原生生成文件、alpha/尺寸和哈希。11个原素材与 `design/character-presets/assets/coral-bob/animation/parts` 字节相同。裁切仅使用既有播放器sprite.crop，保留两张源图原始字节及同一坐标注册。

本次预览 owner 为本动画 chat，工作区 `/Users/nighca/.codex/worktrees/result-reactions-coral/lie`，127.0.0.1:5355，PID1851 / PTY55257，IAB own tab60。保留服务给用户验收，不把本记录当作未来仍存活证明；结束验收后由 owner 停止该PTY并检查端口。已恢复本标签页 reduce 与viewport覆盖；未触碰8787/8788及他人的tab/服务。旧prototype服务5355早已停止，与本次不同。

最终复验：Web31文件292 tests通过；正式Web build成功（95modules），postbuild原8人89assets一致。保留既有underline.svg运行时引用提示，不是新失败。样片单独vue-tsc通过。最终浏览器error/warn为空；静态开关实际加载两张已保存1254px PNG均成功。`evidence/coral-review.png`为交付前最终页截图；tab60已标为用户交付，服务保留供本次样片确认。
