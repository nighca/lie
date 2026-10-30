# 首页页面版本

2026-10-30（Asia/Shanghai）。用户希望在页面低调显示当前版本，方便测试排除未更新、缓存或环境不一致。实现与所有验证位于独立 worktree `/Users/nighca/.codex/worktrees/lie-page-version/lie`，分支 `codex/lie-page-version`，原始base `95cb5cf02277a5c3f380d0a18158d3672a9bfcdd`。本专项不操作main、远程、网关或部署；由总协调审查并集成。

## 行为与版本身份

首页右下方的“页面版本 <7位hash>”使用原生 details/summary，展开可看到完整hash，文本采用 `user-select: all` 便于原生选择复制。小字号、既有muted颜色，不覆盖案件操作；手机在案件列表后自然滚动可达，桌面在首页底部。明确文案“仅表示当前页面的构建版本”，不是网关版本、部署状态或真实语音寿命保证。没有额外API、clipboard权限、storage、账号、遥测或时间戳。

Vite的build配置直接读取实际checkout的Git HEAD，不信任外部传入的版本字符串；CI检查出的确切commit会自然成为页面版本。所有本地改动（tracked及非忽略untracked）由Git status标记为“本地改动”，避免dirty代码冒称clean commit；DEV明确显示“开发版”，无Git源包显示“未知”。检测只产生commit与dirty标志，不把本地路径、分支、文件清单或其他Git信息放入客户端。

代码提交为 `efdc96f102346e750f41965a21ede4c0435f9c0e`。第一次Web构建从该clean commit开始，实际生产脚本包含完整efdc96f及dirty=false；本次原生391/1280验收对应这个构建。[来源构建与验收摘要](source-verification.json)记录该脚本路径和哈希。随后提交本说明时HEAD将改变，因此会在最终说明提交后的clean树再构建并核实际HEAD/dirty=false；最终产物身份只在交付回执报告，避免为填写自身hash形成报告提交循环。

总协调cherry-pick及新增整合文档后，commit和生产JS hash都会合理变化；不得声称专项产物与最终整合产物逐字相同。应在所有候选提交已保存、候选干净后构建，再核页面完整hash等于最终发布SHA。这是版本功能自身的必要验收，不是要求重测无变化的业务。

## 验证

Node24.22.1/npm11.19.1；候选独立npm ci --ignore-scripts，lock未变，日志/cache/TMPDIR都在本WT ignored `tmp/page-version/`，没有复用其他WT node_modules。只读使用现有已核工具链。

- Web `vue-tsc --noEmit`通过。
- 目标 `page-version.test.ts` 与既有 `navigation.test.ts` 共2文件14项通过。真实临时Git仓库验证实际HEAD与tracked修改标识；独立非Git边界验证未知回退；UI验证短hash/完整hash披露及开发/未知/dirty三态。
- Web生产构建通过，strict8预设121资源通过，冷缓存生成82个唯一WebP派生。保留既有Vite未来native configLoader扩展名与underline.svg运行时解析提示，不是本次构建失败。
- IAB实际返回 `Browser is not available: iab` 后才使用独立Chrome tab `1910332022`；没有全局视口覆盖，专用iframe为391×844、1280×900，两者document scrollWidth均等于viewport width，无横向溢出。
- 两尺寸均可看到短hash，展开完整hash无溢出；手机Enter原生展开、桌面点击展开再Space收起；40位完整hash与构建commit相同，浏览器计算user-select为all。进行了原生double-click但工具read-only DOM不支持getSelection，因此不声称已完成系统剪贴板复制验证。未读写clipboard。
- 截图通过浏览器工具内联实际审看，持久证据为本说明、源码、目标测试与去敏JSON；没有下载或持久化用户浏览器资料。不是Safari/真机/实际语音验收。

## 临时服务

总协调明确给5544有界turn，启动前lsof无监听。owner `/root/page_version`；source上述WT/clean efdc96f，独立Node静态服务器仅提供本WT apps/web/dist及ignored QA iframe页。loopback `127.0.0.1:5544`，PID6016，原PTY/session78829，消费者仅ownChrome1910332022；不启动Vite/Worker/代理、不发provider/mic请求。

验收结束先关own tab，原session Ctrl-C exit130，然后精确ps6016与lsof5544复核无进程/监听（初次sandbox ps拒绝后用批准的只读命令完成复核）。没有保留服务或consumer，未碰5176等待demo、5198或停用8787/8788、任何用户tab/storage/全局viewport。ignored QA服务器与依赖缓存留本WT，无需入库。

## 交付范围

仅Web构建版本helper/配置、环境类型、PageVersion组件、首页接入/页脚间距、目标测试及本目录说明。App.vue连接提示、gateway、voice/controller、workflow、package/lock、中央docs均未改。源分支clean提交后交总协调实际review；所有公开hash只用于定位页面代码，不能用于判定此次3分钟断线来源。
