import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const node = (args) => execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
await rm(new URL('../coverage/', import.meta.url), { recursive: true, force: true })
await mkdir(new URL('../coverage/scripts/', import.meta.url), { recursive: true })
node(['scripts/character-presets.mjs'])
const discovery = []
for (const directory of ['apps/web', 'apps/gateway', 'packages/ui', 'packages/game-core', 'packages/voice', 'packages/character-animation']) {
  const output = execFileSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'list', '--root', directory, '--json'], { cwd: root, encoding: 'utf8' })
  discovery.push(...JSON.parse(output))
}
await writeFile(new URL('../coverage/ordinary-discovery.json', import.meta.url), JSON.stringify(discovery))
node(['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.coverage.config.ts', '--coverage'])
node([
  '--test', '--experimental-test-coverage',
  '--test-coverage-include=scripts/main-preview.mjs',
  '--test-coverage-include=scripts/character-presets.mjs',
  '--test-reporter=lcov', '--test-reporter-destination=coverage/scripts/lcov.info',
  '--test-reporter=./scripts/coverage-node-reporter.mjs', '--test-reporter-destination=coverage/scripts/summary.json',
  'scripts/main-preview.test.mjs', 'scripts/character-presets.test.mjs',
])
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim() !== ''
await writeFile(new URL('../coverage/sample.json', import.meta.url), `${JSON.stringify({ sourceSha, dirty, collectedAt: new Date().toISOString(), node: process.version }, null, 2)}\n`)
node(['scripts/coverage-report.mjs'])
