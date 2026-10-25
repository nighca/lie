export const methods = Object.freeze([
  'Network.webSocketCreated',
  'Network.webSocketWillSendHandshakeRequest',
  'Network.webSocketHandshakeResponseReceived',
  'Network.webSocketFrameError',
  'Network.webSocketClosed',
  'Network.loadingFailed',
])

const netErrors = new Set([
  'ERR_ABORTED', 'ERR_ACCESS_DENIED', 'ERR_ADDRESS_UNREACHABLE',
  'ERR_BLOCKED_BY_CLIENT', 'ERR_BLOCKED_BY_RESPONSE', 'ERR_CERT_AUTHORITY_INVALID',
  'ERR_CERT_COMMON_NAME_INVALID', 'ERR_CERT_DATE_INVALID', 'ERR_CONNECTION_ABORTED',
  'ERR_CONNECTION_CLOSED', 'ERR_CONNECTION_FAILED', 'ERR_CONNECTION_REFUSED',
  'ERR_CONNECTION_RESET', 'ERR_CONNECTION_TIMED_OUT', 'ERR_FAILED',
  'ERR_INTERNET_DISCONNECTED', 'ERR_INVALID_RESPONSE', 'ERR_NAME_NOT_RESOLVED',
  'ERR_NETWORK_CHANGED', 'ERR_PROXY_CONNECTION_FAILED', 'ERR_SSL_PROTOCOL_ERROR',
  'ERR_TIMED_OUT', 'ERR_TUNNEL_CONNECTION_FAILED', 'ERR_WS_PROTOCOL_ERROR',
])
const blockedReasons = new Set([
  'other', 'csp', 'mixed-content', 'origin', 'inspector', 'subresource-filter',
  'content-type', 'coep-frame-resource-needs-coep-header', 'corp-not-same-origin',
  'corp-not-same-origin-after-defaulted-to-same-origin-by-coep', 'corp-not-same-site',
])
function httpStatus(value) {
  return Number.isInteger(value) && value >= 100 && value <= 599 ? value : null
}
function netError(value) {
  if (typeof value !== 'string') return null
  const token = /net::(ERR_[A-Z0-9_]+)/.exec(value)?.[1]
  return token == null ? null : netErrors.has(token) ? token : 'OTHER'
}
function frameFailure(value) {
  if (typeof value !== 'string' || value.length === 0) return { category: 'empty' }
  const code = netError(value)
  if (code != null) return { category: 'network', netError: code }
  const status = httpStatus(Number(/Unexpected response code:\s*(\d{3})/i.exec(value)?.[1]))
  if (status != null) return { category: 'http-rejection', status }
  if (/handshake.*timed? out/i.test(value)) return { category: 'handshake-timeout' }
  if (/handshake/i.test(value)) return { category: 'handshake-failed' }
  if (/closed before.*established/i.test(value)) return { category: 'closed-before-open' }
  return { category: 'other' }
}

// Feed only events observed in the authorized tab; this module performs no I/O.
export function createVoiceDiagnostics(origin = 'https://lie.agency') {
  const expectedOrigin = new URL(origin).origin
  const requests = new Map()
  const rows = []
  let firstTimestamp = null
  function accept(event) {
    if (!methods.includes(event?.method)) return null
    const params = event.params
    if (params == null || typeof params.requestId !== 'string') return null
    if (event.method === 'Network.webSocketCreated') {
      let url
      try { url = new URL(params.url) } catch { return null }
      if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password ||
        url.origin.replace(/^ws/, 'http') !== expectedOrigin || url.pathname !== '/api/voice') return null
      if (requests.has(params.requestId)) return null
      requests.set(params.requestId, requests.size + 1)
    }
    const connection = requests.get(params.requestId)
    if (connection == null) return null
    const timestamp = typeof params.timestamp === 'number' && Number.isFinite(params.timestamp) ? params.timestamp : null
    if (timestamp != null && firstTimestamp == null) firstTimestamp = timestamp
    const row = { connection, elapsedMs: timestamp == null ? null : Math.round((timestamp - firstTimestamp) * 1000) }
    switch (event.method) {
      case 'Network.webSocketCreated': row.kind = 'created'; break
      case 'Network.webSocketWillSendHandshakeRequest': row.kind = 'handshake-sent'; row.sent = true; break
      case 'Network.webSocketHandshakeResponseReceived': row.kind = 'handshake-response'; row.status = httpStatus(params.response?.status); break
      case 'Network.webSocketFrameError': row.kind = 'frame-error'; Object.assign(row, frameFailure(params.errorMessage)); break
      case 'Network.webSocketClosed': row.kind = 'closed'; break
      case 'Network.loadingFailed':
        row.kind = 'loading-failed'
        row.netError = netError(params.errorText)
        row.blockedReason = params.blockedReason == null ? null : blockedReasons.has(params.blockedReason) ? params.blockedReason : 'other'
        row.canceled = typeof params.canceled === 'boolean' ? params.canceled : null
        break
    }
    rows.push(row)
    return { ...row }
  }
  return { accept, snapshot: () => ({ connections: requests.size, events: rows.map(row => ({ ...row })) }) }
}

// Callbacks own their bounded waits and resource cleanup; there is no retry path.
export function createSingleVoiceAttempt(callbacks) {
  let used = false
  return async function run() {
    if (used) throw new Error('Voice attempt is single-use')
    used = true
    let stage = 'start'
    let cause = null
    let failure = null
    let cleanupFailed = false
    try {
      await callbacks.start()
      stage = 'ready'
      if (await callbacks.waitReady() !== true) {
        failure = { stage, kind: 'not-ready' }
      } else {
        stage = 'question'
        await callbacks.question()
        stage = 'answer'
        if (await callbacks.waitAnswer() !== true) failure = { stage, kind: 'incomplete' }
      }
    } catch (error) {
      cause = error
      failure = { stage, kind: 'exception' }
    } finally {
      try { await callbacks.cleanup() } catch (error) {
        cleanupFailed = true
        if (failure == null) { cause = error; failure = { stage: 'cleanup', kind: 'exception' } }
      }
    }
    const result = { status: failure == null ? 'complete' : 'failed', failure, cleanupFailed }
    // Preserve the first exception for the local caller without serializing it.
    Object.defineProperty(result, 'cause', { value: cause, enumerable: false })
    return result
  }
}
