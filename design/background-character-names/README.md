# 背景人物姓名高亮：原生验收证据

2026-10-25，真实 Vue 应用，源身份见 [source-hashes.json](source-hashes.json)。IAB tab 37；官方案件与临时 legacy gzip 分享案件均使用 demo=1，无麦克风/供应商调用。

- opening-desktop.png：1280×878 开场；opening-mobile.png：391×844 开场首屏（下部仍可滚动）。
- background-desktop.png / background-mobile.png：对应尺寸的案件背景弹窗。
- literal-names.png：391×844，最长姓名优先、A+B 字面、同名异色中性、HTML 原文字面显示。
- neutral-names.png：391×844，全部 appearanceId=null 的中性回退。
- browser-checks.json：逐帧实际 DOM 尺寸、无横溢、textContent 与 Range.toString 对原文完全一致、深蓝前景、对应高亮颜色及弹窗/语音状态。

PNG 为 CDP 原生捕获（DPR 2），未重绘/拼接/后处理。为了避免离屏截图跨区域，逐次只显示临时验收容器中的一个 iframe 并置于原点；未修改应用 DOM、数据或全局 viewport。临时 HTML 已删除，自建标签已关闭。演示转写不作为真实语音验收证据。中性浏览器证据为缺 appearanceId；预设迟到/更新/移除的响应性由真实 App 自动测试覆盖，未声称网络加载失败/恢复实测。

5507：Vite PID 95357、原 PTY session 32844，服务 source 为 helper commit + source-hashes 所列最终改动；检查完由原 PTY Ctrl-C 停止（exit 1），后续核无监听。未改 8787/8788/5355/5544。未用网络/缓存/media override，最后 console warn/error 查询为空；这只限本次自建标签。
