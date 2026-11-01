# 独立Device验证第一轮：分配完成，WSS目标校验停止

2026-11-01；状态：**本轮未完成并发或按局复用验证**。用户已批准[计划](plan.md)的1个新测试Agent、最多2个新Device、最多6次合成问答、300秒实验及60秒有界清理；总协调授予一次独占provider测试窗口。实际只创建1个Agent、1个Device，零WS、零问答、无麦克风。没有修改生产、本地用户配置或已有设备。

## 实际执行与身份

- 源码基线 `c9f1ddb96a3045e6d0e1dd6b6d1f96c4dd00bcf4`；专用WT `/Users/nighca/.codex/worktrees/b1b9/lie`。
- [probe.mjs](probe.mjs)执行前SHA256为 `f9e2eeeeaf29f5efafc2702d4155847d8bf94c097a67e7c552eef0f7495d7e43`，父owner与独立review通过后才运行；运行后未修改方法。
- 使用已有Node `24.22.1`与已有ws依赖，未安装依赖、创建跨checkout软链或改lock；未启动本地服务/浏览器tab。命令只用 `--execute-approved` 显式启动，默认导入不联网。
- 私密key必要时直接读取原文件，未复制、打印、chmod或写入私密state；未读取`.dev.vars`。本WT ignored `tmp/p0-independent-device-2026-11-01/state.json`保存write-ahead所有权状态，mode0600、同目录临时文件原子rename。

## 结果与时序

UTC `05:05:32.099–05:05:39.755`（北京时间 `13:05:32.099–13:05:39.755`），程序elapsed7657ms。完整脱敏结果见[results.json](results.json)。

| 阶段 | HTTP/业务码 | 耗时 |
| --- | --- | --- |
| 创建专用Agent | 200 / 0 | 1951ms |
| 配置Agent | 200 / 0 | 438ms |
| 必要字段读回 | 200 / 0 | 1259ms |
| D1首次OTA | 200 / 无业务码字段 | 1908ms |
| D1激活绑定 | 200 / 0 | 451ms |
| D1再次OTA取token | 200 / 无业务码字段 | 444ms |
| D1解绑 | 200 / 0 | 484ms |
| 删除专用Agent | 200 / 0 | 703ms |

五项读回准确为 `Memory_nomem`、history0、disable_greeting true、max_tokens160、enable_search false。D1经历新软件身份→激活码→绑定→第二次OTA返回非空token，管理分配路径确实执行成功。

第二次OTA返回的目标未通过探针严格白名单形状检查：`wss:`、固定官方hostname、精确`/v1/ws/`路径、无query/用户名/密码全部满足才继续。本次因此记 `Unexpected OTA target` 并在任何WS建立前停止；没有改规则、换URL或自动重跑。原URL和OTA响应正文未保留，无法从现有证据定位究竟是协议、域名、路径或query哪一项不符，不能擅断为供应商不支持、token无效或接口故障。

D2尚未分配；WS channels与questions均空。因此没有实际“D1在线时动态分配D2”、双设备并存、六问上下文或同Device顺序切人结果。现有分配耗时样本不能代替完整to-ready延迟，也不是p95或SLA。

## 收尾与边界

本轮没有创建任何WS，所以无需等待WS关闭；`allSocketsClosed=true`是空集合条件，**不能当成实际close ACK**。已确认owned D1绑定解绑、专用Agent删除成功；私密状态复核agentId已清空、bindings0、tokens0、uncertain0、cleanupComplete true、文件mode0600。此处不声称删除所有供应商注册记录、日志或历史。

执行PTY/session `4226`已exit1，无残留probe进程或新增服务。父owner已及时报告停止及释放provider独占测试turn。未进行下一次真实请求或测试；后续若需继续，先审查方法与明确下一轮窗口，不能把本轮未用额度当无限重试许可。

离线准备检查：语法、安全导入、合成canary投影与内容判据；一次纯fake完整6问/5条WS及cleanup流程；原子state与未知OTA失败不重分配/不误删路径；Agent extra object/JSONstring/缺失读回路径。fake仅验证本地控制流，不证明真实设备隔离。真实结果只支持“本轮专用Device可动态绑定并取得token”，是否解决并发顶线和按局复用仍未验成。
