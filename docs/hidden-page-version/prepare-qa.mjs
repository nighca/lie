import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../../', import.meta.url)
const dist = new URL('apps/web/dist/', root)
const index = await readFile(new URL('index.html', dist), 'utf8')
const isolate = `<script>
const memory = new Map()
Object.defineProperty(window, 'localStorage', { configurable: true, value: {
  get length() { return memory.size }, key(index) { return [...memory.keys()][index] ?? null },
  getItem(key) { return memory.get(String(key)) ?? null }, setItem(key, value) { memory.set(String(key), String(value)) },
  removeItem(key) { memory.delete(String(key)) }, clear() { memory.clear() },
} })
window.__hiddenVersionQA = { storage: memory }
const route = new URLSearchParams(location.search).get('route') ?? '/'
history.replaceState(null, '', route)
</script>`
await writeFile(new URL('__hidden-version-inner.html', dist), index.replace('<head>', `<head>${isolate}`))
await writeFile(new URL('__hidden-version-qa.html', dist), `<!doctype html>
<html lang="zh-CN"><meta charset="UTF-8"><title>LIE version QA</title>
<style>body{margin:0;padding:16px;background:#eaf2ff;color:#111b45;font:14px/1.5 system-ui}header{display:flex;gap:20px;margin-bottom:12px}iframe{display:block;border:0;width:1280px;height:878px}select{font:inherit;padding:6px}</style>
<header><strong>版本弹窗 · 独立 iframe 验收</strong><label>尺寸 <select id="size"><option value="1280,878">桌面1280×878</option><option value="391,844">手机391×844</option></select></label><button id="home">重新加载首页</button><button id="editor">重新加载编辑器</button></header>
<iframe id="app-frame" title="版本交互验收" src="/__hidden-version-inner.html"></iframe>
<script>
const frame = document.getElementById('app-frame')
document.getElementById('size').addEventListener('change', event => { const [w,h] = event.target.value.split(','); frame.style.width = w+'px'; frame.style.height = h+'px' })
document.getElementById('home').addEventListener('click', () => { frame.src = '/__hidden-version-inner.html' })
document.getElementById('editor').addEventListener('click', () => { frame.src = '/__hidden-version-inner.html?route=%2Feditor' })
</script></html>`)
console.log(`Prepared isolated QA under ${fileURLToPath(dist)}`)
