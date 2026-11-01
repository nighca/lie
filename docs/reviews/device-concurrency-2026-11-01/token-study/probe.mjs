import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

class ProbeError extends Error {}
const approvalPhrase = 'dedicated-token-share-turn-approved'
const wsEndpoint = 'wss://xrobo-io.qiniuapi.com/v1/ws/'
const owner = 'lie-p0-token-share-2026-11-01'

export function tokenProjection(token) {
  const result = { format: 'opaque', signatureVerified: false, iat: null, exp: null, declaredLifetimeSeconds: null }
  if (typeof token !== 'string' || token.length > 16384 || token.split('.').length !== 3) return result
  let claims
  try { claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) } catch { return result }
  if (claims == null || typeof claims !== 'object' || Array.isArray(claims)) return result
  result.format = 'jwt-like'
  for (const name of ['iat', 'exp']) if (Number.isSafeInteger(claims[name]) && claims[name] > 0) result[name] = claims[name]
  if (result.iat != null && result.exp != null && result.exp >= result.iat) result.declaredLifetimeSeconds = result.exp - result.iat
  return result
}

export function otaTargetProjection(value) {
  try {
    const url = new URL(value)
    return { scheme: url.protocol === 'ws:' ? 'ws' : url.protocol === 'wss:' ? 'wss' : 'other', officialHost: url.hostname === 'xrobo-io.qiniuapi.com',
      officialPath: url.pathname === '/v1/ws/', hasQuery: url.search !== '', hasUserInfo: Boolean(url.username || url.password), hasNonDefaultPort: url.port !== '' }
  } catch { return { scheme: 'invalid', officialHost: false, officialPath: false, hasQuery: false, hasUserInfo: false, hasNonDefaultPort: false } }
}

// Importing this module never reads credentials or starts network traffic.
export async function runApproved({ approval, keyPath, privateDir, resultPath, WebSocket,
  request = globalThis.fetch, readKey = async path => (await readFile(path, 'utf8')).trim(), waitMs = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  if (approval !== approvalPhrase) throw new ProbeError('Missing specific dedicated-resource execution turn')
  if (!keyPath || !privateDir || !resultPath || !WebSocket) throw new ProbeError('Missing explicit execution inputs')
  await mkdir(privateDir, { mode: 0o700 })
  const statePath = resolve(privateDir, 'state.json')
  const state = { owner, agentName: `LIE-P0-token-share-${Date.now()}-${randomBytes(3).toString('hex')}`,
    agentId: null, createAttempted: false, devices: [], cleanupComplete: false }
  await writeFile(statePath, JSON.stringify(state), { flag: 'wx', mode: 0o600 })
  const save = async () => {
    const temp = resolve(privateDir, `.state-${randomUUID()}.json`)
    await writeFile(temp, JSON.stringify(state), { flag: 'wx', mode: 0o600 })
    await rename(temp, statePath)
  }
  const begin = Date.now()
  const elapsed = () => Date.now() - begin
  const experiment = new AbortController()
  const cleanup = new AbortController()
  const report = { owner, startedAt: new Date().toISOString(), operations: [], channels: [], inputAudioBytes: 0,
    listenMessages: 0, crossDeviceAccepted: false, concurrentSameToken: false, distinctSessions: false, completed: false, cleanup: {} }
  let key = null, token = null, cleanupMode = false, firstFailure = null, wsTimer = null
  const sockets = []
  const stop = reason => { firstFailure ??= reason; experiment.abort() }
  const check = () => { if (experiment.signal.aborted) throw new ProbeError(firstFailure ?? 'Experiment deadline') }
  const hardTimer = setTimeout(() => stop('Experiment deadline'), 180000)
  const interruptibleWait = async ms => {
    await Promise.race([waitMs(ms), new Promise(resolve => {
      if (experiment.signal.aborted) resolve()
      else experiment.signal.addEventListener('abort', resolve, { once: true })
    })])
    check()
  }
  async function http(operation, url, options, requireCode = true) {
    if (!cleanupMode) check()
    const row = { operation, startedAtMs: elapsed(), durationMs: null, status: null, code: null, success: false }
    report.operations.push(row)
    try {
      const response = await request(url, { ...options, redirect: 'error', signal: AbortSignal.any([
        cleanupMode ? cleanup.signal : experiment.signal, AbortSignal.timeout(15000)
      ]) })
      row.status = response.status
      const body = await response.json()
      row.code = typeof body?.code === 'number' ? body.code : null
      if (!response.ok || (requireCode && body?.code !== 0) || (!requireCode && (body?.error || (body?.code != null && body.code !== 0)))) {
        throw new ProbeError('Rejected operation')
      }
      row.success = true
      return body
    } catch { throw new ProbeError(`Operation failed: ${operation}`) }
    finally { row.durationMs = elapsed() - row.startedAtMs }
  }
  const api = (operation, path, method = 'GET', body = null) => http(operation, `https://xrobo.qiniu.com${path}`, {
    method, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body == null ? {} : { body: JSON.stringify(body) })
  })
  async function ota(device, stage) {
    device.otaAttempted = true
    await save()
    return http(`${device.label}-${stage}`, 'https://xrobo.qiniuapi.com/v1/ota/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Activation-Version': '1', 'Device-Id': device.mac,
        'Client-Id': device.client, 'User-Agent': 'lie-p0-token-share/1' },
      body: JSON.stringify({ mac_address: device.mac, uuid: device.client, application: { version: '0.1.0', elf_sha256: '0'.repeat(64) },
        board: { type: 'lie-token-share-test', ssid: 'test', rssi: 0 } })
    }, false)
  }
  async function allocate(label) {
    const device = { label, mac: `02:${randomBytes(5).toString('hex').match(/../g).join(':')}`, client: randomUUID(),
      otaAttempted: false, bindAttempted: false, bound: false, uncertain: true }
    state.devices.push(device)
    await save()
    const initial = await ota(device, 'initial-ota')
    if (initial.websocket?.token) throw new ProbeError('Unexpected already-bound generated identity')
    if (typeof initial.activation?.code !== 'string' || !/^\d{6}$/.test(initial.activation.code)) throw new ProbeError('Missing activation code')
    device.bindAttempted = true
    await save()
    await api(`${label}-bind`, `/xiaozhi/device/bind/${state.agentId}/${initial.activation.code}`, 'POST')
    device.bound = true; device.uncertain = false
    await save()
    return device
  }
  function open(label, device) {
    check()
    const row = { label, device: device.label, token: 'T1', startedAtMs: elapsed(), openedAtMs: null, helloAtMs: null,
      callerClose: false, closeObserved: false, closeAtMs: null, closeCode: null, terminated: false, readyState: null,
      receivedAudioBytes: 0, receivedTtsMessages: 0, unexpectedUpgradeStatus: null }
    report.channels.push(row)
    const ws = new WebSocket(wsEndpoint, { handshakeTimeout: 10000, headers: { Authorization: `Bearer ${token}`,
      'Device-Id': device.mac, 'Client-Id': device.client, 'Protocol-Version': '1', 'X-Agent-ID': state.agentId } })
    let session = null, readyDone = false, resolveReady, resolveClosed
    const ready = new Promise(resolve => { resolveReady = resolve })
    const closed = new Promise(resolve => { resolveClosed = resolve })
    const fail = reason => { if (!row.callerClose) stop(reason); resolveReady(false) }
    const timer = setTimeout(() => { if (!readyDone) fail(`Hello timeout: ${label}`) }, 10000)
    const abort = () => resolveReady(false)
    experiment.signal.addEventListener('abort', abort, { once: true })
    ws.on('error', () => fail(`WebSocket failed: ${label}`))
    ws.on('unexpected-response', (_req, response) => {
      row.unexpectedUpgradeStatus = response.statusCode ?? null
      response.resume()
      fail(`WebSocket rejected: ${label}`)
    })
    ws.on('close', code => {
      row.closeObserved = true; row.closeCode = code; row.closeAtMs = elapsed(); row.readyState = ws.readyState
      resolveClosed()
      if (!row.callerClose) fail(`Unexpected close: ${label}`)
    })
    ws.on('open', () => {
      row.openedAtMs = elapsed()
      if (experiment.signal.aborted) return
      try {
        ws.send(JSON.stringify({ type: 'hello', version: 1, transport: 'websocket', audio_params: { format: 'pcm', sample_rate: 16000,
          channels: 1, bit_depth: 16, endianness: 'little', frame_duration: 20, frame_size: 320, sample_format: 'signed_int16' } }))
      } catch { fail(`Hello send failed: ${label}`) }
    })
    ws.on('message', (bytes, binary) => {
      if (experiment.signal.aborted) return
      if (binary) { row.receivedAudioBytes += bytes.length; fail(`Unexpected audio: ${label}`); return }
      let message
      try { message = JSON.parse(bytes.toString()) } catch { fail(`Invalid protocol JSON: ${label}`); return }
      if (message?.type === 'tts') { row.receivedTtsMessages++; fail(`Unexpected TTS: ${label}`); return }
      if (message?.type !== 'hello') return
      if (readyDone || typeof message.session_id !== 'string' || !message.session_id || message.audio_params?.format !== 'pcm' ||
        message.audio_params?.sample_rate !== 16000 || message.audio_params?.channels !== 1) { fail(`Invalid hello: ${label}`); return }
      session = message.session_id; row.helloAtMs = elapsed(); readyDone = true; clearTimeout(timer); resolveReady(true)
    })
    const channel = { ws, row, session: () => session,
      async waitReady() { const ok = await ready; check(); if (!ok) throw new ProbeError('Hello failed') },
      async close() {
        clearTimeout(timer)
        experiment.signal.removeEventListener('abort', abort)
        if (ws.readyState !== WebSocket.CLOSED) {
          row.callerClose = true
          try { ws.close(1000, 'Owned token test complete') } catch { /* Fall back below. */ }
          await Promise.race([closed, waitMs(3000)])
          if (ws.readyState !== WebSocket.CLOSED) {
            row.terminated = true; ws.terminate()
            await Promise.race([closed, waitMs(500)])
          }
        }
        row.readyState = ws.readyState
      }
    }
    sockets.push(channel)
    return channel
  }
  try {
    key = await readKey(keyPath)
    if (typeof key !== 'string' || !key.trim()) throw new ProbeError('Empty approved management key')
    state.createAttempted = true
    await save()
    const created = await api('create-agent', '/xiaozhi/agent', 'POST', { agentName: state.agentName, assistantName: '测试助手',
      memModelId: 'Memory_nomem', intentModelId: 'Intent_function_call', systemPrompt: '这是无问答连接验证。不要主动问候或说话。' })
    if (typeof created.data !== 'string' || !created.data) throw new ProbeError('Uncertain Agent creation response')
    state.agentId = created.data
    await save()
    await api('configure-agent', `/xiaozhi/agent/${state.agentId}`, 'PUT', { chatHistoryConf: 0, memModelId: 'Memory_nomem',
      extra: { disable_greeting: true, llm: { max_tokens: 160, enable_search: false } } })
    const detail = await api('read-agent', `/xiaozhi/agent/${state.agentId}`)
    let extra = detail.data?.extra
    if (typeof extra === 'string') { try { extra = JSON.parse(extra) } catch { throw new ProbeError('Invalid config readback') } }
    report.config = { memModelId: detail.data?.memModelId === 'Memory_nomem' ? 'Memory_nomem' : null,
      chatHistoryConf: detail.data?.chatHistoryConf === 0 ? 0 : null, disable_greeting: extra?.disable_greeting === true,
      max_tokens: extra?.llm?.max_tokens === 160 ? 160 : null, enable_search: extra?.llm?.enable_search === false ? false : null }
    if (Object.values(report.config).includes(null) || !report.config.disable_greeting) throw new ProbeError('Agent config mismatch')
    const d1 = await allocate('D1')
    const credentials = await ota(d1, 'token-ota')
    if (typeof credentials.websocket?.token !== 'string' || !credentials.websocket.token) throw new ProbeError('Missing T1')
    report.otaTarget = otaTargetProjection(credentials.websocket.url)
    if (report.otaTarget == null || !['ws', 'wss'].includes(report.otaTarget.scheme) || !report.otaTarget.officialHost ||
      !report.otaTarget.officialPath || report.otaTarget.hasQuery || report.otaTarget.hasUserInfo || report.otaTarget.hasNonDefaultPort) throw new ProbeError('Unexpected OTA target')
    token = credentials.websocket.token
    report.token = tokenProjection(token)
    const d2 = await allocate('D2')
    wsTimer = setTimeout(() => stop('WebSocket experiment deadline'), 30000)
    const a = open('D1-T1', d1)
    await a.waitReady()
    await interruptibleWait(3000)
    const b = open('D2-T1', d2)
    await b.waitReady()
    report.crossDeviceAccepted = true
    await interruptibleWait(5000)
    report.concurrentSameToken = sockets.every(c => c.ws.readyState === WebSocket.OPEN && !c.row.closeObserved)
    report.distinctSessions = a.session() != null && b.session() != null && a.session() !== b.session()
    report.completed = report.crossDeviceAccepted && report.concurrentSameToken && report.distinctSessions
    if (!report.completed) throw new ProbeError('Concurrent shared-token assertion failed')
  } catch (error) { report.error = firstFailure ?? (error instanceof ProbeError ? error.message : 'Unexpected internal failure') }
  finally {
    clearTimeout(hardTimer); clearTimeout(wsTimer)
    experiment.abort(); cleanupMode = true
    report.cleanup.startedAt = new Date().toISOString()
    const cleanupTimer = setTimeout(() => cleanup.abort(), 60000)
    try {
      await Promise.all(sockets.map(c => c.close()))
      report.cleanup.allSocketsClosed = sockets.every(c => c.ws.readyState === WebSocket.CLOSED && c.row.closeObserved)
      report.cleanup.allSocketClosesNormal = sockets.length === 2 && sockets.every(c => c.row.closeObserved && c.row.closeCode === 1000 && !c.row.terminated)
      if (!report.cleanup.allSocketsClosed) throw new ProbeError('Owned socket closure unconfirmed')
      if (key == null) throw new ProbeError('Approved key unavailable for cleanup')
      for (const d of state.devices) {
        if (!d.bound) continue
        await api(`${d.label}-unbind`, '/xiaozhi/device/unbind', 'POST', { deviceId: d.mac })
        d.bound = false
        await save()
      }
      if (state.devices.some(d => d.uncertain) || (!state.agentId && state.createAttempted)) throw new ProbeError('Uncertain owned resources need reconciliation')
      if (state.agentId) {
        await api('delete-agent', `/xiaozhi/agent/${state.agentId}`, 'DELETE')
        state.agentId = null
        await save()
      }
      state.cleanupComplete = true
      await save()
      report.cleanup.resourcesRemoved = true
      report.cleanup.scope = 'Owned bindings removed and owned Agent deleted; not proof of all provider records/log/history erasure'
    } catch (error) {
      report.cleanup.resourcesRemoved = false
      report.cleanup.error = error instanceof ProbeError ? error.message : 'Unexpected cleanup failure'
    }
    clearTimeout(cleanupTimer)
    token = null; key = null
    report.cleanup.finishedAt = new Date().toISOString()
    report.finishedAt = new Date().toISOString(); report.elapsedMs = elapsed()
    if (sockets.some(c => c.row.terminated) || !report.cleanup.allSocketClosesNormal || !report.cleanup.resourcesRemoved) report.completed = false
    await writeFile(resultPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  }
  return report
}
