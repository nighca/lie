import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { runOriginalFixed } from './original-fixed-probe.mjs'

// Source scope is approved; this flag still requires a separate specific execution turn.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href &&
  process.argv.length === 3 && process.argv[2] === '--execute-original-fixed-approved') {
  try {
    const WebSocket = (await import('ws')).default
    const root = resolve(import.meta.dirname, '../../../..')
    const report = await runOriginalFixed({ approval: 'original-fixed-token-one-device-turn-approved',
      sourceApproval: 'local-main-dev-vars-token-and-agent-only',
      configPath: '/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars', keyPath: '/Users/nighca/code/nighca/lie/.linx-api-key',
      privateDir: resolve(root, 'tmp/p0-original-fixed-run01'),
      resultPath: resolve(import.meta.dirname, 'result-original-fixed-01.json'), WebSocket })
    console.log(JSON.stringify({ completed: report.completed, error: report.error ?? null, calls: report.operations.length, cleanup: report.cleanup }))
    if (!report.completed || !report.cleanup.ownedBindingCleared) process.exitCode = 1
  } catch {
    console.log(JSON.stringify({ completed: false, error: 'Setup or output failed; inspect owned private state before any retry', calls: null, cleanup: null }))
    process.exitCode = 1
  }
}
