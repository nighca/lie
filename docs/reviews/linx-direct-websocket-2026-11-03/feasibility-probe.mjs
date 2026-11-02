import { readFile, writeFile } from 'node:fs/promises'
import { randomBytes, randomUUID } from 'node:crypto'
import { createOwnedAgent, ownedAgentPath } from './owned-agent.mjs'
const option = (name) => {
  const i = process.argv.indexOf(name)
  if (i < 0 || !process.argv[i + 1]) throw Error('missing-option')
  return process.argv[i + 1]
}
if (!process.argv.includes('--execute-owned-probe'))
  throw Error('explicit-execution-required')
const { chromium } = await import(option('--playwright-module'))
const { pathToFileURL } = await import('node:url')
const root = pathToFileURL(
  option('--private-state-dir').replace(/\/$/, '') + '/'
)
const key = (await readFile(option('--key-file'), 'utf8')).trim()
const state = {
  name: `LIE-direct-probe-${Date.now()}`,
  agentId: null,
  deviceId: `02:${randomBytes(5).toString('hex').match(/../g).join(':')}`,
  clientId: randomUUID(),
  bound: false,
  startedAt: Date.now(),
  connections: 0
}
const result = {
  businessAuthorizationUntested: true,
  kind: 'real browser handshake only; no mic/listen/audio/inference',
  operations: [],
  probes: [],
  cleanup: {}
}
const save = () =>
  writeFile(new URL('ledger.json', root), JSON.stringify(state), {
    mode: 0o600
  })
await writeFile(new URL('ledger.json', root), JSON.stringify(state), {
  mode: 0o600,
  flag: 'wx'
})
let cleaning = false,
  cleanupStartedAt = null,
  browser
async function api(path, method = 'GET', body = null) {
  if (
    cleaning
      ? Date.now() - cleanupStartedAt > 60000
      : Date.now() - state.startedAt > 300000
  )
    throw Error('window-expired')
  const response = await fetch(`https://xrobo.qiniu.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: body == null ? null : JSON.stringify(body),
    signal: AbortSignal.timeout(
      Math.max(
        1,
        Math.min(
          12000,
          cleaning
            ? 60000 - (Date.now() - cleanupStartedAt)
            : 300000 - (Date.now() - state.startedAt)
        )
      )
    )
  })
  const d = await response.json()
  result.operations.push({
    method,
    status: response.status,
    success: response.ok && d.code === 0
  })
  if (!response.ok || d.code !== 0) throw Error('management-rejected')
  return d.data
}
async function ota() {
  const remaining = 300000 - (Date.now() - state.startedAt)
  if (remaining <= 0) throw Error('window-expired')
  const response = await fetch('https://xrobo.qiniuapi.com/v1/ota/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Activation-Version': '1',
      'Device-Id': state.deviceId,
      'Client-Id': state.clientId,
      'User-Agent': 'lie-direct-probe/1'
    },
    body: JSON.stringify({
      mac_address: state.deviceId,
      uuid: state.clientId,
      application: { version: '1', elf_sha256: '0'.repeat(64) },
      board: { type: 'lie-browser', ssid: 'test', rssi: 0 }
    }),
    signal: AbortSignal.timeout(Math.min(12000, remaining))
  })
  result.operations.push({ method: 'OTA', status: response.status })
  if (!response.ok) throw Error('ota-rejected')
  return response.json()
}
try {
  browser = await chromium.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  })
  const page = await browser.newPage()
  await page.goto('https://lie.agency/', { waitUntil: 'domcontentloaded' })
  await createOwnedAgent(state, save, api, {
    agentName: state.name,
    assistantName: 'Transport test',
    memModelId: 'Memory_nomem',
    intentModelId: 'Intent_function_call',
    systemPrompt: 'Do not greet. Transport handshake test only.'
  })
  await api(`/xiaozhi/agent/${state.agentId}`, 'PUT', {
    chatHistoryConf: 0,
    memModelId: 'Memory_nomem',
    extra: { disable_greeting: true }
  })
  const detail = await api(`/xiaozhi/agent/${state.agentId}`)
  const extra =
    typeof detail?.extra === 'string' ? JSON.parse(detail.extra) : detail?.extra
  result.greetingDisabled = extra?.disable_greeting === true
  if (!result.greetingDisabled) throw Error('greeting-not-confirmed')
  let config = await ota()
  if (!config.activation?.code) throw Error('activation-not-returned')
  state.bindAttempted = true
  await save()
  await api(
    `/xiaozhi/device/bind/${state.agentId}/${config.activation.code}`,
    'POST'
  )
  state.bound = true
  await save()
  config = await ota()
  if (!config.websocket?.token) throw Error('token-not-returned')
  state.token = config.websocket.token
  await save()
  const parts = state.token.split('.')
  let claims = null
  if (parts.length === 3) {
    try {
      claims = JSON.parse(Buffer.from(parts[1], 'base64url'))
    } catch {}
  }
  result.tokenMetadata = {
    jwt: claims != null,
    claimNames: claims == null ? [] : Object.keys(claims),
    hasExpiry: Number.isFinite(claims?.exp),
    ttlSeconds: Number.isFinite(claims?.exp)
      ? claims.exp - Math.floor(Date.now() / 1000)
      : null
  }
  for (const mode of ['valid', 'missing', 'wrong']) {
    if (Date.now() - state.startedAt > 287000 || state.connections >= 3)
      throw Error('window-expired')
    state.connections++
    await save()
    let probeTimeout, observation
    try {
      observation = await Promise.race([
        page.evaluate(
          async ({ deviceId, clientId, token, mode }) => {
            const url = new URL('wss://xrobo-io.qiniuapi.com/v1/ws2')
            url.searchParams.set('device-id', deviceId)
            url.searchParams.set('client-id', clientId)
            return new Promise((resolve) => {
              let opened = false,
                finished = false,
                hello = false,
                tools = false,
                output = null,
                closeTimer = null
              const types = []
              const ws = new WebSocket(url)
              const start = performance.now()
              const closed = () => {
                clearTimeout(closeTimer)
                resolve({ ...output, closedConfirmed: true })
              }
              const finish = (outcome, extra = {}) => {
                if (finished) return
                finished = true
                clearTimeout(timer)
                output = {
                  outcome,
                  opened,
                  types,
                  elapsedMs: Math.round(performance.now() - start),
                  ...extra
                }
                if (ws.readyState === WebSocket.CLOSED) return closed()
                ws.close()
                closeTimer = setTimeout(
                  () => resolve({ ...output, closedConfirmed: false }),
                  2000
                )
              }
              const timer = setTimeout(() => finish('timeout'), 10000)
              ws.onopen = () => {
                opened = true
                ws.send(
                  JSON.stringify({
                    type: 'hello',
                    version: 1,
                    transport: 'websocket',
                    device_id: deviceId,
                    device_mac: deviceId,
                    device_name: 'LIE direct transport probe',
                    ...(mode === 'missing'
                      ? {}
                      : {
                          token: mode === 'valid' ? token : 'invalid-test-token'
                        }),
                    features: { mcp: true },
                    audio_params: {
                      format: 'pcm',
                      sample_rate: 16000,
                      channels: 1,
                      bit_depth: 16,
                      endianness: 'little',
                      frame_duration: 20,
                      frame_size: 320,
                      sample_format: 'signed_int16'
                    }
                  })
                )
              }
              ws.onmessage = (e) => {
                if (finished) return
                if (typeof e.data !== 'string')
                  return finish('unexpected-binary')
                let m
                try {
                  m = JSON.parse(e.data)
                } catch {
                  return finish('non-json')
                }
                if (m == null || typeof m !== 'object' || Array.isArray(m))
                  return finish('non-object')
                types.push(
                  ['hello', 'mcp', 'error'].includes(m.type) ? m.type : 'other'
                )
                if (m.type === 'hello') {
                  hello = true
                  if (
                    m.audio_params?.format !== 'pcm' ||
                    m.audio_params?.sample_rate !== 16000 ||
                    m.audio_params?.channels !== 1 ||
                    (m.audio_params?.bits_per_sample ??
                      m.audio_params?.bit_depth ??
                      16) !== 16
                  )
                    return finish('incompatible-hello', {
                      pcm: m.audio_params?.format === 'pcm',
                      sampleRate: Number.isFinite(m.audio_params?.sample_rate)
                        ? m.audio_params.sample_rate
                        : null
                    })
                } else if (m.type === 'mcp') {
                  const p = m.payload
                  if (p?.method === 'initialize')
                    ws.send(
                      JSON.stringify({
                        type: 'mcp',
                        payload: {
                          jsonrpc: '2.0',
                          id: p.id,
                          result: {
                            protocolVersion: '2024-11-05',
                            capabilities: { tools: {} },
                            serverInfo: {
                              name: 'lie-transport-probe',
                              version: '1'
                            }
                          }
                        }
                      })
                    )
                  else if (p?.method === 'tools/list') {
                    tools = true
                    ws.send(
                      JSON.stringify({
                        type: 'mcp',
                        payload: {
                          jsonrpc: '2.0',
                          id: p.id,
                          result: { tools: [], nextCursor: null }
                        }
                      })
                    )
                  } else return finish('unexpected-mcp')
                } else if (m.type === 'error') return finish('protocol-error')
                else return finish('unexpected-type')
                if (hello && tools) finish('pcm-hello-and-tools')
              }
              ws.onerror = () => finish('connection-error')
              ws.onclose = (e) =>
                finished ? closed() : finish('closed', { code: e.code })
            })
          },
          {
            deviceId: state.deviceId,
            clientId: state.clientId,
            token: state.token,
            mode
          }
        ),
        new Promise((_, reject) => {
          probeTimeout = setTimeout(
            () => reject(Error('host-probe-timeout')),
            Math.min(13000, 300000 - (Date.now() - state.startedAt))
          )
        })
      ])
    } finally {
      clearTimeout(probeTimeout)
    }
    result.probes.push({ mode, ...observation })
    if (!observation.closedConfirmed) throw Error('socket-close-unconfirmed')
    if (mode === 'valid' && observation.outcome !== 'pcm-hello-and-tools')
      throw Error('baseline-failed')
    if (mode !== 'valid' && observation.outcome === 'pcm-hello-and-tools') {
      result.handshakeAcceptedWithoutValidToken = true
      break
    }
    if (
      mode !== 'valid' &&
      !['closed', 'protocol-error', 'connection-error'].includes(
        observation.outcome
      )
    )
      throw Error('negative-inconclusive')
  }
} catch (error) {
  result.failure =
    error instanceof Error && /^[a-z-]+$/.test(error.message)
      ? error.message
      : 'operation-failed-details-omitted'
} finally {
  cleaning = true
  cleanupStartedAt = Date.now()
  if (browser) {
    let closeTimeout
    try {
      await Promise.race([
        browser.close(),
        new Promise((_, reject) => {
          closeTimeout = setTimeout(
            () => reject(Error('browser-close-timeout')),
            5000
          )
        })
      ])
      result.browserClosed = true
    } catch {
      result.browserClosed = false
    } finally {
      clearTimeout(closeTimeout)
    }
  }
  if (state.bindAttempted) {
    try {
      await api('/xiaozhi/device/unbind', 'POST', { deviceId: state.deviceId })
      result.cleanup.deviceUnbound = true
      state.bound = false
    } catch {
      result.cleanup.deviceUnbound = false
    }
  }
  if (state.createUncertain === true) result.cleanup.agentCreationUncertain = true
  const agentPath = ownedAgentPath(state)
  if (agentPath != null) {
    try {
      await api(agentPath, 'DELETE')
      result.cleanup.agentDeleted = true
    } catch {
      result.cleanup.agentDeleted = false
    }
  }
  state.finishedAt = Date.now()
  state.token = null
  await save()
  await writeFile(
    new URL('sanitized-result.json', root),
    JSON.stringify(result, null, 2),
    { mode: 0o600 }
  )
  console.log(JSON.stringify(result))
}
