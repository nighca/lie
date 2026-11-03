# V10：三天设计文档产出与开放游戏规格证据

内部证据，2026-11-03。仅只读Git与公开仓库文件，没有查询私人聊天、provider、浏览器或服务；没有新增效率、用户或工时推算。

## 可对外使用的数量

**2026.10.23–10.25，19份设计与方案文档。** 精确定义是下面固定范围内、三天首次入库且在截止树仍存在的设计/方案主文档，按路径去重；内容SHA也核为19个不同正文。包含未采用/未实施提案，不等于19个已批准设计，不声称覆盖全部设计资产或所有设计材料。

统计根为 `bb5fe51c641d65b61593aa5e820072f81d1350f2`（与三天785提交口径一致）。北京时间窗口2026-10-23 00:00（含）至10-26 00:00（不含），按Git committer epoch筛选；785个可达提交中的窗口末提交为 `f8c4e2b5d908538e76e60d4d9ddba39da2c30d13`，committer时间2026-10-25 21:16:21+08:00。随后11月设计和后补归档不进入截止树，不拿当前main全部文档反推三天成果。这里统计的是仓库首次入库时间，不是聊天中开始撰写时间；作者时间与集成时间可能不同。

范围固定为：`docs/design/**/*.md`；`docs/`根文件名含architecture/proposal/design的Markdown；一层名称含proposal/design的主题目录之README.md。审查、发布、历史/归档、实现验收记录和拆分附录不靠目录关键词泛纳。该三天`docs/design/`匹配为0，早期方案主要位于docs根；不是三天没有做设计。仅统计截止树仍在的文件，不累计已删除/改名旧路径，不把同一文件多次修订算多份。

## 19个去重文件

```text
docs/architecture-design.md
docs/architecture.md
docs/builtin-case-json-proposal.md
docs/editor-official-submission-proposal.md
docs/game-editor-proposal.md
docs/gameplay-proposal.md
docs/header-logo-lower-right-design.md
docs/header-logo-underline-design.md
docs/home-case-flow-proposal.md
docs/interrogation-budget-proposal.md
docs/invite-access-design.md
docs/pr-ci-preview-proposal.md
docs/public-voice-launch-proposal.md
docs/remix-game-proposal/README.md
docs/result-character-states-proposal.md
docs/result-outcome-design/README.md
docs/result-scene-visual-proposal.md
docs/second-case-proposal.md
docs/voice-conversation-proposal.md
```

路径有序清单（UTF-8、每行LF、末行LF）SHA256：`7029671c137fd43c889c475dfd91c3a8a8644623cf4668de0061efd4cef3511b`。

## 可复现只读脚本

在本仓根目录运行以下Python；只输出上述公开文件名与聚合，不写文件或修改Git。

```python
import subprocess, datetime, re, hashlib
ROOT = 'bb5fe51c641d65b61593aa5e820072f81d1350f2'
def git(*args):
    return subprocess.check_output(['git', *args])
start = int(datetime.datetime.fromisoformat('2026-10-23T00:00:00+08:00').timestamp())
end = int(datetime.datetime.fromisoformat('2026-10-26T00:00:00+08:00').timestamp())
records = [line.split('\t') for line in git('log', ROOT, '--format=%H%x09%ct').decode().splitlines()]
window = [(sha, int(ct)) for sha, ct in records if start <= int(ct) < end]
cutoff = window[0][0]
selected = []
for path in git('ls-tree', '-r', '--name-only', cutoff, 'docs').decode().splitlines():
    top = re.fullmatch(r'docs/[^/]*(?:architecture|proposal|design)[^/]*\.md', path, re.I)
    topic = re.fullmatch(r'docs/[^/]*(?:proposal|design)[^/]*/README\.md', path, re.I)
    if not path.endswith('.md') or not (path.startswith('docs/design/') or top or topic):
        continue
    added = git('log', cutoff, '--diff-filter=A', '--format=%ct', '--', path).decode().splitlines()
    if added and start <= int(added[-1]) < end:
        selected.append(path)
body_hashes = {hashlib.sha256(git('show', cutoff + ':' + path)).hexdigest() for path in selected}
print('window_commits', len(window), 'cutoff', cutoff)
print('design_main_documents', len(selected), 'unique_bodies', len(body_hashes))
print('docs_design_directory', sum(path.startswith('docs/design/') for path in selected))
print('path_list_sha256', hashlib.sha256(('\n'.join(selected) + '\n').encode()).hexdigest())
print('\n'.join(selected))
```

实际执行结果：window_commits=785，design_main_documents=19，unique_bodies=19，docs_design_directory=0，cutoff与清单hash如上。统计选择主文档是公开展示口径，不把实现/测试/交接数量包装为设计产出；它也不是质量、批准率或提效倍数。

## 开放游戏规格：生产与消费的实际接口

以下按正式已发布 `7ff082483481f9e94979eb867c2ca575d5eff8b3` 只读核对，与上方三天设计文档窗口分开。

| 链路 | 精确源码/说明 | 已核含义 |
| --- | --- | --- |
| 内容合同 | `packages/game-core/src/content.ts:14` 的GameDefinition，`:66`的validateGame；`content/games/README.md` | 公共背景、人物/私设、形象ID、询问时长和结局构成同一静态内容合同，人数不是引擎常量；校验字段与引用，不证明故事可解 |
| 编辑器制作 | `apps/web/src/editor/draft.ts:66` draftGame；`apps/web/src/editor/Editor.vue:136` preview | 作者完成稿经draftIssues与validateGame成为GameDefinition，再发出preview事件，不另造一套试玩数据格式 |
| 官方/试玩/分享同引擎 | `apps/web/src/main.ts:21` createController；`apps/web/src/Application.vue:65` attach、`:76` preview分支、`:88` loadSharedGame、`:123` preview | 自定义快照与官方readBundledCase进入同一个createGameController；同一App展示并使用相同规则/语音能力，非独立假游玩器 |
| 分享数据 | `apps/web/src/editor/share.ts:53` saveSharedGame、`:68` loadSharedGame | 序列化校验后的静态故事，POST快照短链；GET后validateGame与预设引用检查，再进同一个controller。旧fragment只读兼容，不当当前主要写路径 |
| 表现资源 | `characters[].appearanceId`、`design/character-presets/manifest.json`、main.ts:27 resolveVoiceId | 故事引用可复用形象ID，平台解析人物美术/音色/动画，不把运行会话与平台管理凭据写入故事 |

适合一页：**创作者（写故事、人物与真相）→统一游戏数据包（公开GameDefinition契约、字段/引用校验）→玩家（同一引擎询问、核对与指认）**。小字可写“换故事，无需改通用引擎；人物与时长由内容决定”。编辑器、官方案、分享链接三入口汇入同一数据合同与引擎，制作与消费不是两个脱节产品。

“开放”指仓库公开契约与代码，允许围绕同一规格制作和使用，不等于行业标准、任意第三方引擎兼容或上传任意脚本/资源。JSON是故事数据，不是规则DSL；程序校验不保证剧情质量或真实模型表现。GameDefinition字段不带账号、云草稿或多人协作语义；分享快照不是私密访问。该页不展示江苏答案。
