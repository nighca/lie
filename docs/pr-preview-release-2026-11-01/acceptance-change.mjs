const revisions = new Set(['preview-acceptance-v1', 'preview-acceptance-v2'])

/** The temporary PR changes only a public test API and its independent frontend consumer. */
export function acceptanceFiles(gatewaySource, revision) {
  if (!revisions.has(revision)) throw Error('Unreviewed acceptance revision')
  const marker = "    const url = new URL(request.url)\n    if (url.pathname === '/api/health'"
  if (gatewaySource.split(marker).length !== 2) throw Error('Reviewed gateway insertion point changed')
  const gateway = gatewaySource.replace(marker, `    const url = new URL(request.url)\n    if (url.pathname === '/api/pr-preview-check' && request.method === 'GET') {\n      return Response.json({ revision: '${revision}' }, { headers: { 'Cache-Control': 'no-store' } })\n    }\n    if (url.pathname === '/api/health'`)
  const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PR preview acceptance</title>
<body>
<h1>PR 前后端同版验收</h1>
<p>此测试页只调用本 PR 新增接口，不加载案件或语音。</p>
<output id="result" aria-live="polite" data-result="pending">正在核验…</output>
<script type="module">
const expected = '${revision}'
const output = document.querySelector('#result')
try {
  const response = await fetch('/api/pr-preview-check', { cache: 'no-store' })
  if (!response.ok) throw new Error('API request failed')
  const value = await response.json()
  if (value.revision !== expected) throw new Error('Frontend and Worker revisions differ')
  output.dataset.result = 'passed'
  output.textContent = expected + '：前端和 Worker 一致'
} catch {
  output.dataset.result = 'failed'
  output.textContent = '前端和 Worker 验收失败'
}
</script>
</body>
</html>
`
  return [
    { path: 'apps/gateway/src/index.ts', mode: '100644', type: 'blob', content: gateway },
    { path: 'apps/web/public/pr-preview-check.html', mode: '100644', type: 'blob', content: html }
  ]
}
