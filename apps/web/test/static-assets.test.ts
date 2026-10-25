// @vitest-environment node
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { build } from 'vite'
import { expect, it } from 'vitest'

import { fingerprintAssets, staticAssets } from '../build/static-assets.mjs'

it('keeps unchanged URLs stable and changes the complete entry chain for changed images and animation parts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lie-fingerprint-'))
  const put = async (path: string, bytes: string) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), bytes) }
  try {
    await put('public/brand/logo.svg', '<svg/>')
    await put('public/appearances/guide/default.png', 'png-original')
    await put('public/appearances/guide/animation/package.json', '{"assets":{"body":{"src":"parts/body.png"}}}')
    await put('public/appearances/guide/animation/parts/body.png', 'part-original')
    const canonical = JSON.stringify([{ id: 'guide', avatar: '/appearances/guide/default.png', portrait: '/appearances/guide/default.png', portraits: { listening: '/appearances/guide/default.png' }, animation: '/appearances/guide/animation/package.json' }])
    await put('public/appearances/manifest.json', canonical)
    await put('index.html', '<link rel="icon" href="/brand/logo.svg"><script type="module" src="/entry.js"></script>')
    await put('style.css', "body {background: url('/brand/logo.svg')}")
    await put('entry.js', "import './style.css'; import manifest from 'virtual:lie-preset-manifest'; document.body.dataset.manifest = manifest; document.body.dataset.image = '/appearances/guide/default.png'")
    const run = async () => {
      await build({ root, configFile: false, plugins: [staticAssets()], logLevel: 'silent', build: { minify: false } })
      const plan = await fingerprintAssets(join(root, 'public'))
      const entry = (await readdir(join(root, 'dist/assets'))).find(name => name.endsWith('.js'))!
      const js = await readFile(join(root, 'dist/assets', entry), 'utf8')
      expect(js).toContain(plan.manifestUrl)
      expect(js).toContain(plan.urls.get('/appearances/guide/default.png'))
      expect(await readFile(join(root, 'dist/appearances/manifest.json'), 'utf8')).toBe(canonical)
      for (const [path, bytes] of plan.outputs) expect(await readFile(join(root, 'dist', path))).toEqual(bytes)
      const manifest = JSON.parse(plan.outputs.get(plan.manifestUrl.slice(1))!.toString())[0]
      const pkg = JSON.parse((await readFile(join(root, 'dist', manifest.animation))).toString())
      const part = new URL(pkg.assets.body.src, `https://example.test${manifest.animation}`).pathname
      expect(await readFile(join(root, 'dist', part), 'utf8')).toBe(await readFile(join(root, 'public/appearances/guide/animation/parts/body.png'), 'utf8'))
      const css = (await readdir(join(root, 'dist/assets'))).find(name => name.endsWith('.css'))!
      expect(await readFile(join(root, 'dist/assets', css), 'utf8')).toContain(plan.urls.get('/brand/logo.svg'))
      expect(await readFile(join(root, 'dist/index.html'), 'utf8')).toContain(plan.urls.get('/brand/logo.svg'))
      return { plan, entry, css }
    }
    const first = await run(), same = await run()
    expect(same.entry).toBe(first.entry)
    expect(same.plan.manifestUrl).toBe(first.plan.manifestUrl)
    await put('public/appearances/guide/default.png', 'png-modified')
    const image = await run()
    expect(image.entry).not.toBe(first.entry)
    expect(image.plan.manifestUrl).not.toBe(first.plan.manifestUrl)
    expect(image.plan.urls.get('/appearances/guide/default.png')).not.toBe(first.plan.urls.get('/appearances/guide/default.png'))
    expect(image.plan.urls.get('/appearances/guide/animation/package.json')).toBe(first.plan.urls.get('/appearances/guide/animation/package.json'))
    await put('public/appearances/guide/animation/parts/body.png', 'part-modified')
    const part = await run()
    expect(part.entry).not.toBe(image.entry)
    expect(part.plan.manifestUrl).not.toBe(image.plan.manifestUrl)
    expect(part.plan.urls.get('/appearances/guide/animation/package.json')).not.toBe(image.plan.urls.get('/appearances/guide/animation/package.json'))
    await expect(readFile(join(root, 'dist', image.plan.urls.get('/appearances/guide/animation/parts/body.png')!))).rejects.toMatchObject({ code: 'ENOENT' })
    expect(part.plan.urls.get('/appearances/guide/animation/parts/body.png')!.split('/')[2]).toBe(part.plan.urls.get('/appearances/guide/animation/package.json')!.split('/')[2])
    await put('public/brand/logo.svg', '<svg><path/></svg>')
    const brand = await run()
    expect(brand.css).not.toBe(part.css)
    expect(brand.plan.urls.get('/brand/logo.svg')).not.toBe(part.plan.urls.get('/brand/logo.svg'))
  } finally { await rm(root, { recursive: true, force: true }) }
})
