# 公共角色姓名高亮

2026-10-25，用户明确授权跨只读入口复用原姓名高亮机制。当前状态：公共组件/消费者实施及自动验证通过，真实IAB已完成，待旧global规则清理turn与主协调组合审查。原始基线3fdec3de47d9e27e0ecd3f91be7e1e248158fd02；parent WT /Users/nighca/.codex/worktrees/page-titles/lie，分支codex/character-name-highlights；标题分支/提交保持冻结，没有作为未审依赖重放。

## 公共接口与匹配

CharacterNameText只吃text与公开{name,accent}数组；不依赖controller/router/core私有事实/预设ID。纯splitCharacterNames沿用字面匹配、长名先占、重复同名不同色中性、无色fallback。空或纯空白名字不标，非空名字不trim、不Unicode规范化。模板文本插值，无HTML注入或额外可交互元素。精确textContent/CRLF/换行/特殊符号不变，样式用既有主题色/无色配方和margin-inline .12em。

子任务WT /Users/nighca/.codex/worktrees/character-name-component/lie，分支codex/character-name-component，base3fdec，source0723dda12ee65ecbbc32a40443871e3918127a72。parent逐行审实际diff/测试与WT状态后cherry为277b215；组件/helper新增及重命名无兼容alias。子17项通过；parent接入后完整Web33files298项/types/build89通过（既有underline.svg提示不变）。

## 覆盖与主动排除

| 入口 | 处理 |
| --- | --- |
| 调查XXX的询问记录 | 只包装姓名，后缀原文不匹配 |
| 指认卡指认XXX | 只包装姓名，原aria-label/type/click不变 |
| 正确结果完整经过 | 保留原段落划分，各段统一高亮；wrong仍不渲染reveal |
| Editor玩家接案背景预览 | 按草稿当前人物/主题即时响应，placeholder不高亮 |
| Editor正确指认后揭晓预览 | 同上，输入框值/源文不改 |
| 原案件介绍背景/调查背景弹窗 | 全部迁移公共组件，保留暂停/关闭语义 |
| 额外：Editor答案摘要、删除人物确认 | 只读姓名复用，按钮与确认行为不变 |
| 卡片/立绘旁独立身份名 | 已有头像主题、选中态/粗体层级，避免为凑数量重复底色 |
| 模型/玩家转写、输入框、URL、JSON | 不处理，以免改消息或可编辑/复制值 |
| 指导示例、占位说明、案件标题/首页简介 | 不是人物专门标示或实际故事正文；当前首页简介无自然人物名，不改Application/标题职责 |

Editor使用原始草稿name做字面匹配，不新增trim/内容限制；既有单独姓名显示的trim/空名占位不变。动态改名/预设、目录主题变动/缺失、空白/重复、人物增删已覆盖。复制/原文保持一致，视觉margin不产生文本空格。

## 自动回归

匹配/组件覆盖literal、最长名交叠、同名稳定冲突、无主题、Unicode/CRLF、HTML特殊符号、props实时变化；消费者覆盖指定五处+原两背景、主题与字面文本、正确结果逐段原文/错误不泄露、草稿改名/单人换预设/目录变更/新增删除、答案摘要/删除确认。原转写排除测试改为只检查role=log，避免把新增询问标题mark误当转写高亮。

父首次新增人物测试以“添加人物”精确可见文案定位，漏了现按钮的加号，已改既有.add-character定位，最终全量298通过；未为测试改变产品行为。

## 待组合事项

root最新main911718e0已含调查连接loading和preview隐藏改编。parent仍从指定3fdec做独立最小消费者diff，不改App结果button gate、Application或loading规则；root候选需要与这些已审差异及标题批组合，不能以本分支声称最新功能已发布。

style.css仍由height owner持有；当前新scoped组件是唯一活动高亮样式，旧global未被引用但按约定待释放后移除，最终交付不能保留两套正式维护样式。暂无服务/浏览器/临时数据。

## 同批实际验收（待旧规则清理后最终构建）

在公共消费者1a43868＋草稿位置db2c9a0的实际源上，用5402自建tab29、同源1004×900和391×844 iframe做CSS断点验收；不改共享viewport，不冒称真实触屏设备。fixture只种入公开官方案例，先保存该专项origin原始DRAFT_KEY值，结束由可见“恢复专项原始草稿”按钮恢复，页面确认“专项原始草稿已按原字节恢复”。没有读取或触碰用户8787/8788草稿。

[结构化DOM观测](evidence/observations.json)包括指定五处：两个Editor预览的原文/标记，询问标题，指认卡标签/正文与成功经过/失败普通文本。Editor背景每端三位姓名主题色正确，margin-inline计算1.68px，正文textContent保留原换行；两端Editor scrollWidth分别1004/391。

- [草稿位置与背景](evidence/editor-background-status.png)：status在steps之后8px，水平center分别502/195.5，保留role=status与清除按钮，391无横向溢出。
- [结局预览](evidence/editor-ending.png)：桌面与窄屏全文高亮可读，原textarea不高亮，答案摘要姓名也复用。为展示窄屏预览，聚焦分享按钮并按无操作的ArrowLeft使浏览器滚到该区域，未点击分享或传数据。
- [询问标题](evidence/investigation-heading.png)、[指认卡](evidence/accusation.png)：前者只姓名mark，后缀原文保持；后者aria-label仍“指认 顾遥”、正文精确“指认 顾遥”，Space/Enter按钮操作正常；mark非可交互。
- [桌面成功＋窄屏失败](evidence/result.png)和[窄屏成功](evidence/result-mobile-solved.png)：成功结果11处姓名mark，原四段不变；失败不含完整经过/没有正文mark。均能返回Editor，缓存步骤保留。
- 一条无source/stack的MutationObserver.observe非Node TypeError被捕获，时间12:27:34.042+08；仅记录未归因，不声称console clean或扩修宿主/动画。此前RSM验收也有同类未归因记录。

全部为本地demo，未打开语音/真实mic/provider/付费。截图上沿为自有测试包装页，下面两块是不同iframe，不能当原生手机或“当前main全功能组合”截图。3fdec基线的旧开发预览title和preview改编按钮仍可出现在该源证据中；它们由独立已交付标题批与root已审5afa来源修复，本批不覆盖这些区域，root组合时必须保留最新行为。

清理：tab29关闭，原exec57157 Ctrl-C退出、lsof5402无listener；临时public/character-name-qa.html删除，专项原始storage已在关闭前按原字节恢复，无用户storage变动。尚未main/push/PR/deploy。
