import { validateGame, type GameDefinition } from '@lie/game-core'

import type { CharacterPreset } from '../presentation/characterPresets'

export const SHARE_URL_LIMIT = 16_000
export const CONTENT_BYTES_LIMIT = 128 * 1024

async function readLimited(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) throw new Error('案件内容过大，请缩短文本')
      chunks.push(value)
    }
  } finally { await reader.cancel(); reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return bytes
}
function bytesToBase64(bytes: Uint8Array) {
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
function base64ToBytes(text: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) throw new Error('分享链接不完整或已损坏')
  const value = atob(text.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(value, (character) => character.charCodeAt(0))
}
/** The full URL budget is provisional until the browser acceptance matrix is completed. */
export async function encodeGameLink(game: GameDefinition, baseUrl: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') throw new Error('当前浏览器暂不支持生成分享链接，请更新浏览器后重试')
  const normalized = validateGame(game)
  const bytes = new TextEncoder().encode(JSON.stringify(normalized))
  if (bytes.length > CONTENT_BYTES_LIMIT) throw new Error('案件内容过大，请缩短文本')
  const compressed = await readLimited(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')), CONTENT_BYTES_LIMIT)
  const url = new URL('/play', baseUrl)
  url.hash = `game=${bytesToBase64(compressed)}`
  if (url.href.length > SHARE_URL_LIMIT) throw new Error(`分享链接超过 ${SHARE_URL_LIMIT.toLocaleString('en-US')} 字符，请缩短案件文本`)
  return url.href
}
/** Shared stories supply text and preset IDs only; never import arbitrary asset URLs. */
export async function decodeSharedGame(fragment: string, characterPresets: readonly CharacterPreset[]): Promise<GameDefinition> {
  if (typeof DecompressionStream === 'undefined') throw new Error('当前浏览器暂不支持打开分享案件，请更新浏览器后重试')
  if (fragment.length > SHARE_URL_LIMIT) throw new Error('分享链接过长')
  const encoded = new URLSearchParams(fragment.replace(/^#/, '')).get('game')
  if (encoded == null || encoded === '') throw new Error('分享链接缺少案件内容')
  try {
    const compressed = base64ToBytes(encoded)
    const bytes = await readLimited(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')), CONTENT_BYTES_LIMIT)
    const game = validateGame(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
    if (game.characters.some((character) => character.appearanceId != null && !characterPresets.some((characterPreset) => characterPreset.id === character.appearanceId))) throw new Error('分享案件使用了当前不可用的人物形象')
    return game
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('案件内容过大') || error.message.startsWith('分享案件使用'))) throw error
    throw new Error('分享链接不完整或已损坏，请向作者索取完整链接')
  }
}
