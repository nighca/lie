import { SHARED_GAME_API_PATH, SHARED_GAME_BYTES_LIMIT, SHARED_GAME_ID_PATTERN, serializeSharedGameV1, validateGame, type GameDefinition } from '@lie/game-core'

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
function base64ToBytes(text: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) throw new Error('分享链接不完整或已损坏')
  const value = atob(text.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(value, (character) => character.charCodeAt(0))
}
export class ShareError extends Error {
  constructor(message: string, readonly retryable = true) { super(message) }
}

async function sharedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(path, { ...init, signal: controller.signal })
    if (!response.ok) {
      if (response.status === 413) throw new ShareError('案件内容过大，请精简后再分享。', false)
      if (response.status === 404) throw new ShareError('案件不存在或已不可用，请向作者确认链接。', false)
      if (response.status === 400 || response.status === 415) throw new ShareError('案件内容或分享链接有误，请检查后重试。', false)
      throw new ShareError('分享服务暂时不可用，请稍后重试。')
    }
    return await response.json() as T
  } catch (error) {
    if (error instanceof ShareError) throw error
    throw new ShareError(controller.signal.aborted ? '请求超时，请稍后重试。' : '网络连接失败，请检查网络后重试。')
  } finally { clearTimeout(timer) }
}

export async function saveSharedGame(game: GameDefinition, baseUrl: string): Promise<string> {
  const body = serializeSharedGameV1(game)
  if (new TextEncoder().encode(body).byteLength > SHARED_GAME_BYTES_LIMIT) throw new ShareError('案件内容过大，请精简后再分享。', false)
  const result = await sharedRequest<unknown>(SHARED_GAME_API_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
  if (result == null || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string' || !SHARED_GAME_ID_PATTERN.test(result.id)) throw new ShareError('暂时无法生成分享链接，请稍后重试。')
  const url = new URL('/play', baseUrl)
  url.searchParams.set('share', `v1.${result.id}`)
  return url.href
}

function checkPresets(game: GameDefinition, characterPresets: readonly CharacterPreset[]): GameDefinition {
  if (game.characters.some((character) => character.appearanceId != null && !characterPresets.some((preset) => preset.id === character.appearanceId))) throw new Error('分享案件使用了当前不可用的人物形象')
  return game
}

export async function loadSharedGame(url: URL, characterPresets: readonly CharacterPreset[]): Promise<GameDefinition> {
  const shares = url.searchParams.getAll('share')
  if (shares.length === 0) {
    if (url.href.length > SHARE_URL_LIMIT) throw new Error('分享链接过长，请向作者索取可用链接')
    return decodeSharedGame(url.hash, characterPresets)
  }
  if (shares.length !== 1 || new URLSearchParams(url.hash.replace(/^#/, '')).has('game')) throw new Error('分享链接格式不正确')
  const match = /^v1\.(.+)$/.exec(shares[0])
  if (match == null || !SHARED_GAME_ID_PATTERN.test(match[1])) throw new Error('分享链接格式不正确或版本暂不支持')
  const data = await sharedRequest<unknown>(`${SHARED_GAME_API_PATH}/${match[1]}`)
  return checkPresets(validateGame(data), characterPresets)
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
    return checkPresets(game, characterPresets)
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('案件内容过大') || error.message.startsWith('分享案件使用'))) throw error
    throw new Error('分享链接不完整或已损坏，请向作者索取完整链接')
  }
}
