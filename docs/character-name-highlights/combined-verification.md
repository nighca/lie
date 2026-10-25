# 姓名高亮、草稿提示及研究归档组合验证

2026-10-25，root已完整review源码/测试/docs/关键原生图、图片研究审计和旧QA；本轮借用WT `integrate-character-preset-dawn/lie`，branch `codex/integrate-character-name-draft-position`，base main **365269b6185be586b69c0fac2b7ba15defeb7a6f**。冻结有序候选：

1. `6b088c1653240c97768d270b9d4337bfc8568f59`
2. `0bdc693036eedd4b878c69a26af7ffdd408d0522`
3. `bd5b80c1fff07ee6a8b96ae041b529194d4b9d35`
4. `a187e6df21c6a7be14802c6ef77b5046f6c1b7a3`
5. `5804c9a10191c5a5ce91f24970b90460c61d6459`
6. `f27f6f251e279c7574640cacb9099b63ef055589`
7. `d8695f142a14adad0340979b63c8acd8000fc757`
8. `e9379d377c9849bdf7ca63bb50128c7bba914f8e`
9. `1c13911d2621b829d49934f790aa60124e0cfec6`
10. `fd4b257797e4a1f6213c0e4700ad8e907e925593`

被测HEAD为最后fd4b257；既有Node24.22.1/npm11.13.0，无安装。**完整Web35files329（4.44s）、Webtypes、Webbuild99 modules（292ms）、strict8presets89assets通过**。唯一既有underline.svg解析提示仍保留；未重跑未变UI52/runtime43。

Editor/helper/component与五个相邻测试共9路径逐字节同最终source335cea09991bce7c67577a2d43c5c7a5318478be；App仅保留当前main的allowRemix default/gate和loading spinner组合差异；Application/title/结果契约、canonical资源/voice/旧四态/content/依赖均同main365。style.css仅删除唯一旧背景姓名规则（0加1删），不触height布局；生产旧helper/class/var引用0、公共高亮样式1。8人48hash引用/46parts存在，dist仅index、public/dist无姓名QA入口。源消费者298＋草稿布局52及IAB1004/391仅按原记录/字节范围复用，不称本候选新浏览器或live/GPU验收。

归档仅解析9JSON、22本地链接、4Python AST语法检查通过；没有重编码/网络/全图片审计或重跑固定483的QA877。图片source56b2adad及[evidence审计链](../performance/image-build-optimization/audit-2026-10-25.md)完整保留；旧README的严格无损推荐是历史，用户已在turn01a17146-7aa5-7620-a59c-d8caf25d09be明确批准q90，不重新开启质量选择门禁。审计的编码产物未全保留/无法从JSON重算全部WebP字节等限制不抹掉。[离线QA归档](../qa/released-share-editor-2026-10-25/README.md)仍明确真实reload/popstate/BFCache/dialog未验。

服务沿源回执：5402原exec57157 Ctrl-C、tab29关、storage原字节复原、lsof无listener；MutationObserver一条未归因，不称console clean。本轮无服务尾项/浏览器/安装/main/push；5355用户样片消费者保留。检查后HEAD仍fd4b257、tracked tree clean，仅ignored产物；此后只加本报告及中央状态，root读后本地ff，未提前称已发布。
