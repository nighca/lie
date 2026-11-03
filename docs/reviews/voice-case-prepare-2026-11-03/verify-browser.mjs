import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const origin = 'https://direct-test-20261103.preview.lie.agency'
const namespace = 'direct-formal-20261103-v1'
const endpoint = 'wss://xrobo-io.qiniuapi.com/v1/ws/'
const requireThat = (condition) => { if (!condition) throw Error('verification-failed') }

// Prepare issues the signed Cookie. This reads its identity without claiming to verify the HMAC.
export function cookieIdentity(cookies, now = Date.now()) {
  const matches = cookies.filter(cookie => cookie.name === '__Host-lie-device')
  requireThat(matches.length === 1)
  const cookie = matches[0]
  requireThat(cookie.httpOnly === true && cookie.secure === true && cookie.path === '/' && cookie.domain === new URL(origin).hostname)
  const parts = cookie.value.split('.')
  requireThat(parts.length === 2 && parts.every(part => /^[A-Za-z0-9_-]+$/.test(part)))
  const value = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
  requireThat(value.v === 1 && value.environment === `${namespace}:https` && typeof value.deviceId === 'string' && typeof value.clientId === 'string' &&
    /^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/.test(value.deviceId ?? '') &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value.clientId ?? '') &&
    Number.isSafeInteger(value.issuedAt) && value.issuedAt <= Math.floor(now / 1000) &&
    Number.isSafeInteger(value.expiresAt) && value.expiresAt > Math.floor(now / 1000))
  return { deviceId: value.deviceId, clientId: value.clientId, environment: value.environment }
}

async function bounded(work, milliseconds) {
  let timer
  try { return await Promise.race([work, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('deadline')), milliseconds) })]) }
  finally { clearTimeout(timer) }
}

async function main(args) {
  requireThat(args.includes('--connect-owned-case-preview'))
  const option = name => { const i = args.indexOf(name); requireThat(i >= 0 && args[i + 1]); return args[i + 1] }
  const old = JSON.parse(await readFile(resolve(option('--private-state-dir'), 'ledger.json'), 'utf8'))
  requireThat(old.ready === true && typeof old.name === 'string' && old.name.startsWith('LIE-direct-preview-') && old.createAttempted === true && old.createUncertain === false && old.agentCleaned !== true && old.cleanup?.agentDeleted !== true && /^[a-f0-9]{32}$/.test(old.agentId ?? '') && Date.parse(old.expiresAt) > Date.now())
  const resultDirectory = resolve(option('--result-dir'))
  const playwrightModule = option('--playwright-module')
  await mkdir(resultDirectory, { mode: 0o700 })
  // A fresh exclusive directory and attempt receipt permit exactly one execution here.
  await writeFile(resolve(resultDirectory, 'attempts.json'), JSON.stringify({ attempts: 1, maximum: 1 }), { mode: 0o600, flag: 'wx' })
  const privateState = { agentId: old.agentId, namespace, expiresAt: old.expiresAt, devices: [], unknownIdentityContexts: [] }
  const savePrivate = async () => {
    const temporary = resolve(resultDirectory, `devices-${randomUUID()}.tmp`)
    await writeFile(temporary, JSON.stringify(privateState, null, 2), { mode: 0o600, flag: 'wx' })
    await rename(temporary, resolve(resultDirectory, 'devices.json'))
  }
  const result = { stage: 'bundle', failed: false, contexts: [], prepares: [], prepareRequests: 0, statusRequests: 0, unknownIdentityContexts: [], providerSockets: 0, relaySockets: 0, otherSockets: 0,
    providerHttpStatus: null, nativeCloseCode: null, socketClosedConfirmed: false, channelReady: false, channelEvents: [], unexpectedInbound: false,
    sentHelloFrames: 0, sentMcpFrames: 0, listenFrames: 0, binaryFrames: 0, otherSentFrames: 0, microphoneCalls: null, browserClosed: null }
  let browser = null, pageA = null, pages = [], clients = [], stopped = false, socketClosed = null
  const active = () => { requireThat(!stopped && Date.now() < Date.parse(old.expiresAt)) }
  const cancelChannel = async () => {
    if (pageA != null) await bounded(pageA.evaluate(() => globalThis.__formalCancel?.()), 500).catch(() => {})
  }
  const captureIdentity = async client => {
    if (!privateState.unknownIdentityContexts.includes(client.observation.label)) return
    const cookies = await bounded(client.context.cookies(origin), 500)
    client.observation.cookiePresent = cookies.some(cookie => cookie.name === '__Host-lie-device')
    let identity
    try { identity = cookieIdentity(cookies) } catch { return }
    client.observation.httpOnlySecure = true; client.observation.namespaceMatch = true
    client.identity = identity
    client.record = { label: client.observation.label, ...identity, prepareAttempted: true, prepareConfirmed: false }
    privateState.devices.push(client.record)
    privateState.unknownIdentityContexts = privateState.unknownIdentityContexts.filter(label => label !== client.observation.label)
    await savePrivate()
  }
  try {
    const bundled = await bounded(build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: resolve('packages/voice/src/channel.ts'), formats: ['es'] } } }), 30000)
    const output = Array.isArray(bundled) ? bundled[0].output : bundled.output
    const entry = output.find(item => item.type === 'chunk' && item.isEntry)
    requireThat(entry?.code && ['createVoiceChannel', 'readDirectVoiceConnection'].every(name => entry.exports.includes(name)))
    const code = entry.code
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
    const { chromium } = await import(playwrightModule)
    result.stage = 'browser-launch'
    browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, timeout: 15000 })
    const work = async () => {
      const createContext = async label => {
        active(); result.stage = `context-${label}`
        const context = await browser.newContext({ permissions: [], serviceWorkers: 'block' })
        requireThat((await context.cookies()).length === 0)
        await context.route(origin + '/', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Formal voice probe</title>' }))
        const page = await context.newPage()
        pages.push(page)
        const observation = { label, freshCookies: true, freshStorage: false, cookiePresent: false, httpOnlySecure: false, namespaceMatch: false, prepareRequests: 0 }
        result.contexts.push(observation)
        page.on('request', request => {
          const url = new URL(request.url())
          if (url.origin === origin && url.pathname === '/api/voice/prepare') { result.prepareRequests++; observation.prepareRequests++ }
          if (url.origin === origin && url.pathname === '/api/voice/status') result.statusRequests++
        })
        page.on('response', response => {
          const url = new URL(response.url())
          if (url.origin !== origin || url.pathname !== '/api/voice/prepare') return
          const prepare = result.prepares.findLast(item => item.context === label)
          if (prepare != null) { prepare.status = response.status(); prepare.noStore = response.headers()['cache-control'] === 'no-store' }
        })
        page.on('websocket', socket => {
          const url = new URL(socket.url())
          const provider = url.origin === new URL(endpoint).origin && url.pathname === new URL(endpoint).pathname
          if (provider) result.providerSockets++
          else if (url.origin === origin.replace('https:', 'wss:')) result.relaySockets++
          else result.otherSockets++
          if (provider) socketClosed = new Promise(resolveClosed => socket.on('close', () => { result.socketClosedConfirmed = true; resolveClosed() }))
          socket.on('framesent', frame => {
            if (typeof frame.payload !== 'string') { result.binaryFrames++; return }
            let type
            try { type = JSON.parse(frame.payload).type } catch { result.otherSentFrames++; return }
            if (type === 'hello') result.sentHelloFrames++
            else if (type === 'mcp') result.sentMcpFrames++
            else if (type === 'listen') result.listenFrames++
            else result.otherSentFrames++
          })
        })
        await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 10000 })
        requireThat(page.url() === origin + '/')
        observation.freshStorage = await page.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0)
        requireThat(observation.freshStorage)
        await page.evaluate(() => {
          globalThis.__formalObservation = { microphoneCalls: 0, nativeCloseCode: null, events: [], socketAttempts: 0, unexpectedInbound: false }
          navigator.mediaDevices.getUserMedia = async () => { globalThis.__formalObservation.microphoneCalls++; throw Error('microphone-not-authorized') }
        })
        const client = { page, context, observation, identity: null, record: null }
        clients.push(client)
        return client
      }
      const prepare = async client => {
        active(); requireThat(result.prepareRequests < 2)
        const label = client.observation.label
        result.stage = `prepare-${label}`
        const observation = { label, context: label, status: null, noStore: false, transportDirect: false, identityMatch: false, endpointMatch: false }
        result.prepares.push(observation)
        privateState.unknownIdentityContexts.push(label)
        await savePrivate()
        try {
          Object.assign(observation, await client.page.evaluate(async () => {
            const response = await fetch('/api/voice/prepare', { method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000) })
            const observation = { status: response.status, noStore: response.headers.get('Cache-Control') === 'no-store', transportDirect: false, endpointMatch: false }
            let value
            try { value = await response.json() } catch { return observation }
            observation.transportDirect = value?.transport === 'direct'
            observation.endpointMatch = value?.url === 'wss://xrobo-io.qiniuapi.com/v1/ws/' && value?.maxSessionSeconds === 600 && typeof value?.token === 'string' && value.token.length > 0
            if (response.status === 200 && observation.noStore && observation.transportDirect && observation.endpointMatch) globalThis.__formalDescriptor = value
            return observation
          }))
        } finally { await captureIdentity(client) }
        if (client.identity != null) {
          observation.identityMatch = await client.page.evaluate(expected => {
            const value = globalThis.__formalDescriptor
            return value?.deviceId === expected.deviceId && value?.clientId === expected.clientId
          }, client.identity)
        }
        requireThat(observation.status === 200 && observation.noStore && observation.transportDirect && observation.identityMatch && observation.endpointMatch)
        client.record.prepareConfirmed = true
        await savePrivate()
      }
      const a = await createContext('A'); pageA = a.page
      await prepare(a)
      const b = await createContext('B')
      await prepare(b)
      result.identitiesDifferent = a.identity.deviceId !== b.identity.deviceId && a.identity.clientId !== b.identity.clientId
      requireThat(result.identitiesDifferent)
      requireThat(result.prepareRequests === 2 && result.statusRequests === 0 && result.contexts.every(context => context.prepareRequests === 1))
      active(); result.stage = 'native-channel'
      const cdp = await a.context.newCDPSession(a.page)
      await cdp.send('Network.enable')
      let socketRequestId = null
      cdp.on('Network.webSocketCreated', event => { socketRequestId = event.requestId })
      cdp.on('Network.webSocketHandshakeResponseReceived', event => {
        if (event.requestId === socketRequestId && Number.isInteger(event.response.status)) result.providerHttpStatus = event.response.status
      })
      const channelResult = await a.page.evaluate(async moduleUrl => {
        const seen = globalThis.__formalObservation
        const descriptor = globalThis.__formalDescriptor
        const controller = new AbortController()
        let channel = null
        globalThis.__formalCancel = () => { controller.abort(); channel?.close() }
        const NativeWebSocket = globalThis.WebSocket
        globalThis.WebSocket = class extends NativeWebSocket {
          constructor(address, protocols) {
            const url = new URL(address)
            if (++seen.socketAttempts !== 1 || url.origin !== 'wss://xrobo-io.qiniuapi.com' || url.pathname !== '/v1/ws/' || url.hash || url.username || url.password || [...url.searchParams.keys()].sort().join(',') !== 'client-id,device-id' || url.searchParams.get('device-id') !== descriptor.deviceId || url.searchParams.get('client-id') !== descriptor.clientId || protocols != null) throw Error('unexpected-socket')
            super(address)
            this.addEventListener('close', event => { seen.nativeCloseCode = event.code })
            this.addEventListener('message', event => {
              let type
              try { if (typeof event.data === 'string') type = JSON.parse(event.data).type } catch {}
              if (!['hello', 'mcp', 'error'].includes(type)) { seen.unexpectedInbound = true; globalThis.__formalCancel() }
            })
          }
          send(data) {
            if (typeof data !== 'string') { globalThis.__formalCancel(); throw Error('binary-not-authorized') }
            const type = JSON.parse(data).type
            if (!['hello', 'mcp'].includes(type)) { globalThis.__formalCancel(); throw Error('input-not-authorized') }
            return super.send(data)
          }
        }
        let timer
        try {
          const module = await import(moduleUrl)
          if (typeof module.readDirectVoiceConnection !== 'function') throw Error('formal-channel-required')
          const direct = module.readDirectVoiceConnection(descriptor)
          channel = module.createVoiceChannel({ directConnection: direct, tools: [{ name: 'self.lie_character_context', description: 'Protocol probe only', inputSchema: { type: 'object', properties: {} }, execute: async () => { globalThis.__formalCancel(); throw Error('tool-not-authorized') } }], onEvent(event) {
            if (['ready', 'closed', 'error', 'tool', 'tts', 'audio', 'stt'].includes(event.type)) seen.events.push(event.type)
            if (['error', 'tool', 'tts', 'audio', 'stt'].includes(event.type)) globalThis.__formalCancel()
          } })
          timer = setTimeout(() => globalThis.__formalCancel(), 15000)
          await channel.open({ signal: controller.signal })
          return { ready: seen.events.includes('ready'), unexpected: seen.unexpectedInbound || seen.events.some(type => ['error', 'tool', 'tts', 'audio', 'stt'].includes(type)) }
        } finally { clearTimeout(timer); channel?.close() }
      }, moduleUrl)
      result.channelReady = channelResult.ready
      requireThat(channelResult.ready && !channelResult.unexpected)
      result.stage = 'socket-close'
      requireThat(socketClosed != null)
      await bounded(Promise.all([socketClosed, a.page.waitForFunction(() => globalThis.__formalObservation.nativeCloseCode != null, null, { timeout: 3000 })]), 3500)
      result.nativeCloseCode = await a.page.evaluate(() => globalThis.__formalObservation.nativeCloseCode)
      requireThat(result.providerHttpStatus === 101 && result.providerSockets === 1 && result.relaySockets === 0 && result.otherSockets === 0 && result.socketClosedConfirmed && result.nativeCloseCode === 1000 && result.sentHelloFrames === 1 && result.sentMcpFrames > 0 && result.listenFrames === 0 && result.binaryFrames === 0 && result.otherSentFrames === 0)
      result.stage = 'complete'
    }
    await bounded(work(), 120000)
  } catch {
    result.failed = true; result.failureStage = result.stage
  } finally {
    stopped = true
    await cancelChannel()
    if (socketClosed != null) await bounded(socketClosed, 3000).catch(() => {})
    for (const client of clients) await captureIdentity(client).catch(() => {})
    result.unknownIdentityContexts = [...privateState.unknownIdentityContexts]
    let microphoneCalls = 0, observedPages = 0
    for (const page of pages) {
      try {
        const observation = await bounded(page.evaluate(() => ({ microphoneCalls: globalThis.__formalObservation?.microphoneCalls, nativeCloseCode: globalThis.__formalObservation?.nativeCloseCode, events: globalThis.__formalObservation?.events, unexpectedInbound: globalThis.__formalObservation?.unexpectedInbound })), 500)
        if (Number.isInteger(observation.microphoneCalls)) { microphoneCalls += observation.microphoneCalls; observedPages++ }
        if (observation.nativeCloseCode != null) result.nativeCloseCode = observation.nativeCloseCode
        if (page === pageA && Array.isArray(observation.events)) {
          result.channelEvents = observation.events.filter(type => ['ready', 'closed', 'error', 'tool', 'tts', 'audio', 'stt'].includes(type))
          result.channelReady = result.channelEvents.includes('ready')
          result.unexpectedInbound = observation.unexpectedInbound === true
        }
      } catch {}
    }
    if (observedPages === pages.length && pages.length > 0) result.microphoneCalls = microphoneCalls
    if (browser != null) {
      try { await bounded(browser.close(), 5000); result.browserClosed = true }
      catch { result.browserClosed = false; result.failed = true }
    }
    if (result.microphoneCalls !== 0 || result.browserClosed !== true || result.unexpectedInbound || result.unknownIdentityContexts.length > 0) result.failed = true
    await writeFile(resolve(resultDirectory, 'verification.json'), JSON.stringify(result, null, 2), { mode: 0o600, flag: 'wx' })
    console.log(JSON.stringify(result))
    if (result.failed) process.exitCode = 1
  }
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(() => { console.error('Case prepare preview verification stopped; retain private evidence for owner review'); process.exitCode = 1 })
}
