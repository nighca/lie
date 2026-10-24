# 首页与案件页共用 ProductHeader

2026-10-24；基于 reviewed main `89089fe937340049e04d86cff3278964627b4193`。用户已要求统一页头与首页标题；本次仅落实首页、接案与案件界面，不改首页其他信息布局，不改编辑器。

## 组件与接入

`packages/ui/src/components/ProductHeader.vue` 统一左侧批准 Logo、文字“语音推理”和 coral 斜下划线。`title` 可选，用于调查时的中间案件标题；`actions` slot 提供页面操作；`notice` slot 提供现有演示模式提示。页面外边距由调用页CSS保留，各页不再覆写品牌尺寸、字体或下划线。

品牌使用可聚焦的原生首页链接；点击只 preventDefault 并 emit `navigateHome`，组件不持有 router 或改 location。Application 首页仍走原 `home()`；案件仍通过 App 的原 `navigateHome` emit → `returnFromGame()` → router guard。因此调查中点击品牌仍先确认，取消保留本局、确认后才丢弃；编辑器预览的既有返回语义也由原调用方保留。结束本局/最终指认仍调用原行为，不转移到公共组件。

首页 h1 精确改为“有人在说谎”。保留现有产品简介、形象拼图、案件列表和选择动线；未改故事、语音或预算。

当前基线旧 `Editor.vue` 仍使用全局 `.wordmark`。本次不拥有Editor，故保留这段确有消费者的样式，不为清理重复而破坏其现有页面。首页/案件已不使用它；编辑器owner已收到组件契约，root后续可协调最小接入后移除旧规则。本次**不宣称编辑器页头已统一**。

## 检查与实测

- 使用本 worktree 自己的 locked `npm ci --ignore-scripts`，避免共享依赖的 workspace symlink 指到其他 worktree旧UI源码。
- UI 22项、Web 135项测试通过，UI/Web typecheck通过，Web生产构建及35素材输出检查通过。
- 新增公共组件测试覆盖原生链接preventDefault与导航意图、标题/notice/actions slot和页面按钮原行为；首页验证实际 h1 文案；真实Application测试覆盖品牌离开确认、取消、确认后回首页并保留demo query。没有写CSS值镜像单测。
- IAB独立开发入口 `http://127.0.0.1:5196/?demo=1`。`demo`只在DEV启用，所以实际验收用独立Vite开发服务；没有点击真实语音、调用供应商、申请麦克风或接触8787/Chrome。

IAB读取实际computed值，首页、接案、调查三阶段一致：

| 实际 CSS viewport | Logo | 文字 | 下划线 |
| --- | --- | --- | --- |
| 1280×800 | 105×56px | 18px / weight400 | 5px / bottom -9px / rotate -3deg |
| 391×600 | 88×47px | 14px / weight400 | 同上 |

1280和391实际document宽度等于viewport，无横向溢出。391调查页“结束本局”按钮x215–291、“最终指认”x299–375，均在页面内；1280×500短高窗口回到顶部后两按钮y约28–84，互不挤压。短高窗口允许原调查主体自然纵向滚动，没有为此修改原游戏布局。调查标题恢复原三段space-between分布，中间标题中心约x614.5（左右品牌与操作宽度不同），未因actions自动外边距挤到Logo旁。

IAB实际点击品牌→弹“结束这次调查？”；选继续仍为原 `?game=empty-medal-box&demo=1`，再次确认后回 `?demo=1` 首页。console warn/error为空。页头外边距保留首页0、案件20px；全部临时viewport override已reset。

截图保存在本机临时目录，供root复核，不增加正式产品资源：

- `/private/tmp/lie-shared-header-home-desktop.jpg`
- `/private/tmp/lie-shared-header-intro-desktop.jpg`
- `/private/tmp/lie-shared-header-investigation-desktop.jpg`
- `/private/tmp/lie-shared-header-home-narrow.jpg`
- `/private/tmp/lie-shared-header-investigation-narrow.jpg`
- `/private/tmp/lie-shared-header-investigation-short.jpg`

素材URL迁移owner同时只改Application现有home-cast三处src；本提交不触这些字符串，root可按各自范围合并。不新增旧appearance路径。


## 编辑器接入补充

编辑器后续以同一 `ProductHeader` 统一品牌；上述“保留wordmark/未接入编辑器”描述仅对应首次提交的历史边界，现在不再适用。当前步骤的既有h1仍显示“故事设定”等，不另加一份重复标题。actions保留“返回首页”，notice显示原有浏览器草稿状态；品牌点击仍由原Editor发出leave交调用方处理，分享编码期间不发leave且返回按钮禁用。

Editor仅保留页头外部间距，不覆写Logo、标签字或下划线。`rg`确认生产Web和UI已无wordmark消费者后，删除Editor旧品牌CSS及style.css中的旧wordmark规则；不动其他全局选择器、编辑器创作逻辑、路由、素材URL或语音。新增组件回归覆盖实际共享品牌/草稿notice和正常、忙碌时的原leave语义；导航测试改读既有命名步骤nav，不为旧标题保留重复文案。

编辑器接入检查：Web 150项、UI 22项测试及两者类型检查通过，Web生产构建与35图dist校验通过。独立QA由完成组合检查后的测试owner执行，先创建自己IAB tab再设置并读取真实viewport：1280×800时Logo105×56、文字18px/400；391×844时innerWidth/scrollWidth均391、Logo88×47、文字14px/400；下划线均5px、bottom -9px、rotate -3°，与共享组件一致。391时品牌x16–168，返回按钮x299–375/y26–66，草稿notice y80–96，步骤nav y108–160，留12px间隔，没有挤压。页面仅保留步骤h1，没有第二个页头h1。

QA实际点击品牌和返回按钮均按原leave回到`/?demo=1`首页“有人在说谎”，console warn/error为空；未改草稿、触发麦克风、访问GitHub或操作8787，结束后reset viewport并关闭自己的tab。截图`/private/tmp/lie-editor-shared-header-desktop.jpg`、`/private/tmp/lie-editor-shared-header-narrow.jpg`保留供root复核，实施owner已查看真实窄屏图。此短验只补页头与窄屏边界，不冒称复制、下载、GitHub提交或全部其他编辑器功能经过重新真人验收。
