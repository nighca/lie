// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { decodeSharedGame, loadSharedGame, saveSharedGame, CONTENT_BYTES_LIMIT, SHARE_URL_LIMIT } from '../src/editor/share'
import { game as sourceGame } from './helpers'
import { legacyGameLink as encodeGameLink } from './legacy-share'

const game = { ...sourceGame, characters: sourceGame.characters.map((character) => ({ ...character, appearanceId: null })) }


const base = 'https://lie.example'
async function fragment(content: unknown) {
  const bytes = await new Response(new Blob([JSON.stringify(content)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()
  return `#game=${Buffer.from(bytes).toString('base64url')}`
}
describe('editor story sharing', () => {
  it('round-trips a full Chinese story and strips unsupported asset fields', async () => {
    const content = { ...game, title: '鸭叫？🦆', background: '<script>alert(1)</script>只是文本', imageUrl: 'https://untrusted.example/a.svg' }
    const url = await encodeGameLink(content, base)
    expect(url.startsWith(`${base}/play#game=`)).toBe(true)
    expect(url).toMatch(/^[\x00-\x7F]+$/)
    const restored = await decodeSharedGame(new URL(url).hash, [])
    expect(restored).toEqual({ ...game, title: content.title, background: content.background })
    expect(new URL(url).search).toBe('')
  })
  it('preserves summaries and accepts legacy fragments that omitted them', async () => {
    const { summary, ...legacy } = game
    expect((await decodeSharedGame(await fragment(legacy), [])).summary).toBeUndefined()
    for (const summary of ['', '作者写的简介\n第二行']) {
      const url = await encodeGameLink({ ...game, summary }, base)
      expect((await decodeSharedGame(new URL(url).hash, [])).summary).toBe(summary)
    }
  })
  it('accepts only installed preset IDs while keeping null characterPresets', async () => {
    const characterPreset = { id: 'coral', name: '珊瑚形象', avatar: '/a.png', portrait: '/p.png', accent: '#fff', voiceId: null, animation: null, portraits: { listening: null, waiting: null, speaking: null } }
    const content = { ...game, characters: game.characters.map((character) => ({ ...character, appearanceId: 'coral' })) }
    const url = await encodeGameLink(content, base)
    expect((await decodeSharedGame(new URL(url).hash, [characterPreset])).characters[0].appearanceId).toBe('coral')
    await expect(decodeSharedGame(new URL(url).hash, [])).rejects.toThrow('不可用的人物形象')
  })
  it.each(['', '#game=', '#game=abc!', '#game=a', '#game=aGVsbG8', '#game=H4sI'])('rejects missing, corrupt or truncated data %s', async (hash) => {
    await expect(decodeSharedGame(hash, [])).rejects.toThrow('分享链接')
  })
  it('rejects content that violates the existing core game contract', async () => {
    await expect(decodeSharedGame(await fragment({ ...game, ending: { culpritId: 'missing', reveal: '真相' } }), [])).rejects.toThrow('已损坏')
  })
  it('bounds decompressed size even for a highly compressible payload', async () => {
    const content = { ...game, background: '甲'.repeat(CONTENT_BYTES_LIMIT) }
    const hash = await fragment(content)
    expect(hash.length).toBeLessThan(SHARE_URL_LIMIT)
    await expect(decodeSharedGame(hash, [])).rejects.toThrow('内容过大')
  })
  it('rejects oversized legacy fragments', async () => {
    await expect(decodeSharedGame(`#game=${'a'.repeat(SHARE_URL_LIMIT)}`, [])).rejects.toThrow('过长')
  })
})

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })
describe('persistent sharing', () => {
  const id = 'gmlvKTOY_GNRWutf2yaZBw'
  it('posts canonical JSON and reads a short link without compression support', async () => {
    const request = vi.fn().mockResolvedValueOnce(Response.json({ id })).mockResolvedValueOnce(Response.json(game))
    vi.stubGlobal('fetch', request)
    vi.stubGlobal('CompressionStream', undefined)
    const link = await saveSharedGame({ ...game, title: '中文🦆' }, base)
    expect(link).toBe(`${base}/play?share=v1.${id}`)
    expect(request.mock.calls[0][0]).toBe('/api/shared-games/v1')
    expect(JSON.parse(request.mock.calls[0][1].body).title).toBe('中文🦆')
    expect(await loadSharedGame(new URL(link), [])).toEqual(game)
  })
  it('limits UTF-8 writes to 1 MiB and still accepts larger-than-legacy stories', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ id }))
    vi.stubGlobal('fetch', request)
    const small = JSON.stringify(game)
    const budget = 1024 * 1024 - new TextEncoder().encode(small).byteLength
    const exact = { ...game, background: game.background + 'a'.repeat(budget) }
    await expect(saveSharedGame(exact, base)).resolves.toContain(id)
    await expect(saveSharedGame({ ...exact, background: exact.background + '甲' }, base)).rejects.toMatchObject({ retryable: false })
    expect(request).toHaveBeenCalledTimes(1)
  })
  it.each([['?share=v2.' + id, ''], ['?share=bad', ''], ['?share=v1.' + id, '#game=x'], ['?share=v1.' + id + '&share=v1.' + id, '']])('rejects malformed or ambiguous routes %s%s', async (query, hash) => {
    const request = vi.fn(); vi.stubGlobal('fetch', request)
    await expect(loadSharedGame(new URL(base + '/play' + query + hash), [])).rejects.toThrow('分享链接')
    expect(request).not.toHaveBeenCalled()
  })
  it.each([404, 413, 503])('maps server status %s to safe messages', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private server details', { status })))
    await expect(saveSharedGame(game, base)).rejects.toThrow(status === 404 ? '不存在' : status === 413 ? '内容过大' : '服务暂时不可用')
  })
  it('times out the request and does not fall back to a fragment link', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_path, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))))))
    const saving = saveSharedGame(game, base)
    const failure = expect(saving).rejects.toThrow('超时')
    await vi.advanceTimersByTimeAsync(15_000)
    await failure
  })
})
