# 路演 v4：工程协作与动画技术证据

2026-11-02，只读调查与聚合统计。唯一新增文件为本文，未修改现有演示源/产物、Git refs、应用、服务或provider；未读取聊天正文或凭据。以下数字是冻结快照，不随后续制作自动增加，也不代表正式稿已获用户最终验收。

## 可直接对外使用的三项数字

建议工程页同屏呈现：**952 commits / 33 项目 Chat / 142 子代理会话**。

页脚可用：“Git截至bb5fe51；Chat/子代理为本机项目元数据聚合，2026-11-02 20:54（北京时间），排除自动审批记录。”

| 指标 | 本次实际结果与口径 | 不能推导什么 |
| --- | --- | --- |
| main可达提交 | `bb5fe51c641d65b61593aa5e820072f81d1350f2` 可达 **952** 个提交；其中v1.0.0可达785，之后167；无merge commit | 不是952项需求、生产功能、纯代码提交或项目历史所有尝试；包含docs/tests/集成提交，受squash/cherry-pick影响 |
| 项目Chat | 本机Codex `threads`元数据，精确Git origin或精确项目根筛选，`thread_source=user`为11、`agent_created_thread`为22，合计 **33** | 是顶层Chat记录，不是33名人类或33种模型；不承诺覆盖其他设备、已删除记录或更早未留本机数据的Chat |
| 子代理会话 | 同一筛选，`thread_source=subagent`为 **142**；其source均含显式`subagent.thread_spawn`，`thread_spawn_edges`对应child数量同为142 | 是委派子代理会话记录，不是142个同时在线的Agent、142名独立开发者或142次工具调用；同一会话多次follow-up不新增记录 |

同范围另有1342条`guardian_review`记录，**全部排除**，不能混成业务Worker数量。33＋142＝175个非guardian项目会话只是两类记录之和，不宜另外包装成第三种“Agent总人数”。Git作者共享身份，不能从author数量统计实际Agent；当前live agent inventory也不是历史总量。

这三项呈现工程活动与协作规模，**不构成提效倍数、劳动生产率或因果证明**。减少人类逐项调度负担是下面组织方式的作用解释，没有对照实验或量化收益。

## 冻结聚合快照

```json
{
  "observed_at_utc": "2026-11-02T12:54:21.289006+00:00",
  "observed_at_asia_shanghai": "2026-11-02 20:54:21",
  "git_main_sha": "bb5fe51c641d65b61593aa5e820072f81d1350f2",
  "git_reachable_commits": 952,
  "git_v1_0_0_reachable_commits": 785,
  "git_since_v1_0_0_commits": 167,
  "git_merge_commits": 0,
  "local_metadata_selector": "exact nighca/lie origin OR project_id with exact /Users/nighca/code/nighca/lie root",
  "thread_source_counts": {
    "user": 11,
    "agent_created_thread": 22,
    "subagent": 142,
    "guardian_review_excluded": 1342
  },
  "top_level_chats": 33,
  "explicit_spawn_sessions": 142,
  "matching_spawn_edges": 142,
  "non_guardian_records": 175,
  "human_or_agent_active_work_hours": null
}
```

## 统计方法与隐私

Git统计固定完整SHA，不用会前继续变化的main。实际运行：

```sh
git rev-list --count bb5fe51c641d65b61593aa5e820072f81d1350f2
git rev-list --count f8c4e2b5d908538e76e60d4d9ddba39da2c30d13
git rev-list --count f8c4e2b5d908538e76e60d4d9ddba39da2c30d13..bb5fe51c641d65b61593aa5e820072f81d1350f2
git rev-list --count --merges bb5fe51c641d65b61593aa5e820072f81d1350f2
```

会话来源为本机`/Users/nighca/.codex/state_5.sqlite`，以SQLite `mode=ro`连接；只读schema、归属和聚合字段。使用字段：`threads.id/git_origin_url/project_id/thread_source/source/created_at`、`project_roots.project_id/path`、`thread_spawn_edges.child_thread_id`。没有读取`first_user_message`、`preview`、rollout内容或任何凭据；不将逐条ID、标题、source JSON、路径列表或原库导出入仓。

可复核的sanitize脚本如下，只输出聚合。创建时间上限固定到快照秒，防后来新建会话进入；记录删除、后续来源修正或项目归属调整仍可能使以后重跑不同，**不能把本机可变数据库伪装成不可变原始快照**。本文保留本次聚合结果，未复制私人数据库。

```python
import collections, json, sqlite3

db = sqlite3.connect(
    'file:/Users/nighca/.codex/state_5.sqlite?mode=ro', uri=True
)
db.execute('BEGIN')  # one read snapshot, no mutation
project_ids = [r[0] for r in db.execute(
    "SELECT DISTINCT project_id FROM project_roots WHERE path=?",
    ('/Users/nighca/code/nighca/lie',)
)]
origins = (
    'git@github.com:nighca/lie.git',
    'https://github.com/nighca/lie.git',
    'https://github.com/nighca/lie'
)
selector = 'git_origin_url IN (?,?,?)'
params = list(origins)
if project_ids:
    selector += ' OR project_id IN (' + ','.join('?' * len(project_ids)) + ')'
    params += project_ids
selector = '(' + selector + ') AND created_at <= ?'
params += [1793624061]
rows = db.execute(
    'SELECT thread_source,source FROM threads WHERE ' + selector, params
).fetchall()
counts = collections.Counter(r[0] for r in rows)
explicit = 0
for kind, source in rows:
    if kind != 'subagent':
        continue
    try:
        explicit += isinstance(json.loads(source).get('subagent', {}).get('thread_spawn'), dict)
    except (TypeError, ValueError, AttributeError):
        pass
edges = db.execute(
    'SELECT COUNT(*) FROM thread_spawn_edges WHERE child_thread_id IN '
    '(SELECT id FROM threads WHERE ' + selector + ')', params
).fetchone()[0]
print(json.dumps({
    'top_level_chats': counts['user'] + counts['agent_created_thread'],
    'user_chats': counts['user'],
    'agent_created_chats': counts['agent_created_thread'],
    'subagent_records': counts['subagent'],
    'explicit_thread_spawn_records': explicit,
    'matching_spawn_edges': edges,
    'guardian_review_excluded': counts['guardian_review']
}, ensure_ascii=False))
db.close()
```

初次本轮统计不带created上限，但在同一20:54时点读到上述数值；上限用于将来复核，不是声称已归档每条私人原记录。本轮额外核实精确origin与“origin或project”两种筛选结果相同，项目根精确匹配一个project。

## Git历史与squash边界

最早当前main可达根提交为`dfefc9f68a40447914be4863e2128956434fe058`，作者/提交时间2026-10-23 15:28:52 +08:00。统计截止提交时间为2026-11-02 20:09:06 +08:00。这只是提交记录的**自然日期跨度（10月23日至11月2日）**，不是十天满负荷工时或实际项目启动时刻。

v1.0.0 tag为`f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`。实际仍可读取的旧尾链为：

```text
f8c4e2b → 914dc99ad0172cbd6d862a82095bbb8b96347fbb
        → ca7f37f9c04530e124ade2e38c4f3f8d9bcab7df
        → b6ea40990f5445e327fe63a4ce9f44ba67600b8c
```

当前main使用`60c11f72b71ead4b8e744f2281d5dbecb796d11a`直接接在f8c4e2b后。`b6ea409^{tree}`与`60c11f7^{tree}`实际完全相同，均为`6c90c5a1486db6ded1e2d2533acb2120665d12c2`；旧三提交内容被同树单提交表示，旧对象仍能只读取得。60c11f7到统计截止另有166个可达提交，785＋1＋166＝952。

不要把旧三提交、当前squash、各专项cherry-pick源提交相加称总产出；`git rev-list --all`还包含候选、测试、旧分支等，不是main可达口径。当前33/142会话也不会与Git提交逐一对应，不能用每会话平均提交推效率。

## 工作时长：本轮不给数字

当前可得的Chat `created_at/updated_at`只是存在/更新跨度，包含闲置、等待、用户发言和跨任务并行；相加会重复并行时间。rollout或工具耗时亦不能完整代表思考、人工决策或实际有效工作。没有统一可靠的全项目人/机活跃工时台账，也没有无AI对照组。

因此人类工时、Agent总工时、节省工时、提效倍数均记为**未统计/不可可靠估计**。如果需要呈现时间，仅可在备注说“提交记录跨越10月23日至11月2日”，不把自然跨度改成投入工时或“X天完成全部开发”。

## Router–Worker：已采用机制及对外表述

这里的Router/Worker是对已采用协作职责的概括，不是声称项目部署了同名Agent SDK组件。主模型应为：**人类确认目标和关键设计；Router拆分/分发；Workers执行并交证据；Router审查、协调依赖、串行集成并回到人类确认关键决策。** 不画成每位Worker都需要人类逐项直接指挥。

| 环节 | 仓库实际依据 | 可对外讲的含义与边界 |
| --- | --- | --- |
| 人类设计与确认 | `AGENTS.md` Ownership/decisions；`docs/architecture.md`；视觉方向与本轮pitch确认记录 | 每项需求先澄清目的/范围、设计方案，再按所需确认落地。关键玩法/架构/视觉由人决策；例行实现和已授权迭代不必每次重复审批 |
| Router收口与分工 | AGENTS intake/scheduling、delegation责任、central project plan与cross-chat handoff | Router维护队列、接口和owner，让人面对少量重要决策与可审成果；降低逐Worker管理负担是机制意图和组织效果解释，不给量化减负百分比 |
| Worker隔离执行 | 独立worktree/branch、允许文件、reviewed base、依赖、完整交接要求 | 独立执行包含代码/配置/验收，不把耗时尾巴全留给Router；发现接口/资源冲突及时升级，routine结果批量交付 |
| 接口与审查 | `docs/animation/contract.md`、production workflow；AGENTS implementation/handoff | 契约连接资产/运行时；Router/发起者实际读完整diff、周边代码和素材，不只接受通过测试的summary；委派不转移责任 |
| 串行集成与真实验证 | AGENTS daily integration/publication；结果页/WebMCP/first-use-help验收与交接 | 唯一integrator在新候选cherry-pick后组合检查，main普通快进/push；自动化、浏览器和真实provider分开，保留失败及未验范围 |

可引用一个具体的“先设计再落地”案例：`docs/design/result-page-ui/README.md`记录用户先要求增强成功情绪、再确认动效与成功/失败按钮优先级，实施者据此调整、测试与浏览器检查，用户接受后交root review/集成；没有把最初方向批准等同最终页面已通过。另可用WebMCP候选被用户否决、改直接表单工具并再次验收的文档，说明设计先行也包含反馈修订。

工程页可用概括：“人把握方向，Router管理依赖和验收，Workers独立把事情做完；结果回到审查与验证，再进入主干。”不说完全无人开发、每次都零沟通或不再需要人类判断。

内部AI开发采用独立worktree直接审查集成、不常规开PR。作者向官方投稿与外部贡献PR/全栈隔离预览是另一入口；现有PR预览可作验证工程例子，但不能据此把Router–Worker画成所有Worker提交PR的流程。

## 自研骨骼动画规格和引擎：技术页可用边界

可直接讲：“我们自研了一套轻量2D骨骼动画数据规格与Canvas播放器。不同人物用相同契约描述部件、层级、枢轴、轨道和状态，运行时复用同一引擎；形象与案件内容分开。”

| 能力 | 实际实现 | 不宜宣称 |
| --- | --- | --- |
| 数据契约 | `packages/character-animation/src/types.ts`、`package.ts`：版本1/2，位图assets、父子nodes、transform/visible、linear/step轨道、clips/states/transitions；严格字段/引用/数值/父链检查 | 通用任意3D骨骼、自动生成所有动作；旧v1文档不覆盖后来的v2结果态 |
| 采样与播放 | `playback.ts`：确定性采样、循环、显式单次过渡、中断及数字通道fallback settle | IK、网格变形、自动bitmap morph或自然抬手自动推导 |
| 绘制与加载 | `canvas.ts`及`load.ts`：Canvas2D层级变换、绘制次序、裁切/遮罩，尺寸/预算校验、取消与资源生命周期 | GPU性能已量化领先、任意资源无限加载或浏览器内存硬上限保证 |
| 产品对接 | `AnimatedPortrait`消费包与状态，静态回退、减少动态；四基础态及可选正确/错误结果态 | 实时中文音素/真实口型同步，表情测谎或心理判断 |

源README仍有“schema version 1”的旧文字，**本轮以实际types/parser支持1/2为准**；不为路演改库文档。八套预设及实际动画包提供复用实物，但不能把当前八人的验证推广到所有未来人物。

技术放置建议依本轮用户要求：游戏架构/内容规则、骨骼规格与引擎、最后WebMCP创作链。WebMCP是产品给用户Agent的页面能力；工程Router–Worker则是开发本产品的协作方式，两者分开叙述。

## 证据文件与本次验证范围

已读：`AGENTS.md`（含main版本）、`docs/animation/{contract.md,production-workflow.md}`、`packages/character-animation/{README.md,src/types.ts,src/package.ts,src/playback.ts}`、`docs/design/result-page-ui/README.md`，及前轮已读main的WebMCP直接编辑/首用帮助最终交接、PR预览真实验收。Git统计与SQLite聚合是本轮实际执行；本文没有重跑应用测试、播放人物/视频或调用真实模型。

提交数字按固定main SHA；聊天数字按明确本机元数据snapshot，两者时点和来源独立。所有公开化只保留汇总、方法及项目内源指针，无用户私有聊天正文、身份凭证或数据库副本。最终演示若采用三数字，应保留口径备注，不能从其大小推断效能。
