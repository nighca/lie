# 持久化分享：正式前端接入

2026-11-01。用户已确认极简UI设计并要求推进实现与合入。独立worktree `/Users/nighca/.codex/worktrees/lie-share-storage-frontend/lie`，branch `codex/lie-share-storage-frontend`；明确依赖已review的后台 `b9b403b083271fb526900bcb669483a54ab017d8` → `27a08aeceb81093b62cffde65124bf3f445df67e`，本任务原始base为后者（其main base为a8be758）。只交本任务新增commit，不重放依赖。

## 实现

- 新分享以规范化JSON调用同源POST，前端预检1 MiB UTF-8写入上限。返回ID生成 `/play?share=v1.<22字符>`；不生成长fragment或失败自动回退。
- 新短链接GET读取后沿现有案件契约和预设检查，无读取大小限制或hash校验。保留旧fragment解码及其16,000字符/128 KiB解压边界；重复/未知版本/非法标识、新旧载荷并存本地拒绝。
- HTTP请求及响应JSON读取均受15秒超时约束。错误映射为安全文案，404不创建会话，网络/服务错误可手动重试。
- 分享立即打开已批准的极简弹窗：等待、失败、成功在同一弹窗；成功为标题、链接+复制操作组、一段合并说明。说明只在弹窗内；手机自然堆叠。失败可重试/继续编辑，超限只继续编辑。
- 分享使用独立请求轮次，关闭、草稿变化、KeepAlive停用和卸载使迟到结果失效；旧finally不改新请求busy。保留现有copyRevision，复制失败文案中性，继续适用于JSON投稿。
- Application沿已有revision隔离新短链接加载；加载/错误采用Demo对应呈现，保留首页和版本入口。开发代理增加`/api/shared-games`到既有gateway配置目标。不改App/控制器/语音/判案规则。
- 历史测试需要的编码器迁至test-only `legacy-share.ts`，不把旧生成逻辑留在生产路径。未增加依赖、通用框架、IP限流或停写开关。

## 验证

锁定Node24.22.1/npm11，未复制secret或使用真实provider。

- Web typecheck通过，完整Web回归42 files / 400 tests通过。覆盖新helper POST/GET、1 MiB多字节写入、超时、安全错误与新旧链接，真实Editor关闭重开/重试/KeepAlive，stored route迟到隔离和404；原有编辑器、预设、标题等回归通过。
- 根`npm run build`通过：正式Web、121预设资源校验和Worker构建；最终收尾仅补分享状态页版本按钮事件，相关标题/版本测试另跑通过。构建时source为本任务dirty，不声称clean部署身份。
- 实际IAB页面经5176代理5180本地R2：UI填写1人案→保存→另tab打开内容；修改后不同ID，旧链接刷新仍显示原内容；同一内容重试得到同ID；真实clipboard成功。原3人legacy fixture在实际页面打开成功。
- 仅专项tab CDP模拟断网，弹窗显示网络失败；恢复网络后弹窗内重试成功。390px专项tab的innerWidth/scrollWidth均390，链接/复制自然堆叠，已保存full-page截图；没有修改用户5177tab或browser级viewport。所有临时CDP状态已恢复，两个自建IAB验收tab已关闭。
- 必要证据见[截图目录](share-storage-frontend-evidence/)。截图均为本地测试内容与本地URL，不是线上存储；没有麦克风或模型调用。真实云端可用性/计费不由此证明。
- npm ci的既有5项moderate依赖提示未做无关升级；既有Vite扩展名/workspace/underline提示不影响成功。类型/测试/构建无新增失败。

## 服务生命周期回执

本轮两个服务均由 `/root/share_frontend` 独占，consumer仅本任务自动验收，结束后原PTY Ctrl-C，均exit130。启动前核5176/5180无listener；未操作5177、8787/8788、5544、5198。

| 服务 | 命令与身份 | 停止回执 |
| --- | --- | --- |
| Web 5176 | Node24.22.1，`LIE_VOICE_GATEWAY_URL=http://127.0.0.1:5180 npm run dev --workspace @lie/web -- --port 5176`；PID75839，原exec session8893 | 原session Ctrl-C；5176无listener，精确PID已退出 |
| Gateway 5180 | 同runtime，`LIE_GATEWAY_PORT=5180 npm run dev --workspace @lie/gateway`；Vite PID75292，原exec session31258；无provider secret，R2 remote:false | 原session Ctrl-C；5180与内部56985无listener，精确PID已退出 |
| 自有workerd child | PID75705，parent75292，内部56996/56997；无远端binding | 随原gateway停止，两内部listener与精确PID均已退出 |

启动SHA为27a08ae加本任务dirty；服务验收对应本任务源文件，不把它冒称production build。当前无保留服务、未知进程或评审consumer。生成的本地R2状态仍在本WT的忽略目录，未清理或提交用户数据。

## 交接边界

本任务只在独立分支提交，不main/push/部署。云资源由总协调另行安排；未访问账户/配置凭据/创建桶。由唯一integrator组合已review后台、UI设计档案和本任务commit，review候选并验证后再合main与发布。根设计/服务中央文档由总协调统一更新。
