import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const json = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
const sample = await json('coverage/sample.json')
const application = await json('coverage/application/coverage-summary.json')
const detailed = await json('coverage/application/coverage-final.json')
const native = await json('coverage/scripts/summary.json')
const tests = await json('coverage/application-tests.json')
const ordinary = await json('coverage/ordinary-discovery.json')
const identity = (file, name) => `${relative(root, file)}: ${name}`
const observed = tests.testResults.flatMap((file) => file.assertionResults.map((test) => identity(file.name, [...test.ancestorTitles, test.title].join(' > ')))).sort()
assert.deepEqual([...new Set(tests.testResults.map((file) => relative(root, file.name)))].sort(), [...new Set(ordinary.map((test) => relative(root, test.file)))].sort(), 'Coverage files differ from ordinary workspace discovery')
const patterns = ordinary.map((test) => {
  const escaped = identity(test.file, test.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replace(/%[sidfjOo#\$]|\\\$[\w.]+/g, '.*')}$`)
})
assert.ok(observed.every((name) => patterns.some((pattern) => pattern.test(name))), 'Unexpected runtime test')
assert.ok(patterns.every((pattern) => observed.some((name) => pattern.test(name))), 'Ordinary test template missing from coverage')
assert.equal(tests.numFailedTests, 0)
assert.ok(native.coverage && native.tests, 'Missing native coverage or test summary')
assert.equal(native.tests.success, true)
assert.equal(native.tests.counts.failed, 0)
const files = Object.keys(detailed)
assert.ok(files.every((path) => !path.includes('?')), 'Virtual Vue modules must not be counted separately')
const expected = execFileSync('git', ['ls-files', 'apps/web/src', 'apps/gateway/src', 'packages/ui/src', 'packages/game-core/src', 'packages/voice/src', 'packages/character-animation/src'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter((path) => /\.(ts|vue)$/.test(path) && !path.endsWith('.d.ts') && !path.startsWith('packages/ui/src/demo/'))
assert.deepEqual(files.map((path) => relative(root, path)).sort(), expected.sort(), 'Untested production files missing from denominator')
const sfc = []
for (const name of ['apps/web/src/App.vue', 'apps/web/src/editor/Editor.vue', 'packages/ui/src/components/AnimatedPortrait.vue']) {
  const data = detailed[`${root}${name}`]
  assert.ok(data, `Missing original SFC: ${name}`)
  const lines = (await readFile(new URL(`../${name}`, import.meta.url), 'utf8')).split('\n')
  const branches = Object.entries(data.branchMap)
  for (const map of [...Object.values(data.statementMap), ...branches.map(([, branch]) => branch.loc)]) {
    assert.ok(map.start.line >= 1 && map.end.line <= lines.length, `Out-of-range SFC mapping in ${name}`)
  }
  const examples = [branches.find(([id]) => data.b[id].includes(0)), branches.find(([id]) => data.b[id].every((count) => count > 0))]
  assert.ok(examples.every(Boolean), `Need executed and unexecuted branch evidence in ${name}`)
  const scriptEnd = lines.findIndex((line) => line.includes('</script>')) + 1
  const templateBranches = branches.filter(([, branch]) => branch.loc.start.line > scriptEnd)
  sfc.push({ path: name, sourceLines: lines.length, templateBranchCount: templateBranches.length, templateExample: templateBranches.length ? { line: templateBranches[0][1].loc.start.line, source: lines[templateBranches[0][1].loc.start.line - 1].trim() } : null, branchExamples: examples.map(([id, branch]) => ({ line: branch.loc.start.line, counts: data.b[id], source: lines[branch.loc.start.line - 1].trim() })) })
}
const metric = (total, covered) => ({ total, covered, pct: Number((100 * covered / total).toFixed(2)) })
const scripts = Object.fromEntries(['Line', 'Branch', 'Function'].map((key) => [key.toLowerCase() + 's', metric(native.coverage.totals[`total${key}Count`], native.coverage.totals[`covered${key}Count`])]))
const summary = { ...sample, application: { scope: 'Six workspaces, production src .ts/.vue; excludes declarations and UI demo', files: files.length, tests: tests.numTotalTests, ordinaryTestTemplates: ordinary.length, totals: application.total, uncoveredFiles: Object.entries(application).filter(([name, value]) => name !== 'total' && value.lines.total > 0 && value.lines.covered === 0).map(([name]) => relative(root, name)) }, scripts: { scope: ['scripts/main-preview.mjs', 'scripts/character-presets.mjs'], tests: native.tests.counts.tests, totals: scripts }, vueRemapping: sfc }
const output = new URL('../coverage/report/', import.meta.url)
await mkdir(output, { recursive: true })
const pct = application.total.lines.pct
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="206" height="20" role="img" aria-label="application lines: ${pct}%"><title>application lines: ${pct}% (snapshot)</title><rect width="142" height="20" fill="#35405f"/><rect x="142" width="64" height="20" fill="#075bfa"/><g fill="white" font-family="Verdana,sans-serif" font-size="11" text-anchor="middle"><text x="71" y="14">application lines</text><text x="174" y="14">${pct}%</text></g></svg>\n`
const markdown = `Application lines: **${pct}%** (${application.total.lines.covered}/${application.total.lines.total}); ${summary.application.tests} tests, ${files.length} files.\n\nNative scripts (separate denominator): **${scripts.lines.pct}%** (${scripts.lines.covered}/${scripts.lines.total}); ${summary.scripts.tests} tests.\n\nSource: ${sample.sourceSha}; collected: ${sample.collectedAt}; dirty: ${sample.dirty}. These are executable-code metrics, not visual or live-provider acceptance.\n`
await writeFile(new URL('summary.json', output), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(new URL('application-lines.svg', output), svg)
await writeFile(new URL('summary.md', output), markdown)
console.log(markdown)
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, markdown, { flag: 'a' })
if (process.argv.includes('--snapshot')) {
  assert.equal(sample.dirty, false, 'Commit implementation before collecting a tracked snapshot')
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  assert.equal(head, sample.sourceSha, 'Collect again from the current implementation commit')
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'apps', 'packages', 'scripts', 'package.json', 'package-lock.json', 'vitest.coverage.config.ts'], { cwd: root })
  await mkdir(new URL('../docs/coverage/', import.meta.url), { recursive: true })
  for (const name of ['summary.json', 'application-lines.svg', 'summary.md']) await copyFile(new URL(name, output), new URL(`../docs/coverage/${name}`, import.meta.url))
}
