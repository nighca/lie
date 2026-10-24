import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadAnimationPackage } from '../src/load'
const data = { schemaVersion: 1, canvas: { width: 1, height: 1 }, assets: { part: { src: 'parts/part.png', width: 1, height: 1 } }, nodes: [{ id: 'part', parent: null, visible: true, transform: { x: 0, y: 0, pivotX: 0, pivotY: 0, rotation: 0, scaleX: 1, scaleY: 1 }, sprite: { asset: 'part', order: 0 } }], clips: { idle: { duration: 1, loop: true, visibility: {}, tracks: [] } }, states: { default: 'idle', listening: 'idle', waiting: 'idle', speaking: 'idle' }, transitions: [] }
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
function setup(width = 1, decode = () => Promise.resolve()) {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response(new Uint8Array([1])))
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal('Image', class { src = ''; naturalWidth = width; naturalHeight = 1; decode = decode })
  const revoke = vi.spyOn(URL, 'revokeObjectURL')
  return { fetcher, revoke }
}
describe('browser animation resource loading', () => {
  it('loads package-relative shared images once and revokes temporary URLs', async () => {
    const { fetcher, revoke } = setup(), signal = new AbortController().signal
    const result = await loadAnimationPackage(new URL('https://local.test/appearances/person/animation/package.json'), signal)
    expect(result.images.size).toBe(1)
    expect(fetcher.mock.calls[1][0].href).toBe('https://local.test/appearances/person/animation/parts/part.png')
    expect(fetcher.mock.calls.every(call => call[1].signal === signal)).toBe(true)
    expect(revoke).toHaveBeenCalledOnce()
  })
  it('rejects failed packages, corrupt dimensions and decoding failures', async () => {
    const { revoke } = setup(2)
    await expect(loadAnimationPackage(new URL('https://local.test/package.json'), new AbortController().signal)).rejects.toThrow('dimensions')
    expect(revoke).toHaveBeenCalledOnce()
    setup(1, () => Promise.reject(new Error('decode failed')))
    await expect(loadAnimationPackage(new URL('https://local.test/package.json'), new AbortController().signal)).rejects.toThrow('decode failed')
  })
  it('does not return resources decoded after cancellation', async () => {
    const controller = new AbortController()
    const { revoke } = setup(1, async () => { controller.abort() })
    await expect(loadAnimationPackage(new URL('https://local.test/package.json'), controller.signal)).rejects.toThrow()
    expect(revoke).toHaveBeenCalledOnce()
  })
  it('rejects non-success package and image responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    await expect(loadAnimationPackage(new URL('https://local.test/package.json'), new AbortController().signal)).rejects.toThrow('package load')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(data))).mockResolvedValueOnce(new Response('', { status: 404 })))
    await expect(loadAnimationPackage(new URL('https://local.test/package.json'), new AbortController().signal)).rejects.toThrow('part load')
  })
})
