// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { decodeSharedGame, encodeGameLink, CONTENT_BYTES_LIMIT, SHARE_URL_LIMIT } from '../src/editor/share'
import { game as sourceGame } from './helpers'

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
  it('accepts only installed preset IDs while keeping null appearances', async () => {
    const appearance = { id: 'coral', avatar: '/a.png', portrait: '/p.png', accent: '#fff', voiceId: null, portraits: { listening: null, waiting: null, speaking: null } }
    const content = { ...game, characters: game.characters.map((character) => ({ ...character, appearanceId: 'coral' })) }
    const url = await encodeGameLink(content, base)
    expect((await decodeSharedGame(new URL(url).hash, [appearance])).characters[0].appearanceId).toBe('coral')
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
    await expect(encodeGameLink(content, base)).rejects.toThrow('内容过大')
    const hash = await fragment(content)
    expect(hash.length).toBeLessThan(SHARE_URL_LIMIT)
    await expect(decodeSharedGame(hash, [])).rejects.toThrow('内容过大')
  })
  it('enforces the full URL budget including the origin, at the exact boundary', async () => {
    const url = await encodeGameLink(game, base)
    const remaining = SHARE_URL_LIMIT - url.length
    const host = `https://${'x'.repeat(new URL(base).host.length + remaining)}`
    expect((await encodeGameLink(game, host)).length).toBe(SHARE_URL_LIMIT)
    await expect(encodeGameLink(game, `${host}x`)).rejects.toThrow('16,000')
    await expect(decodeSharedGame(`#game=${'a'.repeat(SHARE_URL_LIMIT)}`, [])).rejects.toThrow('过长')
  })
})
