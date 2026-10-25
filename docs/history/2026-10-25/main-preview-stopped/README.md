# 用户停用本地 main 预览

2026-10-25，用户在root明确允许停止8787及对应gateway。owner character_preset_migration核对label dev.nighca.lie.main-preview、runner和自有进程树，正常执行launchctl disable与bootout均退出0；7个原PID全部退出，8787/8788及内部52599/52611/52616均无监听，runner正常清锁。root读取全部五份脱敏证据。plist/runtime/源码/凭据文件保留，未读凭据内容、未手工删锁/补kill，未影响5355或正式站。见[result](result.json)、[操作](operations.json)、[终态](after.json)。恢复命令在[restore](restore.txt)，未执行；后续不得按旧常驻说明自动重启，须用户重新要求。
