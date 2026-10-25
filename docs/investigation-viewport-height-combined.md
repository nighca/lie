# 调查页高度：组合验收

2026-10-25；base `9a6635ce1fb85b3fc85aaa634828674c8bbf7b5a`，候选 `1dc7e9963028bd9459dead118c9b91f13928c741`，来源 `7c5ab23267d3511618fb502496e25898d8637931`。本报告交root实际review后才ff，尚未main/push/部署。

- 相main唯一生产变化为已审12行调查高度CSS，新增/删除行与source完全相等；相source保留main的旧无引用背景规则删除及连接spinner。ProductHeader逐bytes同source；调查header的标题/动作模板原样，App其他差别为姓名mark包装、preview改编控制与fixed连接spinner，未改变header布局/字体。姓名mark在记录/正文，不参与header空间分配；无新实质组合风险。
- source.json的CSS/App/ProductHeader三SHA重新吻合；21个归档文档/JSON/PNG/fixture逐bytes同source，fixture TypeScript语法转译0诊断（不是完整类型检查）。[原始证据与重放](../design/investigation-viewport-height/README.md)保持。
- 逐JSON重算：五正常矩阵docHeight=innerHeight；所有长记录doc高度同空记录、48条记录scrollHeight>client且scrollTop+client到尾；notice/dialog两尺寸均无额外外高。短屏真实scrollY142=572−430，记录bottom284<固定栏top312，底栏bottom430；长标题四人391×844、列表32=200−168，第四人已选。矮桌面/等效CSS缩放必要滚动与底栏可达均吻合。早期reachability短屏scrollY2不冒称到底。
- 实际Node24.22.1 Web build：99modules，372ms，exit0；prebuild生成8preset/89assets、postbuild strict核89通过。保留既有underline.svg构建时引用提示，实际对应文件已输出。QA入口未进public/dist，产物JS/HTML无fourth-qa-person/qa-controls。
- 依明确范围未重跑应用全suite/types/runtime，未做新浏览器/服务/viewport/provider。原IAB45/46/47及原生截图只按上述CSS与header身份范围复用，不称本组合浏览器重跑；真实硬件安全区/键盘/浏览器原生zoom仍未验。

source5507 PID29602/PTY38417 exit1、无监听，tabs45–47/两临时入口已清（owner回执）；本轮只离线构建，无端口扫描或服务动作。5356/5357旧误占由owner原PTY79237/99017 exit130、精确PID57333/53348退出且两owner+parent核无listener；5356随后已交图片built验收turn，最新PID待其batch，不推断仍空闲。5355父用户页保留。所有临时生成物仅既有ignored build/public；tracked源码未额外改动。
