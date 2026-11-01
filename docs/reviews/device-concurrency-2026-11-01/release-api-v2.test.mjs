import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

import { createWindow } from './release-window-v2.mjs'
import { Budget, createApiRunner, canUnbind, replacementProven, validHello, validCookieAttributes } from './release-api-v2.mjs'
import { verify } from './release-api-simple.mjs'

class Clock {
  time = 1800000000000
  next = 1
  jobs = new Map()
  setTimeout = (fn, delay) => { const id = this.next++; this.jobs.set(id, { fn, at: this.time + delay }); return id }
  clearTimeout = id => this.jobs.delete(id)
  setInterval = (fn, delay) => { const id = this.next++; this.jobs.set(id, { fn, at: this.time + delay, interval: delay }); return id }
  clearInterval = id => this.jobs.delete(id)
  advance(ms) {
    const end = this.time + ms
    while (true) {
      const next = [...this.jobs].filter(([, j]) => j.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      const [id, job] = next; this.time = job.at; this.jobs.delete(id)
      if (job.interval) this.jobs.set(id, { ...job, at: this.time + job.interval })
      job.fn()
    }
    this.time = end
  }
}
const drain = async () => { for (let i = 0; i < 150; i++) await Promise.resolve() }

function fixture({ earlyClose = false, unknownPrepare = false, crossSave = false, neverUnbind = false, duration = 600000 } = {}) {
  const clock = new Clock(), start = clock.time
  const window = createWindow({ id: 'fake-window', start: new Date(start).toISOString(), end: new Date(start + duration).toISOString() }, () => clock.time)
  const files = new Map([['key', 'synthetic-key'], ['signing', 'synthetic-signing']]), requests = [], sockets = [], active = new Map()
  let identities = 0, crossed = false
  const cookie = n => {
    const payload = Buffer.from(JSON.stringify({ v: 1, environment: 'production:https', deviceId: `02:00:00:00:00:0${n}`, clientId: `fake-client-${n}` })).toString('base64url')
    return `__Host-lie-device=${payload}.${createHmac('sha256', 'synthetic-signing').update(payload).digest('base64url')}`
  }
  const io = {
    async readFile(path) { if (!files.has(path)) throw Error('Missing synthetic file'); return files.get(path) },
    async writeFile(path, value, options = {}) {
      if (options.flag === 'wx' && files.has(path)) throw Error('Existing synthetic file')
      files.set(path, value)
      const row = JSON.parse(value)
      if (crossSave && !crossed && row.counters?.logical === 1 && !(row.channels?.length)) { crossed = true; clock.time = window.closeAtMs + 1 }
    },
    async rename(from, to) { files.set(to, files.get(from)); files.delete(from) }
  }
  const response = (data, status = 200, headers = {}) => ({ ok: status >= 200 && status < 300, status,
    headers: new Headers(headers), async json() { return data } })
  async function request(url, options) {
    requests.push({ url, options, at: clock.time })
    if (url.endsWith('/api/voice/status')) return response({ status: 'ready' }, 200, { 'set-cookie': `${options.headers.Cookie ?? cookie(++identities)}; Path=/; HttpOnly; SameSite=Lax; Secure` })
    if (url.endsWith('/api/voice/prepare')) return unknownPrepare ? new Promise(() => {}) : response(null, 204)
    if (url.endsWith('/v1/ota/')) return response({ activation: { code: '123456' } })
    if (url.endsWith('/xiaozhi/device/unbind')) return neverUnbind ? new Promise(() => {}) : response({ code: 0 })
    throw Error('Unexpected synthetic request')
  }
  class Socket {
    static OPEN = 1
    readyState = 0
    handlers = new Map()
    constructor(url, options) {
      this.url = url; this.options = options; this.sent = []; sockets.push(this)
      const old = active.get(options.headers.Cookie); active.set(options.headers.Cookie, this)
      queueMicrotask(() => {
        if (old && old.readyState === 1) old.finish(1000)
        this.readyState = 1; this.emit('open')
      })
    }
    on(name, fn) { const list = this.handlers.get(name) ?? []; list.push(fn); this.handlers.set(name, list); return this }
    once(name, fn) { const wrapped = (...args) => { this.handlers.set(name, (this.handlers.get(name) ?? []).filter(x => x !== wrapped)); fn(...args) }; return this.on(name, wrapped) }
    emit(name, ...args) { for (const fn of [...(this.handlers.get(name) ?? [])]) fn(...args) }
    send(raw) {
      const m = JSON.parse(raw); this.sent.push(m)
      assert.ok(['hello', 'mcp'].includes(m.type))
      if (m.type === 'mcp' && m.payload.id === 'initialize') {
        assert.equal(m.payload.result.serverInfo?.name, 'lie-owned-api-acceptance')
        assert.equal(m.payload.result.clientInfo, undefined)
      }
      if (m.type === 'hello') queueMicrotask(() => {
        this.emit('message', Buffer.from(JSON.stringify({ type: 'hello', transport: 'websocket', session_id: `synthetic-${sockets.indexOf(this)}`,
          audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } })), false)
        for (const method of ['initialize', 'tools/list']) this.emit('message', Buffer.from(JSON.stringify({ type: 'mcp', payload: { id: method, method } })), false)
        if (earlyClose && sockets.length === 2) sockets[0].finish(1000)
      })
    }
    finish(code) { if (this.readyState === 3) return; this.readyState = 3; this.emit('close', code) }
    close() { queueMicrotask(() => this.finish(1000)) }
    terminate() { queueMicrotask(() => this.finish(1006)) }
  }
  const runner = createApiRunner({ window, io, request, Socket, timers: clock, paths: { key: 'key', signing: 'signing', ledger: 'ledger' } })
  const ledger = () => JSON.parse(files.get('ledger'))
  const seed = () => files.set('ledger', JSON.stringify({ version: 2, windowId: window.id, candidatePassed: true, normalClose: true, phaseUsed: 0,
    counters: { http: 19, logical: 4, upgrades: 8, socketMs: 10000 }, jars: [{ cookie: cookie(1), mac: '02:00:00:00:00:01', client: 'fake-client-1',
      preflightUnbound: true, prepareAttempted: true, bound: true, prepareUncertain: false, cleaned: false }] }))
  return { clock, window, files, requests, sockets, runner, ledger, seed,
    dependencies: { now: () => clock.time, io, request, Socket, timers: clock, paths: { key: 'key', signing: 'signing', ledger: 'ledger' } } }
}

test('window timeout uses all minima and never spends the final 61 seconds on normal work', () => {
  const f = fixture()
  assert.equal(f.window.timeout(10000, { phaseRemaining: 1200 }), 1200)
  f.clock.time = f.window.endMs - 62000
  assert.equal(f.window.timeout(10000), 1000)
  assert.equal(f.window.timeout(10000, { cleanup: true, cleanupRemaining: 300 }), 300)
  f.clock.time = f.window.closeAtMs
  assert.throws(() => f.window.assertActive(), /Outside/)
  assert.equal(f.window.remaining(true), 61000)
})

test('same ledger preserves 24/6/12/90 limits and four cleanup HTTP reservations', () => {
  const b = new Budget({ http: 14 })
  for (let i = 0; i < 6; i++) b.ws()
  assert.deepEqual(b.c, { http: 20, logical: 6, upgrades: 12, socketMs: 0 })
  assert.throws(() => b.ws(), /WS budget/)
  assert.throws(() => b.http(1), /HTTP budget/)
  b.http(4, true); assert.throws(() => b.http(1, true), /HTTP budget/)
  assert.throws(() => new Budget({ socketMs: 90000 }).ws(), /WS budget/)
})

test('purefake candidate, production smoke and cleanup share budgets and preserve silence/close evidence', async () => {
  const f = fixture()
  const candidate = await f.runner.run('candidate', 'https://1234abcd-lie-game.nighca.workers.dev')
  assert.equal(candidate.passed, true)
  assert.equal(candidate.counters.http, 17)
  assert.equal(f.ledger().channels.length, 3)
  const smoke = await f.runner.run('smoke', 'https://lie.agency')
  assert.equal(smoke.counters.http, 19)
  assert.equal(smoke.counters.logical, 4)
  assert.equal(smoke.counters.upgrades, 8)
  const cleanup = await f.runner.run('cleanup', '-')
  assert.equal(cleanup.counters.http, 21)
  assert.equal(cleanup.allOwnedBindingsRemoved, true)
  assert.equal(f.ledger().channels.length, 4)
  assert.ok(f.ledger().channels.every(c => c.closeCode === 1000 && !c.terminated))
  assert.ok(f.sockets.every(s => s.sent.every(m => m.type !== 'listen') && s.readyState === 3))
  assert.equal(f.requests.filter(r => r.url.endsWith('/xiaozhi/device/unbind')).length, 2)
})

test('a save crossing closeAt prevents the first Socket constructor after its budget reservation', async () => {
  const f = fixture({ crossSave: true })
  await assert.rejects(f.runner.run('candidate', 'https://1234abcd-lie-game.nighca.workers.dev'))
  assert.equal(f.sockets.length, 0)
  assert.equal(f.ledger().counters.logical, 1)
})

test('natural early close is fatal and persisted instead of being relabeled a replacement', async () => {
  const f = fixture({ earlyClose: true })
  await assert.rejects(f.runner.run('candidate', 'https://1234abcd-lie-game.nighca.workers.dev'))
  assert.equal(f.sockets.length, 2)
  assert.equal(f.ledger().channels[0].unexpectedClose, true)
  assert.equal(f.ledger().channels[0].openBeforeReplacementDial, false)
  assert.notEqual(f.ledger().candidatePassed, true)
})

test('unknown prepare keeps its identity protected from automatic cleanup without new requests', async () => {
  const f = fixture({ unknownPrepare: true })
  const pending = f.runner.run('candidate', 'https://1234abcd-lie-game.nighca.workers.dev')
  const rejected = assert.rejects(pending)
  await drain(); f.clock.advance(20001); await drain(); await rejected
  assert.equal(f.ledger().jars[0].prepareUncertain, true)
  const before = f.requests.length
  await assert.rejects(f.runner.run('cleanup', '-'), /cleanup incomplete/)
  assert.equal(f.requests.length, before)
  assert.equal(f.sockets.length, 0)
})

test('cleanup is bounded by the window hard end, never a fresh sixty seconds beyond it', async () => {
  const f = fixture({ neverUnbind: true, duration: 2000 }); f.seed()
  const rejected = assert.rejects(f.runner.run('cleanup', '-'))
  await drain(); f.clock.advance(2000); await drain(); await rejected
  assert.equal(f.requests.length, 1)
  assert.equal(f.requests[0].options.signal.aborted, true)
  assert.equal(f.ledger().jars[0].cleaned, false)
})

test('hello, Cookie security and replacement cause checks retain the original safeguards', () => {
  assert.equal(validHello({ transport: 'websocket', session_id: 'synthetic', audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } }), true)
  assert.equal(validCookieAttributes('x; Secure; HttpOnly; SameSite=Lax; Path=/'), true)
  assert.equal(validCookieAttributes('x; HttpOnly; SameSite=Lax; Path=/'), false)
  const old = { closed: true, code: 1000, closedAt: 20, replacementStartedAt: 10, openBeforeReplacementDial: true }
  assert.equal(replacementProven(old, { startedAt: 10 }), true)
  assert.equal(replacementProven({ ...old, openBeforeReplacementDial: false }, { startedAt: 10 }), false)
  assert.equal(replacementProven({ ...old, limitClose: true }, { startedAt: 10 }), false)
  assert.equal(canUnbind({ preflightUnbound: true, prepareAttempted: true, bound: true, prepareUncertain: true }), false)
})

test('direct production verify uses no candidate prerequisite and automatically cleans only confirmed owned identities', async () => {
  const f = fixture()
  const result = await verify('https://lie.agency', f.dependencies)
  assert.equal(result.passed, true)
  assert.equal(result.verification.counters.logical, 3)
  assert.equal(result.cleanup.counters.http, 19)
  assert.equal(result.cleanup.allOwnedBindingsRemoved, true)
  assert.equal(f.sockets.length, 3)
  assert.ok(f.requests.filter(r => r.url.includes('/api/')).every(r => r.url.startsWith('https://lie.agency/')))
})
