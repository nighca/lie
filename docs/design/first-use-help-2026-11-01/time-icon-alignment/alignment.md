# 时间数字与信息图标对齐

2026-11-01，用户指出 i 图标与02:00似乎未垂直居中。主代理检查CSS发现桌面strong独立4px上边距进入flex交叉轴，使数字与图标偏约2px；已将strong margin归零、4px间距移到整个帮助按钮，移动端按钮margin-top仍为0。只有CSS对齐调整，字体、按钮功能与计时无变化。基线`9bc0c70b7c4b9ea0343c038fb054b0ff451db6a1`加该dirty样式。

执行子代理仅做真实浏览器验收，未改source或跑unit/types/build。新建Chrome专属tab`1910332616`，只用真实应用`/?demo=1&game=jiangsu-local`：

- 1280×800：strong中心725.7890625px，图标中心725.78125px，差0.0078125px（不足0.01px的子像素舍入）；标签至数字linebox间距8px。[完整界面](desktop-1280.jpg)、[工具原生clip截图](desktop-native-clip.jpg)。
- 391×844：两者中心均为757px，差0；[手机界面](narrow-391.jpg)。两尺寸scrollWidth均等于viewport，标签、数字、图标与主要操作无重叠。

已实际查看原生裁取和手机图，视觉中心一致；没有自行裁切、编辑或重编码。三图经magic检查均为真实JPEG/.jpg。点击时间按钮仍能打开“怎么算时间”，关闭正常；console warn/error为空。未开启对话或接触真实provider/mic/WS。

自建tab已close、viewport已reset；未动用户正常tab。5544仍为原Web PID64673/PTY63756，未启停/复制服务，用户体验consumer保留。未stage/commit/main/push，交主代理实际review具名提交。
