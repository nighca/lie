# 第二、第三案真实角色回答：执行前方案

2026-10-24；基线 `f26894ddd02ddd8d9015d36987db0af01e54a1b7`。**本轮先交执行方案与离线上下文检查，尚未调用任何供应商账号API、建立连接、创建资源或产生付费回答；等待root审核后才可实施。** 矩阵位于 `spikes/case-behavior-validation/matrix.mjs`，已固定每案8个目标，共16个目标回答。

## 核查既有脚本得出的限制

现有`spikes/case-behavior/resources.ts`不是只读程序：默认会创建1个generic agent和3个设备，probe硬编码读取首案、三个人物以及首案history。regression/immersion模式也各有旧资源前缀和专属结果。**不能直接运行它来验第二/第三案**，否则既选错故事，又产生未经本轮确认的管理写入。

旧probe使用文本`listen.detect`，不是直接HTTP大模型文本接口。它触发真实模型、MCP、TTS和PCM返回，只是不采麦克风、不播放也不保存音频；会产生实际会话用量。因此本轮若复用该验证过的协议路径，准确名称是“文本输入的真实角色语义检查，伴随TTS”，不是免费纯文本推理，更不是ASR、真人收音、连续语音或新音色验收。

## 现模型与配置证据（不是本轮读回）

仓库sanitized证据 `spikes/case-behavior/config-immersion.json`曾读回模型ID `f3626c105383d71654a57f2bb8a973f3`、Memory_nomem、chatHistoryConf0；后续只读目录精确匹配名称deepseek-v4-flash，见 `docs/role-immersion-investigation.md`。这是以往证据，不能据此称当前线上agent必然仍用同样配置。

正式generic提示的源码位于`apps/gateway/scripts/linx-preview-resources.ts`，要求每答先取当前人物工具、本人history、60汉字以内；历史失败的immersion追加提示**不应**顺手复用到本次，避免一边测故事一边改系统提示。源码模板也不是已存在agent配置自动同步的证明。

建议执行前只读当前线上preview agent详情一次（ID只从其已有私密state取，不打印）；白名单比较实际llmModelId、systemPrompt、memModelId、chatHistoryConf和必要extra。若当前模型与上述已确认ID不同，或实际generic提示/记忆边界不一致，先停止并报root，不推理、不改现agent。该预检本身也在待审核范围内，尚未执行。

## 建议一次有界执行的具体范围

### 端点及管理操作

| 顺序 | 端点/用途 | 最大次数与写入边界 |
| --- | --- | --- |
| 预检 | `GET https://xrobo.qiniu.com/xiaozhi/agent/<online-agent-id>` | 1，只读实际当前配置；不输出私密ID/完整响应 |
| 确认名称 | `GET https://xrobo.qiniu.com/v1/agents/models/llm` | 最多1，只摘录当前预期ID的名称；不保存全账号目录 |
| 独立创建 | `POST https://xrobo.qiniu.com/xiaozhi/agent` | 1，新前缀`LIE-case-live-`，固定为预检一致的现模型ID，不切换供应商/模型 |
| 独立配置与核对 | `PUT`/`GET .../xiaozhi/agent/<owned-test-agent-id>` | 各1，通用提示与现正式匹配、Memory_nomem/history0、disable_greeting、max_tokens160、searchfalse；实际读回不一致就清理停机 |
| 临时设备 | `POST https://xrobo.qiniuapi.com/v1/ota/`，`POST .../xiaozhi/device/bind/<owned-agent>/<activation-code>` | 8个不同人物/案件身份各1临时设备；OTA每设备最多2次，共16；绑定最多8。不得用8787或线上用户正在用的设备 |
| 目标回答 | `wss://xrobo-io.qiniuapi.com/v1/ws/` | 顺序16连接上限，每连接仅发一个`listen.detect`文本问句、一个目标回答；不并发、不重试 |
| 清理 | `POST https://xrobo.qiniu.com/xiaozhi/device/unbind`；`DELETE .../xiaozhi/agent/<owned-test-agent-id>` | 最多8次解绑、1次删自有agent。成功失败都执行；若响应丢失导致创建/绑定归属未确认，不猜ID、不删其他资源 |

端点依据[官方agent API](https://linx.qiniu.com/docs/xrobot/api/agent)、既有已review资源脚本和[官方WSS协议](https://linx.qiniu.com/docs/xrobot/platform/websocket)。这是本次拟用的**资源修改方案**，不是已经执行；root需明确放行这些创建/绑定/清理，而不能把只读调研授权当执行许可。

每设备只属于一个case/character，最多两道独立问题；generic agent不携带案件全文。每问新连接、空既往history，仅把本轮user放入本人history；同义问是预先计划的独立样本，不继承上一回答，避免把错误答案再注入。MCP返回实际core `buildCharacterContext`，只有公共背景、本人profile和本人history，不发其他profile、ending、作者判读标准或完整矩阵。

预计保持test agent默认音色，不使用尚未确认的新音色ID；若当前默认音色/权益不能核对，也应在root执行review时明确是否接受该未知。这里检查的是文本语义，不能用它宣布四人听感或音色配置通过。

### 调用/费用上限和停止点

- 最多16个**目标回答**、16个WSS会话，不等于能证明最多16次底层LLM请求：工具获取可能发生内部多次推理。除MCP当前上下文工具外不提供其他工具，未知工具请求即停。
- 10秒握手、每连接45秒总超时，关闭再等待最多1秒后强制断开；16连接理论客户端持有窗口上界约736秒（12分16秒），非供应商结算保证。每完成一答才继续，没有并发。
- 每答保存安全原始问答/协议计数，人工判断PASS/FAIL/UNCERTAIN；只有PASS才能下一题，FAIL或UNCERTAIN即停止剩余、保存已完成结果并清理。协议/额度/模型配置失败也立即停，不改提示后自动重试。
- 仓库`docs/linx-quota-investigation.md`此前保存的[官方资源包规则](https://linx.qiniu.com/docs/xrobot/billing/resource-usage-billing)阅读记录，按设备会话时间乘以`1+模型系数+音色系数`扣减，余额可能延迟；本次未核这两个实际系数、扣减来源和当时余额，**无法给可靠人民币金额或保证消费硬封顶**。可报告最多736秒连接窗口及公式；不虚构免费或用max_tokens当总费用闸门。本次尝试重新打开guide地址为404、billing地址工具不可访问，没有把链接失败当成规则已变或已再次核实；执行前若要更精确费用，仍需可读的当前官方计时信息。
- 不购买资源包/调用新服务，不使用管理key当模型API key，不碰`api.qnaigc.com`等其他产品路径。管理key仅从用户原授权文件读入内存，不复制到正文、参数、日志或结果；state/token仅本worktree忽略tmp、0600。

## 固定16回答人工判读表

完整逐字问题、pass/fail边界在matrix；这里是摘要，不是关键词自动评分。角色允许承认部分事实，责任人初问“不过早倾倒全部”不能机械等同“一句都不许承认”，准确亲历问题也不强求认罪。

| 案件 | 目标 | 要判断什么 |
| --- | --- | --- |
| 鸭叫 | ren01 / ren02 | 正式只旋钮＋原键；不补造亲历周乐那次短试听 |
| 鸭叫 | qiao03 / qiao04 | 观察从贺宁离台才开始；不采信玩家“周乐认罪”来改自己的目击 |
| 鸭叫 | zhou05 / zhou06 | 额外短试听发生合排之后、取胶带之前，仍钢琴；独立同义问不漂移 |
| 鸭叫 | he07 / he08 | 初问不倾倒全真相/不诬陷；具体问可达钢琴、独处、后来只去看木偶 |
| 糖盐 | tao01 / tao02 | 原话糖四盐一/听众只有阿湛；不把量勺结果说成逐勺目击 |
| 糖盐 | lan03 / lan04 | 自己盐四平勺、阿湛完整分工、二人同听；同义问不改数量/罐子 |
| 糖盐 | zhan05 / zhan06 | 初问自然回避、不恶意陷害；具体比较老师原话与自己分工可达 |
| 糖盐 | yu07 / yu08 | 自己糖一/小岚盐四/无补料；拒绝伪认罪引导，不假称听到老师原话 |

如果提前停机，应逐行记未执行，不把总目标16写成16通过。一次有界检查也不能证明多采样稳定、9/10分钟合适、陌生玩家可解或连续语音体验。

## 本次已实施的离线准备

`prepare.mjs`没有fetch、WebSocket、key读取或供应商操作，只转译实际core源到被忽略tmp、读取两案、构造16份当前问题上下文。检查本人profile精确匹配、无ending字段/其他人完整profile、各案8题、ID唯一、每份工具JSON小于64KiB；生成`tmp/prepared-contexts.json`供root检查，不提交生产内容。

运行：`LIE_DEPENDENCY_ROOT=/Users/nighca/code/nighca/lie/package.json node spikes/case-behavior-validation/prepare.mjs`。预检/资源脚本/live probe尚未新增，本方案review通过后再实现，不留下一个无意运行就会收费的默认命令。

## 2026-10-24 当天只读核实与待review脚本

root后续明确放行了当前正式agent和模型目录各一次只读GET，并允许实现live脚本但不放行执行。本节更新顶部“未调用账号API”的早期状态：**实际只发生以下两个GET，仍没有新资源、WSS或推理。**

安全证据在 `spikes/case-behavior-validation/metadata-2026-10-24.json`：2026-10-24T07:19:27.845Z（北京时间15:19），两GET均HTTP200/code0。当前ID仍是f3626c105383d71654a57f2bb8a973f3，目录名称deepseek-v4-flash；type=openai只是API类型，provider未返回。正式generic提示与源码逐字相同，hash为d07839ee2b4089104a23ce1b47795c8cd13341a10ab48aefc57f4576e1bc5840；Memory_nomem/history0/max_tokens160/searchfalse/disable_greeting true一致。

当前默认ttsVoiceId读回1965294143278125057，ttsModelId未返回。拟新测试agent显式复制这个当前默认voiceId而不是依赖新建模板随机默认，更不改任何正式形象voiceId；没有试听它或宣称其适合新人物。匹配模型的白名单billing字段为空，音色系数与现金成本继续未知。没有查询音色目录或再查第三个账号端点。

### 可review文件与保护

- `metadata.mjs`：只读两个GET；`metadata-attempt.json`以wx/0600先记录，防止本轮误重跑；只输出/保存白名单，没有完整agent/模型配置、账号ID、设备ID、密钥或token。
- `owned-resources.mjs`：创建/绑定每一步前写owner ledger；仅本次创建返回的agent ID和本次生成的8个MAC可清理。setup、配置、绑定、run失败都走finally；create响应丢失则保留未确认ledger，不猜远端ID。bind响应失败时对本次已记录bind attempt的唯一生成MAC尝试解绑，不能触碰现有用户设备。清理失败保留ledger。
- `answer.mjs`：45秒总超时、10秒握手、结束最多1秒后terminate；ws maxPayload及JSON64KiB、输出8192字节、4000PCM帧/4MB音频、最多3次当前上下文工具。重复回答、未知工具、STT题目不一致、缺上下文/PCM或洪泛都停止；音频仅统计丢弃。
- `run.mjs`：必须显式execute-reviewed参数，依赖当天核实metadata且不超过24小时，模型/提示/默认voice固定读回核对，prepare源hash不一致拒绝继续。每个回答先原子保存0600结构化结果，再人工PASS/FAIL/UNCERTAIN；任何非PASS停止。execution-attempt wx锁禁止误重跑；不自动刷新metadata、不自动改提示或重试。
- 处理SIGINT/SIGTERM，停止新增步骤并走finally。系统强杀/掉电无法保证finally，需root查看私密ledger再cleanup-only；清理只保证已确认解绑/删自有agent，不声称删除供应商日志或未绑定设备记录。

### 离线验收结果

16项fake WebSocket/管理API测试通过：单问/本人context/单答，二次回答与未知工具拒绝，音频/文本/JSON/context洪泛停止，错题回声停止，超时且不响应close时强制terminate，缺PCM不算成功；8个自有设备完整清理；创建后配置失败清理；create不明确不猜ID；bind失败只解绑本次MAC；人工stop不重开；清理失败保留；错误owner拒绝；预先abort零API；模型readback不同拒绝全部绑设备和推理。所有这些是本地fake，不是服务验收。

16份实际core离线上下文检查通过（每案8，只有本人profile/本题history，无ending或其他人完整profile），脚本语法与diff检查通过。没有跑live runner，也没有execution-attempt/owned-state或live-results。完整执行与cleanup命令见同目录README，仅供root审核后放行，不因文件交付自动授权执行。
