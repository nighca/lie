import { SHARED_GAME_API_PATH, SHARED_GAME_BYTES_LIMIT, SHARED_GAME_ID_PATTERN, serializeSharedGameV1, validateGame } from '@lie/game-core'

import characterPresets from '../../../design/character-presets/manifest.json'

const presetIds = new Set(characterPresets.map((preset) => preset.id))
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }

function failure(error: string, status: number): Response {
  return Response.json({ error }, { status, headers })
}

async function readContent(request: Request): Promise<string | null> {
  if (Number(request.headers.get('Content-Length')) > SHARED_GAME_BYTES_LIMIT) return null
  const reader = request.body?.getReader()
  if (reader == null) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > SHARED_GAME_BYTES_LIMIT) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)
}

export async function sharedGames(request: Request, bucket: Pick<R2Bucket, 'get' | 'put'> | undefined): Promise<Response> {
  const url = new URL(request.url)
  const id = url.pathname.slice(SHARED_GAME_API_PATH.length + 1)
  if (url.search !== '') return failure('invalid_id', 400)
  if (request.method === 'POST' && url.pathname === SHARED_GAME_API_PATH) {
    if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return failure('forbidden', 403)
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json' || ![null, 'identity'].includes(request.headers.get('Content-Encoding'))) return failure('unsupported_media_type', 415)
    if (bucket == null) return failure('storage_unavailable', 503)
    let content: string
    try {
      const text = await readContent(request)
      if (text == null) return failure('content_too_large', 413)
      const game = validateGame(JSON.parse(text))
      if (game.characters.some((character) => character.appearanceId != null && !presetIds.has(character.appearanceId))) return failure('invalid_content', 400)
      content = serializeSharedGameV1(game)
    } catch { return failure('invalid_content', 400) }
    const bytes = new TextEncoder().encode(content)
    if (bytes.byteLength > SHARED_GAME_BYTES_LIMIT) return failure('content_too_large', 413)
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)).slice(0, 16)
    const contentId = btoa(String.fromCharCode(...digest)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
    try {
      await bucket.put(`games/v1/${contentId}.json`, bytes, { httpMetadata: { contentType: 'application/json; charset=utf-8' } })
      return Response.json({ id: contentId }, { headers })
    } catch { return failure('storage_unavailable', 503) }
  }
  if (request.method === 'GET' && url.pathname.startsWith(`${SHARED_GAME_API_PATH}/`)) {
    if (!SHARED_GAME_ID_PATTERN.test(id)) return failure('invalid_id', 400)
    if (bucket == null) return failure('storage_unavailable', 503)
    try {
      const object = await bucket.get(`games/v1/${id}.json`)
      return object == null ? failure('not_found', 404) : new Response(object.body, { headers })
    } catch { return failure('storage_unavailable', 503) }
  }
  return failure('not_found', 404)
}
