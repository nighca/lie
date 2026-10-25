# 邀请码与访问鉴权专项chat交接

2026-10-25，Asia/Shanghai。用户明确要求“把邀请码、鉴权的事情启动一个独立的chat跟进，后续我来跟他聊”，并要求携带两个选中文字问题。主协调据此在已核实local lie项目创建“LIE 邀请码与访问鉴权”，实际chat ID `01a17076-a9f2-7f11-aaf3-7f7c801fee37`，host local。不是主协调轮换，不新建定时任务，不扩大push/部署/secret权限。

## 用户待答问题

1. 选中“语音请求反代到8788”：“我没理解8788的作用”。要求按真实代码解释8787 Web Vite、8788薄Worker、浏览器同源入口、供应商私密凭据和生产同站部署；新增access反代尚待候选接入，不能说main已有。
2. 选中“开发使用独立测试密钥和Cookie”：“一份密钥是跟着一份gateway（worker）配置的对吧？”要求解释每个部署环境配置/验证密钥、离线CLI用对应密钥签发，不是每邀请码一把密钥、不是按端口绑定；开发和生产独立。Cookie不按port隔离、token aud含origin是验证边界；不把配置设计说成已实际设置secret。

用户已确认的14天/共享重复使用/公开浏览创作而play需码/不限频边界，以及按简单度选择新开局与新WS验exp、已连沿180秒、不续局、不存档、不新增到期timer/每局exp标记，均以[现行设计](../../invite-access-design.md)为准。旧版已完整归档。

## 在制实施与所有权

原root下invite_access_design仍负责当前整项（含其Gateway/Web子agent的实际review、组合QA和清理），句柄不自动转移到新chat。新chat先答用户、只读设计与源码并接讨论；root明确释放后再接后续实施/返修/验收协调。不得重复派相同实现、修改原owner dirty文件或复用其PTY发信号。root继续最终review及唯一集成，不将创建chat视为已完成代码验收。

- 父WT `/Users/nighca/.codex/worktrees/invite-access-design/lie`，branch `codex/invite-access-implementation`，base `772dfa5281bda039bbe3e248e4bc81ebcbdf2846`。父负责shared/access token、离线CLI、最终docs/组合QA。原owner采样HEAD3875846 clean，Node7测试及独立createHmac向量通过。转交时实际已推进至7fd76f8，属于正常在制进展，非冻结handoff。
- 当次只读log的有序父链：`80b8557672a671ab585f7bc31a99b17e1ff80619` → `eb2ea3ab176bf05a32c6b6d75bf44d9455581742` → `3875846032ec568039fb179aa165d19cbcce04f5` → `c0b1c3f43ee293dfb1f2949f9000ed2df6739d3b` → `7fd76f8c104428a1d2fc0258886ee8254f91921c`。仅恢复线索，不等于root已审或可直接集成；最终取完整clean交付。
- Gateway子WT `invite-access-gateway/lie`、branch `codex/invite-access-gateway`，源HEAD `076fdc3ffc12663de22df0813785a4338745ecb8`；5files、19workerd测试/type/cfbuild通过，父实际review中。子树有token依赖cherry副本，不重复重放。
- Web子WT `invite-access-web/lie`、branch `codex/invite-access-web`，原HEAD `5c4be6ea5d0be6caf3f5f978d9a44d54b7e987d4`。原9files208测试/type/build79通过；父发现slowreadGame401回intro竞态，access.test.ts/helpers.ts修复时曾dirty，当前已继续推进。不能把原检查当修复后的验证，也不按旧dirty采样清理文件。
- root独占package/lock；邀请码原生Node测试计划 `node --test shared/access/token.test.ts scripts/invites.test.mjs`，root在coverage候选集成后接test:access与主链/CI。无新依赖，不能遗漏这些新增测试。

## 服务、配置和未测边界

5544归原实施owner负责，交接采样尚未启动、无session；随后状态由owner完整交付，使用结束原PTY停止并核无监听。8787/8788用户launchd及5355动画用户检查入口必须保留，不新增随意端口。新chat不自行启停它们。

候选接口ACCESS_MODE默认closed、缺key failclosed；生产INVITE_SIGNING_KEY；dev-only ACCESS_DEVELOPMENT_ORIGIN＋INVITE_DEVELOPMENT_SIGNING_KEY。合main会自动进入用户常驻预览，若缺新配置可能锁play；root须在集成前协调本机独立devkey/service turn，不静默破坏当前环境、不因此擅设生产secret。新chat已收到提醒。真实provider、多用户device隔离、预算和生产启用仍独立，不把fake或代码检查当已验证。

本次已完成创建及完整初始提示/可恢复进度转交，并通知旧执行owner保持当前整项责任；实际代码验收和后续写权释放仍待原owner最终完整批交付。无密钥、token、Cookie或认证header入本记录。

## 后续用户决定：暂缓实施

2026-10-25用户因额外复杂度明确暂停邀请码/访问鉴权实施，chat保留供以后讨论，root继续其他工作。本节覆盖上面的继续实施/后续接写安排：原owner已interrupt，仅执行自有5544/tab安全收尾和暂停handoff；新chat已通知不实施/测试/配置/启服务。全部WT/commit/dirty及已有证据保留，auth实现未main、不随用户本轮已main成果push。rootpackage/CI接线同步后置，须用户明确重启后再排期。
