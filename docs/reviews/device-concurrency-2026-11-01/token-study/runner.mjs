import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { runApproved } from './probe.mjs'

// The flag identifies an already granted turn; it does not grant permission itself.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href &&
  process.argv.length === 3 && process.argv[2] === '--execute-dedicated-approved') {
  try {
    const WebSocket = (await import('ws')).default
    const root = resolve(import.meta.dirname, '../../../..')
    const report = await runApproved({ approval: 'dedicated-token-share-turn-approved',
      keyPath: '/Users/nighca/code/nighca/lie/.linx-api-key',
      privateDir: resolve(root, 'tmp/p0-token-study-run01'), resultPath: resolve(import.meta.dirname, 'result.json'), WebSocket })
    console.log(JSON.stringify({ completed: report.completed, error: report.error ?? null, calls: report.operations.length, cleanup: report.cleanup }))
    if (!report.completed || !report.cleanup.resourcesRemoved) process.exitCode = 1
  } catch {
    console.log(JSON.stringify({ completed: false, error: 'Setup or output failed; inspect owned private state before any retry', calls: null, cleanup: null }))
    process.exitCode = 1
  }
}
