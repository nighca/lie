# 编辑器向官方案件库投稿：可行性与分阶段方案

2026-10-24；只读调研。基于已review仓库 `e6bdf7352bff917e23229ed2fd67d77c9296c93c`。编辑器本体已另行获准开发；**本文没有注册GitHub App、创建fork/分支/commit/PR、请求登录授权或修改任何工作流和产品代码**，自动投稿方式仍待用户选定。

## 建议先做什么

建议第一阶段按钮叫 **“投稿到官方案件库”**，实际流程明确为：校验并复制/下载案件JSON → 打开GitHub新建文件页 → 作者在GitHub完成登录、fork/commit和创建PR → 维护者review故事及测试 → 合入后发布。它没有给LIE增加账号数据库，也不接管用户GitHub token；**不是点击即自动创建PR**。

完整JSON不放URL：本仓首案实际9,280字节UTF-8，用`URLSearchParams`放进`value`后，构造的链接是27,101个字符。这里只在本地计算长度，未发往GitHub；已经足以说明长URL不能作为正式稿件传输方式。下载和粘贴不依赖这个长度。

GitHub存储fork、commit、PR和review，本地编辑器只处理草稿；“无自建DB”不表示整个流程没有云状态。若用户需要的是授权后直接在产品里生成PR，可以复用薄Worker承担GitHub凭据交换/调用，不一定需要传统backend或数据库，但属于新增授权与写入能力，不能先按纯链接按钮偷换实现。

## 官方能力：预填页面与真正创建PR的区别

### 新建文件页

GitHub[官方博客](https://github.blog/news-insights/creating-files-on-github/)明确介绍了新建文件URL的`filename`预填。候选入口形态如下，文件名需校验后再编码：

```text
https://github.com/nighca/lie/new/main?filename=content%2Fgames%2Fmy-case.json
```

打开这个页面不会自动提交文件、fork或PR。GitHub[创建文件文档](https://docs.github.com/en/repositories/working-with-files/managing-files/creating-new-files)说明：没有目标仓写权限时，GitHub会帮助用户fork并在commit后向原仓提PR；作者仍需确认文件内容、提交和PR。拥有目标仓写权限的人也应主动选新分支并走投稿review，不能因此直接写main。

**`value`等参数的证据边界：** 本轮没有找到与`filename`同等级的GitHub正式文档承诺“任意JSON通过`value`可可靠预填”。没有以社区讨论或经验当正式接口，也没有在用户账号里实测。`value`不能作为首版必需依赖；即使个别情况下可用，也必须保留复制/下载粘贴，并面对URL上限。`message`、`description`同样不在本轮认定的稳定新建文件契约内。

### 外部贡献者实际步骤

1. 编辑器校验当前JSON，展示即将公开投稿的内容，复制文件正文；下载作为跳转和登录过程的保底，避免草稿丢失。
2. 点击上述新建文件入口，作者在GitHub登录；需要时由GitHub引导fork到作者账号，或作者先手动fork、在fork创建主题分支再添加JSON。
3. 粘贴/上传正确文件，检查路径和内容，commit到作者拥有写权限的分支。
4. 用GitHub的Compare & pull request进入原仓；确认base是`nighca/lie:main`、head是作者fork的主题分支，补简介后点击Create pull request。
5. 创建PR成功才算投稿已提交；“已打开GitHub”或“文件已下载”不显示成“已提交成功”。维护者review/接受后才能成为官方案件，并非PR一建就上线。

这些步骤依据[从fork创建PR](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork)。原仓的公开可读性不授予作者在原仓创建分支的权限。

已存在分支后，GitHub[正式支持compare URL参数](https://docs.github.com/en/enterprise-cloud%40latest/pull-requests/reference/using-query-parameters-to-create-a-pull-request)预填`quick_pull`、`title`、`body`等：

```text
https://github.com/nighca/lie/compare/main...AUTHOR:submit-my-case?quick_pull=1&title=Add+my+case
```

这只能为已有差异预填PR表单，不会凭JSON自动造出head分支或commit。官方也说明URL超过服务端限制会返回414；本轮未发现可承诺跨浏览器/代理一致的具体最大字符值，因此不写成“固定8KB/32KB”。

## 真正自动创建PR：三种路径

GitHub[创建PR REST端点](https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request)需要已经有可比较的head/base；细粒度令牌要求Pull requests写权限。文件写入还需要相应仓库的Contents写权限，不能只申请“登录身份”就宣称可投稿。REST的[跨域支持](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)与GitHub网页登录态不是一回事：浏览器可以在拿到合适token后调API，但LIE不能读取或借用另一个域名的GitHub登录Cookie。

| 路径 | 真正需要的权限/工具 | 能否无自建DB | 主要区别 |
| --- | --- | --- | --- |
| GitHub网页辅助投稿（推荐首期） | 用户在GitHub拥有账号、自己的fork/分支；LIE无token、无App | 可以，甚至无需新增Worker逻辑 | 多几步但授权面最小，明确不是自动PR |
| OAuth App代表用户写其fork并创建PR | 注册OAuth App、作者同意权限、Worker保管client_secret并交换token，API完成fork/分支/文件/PR | 可以设计为短时会话，不建长期账号库；仍有瞬态认证状态与GitHub云状态 | 保留作者fork身份；授权权限与跨fork流程复杂，无法只用纯静态页面加PKCE草率完成 |
| GitHub App作为投稿机器人 | 仓主注册并仅向指定仓安装App；Worker保管私钥，短期installation token，限定Contents/Pull requests写权限 | 不必自建DB，GitHub保存提交记录；公开入口身份/防滥用、重复提交策略仍要设计 | 在官方仓候选分支发机器人PR，不依赖每个作者拥有fork；提交者身份、署名与可追溯性必须另行明确，不能匿名开放仓写代理 |

### OAuth、PKCE与Worker的实际边界

当前 **GitHub.com** [OAuth授权文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)已经支持`code_challenge`/`code_verifier`及S256；但同一文档仍将web flow换token时的`client_secret`列为必需。不能套用部分旧Enterprise Server文档的“GitHub不支持PKCE”，也不能反向推导“支持PKCE，所以可以把secret省掉”。授权端点的CORS限制也不能用REST API的CORS支持来代替。

工程上可以在现有Worker增加OAuth回调：浏览器发起授权，Worker保管secret，校验state/PKCE并换token，再由Worker执行白名单GitHub操作。只需短时投稿时，可用加密、HttpOnly、Secure、SameSite且过期受控的会话Cookie携带小体积认证状态，或采用其他已review的瞬态状态方案；**这是可行设计推断，本轮没有实现或证明完整安全性**。案件正文留浏览器草稿，回调后再明确确认发送，不塞进OAuth state或Cookie。

这样不强制引入D1、DO或传统账号DB，但不承诺完全无状态：state、PKCE verifier、token寿命、同源请求校验、撤销和重复请求都必须有明确归属。若要跨设备恢复、后台重试、长期刷新令牌或严格去重，可能需要额外持久状态，应再讨论而非藏在“薄网关”里。

OAuth [scope文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)区分`public_repo`与含私有仓能力的`repo`。不要为故事投稿无条件申请私有仓访问；同时[Contents端点](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)当前对classic/OAuth列的是`repo`，因此本轮**不保证public_repo一定覆盖拟选全部API**，选型后必须逐端点核验/最小权限实验。GitHub App则以仓库权限和安装范围限制，不用OAuth scope字符串替代。

Device flow虽然不要求client_secret，但官方定位于无浏览器/受限设备，并[不建议无理由启用](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)；也没有因此验证浏览器端完整交换可行。它不是为了省Worker就默认采用的首版捷径。

### PAT能不能省掉OAuth

有合适PAT时，浏览器理论上可直接通过REST CORS完成授权API调用，不必为此强制建Worker或DB；但这变成让作者手工创建并交给网页敏感token，体验与权限风险都高于原生GitHub提交流程。[官方PAT说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)也明确细粒度PAT目前对“向非成员的公开仓贡献”仍有限制；不能因为某个Contents/PR端点接受fine-grained token就保证整个外部fork投稿链路支持。

因此不推荐普通玩家首期粘贴PAT，更不会把仓主PAT放进前端、URL、JSON稿件或共享本地存储。App注册/安装、用户授权、目标仓写入都要另获明确范围确认；本调研没有执行这些动作。

## 提交什么数据，才能真的成为可玩案件

当前真实仓库有三处配合：

1. `content/games/<id>.json`是故事源；结构为id/title/background/interrogationLimitSeconds/characters/ending，角色profile纯文本，appearanceId关联预置资源。
2. `apps/web/public/games/<id>.json`是Web运行时fetch读取的静态副本；只加故事源不会被当前运行时自动发现。
3. `apps/web/public/games/index.json`是首页目录，条目为id/title/**summary**/interrogationLimitSeconds；summary并不存在于当前GameDefinition中，不能从故事源自动“读出”未提供的字段。

当前没有自动生成上述副本/目录的脚本。现`staticContent.test.ts`会遍历已有目录并核其内容，却不会发现一个只新增源、从未进目录的稿件；只有首案源/副本另有直接import对照。当前CI workflow仅push main与手动触发，**没有pull_request预检事件**。不能告诉作者“添一个源JSON，现有CI就会检查并自动上架”。以上是本次基线代码检查，不排除另行集成中的第二案和编辑器修改。

### 推荐数据分层（提案，尚未实现）

编辑器基础导入/导出继续使用现有游戏JSON，不因官方投稿新增强制运行字段。投稿可另外收集一段公开summary与可选署名，形成这样的本地提交材料：

```json
{
  "submissionVersion": 1,
  "summary": "不泄露责任人的一句案件简介",
  "authorDisplayName": "作者希望公开显示的名字",
  "game": {
    "id": "my-case",
    "title": "案件标题",
    "interrogationLimitSeconds": 600,
    "background": "公共背景纯文本",
    "characters": [
      {"id": "a", "name": "甲", "appearanceId": "coral-bob", "profile": "角色完整设定纯文本"}
    ],
    "ending": {"culpritId": "a", "reveal": "成功指认后的说明"}
  }
}
```

这是可review的投稿封装候选，**不是新的已批准游戏schema**；示例只说明形状，不是有趣的单人案件。game部分可独立导出试玩，summary/署名不混进NPC背景，署名不默认收集真实姓名或邮箱。

最小首期可不落这个封装到源码：作者先提交`content/games/<id>.json`，summary放PR正文，维护者review时补public副本与目录，三处一起通过检查后再合并。这不要求作者手工修改共用index，代价是维护者每篇多一步。若要让“源JSON单文件投稿”在merge后自动发布，先实现并review以下独立内容流水线，而非承诺当前已经会：

- 源目录是权威输入，使用现有validator核合法文本/角色/固定责任人和已注册appearanceId；额外限制稿件slug、文件名与id一致、大小、重名及路径，禁止由用户任意指定写入路径。
- 公共summary仍需显式来源。可选A：维护者控制的`content/catalog.json`；可选B：每案单独metadata伴随文件。两者会影响单文件投稿体验，必须选清楚；不让脚本擅自生成剧情简介或偷偷改GameDefinition。
- 确定性脚本由已验证源生成public JSON与首页index，排序稳定；在build前执行，或将产物提交并用CI重新生成后检查无diff。不能只在CI里检查却仍发布旧产物。
- PR增加无生产secret的`pull_request`内容预检，main通过后才沿现有CD部署。不要用带部署凭据的`pull_request_target`执行投稿者代码；[GitHub官方说明](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)明确区分其信任边界。
- 故事review仍检查可解性、角色口径、歧义和用时；schema通过不自动等于官方收录，不自动合并、发布或调用付费模型。

## 需要用户作出的选择

1. 首期接受“跳GitHub由作者完成提交/PR”的无新增授权方案，还是明确要“产品内授权后直接生成PR”？按钮说明会忠实反映这一区别。
2. 若要自动化，偏向作者本人fork投稿的OAuth，还是仅指定仓的GitHub App机器人？后者还需决定投稿者身份、署名和公开入口的使用范围。
3. 先由维护者在review时补副本/目录，还是单独批准内容生成流水线和summary来源？这一项决定“只添加一个源文件”能否最终无手工步骤发布。

仓库现行“内部agent不走PR”约束与用户创作者的外部投稿PR不是同一种协作：当前提案只讨论用户明确提出的外部官方投稿通道，不借机把日常agent集成改为PR。
