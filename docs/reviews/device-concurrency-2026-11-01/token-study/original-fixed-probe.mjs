import { randomBytes, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

import { networkErrorProjection, tokenProjection } from './probe.mjs'

const allowedSource = '/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars'
const owner = 'lie-p0-original-fixed-token-2026-11-01'
class ProbeError extends Error {}

export async function readAuthorizedSource(path) {
  const source = createReadStream(path, { encoding: 'utf8' })
  const lines = createInterface({ input: source, crlfDelay: Infinity })
  const values = {}
  try {
    for await (const line of lines) {
      const match = /^\s*(LINX_WS_TOKEN|LINX_AGENT_ID)\s*=\s*(.*?)\s*$/.exec(line)
      if (!match) continue
      if (Object.hasOwn(values, match[1])) throw new ProbeError('Duplicate approved source field')
      let value = match[2]
      if (value.startsWith('"')) { try { value = JSON.parse(value) } catch { throw new ProbeError('Invalid approved source encoding') } }
      else if (value.startsWith("'")) { if (!value.endsWith("'")) throw new ProbeError('Invalid approved source encoding'); value = value.slice(1, -1) }
      if (typeof value !== 'string' || !value) throw new ProbeError('Missing approved source field')
      values[match[1]] = value
    }
  } finally { lines.close(); source.destroy() }
  if (!/^[a-f0-9]{32}$/.test(values.LINX_AGENT_ID) || typeof values.LINX_WS_TOKEN !== 'string' ||
    !/^[\x21-\x7e]{1,16384}$/.test(values.LINX_WS_TOKEN)) throw new ProbeError('Invalid approved source values')
  return { agentId: values.LINX_AGENT_ID, token: values.LINX_WS_TOKEN }
}

// No CLI, default source, import-time credential read or network call.
export async function runOriginalFixed({ approval, sourceApproval, configPath, keyPath, privateDir, resultPath, WebSocket,
  request = globalThis.fetch, loadSource = readAuthorizedSource, readKey = async path => (await readFile(path, 'utf8')).trim(),
  waitMs = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  if (approval !== 'original-fixed-token-one-device-turn-approved' || sourceApproval !== 'local-main-dev-vars-token-and-agent-only' ||
    configPath !== allowedSource || keyPath !== '/Users/nighca/code/nighca/lie/.linx-api-key' || !privateDir || !resultPath || !WebSocket) {
    throw new ProbeError('Missing specific source scope or execution turn')
  }
  await mkdir(privateDir, { mode: 0o700 })
  const statePath = resolve(privateDir, 'state.json')
  const state = { owner, targetAgentId: null, device: null, cleanupComplete: false }
  await writeFile(statePath, JSON.stringify(state), { flag: 'wx', mode: 0o600 })
  const save = async () => {
    const temp = resolve(privateDir, `.state-${randomUUID()}.json`)
    await writeFile(temp, JSON.stringify(state), { flag: 'wx', mode: 0o600 })
    await rename(temp, statePath)
  }
  const start = Date.now(), elapsed = () => Date.now() - start
  const experiment = new AbortController(), cleanup = new AbortController()
  const report = { owner, startedAt: new Date().toISOString(), operations: [], channel: null, completed: false,
    listenMessages: 0, inputAudioBytes: 0, cleanup: {} }
  let fixed = null, key = null, cleanupMode = false, failure = null, channel = null, wsTimer = null
  const stop = reason => { failure ??= reason; experiment.abort() }
  const check = () => { if (experiment.signal.aborted) throw new ProbeError(failure ?? 'Experiment deadline') }
  const hardTimer = setTimeout(() => stop('Experiment deadline'), 90000)
  async function http(operation, url, options, business = true) {
    if (!cleanupMode) check()
    const row = { operation, startedAtMs: elapsed(), durationMs: null, status: null, code: null, errorCode: null, success: false }
    report.operations.push(row)
    try {
      const response = await request(url, { ...options, redirect: 'error', signal: AbortSignal.any([
        cleanupMode ? cleanup.signal : experiment.signal, AbortSignal.timeout(15000)
      ]) })
      row.status = response.status
      const body = await response.json()
      row.code = Number.isSafeInteger(body?.code) ? body.code : null
      if (!response.ok || (business && body?.code !== 0) || (!business && (body?.error || (body?.code != null && body.code !== 0)))) {
        row.errorCode = 'REJECTED_RESPONSE'; throw new ProbeError('Rejected operation')
      }
      row.success = true
      return body
    } catch (error) { row.errorCode ??= networkErrorProjection(error); throw new ProbeError(`Operation failed: ${operation}`) }
    finally { row.durationMs = elapsed() - row.startedAtMs }
  }
  const api = (operation, path, method = 'GET', body = null) => http(operation, `https://xrobo.qiniu.com${path}`, {
    method, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body == null ? {} : { body: JSON.stringify(body) })
  })
  function open() {
    const row = { startedAtMs: elapsed(), openedAtMs: null, helloAtMs: null, callerClose: false, closeObserved: false,
      closeAtMs: null, closeCode: null, readyState: null, terminated: false, unexpectedUpgradeStatus: null,
      receivedAudioBytes: 0, receivedTtsMessages: 0, errorCode: null }
    report.channel = row
    const ws = new WebSocket('wss://xrobo-io.qiniuapi.com/v1/ws/', { handshakeTimeout: 10000, headers: {
      Authorization: `Bearer ${fixed.token}`, 'Device-Id': state.device.mac, 'Client-Id': state.device.client,
      'Protocol-Version': '1', 'X-Agent-ID': fixed.agentId
    } })
    let resolveReady, resolveClosed, hello = false
    const ready = new Promise(resolve => { resolveReady = resolve }), closed = new Promise(resolve => { resolveClosed = resolve })
    const fail = reason => { if (!row.callerClose) stop(reason); resolveReady(false) }
    const readyTimer = setTimeout(() => { if (!hello) fail('Hello timeout') }, 10000)
    const abort = () => resolveReady(false)
    experiment.signal.addEventListener('abort', abort, { once: true })
    ws.on('error', error => { row.errorCode = networkErrorProjection(error); fail('WebSocket failed') })
    ws.on('unexpected-response', (_req, response) => { row.unexpectedUpgradeStatus = response.statusCode ?? null; response.resume(); fail('WebSocket rejected') })
    ws.on('close', code => {
      row.closeObserved = true; row.closeAtMs = elapsed(); row.closeCode = code; row.readyState = ws.readyState; resolveClosed()
      if (!row.callerClose) fail('Unexpected WebSocket close')
    })
    ws.on('open', () => {
      row.openedAtMs = elapsed()
      if (experiment.signal.aborted) return
      try { ws.send(JSON.stringify({ type: 'hello', version: 1, transport: 'websocket', audio_params: {
        format: 'pcm', sample_rate: 16000, channels: 1, bit_depth: 16, endianness: 'little', frame_duration: 20,
        frame_size: 320, sample_format: 'signed_int16'
      } })) } catch { fail('Hello send failed') }
    })
    ws.on('message', (bytes, binary) => {
      if (experiment.signal.aborted) return
      if (binary) { row.receivedAudioBytes += bytes.length; fail('Unexpected audio'); return }
      let message
      try { message = JSON.parse(bytes.toString()) } catch { fail('Invalid protocol JSON'); return }
      if (message?.type === 'tts') { row.receivedTtsMessages++; fail('Unexpected TTS'); return }
      if (message?.type !== 'hello') return
      if (hello || typeof message.session_id !== 'string' || !message.session_id || message.audio_params?.format !== 'pcm' ||
        message.audio_params?.sample_rate !== 16000 || message.audio_params?.channels !== 1) { fail('Invalid hello'); return }
      hello = true; row.helloAtMs = elapsed(); clearTimeout(readyTimer); resolveReady(true)
    })
    return { ws, row,
      async waitReady() { const ok = await ready; check(); if (!ok) throw new ProbeError('Hello failed') },
      async close() {
        clearTimeout(readyTimer); experiment.signal.removeEventListener('abort', abort)
        if (ws.readyState !== WebSocket.CLOSED) {
          row.callerClose = true
          try { ws.close(1000, 'Owned fixed-token test complete') } catch { /* Fall back below. */ }
          await Promise.race([closed, waitMs(3000)])
          if (ws.readyState !== WebSocket.CLOSED) {
            row.terminated = true; ws.terminate()
            await Promise.race([closed, waitMs(500)])
          }
        }
        row.readyState = ws.readyState
      }
    }
  }
  try {
    fixed = await loadSource(configPath)
    if (typeof fixed?.token !== 'string' || !fixed.token || !/^[a-f0-9]{32}$/.test(fixed?.agentId)) throw new ProbeError('Invalid approved source values')
    key = await readKey(keyPath)
    if (typeof key !== 'string' || !key) throw new ProbeError('Empty approved management key')
    state.targetAgentId = fixed.agentId
    await save()
    const detail = await api('read-target-agent-greeting', `/xiaozhi/agent/${fixed.agentId}`)
    let extra = detail.data?.extra
    if (typeof extra === 'string') { try { extra = JSON.parse(extra) } catch { throw new ProbeError('Unknown greeting configuration') } }
    report.config = { disable_greeting: typeof extra?.disable_greeting === 'boolean' ? extra.disable_greeting : null }
    if (report.config.disable_greeting !== true) throw new ProbeError('Greeting not explicitly disabled')
    report.token = tokenProjection(fixed.token)
    state.device = { label: 'D1', mac: `02:${randomBytes(5).toString('hex').match(/../g).join(':')}`, client: randomUUID(),
      otaAttempted: true, bindAttempted: false, bound: false, uncertain: true }
    await save()
    const device = state.device
    const initial = await http('D1-initial-ota', 'https://xrobo.qiniuapi.com/v1/ota/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Activation-Version': '1', 'Device-Id': device.mac,
        'Client-Id': device.client, 'User-Agent': 'lie-p0-original-fixed-token/1' },
      body: JSON.stringify({ mac_address: device.mac, uuid: device.client,
        application: { version: '0.1.0', elf_sha256: '0'.repeat(64) }, board: { type: 'lie-fixed-token-test', ssid: 'test', rssi: 0 } })
    }, false)
    if (initial.websocket?.token) throw new ProbeError('Unexpected already-bound generated identity')
    if (typeof initial.activation?.code !== 'string' || !/^\d{6}$/.test(initial.activation.code)) throw new ProbeError('Missing activation code')
    device.bindAttempted = true
    await save()
    await api('D1-bind', `/xiaozhi/device/bind/${fixed.agentId}/${initial.activation.code}`, 'POST')
    device.bound = true; device.uncertain = false
    await save()
    check()
    wsTimer = setTimeout(() => stop('WebSocket experiment deadline'), 20000)
    channel = open()
    await channel.waitReady()
    await Promise.race([waitMs(3000), new Promise(resolve => experiment.signal.addEventListener('abort', resolve, { once: true }))])
    check()
    report.completed = channel.ws.readyState === WebSocket.OPEN && !channel.row.closeObserved
    if (!report.completed) throw new ProbeError('Fixed-token acceptance assertion failed')
  } catch (error) { report.error = failure ?? (error instanceof ProbeError ? error.message : 'Unexpected internal failure') }
  finally {
    clearTimeout(hardTimer); clearTimeout(wsTimer); experiment.abort(); cleanupMode = true
    report.cleanup.startedAt = new Date().toISOString()
    const cleanupTimer = setTimeout(() => cleanup.abort(), 30000)
    try {
      if (channel != null) await channel.close()
      report.cleanup.socketCreated = channel != null
      report.cleanup.socketClosed = channel != null && channel.ws.readyState === WebSocket.CLOSED && channel.row.closeObserved
      report.cleanup.normalClose = channel != null && report.cleanup.socketClosed && channel.row.closeCode === 1000 && !channel.row.terminated
      if (channel != null && !report.cleanup.socketClosed) throw new ProbeError('Owned socket closure unconfirmed')
      if (state.device?.bound) {
        await api('D1-unbind', '/xiaozhi/device/unbind', 'POST', { deviceId: state.device.mac })
        state.device.bound = false
        await save()
      }
      if (state.device?.uncertain) throw new ProbeError('Uncertain owned device requires reconciliation')
      state.cleanupComplete = true
      await save()
      report.cleanup.ownedBindingCleared = true
      report.cleanup.scope = 'Only the newly owned Device binding; no target Agent or original Device changes; provider registry/log erasure not claimed'
    } catch (error) { report.cleanup.ownedBindingCleared = false; report.cleanup.error = error instanceof ProbeError ? error.message : 'Unexpected cleanup failure' }
    clearTimeout(cleanupTimer)
    fixed = null; key = null
    if (!report.cleanup.normalClose || !report.cleanup.ownedBindingCleared) report.completed = false
    report.cleanup.finishedAt = new Date().toISOString(); report.finishedAt = new Date().toISOString(); report.elapsedMs = elapsed()
    await writeFile(resultPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
  }
  return report
}
