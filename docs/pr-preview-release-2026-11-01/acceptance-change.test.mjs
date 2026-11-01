import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import test from 'node:test'

import { acceptanceFiles } from './acceptance-change.mjs'

const gateway = await readFile(new URL('../../apps/gateway/src/index.ts', import.meta.url), 'utf8')

test('the temporary API and browser consumer share each approved revision', async () => {
  for (const revision of ['preview-acceptance-v1', 'preview-acceptance-v2']) {
    const files = acceptanceFiles(gateway, revision)
    assert.deepEqual(files.map(file => file.path), ['apps/gateway/src/index.ts', 'apps/web/public/pr-preview-check.html'])
    assert.ok(files[0].content.includes(`revision: '${revision}'`))
    const script = /<script type="module">([\s\S]*)<\/script>/.exec(files[1].content)[1]
    const output = { dataset: {}, textContent: '' }, calls = []
    await runInNewContext(`(async () => { ${script} })()`, { document: { querySelector: () => output }, fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ revision }) } } })
    assert.equal(output.dataset.result, 'passed')
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [{ url: '/api/pr-preview-check', options: { cache: 'no-store' } }])
  }
})

test('a frontend API mismatch is visible and no voice endpoint is called', async () => {
  const html = acceptanceFiles(gateway, 'preview-acceptance-v1')[1].content
  const script = /<script type="module">([\s\S]*)<\/script>/.exec(html)[1]
  const output = { dataset: {}, textContent: '' }
  await runInNewContext(`(async () => { ${script} })()`, { document: { querySelector: () => output }, fetch: async url => {
    assert.equal(url, '/api/pr-preview-check')
    return { ok: true, json: async () => ({ revision: 'other' }) }
  } })
  assert.equal(output.dataset.result, 'failed')
  assert.throws(() => acceptanceFiles(gateway, 'unreviewed'))
})
