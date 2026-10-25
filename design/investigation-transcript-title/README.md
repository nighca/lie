# 调查姓名位置调整：实际应用证据

2026-10-25，基线背景高亮 commit 19fed70566951ad66fda49d7b61bf6f0923534b6 加本独立后续 diff；source-hashes.json 标识源码。

IAB tab 38，真实 App/现有动画 renderer，官方 empty-medal-box/demo=1 和临时 legacy 分享同引擎。

- desktop.png：1280×878；mobile.png：391×844。大图下不再显示姓名，右侧标题为沈禾的询问记录，侧卡姓名保留。
- long-mobile.png：长中文姓名；long-english-mobile.png：切人后的无空格长英文姓名，自然换行，无横向溢出。
- before-switch.json / after-switch.json：桌面、窄屏、长中文、长英文各实际标题、舞台尺寸、无水平溢出。切人前后舞台 527.171875×602 /148×168 保持，切后每舞台单 Canvas。

PNG 为 CDP 原生截图 DPR2，无图像修改。仅把临时 HTML 容器逐个显示于原点以捕获对应 iframe；不改应用 DOM、不改全局 viewport。转写/语音逻辑未修改，模拟模式不代表真实麦克风验证。长姓名让人物列表在原固定区域内滚动，标题可换行，保留完整姓名。

5507 复用单服务原 PTY 97605，由原 PTY Ctrl-C 停止 exit1，随后 lsof 确认无监听；tab38 已关，临时 HTML 已移除，无 network/cache/media override。未改用户草稿或8787/8788/5355/5544。
