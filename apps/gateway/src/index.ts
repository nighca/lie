import type { InferEnv } from 'cf/config'

import type config from '../cloudflare.config'

export type GatewayEnv = InferEnv<ReturnType<typeof config.worker>> & Partial<Record<
  'LINX_WS_TOKEN' | 'LINX_DEVICE_ID' | 'LINX_AGENT_ID', string
>>
const upstreamUrl = 'https://xrobo-io.qiniuapi.com/v1/ws/'

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return Response.json({ status: 'ok', storage: 'none' }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (url.pathname === '/api/voice/status' && request.method === 'GET') {
      if ((request.headers.get('Origin') != null && request.headers.get('Origin') !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site' || url.search !== '') return new Response('Forbidden', { status: 403 })
      return Response.json({ status: voiceStatus(env) }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (url.pathname === '/api/voice' && request.method === 'GET') return relayVoice(request, env)
    if (url.pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 })
    const response = await env.ASSETS.fetch(request)
    if (url.pathname.startsWith('/static/') || url.pathname.startsWith('/assets/')) {
      const contentAddressed = /^\/static\/[a-f0-9]{64}\//.test(url.pathname) || /^\/assets\/[^/]+-[A-Za-z0-9_-]+\.(?:js|css)$/.test(url.pathname)
      const metadata = response.status === 304 && !response.headers.has('Content-Type')
        ? await env.ASSETS.fetch(new Request(request.url, { method: 'HEAD' })) : response
      if (!contentAddressed || ![200, 206, 304].includes(response.status) || metadata.headers.get('Content-Type')?.includes('text/html') || metadata.status >= 400) {
        return new Response('Asset not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
      }
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    }
    if (url.pathname.startsWith('/games/') && response.status !== 304 && !response.headers.get('Content-Type')?.includes('application/json')) {
      return Response.json({ error: 'Game not found' }, { status: 404 })
    }
    return response
  }
} satisfies ExportedHandler<GatewayEnv>

// Application access checks are temporarily disabled by user decision; provider credentials remain required.
function voiceStatus(env: GatewayEnv): 'unavailable' | 'ready' {
  return env.LINX_WS_TOKEN && env.LINX_DEVICE_ID && env.LINX_AGENT_ID ? 'ready' : 'unavailable'
}

async function relayVoice(request: Request, env: GatewayEnv): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 })
  if (request.headers.get('Origin') !== new URL(request.url).origin || new URL(request.url).search !== '') {
    return new Response('Forbidden', { status: 403 })
  }
  const status = voiceStatus(env)
  if (status === 'unavailable') return new Response('Voice unavailable', { status: 503 })
  const sessionLimitSeconds = voiceSessionLimitSeconds(env.VOICE_MAX_SESSION_SECONDS)
  if (sessionLimitSeconds == null) return new Response('Invalid voice session limit configuration', { status: 500 })
  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    response = await fetch(upstreamUrl, {
      headers: {
        Upgrade: 'websocket', Authorization: `Bearer ${env.LINX_WS_TOKEN}`,
        'Device-Id': env.LINX_DEVICE_ID!, 'Client-Id': crypto.randomUUID(),
        'Protocol-Version': '1', 'X-Agent-ID': env.LINX_AGENT_ID!
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
  relaySockets(server, upstream, sessionLimitSeconds)
  return new Response(null, { status: 101, webSocket: client })
}

function voiceSessionLimitSeconds(value = '600'): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null
  const seconds = Number(value)
  return Number.isSafeInteger(seconds) && seconds <= Math.floor(0x7fffffff / 1000) ? seconds : null
}

/** Owns both accepted sockets for one bounded conversation; no shared connection state. */
export function relaySockets(browser: WebSocket, upstream: WebSocket, sessionLimitSeconds = 600) {
  let closed = false
  const timer = setTimeout(() => finish(1000, 'Conversation time limit'), sessionLimitSeconds * 1000)
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
