# 首页、案件介绍与调查细节（反馈1—9）

本专项按新主协调转达的用户实施授权，从 reviewed main `887ac03a0e06964f31b66203c43991042be89706` 开始。编辑器10—17由另一owner负责，不在此批实现；不修改CharacterChoice、编辑器、语音adapter、引擎或供应商。

## 实现

1. 品牌手绘笔触复用现有SVG，以共享`lie-handwritten-underline`样式左低右高倾斜5度，文字继续盖住笔触。
2. 首页卡片展示本案头像及角色人数，替代时长。目录新增公开`characters: { name, appearanceId }[]`，严格校验非空且只投影这两个字段；目录同步测试核对真实内容，不读取人物设定或结局。原时限元数据保留，不改变玩法时限。
3. 介绍页1—5个人物用可变人数的扇形轻叠，hover及键盘focus升起并置顶；更多人物、窄屏或无hover设备用清晰网格，不靠hover读取名字。没有增加人物选择玩法。
4. 案件标题复用共享手绘下划线，结果标题同步使用同一既有case-title样式。
5. 首页左侧增加既有三步玩法流程，介绍页仍保留。
6. 玩家气泡“你”右对齐，正文仍start对齐。
7. 实际连通后持续显示玩家输入波形；inputActive为false时清空音量历史呈等高平线。等待/角色回答时不显示角色波形，也不恢复普通文案；preparing/error/off仍遵原逻辑。reduced-motion仍使用输入meter。
8. 删除切换人物/结束对话的正常提示；保留错误/耗时等重要提示。简化endConversation为无参，App的背景调用同步修改。
9. 三案完整经过均只加段落换行，每案4段，事实/其余字段不变；源与静态镜像字节一致，错误指认规则不变。

## 验证

- Node24.22.1：全仓346测试通过（Web170/UI35/其余141），全仓build通过及47资源检查通过。各workspace类型检查通过；第一次UI类型检查指出测试style属性可空，改为null合并后UI typecheck再次通过。
- 显式读取并review子任务`42cad659`完整controller/test diff、周边逻辑及三案JSON；独立脚本核对reveal除空白外逐字相同、其他JSON相同、六个镜像一致。只cherry-pick该子任务的8个指定文件。
- IAB独立5398，桌面1280：首页角色人数3/4/4与头像、三步流程；介绍四人扇形；真实鼠标move与键盘focus均测得z-index2、translateY(-16px)。
- 391×844：首页/介绍scrollWidth=391，介绍卡片两列transform none，游戏bottom=844、波形height30；切到连通模拟会话时静音波形可见，普通状态无文案。玩家标签right，正文start。
- 组合后切换人物无正常notice，正确指认后reveal四段，white-space=pre-wrap；截图核验分段清晰。结束后转写保留由controller测试覆盖。
- 自建tab均关闭，viewport已reset；无真实麦克风或供应商调用，本轮不宣称真人语音验收。
- 截图在`/private/tmp/lie-ui-polish/`：home-desktop.png、home-mobile.png、intro-desktop.png、intro-mobile.png、intro-hover.png、game-mobile.png、result-desktop.png。

## 交付与依赖

任务分支`codex/investigation-ui-polish`，工作树`/Users/nighca/.codex/worktrees/investigation-ui-polish/lie`。任务有序提交为`675ed77`、`2e3cbeb`及本验收文档所在最终修正提交。

本分支为组合验证另cherry-pick了已集成主线的editor catalog fixture `90c7c9e`，本地对应`72220db`；它是已满足的外部依赖，root集成时必须跳过72220db，不重复回放editor提交。未删除style.css四条PC冗余覆盖，留root在共享CharacterChoice候选组合后窄清理。

主协调独占review、main集成与发布。本专项未push、未更新main、未覆盖8787/8788服务；5398为隔离候选，不等同最新main。后续Logo红点及README渲染另由协调分配，不混入本批。
