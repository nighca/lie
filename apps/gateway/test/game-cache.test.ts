import { fileURLToPath, URL as NodeURL } from 'node:url'

import { createServer } from 'vite'
import { afterAll, beforeAll, expect, it } from 'vitest'

let server: Awaited<ReturnType<typeof createServer>> | null = null
let origin = ''

beforeAll(async () => {
  server = await createServer({
    root: fileURLToPath(new NodeURL('../', import.meta.url)),
    configFile: fileURLToPath(new NodeURL('../vite.config.ts', import.meta.url)),
    publicDir: fileURLToPath(new NodeURL('./fixtures/', import.meta.url)),
    server: { host: '127.0.0.1', port: 0, strictPort: false },
    logLevel: 'silent'
  })
  await server.listen()
  origin = server.resolvedUrls!.local[0]
}, 30000)

afterAll(async () => { await server?.close() })

it('keeps Vite-served game JSON cache revalidation valid on every reload', async () => {
  const url = new URL('/games/test.json', origin)
  const initial = await fetch(url)
  expect(initial.status).toBe(200)
  expect(await initial.json()).toEqual({ id: 'test' })
  const etag = initial.headers.get('ETag')!
  expect(etag).toBeTruthy()
  for (let reload = 0; reload < 6; reload++) {
    const response = await fetch(url, { headers: { 'If-None-Match': etag } })
    expect(response.status).toBe(304)
    expect(await response.text()).toBe('')
  }
  expect((await fetch(new URL('/games/missing.json', origin))).status).toBe(404)
})


it('advertises the fixed local entry only from the development middleware, without setting a cookie', async () => {
  const response = await fetch(new URL('/api/voice/status', origin))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ status: 'unavailable' })
  expect(response.headers.get('X-Lie-Local-Test-Entry')).toBe('/__lie/dev-session')
  expect(response.headers.get('Set-Cookie')).toBeNull()
})
