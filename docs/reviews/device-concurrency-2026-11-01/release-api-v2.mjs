import { readFile, writeFile, rename } from 'node:fs/promises'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'

import { stateRoot, keyPath } from './release-ops.mjs'
import { readWindow, windowFileArgument } from './release-window-v2.mjs'

export class Budget {
  constructor(counters = {}) {
    this.c = { http: 0, logical: 0, upgrades: 0, socketMs: 0, ...counters }
    if (Object.values(this.c).some(n => !Number.isFinite(n) || n < 0) ||
      ['http', 'logical', 'upgrades'].some(name => !Number.isInteger(this.c[name]))) throw Error('Invalid persisted budget')
  }
  http(n, cleanup = false) {
    if (!Number.isInteger(n) || n <= 0 || this.c.http + n > (cleanup ? 24 : 20)) throw Error('HTTP budget exhausted')
    this.c.http += n
  }
  ws() {
    if (this.c.logical >= 6 || this.c.upgrades + 2 > 12 || this.c.socketMs >= 90000) throw Error('WS budget exhausted')
    this.http(1); this.c.logical++; this.c.upgrades += 2
  }
}

export function validHello(m) {
  return m?.transport === 'websocket' && typeof m.session_id === 'string' && m.session_id.length > 0 &&
    m.audio_params?.format === 'pcm' && m.audio_params.sample_rate === 16000 && m.audio_params.channels === 1 &&
    (m.audio_params.bits_per_sample ?? m.audio_params.bit_depth ?? 16) === 16
}
export function validCookieAttributes(value) {
  return /(?:^|;)\s*HttpOnly(?:;|$)/i.test(value) && /(?:^|;)\s*Secure(?:;|$)/i.test(value) &&
    /(?:^|;)\s*SameSite=Lax(?:;|$)/i.test(value) && /(?:^|;)\s*Path=\/(?:;|$)/i.test(value)
}
export function replacementProven(old, newer) {
  return old.replacementStartedAt === newer.startedAt && old.openBeforeReplacementDial === true && old.closed &&
    old.code === 1000 && !old.callerClose && !old.limitClose && !old.terminated && old.closedAt >= newer.startedAt
}
export function advanceSocketCounter(counters, previous, now, count) {
  counters.socketMs += Math.max(0, now - previous) * count
  return now
}
export function canUnbind(jar) {
  return jar.preflightUnbound && jar.prepareAttempted && jar.bound && !jar.prepareUncertain && !jar.cleaned
}
export function channelRecord(item) {
  return { startedAt: item.startedAt, closedAt: item.closedAt, closeCode: item.code, callerClose: item.callerClose,
    limitClose: item.limitClose, terminated: item.terminated, replacementStartedAt: item.replacementStartedAt,
    openBeforeReplacementDial: item.openBeforeReplacementDial, unexpectedClose: item.unexpectedClose }
}

// Tests inject a window, memory-only IO, fetch, WS and timers; imports never read private state.
export function createApiRunner({ window, io = { readFile, writeFile, rename }, request = globalThis.fetch, Socket = WebSocket,
  timers = globalThis, productionCandidate = false,
  paths = { ledger: `${stateRoot}/api-ledger.json`, key: keyPath, signing: `${stateRoot}/production-cookie-secret` } }) {
  let ledger, budget, key, signing, phaseStart, phaseUsed = 0, cleanupDeadline = Infinity, inCleanup = false
  let queue = Promise.resolve(), lastTick = window.now(), failure = null, running = false, aggregateTimer = null
  const live = new Set(), allChannels = []
  let priorChannels = []
  const phaseRemaining = () => 240000 - phaseUsed - (window.now() - phaseStart)
  function check(cleanup = false) {
    window.assertActive(cleanup)
    if (cleanup && window.now() >= cleanupDeadline) throw Error('Cleanup deadline reached')
    if (!cleanup && (phaseRemaining() <= 0 || failure)) throw Error('Approved phase stopped')
  }
  function timeout(requested, cleanup = false) {
    return window.timeout(requested, { cleanup, phaseRemaining: cleanup ? Infinity : phaseRemaining(),
      cleanupRemaining: cleanup ? cleanupDeadline - window.now() : Infinity })
  }
  async function bounded(promise, ms, onTimeout = () => {}) {
    let timer
    try {
      return await Promise.race([promise, new Promise((_, reject) => {
        timer = timers.setTimeout(() => { onTimeout(); reject(Error('Bounded operation expired')) }, ms)
      })])
    } finally { timers.clearTimeout(timer) }
  }
  function fail(reason) { failure ??= reason; if (ledger) ledger.fatal ??= reason }
  function tick() {
    if (!budget) return
    lastTick = advanceSocketCounter(budget.c, lastTick, window.now(), live.size)
    if (budget.c.socketMs >= 88000 && live.size) stopAll('Approved aggregate close reserve')
  }
  function scheduleAggregate() {
    timers.clearTimeout(aggregateTimer)
    if (!live.size) return
    const target = budget.c.socketMs < 88000 ? 88000 : 90000
    const delay = Math.max(1, Math.floor((target - budget.c.socketMs) / live.size))
    aggregateTimer = timers.setTimeout(() => {
      tick()
      if (budget.c.socketMs >= 90000) {
        fail('Aggregate socket hard limit')
        for (const item of live) { item.limitClose = true; item.terminated = true; try { item.ws.terminate() } catch {} }
      } else stopAll('Approved aggregate close reserve')
      void save(true).catch(() => fail('Ledger persistence failed'))
      if (budget.c.socketMs < 90000) scheduleAggregate()
    }, delay)
  }
  function stopAll(reason) {
    fail(reason)
    for (const item of live) {
      item.limitClose = true
      try { item.ws.close(1000, reason) } catch { item.terminated = true; try { item.ws.terminate() } catch {} }
    }
  }
  async function save(cleanup = inCleanup) {
    if (!ledger) return
    const ms = timeout(5000, cleanup)
    ledger.channels = [...priorChannels, ...allChannels.map(channelRecord)]
    ledger.counters = { ...budget.c }
    const value = JSON.stringify(ledger)
    queue = queue.catch(() => {}).then(async () => {
      check(cleanup)
      const controller = new AbortController(), temporary = `${paths.ledger}.${process.pid}.tmp`
      const writeTimeout = timeout(5000, cleanup)
      await bounded((async () => {
        await io.writeFile(temporary, value, { mode: 0o600, signal: controller.signal })
        check(cleanup)
        await io.rename(temporary, paths.ledger)
      })(), writeTimeout, () => controller.abort())
    })
    return bounded(queue, ms)
  }
  async function fetchResponse(url, options = {}, cleanup = false, requested = 8000) {
    check(cleanup)
    const ms = timeout(requested, cleanup), controller = new AbortController(), expiresAt = window.now() + ms
    const response = await bounded(request(url, { ...options, redirect: 'manual', signal: controller.signal }), ms, () => controller.abort())
    check(cleanup)
    if (!response.ok) throw Error('HTTP stage rejected')
    return { response, controller, expiresAt }
  }
  async function json(responseState, cleanup = false) {
    check(cleanup)
    const ms = Math.min(timeout(8000, cleanup), responseState.expiresAt - window.now())
    if (ms <= 0) throw Error('Response budget exhausted')
    const value = await bounded(responseState.response.json(), ms, () => responseState.controller.abort())
    check(cleanup)
    return value
  }
  async function provider(url, options, cleanup = false) {
    check(cleanup); budget.http(1, cleanup); await save(cleanup); check(cleanup)
    return json(await fetchResponse(url, options, cleanup), cleanup)
  }
  function cookieDevice(cookie) {
    const value = cookie.slice(cookie.indexOf('=') + 1), [payload, signature, extra] = value.split('.')
    if (extra || !payload || !signature) throw Error('Invalid owned Cookie')
    const expected = createHmac('sha256', signing).update(payload).digest(), actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw Error('Cookie signing identity mismatch')
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (d.v !== 1 || d.environment !== 'production:https' || !/^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/.test(d.deviceId) ||
      typeof d.clientId !== 'string') throw Error('Unexpected Cookie identity')
    return d
  }
  async function status(origin, jar = null) {
    check(); budget.http(1); await save(); check()
    const state = await fetchResponse(origin + '/api/voice/status', { headers: { Origin: origin, ...(jar ? { Cookie: jar.cookie } : {}) } })
    if ((await json(state)).status !== 'ready') throw Error('Runtime configuration unavailable')
    const setCookie = state.response.headers.get('set-cookie')
    if (!setCookie || !validCookieAttributes(setCookie)) throw Error('Owned Cookie security attributes failed')
    const cookie = setCookie.split(';')[0]
    if (!cookie.startsWith('__Host-lie-device=')) throw Error('Owned HttpOnly Cookie missing')
    const d = cookieDevice(cookie)
    if (jar && (d.deviceId !== jar.mac || d.clientId !== jar.client)) throw Error('Identity changed across approved origins')
    return { cookie, mac: d.deviceId, client: d.clientId, preflightUnbound: false, prepareAttempted: false, bound: false }
  }
  async function initialize(origin, label) {
    if (ledger.jars.length >= 2) throw Error('Device count limit reached')
    const jar = await status(origin); jar.label = label; ledger.jars.push(jar); await save(); check()
    const ota = await provider('https://xrobo.qiniuapi.com/v1/ota/', { method: 'POST', headers: {
      'Content-Type': 'application/json', 'Activation-Version': '1', 'Device-Id': jar.mac, 'Client-Id': jar.client, 'User-Agent': 'lie-browser/1'
    }, body: JSON.stringify({ mac_address: jar.mac, uuid: jar.client, application: { version: '1', elf_sha256: '0'.repeat(64) },
      board: { type: 'lie-browser', ssid: 'web', rssi: 0 } }) })
    if (ota.websocket?.token || !/^\d{6}$/.test(ota.activation?.code ?? '')) throw Error('Candidate was bound or unknown before owned preparation; protected')
    jar.preflightUnbound = true
    // Conservatively charge visible gateway requests too; status itself has no provider HTTP side effect.
    // POST plus up to four provider calls includes uncertain-bind ownership verification; never refund.
    budget.http(5); jar.prepareAttempted = true; jar.prepareUncertain = true; await save(); check()
    const { response } = await fetchResponse(origin + '/api/voice/prepare', { method: 'POST', headers: { Origin: origin, Cookie: jar.cookie } }, false, 20000)
    if (response.status !== 204 || response.headers.has('set-cookie')) throw Error('Preparation contract failed')
    jar.bound = true; jar.prepareUncertain = false; await save(); check(); return jar
  }
  async function connect(origin, jar, replacementOf = null) {
    check(); tick(); check(); budget.ws(); await save(); tick(); check()
    if (budget.c.socketMs >= 88000) throw Error('Aggregate close reserve reached before dial')
    if (replacementOf && (replacementOf.closed || replacementOf.ws.readyState !== Socket.OPEN)) throw Error('Old socket not open immediately before replacement dial')
    const startedAt = window.now()
    if (replacementOf) { replacementOf.replacementStartedAt = startedAt; replacementOf.openBeforeReplacementDial = true }
    // The save above can consume the remaining window. No constructor may precede this final check.
    check()
    const handshakeTimeout = timeout(10000)
    const ws = new Socket(origin.replace(/^https:/, 'wss:') + '/api/voice', {
      headers: { Origin: origin, Cookie: jar.cookie }, handshakeTimeout, followRedirects: false
    })
    const item = { ws, hello: false, tools: false, closed: false, code: null, terminated: false, callerClose: false,
      limitClose: false, startedAt, closedAt: null, replacementStartedAt: null, openBeforeReplacementDial: false, unexpectedClose: false }
    tick(); budget.c.socketMs += window.now() - startedAt; allChannels.push(item); live.add(item); scheduleAggregate()
    let readyReject = null
    item.closedPromise = new Promise(resolve => ws.once('close', code => {
      tick(); live.delete(item); item.closed = true; item.code = code; item.closedAt = window.now(); timers.clearTimeout(item.timer)
      if (code !== 1000 || item.terminated) ledger.normalClose = false
      const expectedReplacement = item.openBeforeReplacementDial && item.replacementStartedAt != null && code === 1000 &&
        !item.callerClose && !item.limitClose && !item.terminated && item.closedAt >= item.replacementStartedAt
      if (!item.callerClose && !item.limitClose && !expectedReplacement) { item.unexpectedClose = true; fail('Unexpected socket closure') }
      if (!item.hello || !item.tools) readyReject?.(Error('Closed before hello/MCP'))
      resolve(); scheduleAggregate(); void save(true).catch(() => fail('Ledger persistence failed'))
    }))
    item.timer = timers.setTimeout(() => { item.limitClose = true; stopAll('Approved per-socket close reserve') }, timeout(14000))
    await new Promise((resolve, reject) => {
      readyReject = reject
      const timer = timers.setTimeout(() => { fail('Hello/MCP deadline'); reject(Error('Hello/MCP deadline')) }, timeout(10000))
      const settle = (error = null) => { timers.clearTimeout(timer); if (error) { fail(error.message); reject(error) } else resolve() }
      const done = () => { if (item.hello && item.tools) settle() }
      ws.on('error', () => { fail('WebSocket transport rejected'); settle(Error('WebSocket transport rejected')); stopAll('WebSocket transport rejected') })
      ws.once('close', () => { timers.clearTimeout(timer); if (!item.hello || !item.tools) settle(Error('Closed before hello/MCP')) })
      ws.on('open', () => {
        try {
          check()
          ws.send(JSON.stringify({ type: 'hello', version: 1, features: { mcp: true }, transport: 'websocket',
            audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } }))
        } catch { settle(Error('Hello send stopped')); stopAll('Hello send stopped') }
      })
      ws.on('message', (bytes, binary) => {
        const unexpected = reason => { ledger.unexpectedFrames = (ledger.unexpectedFrames ?? 0) + 1; settle(Error(reason)); stopAll(reason) }
        if (binary) { unexpected('Unexpected generated binary'); return }
        let m
        try { m = JSON.parse(String(bytes)) } catch { unexpected('Invalid protocol JSON'); return }
        if (m?.type === 'tts') { unexpected('Unexpected generated TTS'); return }
        if (m?.type === 'hello') {
          if (!validHello(m)) { unexpected('Invalid hello'); return }
          item.hello = true; done()
        }
        if (m?.type === 'mcp' && m.payload?.method) {
          const p = m.payload; let result
          if (p.method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'lie-owned-api-acceptance', version: '2' } }
          else if (p.method === 'tools/list') result = { tools: [{ name: 'self.lie_character_context', description: 'No inference in this acceptance', inputSchema: { type: 'object', properties: {} } }] }
          else { unexpected('Unauthorized MCP method'); return }
          try { check(); ws.send(JSON.stringify({ type: 'mcp', payload: { jsonrpc: '2.0', id: p.id, result } })) }
          catch { unexpected('MCP response stopped'); return }
          if (p.method === 'tools/list') item.tools = true
          done()
        }
      })
    })
    check(); return item
  }
  async function close(item) {
    if (!item.closed) {
      item.callerClose = true
      try { item.ws.close(1000, 'Owned acceptance complete') } catch { item.terminated = true; try { item.ws.terminate() } catch {} }
    }
    if (!item.closed) await bounded(item.closedPromise, timeout(1800, true)).catch(() => {})
    if (!item.closed) {
      item.terminated = true; ledger.normalClose = false
      try { item.ws.terminate() } catch {}
      await bounded(item.closedPromise, timeout(500, true)).catch(() => {})
    }
    if (!item.closed || item.code !== 1000 || item.terminated) { ledger.normalClose = false; throw Error('Owned socket normal close unconfirmed') }
  }
  async function closeAll() {
    await Promise.all(allChannels.map(item => close(item).catch(() => { ledger.normalClose = false })))
    tick(); await save(true)
  }
  async function cleanup() {
    await closeAll()
    if (ledger.normalClose === false) throw Error('Normal socket close not confirmed before unbind')
    for (const jar of ledger.jars) {
      if (!canUnbind(jar)) continue
      const value = await provider('https://xrobo.qiniu.com/xiaozhi/device/unbind', { method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: jar.mac }) }, true)
      if (value.code !== 0) throw Error('Owned unbind unconfirmed')
      jar.cleaned = true; jar.bound = false; await save(true); check(true)
    }
    if (ledger.jars.some(j => j.prepareUncertain) || !ledger.jars.every(j => j.cleaned)) throw Error('Uncertain or protected candidate retained; cleanup incomplete')
  }
  async function run(mode, target) {
    if (running) throw Error('API runner already in use')
    running = true
    ledger = null; budget = null; allChannels.length = 0; live.clear(); priorChannels = []; phaseUsed = 0
    let clock, normalStop, hardStop
    try {
      if (!['candidate', 'smoke', 'cleanup'].includes(mode)) throw Error('Unknown API phase')
      const origin = mode === 'cleanup' ? null : new URL(target).origin
      if (mode === 'candidate' && !/^https:\/\/[a-f0-9]{8}-lie-game\.nighca\.workers\.dev$/.test(origin) &&
        !(productionCandidate && origin === 'https://lie.agency')) throw Error('Unexpected candidate origin')
      if (mode === 'smoke' && origin !== 'https://lie.agency') throw Error('Unexpected production origin')
      inCleanup = mode === 'cleanup'; failure = null; phaseStart = window.now(); cleanupDeadline = inCleanup ? Math.min(window.endMs, window.now() + 60000) : Infinity
      check(inCleanup)
      key = (await bounded(io.readFile(paths.key, 'utf8'), timeout(5000, inCleanup))).trim()
      signing = await bounded(io.readFile(paths.signing, 'utf8'), timeout(5000, inCleanup))
      check(inCleanup)
      if (mode === 'candidate') {
        ledger = { version: 2, windowId: window.id, startedAt: new Date(window.now()).toISOString(), origin, jars: [], counters: {}, normalClose: true, phaseUsed: 0 }
        await bounded(io.writeFile(paths.ledger, JSON.stringify(ledger), { flag: 'wx', mode: 0o600 }), timeout(5000))
      } else ledger = JSON.parse(await bounded(io.readFile(paths.ledger, 'utf8'), timeout(5000, inCleanup)))
      if (ledger.windowId !== window.id || !Array.isArray(ledger.jars)) throw Error('Ledger belongs to another approved window')
      priorChannels = ledger.channels ?? []; allChannels.length = 0; live.clear(); budget = new Budget(ledger.counters)
      phaseUsed = ledger.phaseUsed ?? 0; lastTick = window.now(); check(inCleanup)
      if (!inCleanup && ledger.fatal) throw Error('Prior fatal phase requires review')
      clock = timers.setInterval(() => { tick(); void save(true).catch(() => fail('Ledger persistence failed')) }, 250)
      if (!inCleanup) normalStop = timers.setTimeout(() => stopAll('Approved normal window ended'), Math.max(0, window.closeAtMs - window.now()))
      hardStop = timers.setTimeout(() => {
        fail('Approved hard window ended')
        for (const item of live) { item.limitClose = true; item.terminated = true; try { item.ws.terminate() } catch {} }
      }, Math.max(0, window.endMs - window.now()))
      if (mode === 'candidate') {
        const a = await initialize(origin, 'A'), b = await initialize(origin, 'B')
        const a1 = await connect(origin, a), b1 = await connect(origin, b), a2 = await connect(origin, a, a1)
        await bounded(a1.closedPromise, timeout(1500))
        check()
        if (!replacementProven(a1, a2) || b1.closed || a2.closed) throw Error('Provider identity replacement/isolation failed')
        await closeAll(); check()
        if (ledger.normalClose === false || ledger.unexpectedFrames || ledger.fatal) throw Error('Silent normal-close acceptance failed')
        ledger.candidatePassed = true
      } else if (mode === 'smoke') {
        const old = ledger.jars[0]
        if (!ledger.candidatePassed || !old || old.cleaned) throw Error('Owned candidate identity unavailable')
        const jar = await status(origin, old)
        await close(await connect(origin, jar)); check(); ledger.productionPassed = true
      } else await cleanup()
      if (!inCleanup && (ledger.unexpectedFrames || ledger.normalClose === false || ledger.fatal)) throw Error('Unexpected output or abnormal closure')
      ledger.phaseUsed = phaseUsed + window.now() - phaseStart; await save(inCleanup); check(inCleanup)
      return { phase: mode, passed: true, deviceCount: ledger.jars.length, uncertainPreparations: ledger.jars.filter(j => j.prepareUncertain).length,
        counters: { ...budget.c }, normalClose: ledger.normalClose, allOwnedBindingsRemoved: ledger.jars.every(j => j.cleaned) }
    } catch (error) { fail('API phase failed'); throw error }
    finally {
      timers.clearInterval(clock); timers.clearTimeout(normalStop); timers.clearTimeout(hardStop); timers.clearTimeout(aggregateTimer)
      if (ledger && budget) {
        if (!inCleanup) { inCleanup = true; cleanupDeadline = Math.min(window.endMs, window.now() + 60000) }
        try { await closeAll(); ledger.phaseUsed = phaseUsed + window.now() - phaseStart; await save(true) }
        catch { fail('Final close or persistence unconfirmed'); for (const item of live) { item.terminated = true; try { item.ws.terminate() } catch {} } }
      }
      key = null; signing = null; running = false
    }
  }
  return { run }
}

export async function run(mode, target, window) { return createApiRunner({ window }).run(mode, target) }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length !== 5 || args[2] !== '--window-file' || args[4] !== '--approved-20261101') throw Error('Explicit approved window and API flag required')
  const path = windowFileArgument(args)
  readWindow(path).then(window => run(args[0], args[1], window)).then(value => console.log(JSON.stringify(value)))
    .catch(() => { console.error('API acceptance stopped; private ledger preserved; cleanup/owner review required'); process.exitCode = 1 })
}
