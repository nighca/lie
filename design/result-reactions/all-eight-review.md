# 八人结果图与动画自行验收完成

2026-10-25。珊瑚加强版用户通过，其余七位按用户直接授权自行验收，不逐人等待用户批准。此批为候选艺术与统一页面，正式canonical激活/App集成另有独立工作区；此刻不冒充它们已合入/发布。

共16张新表情原生PNG、16个非循环结果clip及16张对应末帧静态图。所有原四态clips/nodes/transitions和原PNG保持原样。每个造型复用自己的装配，结果只做刚性旋转/平移，没用人物缩放或拉伸。正确无奈/尴尬、错误惊讶疑问，不绑定案件性格/真实答案。

父已逐个读新增节点、mask、visibility、关键帧、来源完整prompts与检查脚本；候选汇集在父专项分支，不是main操作。阳光、银发、紫衣除子任务实际中段检查外，父在正式AnimatedPortrait统一页复核端点并点击末帧像素一致检查通过，first-batch-review记有证据。蓝衣、灰白、薄荷、赭黄在父5355共用正式renderer制作页实际看原静态参考/两新结果的末帧和55%动作中段，头颈/眼镜胡须/肩袖/腕掌未发现新穿帮；parent-mid.jpg、parent-end.jpg保留真实截图。16张terminal PNG全部由正式createCanvasRenderer在对应clip.duration原尺寸导出，未做外部栅格编辑；每个结果均检查停帧与静态导出像素一致。

validate.mjs整8通过（1936个刚性结果采样）、原四态素材完整保持、末帧保持、PNG签名尺寸/资源预算引用解析；evidence/all-eight-checks.json保存完整包和静态SHA。统一页单独vue-tsc通过。没有重复跑不涉及本次数据变化的上一契约全套测试并冒充新检查。共享PNG/WebP兼容和构建由图片owner完成，艺术源仍PNG。

当前入口 http://127.0.0.1:5355/design/result-reactions/ ：可按八个形象切换，两个结果并排、一次播放/重播、静态开关；每次切换根据当前形象重挂载组件和换包，不留旧src覆盖选中人物。页面不模拟案件事实，正式游戏使用真实被指认者投影。

主协调首批额外独立审计的原脚本和result已按其要求归档evidence/root-first-batch-audit；它针对当时冻结首批3source+4人catalog，不说成完整八人/浏览器审计。原tmp路径不再是唯一证据。

服务只有现父5355/PID1851/PTY55257；父QA own tab61与用户交付tab60，前者完成后关闭。两个lane曾使用的5356/5357已原PTY停、own tabs关并分别listener核空；不得再占图片5356，也不新开端口/扩fs.allow。后续App整合时5355切换源需要明确协调，且应保留同一八人页面可访问。

补充真实统一页矩阵：发起者逐个点击8个角色，均等到Canvas实际可见；每次切换静态，16个img均自然解码1254且URL属于当前所选形象，标题/选中项正确，gallery-eight-switches.json为DOM实测记录。桌面1280×900、reduce静态及391×844截图见evidence/gallery-eight-*；391实测scrollWidth=clientWidth=391。所有临时media/viewport override已恢复，private制作tab61已关闭，用户tab60保留。同一页面使用PNG艺术源验收，正式生产WebP与游戏UI需组合检查，不能互相替代。
