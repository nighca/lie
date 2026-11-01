# 计时说明改为短句

2026-11-01。用户要求“怎么算时间”弹窗更易读。主代理仅在基线`c8b15af`上修改四段文案，不改逻辑或布局：

1. 所有人物共用本局的询问时间，换人不会增加时间。
2. 语音接通后开始计时。说话、停顿、等回答和听回答都会计时，连接准备时不计时。
3. 时间用完后，还能回看对话记录，再做最终指认。
4. 打开说明不会暂停计时。想暂停，请先点「结束对话」。

执行子代理新建Chrome自有tab`1910332637`，只使用DEV demo模式，实际查看[1280×800桌面](desktop-1280.jpg)与[320×844窄屏](narrow-320.jpg)。四段换行自然、全部说明与“继续调查”按钮完整，无裁切或横向溢出；320弹窗左19/右301、顶180/底664，操作底635px。两图magic核为真实JPEG/.jpg。Escape关闭正常，console warn/error为空。

主代理回执：Node24.22.1，在apps/web cwd执行`node ../../node_modules/vitest/vitest.mjs run App.test.ts --maxWorkers=2`，既有1文件22项通过，无新test或types/build。子代理未修改source或重复检查。

自建tab已关闭、viewport复原；未操作用户正常tab或mic/provider/WS。5544原Web PID64673/PTY63756无启停，保留用户consumer。未stage/commit/main/push；旧说明记录原样保留。
