# 原生 Editor / Share 七项补验

2026-10-25，owner `/root/home_scroll`，冻结基线 `d4c189b22dbf09ae7b2ec0ec998b3a678f1d2823`。独立 WT `/Users/nighca/.codex/worktrees/home-scroll/lie`、branch `codex/native-editor-share-current`。纯验收资料，不修改产品、依赖、案件或生产配置。补充此前 [600 轮未执行矩阵](../native-share-editor-600-2026-10-25/README.md)；不修改或否定旧轮不可用事实。

实际浏览器：本 chat 合法 inventory 内 Chrome extension，自建独立 tab；不是 IAB/Safari/真机。root 此轮明确允许独立 Chrome；未重试缺失 IAB、借视频页或用户页。

## 数据边界

先在 `http://127.0.0.1:5544/` 普通首页只读唯一 `lie-editor-draft`，发现已有非空旧验收草稿，于任何 Editor/写入前停止、关自己的 tab1910329706，原session49417 Ctrl-C exit130、核5544无监听。没有清除、备份后改写或入库其内容。root 随后明确指定 `http://localhost:5544` 独立 origin，仍用同一稳定5544端口；其 key 起始值 null 才创建本任务合成草稿。127 origin、用户8787/8788和正式站存储未改。

localhost 草稿完全由真实 Editor UI 创建：标题“原生验收：猫与🌈”，中文/emoji/换行/空行背景，两位人物小岚/阿湛，完整结局。仅本地合成数据，无用户数据。最后通过产品确认清除删除此合成草稿，key恢复起始 null。没有访问其他 localStorage keys、剪贴板复制、真实语音、投稿或外发分享。

## 逐项结果

| 项目 | 实际操作及结论 |
| --- | --- |
| N1 同源分享中文/emoji/换行 | UI“分享案件”生成localhost `/play#game=...`，读取只读完整链接，直接导航；标题、两人、背景正确，DOM innerText保留中文、🐈、换行与空行。通过。 |
| N2 原生reload | 同分享页reload后完整fragment及背景文本逐字相同。通过。 |
| N3 valid/damaged/corrected历史 | 打开有效→`#game=damaged`→修正有效；Back损坏错误→Back有效→Forward损坏→Forward修正有效，错误反馈与内容均按当前URL更新。通过。 |
| N4 Editor/preview原生历史 | 故事人物步骤选中阿湛→试玩显示标题→Back回人物步骤、阿湛与profile保留。Forward到失去临时preview快照的入口后由现有Application路由replace回Editor，仍保留步骤/选中项，没有空白或重建默认草稿。符合现有 `previewGame` 离开预览即释放、无快照重定向Editor契约，不称Forward恢复了游戏局面。 |
| N5 取消清除 | 打开原生 `dialog:modal` 为true、焦点在关闭按钮；“保留草稿”后草稿原始字符串完全相同、无`:modal`、焦点恢复“清除草稿”。通过。 |
| N6 确认清除与收尾 | 只对本任务合成草稿确认清除，key为null、弹窗退出、焦点在title输入、标题空。离开Editor到原先分享页再次读取key仍null，恢复起始状态。通过。 |
| N7 窄屏长内容可达 | 背景重复40段含中文emoji与换行，391×844及320×400；实际Tab从“下一步”移至试玩，页面滚到下方操作。scrollWidth分别391/320，无横向溢出；pageHeight3547/4671、scrollY2703/4271.5，末尾操作可见。通过有限样本，不代表所有极端长内容/设备。 |

[实际观测JSON](results.json) 含合成分享链接及测量。N4 `getAttribute('value')` 对动态input返回null，不能当输入为空；实际DOM snapshot的value与已按下人物按钮均为阿湛，报告以上按原生快照说明，未伪改原始null字段。没有重复旧jsdom或全套应用测试来充当native结论。

## 截图

已保存并逐张实际查看：

- [分享接案](share-intro.png)：中文、emoji、换行与两个人物。
- [清除原生模态](clear-dialog.png)：真实top-layer遮罩与明确确认操作。
- [320×400长内容底部](narrow-long-editor.png)：试玩焦点、分享与下一步均可达。

没有发现本有限矩阵下新的确定产品缺陷。未测跨设备、Safari、剪贴板授权行为、真实语音/供应商、实际GitHub投稿或生产站网络。

## 服务与清理

localhost轮服务 SHA为基线d4c，Vite PID96944、原session64495、仅5544。起前前轮监听已退出，无双开/新端口。consumer仅自建Chrome tab1910329710，stop条件本矩阵完成。该tab已关闭、viewport reset，只有本任务合成draft经真实UI删除、最终null。临时依赖符号链接已unlink，未创建临时页面/产品夹具。原session Ctrl-C exit130，收尾 `lsof -nP -iTCP:5544 -sTCP:LISTEN` 无监听。未停止/重启/重复启动8787/8788/5355，未改其他worktree。工作树交付仅本文档、JSON、三截图。
