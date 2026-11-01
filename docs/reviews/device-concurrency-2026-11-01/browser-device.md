# 浏览器持久身份与供应商 Device 分配

2026-11-01；来源：用户进一步认为按局分配语义不贴切，提出用Cookie标识用户设备、同一身份对应一个Device，并请专项确认Web能否读取MAC及给出建议。**产品行为已确认：持久Cookie身份对应一个Device，同身份后建立连接自然顶掉旧连接；具体接入架构未批准实施。** 已完成的[按局调查与样本](per-game-device.md)保留，不撤销其正常路径实证，也不把它当本次新策略的实现。

## Web能力与身份语义

普通网站没有读取网卡MAC的标准Web API。[Network Information规范](https://wicg.github.io/netinfo/)暴露连接类型、带宽和RTT等，而非硬件MAC；[MDN接口清单](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation)与之相符。本方案不尝试通过扩展、原生程序或设备指纹绕过网页边界，也不将WebRTC IP信息当MAC。

Cookie适合做站点的持久匿名浏览器身份。准确粒度是浏览器配置/存储分区中的本站Cookie，而不是物理机器：同一配置下的普通标签页通常共享，另一浏览器、另一配置或无痕窗口可不同；清Cookie/过期会失去原身份。一个人也不等于一个设备，公共电脑同一浏览器可能被多人使用。

来源：[MDN Cookie机制](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)、[Mozilla CookieStore及共享标签页](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/CookieStore)、[Mozilla无痕Cookie隔离](https://blog.mozilla.org/security/2021/06/01/total-cookie-protection-in-private-browsing/)。CookieStore是浏览器扩展的说明材料，仅用来说明存储模型，不表示网站可调用扩展API。

## 已确认方向与建议实现边界

1. 首次进入案件背景并准备设备前，先由站点签发随机、不可猜的匿名身份Cookie；不为只浏览首页的人立即创建供应商资源。
2. 用户已进一步要求利用阅读背景的时间：案件有效加载成功即后台初始化/取得该身份对应Device，开始对话时准备已好直接连接、未好等待同一任务。后续开新局、切人物、停止再开沿用Device，但仍使用新WS，不沿用上一人物的活跃连接。
3. Cookie只承载本站身份或私密封装的能力引用，不明文存管理key、provider token。由服务端设置`Secure`、`HttpOnly`、适当的`SameSite`及host作用域；期限与失效后的资源保留规则待定。HttpOnly不等于不可复制或不可重放。
4. 用户接受同身份后建立连接自然接管，不为此实现跨tab排他锁、忙碌提示或显式接管按钮，也不要求同Device多WS并行。供应商按实际连接建立顺序顶替；不承诺严格按最后点击时间排序。网关仍需处理首次初始化的稳定身份关联、取消和资源清理，不用每Worker内存Map伪装跨实例幂等。

Cookie比localStorage更适合此处的服务端网关身份：浏览器会自动随同源请求携带，HttpOnly可避免前端脚本直接读取。它并不比localStorage更接近真实硬件。用哪种存储不改变同Device的供应商并发限制。

## 最小接入候选：先不引入应用映射数据库

可以优先研究由签名或私密封装Cookie携带服务端生成的Device身份、Client UUID、版本、环境和期限，网关验证后直接使用；Cookie不承载管理key或provider token。这使Cookie本身提供可验证关联，不必仅为Cookie→Device映射就新增DB/DO，也不维护阻止同浏览器接管的active lease。此处是架构候选，不是已批准实现。

身份先持久落地，再于首次开语音时执行OTA；未绑定时走激活码绑定→再次OTA，已绑定时取得token，实际WS仍固定官方WSS。首次准备的阶段与现有10秒WS等待窗口需分开设计；每次连接都走OTA的延迟/是否缓存尚未定案。

[OTA契约](https://linx.qiniu.com/docs/xrobot/platform/OTA)支持同设备在缓存期内复用激活码、已绑定返回token，但不等于[绑定POST](https://linx.qiniu.com/docs/xrobot/api/device)有已证实的幂等成功保证。并发首次初始化/响应丢失时保持同一Cookie身份，有界核对；不得直接把冲突当成功、给该身份不断换新Device或回收别人的设备。不新增应用DB也仍有供应商绑定状态、在线管理凭据与孤立资源清理责任，这些应在具体实现方案中说明。

## 用户已确认的多标签页行为

用户明确选择：同时只支持一个标签页对话，但不需要特别处理或提示；因为多个标签页共享Device，第二个标签页会自然顶掉第一个。按此规则，供应商的同Device互斥在同一浏览器身份内部成为预期行为，不再当成需要用租约或前端锁阻止的故障。

| 场景 | 预期行为 |
| --- | --- |
| 不同浏览器身份同时对话 | 使用不同Device，各自保持连接，不互相顶替 |
| 同一浏览器身份的第二标签页建立语音连接 | 共用Device，后建立连接自然顶掉旧连接，不新增专门提示/确认 |
| 同一浏览器新局、切人物、停止后再开 | 保留Device，按现有编排建立新WS，人物context仍按连接隔离 |
| 旧页面收到close | 沿用现有controller/liveVoice清理，停止mic、播放及旧channel；不新增跨tab产品交互 |

已在[生产复现](production-2026-11-01.md)同Device顶替，[独立Device实验](independent-device/run-02.md)也有不同Device并存的正向样本，可分别作为上述两种预期的依据。它们不是新Cookie映射产品代码已通过验收的证明。

初始讨论曾建议“保留旧对话、第二标签页提示忙碌”，该建议已被用户明确选择的自然顶替行为取代，不实现。允许同身份多标签页并行需要多个Device的路线同样未采用。[Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)及跨tab消息能力曾作只读研究，但不纳入本方案；不为Cookie身份引入一套阻止同浏览器接管的全局active lease。

跨人物/跨局继续保持Memory_nomem及历史不保存等经过验证的配置，工具每连接只投影当前人物历史。同Device顺序复用有正常样本，但不能由此承诺长期跨局、工具状态或异常断网永不污染；回收/重连中的不确定状态仍需处理。

## 持久化与回收的待决点

- Cookie丢失无法通知服务端清理旧Device；无痕、换浏览器或清数据会创建新身份。需要可解释的空闲回收与再次访问重新初始化策略，不能永久无界积累。
- 首次初始化的幂等性不能只靠Cookie随机性。多标签页并发首次访问/首次开语音、请求成功响应丢失均须避免误分配、覆写或盲重建。
- 身份Cookie应由网关校验，不能让浏览器提交任意Device。是否使用服务端映射或私密封装，如何刷新token、核对解绑/删除不确定状态，当前未选定。
- host作用域Cookie不会自动在生产、自定义PR域名和localhost间共享；不跨环境建立身份关联。共享Agent配置可以是候选，但“生产/非生产各一token”尚不是已验证的设备或并发隔离契约。
- 浏览器长期身份不等于供应商承诺的软件设备许可、数量或收费规则。小规模样本不代替平台限额和维护策略。

本轮仅公开资料核实与方案讨论，无新provider请求、资源、浏览器操作或产品改动。用户已确认Cookie身份及同浏览器自然接管行为，具体产品源码ownership、资源和实现架构待最小方案收敛后由总协调协调。
