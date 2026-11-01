# 删除接案页重复流程

2026-11-01。用户要求删除接案页“开口问话→对照说法→最终指认”，并询问是否需要调查页信息入口。主代理建议先仅删接案页重复流程：首页已有介绍，调查已有语音/时间帮助/背景/指认操作；暂不新增入口，这是本轮建议，不能据此称用户批准新增帮助。基线`1f956e7`上只删除App.vue介绍页一行ol，首页与其他交互不变。

执行子代理自有Chrome tab`1910332630`仅使用DEV demo模式，实际查看[1280×800桌面](desktop-1280.jpg)与[391×844手机](narrow-391.jpg)：流程行已消失，公共背景三段、两位人物、“本局可询问2分钟”、接案/返回操作清楚，无重叠；scrollWidth分别等于1280/391。手机接案页正常纵向滚动。随后点击返回案件列表，确认demo首页仍显示完整三步介绍。

主代理检查：Node24.22.1、apps/web cwd，`node ../../node_modules/vitest/vitest.mjs run App.test.ts home-presentation.test.ts --maxWorkers=2`，既有2文件27项通过，其中首页原三步文案断言保留；未新增镜像删除测试。

两图magic核为真实JPEG/.jpg，console warn/error为空。自建tab已关闭、viewport复原，未操作用户正常tab或mic/provider/WS。5544仍为原Web PID64673/PTY63756，无启停，用户消费者保留；未改source、未重复tests/types/build或stage/commit/main/push。
