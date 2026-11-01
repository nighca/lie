# 圆圈问号帮助图标

2026-11-01。用户反馈原i仍不协调、线条可能太细，询问更适合的图标。主代理选择含义更直接的圆圈问号，替换为本地inline SVG：16×16px、viewBox24、stroke2.5（实际约1.67px），沿用muted色和现有居中布局，同一时间按钮/可访问名称/交互保持，无图标库依赖。基线`a820af6074abb2630210ddeaa076be8c91d8ee6e`加主代理本轮App/style修改。

执行子代理新建Chrome自有tab`1910332626`，只用DEV demo模式真实应用：[1280桌面原生clip](desktop-native-clip.jpg)与[391×844界面](narrow-391.jpg)均实际查看，问号可读、描边较原细圈更有分量。两尺寸数字和SVG DOMrect中心差均0，无重叠或横向溢出；点击问号仍打开“怎么算时间”，关闭正常。两图magic核为真实JPEG，未自行编辑或重编码。

主代理回执：Node24.22.1，在apps/web cwd执行`node ../../node_modules/vitest/vitest.mjs run App.test.ts --maxWorkers=2`，既有1文件22项通过。子代理未改source或重复unit/types/build。

自有tab已关闭、viewport已reset、console warn/error为空，未动用户正常tab或真实mic/provider/WS。5544仍为原Web PID64673/PTY63756，未重启，用户体验consumer保留。未stage/commit/main/push。
