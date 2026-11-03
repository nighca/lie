import type { InferEnv } from 'cf/config'

import type config from '../cloudflare.config'
import { sharedGames } from './shared-games'
import { browserDeviceCookie, deviceProvider, newBrowserDevice, readBrowserDevice, voiceConfigured, voiceSessionLimitSeconds, voiceTransport, VoiceDeviceError } from './browser-device'

type ConfiguredEnv = InferEnv<ReturnType<typeof config.worker>>
export type GatewayEnv = Omit<ConfiguredEnv, 'SHARED_GAMES' | 'LINX_API_KEY' | 'LINX_WS_TOKEN' | 'VOICE_DEVICE_COOKIE_SECRET' | 'LINX_AGENT_ID'> & Partial<Pick<ConfiguredEnv, 'SHARED_GAMES'>> & Partial<Record<
  'LINX_API_KEY' | 'LINX_WS_TOKEN' | 'VOICE_DEVICE_COOKIE_SECRET' | 'LINX_AGENT_ID', string
>>
const upstreamUrl = 'https://xrobo-io.qiniuapi.com/v1/ws/'

export default {
  async fetch(request: Request, env: GatewayEnv): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return Response.json({ status: 'ok', storage: env.SHARED_GAMES == null ? 'none' : 'r2' }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (url.pathname === '/api/voice/status' && request.method === 'GET') {
      if ((request.headers.get('Origin') != null && request.headers.get('Origin') !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site' || url.search !== '') return new Response('Forbidden', { status: 403 })
      const headers = new Headers({ 'Cache-Control': 'no-store' })
      if (voiceConfigured(env)) {
        const device = await readBrowserDevice(request, env) ?? newBrowserDevice(request, env)
        headers.set('Set-Cookie', await browserDeviceCookie(request, env, device))
      }
      const status = voiceStatus(env)
      return Response.json(status === 'ready' ? { status, transport: voiceTransport(env) } : { status }, { headers })
    }
    if (url.pathname === '/api/voice/prepare' && request.method === 'POST') return prepareVoice(request, env)
    if (url.pathname === '/api/voice' && request.method === 'GET' && voiceTransport(env) === 'relay') return relayVoice(request, env)
    if (url.pathname === '/api/shared-games/v1' || url.pathname.startsWith('/api/shared-games/v1/')) return sharedGames(request, env.SHARED_GAMES)
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
  return voiceConfigured(env) ? 'ready' : 'unavailable'
}

async function emptyRequestBody(request: Request) {
  if (request.body == null) return true
  const reader = request.body.getReader()
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(1000)])
  const cancel = () => { void reader.cancel().catch(() => {}) }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    while (!signal.aborted) {
      const next = await reader.read()
      if (signal.aborted) return false
      if (next.done) return true
      if (next.value.byteLength > 0) { cancel(); return false }
    }
    return false
  } catch { return false }
  finally { signal.removeEventListener('abort', cancel); reader.releaseLock() }
}

async function prepareVoice(request: Request, env: GatewayEnv): Promise<Response> {
  const url = new URL(request.url)
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  if (request.headers.get('Origin') !== url.origin || url.search !== '' || request.headers.get('Sec-Fetch-Site') === 'cross-site') return Response.json({ error: 'forbidden' }, { status: 403, headers })
  if (!await emptyRequestBody(request)) return Response.json({ error: 'invalid-request' }, { status: 400, headers })
  if (!voiceConfigured(env)) return Response.json({ error: 'unavailable' }, { status: 503, headers })
  const device = await readBrowserDevice(request, env)
  if (device == null) return Response.json({ error: 'identity-required' }, { status: 409, headers })
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(18000)])
  try {
    const token = await deviceProvider(env, device, signal).prepare()
    if (signal.aborted) return Response.json({ error: 'prepare-timeout' }, { status: 504, headers })
    if (voiceTransport(env) === 'relay') return new Response(null, { status: 204, headers })
    return Response.json({
      url: 'wss://xrobo-io.qiniuapi.com/v1/ws/', deviceId: device.deviceId, clientId: device.clientId,
      token, maxSessionSeconds: voiceSessionLimitSeconds(env.VOICE_MAX_SESSION_SECONDS)
    }, { headers })
  } catch (error) {
    const status = signal.aborted ? 504 : error instanceof VoiceDeviceError ? error.status === 409 ? 502 : error.status : 502
    return Response.json({ error: status === 504 ? 'prepare-timeout' : 'provider-unavailable' }, { status, headers })
  }
}

async function relayVoice(request: Request, env: GatewayEnv): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket required', { status: 426 })
  if (request.headers.get('Origin') !== new URL(request.url).origin || new URL(request.url).search !== '') {
    return new Response('Forbidden', { status: 403 })
  }
  const sessionLimitSeconds = voiceSessionLimitSeconds(env.VOICE_MAX_SESSION_SECONDS)
  if (sessionLimitSeconds == null) return new Response('Invalid voice session limit configuration', { status: 500 })
  const status = voiceStatus(env)
  if (status === 'unavailable') return new Response('Voice unavailable', { status: 503 })
  const device = await readBrowserDevice(request, env)
  if (device == null) return new Response('Voice identity required', { status: 409 })
  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 9000)
  const signal = AbortSignal.any([controller.signal, request.signal])
  try {
    const connect = (token: string) => fetch(upstreamUrl, {
      headers: {
        Upgrade: 'websocket', Authorization: `Bearer ${token}`,
        'Device-Id': device.deviceId, 'Client-Id': device.clientId,
        'Protocol-Version': '1', 'X-Agent-ID': env.LINX_AGENT_ID!
      },
      redirect: 'manual', signal
    })
    response = await connect(env.LINX_WS_TOKEN!)
    if (response.status === 401 && response.webSocket == null) {
      void response.body?.cancel().catch(() => {})
      if (!signal.aborted) response = await connect(await deviceProvider(env, device, signal).token())
    }
  } catch (error) {
    console.error(JSON.stringify({ event: 'voice_upstream_unavailable' }))
    return new Response('Voice upstream unavailable', { status: signal.aborted ? 504 : error instanceof VoiceDeviceError ? error.status : 502 })
  } finally {
    clearTimeout(timeout)
  }
  const upstream = response.webSocket
  if (signal.aborted) {
    if (upstream != null) { try { upstream.accept(); upstream.close(1000, 'Connection cancelled') } catch { /* A peer may already be closed. */ } }
    return new Response('Voice upstream unavailable', { status: 504 })
  }
  if (upstream == null) {
    console.error(JSON.stringify({ event: 'voice_upstream_rejected', status: response.status }))
    return new Response('Voice upstream unavailable', { status: 502 })
  }
  const [client, server] = Object.values(new WebSocketPair())
  relaySockets(server, upstream, sessionLimitSeconds)
  return new Response(null, { status: 101, webSocket: client })
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
