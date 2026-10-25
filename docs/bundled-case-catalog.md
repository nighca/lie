# 官方目录与完整案件随代码打包

2026-10-25。用户明确要求：首页案件目录首次render即有，完整三案也一同打包，消除打开介绍时的案件网络等待。实施候选基于已审 main `1f168e3486591b8c64f971dc6a3da87bdb41d2a3`，独立 `codex/bundled-case-catalog`，WT `/Users/nighca/.codex/worktrees/bundled-case-catalog/lie`；待root审查/集成，未push、部署或PR。

## 数据与接口

- 目录单一源由 `apps/web/public/games/index.json` 原字节移动到 [content/case-catalog.json](../content/case-catalog.json)。[catalog.ts](../apps/web/src/application/catalog.ts)静态import并导出有类型的caseCatalog；不再把随代码维护的目录当作运行时不可信网络数据解析。
- [bundledCases.ts](../apps/web/src/application/bundledCases.ts)使用 Vite `import.meta.glob<GameDefinition>(..., { eager: true, import: 'default' })` 构建期纳入canonical `content/games/*.json`，没有lazy导入或运行时case chunks。新增同玩法案仍只需内容与目录配置，不在app里手写三案import登记表。
- 完整正文只引用既有canonical三案（原始JSON合计32301字节），不维护新的正文副本。旧public完整三案为已有静态内容测试/兼容保留，已不由运行时读取；旧 `/games/index.json` JSON目录移除。历史部署记录描述当时URL，未追改历史。
- main同步传 `catalog: readonly CaseSummary[]`。Application直接在首次render遍历它，删除cases ref、catalogStatus、loadCatalog以及目录loading/error/retry分支。空数组仍有静态空列表提示。
- 官方readGame精确查找打包内容，未知ID抛错并经原controller进入failed，不偷回默认案。编辑器/分享传入的game快照优先，包括与官方同ID但标题/正文不同的快照。
- 保留controller已有异步reader契约和引擎validateGame；其微任务不等于网络加载。本次不改引擎/会话、voice、Editor.vue、App.vue或样式。图片、动画包、预设manifest及语音仍走既有资源/传输路径；8秒可选预设loader/retry、共享表/voice resolver未改。

## 精准验证

Node24.22.1/npm11，同原lock离线安装。最终eager-glob代码执行：

```sh
npm run test --workspace @lie/web -- test/bundled-cases.test.ts test/home-presentation.test.ts test/navigation.test.ts test/editor-navigation.test.ts test/staticContent.test.ts test/preset-loading-main.test.ts test/preset-loading-navigation.test.ts test/characterPresetLoader.test.ts
npm run typecheck --workspace @lie/web
npm run build --workspace @lie/web
```

- 8个文件46项通过；Web类型、生产构建、8预设89资源postbuild严格校验通过。未改后的全仓套件不在本次重复执行范围。
- 初次Vue组件mount、flushPromises前已有对应数量的目录卡；production main在manifest挂起时仍显示三卡，fetch调用只涉及可选manifest。
- 用文件系统读取所有canonical案件，核唯一ID、目录集合完全一致、lookup完整正文相同、engine load后得到独立拷贝；未知空ID/不存在/大小写不同/`toString`均拒绝。
- 原home/navigation/editor/share与新预设失败/重试、草稿不变、导航revision等测试保留，仅把loadCatalog接口改为catalog；移除已不存在的网络目录解析/失败重试测试。结果专项约定的一行“本局失败”断言本候选未抢改。
- 实际构建仅一个entry JS；核其中包含三案标题、背景和揭晓文字。新模块是构建期eager适配，不是等待网络的注册框架。

### 实际构建成本

复用root已有 `integrate-character-preset-dawn/lie` 中的baseline产物 `index-BMZLwpli.js`：该checkout为 `8be6d03`，与本基线在apps/packages/content/scripts/package/lock的实际diff为空，差别仅状态文档；没有为比较再构建一个基线。两文件用同一Node24 `gzipSync` 默认参数测量：

| entry JS | 原始字节 | gzip字节 |
| --- | ---: | ---: |
| 已审基线 | 181978 | 66049 |
| 本候选 | 213067 | 78873 |
| 增量 | 31089 | 12824 |

[产物hash、工具与来源](bundled-case-catalog-evidence/build-size.json)。以上为真实生成文件的同参数比较，不用原JSON大小估算传输成本；Vite自身控制台的gzip估计不是这里混用的分母。新增案件内容现在随首个JS下载，后续不再独立请求案件JSON；并非整站离线化。

## 真实浏览器验收

IAB一次返回 `Browser is not available: iab`，按root授权使用独立Chrome tab1910329544、会话“🧪 官方案件打包”，未碰其他tab或全局viewport。唯一临时Vite5544，启动前无listener；PID49549／原session73441，来源本WT固定基线加候选diff。`LIE_VOICE_GATEWAY_URL=http://127.0.0.1:9`，不启动gateway。页面demo=1，未开启真实mic、音频或provider。

先在同源自有临时HTML将原 `lie-editor-draft` 逐字备份到唯一sessionStorage键；不输出/提交旧草稿。整个窗口禁缓存并阻断 `http://127.0.0.1:5544/games/*`：

1. [首页三卡可见](bundled-case-catalog-evidence/home-blocked.jpg)，无目录loading卡顿；最终eager代码逐一点击三案介绍→接案，人物分别3/4/4，名称正确，再按原确认路径结束返回。三段独立完整网络窗口分别14/13/15请求，`truncated=false`、`hasMore=false`，`/games/`请求均为0。[原生观测摘要](bundled-case-catalog-evidence/browser-observations.json)。最初跨多次导航的宽窗口曾truncated，不作为完整请求证据；随后分段记录覆盖最终代码。
2. 直接导航 `/?game=duck-finale&demo=1`，实际reload后[四人完整介绍仍正确](bundled-case-catalog-evidence/direct-reload.jpg)，不是首页先缓存正文才可打开。没有为此改core/controller或使用计时器/DOM补丁；未做每帧paint量化或弱网基准。
3. 最终代码实际未知ID显示[案件加载失败](bundled-case-catalog-evidence/unknown.jpg)，没有默认案介绍。
4. 仅用公开官方案件作为自有draft fixture，在Editor中将标题改成“打包兼容测试：专属分享案”。同官方ID的试玩仍显示新标题，返回生成真实压缩分享链接，新完整导航打开后[仍显示自编标题](bundled-case-catalog-evidence/shared-intro.jpg)，证明snapshot优先而非误读打包原案。无GitHub动作、clipboard覆盖或上游语音。
5. 最后tab warn/error读取为空，不扩大成所有工具/全程无异常。dev模式静态import仍由Vite以构建模块URL提供，这与旧运行时 `/games/*.json` fetch不同；生产单JS内容检查补充证明实际打包形态。

截图是五张原生JPEG、未编辑像素，[尺寸/hash清单](bundled-case-catalog-evidence/screenshots.json)。不把本地开发浏览器成功写成生产部署、硬件移动端或真人语音通过。

## 完整收尾

清除本tab网络阻断/cache override并Network.disable。回临时helper按原字节恢复原draft，实际[恢复一致确认](bundled-case-catalog-evidence/storage-restored.jpg)，删除自有sessionStorage备份后关闭唯一自建tab。删除本WT精确临时 `apps/web/public/bundle-qa-storage.html`，不提交临时壳或原用户数据。

原session73441 Ctrl-C退出130；最终lsof无5544监听、精确PID49549不存在。未触8787/8788 launchd、5355动画、5507视觉、5402 Editor或其他owner服务。无保留server/tab/override；WT仅预期source/tests/docs变更，等待root唯一integrator审查有序cherry-pick。
