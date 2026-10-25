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
      await build({ root, configFile: false, plugins: [staticAssets({ optimizeImage: async bytes => ({ bytes, extension: '.png' }) })], logLevel: 'silent', build: { minify: false } })
      const plan = await fingerprintAssets(join(root, 'public'), { optimizeImage: async bytes => ({ bytes, extension: '.png' }) })
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

it('fingerprints result terminal portraits independently and all animation attachments together', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lie-result-fingerprint-'))
  const put = async (path: string, bytes: string) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), bytes) }
  try {
    await mkdir(join(root, 'brand'))
    const right = '/appearances/guide/accused-correctly.png', wrong = '/appearances/guide/accused-wrongly.png'
    const animation = '/appearances/guide/animation/package.json', part = '/appearances/guide/animation/parts/result-face.png'
    await put(right.slice(1), 'right-terminal')
    await put(wrong.slice(1), 'wrong-terminal')
    await put(animation.slice(1), JSON.stringify({ schemaVersion: 2, assets: { face: { src: 'parts/result-face.png', width: 1, height: 1 } } }))
    await put(part.slice(1), 'shared-result-face')
    await put('appearances/manifest.json', JSON.stringify([{ id: 'guide', portraits: { accusedCorrectly: right, accusedWrongly: wrong }, animation }]))
    const first = await fingerprintAssets(root, { optimizeImage: async bytes => ({ bytes, extension: '.png' }) })
    const [preset] = JSON.parse(first.outputs.get(first.manifestUrl.slice(1))!.toString())
    expect(preset.portraits.accusedCorrectly).toBe(first.urls.get(right))
    expect(preset.portraits.accusedWrongly).toBe(first.urls.get(wrong))
    await put(right.slice(1), 'updated-right-terminal')
    const changed = await fingerprintAssets(root, { optimizeImage: async bytes => ({ bytes, extension: '.png' }) })
    expect(changed.manifestUrl).not.toBe(first.manifestUrl)
    expect(changed.urls.get(right)).not.toBe(first.urls.get(right))
    expect(changed.urls.get(wrong)).toBe(first.urls.get(wrong))
    expect(changed.urls.get(animation)).toBe(first.urls.get(animation))
    await put(part.slice(1), 'updated-result-face')
    const attachments = await fingerprintAssets(root, { optimizeImage: async bytes => ({ bytes, extension: '.png' }) })
    expect(attachments.manifestUrl).not.toBe(changed.manifestUrl)
    expect(attachments.urls.get(animation)).not.toBe(changed.urls.get(animation))
    expect(attachments.urls.get(part)!.split('/')[2]).toBe(attachments.urls.get(animation)!.split('/')[2])
    expect(attachments.urls.get(right)).toBe(changed.urls.get(right))
  } finally { await rm(root, { recursive: true, force: true }) }
})

it('hashes compressed final bytes, rewrites every state and relative part, and encodes duplicate source bytes once', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lie-derived-'))
  const put = async (path: string, bytes: string) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), bytes) }
  try {
    await put('brand/logo.svg', '<svg/>')
    await put('appearances/guide/default.png', 'same-source')
    await put('appearances/guide/accused-correctly.png', 'result-source')
    await put('appearances/guide/animation/parts/body.png', 'same-source')
    await put('appearances/guide/animation/package.json', JSON.stringify({ schemaVersion: 2, assets: { body: { src: 'parts/body.png', width: 1, height: 1 } } }))
    const original = [{ id: 'guide', avatar: '/appearances/guide/default.png', portrait: '/appearances/guide/default.png', portraits: { accusedCorrectly: '/appearances/guide/accused-correctly.png' }, animation: '/appearances/guide/animation/package.json' }]
    await put('appearances/manifest.json', JSON.stringify(original))
    let encoded = 0
    const optimizeImage = async (bytes: Buffer): Promise<{ bytes: Buffer; extension: '.webp' }> => { encoded++; return { bytes: Buffer.from(`q90:${bytes}`), extension: '.webp' } }
    const plan = await fingerprintAssets(root, { optimizeImage })
    expect(encoded).toBe(2)
    const manifestBytes = plan.outputs.get(plan.manifestUrl.slice(1))!
    const manifest = JSON.parse(manifestBytes.toString())[0]
    expect(manifest.portrait).toMatch(/\/default\.webp$/)
    expect(manifest.portraits.accusedCorrectly).toMatch(/\/accused-correctly\.webp$/)
    const image = plan.outputs.get(manifest.portrait.slice(1))!
    const { createHash } = await import('node:crypto')
    expect(manifest.portrait.split('/')[2]).toBe(createHash('sha256').update(image).digest('hex'))
    expect(plan.manifestUrl.split('/')[2]).toBe(createHash('sha256').update(manifestBytes).digest('hex'))
    const pkg = JSON.parse(plan.outputs.get(manifest.animation.slice(1))!.toString())
    expect(pkg.assets.body.src).toBe('parts/body.webp')
    const part = new URL(pkg.assets.body.src, `https://example.test${manifest.animation}`).pathname.slice(1)
    expect(plan.outputs.get(part)).toEqual(image)
    expect(await readFile(join(root, 'appearances/manifest.json'), 'utf8')).toBe(JSON.stringify(original))
    const changedPolicy = await fingerprintAssets(root, { optimizeImage: async bytes => ({ bytes: Buffer.from(`changed:${bytes}`), extension: '.webp' }) })
    expect(changedPolicy.manifestUrl).not.toBe(plan.manifestUrl)
    expect(changedPolicy.urls.get('/appearances/guide/animation/package.json')).not.toBe(manifest.animation)
    await put('appearances/guide/animation/package.json', JSON.stringify({ assets: { body: { src: '../../../brand/logo.svg' } } }))
    await expect(fingerprintAssets(root, { optimizeImage })).rejects.toThrow('Unsafe animation')
  } finally { await rm(root, { recursive: true, force: true }) }
})
