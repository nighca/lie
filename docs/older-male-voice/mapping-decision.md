# 灰白胡须改用龙三叔

2026-10-25；状态：用户已确认选择，实施完成待 root 本地审查集成；未push/部署、未新真人测试。

用户明确反馈龙天、龙三叔都不够年长；若没有更适合的现有供应商候选，先用龙三叔，与 sunny-moustache 同声可接受。此项是明确接受的当前折中，不表示龙三叔已满足老人听感，也不否定后续寻找更适合声音的方向。

复核本轮既有226项目录/37个公开中文男声证据，没有确证更适合且当前实际支持的年长候选。没有再次网络查询、推理/TTS、key读取或资源管理请求；不以标签缺失断言其他全部不合适。按已确认后备选择直接实施，没有继续等待选声。此前 [候选调查](available-candidates.md) 与 [初轮外部参考](README.md) 保留，当前决定覆盖其“尚未选择/尚未接受同声”的状态；龙老伯仍只有外部方向参考，不新增provider。

## 实际变更

从 reviewed main `7249a6f94106ce9fa7aaefdf640222f77ff70188` 独立 managed worktree 实施。canonical [manifest](../../design/character-presets/manifest.json) 仅将 `salt-pepper-beard.voiceId` 从 `a42e04fcefac4e9492581fbc95f3fce3` 改为已支持的龙三叔 `2e7965636b0d4472ae51e75f419dff41`。其他七个完整预设条目、全部外观/动画/案件保持逐项相等；sunny-moustache 原声音不变，两个形象现在共享声音。

沿已有形象 → scope → listen.start 声音参数链，不改变共享provider agent默认或schema/API。扩展原 `presetVoices` 配置合同测试，同时断言原三声和已获准共享的灰白胡须映射；原真实清单三案scope测试继续覆盖逐人参数解析。没有新增同声去重规则或角色数量限制。

公开 `/appearances/manifest.json` 由既有 generator 正常生成，属于 ignored 产物；生产构建继续生成固定兼容路径与带内容哈希的清单。固定与hashed两种清单都已核对目标voice ID，hashed URL 的 SHA-256 与实际内容相符、所有预设资源路径存在。该基线没有需要单独编辑的受控兼容映射，不能提交忽略产物代替canonical来源。后续发布须从新canonical重新build，不能沿用旧dist。

## 已做验证

Node24.22.1＋项目锁定依赖，使用 `npm ci --offline --ignore-scripts` 本机缓存独立安装，没有网络安装或修改lock：

- `npm run character-presets:generate`：8预设/89资源。
- Web目标 `presetVoices`、`character-preset-compatibility`、`staticContent`、`liveVoice`：4files、36/36通过，包含旧draft/link仍按当前预设取声及provider默认透传边界；fake/controller检查不等同真实供应商会话。
- Web类型检查通过；Web生产构建及postbuild `--check --output dist/appearances` 通过，8预设/89资源。构建有现存 underline.svg “remain unchanged to be resolved at runtime”提示；对应内容寻址SVG实际已输出，不是本次音色变更引入的缺资源。
- 与base结构比较只有指定voice字段变化；其他七项完整相等、公开/固定产物相等、hashed产物的所有voice映射相等及URL/资源存在性通过。具体生产清单URL和结果见 [mapping-verification.json](mapping-verification.json)。

无新浏览器/服务器/mic/真人或真实provider测试，不声称年龄听感通过。无服务、设备或agent cleanup尾项。依赖、public生成资源及dist留在隔离worktree ignored目录供review，tracked范围仅canonical、原测试和本目录决定/验证文档。root唯一integrator；不自行main合入/push/deploy/PR。
