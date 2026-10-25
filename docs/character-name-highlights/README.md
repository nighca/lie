# 公共角色姓名高亮

2026-10-25，用户明确授权跨只读入口复用原姓名高亮机制。当前状态：公共组件/消费者实施及自动验证通过，待旧global规则清理turn、真实IAB和主协调组合审查。原始基线3fdec3de47d9e27e0ecd3f91be7e1e248158fd02；parent WT /Users/nighca/.codex/worktrees/page-titles/lie，分支codex/character-name-highlights；标题分支/提交保持冻结，没有作为未审依赖重放。

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
