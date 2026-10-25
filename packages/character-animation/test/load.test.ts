import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadAnimationPackage } from '../src/load'
import { webpImage } from './webp-fixture'
const data = { schemaVersion: 1, canvas: { width: 1, height: 1 }, assets: { part: { src: 'parts/part.png', width: 1, height: 1 } }, nodes: [{ id: 'part', parent: null, visible: true, transform: { x: 0, y: 0, pivotX: 0, pivotY: 0, rotation: 0, scaleX: 1, scaleY: 1 }, sprite: { asset: 'part', order: 0 } }], clips: { idle: { duration: 1, loop: true, visibility: {}, tracks: [] } }, states: { default: 'idle', listening: 'idle', waiting: 'idle', speaking: 'idle' }, transitions: [] }
const url = new URL('https://local.test/appearances/person/animation/package.json')
function png(width = 1, height = 1) {
  const bytes = new Uint8Array(24), view = new DataView(bytes.buffer)
  ;[0x89504e47, 0x0d0a1a0a, 13, 0x49484452, width, height].forEach((value, i) => view.setUint32(i * 4, value))
  return bytes
}
function deferred() {
  let resolve!: () => void, reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
function setup(width = 1, decode = () => Promise.resolve()) {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response(png()))
  const images: { src: string }[] = []
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('Image', class { src = ''; naturalWidth = width; naturalHeight = 1; decode = decode; constructor() { images.push(this) } })
  const revoke = vi.spyOn(URL, 'revokeObjectURL')
  return { fetcher, revoke, images }
}
describe('browser animation resource loading', () => {
  it('loads package-relative shared images once and revokes temporary URLs', async () => {
    const { fetcher, revoke } = setup()
    const result = await loadAnimationPackage(url, new AbortController().signal)
    expect(result.images.size).toBe(1)
    expect(fetcher.mock.calls[1][0].href).toBe('https://local.test/appearances/person/animation/parts/part.png')
    expect(fetcher.mock.calls.every(call => call[1].signal instanceof AbortSignal)).toBe(true)
    expect(revoke).toHaveBeenCalledOnce()
  })
  it('rejects corrupt decoded dimensions and decoding failures', async () => {
    const { revoke, images } = setup(2)
    await expect(loadAnimationPackage(url, new AbortController().signal)).rejects.toThrow('dimensions')
    expect(revoke).toHaveBeenCalledOnce(); expect(images[0].src).toBe('')
    setup(1, () => Promise.reject(new Error('decode failed')))
    await expect(loadAnimationPackage(url, new AbortController().signal)).rejects.toThrow('decode failed')
  })
  it.each(['resolve', 'reject'] as const)('aborts an unsettled decode promptly and ignores its late %s', async late => {
    const decode = deferred(), started = deferred(), controller = new AbortController()
    const { revoke, images } = setup(1, () => { started.resolve(); return decode.promise })
    const add = vi.spyOn(controller.signal, 'addEventListener'), remove = vi.spyOn(controller.signal, 'removeEventListener')
    const loaded = loadAnimationPackage(url, controller.signal)
    const rejected = expect(loaded).rejects.toMatchObject({ name: 'AbortError' })
    await started.promise
    controller.abort()
    await rejected
    expect(images[0].src).toBe(''); expect(revoke).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0][1])
    if (late === 'resolve') decode.resolve(); else decode.reject(new Error('late decode failure'))
    await Promise.resolve()
    expect(images[0].src).toBe(''); expect(revoke).toHaveBeenCalledOnce()
  })
  it('bounds combined fetch/decode work to three parts and cancels siblings on failure', async () => {
    const raw = structuredClone(data)
    raw.assets = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`part-${i}`, { src: `parts/part-${i}.png`, width: 1, height: 1 }])) as typeof raw.assets
    raw.nodes[0].sprite.asset = 'part-0'
    const started = deferred(), decodes: ReturnType<typeof deferred>[] = []
    const { fetcher, revoke, images } = setup(1, () => { const decode = deferred(); decodes.push(decode); if (decodes.length === 3) started.resolve(); return decode.promise })
    fetcher.mockReset().mockImplementation(async (target: URL) => target.href.endsWith('package.json') ? new Response(JSON.stringify(raw)) : new Response(png()))
    const loaded = loadAnimationPackage(url, new AbortController().signal), rejected = expect(loaded).rejects.toThrow('bad image')
    await started.promise
    expect(fetcher).toHaveBeenCalledTimes(4)
    decodes[0].reject(new Error('bad image'))
    await rejected
    expect(images).toHaveLength(3); expect(images.every(image => image.src === '')).toBe(true)
    expect(revoke).toHaveBeenCalledTimes(3)
    decodes[1].resolve(); decodes[2].reject(new Error('late sibling failure'))
    await Promise.resolve()
    expect(fetcher).toHaveBeenCalledTimes(4)
  })
  it('loads the full resource set through the bounded pool', async () => {
    const raw = structuredClone(data)
    raw.assets = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`part-${i}`, { src: `parts/part-${i}.png`, width: 1, height: 1 }])) as typeof raw.assets
    raw.nodes[0].sprite.asset = 'part-0'
    let active = 0, peak = 0
    const { fetcher, revoke } = setup(1, async () => { active++; peak = Math.max(peak, active); await Promise.resolve(); active-- })
    fetcher.mockReset().mockImplementation(async (target: URL) => target.href.endsWith('package.json') ? new Response(JSON.stringify(raw)) : new Response(png()))
    const loaded = await loadAnimationPackage(url, new AbortController().signal)
    expect(loaded.images.size).toBe(8)
    expect(peak).toBeLessThanOrEqual(3)
    expect(fetcher).toHaveBeenCalledTimes(9); expect(revoke).toHaveBeenCalledTimes(8)
  })
  it('rejects non-success package and image responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    await expect(loadAnimationPackage(url, new AbortController().signal)).rejects.toThrow('package load')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response('', { status: 404 })))
    await expect(loadAnimationPackage(url, new AbortController().signal)).rejects.toThrow('part load')
  })
  it.each([new Uint8Array([1]), png(8192, 8192)])('rejects invalid/mismatched PNG headers before decoding', async bytes => {
    const { fetcher, images } = setup()
    fetcher.mockReset().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response(bytes))
    await expect(loadAnimationPackage(url, new AbortController().signal)).rejects.toThrow()
    expect(images).toHaveLength(0)
  })
  it.each(['VP8 ', 'VP8L', 'VP8X'] as const)('loads %s bytes without trusting the MIME or extension', async kind => {
    const { fetcher, revoke } = setup()
    fetcher.mockReset().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response(webpImage(kind), { headers: { 'Content-Type': 'text/plain' } }))
    const result = await loadAnimationPackage(url, new AbortController().signal)
    expect(result.images.size).toBe(1); expect(revoke).toHaveBeenCalledOnce()
  })
  it('loads mixed PNG/WebP parts', async () => {
    const raw = structuredClone(data)
    raw.assets = { ...raw.assets, other: { src: 'parts/other.webp', width: 1, height: 1 } } as typeof raw.assets
    const { fetcher, revoke } = setup()
    fetcher.mockReset().mockImplementation(async (target: URL) => target.href.endsWith('package.json') ? new Response(JSON.stringify(raw)) : new Response(target.href.endsWith('.webp') ? webpImage('VP8X') : png()))
    expect((await loadAnimationPackage(url, new AbortController().signal)).images.size).toBe(2)
    expect(revoke).toHaveBeenCalledTimes(2)
  })
  it.each(['VP8 ', 'VP8L', 'VP8X'] as const)('rejects mismatched %s encoded dimensions before allocating an Image', async kind => {
    const { fetcher, images } = setup()
    fetcher.mockReset().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response(webpImage(kind, 2, 1)))
    await expect(loadAnimationPackage(url, new AbortController().signal)).rejects.toThrow('dimensions')
    expect(images).toHaveLength(0)
  })
  it('releases WebP URLs and images on decode failure and cancellation', async () => {
    const decode = deferred(), started = deferred(), controller = new AbortController()
    const { fetcher, revoke, images } = setup(1, () => { started.resolve(); return decode.promise })
    fetcher.mockReset().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response(webpImage('VP8X')))
    const loaded = loadAnimationPackage(url, controller.signal), rejected = expect(loaded).rejects.toMatchObject({ name: 'AbortError' })
    await started.promise; controller.abort(); await rejected
    expect(revoke).toHaveBeenCalledOnce(); expect(images[0].src).toBe('')
    decode.reject(new Error('late decode failure')); await Promise.resolve()
    const failed = setup(1, () => Promise.reject(new Error('WebP decode failed')))
    failed.fetcher.mockReset().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response(webpImage('VP8L')))
    await expect(loadAnimationPackage(url, new AbortController().signal)).rejects.toThrow('WebP decode failed')
    expect(failed.images[0].src).toBe('')
  })
  it('rejects an already canceled request before fetching', async () => {
    const { fetcher } = setup(), controller = new AbortController(); controller.abort()
    await expect(loadAnimationPackage(url, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetcher).not.toHaveBeenCalled()
  })
})
