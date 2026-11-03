import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { SHARED_GAME_API_PATH, SHARED_GAME_BYTES_LIMIT, serializeSharedGameV1 } from '@lie/game-core'
import { Miniflare } from 'miniflare'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { sharedGames } from '../src/shared-games'
import { workerScript } from './worker-script'

const origin = 'https://game.example'
const game = {
  id: 'shared-example', title: '测试案件', background: '  公共背景\n不改空白。', interrogationLimitSeconds: 60,
  characters: [{ id: 'a', name: '甲', profile: '甲的秘密', appearanceId: 'coral-bob' }, { id: 'b', name: '乙', profile: '乙的秘密', appearanceId: null }],
  ending: { culpritId: 'a', reveal: '完整经过。' }
}
const expectedId = createHash('sha256').update(serializeSharedGameV1(game)).digest().subarray(0, 16).toString('base64url')
const script = await workerScript()
let runtime: Miniflare

function post(body: string | Uint8Array | ReadableStream = JSON.stringify(game), headers: Record<string, string> = {}) {
  return new Request(origin + SHARED_GAME_API_PATH, {
    method: 'POST', body, duplex: 'half', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }
  } as RequestInit)
}

async function dispatch(request: Request) {
  return runtime.dispatchFetch(request.url, {
    method: request.method, headers: [...request.headers], body: request.body == null ? null : await request.arrayBuffer()
  })
}

function localRuntime(resourcePersistencePath?: string) {
  return new Miniflare({ resourcePersistencePath, workers: [{ config: {
    name: 'shared-games-test', compatibilityDate: '2026-10-23',
    manifest: { mainModule: 'index.js', modulesRoot: process.cwd(), modules: { 'index.js': { type: 'esm', contents: script } } },
    env: { SHARED_GAMES: { type: 'r2', name: 'local-shared-games-test' } }
  } }] })
}

beforeAll(async () => {
  runtime = localRuntime()
  await runtime.ready
}, 20000)
afterAll(async () => { await runtime?.dispose() })

describe('shared games using local R2 in workerd', () => {
  it('stores canonical content, reads immediately and gives stable 22-character IDs', async () => {
    expect(expectedId).toBe('gmlvKTOY_GNRWutf2yaZBw')
    const reordered = Object.fromEntries(Object.entries(game).reverse())
    for (const content of [game, reordered, game]) {
      const response = await dispatch(post(JSON.stringify(content)))
      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(await response.json()).toEqual({ id: expectedId })
    }
    const response = await runtime.dispatchFetch(`${origin}${SHARED_GAME_API_PATH}/${expectedId}`)
    expect(await response.text()).toBe(serializeSharedGameV1(game))
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    const bucket = await runtime.getR2Bucket('SHARED_GAMES')
    expect((await bucket.list()).objects.map((object) => object.key)).toContain(`games/v1/${expectedId}.json`)
    expect(await (await runtime.dispatchFetch(origin + '/api/health')).json()).toEqual({ status: 'ok', storage: 'r2', voice: { status: 'unavailable' } })
  })

  it('keeps an old snapshot unchanged when the content changes', async () => {
    expect((await dispatch(post())).status).toBe(200)
    const changed = { ...game, title: '新的案件' }
    const response = await dispatch(post(JSON.stringify(changed)))
    const result = await response.json() as { id: string }
    expect(result.id).not.toBe(expectedId)
    expect(await (await runtime.dispatchFetch(`${origin}${SHARED_GAME_API_PATH}/${expectedId}`)).json()).toEqual(game)
    expect(await (await runtime.dispatchFetch(`${origin}${SHARED_GAME_API_PATH}/${result.id}`)).json()).toEqual(changed)
  })

  it('persists R2 data across local runtime restarts without contacting cloud storage', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lie-share-r2-'))
    let persisted = localRuntime(directory)
    try {
      await persisted.ready
      const saved = await persisted.dispatchFetch(origin + SHARED_GAME_API_PATH, {
        method: 'POST', body: JSON.stringify(game), headers: { Origin: origin, 'Content-Type': 'application/json' }
      })
      expect(saved.status).toBe(200)
      await persisted.dispose()
      persisted = localRuntime(directory)
      await persisted.ready
      expect(await (await persisted.dispatchFetch(`${origin}${SHARED_GAME_API_PATH}/${expectedId}`)).json()).toEqual(game)
    } finally {
      await persisted.dispose()
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('accepts exactly 1 MiB of canonical UTF-8 content and rejects one extra byte', async () => {
    const padding = SHARED_GAME_BYTES_LIMIT - new TextEncoder().encode(serializeSharedGameV1(game)).byteLength
    const exact = { ...game, background: game.background + 'a'.repeat(padding) }
    expect(new TextEncoder().encode(serializeSharedGameV1(exact))).toHaveLength(SHARED_GAME_BYTES_LIMIT)
    expect((await dispatch(post(JSON.stringify(exact)))).status).toBe(200)
    const response = await dispatch(post(JSON.stringify({ ...exact, background: exact.background + 'a' })))
    expect(response.status).toBe(413)
    expect(await response.json()).toEqual({ error: 'content_too_large' })
  })

  it('rejects malformed content, unsupported media, cross-origin writes and invalid IDs', async () => {
    for (const [request, status, error] of [
      [post('{'), 400, 'invalid_content'],
      [post(JSON.stringify({ ...game, characters: [] })), 400, 'invalid_content'],
      [post(JSON.stringify({ ...game, characters: [{ ...game.characters[0], appearanceId: 'unknown' }] })), 400, 'invalid_content'],
      [post(new Uint8Array([255])), 400, 'invalid_content'],
      [post('{}', { Origin: 'https://other.example' }), 403, 'forbidden'],
      [post('{}', { 'Content-Type': 'text/plain' }), 415, 'unsupported_media_type'],
      [post('{}', { 'Content-Encoding': 'gzip' }), 415, 'unsupported_media_type'],
      [new Request(`${origin}${SHARED_GAME_API_PATH}/not-an-id`), 400, 'invalid_id'],
      [new Request(`${origin}${SHARED_GAME_API_PATH}/${'A'.repeat(22)}`), 404, 'not_found'],
      [new Request(`${origin}${SHARED_GAME_API_PATH}/${expectedId}`, { method: 'DELETE' }), 404, 'not_found']
    ] as const) {
      const response = await dispatch(request)
      expect(response.status).toBe(status)
      expect(await response.json()).toEqual({ error })
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
    }
  })
})

describe('bounded writes and storage failures', () => {
  it('also limits canonical output when normalization makes an accepted-size input larger', async () => {
    const omitted = { ...game, characters: game.characters.map(({ appearanceId, ...character }) => character) }
    const padding = SHARED_GAME_BYTES_LIMIT - new TextEncoder().encode(JSON.stringify(omitted)).byteLength
    const body = JSON.stringify({ ...omitted, background: omitted.background + 'a'.repeat(padding) })
    expect(new TextEncoder().encode(body)).toHaveLength(SHARED_GAME_BYTES_LIMIT)
    const bucket = { get: vi.fn(), put: vi.fn() }
    const response = await sharedGames(post(body), bucket)
    expect(response.status).toBe(413)
    expect(bucket.put).not.toHaveBeenCalled()
  })

  it('counts streamed bytes rather than trusting absent or false Content-Length', async () => {
    for (const headers of [{}, { 'Content-Length': '1' }] as Record<string, string>[]) {
      let cancelled = false
      const body = new ReadableStream({
        pull(controller) { controller.enqueue(new Uint8Array(256 * 1024)) },
        cancel() { cancelled = true }
      })
      const bucket = { get: vi.fn(), put: vi.fn() }
      const response = await sharedGames(post(body, headers), bucket)
      expect(response.status).toBe(413)
      expect(cancelled).toBe(true)
    }
  })

  it('rejects missing storage and never returns success after a failed put', async () => {
    expect((await sharedGames(post(), undefined)).status).toBe(503)
    const bucket = { get: vi.fn(), put: vi.fn().mockRejectedValueOnce(new Error('private platform details')) }
    const response = await sharedGames(post(), bucket)
    expect(response.status).toBe(503)
    expect(await response.text()).toBe('{"error":"storage_unavailable"}')
  })

  it('returns a safe unavailable error after an R2 read failure', async () => {
    const bucket = { get: vi.fn().mockRejectedValueOnce(new Error('private platform details')), put: vi.fn() }
    const response = await sharedGames(new Request(`${origin}${SHARED_GAME_API_PATH}/${expectedId}`), bucket)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'storage_unavailable' })
  })
})
