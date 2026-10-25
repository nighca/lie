# Chrome 指针与画面边界对比

2026-10-25；待用户审看，不替代首段完整案件创作。

用户反馈首版画面可能偏移，要求尝试本机 Chrome，同时解决看不出鼠标操作的问题。实际使用用户 Chrome 的独立 tab 1910329658，线上 lie.agency/editor。设置 1280×800 并读取实际 innerWidth/innerHeight、DPR=1、visualViewport.scale=1；采集首帧 metadata 的 deviceWidth/Height=1280/800、offsetTop=0、pageScaleFactor=1、scrollOffsetX/Y=0。不能据此断定上一版问题一定来自内置浏览器。

Chrome 存在用户既有《空盒里的纪念章》草稿，未清除、覆盖或修改内容；只切换故事/人物步骤，打开及关闭预设弹窗。没有选择新预设、保存新内容、启动语音、分享或投稿。编辑器为保持按钮可见发生原生滚动，采集保留实际滚动；这不是额外图像平移。

## 指针机制

CDP 页面采集不包含 OS 系统指针。本次在专用页面注入临时、pointer-events:none 的录制图层，绘制白色深边箭头；监听实际 mousemove/mousedown，点击显示 650ms 蓝圈。指针移动由真实 Input.dispatchMouseEvent 和 locator.click 触发，箭头采用 400ms CSS 平滑过渡。它属于录像提示，既非产品 UI，也非录下 OS 指针。

普通固定 z-index 无法越过原生 modal top layer：初轮测试出现弹窗遮住指针，已保留为未采用方案。改用 manual popover 顶层承载、操作后重置顶层顺序，最终截图与视频可见弹窗上的箭头。只改专用页面 DOM，没有改产品运行代码或部署。录制结束已删除图层/监听、恢复 viewport、关闭自建 Chrome 标签页；用户草稿保留。

## 采集结果与限制

最终视频 ../../../media/promo-video/chrome-pointer-preview.mp4，H.264/yuv420p，1280×800，30fps，15.833333秒，1131122 bytes，无音轨。取每2秒接触表核对画面边界和指针，FFmpeg 全文件解码无报错，ffprobe 参数通过；点击圆环为短暂录制辅助，不将它宣传为产品功能。正式重录仍待用户对比反馈。

第一轮过多 CDP 指针分步导致执行超过50秒，采集中断，无完整时间戳工程，不作为可用样片；随后缩短移动实现并完成短片。中间 take02 测试目录被最终同名采集覆盖，最终666帧时间戳有效；最终帧/frames.json/FFconcat 位于下方素材库 take02，输出、截图位于 take03。未把缺少工程的尝试称为完成。

原始素材保存于本机持久目录 `/Users/nighca/.codex/visualizations/2026/10/25/01a17226-5e5a-7193-b5b7-e522519a3e0c/promo-video/chrome-pointer-comparison`。重建 FFconcat 时将 `/private/tmp/lie-promo-chrome-20261025` 替换为此根目录；编码命令同 README。大量原始 JPEG 不进入 Git，预览/验看图与必要元数据入库。

本批基于制作分支0e0461667ad5c74464d9599883e8d1bf3f8b8352追加；main、服务、端口、他人标签页、账号/权限均未修改，没有push/部署。线上页面现显示第四案，说明较首版已有更新；此次仅画面与指针链验证，没有确定后续整片稳定发布SHA，正式完整录制前重新锁定。
