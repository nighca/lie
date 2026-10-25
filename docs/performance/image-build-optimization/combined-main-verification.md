# q90与CI/CD组合验收

2026-10-25，借用root冻结候选 `codex/integrate-q90-ci-cd`，WT `/Users/nighca/.codex/worktrees/integrate-character-preset-dawn/lie`。基线main `462d8a4ddebe1df3703caace2f2db2aa5c8eeb89`；被测HEAD `746718abb0742ecc7ac40aa23b4228df2c8e73db`。本报告仅追加文档，root另行审查与ff；未push、未部署。

有序候选提交：

1. `ae10bfd4ddf18e6dda0100c81ca06884af2255a9`
2. `544d7f9cd6f680dbd6668fb7983fb519a1d95a75`
3. `44e82ce3fac73dc9c6bfe6084c1f3beea46dfd40`
4. `7778486fe7c3a8c2b053434286690acacc25e2a0`
5. `53b8cb0fa3e1001bf2a060469eb7f286593fdb8b`
6. `20a857d77de5911825887222ded02513f8f018e3`
7. `746718abb0742ecc7ac40aa23b4228df2c8e73db`

## 实际执行

Node24.22.1/npm11.13.0、候选既有依赖；无安装或网络编码器下载。全部通过：

- Web完整36files/334tests，character-animation 3files/80tests，Node generator24、CI交接17。
- 全工作区typecheck；真实Web与Gateway build。Web100modules，Gateway4modules及fallback2modules；严格预设检查8人/89assets。
- `verify-build.mjs`使用实际runtime parser核8包/46parts、81WebP及canonical/fixedPNG不变；190文件hash记录于本地ignored `tmp/q90-built-identity.json`。
- 从冻结图片源复用工具/50项缓存；四构建helper与source `d3d71a70cb95005e3e9f63c1c40aa8ee82c20dca` Git blob相同，cwebp/dwebp SHA分别为 `07ba910950253f18ca227d085848ff39be530f6ef22005e778cd48d4850734f2` / `7b341872a316596df8e517b6d5b1bcb9e2ca6b6489521d328f2db38d22881ca6`。缓存输出逐项hash核对，构建实际0encoded/50cache hits/0preserved；策略q90-m6-alpha100-icc-v1。
- CI YAML与source `90c2ba7df3f30bea1e0c88504915a01a00849c5e` 完全同字节，图片cache仅一块。完整prebuilt195files/77,294,352B真实pack→restore，包含hidden manifest。合成身份为上述候选SHA/run123/attempt2，仅本地验证；在新目录 `tmp/q90-cd-replay`（只有`.cloudflare`、无源码/config）实际`cf deploy --prebuilt --mode production --worker lie-game --provision=false --dry-run`成功退出。命令显示361assets条目，这是CLI枚举口径，非本报告195普通文件计数。无token/account环境传入、无真实发布。

## 资源、复用与限制

81份canonicalPNG及源manifest/voice配置与main462相同；92份构建static hash与冻结图片源d3的实际built-identity完全相同，8包/46引用闭包通过。190份Webdist与Worker资产逐字节相同，未含QA/fixture/docs/design入口。图片源IAB4图/HTTP验收因此仅按相同静态资源范围复用；本候选JS/CSS已含新姓名/高度，另由本轮Web全测/构建覆盖，没有新浏览器、GPU或真人provider验收。

81图PNG原体积66,486,773B→WebP9,746,332B，减少85.3409459352%；本候选全部Webdist为77,279,202B，分母不同，不能混报。Vite保留原有hashed underline.svg运行时解析warning；实际文件及引用闭包存在，不称构建无warning。

独立图片审计原文 [script](main-integration-audit.py) / [result](main-integration-audit-result.json) 已保留，source d3/main462：11JSON、50unique alpha/RGB指标、8summary及190源文件身份等已重算。此次核读并归档，未重跑图像计算；脚本动态读取main且引用源WT dist，历史重放需保持所记录基线/源产物，不能据此推定未来main。它记录源dist77,277,967B；当前增加1235B来自组合应用输出。时间、浏览器DOM/网络仍是源owner证据，独立审计没有重新浏览器运行。

本轮无服务/端口/浏览器动作；5355动画用户消费者保留。图片owner回执5356 PID92431/子92889/PTY39359已Ctrl-C exit130、listener/ps空、tab2关及override复原；5357误占已停，不是新增批准端口。本地检查不证明GitHub远端Actions、Linux编码器或真实Cloudflare部署成功，仍待后续发布核验。
