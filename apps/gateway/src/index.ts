import type { InferEnv } from 'cf/config'

import type config from '../cloudflare.config'

export type GatewayEnv = InferEnv<ReturnType<typeof config.worker>> & Partial<Record<
  'LINX_WS_TOKEN' | 'LINX_DEVICE_ID' | 'LINX_AGENT_ID' | 'VOICE_ACCESS_TOKEN', string
>>
const upstreamUrl = 'https://xrobo-io.qiniuapi.com/v1/ws/'
const accessCookieName = 'lie_voice_access'

async function tokenMatches(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected))
  ])
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash)
}

function readCookie(request: Request): string {
  const cookie = request.headers.get('Cookie')?.split(';').find((value) => value.trim().startsWith(`${accessCookieName}=`))
  return cookie?.trim().slice(accessCookieName.length + 1) ?? ''
}

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return Response.json({ status: 'ok', storage: 'none' }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (url.pathname === '/api/voice' && request.method === 'GET') return relayVoice(request, env)
    if (url.pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 })
    const response = await env.ASSETS.fetch(request)
    if (url.pathname.startsWith('/games/') && !response.headers.get('Content-Type')?.includes('application/json')) {
      return Response.json({ error: 'Game not found' }, { status: 404 })
    }
    return response
  }
} satisfies ExportedHandler<GatewayEnv>

async function relayVoice(request: Request, env: GatewayEnv): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 })
  if (request.headers.get('Origin') !== new URL(request.url).origin || new URL(request.url).search !== '') {
    return new Response('Forbidden', { status: 403 })
  }
  if (!env.VOICE_ACCESS_TOKEN || !env.LINX_WS_TOKEN || !env.LINX_DEVICE_ID || !env.LINX_AGENT_ID) {
    return new Response('Voice unavailable', { status: 503 })
  }
  if (!await tokenMatches(readCookie(request), env.VOICE_ACCESS_TOKEN)) return new Response('Forbidden', { status: 403 })
  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    response = await fetch(upstreamUrl, {
      headers: {
        Upgrade: 'websocket', Authorization: `Bearer ${env.LINX_WS_TOKEN}`,
        'Device-Id': env.LINX_DEVICE_ID, 'Client-Id': crypto.randomUUID(),
        'Protocol-Version': '1', 'X-Agent-ID': env.LINX_AGENT_ID
      },
      signal: controller.signal
    })
  } catch {
    console.error(JSON.stringify({ event: 'voice_upstream_unavailable' }))
    return new Response('Voice upstream unavailable', { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
  const upstream = response.webSocket
  if (upstream == null) {
    console.error(JSON.stringify({ event: 'voice_upstream_rejected', status: response.status }))
    return new Response('Voice upstream unavailable', { status: 502 })
  }
  const [client, server] = Object.values(new WebSocketPair())
  relaySockets(server, upstream)
  return new Response(null, { status: 101, webSocket: client })
}

/** Owns both accepted sockets for one bounded conversation; no shared connection state. */
export function relaySockets(browser: WebSocket, upstream: WebSocket) {
  let closed = false
  const timer = setTimeout(() => finish(1000, 'Conversation time limit'), 180000)
  function finish(code: number, reason: string) {
    if (closed) return
    closed = true
    clearTimeout(timer)
    for (const socket of [browser, upstream]) {
      try { socket.close(code, reason) } catch { /* A peer may already be closed. */ }
    }
  }
  for (const [source, destination] of [[browser, upstream], [upstream, browser]]) {
    source.binaryType = 'arraybuffer'
    source.addEventListener('message', (event) => {
      if (closed) return
      const size = typeof event.data === 'string' ? new TextEncoder().encode(event.data).byteLength : event.data.byteLength
      if (size > 65536) { finish(1009, 'Frame too large'); return }
      try { destination.send(event.data) } catch { finish(1011, 'Voice relay failed') }
    })
    source.addEventListener('close', (event) => {
      const code = event.code === 1005 ? 1000 : event.code === 1006 ? 1011 : event.code
      finish(code, event.reason)
    })
    source.addEventListener('error', () => finish(1011, 'Voice relay failed'))
  }
  browser.accept()
  upstream.accept()
}
