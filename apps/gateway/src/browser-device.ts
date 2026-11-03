import type { GatewayEnv } from './index'

const lifetimeSeconds = 180 * 24 * 60 * 60
const encoder = new TextEncoder()
const managementOrigin = 'https://xrobo.qiniu.com'
const otaUrl = 'https://xrobo.qiniuapi.com/v1/ota/'

export interface BrowserDevice {
  v: 1
  environment: string
  deviceId: string
  clientId: string
  issuedAt: number
  expiresAt: number
}

export class VoiceDeviceError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code) }
}

function loopback(request: Request) {
  const url = new URL(request.url)
  return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
}
function cookieName(request: Request) { return loopback(request) ? 'lie-device-dev' : '__Host-lie-device' }
function environment(request: Request, env: GatewayEnv) {
  return `${env.VOICE_DEVICE_ENVIRONMENT}:${loopback(request) ? 'development' : 'https'}`
}
export function voiceTransport(env: GatewayEnv): 'direct' | 'relay' | null {
  return env.VOICE_TRANSPORT === 'direct' || env.VOICE_TRANSPORT === 'relay' ? env.VOICE_TRANSPORT : null
}
export function voiceSessionLimitSeconds(value = '600'): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null
  const seconds = Number(value)
  return Number.isSafeInteger(seconds) && seconds <= Math.floor(0x7fffffff / 1000) ? seconds : null
}
export function voiceConfigured(env: GatewayEnv) {
  const transport = voiceTransport(env)
  return transport != null && voiceSessionLimitSeconds(env.VOICE_MAX_SESSION_SECONDS) != null && Boolean(
    env.LINX_API_KEY && env.LINX_AGENT_ID && env.VOICE_DEVICE_COOKIE_SECRET &&
    encoder.encode(env.VOICE_DEVICE_COOKIE_SECRET).byteLength >= 32 && env.VOICE_DEVICE_ENVIRONMENT &&
    (transport === 'direct' || env.LINX_WS_TOKEN))
}
function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
function decode(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding')
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')), character => character.charCodeAt(0))
}
async function signingKey(env: GatewayEnv) {
  return crypto.subtle.importKey('raw', encoder.encode(env.VOICE_DEVICE_COOKIE_SECRET!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
export async function readBrowserDevice(request: Request, env: GatewayEnv, now = Date.now()): Promise<BrowserDevice | null> {
  const cookies = (request.headers.get('Cookie') ?? '').split(';').map(value => value.trim()).filter(value => value.startsWith(`${cookieName(request)}=`))
  if (cookies.length !== 1) return null
  const value = cookies[0].slice(cookieName(request).length + 1)
  if (value.length > 1024) return null
  const [payload, signature, extra] = value.split('.')
  if (!payload || !signature || extra != null) return null
  try {
    if (!await crypto.subtle.verify('HMAC', await signingKey(env), decode(signature), encoder.encode(payload))) return null
    const device = JSON.parse(new TextDecoder().decode(decode(payload))) as Partial<BrowserDevice>
    if (device.v !== 1 || device.environment !== environment(request, env) ||
      typeof device.deviceId !== 'string' || !/^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/.test(device.deviceId) ||
      typeof device.clientId !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(device.clientId) ||
      !Number.isSafeInteger(device.issuedAt) || !Number.isSafeInteger(device.expiresAt) ||
      device.issuedAt! > Math.floor(now / 1000) || device.expiresAt! <= Math.floor(now / 1000)) return null
    return device as BrowserDevice
  } catch { return null }
}
export function newBrowserDevice(request: Request, env: GatewayEnv, now = Date.now()): BrowserDevice {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  bytes[0] = (bytes[0] & 0xfc) | 0x02
  const issuedAt = Math.floor(now / 1000)
  return { v: 1, environment: environment(request, env), deviceId: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(':'), clientId: crypto.randomUUID(), issuedAt, expiresAt: issuedAt + lifetimeSeconds }
}
export async function browserDeviceCookie(request: Request, env: GatewayEnv, device: BrowserDevice, now = Date.now()) {
  const renewed = { ...device, expiresAt: Math.floor(now / 1000) + lifetimeSeconds }
  const payload = encode(encoder.encode(JSON.stringify(renewed)))
  const signature = encode(new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(env), encoder.encode(payload))))
  return `${cookieName(request)}=${payload}.${signature}; Max-Age=${lifetimeSeconds}; Path=/; HttpOnly; SameSite=Lax${loopback(request) ? '' : '; Secure'}`
}

function record(value: unknown): value is Record<string, unknown> { return value != null && typeof value === 'object' && !Array.isArray(value) }

/** One request's bounded provider work; never shares tokens or request state between visitors. */
export function deviceProvider(env: GatewayEnv, device: BrowserDevice, signal: AbortSignal) {
  async function json(url: string, init: RequestInit = {}, management = false, maximumBytes = 65536): Promise<Record<string, unknown>> {
    const operationSignal = AbortSignal.any([signal, AbortSignal.timeout(8000)])
    let response: Response
    try {
      response = await fetch(url, { ...init, redirect: 'manual', signal: operationSignal })
    } catch { throw new VoiceDeviceError(operationSignal.aborted ? 504 : 502, 'provider-unavailable') }
    let value: unknown
    const reader = response.body?.getReader()
    if (reader == null) throw new VoiceDeviceError(502, 'provider-response')
    const cancel = () => { void reader.cancel().catch(() => {}) }
    operationSignal.addEventListener('abort', cancel, { once: true })
    try {
      const chunks: Uint8Array[] = []
      let length = 0
      while (true) {
        if (operationSignal.aborted) throw new VoiceDeviceError(504, 'provider-unavailable')
        const next = await reader.read()
        if (operationSignal.aborted) throw new VoiceDeviceError(504, 'provider-unavailable')
        if (next.done) break
        length += next.value.byteLength
        if (length > maximumBytes) { cancel(); throw new VoiceDeviceError(502, 'provider-response-size') }
        chunks.push(next.value)
      }
      const bytes = new Uint8Array(length)
      let offset = 0
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
      value = JSON.parse(new TextDecoder().decode(bytes))
    } catch (error) {
      if (operationSignal.aborted) throw new VoiceDeviceError(504, 'provider-unavailable')
      throw error instanceof VoiceDeviceError ? error : new VoiceDeviceError(502, 'provider-response')
    } finally { operationSignal.removeEventListener('abort', cancel); reader.releaseLock() }
    if (!record(value)) throw new VoiceDeviceError(502, 'provider-response')
    if (!response.ok || (management && value.code !== 0)) {
      const conflict = response.status === 400 || response.status === 409 || value.code === 400 || value.code === 409
      throw new VoiceDeviceError(conflict ? 409 : 502, conflict ? 'binding-conflict' : 'provider-rejected')
    }
    if ('error' in value) throw new VoiceDeviceError(502, 'provider-rejected')
    return value
  }
  async function ota() {
    const value = await json(otaUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Activation-Version': '1', 'Device-Id': device.deviceId, 'Client-Id': device.clientId, 'User-Agent': 'lie-browser/1' },
      body: JSON.stringify({ mac_address: device.deviceId, uuid: device.clientId, application: { version: '1', elf_sha256: '0'.repeat(64) }, board: { type: 'lie-browser', ssid: 'web', rssi: 0 } })
    })
    const websocket = record(value.websocket) ? value.websocket : null
    const activation = record(value.activation) ? value.activation : null
    const token = typeof websocket?.token === 'string' && websocket.token.length > 0 ? websocket.token : null
    const code = typeof activation?.code === 'string' && /^[0-9]{6}$/.test(activation.code) ? activation.code : null
    if (token == null && code == null) throw new VoiceDeviceError(502, 'provider-response')
    return { token, code }
  }
  async function belongsToAgent() {
    const value = await json(`${managementOrigin}/xiaozhi/device/bind/${encodeURIComponent(env.LINX_AGENT_ID!)}`, { headers: { Authorization: `Bearer ${env.LINX_API_KEY}` } }, true, 1048576)
    return Array.isArray(value.data) && value.data.some(value => record(value) &&
      [value.macAddress, value.id].some(mac => typeof mac === 'string' && mac.toLowerCase() === device.deviceId) && value.agentId === env.LINX_AGENT_ID)
  }
  return {
    async prepare(): Promise<string> {
      const first = await ota()
      if (first.token != null) {
        if (!await belongsToAgent()) throw new VoiceDeviceError(502, 'device-ownership')
        return first.token
      }
      let bindError: VoiceDeviceError | null = null
      try {
        await json(`${managementOrigin}/xiaozhi/device/bind/${encodeURIComponent(env.LINX_AGENT_ID!)}/${first.code}`, {
          method: 'POST', headers: { Authorization: `Bearer ${env.LINX_API_KEY}`, 'Content-Type': 'application/json' }
        }, true)
      } catch (error) {
        if (!(error instanceof VoiceDeviceError) || signal.aborted) throw error
        if (error.status !== 409 && error.code !== 'provider-unavailable' && error.code !== 'provider-response') throw error
        bindError = error
      }
      const confirmed = await ota()
      if (confirmed.token == null || (bindError != null && !await belongsToAgent())) throw bindError ?? new VoiceDeviceError(502, 'device-not-prepared')
      return confirmed.token
    },
    async token() {
      const result = await ota()
      if (result.token == null) throw new VoiceDeviceError(503, 'device-not-prepared')
      return result.token
    }
  }
}
