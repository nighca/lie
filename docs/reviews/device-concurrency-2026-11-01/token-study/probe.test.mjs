import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { otaTargetProjection, runApproved, tokenProjection } from './probe.mjs'

test('safe token and OTA target projections never include opaque identities or full claims', () => {
  const payload = Buffer.from(JSON.stringify({ iat: 100, exp: 200, subject: 'PRIVATE-SUBJECT', device: 'PRIVATE-DEVICE' })).toString('base64url')
  const result = tokenProjection(`header.${payload}.PRIVATE-SIGNATURE`)
  assert.deepEqual(result, { format: 'jwt-like', signatureVerified: false, iat: 100, exp: 200, declaredLifetimeSeconds: 100 })
  assert.equal(JSON.stringify(result).includes('PRIVATE'), false)
  assert.equal(tokenProjection('PRIVATE-OPAQUE').format, 'opaque')
  assert.equal(tokenProjection('header.W10.signature').format, 'opaque')
  assert.deepEqual(otaTargetProjection('ws://xrobo-io.qiniuapi.com/v1/ws/'), {
    scheme: 'ws', officialHost: true, officialPath: true, hasQuery: false, hasUserInfo: false, hasNonDefaultPort: false
  })
  const unsafe = otaTargetProjection('https://user:PRIVATE@evil.example/path?token=PRIVATE')
  assert.equal(unsafe.hasQuery, true)
  assert.equal(unsafe.officialHost, false)
  assert.equal(JSON.stringify(unsafe).includes('PRIVATE'), false)
  assert.equal(otaTargetProjection('PRIVATE-SCHEME://host').scheme, 'other')
  assert.equal(otaTargetProjection('invalid url').scheme, 'invalid')
})

test('specific turn is required before any credential read or network call', async () => {
  let touched = false
  await assert.rejects(runApproved({ readKey: async () => { touched = true }, request: async () => { touched = true } }), /execution turn/)
  assert.equal(touched, false)
})

async function fixture({ rejectD2 = false, loseD2Bind = false, failClose = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'lie-token-study-offline-'))
  try {
  const calls = [], bound = [], sockets = []
  let otaCount = 0
  const token = 'PRIVATE-FAKE-TOKEN'
  class Socket extends EventEmitter {
    static OPEN = 1
    static CLOSED = 3
    readyState = 0
    constructor(url, options) {
      super()
      this.url = url
      this.options = options
      this.sent = []
      sockets.push(this)
      queueMicrotask(() => {
        if (rejectD2 && sockets.length === 2) {
          this.readyState = 3
          this.emit('error', new Error('PRIVATE-PROVIDER-ERROR'))
          this.emit('close', 1008)
          return
        }
        this.readyState = 1
        this.emit('open')
      })
    }
    send(raw) {
      const value = JSON.parse(raw)
      this.sent.push(value)
      assert.equal(value.type, 'hello')
      queueMicrotask(() => this.emit('message', Buffer.from(JSON.stringify({ type: 'hello', session_id: `PRIVATE-SESSION-${sockets.indexOf(this)}`,
        audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } })), false))
    }
    close() {
      if (failClose) return
      this.readyState = 3
      queueMicrotask(() => this.emit('close', 1000))
    }
    terminate() {
      this.readyState = 3
      queueMicrotask(() => this.emit('close', 1006))
    }
  }
  async function request(url, options) {
    const body = options.body == null ? null : JSON.parse(options.body)
    calls.push({ url, options, body })
    let data
    if (url === 'https://xrobo.qiniu.com/xiaozhi/agent' && options.method === 'POST') data = { code: 0, data: 'PRIVATE-AGENT' }
    else if (url.endsWith('/xiaozhi/agent/PRIVATE-AGENT') && options.method === 'GET') data = { code: 0, data: {
      memModelId: 'Memory_nomem', chatHistoryConf: 0, extra: JSON.stringify({ disable_greeting: true, llm: { max_tokens: 160, enable_search: false } })
    } }
    else if (url === 'https://xrobo.qiniuapi.com/v1/ota/') {
      otaCount++
      data = otaCount === 2 ? { websocket: { token, url: 'ws://xrobo-io.qiniuapi.com/v1/ws/' } } : { activation: { code: '123456' } }
    } else if (url.includes('/device/bind/')) {
      if (loseD2Bind && bound.length === 1) throw new Error('PRIVATE-NETWORK-ERROR')
      bound.push(url)
      data = { code: 0 }
    } else data = { code: 0 }
    return { status: 200, ok: true, async json() { return data } }
  }
  const resultPath = join(directory, 'report.json')
  const privateDir = join(directory, 'private')
  const result = await runApproved({ approval: 'dedicated-token-share-turn-approved', keyPath: 'unused-offline', privateDir, resultPath,
    readKey: async () => 'PRIVATE-MANAGEMENT-KEY', WebSocket: Socket, request, waitMs: async () => {} })
  const reportText = await readFile(resultPath, 'utf8')
  const state = JSON.parse(await readFile(join(privateDir, 'state.json'), 'utf8'))
  assert.equal(reportText.includes('PRIVATE'), false)
  assert.equal(/02:(?:[0-9a-f]{2}:){4}[0-9a-f]{2}/i.test(reportText), false)
  assert.equal(JSON.stringify(state).includes('PRIVATE-FAKE-TOKEN'), false)
  assert.equal(JSON.stringify(state).includes('PRIVATE-MANAGEMENT-KEY'), false)
  assert.equal((await stat(join(privateDir, 'state.json'))).mode & 0o777, 0o600)
  return { result, calls, sockets, otaCount, state, token }
  } finally { await rm(directory, { recursive: true, force: true }) }
}

test('offline full path uses one T1 with different Device headers and exactly bounded requests', async () => {
  const { result, calls, sockets, otaCount, state, token } = await fixture()
  assert.equal(result.completed, true)
  assert.equal(result.crossDeviceAccepted, true)
  assert.equal(result.concurrentSameToken, true)
  assert.equal(result.distinctSessions, true)
  assert.equal(result.cleanup.resourcesRemoved, true)
  assert.equal(result.cleanup.allSocketClosesNormal, true)
  assert.equal(calls.length, 11)
  assert.equal(otaCount, 3)
  assert.equal(sockets.length, 2)
  assert.equal(sockets[0].options.headers.Authorization, `Bearer ${token}`)
  assert.equal(sockets[1].options.headers.Authorization, `Bearer ${token}`)
  assert.notEqual(sockets[0].options.headers['Device-Id'], sockets[1].options.headers['Device-Id'])
  assert.ok(sockets.every(s => s.url === 'wss://xrobo-io.qiniuapi.com/v1/ws/' && s.sent.length === 1 && s.sent[0].type === 'hello'))
  assert.equal(state.agentId, null)
  assert.ok(state.devices.every(d => !d.bound && !d.uncertain))
  assert.equal(state.cleanupComplete, true)
})

test('cross-device rejection is a failed sample with no fallback T2 or retry', async () => {
  const { result, calls, sockets, otaCount } = await fixture({ rejectD2: true })
  assert.equal(result.completed, false)
  assert.equal(result.crossDeviceAccepted, false)
  assert.equal(result.concurrentSameToken, false)
  assert.equal(result.cleanup.resourcesRemoved, true)
  assert.equal(sockets.length, 2)
  assert.equal(otaCount, 3)
  assert.equal(calls.length, 11)
})

test('unknown binding response preserves ownership state and does not delete Agent or create replacements', async () => {
  const { result, calls, sockets, otaCount, state } = await fixture({ loseD2Bind: true })
  assert.equal(result.completed, false)
  assert.equal(result.cleanup.resourcesRemoved, false)
  assert.equal(sockets.length, 0)
  assert.equal(otaCount, 3)
  assert.equal(calls.filter(c => c.options.method === 'DELETE').length, 0)
  assert.equal(state.devices.length, 2)
  assert.equal(state.devices[1].uncertain, true)
  assert.equal(state.devices[1].bindAttempted, true)
  assert.notEqual(state.agentId, null)
  assert.equal(state.cleanupComplete, false)
})

test('local termination fallback is preserved and cannot yield successful normal-close sample', async () => {
  const { result, sockets } = await fixture({ failClose: true })
  assert.equal(result.completed, false)
  assert.equal(result.concurrentSameToken, true)
  assert.equal(result.cleanup.allSocketsClosed, true)
  assert.equal(result.cleanup.allSocketClosesNormal, false)
  assert.equal(result.cleanup.resourcesRemoved, true)
  assert.ok(result.channels.every(c => c.terminated && c.closeCode === 1006))
  assert.ok(sockets.every(s => s.readyState === 3))
})
