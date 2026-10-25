# 第四案：这真是今天做的吗

2026-10-25；来源：用户要求新增“Hackathon 中有人作弊，找出这个人”，并实证单 JSON 增案；状态：内容与本地技术验证完成，交根协调者审查合入。真实 AI 扮演与玩家盲测尚未执行。

产品新增文件仅 [`04-hackathon-old-project.json`](../../content/games/04-hackathon-old-project.json)。本目录全部是独立审验材料，不参与生产入口、目录发现或构建；新增案件不需要这些报告或测试。完整交付 diff 包含该 JSON **以及**本目录，不应声称全部 diff 只有一个文件。原有三案、应用/引擎/UI/构建脚本、素材、依赖与锁文件均未改。

## 内容与唯一解自审

三位虚构的成年独立参赛者，共享 480 秒询问时间，使用现有 ochre-freckles、mint-puffs、coral-bob 预设。没有新增玩法、道具、可调取的记录、外部证人或美术资源。

公开规则允许 AI、开源代码与旧项目复用，要求路演如实说明复用内容。违规事实是陆鸣把活动前已经完成的三个具体功能说成今天从零做出的成果；不是把使用 AI 或使用旧素材本身判为作弊。

| 亲历者 | 可核对的事实 | 不应越过的知识边界 |
| --- | --- | --- |
| 许楠 | 上周日亲手运行拖排行程、合并重复地点、生成出发提醒三个功能；本场活动今天才开始 | 当天陆鸣路演时在走廊，不知道他怎么介绍；不知道他今天改了哪些实现 |
| 季澄 | 完整听见路演把这三个功能称为今天从零做出，主持人追问仍称从零，未说明复用 | 之前没用过旧作品，不知道上周功能是否完成，也没检查代码 |
| 陆鸣 | 三功能上周已完成，今天只换配色、加开场介绍，却作了上述虚假声明 | 不替两位证人补齐私下经历；不能把从零偷换为只指介绍页 |

许楠的旧成品试用与季澄的本场路演亲历结合，证明同一组三个功能被冒称现场新成果，结论不依赖陆鸣自白。许楠用了 AI 并公开说明，季澄用了旧图标并公开说明，均符合该规则。展示外观确实更新，不等于功能现场重做，人物设定明确这一差别。

陆鸣不会因泛问、直接指责、重复问话就交代完整秘密，但对具体亲历需要正常回答；玩家说清已核实的矛盾后可承认。没有固定关键词、问序或轮数，也不允许无限否认旧试用、偷改原话或编造重写/已声明。此段是提示词意图，尚无真实模型测试证明。

## 单 JSON 实证

基线 `2268f84f02576d4384f0d30f9f117a70164f135a`，产品提交 `b7b20e3eebc8014237c4a5b4891f4106ef6ed92f` 只添加一个编号 JSON。序号是现有最大 03 加一，内部 ID 为 `hackathon-old-project`，没有 order 字段。

- [`integration.test.ts`](integration.test.ts) 导入未修改的真实 Vite eager glob 和 Application：目录自然变为 01–04，下一建议序号 05；首页第四张卡显示正确 summary，点击携带正确内部 ID。直接 `?game=hackathon-old-project` 也能进入；三个人可逐个选择，分别指认能得到一个成功/两个失败，错误不揭晓。真实“我要改编”进入 Editor，背景与 summary 正确带入。断言 fetch 没有被调用，不接语音。
- [`sharing.test.ts`](sharing.test.ts) 使用新 canonical 内容与现有预设 ID，验证 gzip 分享解码逐字段一致、改编新 ID 且保留所有作者字段、本地草稿保存恢复与 Editor 试玩映射。
- 真实 `npm run build` 通过；新增 JSON 经既有构建校验器与 eager glob 自动纳入，生产 JS 中存在正确 ID、标题、summary。无需额外 import、目录项、注册、复制 public/games 或改部署入口。
- [`verify.py`](verify.py) 对比基线中 apps、packages、scripts、design、content 和根依赖文件，1216 个已有产品文件逐字节相同（包含原有三案）；251 个 Web 构建文件与 Worker assets 逐字节一致。身份与输出哈希见 [`identity.json`](identity.json)。

## 检查和复现

Node 24.22.1 / npm 11.13.0；详细结果见 [`checks.json`](checks.json)。全部工作区类型检查、Web 37 文件/357 测试、现有脚本 33 测试、专题 2 测试及完整 Web/Worker 构建通过。构建首次本地编码 82 张去重图片，严格校验 8 预设/121 资源。

从仓库根目录：

```sh
npm ci
npm run character-presets:generate
node node_modules/vitest/vitest.mjs run --config docs/hackathon-case/vitest.config.mts
npm run build
python3 docs/hackathon-case/verify.py
```

专题 DOM 测试补齐 jsdom 缺少的 dialog showModal/close；初次未生成预设与未补 dialog 导致的测试环境错误已修复，未改生产组件。构建仍提示既有 Vite native loader 扩展名预警与 underline.svg 运行期解析提示，没有导致失败。首次离线安装使用系统 Node 24.17.0 出现 engines 警告；全部最终检查使用指定 Node 24.22.1。

不声称这些自动检查证明真实 AI 会稳定按知识边界扮演、不会提前认罪或具有合适难度；未调用付费 provider，未做真人语音/盲测或原生浏览器视觉验收。未手工启动 dev server、未触碰 8787/8788/5355、用户页面或草稿。测试只使用自身隔离的内存 DOM、localStorage 与现有测试夹具，无保留服务。未推送、部署或自行合 main。

## root候选审查

source `b7b20e3eebc8014237c4a5b4891f4106ef6ed92f` → `2cbae8fa5387976fbc38e5f030704ef69750877f` 已确认clean并冻结；root实际阅读完整JSON、角色亲历/知识边界、八文件全diff及相关发现/调用契约，隔离cherry为c1da7a9→5c87845。候选产品范围对2268仅新增该JSON，八个来源文件逐字节一致；其它变更为发布证据/协调文档，没有新运行输入。root在候选独立复验两项专题测试通过，另核源251 Web/Worker产物字节及JS SHA，已有Web357/脚本33/types/build结果按相同输入复用；不是声称候选重建或真人验收。后续普通push检查现有CI/CD，报告并入下一正常批。
