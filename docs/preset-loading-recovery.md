# 可选人物预设加载与重试恢复

2026-10-25。状态：实施候选，待root实际review和本地集成；未push/部署。分支`codex/preset-loading-recovery`，独立WT `character-preset-migration-dawn/lie`，reviewed base `03fcb06b40ad9dc85ce92af5c1dd6723afc10d4a`。此前命名迁移和服务规则提交保持冻结，不重做迁移。

## 缺陷与边界

CR-02：main在mount前await人物manifest的fetch及json；请求或body挂起时整页不挂载。LIE-QA-001：一次失败后固定空数组，Editor提示重新打开却不再请求，有效旧草稿无法试玩/分享，必须整页reload。

本次只修可选展示清单生命周期。appearanceId、voiceId、静态/动画URL、8个正式预设及89资源不变。不改App.vue、style.css、draft校验、game-core、voice/gateway、依赖或provider；不恢复局内进度、不加入新账号/鉴权/资源协议。root后续已合姓名唯一校验（main e5c59e0，draft.ts六行及相应tests/docs）；本候选从03基线出发未吸收该独立工作，本次fixture人物名均唯一，不插入其他owner文件。root组合候选按该校验实际diff决定精准复验。

## 最小接口与行为

`createCharacterPresetLoader(fetcher = fetch, timeoutMs = 8000)`只维护一份Vue shallowReactive展示表和idle/loading/ready/failed状态：

- `load(): Promise<readonly CharacterPreset[] | null>`合并在途调用；ready直接复用成功表，不重复拉取。HTTP失败、JSON/清单无效或统一8秒deadline后返回null并标失败，允许随后真正重试。
- 同一个AbortController/8秒预算覆盖fetch及response.json；取消通过独立abort Promise参与race，因此即使替身fetch/body忽略signal也能按时结束等待。只有race成功结果才可发布；迟到旧请求不写表，也不会覆盖之后重试成功的结果。
- `cancel()`取消当前请求，结束时清理timer/listener/pending；应用卸载时调用。没有自动轮询、无限重试或多个版本的状态框架。

main先挂载应用，随后启动可选加载。根render函数将最新表/status传给同一个Application实例；既有controller factory的resolveVoiceId读取当前表，因此新会话/新controller使用恢复后的原voiceId，恢复不重建现有游戏controller或导航。

Application保留原characterPresets数组接口和loadCatalog行为，只增加可选presetStatus/loadCharacterPresets。进入Editor触发共享load；Editor的空选择器显示加载状态/明确“重新加载预设”按钮，实际调用同一个loader。按钮恢复时不重建Editor或写draft，不自动替换已存的null/失效/已选择ID。`/play`先有界等待此表，失败显示可重试错误；成功用load返回值解码，不依赖props下一次渲染的时序。路由revision继续隔离已离开的分享页。

本次未实现用户随后提出的首页catalog静态打包；已向root声明main/Application接口已冻结，可由下一执行者依本候选SHA修改同步catalog初值，避免文件所有权重叠。

## 精准检查

Node24.22.1/npm11；锁安装仅与已有lock对齐，package/lock无diff。相关六suite共73项：characterPresetLoader、preset-loading-main、preset-loading-navigation、原editor-page/editor-navigation、characterPresets。新增14项覆盖：fetch永不resolve、body挂起、404/坏JSON/坏清单恢复、并发合并、abort/晚到覆盖隔离、生产main真实挂载、首页可用、重开Editor自动重试、当前选择器显式重试且草稿/选择保留、原game/controller/voice引用保持、分享等待成功、离开分享页晚到不夺导航。测试使用fake网络/timer/voice，不证明真人语音。

Web typecheck、Web build及postbuild严格检查8预设89资源通过。全部public/dist的89资源＋manifest逐字节相等，正式源文件无diff。生产代码未在这些type/build与浏览器验收后继续修改；最终仅修正测试所需的Node Blob实现、实际姓名data-field选择器及异步解码等待断言，复用同一生产代码type/build证据，不重复全仓检查。

## 真实浏览器验收与恢复

本轮一次IAB create返回`Browser is not available: iab`，未反复重试或重发权限；依root事先允许的不可用fallback，用独立Chrome tab1910329540、会话“🧪 预设恢复”做有界验收，未操作其他tab/全局viewport。

唯一临时Vite服务5544：启动前即时核空闲，WT同本任务，基线03fcb06及本候选源码；PID89520／原PTY session3817，LIE_VOICE_GATEWAY_URL仅指127.0.0.1:9，页面demo=1，不起gateway、不用真实mic/provider。消费者仅本轮恢复验收，完成即停。

1. 在5544同源临时HTML页先将原`lie-editor-draft`保存在本tab sessionStorage；不输出或提交原草稿。再用按钮放入公开官方测试草稿。此helper不是产品源码，结束已删除。
2. 原生CDP启用网络与禁缓存，只阻断`http://127.0.0.1:5544/appearances/manifest.json`。实际导航首页，标题/创作按钮和三官方案件可用，角色名字/首字回退，未因manifest失败白屏。[阻断首页截图](preset-loading-recovery-evidence/home-blocked.jpg)。
3. 进入Editor，旧草稿标题/三个人物/设定仍在；选择器显示明确错误和“重新加载预设”，没有假装已有预设。[失败选择器截图](preset-loading-recovery-evidence/selector-failed.jpg)。
4. 不reload、不离开当前选择器，清除网络阻断后实际点击重试。8预设及图像恢复，沈禾原sunny预设仍pressed，人物stage恢复动画；直接比较持久化草稿与公开fixture JSON逐字相等true。[恢复截图](preset-loading-recovery-evidence/selector-ready.jpg)。
5. 同一Editor生成5976字符真实分享链接；试玩进入正确三人intro，[试玩截图](preset-loading-recovery-evidence/preview.jpg)。返回Editor后持久化草稿仍逐字相等true。实际新导航打开生成链接（仅为测试附demo=1查询）成功显示正确intro，证明初次异步加载也可正确解码；未开启对话。最终分享页warn/error读取为空，不将其扩大为整个阻断期控制台无错误。
6. 清除本tab blockedURLs/cache覆盖并Network.disable；返回helper，点击恢复原草稿，页面实际显示“原草稿恢复逐字相等：true”，备份sessionStorage移除。随后关闭唯一自建tab。没有遗留DOM/网络覆盖或修改用户8787草稿。
7. 原PTY3817 Ctrl-C退出130；随后精确只读核PID89520不存在、5544无LISTEN。未停止/重启8787/8788、5355或其他owner服务。无临时HTML、持久备份或新server留在工作树。

截图均为原生JPEG、已目视，不编辑像素；没有保存原用户草稿或网络headers。此轮实际网络阻断是明确失败，挂起fetch/body的deadline由fake timer和生产main挂载回归分别覆盖，不把它写成真实无限body网络仿真。未做真实IAB、移动设备、跨浏览器矩阵或真人语音验收。Chrome fallback是本轮明确获准边界，不改变开发默认IAB偏好。
