# V11：三天完整Markdown文档产出

内部证据，2026-11-03。主讲采用 **372 / 文档产出**，不是372份设计、批准决定或独立主题。19是V10按文件名与主文档范围选出的设计方案窄口径，非错误的“全部文档总数”；19被本次宽范围包含，不相加。

## 主指标定义

固定根bb5fe51c641d65b61593aa5e820072f81d1350f2，北京时间2026-10-23 00:00（含）至10-26 00:00（不含），按committer epoch筛窗口，末提交/截止树为f8c4e2b5d908538e76e60d4d9ddba39da2c30d13（10/25 21:16:21+08）。只计全仓截止树仍在、首次A入库在窗口的.md文件；不拿后续main补录倒算，不累计已删除路径。Git首次入库不是聊天撰写起点，集成/squash时间也不是有效工作时间。

全量386路径、原字节SHA256正文去重375；排除下面3个独立正文后383路径/372正文。包含设计、调研、实现、测试、评审、验收、交接与发布等工程材料。跨目录相同正文只计1，选字典序最小路径代表。不同正文修订仍是不同文档记录，**不是独立主题数**；只做原字节去重，不声称语义相近版本全合并。

排除仅导航/生成摘要：

| 路径 | 排除理由 |
| --- | --- |
| design/appearances/README.md | 短的历史素材迁移导航，无独立设计/验证正文 |
| docs/history/README.md | 历史导航索引，具体事件/决定另在各文档计入 |
| docs/coverage/summary.md | 机器生成覆盖率数字摘要，方法与验收报告另计 |

3项均.md、各自不属于重复正文组，所以375−3＝372。代码、原型HTML、图片视频、JSON机器结果/素材索引、覆盖率/检查raw txt、deploy-evidence/preview-url/restore等运行附件不作为Markdown文档计入。含结论/方法/限制的日期化评审、验收、交接不是纯运行日志，保留。分类是下面有序路径规则的检索分组，不是质量评级。

## 冻结聚合快照

```json
{
  "root": "bb5fe51c641d65b61593aa5e820072f81d1350f2",
  "cutoff": "f8c4e2b5d908538e76e60d4d9ddba39da2c30d13",
  "grossMarkdownPaths": 386,
  "grossUniqueBodies": 375,
  "excludedPaths": [
    "design/appearances/README.md",
    "docs/history/README.md",
    "docs/coverage/summary.md"
  ],
  "keptPaths": 383,
  "netUniqueDocuments": 372,
  "categories": {
    "协作、交接、决策与历史保全": 64,
    "产品、模块与其他工程说明": 57,
    "设计、方案、规格与资产制作说明": 71,
    "测试、评审、验收与发布": 112,
    "实现、集成与迭代说明": 33,
    "调研、实验与性能分析": 35
  },
  "manifestSha256": "cfd1ee024fa8394792cdffe7aca74fa5fc37b10ef6eb4677929b14fe15685362"
}
```

## 可复现只读脚本

本仓根目录Python运行，只读Git，不写文件、不查聊天或供应商。完整主清单与SHA均已保存于下一节。

```python
import subprocess, datetime, hashlib, collections, re, json
ROOT = 'bb5fe51c641d65b61593aa5e820072f81d1350f2'
def git(*args):
    return subprocess.check_output(['git', *args])
start = int(datetime.datetime.fromisoformat('2026-10-23T00:00:00+08:00').timestamp())
end = int(datetime.datetime.fromisoformat('2026-10-26T00:00:00+08:00').timestamp())
commits = [s.split('\t') for s in git('log', ROOT, '--format=%H%x09%ct').decode().splitlines()]
cutoff = next(sha for sha, ct in commits if start <= int(ct) < end)
excluded = {'design/appearances/README.md', 'docs/history/README.md', 'docs/coverage/summary.md'}
def category(path):
    p = path.lower()
    if re.search(r'review|verif|validat|acceptance|audit|checks|approval|/qa/|/releases/|/deployments/|/coverage/', p):
        return '测试、评审、验收与发布'
    if re.search(r'handoff|coordinator|project-plan|development|/history/|/archive|/archive-inbox|^agents\.md', p):
        return '协作、交接、决策与历史保全'
    if re.search(r'research|investigat|discovery|options|audition|/spikes/|latency|quota|feasibility|catalog-notes|case-options|performance', p):
        return '调研、实验与性能分析'
    if re.search(r'implementation|integration|migration|refinement|recovery|loading|controller|projection|startup|tuning|alignment|spacing', p):
        return '实现、集成与迭代说明'
    if p.startswith('design/') or re.search(r'architecture|proposal|contract|spec|visual-direction|design|production-workflow', p):
        return '设计、方案、规格与资产制作说明'
    return '产品、模块与其他工程说明'
selected = []
bodies = {}
for path in git('ls-tree', '-r', '--name-only', cutoff).decode().splitlines():
    if not path.lower().endswith('.md'):
        continue
    added = git('log', cutoff, '--diff-filter=A', '--format=%ct', '--', path).decode().splitlines()
    if added and start <= int(added[-1]) < end:
        selected.append(path)
        bodies[path] = git('show', cutoff + ':' + path)
groups = collections.defaultdict(list)
for path in selected:
    if path not in excluded:
        groups[hashlib.sha256(bodies[path]).hexdigest()].append(path)
manifest = sorted((min(paths), digest) for digest, paths in groups.items())
summary = {'root': ROOT, 'cutoff': cutoff, 'grossMarkdownPaths': len(selected),
           'grossUniqueBodies': len({hashlib.sha256(b).hexdigest() for b in bodies.values()}),
           'excludedPaths': sorted(excluded.intersection(selected)),
           'keptPaths': sum(p not in excluded for p in selected), 'netUniqueDocuments': len(manifest),
           'categories': dict(collections.Counter(category(p) for p, _ in manifest)),
           'manifestSha256': hashlib.sha256(('\n'.join(p+'\t'+h for p,h in manifest)+'\n').encode()).hexdigest()}
print(json.dumps(summary, ensure_ascii=False, indent=2))
# To reproduce the full public-path manifest, optionally print the next line:
# print('\n'.join(p+'\t'+h for p,h in manifest))
```

## 372份主指标代表清单

| 代表路径 | 类别 | SHA256 |
| --- | --- | --- |
| AGENTS.md | 协作、交接、决策与历史保全 | `e61e2d87a37a8327975b75030f0c03164c52e8948ecbdcdb29442915a3de05e9` |
| README.md | 产品、模块与其他工程说明 | `c25a95d28eef41d6182f22c9a14babdb24388a6ee0bfcc441bbc812805f0a07c` |
| README.zh-CN.md | 产品、模块与其他工程说明 | `19422b1a97104398bf02b3481e5078cfc39066a0411c72dca2b3afff2201d00e` |
| apps/gateway/README.md | 产品、模块与其他工程说明 | `02fc7d15085ee51ad9f20a16ab3b54d58f16893478c0c826683566b3fe2537c9` |
| apps/web/README.md | 产品、模块与其他工程说明 | `df738d8adec9d66fc9fb75aed8c688c39c6ffc51c1023ba42dbcdcf1885ec6e4` |
| content/games/README.md | 产品、模块与其他工程说明 | `e68455262360c3e2df71294360d1bcb300b24b47ccd86184df3e580c97ac1d0f` |
| design/animation-candidates/blue-glasses/README.md | 设计、方案、规格与资产制作说明 | `e4055e747dfa011fe011440d9ced7b35e7112b19227c9c79419cc98b96e75529` |
| design/animation-candidates/blue-glasses/initiator-review.md | 测试、评审、验收与发布 | `e7d39b63b8d05ce579c42ed4de39e59ad4d2440fc8ea97648d141f7bb4697817` |
| design/animation-candidates/blue-glasses/revision-review.md | 测试、评审、验收与发布 | `c4de8455da86bf2aa7e2ad23e4ecab2fa201ec4c3530b7f210f1e26b3b7e5188` |
| design/animation-candidates/blue-glasses/user-acceptance.md | 测试、评审、验收与发布 | `42e162e19fdc33c1a05d31184d9d2a6f4f35461cc1e3b16ff228a355df18f70a` |
| design/animation-candidates/mint-puffs/README.md | 设计、方案、规格与资产制作说明 | `f702b7b0d2086147f27d034b4e047835aa141f8ed36465db8286a2ad519207de` |
| design/animation-candidates/mint-puffs/archive/README.md | 协作、交接、决策与历史保全 | `64404603332379c946f6954b1615835dd3f1efec74519840494cb2021dc1cfee` |
| design/animation-candidates/mint-puffs/initiator-review.md | 测试、评审、验收与发布 | `96cab457478b26a9c2cd40560fc5c1daf6ff077d9a77ab2db9b8f53f8aa68a99` |
| design/animation-candidates/mint-puffs/prompts.md | 设计、方案、规格与资产制作说明 | `b2b74b92f5b531ae78755c8de6c4b8bcf288122fac055a82b446089d52edd80b` |
| design/animation-candidates/mint-puffs/revision-2026-10-25.md | 设计、方案、规格与资产制作说明 | `31f438d2dc26e2f947e0d22cb27b887d5ae95e7ca14543685cda2beeeae3f180` |
| design/animation-candidates/ochre-freckles/README.md | 设计、方案、规格与资产制作说明 | `5477f8250c3f89b659571cfa78a993f8fa980e06aab05b0fa3ccc911f2d7986a` |
| design/animation-candidates/ochre-freckles/archive/README.md | 协作、交接、决策与历史保全 | `b3ef82b66106024f5bf7428cea5af4a0d1f44d21e2edde574f0e4e303245d7e1` |
| design/animation-candidates/ochre-freckles/initiator-review.md | 测试、评审、验收与发布 | `6435770ad0216d7a9a28df523a0b85b1817a7f44669341c9388cef8fe434cfbd` |
| design/animation-candidates/ochre-freckles/prompts.md | 设计、方案、规格与资产制作说明 | `8740b8ee81aec454e01e1cf6897b831fc93b2204a6008d20622d0dec9e7eaa70` |
| design/animation-candidates/ochre-freckles/revision-2026-10-25.md | 设计、方案、规格与资产制作说明 | `1dd75f7f7c62191836a45b7fb457ed4312393a38fb3fcc0705515c045bf694c9` |
| design/animation-candidates/plum-crop/README.md | 设计、方案、规格与资产制作说明 | `13ce07ef92ec2ec961597175d8b762d3c8ea683f04bf9c0d789edcb4d2a2ae62` |
| design/animation-candidates/plum-crop/archive/2026-10-25-rejected-scale-breath/README.md | 协作、交接、决策与历史保全 | `8bcc6e2518bf8f7f148af8be5d77ee926348ac42d18fa4c412a0cb1c01497f8f` |
| design/animation-candidates/plum-crop/archive/2026-10-25-rejected-scale-breath/waiting-visibility-revision.md | 协作、交接、决策与历史保全 | `401823214bf4847e2875174efccbe06130bd99c490cd5e4b3784100a13047d53` |
| design/animation-candidates/plum-crop/archive/2026-10-25-rigid-cuff-failure/README.md | 协作、交接、决策与历史保全 | `ad9f4fb1b4d7ab21bb5d1977e7f1240e055a48812e7e1dd63a7a31e65238b901` |
| design/animation-candidates/plum-crop/archive/2026-10-25-rigid-first-collar/README.md | 协作、交接、决策与历史保全 | `d0b630b9525ef039328045ad71f19894e720cdfc9819be86438f9eead9a216fe` |
| design/animation-candidates/plum-crop/archive/2026-10-25-rigid-second-collar/README.md | 协作、交接、决策与历史保全 | `209792b8ca0f5ef64b2b330a71ef00aad21a4858e32c40416be5d48923659058` |
| design/animation-candidates/plum-crop/archive/2026-10-25-rigid-third-neck-edge/README.md | 协作、交接、决策与历史保全 | `2592e9f621ea4430fbf0e7ce61439b6fe0403f58e12c8cebd5139f933f4ae334` |
| design/animation-candidates/plum-crop/archive/2026-10-25-waiting-visibility/README.md | 协作、交接、决策与历史保全 | `74e37d4a39b0b978588feb9c490172fe1531018ff24d84b428dfdd9f6d9d416d` |
| design/animation-candidates/plum-crop/evidence/rigid-waiting-review/README.md | 测试、评审、验收与发布 | `8c476b3086b9e01c64a5a26db150213f9eeec763f04cc4455113bd8259cb8210` |
| design/animation-candidates/plum-crop/formal-dawn-review.md | 测试、评审、验收与发布 | `8d67f9d66e03b4c9ca1f5740b5cb07ea485d2e8b40a99f9aa0f1849c1d06dc0c` |
| design/animation-candidates/plum-crop/initiator-review.md | 测试、评审、验收与发布 | `ba1e30c04d4baec420744d750df406e89c8bde00412c83ba6f4d9631ffd43f46` |
| design/animation-candidates/plum-crop/prompts.md | 设计、方案、规格与资产制作说明 | `d3ca92fea0eb93fd6015d3b07b35aaf9c6ad5172c2dea72f81473acc0d4edafa` |
| design/animation-candidates/plum-crop/waiting-visibility-revision.md | 设计、方案、规格与资产制作说明 | `d3e22143483f92dad625ad5403a8a9031ef84b6bec478e42c340ad8fb27cccfe` |
| design/animation-candidates/salt-pepper-beard/README.md | 设计、方案、规格与资产制作说明 | `2d3bd7c1a66e54d71142b479acbcf01f0d85539c58fb8e111440565fd44a1e8a` |
| design/animation-candidates/salt-pepper-beard/archive/2026-10-25-rejected-scale-breath/waiting-visibility-revision.md | 协作、交接、决策与历史保全 | `bd69a9617fbeba234fbbc369a35fcfefc103569254e0ed7e31be4529120990d1` |
| design/animation-candidates/salt-pepper-beard/formal-dawn-review.md | 测试、评审、验收与发布 | `441a45269455d241c2deee936d5a91b648735726deac51c2a06d93e35ebff33e` |
| design/animation-candidates/salt-pepper-beard/formal-review.md | 测试、评审、验收与发布 | `c2a2c03654770676e8a66903ef1cc84fddab71701f051032f1aa0e644baa8d6f` |
| design/animation-candidates/salt-pepper-beard/initiator-review.md | 测试、评审、验收与发布 | `b7a2f171385c9fefb0446527a4144780d7a96a0d7ba74cff8ac050079d43766a` |
| design/animation-candidates/salt-pepper-beard/waiting-visibility-revision.md | 设计、方案、规格与资产制作说明 | `19dbe50dd0edeebacd53c5a036b57cab340fed484b13520bff53cbbe4d9d1822` |
| design/animation-candidates/silver-bun/README.md | 设计、方案、规格与资产制作说明 | `f299ffef4d7185dc548fcd0ac1234bd1e04ad16aabd5292ed45192c3db8198cf` |
| design/animation-candidates/silver-bun/archive/2026-10-25-rejected-scale-breath/waiting-visibility-revision.md | 协作、交接、决策与历史保全 | `a9d16c85bebc1ff25b843308756bdbbd6fc28acba0ca14ff941df08ad29cc7d8` |
| design/animation-candidates/silver-bun/archive/2026-10-25-rigid-cuff-second-button/README.md | 协作、交接、决策与历史保全 | `3306dfff5f889d194403d22f2a3c92b3a722522e6f737ade692fd7e826e175b5` |
| design/animation-candidates/silver-bun/archive/2026-10-25-rigid-first-seams/README.md | 协作、交接、决策与历史保全 | `82bba8621b825903983ea1c368e0624ee4950fc4aff771dbca9dd4860839c4a8` |
| design/animation-candidates/silver-bun/feedback-review.md | 测试、评审、验收与发布 | `987f2461b450b28383940fcb5d0241b0f6425db6025c33c73151ab771ce667c3` |
| design/animation-candidates/silver-bun/formal-dawn-review.md | 测试、评审、验收与发布 | `2412f2a9944e5552101b28b6bece18c6d4ffcc1b73d30b35850bef5e75e707e0` |
| design/animation-candidates/silver-bun/initiator-review.md | 测试、评审、验收与发布 | `d35e12ad2dbae13fe1379533d095131dfd0672ceee63154dc00f173c6e67dd68` |
| design/animation-candidates/silver-bun/prompts.md | 设计、方案、规格与资产制作说明 | `b402dc07e56b32aa8010418a71904b5856102c1fd1b56ae9b32ec52484d2caf3` |
| design/animation-candidates/silver-bun/waiting-review.md | 测试、评审、验收与发布 | `a6ab05c95110fa767ae57f04fce22259b8415f994dc25d4d516538cfc08d517b` |
| design/animation-candidates/silver-bun/waiting-visibility-revision.md | 设计、方案、规格与资产制作说明 | `309ff1abc08a79c952dd76fc9644e12655f2ecedc10713fa88a1d81058c1d8b8` |
| design/animation-candidates/sunny-moustache/README.md | 设计、方案、规格与资产制作说明 | `24b0450f266896063cca20d70cd14b21ef603a636a78de275f99a43a86c93c5d` |
| design/animation-candidates/sunny-moustache/initiator-review.md | 测试、评审、验收与发布 | `ba1603579dea36abc33bc57296f5ddc8c9262973b1d321dde714a972caa496de` |
| design/animation-candidates/sunny-moustache/user-acceptance.md | 测试、评审、验收与发布 | `c911eb53556c40860af4be9f5d2b7028f7e9cea700fe9a15d3331f5b44967a4c` |
| design/appearances/diversity-studies/batch-two/README.md | 设计、方案、规格与资产制作说明 | `9da7cfd514ea29b98578abce008057d7b7c0f9ddec7af1d134bff43c5a079032` |
| design/appearances/expansion-complete/README.md | 设计、方案、规格与资产制作说明 | `bd0d646ecdf34cbbe97129288acf2bb358c3caed304e142a0a3965131027508d` |
| design/appearances/expansion-complete/mint-puffs/README.md | 设计、方案、规格与资产制作说明 | `c9ed26a89ffa2da8b0b8c0d962565c3a68886cab2747d85d04b8f8e85012e286` |
| design/appearances/expansion-complete/ochre-freckles/README.md | 设计、方案、规格与资产制作说明 | `22e73eea03d5fc69267b090284c07a20d0887bc743c28e9982a53fdf737eef43` |
| design/appearances/expansion-complete/plum-crop/README.md | 设计、方案、规格与资产制作说明 | `2f46552711540a9c07a3d8779717a0e81550399f43b3bd6d29152892704cead1` |
| design/appearances/expansion-complete/salt-pepper-beard/README.md | 设计、方案、规格与资产制作说明 | `01a4a32441d915504551a406cf31a3b71948b704ff8df8b28ebcc128360bb6c8` |
| design/appearances/expansion-complete/silver-bun/README.md | 设计、方案、规格与资产制作说明 | `7f6bee0212c81479d8cd4c58f32b16899a15df05ae242603ec87585f88bb5586` |
| design/appearances/state-studies/blue-glasses-v1/README.md | 设计、方案、规格与资产制作说明 | `3d46f19acdfb849306f22cd8c4932c9e64f2b3f334d23562d38e6ad8f8998f5a` |
| design/appearances/state-studies/coral-bob-v2/README.md | 设计、方案、规格与资产制作说明 | `adc865a69356b25e64db8fbdd9e20828f244edb1bca58e45be8054a2e549e8f7` |
| design/appearances/state-studies/coral-bob/README.md | 设计、方案、规格与资产制作说明 | `569e020d9a47825820f27af18d1f4f6469f7c38491b32097edf9735a116afd7b` |
| design/appearances/state-studies/sunny-moustache-v1/README.md | 设计、方案、规格与资产制作说明 | `dbd9cf56b9cad1704bda53df856b78ce38737cec03a8f75b9c5d0fffccb1fc24` |
| design/background-character-names/README.md | 设计、方案、规格与资产制作说明 | `8fbc6629c0592c881b3e6b66c36fa3e36a7b5247a3f4758e04d790f5bd813736` |
| design/background-name-spacing/README.md | 实现、集成与迭代说明 | `0b85adb589a74df5b2194a61bbd528402cfab7eb77fe7e4b595b9392faea05a2` |
| design/brand/README.md | 设计、方案、规格与资产制作说明 | `682668a3100669b9034b96cc0386784d2a2b2327b97a4940f49d0061902e5cb2` |
| design/brand/balanced-logo-options/README.md | 调研、实验与性能分析 | `7e7623d531cb63eb929570f0f4c98aef296a915be4a4e8e6c703cd0e846f1d7f` |
| design/brand/lettermark-options/README.md | 调研、实验与性能分析 | `e4884d1eeec08ab2be554aa3489b5495f6ec74f6e7ac349172b00b0bfd379dd6` |
| design/brand/logo-b-refinements/README.md | 实现、集成与迭代说明 | `8cbb14eee661691918490fc86fb962bff66147ebd4eb5133145b4017dcf55a48` |
| design/brand/logo-easter-egg/README.md | 设计、方案、规格与资产制作说明 | `362f6056c1831e8a5c7ca72be3391f4c90cfa0ebe8661a39c2512b25fe27bb6d` |
| design/brand/logo-options/README.md | 调研、实验与性能分析 | `daa9b4aebf6400553afc691b10d997beb6757d005b816ccfc8205796f70a6c7a` |
| design/character-presets/README.md | 设计、方案、规格与资产制作说明 | `8d8da49bc4c95533f8cd31ccf3799fb702b96164be11f325cd556d9ee42cabc5` |
| design/conversation-options/README.md | 调研、实验与性能分析 | `17fc3fac324acce3c38d8b2640076ad1e6b462c0bf9fc3001d3ba34ee094db00` |
| design/header-logo-lower-right/README.md | 设计、方案、规格与资产制作说明 | `5ca4d29b305765d510d7e23933590d445c54660a6f3f040d7ddef41b29a7c7af` |
| design/header-logo-underline/README.md | 设计、方案、规格与资产制作说明 | `8050e91b25383da88a92d73e037163150c56e6a1441064641c96d687ab73a9f4` |
| design/home-options/README.md | 调研、实验与性能分析 | `58ba511e9d7ef57d60829f4cf29f54b1e9142574ba5ef343e5e04872ba911da3` |
| design/home-options/refined-a/README.md | 调研、实验与性能分析 | `d4766baba4d461031bd3ca6b14d7a95905acd315a934f587311ec2df8f9f2d06` |
| design/investigation-portrait-position/README.md | 调研、实验与性能分析 | `15884d31973d2949ababbb5e42e48cb50b7f4cfa0fef7cbf52df369fb94ee746` |
| design/investigation-transcript-title/README.md | 调研、实验与性能分析 | `ada865af1418f900d5bb2f92a1b4111ca6a0daca2c3cdc7c0d719aa6572186c2` |
| design/investigation-viewport-height/README.md | 调研、实验与性能分析 | `81175d4aa505c1eb13dec5d1bff664d598ea1ef983f8f70297907b2883ee86c6` |
| design/player-avatar-options/README.md | 调研、实验与性能分析 | `cdd81cc1d904a386ce2efe34b09910acd802e8e6eb7d98d980c8d47b6f3f3ecf` |
| design/preview-remix-visibility/README.md | 测试、评审、验收与发布 | `1bf6a1c9b80d62cb35d280454f616ae456076c6edca457821e5bb14c078989e6` |
| design/result-reactions-activation/README.md | 设计、方案、规格与资产制作说明 | `901c000b051e1c73961aac1ec89562a89da8510776e5554f32edc2a537f7450f` |
| design/result-reactions/README.md | 设计、方案、规格与资产制作说明 | `cd1c160ace19162d6dbdf5f6dce411e9c1b975bc9f45adb4427f41f5f3707d5c` |
| design/result-reactions/all-eight-review.md | 测试、评审、验收与发布 | `6121e307d8042dc0bc69a5043019b728efeec8fe763d648ba3e5e2217155968e` |
| design/result-reactions/blue-glasses/README.md | 设计、方案、规格与资产制作说明 | `b1bfec9689073fe012fbf67f4d099e01c2a783252b0b1ad99dda4366122669c8` |
| design/result-reactions/current-authorization.md | 设计、方案、规格与资产制作说明 | `7d1b7420bfd7e2d6e303025439c83ab042422f7d806ba77ecfef19c6e04ff4b0` |
| design/result-reactions/first-batch-review.md | 测试、评审、验收与发布 | `e0fe3fb697be2b9242e88f56629a0e96f0772d0e2916d58dfe14cc765fdd038a` |
| design/result-reactions/mint-puffs/HANDOFF.md | 协作、交接、决策与历史保全 | `0c22ef16d21111359d87726377da960a644b56cf091f39ba15244d41900243e8` |
| design/result-reactions/ochre-freckles/README.md | 设计、方案、规格与资产制作说明 | `7eb1a86528777d91e997315c7c23f49dcf02abc6544f5ada59858708a9f9582f` |
| design/result-reactions/salt-pepper-beard/README.md | 设计、方案、规格与资产制作说明 | `e61df6f76d638692c306ddfd26d27ec9513c57ea317a03223ef59ebe3e3b8f8c` |
| design/result-reactions/sunny-moustache/README.md | 设计、方案、规格与资产制作说明 | `940e1fd22d3ca8301279fd8c0b4f606fd63b3b01aa91432f76f6a673bb236c3f` |
| design/result-scene-implementation/README.md | 实现、集成与迭代说明 | `a5dce1ce38430bf19622ed9025e8d7d891f84c27870a327bff1233190e42fe77` |
| design/result-scene-proposal/README.md | 设计、方案、规格与资产制作说明 | `2e91e3abde9e6aaed44f77241fa3f26b5d255aa2a43bbc8d5582069afd52f1fa` |
| design/styleboards/README.md | 设计、方案、规格与资产制作说明 | `6d8793f01574951165fa6ec9120dc8e3084ea269b513a979e77c31986fb57cc3` |
| design/styleboards/playful-voice-v1.md | 设计、方案、规格与资产制作说明 | `9e9227330f87a3b73533e655ee203ccdfcfac026e135f7f5bce3cdeca7a04d2d` |
| design/styleboards/playful-zh-notes.md | 设计、方案、规格与资产制作说明 | `cf01962ae2a8b6004263650107fd2595e9c1d46a979e8c0fb28ab89891804917` |
| design/ui/README.md | 设计、方案、规格与资产制作说明 | `5e4e6ac82e579c364d9ff88166f44158259f337926f17fae98c92b82ef957f16` |
| design/ui/spec.md | 设计、方案、规格与资产制作说明 | `6377afa5fbe2d22c8b10efaf6ad01bca518c5feaec6ad96274a0ed111f222221` |
| design/voice-connection-interaction/README.md | 设计、方案、规格与资产制作说明 | `0f90bebb8b86de84c77c7683a33d75371400272d532039e75aeffc70b31623dd` |
| design/voice-connection-interaction/position-revision/README.md | 设计、方案、规格与资产制作说明 | `6a81d8689038fd046defea1391dec8bd463f3b343582615ae39772c47475d997` |
| design/voice-connection-loading/README.md | 实现、集成与迭代说明 | `e7462ac4dabe863796ab9a3bf21b654c547ab41eb31efb0201901983b75f96cb` |
| design/voice-connection-notice-options/README.md | 调研、实验与性能分析 | `1487210f95487aa921a40a775deeb985a0ed860316f43b5663a8f895f5199d50` |
| docs/animation-first-render.md | 产品、模块与其他工程说明 | `1cef3f6829c6f56e97ac26ff7a2aaee0c675d6e1f761cbed4a330795778caf70` |
| docs/animation/2026-10-25-crop-audit-correction/README.md | 测试、评审、验收与发布 | `5f563c07d07d05cb071219521df6ca02c3493c62dfc581dd6cae241fb9d1bb99` |
| docs/animation/2026-10-25-motion-revision-parent-review/README.md | 测试、评审、验收与发布 | `f37608966f80b22f4810ec0c4400edc44d60f125ab8e787d868fd7e695a09e87` |
| docs/animation/2026-10-25-rigid-motion-game-integration/README.md | 实现、集成与迭代说明 | `cf7b85979c261a3fd43fa58dcc9c15ae009f6b1f4e2846c127f25017b126b0b2` |
| docs/animation/2026-10-25-rigid-motion-parent-review/README.md | 测试、评审、验收与发布 | `c4e2931e21d22c16da7521c38c1176c34c681547b54f02082d3835ced8fffa75` |
| docs/animation/2026-10-25-silver-exact-canvas/README.md | 产品、模块与其他工程说明 | `4874b4e8fc54b5f3333ec942177b0aed7d17554c7272aced248512c1a8922355` |
| docs/animation/2026-10-25-silver-seam-fix/README.md | 产品、模块与其他工程说明 | `231f31cc4a4a0122b90fc1159a35ff59f5f810dd7d9cbb975f17dec0f02a57d2` |
| docs/animation/blue-glasses-game-integration.md | 实现、集成与迭代说明 | `7006b947298657f9f5850819f171e1e9f30a0b43e477cc244a16928090e945ee` |
| docs/animation/combined-final-animation-verification-2026-10-25.md | 测试、评审、验收与发布 | `9ce6ac03faf2b19ed16a8b572ce2c21d5a75b6997ed04e623cf4c368fda2b8ea` |
| docs/animation/contract.md | 设计、方案、规格与资产制作说明 | `488f1059f0135ccd87eaffa2463696465da1b5eaaa4541dc40e326274fa31eb9` |
| docs/animation/coral-game-integration.md | 实现、集成与迭代说明 | `eca139d4dca9e7fdc3061fc64dec54b707540be96918b49fab71e588fd3219ed` |
| docs/animation/gray-plum-game-integration.md | 实现、集成与迭代说明 | `89bb6bcb880c09baf652a9e68315af1ec7cf6913e6eedfe2a6207a1b3050e504` |
| docs/animation/mint-ochre-formal-game-qa/README.md | 产品、模块与其他工程说明 | `53c77f24f6c5294da27301b2f490780ce0713b90143a9c8b7b0e88438db4a4f7` |
| docs/animation/mint-ochre-game-integration.md | 实现、集成与迭代说明 | `126f63d070f7e28c9a0d510f9e921154bc950b4806db1f5791196e8097bb15a4` |
| docs/animation/production-workflow.md | 设计、方案、规格与资产制作说明 | `1a75334c9049378b1c72cdb110b8b6f4dab088e59e145d4c005049cc1c7d4d98` |
| docs/animation/silver-bun-game-integration.md | 实现、集成与迭代说明 | `be4bb3c9308adddbe0be0dd7f970a53a7df24acb415bc2e119d6f9793a8ff3c1` |
| docs/animation/sunny-moustache-game-integration.md | 实现、集成与迭代说明 | `08673f0bd807c4be29db0574c213c39e33fa215cbff824b355c85f34c5e1449e` |
| docs/architecture-design.md | 设计、方案、规格与资产制作说明 | `47fe0d0d53df49a418ab60629b5bc023f0806f5296dfb5207ec631001ccc3b89` |
| docs/architecture.md | 设计、方案、规格与资产制作说明 | `8e889899d18c61277292cdae9ec07121cdf1076b2adba169a1f818295735fbc4` |
| docs/archive-inbox/editor-history-2026-10-25/README.md | 协作、交接、决策与历史保全 | `ca6e5a95dae032143683ec9370869f824362799d31cb72049ccb8c8ab407dbfc` |
| docs/archive-inbox/editor-history-2026-10-25/chat-design-notes.md | 协作、交接、决策与历史保全 | `e6ac8626b6ea020c74e60bb91db79b2828916a06c81b9b133e8b1fc93f9bc8f9` |
| docs/archive-inbox/investigation-visual-history/README.md | 协作、交接、决策与历史保全 | `6fdefc2e1b3bf1c1e3fc237d5fef0663d352afe41ee8f097015d25a02ca3bd4d` |
| docs/archive-inbox/investigation-visual-history/chat-recovery-notes.md | 协作、交接、决策与历史保全 | `66fe9e861670d7931de0bc982b90ec5af4ff56291da5c6daa99bc31f630b424c` |
| docs/archive/2026-10-25/README.md | 协作、交接、决策与历史保全 | `8110b5e2a3463ac026bcb1e90efaf1d994fbbe326f70fdc337c36a4484457d56` |
| docs/archive/2026-10-25/animation-history-followup/README.md | 协作、交接、决策与历史保全 | `ddf7ad618812fd10dd762ab9979d52c50b528b9e5a0a5aa2eb9ac9515867f401` |
| docs/archive/2026-10-25/coverage-design-preparation.md | 协作、交接、决策与历史保全 | `6d16cda6adf60e85d31415f9ac4c9018ccb6be4edf2a48546087d8b2a0d72d27` |
| docs/archive/2026-10-25/history-followup/README.md | 协作、交接、决策与历史保全 | `69ae2fbe75b07ac2a89f4e4d626dea2d3fca5b434d85c79a414344e82b949779` |
| docs/archive/2026-10-25/invite-access-paused/README.md | 协作、交接、决策与历史保全 | `eab7016c34fe83e32e667b67d591ae4d17bcef7f39b9b8ae027da292c2de3fd3` |
| docs/archive/2026-10-25/invite-access/README.md | 协作、交接、决策与历史保全 | `6d224e41f32bd9616cde1a38878b9f8c2f7a2d14aef89623655cb02856ddd4fa` |
| docs/archive/2026-10-25/release-retention-not-adopted/README.md | 协作、交接、决策与历史保全 | `12f21abdf8f2239155e084ddabe86a19b1d80860df3019301b9b2c26fb4a25ec` |
| docs/archive/2026-10-25/share-boundary-incomplete.md | 协作、交接、决策与历史保全 | `9abb7c16a670459f461c042e6e28bfa33851d663b6c57d8cb0c86dca450c3018` |
| docs/archive/2026-10-25/share-browser-results.md | 协作、交接、决策与历史保全 | `36b53f29a9df15886bb677b6cc723b89900ea449fb7139ab2d768a2e39c82056` |
| docs/archive/2026-10-25/sunny-visibility.md | 协作、交接、决策与历史保全 | `62cae09e479911d75769b1317f3279259566da2415530e84341e14370dd97df5` |
| docs/archive/README.md | 协作、交接、决策与历史保全 | `64d3b96eab2259c0295da95f8e164fa0b105f8907264968946dd45a6e3947c87` |
| docs/background-character-names.md | 产品、模块与其他工程说明 | `300b1c6cef308fdd8dc93851050d21ab55decc9f2f19e2708f834a22d5ed5d6b` |
| docs/builtin-case-json-implementation/README.md | 实现、集成与迭代说明 | `cf65a8db1dda3d91f98eac0a5d7b05da087f1ae22ba3a298288cde72e4f86a18` |
| docs/builtin-case-json-proposal.md | 设计、方案、规格与资产制作说明 | `86a59679c76ea9da165ed1719bbace8a8e722c213d42b05106af2d2984f2a872` |
| docs/bundled-case-catalog.md | 产品、模块与其他工程说明 | `e654237c0fe26a51351fb94313f037caae9b85b795c64f87339e39bb7da6740c` |
| docs/cartoon-3d-investigation.md | 调研、实验与性能分析 | `67f5e4abb4076cd9912a131b412e7cbf9990cf3adeca028a3ad99ee29308899d` |
| docs/case-behavior-validation.md | 测试、评审、验收与发布 | `98a22576f37091bcd5dcc7f43b39c8ff6adad14d7c401a70a43bf3f2259fa0ba` |
| docs/case-content-revision-2026-10-25/README.md | 产品、模块与其他工程说明 | `d15a96af7efd078cc3c0ff88e46228b39c14d03ef8ce4d8d659b770c0f130050` |
| docs/case-content-revision-2026-10-25/dialogue-matrix.md | 产品、模块与其他工程说明 | `cbf7a487867e791b786d79ed54ba17ef50e3917ad188e120a320aa1eef180847` |
| docs/case-live-followup.md | 产品、模块与其他工程说明 | `93c35de8a6bc18b45feb422f50f1f968cd76e7f239cc48b145487e9f1523ef75` |
| docs/case-live-validation.md | 测试、评审、验收与发布 | `f35aed8747bccc73df23f4206671218f689136a0349daf5d2e0b33be8bbb0a2e` |
| docs/case-options.md | 调研、实验与性能分析 | `7c8143647074b7fbd15786e5c1e98707386c4109ceade7fa80b971af151f69cd` |
| docs/case-title-rename/README.md | 产品、模块与其他工程说明 | `1eadad641dd69e42b422becb3977baf11e753cd7661366359facf2c84b76fb31` |
| docs/character-name-highlights/README.md | 产品、模块与其他工程说明 | `394eedfdbdd818497b44aac704a550b2b99ca05acd2e4154c0c3946ee5468eea` |
| docs/character-name-highlights/combined-verification.md | 测试、评审、验收与发布 | `d780e19dfefbef6e5113c03e863765ebd1f616bf119594ad67ccde826a393d17` |
| docs/character-name-highlights/draft-status-position.md | 产品、模块与其他工程说明 | `d2a76828c2a54c0245516c68f950916b4de480a3f401ef05753b75a9f785e76b` |
| docs/character-preset-migration-implementation.md | 实现、集成与迭代说明 | `d9403679bc5fef8447d27476171601f3c05e60e4a8637895be61ed2099512ed2` |
| docs/character-preset-migration-plan.md | 实现、集成与迭代说明 | `85d9444b4011e3e9814e98d330757038093d0240954b853811b4746ccd3265dd` |
| docs/character-preset-migration.md | 实现、集成与迭代说明 | `8379ce9c66d3e53adad9984881ad3eca493168149f74f0161475a860b3dcd556` |
| docs/ci-cd.md | 产品、模块与其他工程说明 | `d5c174075da7b441eaddcf921391b6ad68557c7179a5b9ca9207a1899a2cf7ba` |
| docs/cjk-numeric-spacing.md | 实现、集成与迭代说明 | `2bd986348154eb37a2987f6b5b502b48ed475686f3c22e92df855c0ebbddba3f` |
| docs/context-frame-guard.md | 产品、模块与其他工程说明 | `ab304d296d97fc91f948edd349c224e04684b7733f8422fd0294ae88eb4b4ca8` |
| docs/continuous-deployment.md | 产品、模块与其他工程说明 | `d895956410db67290650647e55641e9bfb68f6919d92a92507557cfa41664320` |
| docs/coordinator-handoff.md | 协作、交接、决策与历史保全 | `589653c89d1b61da543cea239deddaff23854c2dd6ce129d79607162b50522a6` |
| docs/coordinator-rotation.md | 协作、交接、决策与历史保全 | `6afb762b9aa71bcbac64a74e4206cde94796ccf1fb2596634d85303796bf404d` |
| docs/coverage/README.md | 测试、评审、验收与发布 | `f3a0c43343254e3df0e1e62782796c8d31e0f89457be19d71e4daed3dfa637f2` |
| docs/dependency-audit.md | 测试、评审、验收与发布 | `e5314c75ea528bc4910ba201f34f2ff7ce680718aff5630f5b9e6ff512195c7c` |
| docs/deployment-options.md | 调研、实验与性能分析 | `b0c8dc68fa9eef4d765a48c743b4dabe9997dcff5062acd05af072a5d4edf649` |
| docs/deployments/2026-10-24-animation-milestone.md | 测试、评审、验收与发布 | `6a1c2e5b31ad785cc3483e5a6bb242935d82f57d1621ead75316e956cc820415` |
| docs/deployments/2026-10-24-editor-milestone.md | 测试、评审、验收与发布 | `7f57b9fe9e1189d59af610f627f00266571c5d62be2ab1374224c2a4e6e976dc` |
| docs/dev-websocket-rejection.md | 产品、模块与其他工程说明 | `dedbf3c92315e2a55201250e120236703dbd110250da2eab9fde437b6fb47109` |
| docs/development.md | 协作、交接、决策与历史保全 | `daa065b6a7c5fcc0b29db9cd7bd8fa54557dec98caf1600a4e1606d32bb3aa30` |
| docs/duck-finale-validation.md | 测试、评审、验收与发布 | `c2e9301e4c7afefa01a1fb4d5688b356dad59b877bd35f7b3265e007536ceade` |
| docs/editor-official-submission-proposal.md | 设计、方案、规格与资产制作说明 | `0e39d1b3654217d1d6bc0449d9c1ea038fca829b408e49cecbd98def7fd7a593` |
| docs/editor-state-recovery/README.md | 实现、集成与迭代说明 | `9bcc4cec4f4989ffdb0ae1a568a8d372d84788c50eeafc00df765a3ac62e1d88` |
| docs/editor-state-recovery/combined-verification.md | 测试、评审、验收与发布 | `7025fb00f2c24714581428a51b3a2cf80b02c7e601370c8c8f354266ad9ddb41` |
| docs/editor-unique-names.md | 产品、模块与其他工程说明 | `2a993fbde11937de464c67b60fbf4d3950796cf4643a3fa2abb1695c432c2ce9` |
| docs/expanded-preset-voices.md | 产品、模块与其他工程说明 | `c07215a73a7cba88275b8090498612152c6bf694e8dd9623f8becf859de15c11` |
| docs/experience-audit.md | 测试、评审、验收与发布 | `23e3c58ad8354690f37a3b2fb217e4bbb6cc89ab07d35a4fbfbf679f4f4edcad` |
| docs/game-editor-implementation.md | 实现、集成与迭代说明 | `61728fe182f6cdd0b02714852617a942cec896ba0c34f55028a314686d84ab2f` |
| docs/game-editor-proposal.md | 设计、方案、规格与资产制作说明 | `0e0cd1cdda549bf1202363193a8aa949f04e40843b47e1815a710020aa6011c6` |
| docs/gameplay-proposal.md | 设计、方案、规格与资产制作说明 | `ee3ac2216ee704416a3e444af77088de567b70fe96a92b96d4074cb0f216a493` |
| docs/hackathon-case/README.md | 产品、模块与其他工程说明 | `8897ca3daf5c4b74ce0bac7bd413ceae5d1965cc845a17d3b9d6e972e99f8868` |
| docs/hackathon/authoring-notes.md | 产品、模块与其他工程说明 | `21250bcd48c1e0f36151a6664dee98d0bd4b29eb02e56780360a2120f81f7c4a` |
| docs/hackathon/project-highlights.md | 产品、模块与其他工程说明 | `8b2751499e5906f2b0279509cfa1a5f7cb76045310827239f860f4625bbb6b36` |
| docs/header-logo-implementation.md | 实现、集成与迭代说明 | `22befbee2e54f7590648487c939016ec22c3b710f7e920cdaf0d293e7aa3f40e` |
| docs/header-logo-lower-right-design.md | 设计、方案、规格与资产制作说明 | `65ca00ec29dc71cb68dbb2e3458b8f31beb54ea87c953d80c594a22faa9d4422` |
| docs/header-logo-underline-design.md | 设计、方案、规格与资产制作说明 | `992b392ade4202daa2e0351473f05fb0d63c79fcb0fbbf2eaa802ecf9bbf3771` |
| docs/history/2026-10-24/README.md | 协作、交接、决策与历史保全 | `926d9fae92aa2e96a950c9cb75a742cf1cbbad0a930c1863fb0fdc75fabc3eba` |
| docs/history/2026-10-24/combined-ui-animation.md | 协作、交接、决策与历史保全 | `c7e4ebfeea8c9b19f9b9a8149ed6b01e39b74ece124424700e9155dc3e0bb42d` |
| docs/history/2026-10-24/coordinator-takeover.md | 协作、交接、决策与历史保全 | `fbeb05afc5f57ee7d648f445559406e295104732a53c34e3fb4ec4e0252d5999` |
| docs/history/2026-10-24/editor-feedback-integration.md | 协作、交接、决策与历史保全 | `d47ee030ba3f1cb5d68b5951fa59e416f0ceb4fe200944e412dd573421a4fb34` |
| docs/history/2026-10-24/investigation-input-feedback.md | 协作、交接、决策与历史保全 | `c00a63d63c1fdfe09490b9030531cd5d9599f6adcafa1a607453c65cbff38c78` |
| docs/history/2026-10-24/ui-polish-acceptance.md | 测试、评审、验收与发布 | `fe5cb6511992fca56e9560ac2bc4e6de14561564bfd595220e6a17953d7b4ae4` |
| docs/history/2026-10-25/README.md | 协作、交接、决策与历史保全 | `9cef29f1d2719516c992e810121993c4808c79aa34d4ab54f3bd92781d14ceff` |
| docs/history/2026-10-25/accusation-fan-layout.md | 协作、交接、决策与历史保全 | `73dfb878abc906ea52bd3ba62e506565ccf7d675e8698f4406f5aaa870046894` |
| docs/history/2026-10-25/coordinator-arrival-01a17012-fa00-7170-ac0a-21c1900d71cd.md | 协作、交接、决策与历史保全 | `eee4e44aaad5281c4a21c79eec595c3d7ddfcf4585a8e591439f2181d7cf073b` |
| docs/history/2026-10-25/coordinator-handoff-01a16e3d-d2f9-75e0-a09f-d39d5ab927dd.md | 协作、交接、决策与历史保全 | `b9eb45c05042d34548ee856d5405e91c0f96713133100dc4566eef527dc82cae` |
| docs/history/2026-10-25/coordinator-handoff-01a16f33-082b-78b2-bb32-b6f49fb4850a.md | 协作、交接、决策与历史保全 | `2055538df73ffe42ea4525607c2ec46a3291a77bf9e75b4882afa1e00b1949e9` |
| docs/history/2026-10-25/coordinator-preparation-01a17012-7249a6f/README.md | 协作、交接、决策与历史保全 | `5d433c17fd2aa9333c84b7ccd48e28497d8bb07aeae73477588a3b867488c0a7` |
| docs/history/2026-10-25/coordinator-preparation-01a17012-7249a6f/coordinator-handoff.md | 协作、交接、决策与历史保全 | `229b86bf72947b87b3447d2d52987fab3cf4c5bd027ea511d5a24079dd0095a1` |
| docs/history/2026-10-25/coordinator-preparation-01a17012-7249a6f/coordinator-rotation.md | 协作、交接、决策与历史保全 | `ac58cceacd0d97e9eb1a0f535d65ec51b3bb8a66e41ffa4b00d15cab9189316c` |
| docs/history/2026-10-25/coordinator-preparation-01a17012-7249a6f/development.md | 协作、交接、决策与历史保全 | `d60ccb83279854743bdfdee76dc98cb1e7927abf53b26e053fec8b86e2ca0614` |
| docs/history/2026-10-25/coordinator-preparation-01a17012-7249a6f/project-plan.md | 协作、交接、决策与历史保全 | `7bdb019151111dd7f7de0b1a9a5bfddaff7182377007e4d333d6dca2bfeb3194` |
| docs/history/2026-10-25/coordinator-state-before-refresh-30822d3/README.md | 协作、交接、决策与历史保全 | `b964984411668ec9fe17f7b8ec1028c98767dd2a2dd5e8a4622f07c4cde425b0` |
| docs/history/2026-10-25/coordinator-state-before-refresh-30822d3/coordinator-handoff.md | 协作、交接、决策与历史保全 | `88df07387b17465c793f28ddd6a926ec32bbe76eb3192569827a0925d3b2020a` |
| docs/history/2026-10-25/coordinator-state-before-refresh-30822d3/development.md | 协作、交接、决策与历史保全 | `8730a577e6b51a54ae493f32fa457d636786aba761fdb23cba99649647ed675b` |
| docs/history/2026-10-25/coordinator-state-before-refresh-30822d3/project-plan.md | 协作、交接、决策与历史保全 | `9bbab5802f0816892e4494ebfa78835eddd7addd9b09cfe30f1a510662d2f952` |
| docs/history/2026-10-25/coverage-publication.md | 协作、交接、决策与历史保全 | `602f0f4290f54189f9523c730ba8647ec84ad307ddd9738867f0f6d88e9792ef` |
| docs/history/2026-10-25/dashboard-before-a0e-release-archive/README.md | 协作、交接、决策与历史保全 | `00f8072e5f22807c6469b1d6661b48f89993d619dd5f4645ca013d94306df72d` |
| docs/history/2026-10-25/dashboard-before-a0e-release-archive/coordinator-handoff.md | 协作、交接、决策与历史保全 | `9880f19f99d6d6e8fb792ade7318a5d15983f2127f58135c3b3056af5bef0b9c` |
| docs/history/2026-10-25/dashboard-before-a0e-release-archive/project-plan.md | 协作、交接、决策与历史保全 | `24b826d102bb82d82c331e8a2f07816b0c6ec1397b573613d0c6358b58402436` |
| docs/history/2026-10-25/development-service-cleanup.md | 协作、交接、决策与历史保全 | `c8ebba67f545ed588bc9a779baa08497cbf9cfdc36caa5bbe83b35ddd31eda94` |
| docs/history/2026-10-25/home-flow-typography.md | 协作、交接、决策与历史保全 | `6d011d432e5fd36a3369c32e2d0b7330df46d44a71424d6f93cf06c3dc4d904e` |
| docs/history/2026-10-25/invite-specialist-chat-handoff.md | 协作、交接、决策与历史保全 | `e53485248322257f51a94451dbe3b4409bc804d63cbe27cacc5152aff4f05ba9` |
| docs/history/2026-10-25/main-preview-stopped/README.md | 测试、评审、验收与发布 | `91b279fcaaa82248a2ec838caf2db70f773b852bf6612d80efd50f9f3ed65556` |
| docs/history/2026-10-25/share-long-text-wrap.md | 协作、交接、决策与历史保全 | `5049fb9f99c45d168e2ad37aee25b6f63077edd4b18e4e22398060ceefa06cd7` |
| docs/history/2026-10-25/three-character-dawn-candidate.md | 协作、交接、决策与历史保全 | `7ff3e20af78556f72e474aa3ef45191b81d278ba66e64a0bd13f4051959fa8a9` |
| docs/home-case-flow-proposal.md | 设计、方案、规格与资产制作说明 | `6bcca50b47fb365578c84adc94059f3c9d4f9d03fefaeb803deab6fc660b1cde` |
| docs/home-mobile-section-spacing/README.md | 实现、集成与迭代说明 | `cdf188e176a3489f1122d2e73d201aed30efc9daa941cbe82298f5b55334986c` |
| docs/home-scroll/README.md | 产品、模块与其他工程说明 | `078a41198e649da184eff501306fb9224f7a9e31615c1a649b18b569bb9e23dd` |
| docs/interrogation-budget-proposal.md | 设计、方案、规格与资产制作说明 | `654619571d2493cc65379c9a4f457182eeeafdc2ecfe5c3f3417057a4d6b430b` |
| docs/investigation-controls-implementation.md | 调研、实验与性能分析 | `ef2cecea578e0d12da4ea8b8014d85a953ee7fdf175f83a548eb5766d2345b41` |
| docs/investigation-portrait-loading.md | 调研、实验与性能分析 | `213b5c0070ec075ebbff0e3a8912d0a5c760fb4a710d22c98c10c23450a0d086` |
| docs/investigation-transcript-title.md | 调研、实验与性能分析 | `a67d98d1c62793049404aae2806b929a0d2ce1ae79d4de156bf6bdc9acdc2293` |
| docs/investigation-viewport-height-combined.md | 调研、实验与性能分析 | `31e84b6ea766b4fed428a08254b12ffe5cfec206c450075dc98610857220b322` |
| docs/investigation-viewport-height.md | 调研、实验与性能分析 | `7f634a51c0ecb0730d0767761208891f7db5a0cca86e5f7c8cf7443982c6fb92` |
| docs/invite-access-design.md | 设计、方案、规格与资产制作说明 | `a2c6ed2dcd362adfad2bd1dc46cae37bc86b67c3ca02d2966d5b760fe2e250fd` |
| docs/linx-quota-investigation.md | 调研、实验与性能分析 | `ec49b6e199f403d91a5168eefc8de87a1fdb31722f63cc5d5ecd0a4eec2446b5` |
| docs/older-male-voice/README.md | 产品、模块与其他工程说明 | `8c5359eabd8790c7cb1fffd937591d14884fe8f69e55b44cbed32633db3e996e` |
| docs/older-male-voice/available-candidates.md | 产品、模块与其他工程说明 | `a8355a7e21129b4847158acb0726123a91bdc0894a2a62797f852a86af9f3b1d` |
| docs/older-male-voice/mapping-decision.md | 产品、模块与其他工程说明 | `854e32ff095be44963029d52df3132e22fda9215fc07a676fd2a64f514fc63f7` |
| docs/online-voice-preview.md | 测试、评审、验收与发布 | `e5fff3f94b5d361c5914b201e87491f3d50b7af059b17e0c9abd6dda154f4bfb` |
| docs/page-titles/README.md | 产品、模块与其他工程说明 | `2a04dbbf1b6d7b27552e35e118354d649c353d94bf9559650e81680c5b73c096` |
| docs/page-titles/home-brand-only.md | 产品、模块与其他工程说明 | `b6b5204e8ef167f5a3c923e3665b31ef1d7080c94812dbc98f457228cad63739` |
| docs/page-titles/result-contract-combined-verification.md | 测试、评审、验收与发布 | `a9b345be16816a7593fa0ab5ce54f8a1450bcc1511ee34b73729d874d01ca522` |
| docs/pending-ui-feedback.md | 产品、模块与其他工程说明 | `2108d3067c094f1a2ba09f1c5dcb1237dd5328ee8c8f19115b876bcbf8a7006f` |
| docs/performance/2026-10-25/README.md | 调研、实验与性能分析 | `94937a4998fa5dc608028618b02242b432b8fdeaa745be3581044e9548a33604` |
| docs/performance/2026-10-25/combined-first-render-verification.md | 测试、评审、验收与发布 | `671e3f7aad48951a6b0574a529165ce9d8f4543ac508654a606ef5d4d0761a2c` |
| docs/performance/2026-10-25/combined-visual-verification.md | 测试、评审、验收与发布 | `fb7881fba798ebd6980c6c22eb4b58e526153e67fe21204ecfd93aeb18ab22bf` |
| docs/performance/2026-10-25/combined-voice-verification.md | 测试、评审、验收与发布 | `f21da13fff35f52eb4b0c69b84d2ad64fc667393ce817baf485562bb769f85fd` |
| docs/performance/2026-10-25/deployment-consistency.md | 调研、实验与性能分析 | `2723ed279ebaa8384d51f84f9def692160927e770b0100d2d99c321bcd1020de` |
| docs/performance/2026-10-25/implementation.md | 调研、实验与性能分析 | `8471077fb30ce96894a6d6f66af67e9d2760e4dad80a1c18274fd37cf4a6b349` |
| docs/performance/2026-10-25/png-investigation.md | 调研、实验与性能分析 | `a37c6d6b9270aa853db780bf8fb05bd16f51a3c95c1416278e7a118dba087e76` |
| docs/performance/2026-10-25/png-lossless/README.md | 调研、实验与性能分析 | `aed21c358a1ce150b76f2e1b6a469df390ad1e5a77645e2a3332eb34874a50f7` |
| docs/performance/image-build-optimization/README.md | 调研、实验与性能分析 | `624639658fdb0fca3900b95963ae1b465a80619bc6e3b02ea573f176cdbed4a9` |
| docs/performance/image-build-optimization/audit-2026-10-25.md | 测试、评审、验收与发布 | `cf53225977373c47378668e4452b43d6ac2aa12cee0ef9ffc001bdcba7b903e7` |
| docs/performance/image-build-optimization/browser-acceptance.md | 测试、评审、验收与发布 | `4646d81d027eafc761d2a851181b74f657fcfb89431d5b78731a789c0cba5144` |
| docs/performance/image-build-optimization/combined-acceptance.md | 测试、评审、验收与发布 | `bdd381ffa3295e33790ae2f3eeba30fc207547e784b124184010d6e28ad07ac6` |
| docs/performance/image-build-optimization/combined-main-verification.md | 测试、评审、验收与发布 | `977ee10f5a13e8df6d657dd91575a5fb37edef0bb7d24e09762df9b0795dda92` |
| docs/performance/image-build-optimization/q90-approved.md | 调研、实验与性能分析 | `d28a6b224d184ab07b596a621f94236d1fdf387a3de2aa8d00e6900c4c37ea67` |
| docs/performance/image-build-optimization/runtime-acceptance.md | 测试、评审、验收与发布 | `f5ef95a22592196bfa9b0651a20c85b86fc968c67fb2487d71e7043c76f5393c` |
| docs/pr-ci-preview-proposal.md | 测试、评审、验收与发布 | `c734dce572df8937c53a7f8423b4b76f8eb2c9d781a5d36908613b1a271043f3` |
| docs/preset-loading-recovery.md | 实现、集成与迭代说明 | `1aaa2b4e1f6dfa24855cff7f1761c89640f4259c60baabf83ce20961cc0996a0` |
| docs/preview-remix-visibility.md | 测试、评审、验收与发布 | `344cc5911689bdfa771472337a6fcbad3d447319fb121832a1a21d55504e9d0e` |
| docs/project-plan.md | 协作、交接、决策与历史保全 | `bb0dcc9c0741cb97bb8d0ebafab61bac64d59d874fc16813b0f5350e8e79f117` |
| docs/promo-video-production-research.md | 调研、实验与性能分析 | `ab956466ce86d46d20141fec0de5e5e6c7d87fce1e439dc8fd73b75c963ef21f` |
| docs/promo-video/2026-10-25/README.md | 产品、模块与其他工程说明 | `af83b59fa6a8cb9387ccd98820dc66eb0eb160c25cefc4ef6056f6895f7d4b5c` |
| docs/promo-video/2026-10-25/chrome-comparison.md | 产品、模块与其他工程说明 | `f673b6ddc6632c80f23e553a686fe4a18180af972d80ec664e3bedcadfd9fef7` |
| docs/promo-video/2026-10-25/combined-demo/README.md | 产品、模块与其他工程说明 | `c32c11a1597ec0df5b2f9f89951c648dcd108dc25052d38327f35354368c6238` |
| docs/promo-video/2026-10-25/complete-create-preview-share.md | 测试、评审、验收与发布 | `01f1f56c56a3646dc644e6a32fb2703c9604cc30c625ac0094ae4c25b4d82d49` |
| docs/promo-video/2026-10-25/full-gameplay-take01/README.md | 产品、模块与其他工程说明 | `57b1d08a8b9eee1d0d1f3c64de34eb632f9c8dbc32132ec91735101fd635684c` |
| docs/promo-video/2026-10-25/full-gameplay-take02/README.md | 产品、模块与其他工程说明 | `e836385f92413586eefb9c441fde6f2e01ef6f8abdc4e911b845a4c4b5fa94bf` |
| docs/promo-video/2026-10-25/gameplay-voice-feasibility.md | 调研、实验与性能分析 | `60810d4c2b8e8716338b1cb0ae1496ad8591b68e5cb05e8af1ee186b85e91a12` |
| docs/promo-video/2026-10-25/home-creation.md | 产品、模块与其他工程说明 | `bfc50d9a45a12f87eea32fa3e52488bf2339b43ab110c623e97b04fa3f4a8d6c` |
| docs/promo-video/2026-10-25/integration-review.md | 测试、评审、验收与发布 | `dfff5a158963d911a21e2f7cc35d94fd2c40c71c31079d1b2c2dd13081a96f84` |
| docs/promo-video/2026-10-25/joint-gameplay-recording/README.md | 产品、模块与其他工程说明 | `7f7bdcc0787e0ae9f93c1410dc347559407cf17884ddb3d206a8667f41df8354` |
| docs/promo-video/2026-10-25/live-diagnostic-take02/README.md | 产品、模块与其他工程说明 | `d5bbed0fbbb2b4e75db2003dbd515a63a22abd125224453c598f09700a70ba13` |
| docs/promo-video/2026-10-25/live-short-test/README.md | 产品、模块与其他工程说明 | `2d2d3c55004edc152a2d6d57593e19b43f707008af486fb97575727f2ff25b32` |
| docs/promo-video/2026-10-25/mobile-demo/README.md | 产品、模块与其他工程说明 | `c90289930d99cf27aacd6b99eacb745e0b975b40ee427b1059aaf197a71fc875` |
| docs/promo-video/2026-10-25/offline-audio-review.md | 测试、评审、验收与发布 | `fe99b12435052e6f44ed25a04f62acc8c5c884c870044141e1b202d6c7871a1e` |
| docs/promo-video/2026-10-25/offline-dual-audio-check.md | 产品、模块与其他工程说明 | `151fe91b18755aa389473c894c59515085234d61aa030d08c63247597e8dbcd0` |
| docs/promo-video/2026-10-25/passive-voice-diagnostics/README.md | 产品、模块与其他工程说明 | `7dada8bdd139dfa325a1a7082386cb3b3ae3f869901d59801d7ace15eb91ae4d` |
| docs/promo-video/2026-10-25/user-tab-probe/README.md | 产品、模块与其他工程说明 | `9eea0150984c3b82c69b02a8bf039081ed7229d5585c413e5ce06ec1c101a4d3` |
| docs/promo-video/2026-10-25/user-tab-recording-take01/README.md | 产品、模块与其他工程说明 | `8b36a1c7c58c193b8d0e571a50e78ee463f9e524b802722df63052dd4536377b` |
| docs/public-voice-launch-proposal.md | 设计、方案、规格与资产制作说明 | `dc54ca0490ceb25cc5dbad611030d3fdfec8d43808746495c101bff06506cdc5` |
| docs/qa/native-share-editor-600-2026-10-25/README.md | 测试、评审、验收与发布 | `82d5a0a614c7ac4d479f98589443509ee0eb34c968145472d50fc4284eb2102d` |
| docs/qa/native-share-editor-d4c-2026-10-25/README.md | 测试、评审、验收与发布 | `b8d522b9d50a51c376bbd923855889477122c302ceb393467bc16e7bc7c72346` |
| docs/qa/released-share-editor-2026-10-25/README.md | 测试、评审、验收与发布 | `96ff76401d483ccd8ad27047737c1f80634c38159d7e09afeec39dd1906df610` |
| docs/qa/stable-exploration-2026-10-25/README.md | 测试、评审、验收与发布 | `a098677e94a0c01ec2e2e827c911a28116d7795769c51a20b881ecb7370fda1b` |
| docs/realtime-voice-validation.md | 测试、评审、验收与发布 | `a6357804bb27f625e6fbe6015ba8ff8d72acf3bba575cb7f56e7f39f89085b30` |
| docs/releases/2026-10-25-combined-demo/README.md | 测试、评审、验收与发布 | `7e680ef2535ac84b37f43711d17afb4b3e06d7db5207297b1630f053c9175d30` |
| docs/releases/2026-10-25-cream-notice-home/README.md | 测试、评审、验收与发布 | `e4590c99ae7db0e70dfcfc36e23516ba2b66d5048dc96395ad6320e939772601` |
| docs/releases/2026-10-25-docs-refresh/README.md | 测试、评审、验收与发布 | `c07a5895c6d807fa89b7bb5b04916dc5dace89a03eba7275ebd1468ce41dce8c` |
| docs/releases/2026-10-25-final-materials/README.md | 测试、评审、验收与发布 | `297af3e22a0964f1082dd59d1b64235852efac6dc9cb50a7f6d37972ea71c110` |
| docs/releases/2026-10-25-first-case-rename/README.md | 测试、评审、验收与发布 | `32905f22cde1bc49bc3ac3ef22196e45e2eac6d3037094d89a58404ea3458342` |
| docs/releases/2026-10-25-hackathon-case/README.md | 测试、评审、验收与发布 | `87f5bf808cb4333b1ccdb2fa9434478e55f7d87c3b5ed6d1cefbe3e65169d3cb` |
| docs/releases/2026-10-25-header-audio-archive/README.md | 测试、评审、验收与发布 | `ea1ab8a1291d69a4922b9e6f32979fde915adb20144c9a5fe10151d5513c5780` |
| docs/releases/2026-10-25-header-design/README.md | 测试、评审、验收与发布 | `466701c8ca0278e9684eb2e27486d061632ef227e47e915f7bff836dccca75a3` |
| docs/releases/2026-10-25-header-spacing/README.md | 测试、评审、验收与发布 | `1eaf013f5e899521af16b5aed9a59ad1ef3c6391895396a6a79bd37163333d15` |
| docs/releases/2026-10-25-header-spacing/result.md | 测试、评审、验收与发布 | `010bedf3baa41b304520b82a237323d3508e473778601a07798989217f33157f` |
| docs/releases/2026-10-25-main-refresh.md | 测试、评审、验收与发布 | `2ae8519c968b3d283093fdfd563fac9af7eb57281fd3d4d9fe6263177abffe21` |
| docs/releases/2026-10-25-native-video-archive/README.md | 测试、评审、验收与发布 | `fa6904f4b427053c521e68d894358cd75f99996f46090e2fe0c27dddb439ad07` |
| docs/releases/2026-10-25-portrait-loading/README.md | 测试、评审、验收与发布 | `63b4345f31c7b72c928e00eb1d2bca04b9921e062d3ca14e4b51bb00598ae711` |
| docs/releases/2026-10-25-q90-ci-cd/README.md | 测试、评审、验收与发布 | `a00076c0b520a52b0b93984e926de5ea8ca638d14ea78cb2692cda6ad1a94d4f` |
| docs/releases/2026-10-25-q90-ci-cd/success.md | 测试、评审、验收与发布 | `de5b1b0aa05d4649c1fda71a4039e61065b080ed64b7f01f7ecb3fa5b1ec8613` |
| docs/releases/2026-10-25-single-json/README.md | 测试、评审、验收与发布 | `4aa9bb5494ab748b868bb586f6ce0d654ff2b42308704fba6a15df7dece2ef62` |
| docs/releases/2026-10-25-title-and-architecture/README.md | 测试、评审、验收与发布 | `23e16e562866ed04e716a5654c26d73f5aa48badc31f2d8b0cc5fea07d7edde3` |
| docs/remix-game-proposal/README.md | 设计、方案、规格与资产制作说明 | `614b8e4ddd0fb3b26ad14af71f59e470c84eab77c13065f70ebc9531ce1afb41` |
| docs/remix-game-proposal/combined-verification.md | 测试、评审、验收与发布 | `80cb80e460134980e61aff3f2736d2749987cb46f56cc50e34a71416bfcf47b2` |
| docs/remix-game-proposal/implementation.md | 实现、集成与迭代说明 | `a4ddfff1cb005f48f7e06c401f51e7d34134ef353bf60a72a229ed3adf504e8a` |
| docs/remix-game-proposal/link-refinement.md | 实现、集成与迭代说明 | `dd05eb15f42dd142da331b3cffe269a80f2b209a7f2ea9db33f33dfc54ee437a` |
| docs/remix-game-proposal/quiet-combined-verification.md | 测试、评审、验收与发布 | `a987368e6ec9596b0fe4ec05be319d0f88cabf6802cbd5acb08ec8685af628af` |
| docs/remix-game-proposal/quiet-refinement.md | 实现、集成与迭代说明 | `42dc3c6668228a5b23fcdd03f9f2e7fd6fe5d0382f539ee587432484cbd3e46a` |
| docs/result-character-states-proposal.md | 设计、方案、规格与资产制作说明 | `0ba8ddd931b35d7d5e9106802119e660ea060afa9f16182476c3725ad458c2da` |
| docs/result-game-ui/browser-acceptance.md | 测试、评审、验收与发布 | `67db42182b8f3f68b49094c13bcef286c98d130e50594a12f19785d90faa2950` |
| docs/result-game-ui/combined-offline.md | 产品、模块与其他工程说明 | `31ebaf24f190f15b73f42f08b695e944ec0031c404d13f202c2115603a126738` |
| docs/result-game-ui/final-main-verification.md | 测试、评审、验收与发布 | `73d37740c0a7ec3fe37a36ad876dc40bc7697d6baa693c1ca8fbcd9663feab9e` |
| docs/result-game-ui/handoff.md | 协作、交接、决策与历史保全 | `3c4b50ccf41130389487723e51f45a66940d89c5d20d11a32bfa0ed557f1a886` |
| docs/result-outcome-design/README.md | 设计、方案、规格与资产制作说明 | `6bb06be05718a1abab7cff46b444bfa820968c0f7547b5bb2057a1ee18820909` |
| docs/result-outcome-design/approval.md | 测试、评审、验收与发布 | `969263eb4235b3482a78a4dc5f107c72181a85dd27c7eff54546094f0e9626d9` |
| docs/result-outcome-design/character-directions.md | 设计、方案、规格与资产制作说明 | `76aed871d780e0178fcbb626c873e8d6747e8a04df2a0f95b5843bf6c948f2d7` |
| docs/result-outcome-design/contract-and-scope.md | 设计、方案、规格与资产制作说明 | `7cc868a710e0d1d27fa852b8dfad9f127e47164d83738b32a4eb09a74d63d995` |
| docs/result-outcome-design/contract-implementation.md | 实现、集成与迭代说明 | `8e41e8b9f5e5ea957b62d08b5442611ec092ce13ee2b93c24b8dcce52fabdab4` |
| docs/result-outcome-design/coral-review.md | 测试、评审、验收与发布 | `953b94ba3063578ce13c3e4fdce62d6bb629ede1a5505a6e5c47068fc3d61cdf` |
| docs/result-outcome-design/final-four-audit.md | 测试、评审、验收与发布 | `a3f56abd64081375050848b177dd443458efbdf3915b2c8d740391433765cb51` |
| docs/result-outcome-design/first-batch-audit.md | 测试、评审、验收与发布 | `4e3d08eed5bebc504c2a6d3c7f55981ca93df34c7df95b0b5f64c02d23cf88e8` |
| docs/result-outcome-design/handoff.md | 协作、交接、决策与历史保全 | `415ad68aa91bcc03b921550ea884dd5f6853b2bbb61db23a522d5618080d59bc` |
| docs/result-projection-implementation.md | 实现、集成与迭代说明 | `6be03fbb1b75dba4465eb50b069d01441e0d4480ab40f213b8ccc78c72c59e2e` |
| docs/result-scene-implementation.md | 实现、集成与迭代说明 | `14e61a17141aa6bb8d0fbd705c0dea0d7c793733d4d4005f33eb5e6e1d162153` |
| docs/result-scene-visual-proposal.md | 设计、方案、规格与资产制作说明 | `5aa025c7dc226ee8212e02edaf4c88197b00265983d6be5ae20f174909ca7b38` |
| docs/reviews/animation-final-integrity-2026-10-25/README.md | 测试、评审、验收与发布 | `dbe95070fe4a8923377d1b6852c1b2db573900a52ad9550659615e8d9d28b8ce` |
| docs/reviews/animation-rigid-batch-2026-10-25/README.md | 测试、评审、验收与发布 | `cdd9bdc49afdd491af17066f5aefe3c1839616897689308f426776c7cfd7ca84` |
| docs/reviews/architecture-code-review-2026-10-25/README.md | 测试、评审、验收与发布 | `b347bf30d5474cb1c9414e2e8407689777901e84e171a64b2b7e31509cedf2b7` |
| docs/reviews/architecture-design-2026-10-25/README.md | 测试、评审、验收与发布 | `6ae79469689e21a5786c4347bed9e6b64beaafd9205efccb0892d87879fe0ba0` |
| docs/reviews/cache-delivery-2026-10-25/README.md | 测试、评审、验收与发布 | `05b7e9d8793b727307977a9741f0cb24e9e97ec4aa1b96faac77e6157bc7ea94` |
| docs/reviews/combined-demo-1ae-2026-10-25/README.md | 测试、评审、验收与发布 | `de497d594861c20a2359429a06b7b453789ea8b0a632aad72a676e4fd333c8f8` |
| docs/reviews/content-boundary-2026-10-25/README.md | 测试、评审、验收与发布 | `6b59715e2f787a0af16f8d8b328a375d3ec30fcc9c04220f7176ad5dad129ab6` |
| docs/reviews/context-budget-2026-10-25/README.md | 测试、评审、验收与发布 | `7bc09314ebaf0b822f945745aefbad5b11e447e48dfef4ee00306a131d792e36` |
| docs/reviews/final-materials-2026-10-25/README.md | 测试、评审、验收与发布 | `7f1d878196423dc5d8edbc631182ecdbae09fe61e2d69dd71026c6da31cb5870` |
| docs/reviews/full-gameplay-take01-2026-10-25/README.md | 测试、评审、验收与发布 | `e1851427d4bcaadd4fdda1d6983f1a4c8cab8e5c1f72375a345e3abb01dff732` |
| docs/reviews/full-gameplay-take02-2026-10-25/README.md | 测试、评审、验收与发布 | `5255e4cbe962fea7ece85d9cdbb63921248903a0524dba72459e68c85417b98b` |
| docs/reviews/intermittent-voice-2026-10-25/README.md | 测试、评审、验收与发布 | `b5c1bb3d7ce65b639e8a8146c6ea0498ff1c1ecbfd24be6ff9fd9bf79e1a075a` |
| docs/reviews/joint-gameplay-1545-2026-10-25/README.md | 测试、评审、验收与发布 | `6020b2659362bb1ce5b84c105ea4a34dd906ddae1fae730995058adf9ba83141` |
| docs/reviews/media-and-research-2026-10-25/README.md | 测试、评审、验收与发布 | `fb0087e5cf1dc0ad40db1d7b1295af105fb3fd6b4f836a05d4eb307097707c45` |
| docs/reviews/media-and-research-2026-10-25/mobile-demo.md | 测试、评审、验收与发布 | `474aed4b28b5aa94358d1bc540af785b6e14dc9cb58c509bfe1f02ef72212641` |
| docs/reviews/media-and-research-2026-10-25/voice-latency.md | 测试、评审、验收与发布 | `3eee5aeea6bdcacf524e0d104be93799d2354a9bf4458887d7642f0bd81d3898` |
| docs/reviews/passive-voice-diagnostics-2026-10-25/README.md | 测试、评审、验收与发布 | `76edce20bb50065c8d02b89bc8c6a6f29941910740bbcca0f82550f3de868dc1` |
| docs/reviews/promo-video-72c5-2026-10-25/README.md | 测试、评审、验收与发布 | `bce8593cc5e6ea2bc955ea0433505347a5ef9eb505986f885965e30eac826aac` |
| docs/reviews/release-compatibility-2026-10-25/README.md | 测试、评审、验收与发布 | `ddc1a87c84cf6876df8cdec68fd3afa63577809e00c3763688d091784657ccf0` |
| docs/reviews/remix-state-review-2026-10-25/README.md | 测试、评审、验收与发布 | `b5ec4244e2b07e81c2cebd4f508695f0b6d7e024d2ee61cbd33fde8eb5e9e802` |
| docs/reviews/video-f623-batch-2026-10-25/README.md | 测试、评审、验收与发布 | `b22c77e8c366700c347b607c3c191878c484b54427dc088f07c8c857ba9ed9ba` |
| docs/reviews/voice-lifecycle-2026-10-25/README.md | 测试、评审、验收与发布 | `2e98072a99c403cb6fda83a3a72a0293799aec7307bd6b2961c3ce70bb6fc465` |
| docs/reviews/voice-lifecycle-followup-2026-10-25/README.md | 测试、评审、验收与发布 | `fa987a9c0f1adf46a18e214db02a1c62d05cabf78a8bd0fcb96ae5529ff867c5` |
| docs/role-immersion-investigation.md | 调研、实验与性能分析 | `c643a23a0a0e6f9d2ce44e3a7733aa66fd1e1569c4f2a43140e40300a49e316f` |
| docs/second-case-proposal.md | 设计、方案、规格与资产制作说明 | `9b2a1c5da070bdd26437251674d1b5692dede048aebe9f69cb649db55ef2d0ed` |
| docs/second-case-validation.md | 测试、评审、验收与发布 | `ea075226d1001822aea974cd0ef65cd8c1fc63430aa00ebbca86fdda4e56f590` |
| docs/shared-header.md | 产品、模块与其他工程说明 | `1a3901798fa54ae6677fc26dfd8798a103054855af9659adb196fc2f2e04d629` |
| docs/technical-discovery.md | 调研、实验与性能分析 | `3e4593e26b2fe7dfd4a816544d76524346ff49b23df03efa83e45818971e67f4` |
| docs/third-case-validation.md | 测试、评审、验收与发布 | `9f93032e447b8c086b655175355785dbd1849cdfe3e9352401800d53b04240ba` |
| docs/transcript-experience-tuning.md | 实现、集成与迭代说明 | `b996b26ad6023ca225c441aa8b36f1bc9b1e405197f43fd6f538800128b6df3b` |
| docs/ui-alignment.md | 实现、集成与迭代说明 | `90ad33c14c64ac2288720bae57b426e35d8e2416177e7330ac91396c98d855af` |
| docs/validation.md | 测试、评审、验收与发布 | `d18fb8bb88ac1ec983fbeaff041ef0aa58c3ec13af377e63b7d9bffd9fa6e623` |
| docs/visual-direction.md | 设计、方案、规格与资产制作说明 | `04adc379abe1471942bb34c7af1695f7670c6e2819faa671aebdbf87d4097435` |
| docs/voice-audition-validation.md | 测试、评审、验收与发布 | `b7867380f16bc2aebd79e5b69f0f771325ef4d453594fb2af3e1c382516f04a2` |
| docs/voice-catalog-notes.md | 调研、实验与性能分析 | `15c3e7418e7e2eb8dca1187756161f79bdcecdd78ddeade5b1e470a41c7a38ff` |
| docs/voice-connection-interaction.md | 产品、模块与其他工程说明 | `4fdaa0f75a47f19916389e356a34541ed4e194ec25f11ed2a7bda6ed09416cc0` |
| docs/voice-connection-latency/README.md | 调研、实验与性能分析 | `f7b63d5517b5e5efaaf65799cbc38565138c6b8b6114b2b2afd3a18d2fec68f1` |
| docs/voice-connection-latency/official-docs.md | 调研、实验与性能分析 | `45af92ff27aacb9f82c5ae8b4655bcd74c29997775e786d0ea6f09ae333758fe` |
| docs/voice-connection-loading-combined.md | 实现、集成与迭代说明 | `09b85d87fa663ae62b2f6fdc6e767d0a81362a94aa59f0898ad69d5ef854849d` |
| docs/voice-connection-loading.md | 实现、集成与迭代说明 | `9c35eb474582d47a57b45a00af14a066fece9bd58eb4551d65aa8cbdaebfe027` |
| docs/voice-connection-notice-options.md | 调研、实验与性能分析 | `e5ea32e53e0276c16902e3c275dd3dd3484aa5f22199b98b8fc8be3ef64df921` |
| docs/voice-connection-notice/combined-native-qa/README.md | 产品、模块与其他工程说明 | `869fba1423fe3b62daa89314f2566455f4246ac0879ef7c71fef485693cb6f70` |
| docs/voice-connection-notice/cream-card-implementation.md | 实现、集成与迭代说明 | `5ef8d4f4230b17f4a189d0fc5b20b868dbac5088bba66321585f5da6edec8626` |
| docs/voice-conversation-proposal.md | 设计、方案、规格与资产制作说明 | `3d052999effb2e4fe3fce819a38ba6654b9fd6ead88913485bfbaa611de2764f` |
| docs/voice-startup-audit.md | 测试、评审、验收与发布 | `89ad6e93601c6fc1bd3d9b0aec439bd5804ad86ed770e8bba46c0356592a2532` |
| docs/voice-switch-controller.md | 实现、集成与迭代说明 | `8dba938494201894240c75ee2428179d78768a5eb5f25f7d468d35ba9a70774f` |
| packages/character-animation/README.md | 产品、模块与其他工程说明 | `23520210f7d8e5a2242177a8de0bd33d33d46b3bf8aefb01cc2252249ae30fa4` |
| packages/game-core/README.md | 产品、模块与其他工程说明 | `c23838916d30d4e120f2ce33bd939decbe3df318da9aea212c192b96cd3a60b5` |
| packages/ui/README.md | 产品、模块与其他工程说明 | `40978a9cb913f5d76cbc7c30991683ef51f009010bb1df40d7ea82ac4ff4ea8e` |
| packages/voice/README.md | 产品、模块与其他工程说明 | `70ccd8f59071a5a4576e844c541aa08d8a50653b8cd70cfa8df8796af9cac89b` |
| spikes/animation-preview/README.md | 测试、评审、验收与发布 | `984f3bc38eafc1dec95583fec8566ce059d2136c7b1e7781b035807d10a44646` |
| spikes/cartoon-3d/README.md | 产品、模块与其他工程说明 | `be3bfae017890f1c468b3e7223a3d41cda8d94291e54ace70ef77f96c4ecd2ca` |
| spikes/case-behavior-validation/README.md | 测试、评审、验收与发布 | `27cedc8e8f1e1cf6ca662ac02d9ee35416cb5539aa8a0a0ab0aff875d68bbc36` |
| spikes/realtime-voice/README.md | 产品、模块与其他工程说明 | `4cc3886d056ae7b88527aa4f20c411135bdc2afb799fa48e64ed4c1149537870` |
| spikes/voice-audition/README.md | 测试、评审、验收与发布 | `fba5d5e863df4135b353309818ff5ef57eb31a3c3920a35206cd21b814129f1f` |

## 合并的重复正文路径

- design/animation-candidates/plum-crop/archive/2026-10-25-rejected-scale-breath/README.md ← design/animation-candidates/salt-pepper-beard/archive/2026-10-25-rejected-scale-breath/README.md, design/animation-candidates/silver-bun/archive/2026-10-25-rejected-scale-breath/README.md
- design/animation-candidates/plum-crop/archive/2026-10-25-rigid-cuff-failure/README.md ← design/animation-candidates/salt-pepper-beard/archive/2026-10-25-rigid-cuff-failure/README.md, design/animation-candidates/silver-bun/archive/2026-10-25-rigid-cuff-failure/README.md
- design/animation-candidates/plum-crop/archive/2026-10-25-rigid-first-collar/README.md ← design/animation-candidates/salt-pepper-beard/archive/2026-10-25-rigid-first-collar/README.md
- design/animation-candidates/plum-crop/archive/2026-10-25-rigid-second-collar/README.md ← design/animation-candidates/salt-pepper-beard/archive/2026-10-25-rigid-second-collar/README.md
- design/animation-candidates/plum-crop/archive/2026-10-25-rigid-third-neck-edge/README.md ← design/animation-candidates/salt-pepper-beard/archive/2026-10-25-rigid-third-neck-edge/README.md
- design/animation-candidates/plum-crop/archive/2026-10-25-waiting-visibility/README.md ← design/animation-candidates/salt-pepper-beard/archive/2026-10-25-waiting-visibility/README.md, design/animation-candidates/silver-bun/archive/2026-10-25-waiting-visibility/README.md
- design/animation-candidates/plum-crop/evidence/rigid-waiting-review/README.md ← design/animation-candidates/salt-pepper-beard/evidence/rigid-waiting-review/README.md, design/animation-candidates/silver-bun/evidence/rigid-waiting-review/README.md

## 扩展快照调查（不进入主讲372）

额外只读核到56份以.md.txt保存的Markdown历史原文及3份整合前Markdown .txt快照。这59份原文各正文不同于主指标文档，扩展总集445路径/434正文；同样排除上述3项则442路径/431正文。**431不采用为主指标**，避免旧版本快照让演讲口径难解释；只保留调查透明度。原始提示词.txt、机器日志、代码/HTML.txt、license等不进入扩展集。

3份额外普通.txt是docs/history/2026-10-24/project-plan.original.txt、docs/history/2026-10-25/project-plan.before-consolidation.txt、docs/history/2026-10-25/coordinator-handoff.before-consolidation.txt；其余扩展路径后缀明确.md.txt。

| 扩展原文路径 | 检索类别 | SHA256 |
| --- | --- | --- |
| docs/archive-inbox/investigation-visual-history/evidence/sunny-native-report.md.txt | 协作、交接、决策与历史保全 | `fc7be5e48d0f9fffae1f68ff971ba790f24104fee613dd59be15f5d2609fedf8` |
| docs/archive/2026-10-25/animation-history-followup/owner-inventory.md.txt | 协作、交接、决策与历史保全 | `6be22d97a0cf4204c6051e200194e53cf8ba95fd989d3c416a270611bfa1ef50` |
| docs/archive/2026-10-25/animation-history-followup/snapshots/368ff5d4/spikes/coral-blender/README.md.txt | 协作、交接、决策与历史保全 | `220cbc7de0f276221b4905d581ab207a4a81f6e9eddcfc28dc5e5740e9e41b8e` |
| docs/archive/2026-10-25/animation-history-followup/snapshots/7bab57b0/spikes/hunyuan-coral/README.md.txt | 协作、交接、决策与历史保全 | `3d727b63324af6fed1d5b3be11bea04a626b8a87f52cb2c1b2b5c68b1980cd95` |
| docs/archive/2026-10-25/animation-history-followup/snapshots/b2a7b603/spikes/cartoon-2d/README.md.txt | 协作、交接、决策与历史保全 | `5a66507a6ade2416de6e358364b04d61faa605c9c00ae946c304a5a32d872248` |
| docs/archive/2026-10-25/animation-history-followup/snapshots/bb9b031a/spikes/coral-layered-animation/README.md.txt | 协作、交接、决策与历史保全 | `1dfe09cf79c66992a8b440f4bcaa5dc434f8c70b6456c2c152ac96f25286dfb8` |
| docs/archive/2026-10-25/history-followup/snapshots/006e39c5/docs/realtime-voice-validation.md.txt | 测试、评审、验收与发布 | `c6f5ef3210e46f7dc6c83a5c977969dff28687c2e3544c5795337ccd5df30e71` |
| docs/archive/2026-10-25/history-followup/snapshots/03ce42bf/docs/expanded-preset-voice-options.md.txt | 协作、交接、决策与历史保全 | `76ffda063aa6a68f6a6ebd425b36d8e858acaaeeed4f39ef6bd0993ea37a5d84` |
| docs/archive/2026-10-25/history-followup/snapshots/041c74a4/docs/editor-ux-proposal.md.txt | 协作、交接、决策与历史保全 | `3628d05987d4743a3139d4198dfa6b54153f211171855401ffccec6627b0bcc1` |
| docs/archive/2026-10-25/history-followup/snapshots/151842d6/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `54344e98d6339cef113c84b8a1865acda44fc3c143519a7cbaec5e159f94fb89` |
| docs/archive/2026-10-25/history-followup/snapshots/1d9ee768/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `4f2f75ef569ff5cc4cf38976bea258ab5846715c959711dffec1049d12173061` |
| docs/archive/2026-10-25/history-followup/snapshots/20eb7431/docs/voice-feedback-proposal.md.txt | 协作、交接、决策与历史保全 | `c44bb7586eb930746ce09e6a11241e778d92e45c5dc3db63e11902e02671240a` |
| docs/archive/2026-10-25/history-followup/snapshots/251bb8f7/docs/architecture.md.txt | 协作、交接、决策与历史保全 | `db7904d03088772701fd4b04c8cc74db8b21382029a16cd4b554e836ca65450d` |
| docs/archive/2026-10-25/history-followup/snapshots/36ff3b3a/docs/editor-ux-proposal.md.txt | 协作、交接、决策与历史保全 | `5d3245a068e970d6ecd2fe9b6301542cf8546766a82a14fa036c2b5f698fd80d` |
| docs/archive/2026-10-25/history-followup/snapshots/3e8b665f/design/conversation-refined/README.md.txt | 协作、交接、决策与历史保全 | `9abffd02f2f6a45f79b06b1fc6a4bf891b50b40f89a09898b5c8b0fb31e59c0a` |
| docs/archive/2026-10-25/history-followup/snapshots/3e8b665f/docs/conversation-design-spec.md.txt | 协作、交接、决策与历史保全 | `4aa979e6b37d2f9d3592f567d9e49f8cbed1fd07ea57e4951162f3bd4cdd156f` |
| docs/archive/2026-10-25/history-followup/snapshots/4d63515b/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `7a90df8c7038215f47b56edeeec60c91f884b58aaa9b412150749230b0ac9fd3` |
| docs/archive/2026-10-25/history-followup/snapshots/51776c8a/design/investigation-controls/README.md.txt | 协作、交接、决策与历史保全 | `11013e5217759089beb7c2ae1eadbdd14a919677fc47ec894a5764ac3fbc3e80` |
| docs/archive/2026-10-25/history-followup/snapshots/51776c8a/docs/investigation-controls-proposal.md.txt | 协作、交接、决策与历史保全 | `a4c40e72331afc594d4555a1ae1d574d8fff7feae00c0482bb96091066d59e27` |
| docs/archive/2026-10-25/history-followup/snapshots/64127c1c/docs/coral-animation-next.md.txt | 协作、交接、决策与历史保全 | `ed027419ad1ff7f38b981d06deb030c4bbb1296c9aede0d24003d53ff6e14182` |
| docs/archive/2026-10-25/history-followup/snapshots/6c7333bf/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `8df8e9af8a077bd3f95f628517bdbf81d1a76e7885137476e92ac206c072bf81` |
| docs/archive/2026-10-25/history-followup/snapshots/6da37877/design/investigation-mobile-v4/README.md.txt | 协作、交接、决策与历史保全 | `1cb90ebd9848153b7ed09785a699c82d33822b69af5c5a71d80ad4a18bda514c` |
| docs/archive/2026-10-25/history-followup/snapshots/7bab57b0/docs/hunyuan-coral-animation.md.txt | 协作、交接、决策与历史保全 | `e43c66dc6bca78223a4af932e58e8e2759dacd7d5ad179fae0afd5caff95cd7b` |
| docs/archive/2026-10-25/history-followup/snapshots/84b627c3/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `09e8e9c978681058727e607c139f06770ec3f6fa747e2fc3f28dadce0ddd6210` |
| docs/archive/2026-10-25/history-followup/snapshots/87205d7d/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `fc2f0f5eadb7343ff16bda394b7c60e9106940f922271a6950cd0ecadcf4c996` |
| docs/archive/2026-10-25/history-followup/snapshots/9cf490af/docs/promo-video-production-research.md.txt | 协作、交接、决策与历史保全 | `f36d2bee6fd1add8ca9b068654f566d07c0e21e78f19d3098dfe318630abe24d` |
| docs/archive/2026-10-25/history-followup/snapshots/b2a7b603/docs/2d-animation-investigation.md.txt | 协作、交接、决策与历史保全 | `93801696f184e2ba94ef7e038543ec43b52ec5c6754c73d526015ca68b712b63` |
| docs/archive/2026-10-25/history-followup/snapshots/c5e40f29/docs/coral-animation-next.md.txt | 协作、交接、决策与历史保全 | `94f4efc9f52e9abd1a5467b8ef56130e91a127a6951c42cff473fb0351579c41` |
| docs/archive/2026-10-25/history-followup/snapshots/c99baa99/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `42cb96f3ef8202188a6ba04a8b4c4bcab6044c6c28c9068077e7e631d12720ad` |
| docs/archive/2026-10-25/history-followup/snapshots/cf371a5a/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `1888d0127edf075f572493311271dec5065e1d25409e82439c73a1a0a167482a` |
| docs/archive/2026-10-25/history-followup/snapshots/d34a1343/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `d385ba64039e239c47ecef9e974c564af2ee2eb16ab4cfb19528391977d4758a` |
| docs/archive/2026-10-25/history-followup/snapshots/e2f43910/docs/expanded-preset-voice-options.md.txt | 协作、交接、决策与历史保全 | `329176dbe0591abf94518a5c513b6426cd3b0c702b8317b610f62c15f4b6792d` |
| docs/archive/2026-10-25/history-followup/snapshots/e94fdd27/design/github-prefill-verification/README.md.txt | 测试、评审、验收与发布 | `c2676b911857e3129190ef4779bf8dbda19c2ae0d2a9cdbbb48d7e32b2968547` |
| docs/archive/2026-10-25/history-followup/snapshots/e94fdd27/docs/editor-official-submission-proposal.md.txt | 协作、交接、决策与历史保全 | `7190bf0fba3e207732f66ea439273153147598e57608ed94a741524db11a5e45` |
| docs/archive/2026-10-25/history-followup/snapshots/f4fc3aa8/design/investigation-mobile-v4/README.md.txt | 协作、交接、决策与历史保全 | `5c841f2f5b7541bb8c620f4a3eeac82ba665b27f5fe892a85d3c0a879909ed19` |
| docs/archive/2026-10-25/history-followup/snapshots/fcb084f7/docs/editor-ux-proposal.md.txt | 协作、交接、决策与历史保全 | `df06cf30c076098e8fe0a6dec3d397373d4d5dc21e5c66555474b8eccfe3a233` |
| docs/archive/2026-10-25/history-followup/snapshots/fd44c80d/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `0dc159225f861c13ec7568bbbf8b1fa8a9894303f3e0226ff5ec57f1bec07213` |
| docs/archive/2026-10-25/invite-access-paused/implementation-handoff.md.txt | 协作、交接、决策与历史保全 | `aa7727fc96c78f8ca27181f422b3bdea232b48eef15dd41a488b86dfa3712dc1` |
| docs/archive/2026-10-25/invite-access/original-design.md.txt | 协作、交接、决策与历史保全 | `1a8fd71c86f925452d966f6a90d8e9da7a7ab879fa277bff37623ac49e186e24` |
| docs/archive/2026-10-25/release-retention-not-adopted/README.md.txt | 协作、交接、决策与历史保全 | `186344c0559e69513076258c32c5e7dbac8066b3cc1c3968b9598d2afadfc38e` |
| docs/archive/2026-10-25/release-retention-not-adopted/corrections.md.txt | 协作、交接、决策与历史保全 | `8c694824551f1bc1788c0b0a4013ac41fd0785061a3c4ac2e055b4fefef289e2` |
| docs/archive/2026-10-25/snapshots/coral-research/design/coral-layered-animation-v2/README.md.txt | 协作、交接、决策与历史保全 | `a4a4c931245bfe8e9483bfc2a3699e54d2cb2f2b2edeed3c862e7811f84c7ee7` |
| docs/archive/2026-10-25/snapshots/coral-research/design/coral-layered-animation/README.md.txt | 协作、交接、决策与历史保全 | `8af638b113a21c5d2fc4ca98662392f7e917a0f01451b754e86ec6c16e06c55c` |
| docs/archive/2026-10-25/snapshots/coral-research/docs/coral-animation-next.md.txt | 协作、交接、决策与历史保全 | `5f1fae777f6f130023cd004c6eb8aae9a3971fa4766a759722c1948363eba354` |
| docs/archive/2026-10-25/snapshots/coral-research/docs/coral-layered-animation-v2.md.txt | 协作、交接、决策与历史保全 | `139d3245aee48366dd9455d527cbd5909a18f7c11545dc2d796b5126deac9cb6` |
| docs/archive/2026-10-25/snapshots/coral-research/docs/coral-layered-animation.md.txt | 协作、交接、决策与历史保全 | `94c1b900c52ae1f885164463348c2a542504fa564f9da53f91269013f20104d2` |
| docs/archive/2026-10-25/snapshots/coral-runtime-research/docs/coral-runtime-evaluation.md.txt | 协作、交接、决策与历史保全 | `abf0b0270724c5ed28e76d7591d60a85070a2fa6e6f9a9ee2dedac2615a05011` |
| docs/archive/2026-10-25/snapshots/earlier-naming-candidate/design/appearances/README.md.txt | 协作、交接、决策与历史保全 | `98f3bf3089ad5ad8fa1b4fcf4096b2e278ab515789c5e4757b33efdaac30f2fa` |
| docs/archive/2026-10-25/snapshots/earlier-naming-candidate/design/character-presets/README.md.txt | 协作、交接、决策与历史保全 | `af88a3c96ba53779648492a6f8b8d7fb682778c63bf80cdfed422a8e9f257205` |
| docs/archive/2026-10-25/snapshots/earlier-naming-candidate/docs/animation/contract.md.txt | 协作、交接、决策与历史保全 | `ecb3e426551e83387019ea706e198fb8c684ad0961c34a75f909a0b2da0f1ff0` |
| docs/archive/2026-10-25/snapshots/earlier-naming-candidate/docs/animation/coral-game-integration.md.txt | 协作、交接、决策与历史保全 | `df24782fe74cff45d175db66f24bc922bd74b996a4eb23fc284ad12315f8cff6` |
| docs/archive/2026-10-25/snapshots/earlier-naming-candidate/docs/animation/production-workflow.md.txt | 协作、交接、决策与历史保全 | `3c465f1ecfad1ecd19d09fe8a4e7a48fbce0ca4e9db9ea87e057ca39f935a7d4` |
| docs/archive/2026-10-25/snapshots/earlier-naming-candidate/docs/architecture.md.txt | 协作、交接、决策与历史保全 | `7040d27a2d1e46dc5c6c4bd88041a263fc54c3d1d1a6970172f3192a3ca2c6f9` |
| docs/archive/2026-10-25/snapshots/investigation-controls/design/investigation-controls-v2/README.md.txt | 协作、交接、决策与历史保全 | `6eccc0051cb879f1c33a6bc12dbd70cfc27a696e5d066e2a6605cd33b36f8d74` |
| docs/archive/2026-10-25/snapshots/investigation-controls/design/investigation-controls-v3/README.md.txt | 协作、交接、决策与历史保全 | `c72929e64d34602c7d1c63d416492c2401952684b660fcf7a037e583c62e1856` |
| docs/archive/2026-10-25/snapshots/silver-earlier-status/design/animation-candidates/silver-bun/README.md.txt | 协作、交接、决策与历史保全 | `3d5bfecf3ea3d5c75c2e55c0d67f627ac99c9f130c973a4984fee1d7f52e522a` |
| docs/history/2026-10-24/project-plan.original.txt | 协作、交接、决策与历史保全 | `a389f27b5c208a67d3009904b5fd574fff253a10a0a9fede7d4cf522ff993a56` |
| docs/history/2026-10-25/coordinator-handoff.before-consolidation.txt | 协作、交接、决策与历史保全 | `71eb924597432f9354b18600273af9be149f18cdfaf74f784a09a9caebe81965` |
| docs/history/2026-10-25/project-plan.before-consolidation.txt | 协作、交接、决策与历史保全 | `1e617cc7434c58113f43194a8a91cf979594066ccdbd561593e216946b5f9cf1` |
