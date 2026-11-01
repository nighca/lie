# 《这条线你真走了吗》环线案

2026-11-01。用户已在PR preview验证后最终确认：“这局时间4分钟调整6分钟，其他没问题，可以推进合入（本地常规流程，PR可close）；本地测试环境干掉。”当前正式额度360秒，用户已授权按本地常规流程交总协调review/集成；root已按用户授权关闭PR4，不等待新preview，不为本轮6分钟变更推送到远端触发无用preview。执行子代理仅准备最终dirty变更与验证，不stage、commit、push或更新main。早先明确PR授权覆盖通常no-PR约定的历史仍保留在下文。

## 已批准内容与作者默认

[唯一正式内容](../../content/games/02-hiking-loop.json)。三名朋友上午从村口沿溪穿林地，到半程休息点共同午餐后才分开，最后都回村领完成纪念章。小岳实际在半程原路折返，照旧攻略虚构后半段；阿宁和老赵确实走完。正确目标`yue`。三人复用ochre-freckles/coral-bob/salt-pepper-beard；原共享240秒是最初作者默认；用户验收后明确最终改为360秒，剧情、角色、答案和顺序保持不变。

先前“登顶”方向被用户纠正为本次环线；root另行保存[已被替代的登顶原稿](previous-summit-draft.md)，来源和替代状态见该附件。本执行子代理没有补写或伪造未收到的旧原稿。最终明确无登顶、地图/海拔计算、搜证或专业术语。

## 解法、自然入口与漏洞边界

午餐后的原木桥当日整日封闭，实际必须沿所在岸向下游绕到另一座小桥过溪，再沿对岸回村。阿宁记得绕路鞋进沙，老赵独立记得绕行起点和真正过溪处；他们没目睹小岳折返，也不知道对方完整经历。小岳说午饭后走原木桥，是旧攻略经历冒充当天。泛问走哪、午饭后、怎么回村、后半段路况/过溪就直接出现线索，不藏在固定口令或反复逼问之后；每次一至三句，不主动拼完解法。

三人上午同行、同一顿午餐后分开，诚实者亲见当天整日封闭告示，消除“他早上走时没封”的时间差解释。小岳不能改口称后来开桥、私自跨封挡、把下游小桥当原木桥、支线捷径也算完成或后来补走。所有人物只讲自己的亲历，不从玩家转述凭空新增事实；不提供照片录像/地图定位或新目击者。玩家无需取得认罪即可正确指认。封闭与绕行是本虚构故事的固定事实，非真实出行建议。

## 隔离与交付边界

新WT `/Users/nighca/.codex/worktrees/lie-hiking-case/lie`，分支`codex/lie-hiking-case`，核对初始干净HEAD/base为`35e987a7516493dcdccb8392cb8817f3b82744e4`，remote为`git@github.com:nighca/lie.git`。旧江苏与8b07工作树不改；本WT `01-jiangsu-local.json`字节保持不变。旧02–05四案仅前缀顺移为03–06，ID/内容/URL和原相对顺序保留。首页/开局自动发现，不改通用UI、engine、voice接口/配置、workflows或依赖声明。project-plan由root另行维护。

用户PR3另有未合入05编号内容，DO NOT MERGE；本任务不修改该PR。旧四案顺移与该PR未来如何编号，由总协调集成队列另议，不默认合并或改写他人内容。

## 早先4分钟版本的环境与验证（历史）

独立npmci和本WT构建缓存，显式Node24.22.1运行时。仅从既有已验证缓存复制固定libwebp工具和衍生images，构建核编码器/输入/alpha/输出hash与策略，不链接旧node_modules、不复制secret。Web全测试46文件/437项、Web类型检查和生产构建通过；新内容3人/240秒/正确目标/上下文隔离/状态与真实首页第二位入口均被自动化覆盖。最终入口`dist/assets/index-CVW-BFbL.js`，postbuild8预设/121资源通过，82份图像缓存命中；diff-check通过。构建不代表真实语音/模型验收。

本专项未启动本地服务，没有占用端口/PTY消费者；不打开真实浏览器案件，不prepare/bind/WS/mic/provider。用户后续通过PR preview亲自验收，当前fake/内容检查不证明真实模型表现。执行子代理不stage/commit/push/createPR；rootreview前无新增有序SHA。


## 内容身份与最终交付清单

对起始base逐字节核对下列旧包，全部相同；只有四个文件名的编号顺移。

| 当前包 | SHA-256 |
| --- | --- |
| 01-jiangsu-local.json | c8beefddac8e680caba7c8d2b18c55524c832f49a38432664fae47211bd4c1c8 |
| 03-empty-medal-box.json | 8e13af7c7f4897c6c1031a277d1a5ba9adf67ddb3f2a56ef0b524617c13d6e3a |
| 04-duck-finale.json | ae2276d967942081f776740f6cdc7587e5413709d2120ea490c68274720dd98a |
| 05-salt-sugar-mixup.json | b032af22556be1bfefe548881ca00a014101906d498869bab73bb076c2848522 |
| 06-hackathon-old-project.json | 538e75a73e03f159ee84dcfa8d18ba016afd268ba515d06be47d592b9ae6e790 |

新案`02-hiking-loop.json` SHA-256 `f17502970907126fe6c80069783abbfeb08b642ad88c343f8ca3c17ebbc3a1f2`。

修改范围：新案JSON和四旧案rename；新`hikingLoopContent.test.ts`、首页真实目录/第二入口测试、两旧内容测试import路径；中英README与Web README当前目录说明；两旧案设计文档仅当前链接与编号说明；本目录的当前案设计/验证及root保留的登顶稿。没有改江苏JSON、通用产品源码、workflows、依赖声明或锁文件。历史文档其他旧路径不全局重写。

上述交付状态对应早先4分钟版本：当时由root review提交并创建PR4，随后CI/preview成功，用户通过该preview验收；不把这个历史阶段的“待preview/无commit”表述当作当前状态。当前继续按本页首段最终6分钟授权，由总协调本地review/集成，root可关闭PR。

最终JS SHA-256 `092af2163f4d5014219a769625cc53c28e9dc8cc853a837f1a038f0720d43c5d`。

用户后续要求更换姓氏：当前案中“老许”统一改为“老赵”，人物ID保持`xu`；仅改姓名及其文本引用、已有测试预期和本说明。旧登顶提案保留原名，属于历史设计。本轮相关5项内容测试、JSON解析与纯更名差异检查、diff-check通过；原全套检查与构建为更名前记录，不冒称本轮重跑。


## 最终6分钟版本与环境释放

本轮起始源为`977911349177342da520f3cf5a68da52dc1e3c73`，初始clean；本轮产品JSON仅`interrogationLimitSeconds`从240改360，剧情、人物、正确答案和目录顺序逐字段相同。对应内容测试起始360000ms、三人各20秒后300000ms；双语及Web README只同步本案6分钟与已接受状态。新JSON SHA-256 `dbc58af023407ed106cf44a77f2ff83ff6c3c493b1e827b58c0634b857d4227b`。相关内容/首页测试3文件/16项、Web类型检查与最终build均通过（入口`dist/assets/index-CL5bFhFz.js`，postbuild8预设121资源、82图缓存命中）；diff-check和仅时长产品diff检查通过；不重复早先已过437项全Web检查，不把4分钟构建身份冒作本轮最终身份。

本徒步专项从未启动本地服务。用户要求撤本地环境后，本轮只读发现5544的PID64673属于`/Users/nighca/.codex/worktrees/a92e/lie/apps/web`，登记owner为首次帮助Chat01a19748、分支`codex/first-use-help-assessment`、原PTY63756，仍有独立用户体验consumer；它不属于本徒步专项。总协调已明确确认该owner与consumer仍保留；本案没有自建local server可停，不停止/重启其他owner服务，也不再继续调查其用户状态。未触碰8787/8788或其他服务，不刷新/关闭用户tab，不调用provider。

本轮最终JS SHA-256 `aaaa8349e5688d26ba045e44bf9fb9c2b37a1f032a17fdf29b0dafc50a3e8324`。执行子代理未stage/commit/push；当前6文件dirty交root实际review及本地提交，再由总协调按常规review/候选集成流程处理。
