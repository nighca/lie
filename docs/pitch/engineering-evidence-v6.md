# 2026.10.23–10.25，三天协作记录

2026-11-02 重新统计，用于替换路演旧的952/33/142展示。该调查子任务仅新增本文；所有调查只读，没有修改旧证据、演示源/产物、应用、Git refs或服务，没有调用provider、浏览器或模型，没有读取聊天正文或导出私人数据库。

## 正式展示建议

主指标改为 **785 commits / 97 个 Agent 会话**。97＝14个顶层项目Chat＋83个显式子代理会话。用户要求将二者合计呈现，不能将其简写为97名开发者或97个并发Agent。

另有可选时长指标：**保留运行记录累计约88 Agent小时**，但只覆盖66/97会话，必须同时标注“含工具/等待、并行累加，非有效工时”。缺失31个会话不能估算，不能称为全部97个Agent的累计时长。若版面没有空间表达覆盖范围，建议不在主页面放该时长。

页脚：“北京时间10月23日00:00至10月26日00:00（不含）；固定main可达提交与本机项目会话创建记录，排除自动审批。”

| 指标 | 实际结果 | 明确口径 |
| --- | ---: | --- |
| commits | **785** | 固定`bb5fe51c641d65b61593aa5e820072f81d1350f2`可达、committer时间落入三天窗口的提交，含代码、文档、素材与测试。不是所有任务分支提交或785项需求 |
| 项目Chat | **14** | 本机精确项目归属筛选、created_at落入窗口；3条user＋11条agent_created_thread，均为顶层Chat记录，不是人数 |
| 子代理会话 | **83** | 同范围thread_source=subagent且实际source为显式thread_spawn；80个depth1、3个depth2。对应spawn edge83条，包含记录中的递归子代理，不只统计直属子代理 |

**是否包括所有Agent？不应这么说。** 本机筛选范围内，14个顶层Chat与83个显式委派子代理会话共同覆盖97条可识别的非审批开发会话记录；没有漏掉这次查询里的二级子代理，但排除了853条guardian_review自动审批记录。跨设备、被删除/未保留、项目归属缺失、窗口之外创建的会话均不保证覆盖。不同Chat和subagent都可能由同一模型承载，不能将97称为97名独立开发者或97个同时在线的Agent。

统计的是**窗口内创建**的会话，而非所有“窗口内曾活跃”的会话。对子代理会话的follow-up、暂停/继续、多个turn不另增一条；同名Agent在不同会话里也不是同一个可追踪人员身份。当前live-agent清单无法替代全历史记录。

提交与会话计数说明三天中留下的协作记录，不能据此推出工时、节省时间、效率倍数或“完全自动开发”。下文另以生命周期元数据统计部分可核运行时长，它仍不是有效工时，没有无AI对照。

## 时间与冻结快照

北京时间窗口为 **[2026-10-23 00:00:00 +08:00, 2026-10-26 00:00:00 +08:00)**。Unix秒为`1792684800 <= timestamp < 1792944000`，对应UTC 10月22日16:00至10月25日16:00。

```json
{
  "observed_at_utc": "2026-11-02T15:14:13.175288+00:00",
  "observed_at_asia_shanghai": "2026-11-02 23:14:13",
  "window_start_epoch_inclusive": 1792684800,
  "window_end_epoch_exclusive": 1792944000,
  "window_timezone": "Asia/Shanghai",
  "git_fixed_main_sha": "bb5fe51c641d65b61593aa5e820072f81d1350f2",
  "git_committer_window_commits": 785,
  "git_author_window_commits": 785,
  "git_author_and_committer_members_identical": true,
  "git_committer_daily_counts": {
    "2026-10-23": 53,
    "2026-10-24": 310,
    "2026-10-25": 422
  },
  "top_level_project_chats": 14,
  "user_chat_records": 3,
  "agent_created_chat_records": 11,
  "explicit_subagent_sessions": 83,
  "subagent_depth_counts": {"1": 80, "2": 3},
  "matching_spawn_edges": 83,
  "guardian_review_excluded": 853,
  "non_guardian_records": 97,
  "combined_agent_sessions": 97,
  "effective_work_hours": null
}
```

## Git日期口径、squash与旧数字差异

本轮选committer时间，因为展示的是固定main历史中的提交记录；Git直接提供的`%ct`不依赖shell时区，Python显式用北京时间窗口比较。author时间`%at`也单独重算：同为785，且两者成员集合完全一致、无author-only或committer-only。这个一致性只对本次三天窗口成立；其他日期有cherry-pick导致author/committer不同，不能一般化。

最早窗口提交`dfefc9f68a40447914be4863e2128956434fe058`为2026-10-23 15:28:52 +08:00；最后为`f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`，2026-10-25 21:16:21 +08:00。后者也是v1.0.0 tag，当前可达计数785，与三天窗口计数相同；这提供交叉核查，不表示标签创建/正式release发生在25日。

此前952是固定bb5fe51的**全部可达历史**，33/142是此前截至11月2日20:54的**全部可见本机会话**，不限制三天。新785/14/83是相同项目口径再限制日期；差额167提交、19顶层Chat、59子代理会话来自旧快照窗口之外，不能称为被删去的无效工作。

当前main在v1后用`60c11f72b71ead4b8e744f2281d5dbecb796d11a`表示旧三提交尾链的同一tree；旧尾链`914dc99→ca7f37f→b6ea409`与该squash的复核见v4证据。它们在本次三天窗口之外，未改变当前785；本轮只遍历固定main，不把旧线、任务分支源提交、cherry-pick副本或`git rev-list --all`叠加为“项目总提交”。如需更早已重写/丢失历史，当前计数不能替代历史审计。

三天是日历观察窗口，不是三天有效工时。Git时间不能包括未提交实验，Chat创建/更新跨度包括等待与并行；不相加`updated_at-created_at`估算人或Agent投入。运行时长只使用下节实际配对的task生命周期。

## 可复现只读聚合

数据源仅为本仓Git对象与本机`/Users/nighca/.codex/state_5.sqlite`元数据。字段为`threads.git_origin_url/project_id/thread_source/source/created_at/id`、`project_roots.project_id/path`、`thread_spawn_edges.child_thread_id`；不读取`first_user_message`、preview、标题或rollout正文。不复制数据库或逐条source到仓库。

下面脚本只输出汇总。SQLite为可变本机数据，后续删除/迁移/归属修正可能令重跑不同；本文保存当次聚合而非宣称有不可变原库快照。筛选为精确origin **或** 项目根精确匹配的project_id，无模糊“lie”词匹配。

```python
import collections, datetime, json, sqlite3, subprocess
from zoneinfo import ZoneInfo

sha = 'bb5fe51c641d65b61593aa5e820072f81d1350f2'
start, end = 1792684800, 1792944000
tz = ZoneInfo('Asia/Shanghai')
lines = subprocess.check_output(
    ['git', 'log', sha, '--format=%H %at %ct'], text=True
).splitlines()
records = [line.split() for line in lines]
author = {r[0] for r in records if start <= int(r[1]) < end}
committer = {r[0] for r in records if start <= int(r[2]) < end}
daily = collections.Counter(
    datetime.datetime.fromtimestamp(int(r[2]), tz).strftime('%Y-%m-%d')
    for r in records if start <= int(r[2]) < end
)
db = sqlite3.connect(
    'file:/Users/nighca/.codex/state_5.sqlite?mode=ro', uri=True
)
db.execute('BEGIN')
projects = [r[0] for r in db.execute(
    'SELECT DISTINCT project_id FROM project_roots WHERE path=?',
    ('/Users/nighca/code/nighca/lie',)
)]
where = 'git_origin_url IN (?,?,?)'
args = ['git@github.com:nighca/lie.git',
        'https://github.com/nighca/lie.git', 'https://github.com/nighca/lie']
if projects:
    where += ' OR project_id IN (' + ','.join('?' * len(projects)) + ')'
    args += projects
where = '(' + where + ') AND created_at >= ? AND created_at < ?'
args += [start, end]
rows = db.execute(
    'SELECT thread_source,source FROM threads WHERE ' + where, args
).fetchall()
counts = collections.Counter(r[0] for r in rows)
depths = collections.Counter()
explicit = 0
for kind, source in rows:
    if kind != 'subagent':
        continue
    try:
        spawn = json.loads(source).get('subagent', {}).get('thread_spawn')
        if isinstance(spawn, dict):
            explicit += 1
            depths[str(spawn.get('depth', 'unknown'))] += 1
    except (TypeError, ValueError, AttributeError):
        pass
edges = db.execute(
    'SELECT COUNT(*) FROM thread_spawn_edges WHERE child_thread_id IN '
    '(SELECT id FROM threads WHERE ' + where + ')', args
).fetchone()[0]
print(json.dumps({
    'fixed_sha': sha,
    'committer_window': len(committer), 'author_window': len(author),
    'same_git_members': committer == author,
    'committer_daily_counts': dict(daily),
    'top_level_chats': counts['user'] + counts['agent_created_thread'],
    'user': counts['user'], 'agent_created_thread': counts['agent_created_thread'],
    'subagent_records': counts['subagent'], 'explicit_spawns': explicit,
    'depth_counts': dict(depths), 'matching_edges': edges,
    'guardian_review_excluded': counts['guardian_review']
}, ensure_ascii=False))
db.close()
```

## 累计Agent运行时长：部分记录约88小时

在同一精确97条记录中，仅查询其`rollout_path/created_at/id/thread_source`并读取这些文件的事件类型/生命周期时间元数据，没有扩扫其他Chat，没有访问消息正文、图片、工具参数或凭据。**66个文件存在，31个文件缺失**。存在的66个均有可配对的本人task记录；12个来自顶层Chat，54个来自子代理。

45个子代理文件的头部包括继承父会话记录（session_meta顺序为本人、父会话）；因此不能把所有事件累加，也不能以最后一个session_meta决定后续归属。本轮排除`payload.started_at < threads.created_at`的445条继承生命周期事件，再以“当前thread＋turn_id”配对，并检查所计窗口内turn_id不跨不同文件重复，实际重复为0。没有把继承父对话再次算作子代理时长。

| 校验 | 结果 |
| --- | --- |
| 元数据schema | event_msg的task_started有turn_id/started_at；task_complete和turn_aborted还有completed_at/duration_ms。started/completed为Unix秒，duration_ms为实际记录的整数毫秒 |
| 本人生命周期 | 643个start；631个complete＋12个aborted；每项均可一一配对、started_at一致、无重复或负时长、无未完记录 |
| 三天窗口过滤 | 8对完全在结束窗口后，排除；窗口内635段＝624complete＋11aborted，实际无跨窗段 |
| 累计运行时长 | **316,643,739ms＝87.9566 Agent小时，约88小时**，仅计窗口内可保留片段；aborted段按已经运行的时间计入 |
| 交叉核对 | Unix秒端点累计316,643秒；duration_ms累计相差0.739秒。单段duration与秒端点之差在−1266至+1079ms之间，保留原duration，不伪造毫秒墙钟精度 |
| 并行与等待 | 不同Agent的同时运行按用户要求累加；父Agent等工具/子代理期间若task仍运行，也在其duration中，可能与Worker时间重叠。不是独占CPU、token生成或有效劳动时间 |
| 缺失覆盖 | 顶层缺2/14、子代理缺29/83，共31/97；未按均值外推。文件存在覆盖66/97≈68.0%，不代表覆盖全部运行事件的比例已知 |

此指标更准确的读法是**已保留元数据中的累计Agent运行时长**。不能说“97个Agent总共只用了88小时”“88有效工时”或“省了多少人工”；缺失文件以及历史记录未必完整，不足以构成全项目总时长。

冻结运行统计补充：

```json
{
  "selected_agent_sessions": 97,
  "rollout_files_present": 66,
  "rollout_files_missing": 31,
  "top_chat_present_missing": [12, 2],
  "subagent_present_missing": [54, 29],
  "inherited_lifecycle_events_excluded": 445,
  "matched_own_turn_pairs": 643,
  "unmatched_or_incomplete_own_turns": 0,
  "pairs_fully_after_window_excluded": 8,
  "pairs_straddling_window": 0,
  "included_pairs": 635,
  "included_complete_pairs": 624,
  "included_aborted_pairs": 11,
  "cross_file_duplicate_included_turn_ids": 0,
  "recorded_duration_ms_sum": 316643739,
  "endpoint_seconds_sum": 316643,
  "agent_running_hours_approx": 87.9566,
  "all_97_total_hours": null,
  "effective_work_hours": null
}
```

以下独立sanitize代码复用上一段的`db/where/args/start/end`定义（在`db.close()`之前执行）。它只处理精确97条记录、输出聚合，绝不输出路径、session/turn ID或message/body。遇跨窗片段用秒端点截取；实际本轮没有跨窗片段，因此累计均使用原始duration_ms，没有进行按比例外推。

```python
from pathlib import Path

selected = db.execute(
    'SELECT id,rollout_path,created_at,thread_source FROM threads WHERE '
    + where + " AND thread_source IN ('user','agent_created_thread','subagent')",
    args
).fetchall()
coverage = collections.Counter()
included = []
inherited = duplicates = incomplete = outside = straddle = 0
seen_turns = set()
for thread_id, rollout_path, created_at, kind in selected:
    group = 'subagent' if kind == 'subagent' else 'top_chat'
    if not rollout_path or not Path(rollout_path).is_file():
        coverage[group + '_missing'] += 1
        continue
    starts, ends = {}, {}
    with open(rollout_path) as source_file:
        for line in source_file:
            try:
                event = json.loads(line)
            except ValueError:
                continue
            if event.get('type') != 'event_msg':
                continue
            payload = event.get('payload', {})
            event_type = payload.get('type')
            if event_type not in ('task_started', 'task_complete', 'turn_aborted'):
                continue
            # Access metadata only, never message/body/text/tool arguments.
            if payload['started_at'] < created_at:
                inherited += 1
                continue
            turn_id = payload['turn_id']
            target = starts if event_type == 'task_started' else ends
            if turn_id in target:
                duplicates += 1
            target[turn_id] = {
                k: payload[k] for k in
                ('type', 'started_at', 'completed_at', 'duration_ms') if k in payload
            }
    incomplete += len(set(starts) ^ set(ends))
    has_pair = False
    for turn_id in set(starts) & set(ends):
        s, e = starts[turn_id], ends[turn_id]
        a, b, duration = s['started_at'], e['completed_at'], e['duration_ms']
        assert a == e['started_at'] and b >= a and duration >= 0
        if a >= end or b <= start:
            outside += 1
            continue
        assert turn_id not in seen_turns, 'Inherited or repeated turn must not be summed twice'
        seen_turns.add(turn_id)
        clipped_a, clipped_b = max(a, start), min(b, end)
        clipped = clipped_a != a or clipped_b != b
        straddle += clipped
        included.append((
            duration if not clipped else (clipped_b - clipped_a) * 1000,
            clipped_b - clipped_a, e['type']
        ))
        has_pair = True
    coverage[group + ('_present_with_pairs' if has_pair else '_present_without_pairs')] += 1
print(json.dumps({
    'selected_sessions': len(selected), 'coverage': dict(coverage),
    'inherited_excluded': inherited, 'duplicate_events': duplicates,
    'unmatched_or_incomplete': incomplete, 'outside_window_pairs': outside,
    'straddling_pairs': straddle, 'included_pairs': len(included),
    'included_end_types': dict(collections.Counter(x[2] for x in included)),
    'duration_ms_sum': sum(x[0] for x in included),
    'endpoint_seconds_sum': sum(x[1] for x in included)
}, ensure_ascii=False))
```

## “先设计再落地”：WebMCP实际案例

**时间必须标清：该案例发生在2026-11-01，是后续机制实例，不属于10月23–25三天统计窗口。** 可将三天指标作为早期协作规模，另讲“这套方法在后续WebMCP迭代中怎样落地”；不能把11月案例伪装成三天内的成果。

实际顺序及固定bb5fe51中的源证据：

1. **先有候选方案和可体验Demo。** `4ca66d8545275e25f5c9631d5b4a6b1543cd08ba`加入独立候选Demo；`d2c03dae4006eab087576e7d01b71372222cfeda`仅校正截图扩展名。作者验看全文后“采用/放弃/撤销”，与普通草稿隔离，属于当时方案，不是当前推荐。
2. **用户否定额外交互，重新明确设计。** 当前直接编辑文档明确记录：用户实测后不要独立Demo草稿、整案候选及采纳/放弃，改为小提示入口/说明弹窗，工具直接编辑当前表单。完整读稿工具仍不恢复。
3. **按新设计实现并验证。** `96ca1e738e3661245696c60fe1ba85e70298445d`实现直接表单，复用规则/本地保存、revision/存储冲突保护；工具发现、局部与完整写入和保存有特定IAB来源实证，不用伪造实时结果。
4. **继续根据体验反馈修订并接受。** `c97af0e2154894ae37e76230b36540b47cfcc37b`将悬浮长蓝链/技术说明改为紧凑入口与普通用户实操说明。文档保留用户对最终source `3efe3c5`的接受；类型/相关测试/构建、已有截图各按当时范围记录，不合并成一次全量重跑。
5. **review、集成及发布回到Router责任。** `feb4fa6bcf7db9f13c47cbde03a6507c64b61e12`记录组合交付状态；固定bb5的项目计划记载独立/root源码审查及随`96c5fdd`上线。实现分支未自行更新main，不把早期候选或draft文档当正式发布。上述author时间与committer集成时间不同，例如直接编辑作者22:59:35、集成23:15:39，同为11月1日。

工程页可讲：“先做出能讨论的方案；用户指出额外步骤没有价值；改成直接填当前表单；再经体验验证、审查和集成。”这展示的是决策与反馈闭环，**不是一次就正确、AI无须人类决策或提效已量化**。用户Agent通过WebMCP写故事属于产品能力；开发这项能力的Router–Worker协作属于工程方法，两者分开。

### 只选以下三份证据

不复用骨骼图，不增加聊天截图或新录制。两个实际界面与一个流程记录足以支持该工程例子：

| 证据 | 画面/材料作用 | bb5fe51中的实际身份 |
| --- | --- | --- |
| `docs/design/webmcp-authoring-demo-desktop.jpg` | 旧候选面板，标“历史方案，已被替代”，不作为当前产品界面 | 73,808 bytes；SHA256 `256ab7c8091d679d4e0d7109d7c498c6bb6698d6a827aeb2455db48d050901fb` |
| `docs/design/webmcp-entry-polished.jpg` | 最终紧凑入口与当前表单；原生验收样例为虚构内容，不是用户原稿 | 84,483 bytes；SHA256 `12dde198414ee7f852d62028e429ba0c868febb139653d66042885bad1b73cad` |
| `docs/design/webmcp-direct-edit-2026-11-01.md` | 批准、直接编辑合同、测试/浏览器证据、独立审查与完整交接，来源放备注而非整页截图 | 8,681 bytes；SHA256 `0cbbd5c251af2b226ce8cc20613aa779a4770bf9a29898eacf1b5cb278ad0b69` |

若需要解释旧候选为何被替代，可在备注引用`docs/design/webmcp-authoring-demo-2026-11-01.md`开头和直接编辑文档开头，不再增加第四张图片。最终上线证据由固定bb5中的`docs/project-plan.md`对应WebMCP行补足；文档自身“待review”是历史截点，不能覆盖后来的正式回执。

## 本轮检查结论

三天Git与SQLite聚合均已实际只读执行；author/committer集合、每日提交、递归spawn深度及edge数量交叉核对。本文两段聚合脚本已组合实际重跑，复现785提交、14＋83＝97会话和66个文件的635段/316,643,739ms。以上三个工程例子文件已通过`git show`读取并核bytes/hash，未导出或操作新浏览器/模型/用户原稿。脚本仅打印汇总，不能把数据库路径或逐条会话素材变成对外截图。最终主指标采用785 commits/97个Agent会话；约88 Agent小时仅在同时标明66/97覆盖、工具等待与并行累加时选用。旧952/33/142保留为不同窗口的历史证据，不覆盖旧文件。
