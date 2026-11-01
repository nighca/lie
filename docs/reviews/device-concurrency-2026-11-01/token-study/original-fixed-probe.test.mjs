import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import { readAuthorizedSource, runOriginalFixed } from './original-fixed-probe.mjs'

test('source authorization and a separate execution turn precede all credential and network reads', async () => {
  let touched = false
  await assert.rejects(runOriginalFixed({ sourceApproval: 'local-main-dev-vars-token-and-agent-only',
    configPath: '/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars', loadSource: async () => { touched = true }, request: async () => { touched = true } }), /execution turn/)
  assert.equal(touched, false)
})

test('line parser selects only token and Agent fields while discarding unrelated malformed values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lie-fixed-source-offline-'))
  try {
    const path = join(dir, 'synthetic.vars')
    await writeFile(path, 'LINX_DEVICE_ID={unparsed-invalid-json\nOTHER_TOKEN=PRIVATE-DECOY\nLINX_WS_TOKEN="PRIVATE-FIXED-TOKEN"\nLINX_AGENT_ID=abcdefabcdefabcdefabcdefabcdefab\n', { mode: 0o600 })
    assert.deepEqual(await readAuthorizedSource(path), { token: 'PRIVATE-FIXED-TOKEN', agentId: 'abcdefabcdefabcdefabcdefabcdefab' })
    await writeFile(path, 'LINX_WS_TOKEN=a\nLINX_WS_TOKEN=b\nLINX_AGENT_ID=abcdefabcdefabcdefabcdefabcdefab\n')
    await assert.rejects(readAuthorizedSource(path), /Duplicate approved/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

async function fixture({ greeting = true, loseBind = false, rejectToken = false, tts = false, failClose = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'lie-original-fixed-offline-'))
  try {
    const calls = [], sockets = []
    const targetAgent = 'abcdefabcdefabcdefabcdefabcdefab'
    class Socket extends EventEmitter {
      static OPEN = 1
      static CLOSED = 3
      readyState = 0
      constructor(url, options) {
        super(); this.url = url; this.options = options; this.sent = []; sockets.push(this)
        queueMicrotask(() => {
          if (rejectToken) {
            this.readyState = 3
            this.emit('unexpected-response', {}, { statusCode: 401, resume() {} })
            this.emit('close', 1008)
          } else { this.readyState = 1; this.emit('open') }
        })
      }
      send(raw) {
        const message = JSON.parse(raw)
        assert.equal(message.type, 'hello')
        this.sent.push(message)
        queueMicrotask(() => {
          this.emit('message', Buffer.from(JSON.stringify({ type: 'hello', session_id: 'PRIVATE-SESSION',
            audio_params: { format: 'pcm', sample_rate: 16000, channels: 1 } })), false)
          if (tts) this.emit('message', Buffer.from(JSON.stringify({ type: 'tts', text: 'PRIVATE-AUTOMATIC-GREETING' })), false)
        })
      }
      close() { if (!failClose) { this.readyState = 3; queueMicrotask(() => this.emit('close', 1000)) } }
      terminate() { this.readyState = 3; queueMicrotask(() => this.emit('close', 1006)) }
    }
    const privateDir = join(dir, 'private'), resultPath = join(dir, 'report.json')
    const result = await runOriginalFixed({ approval: 'original-fixed-token-one-device-turn-approved',
      sourceApproval: 'local-main-dev-vars-token-and-agent-only', configPath: '/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars',
      keyPath: '/Users/nighca/code/nighca/lie/.linx-api-key', privateDir, resultPath, WebSocket: Socket,
      loadSource: async () => ({ token: 'PRIVATE-ORIGINAL-FIXED-TOKEN', agentId: targetAgent }),
      readKey: async () => 'PRIVATE-MANAGEMENT-KEY', waitMs: async () => {}, request: async (url, options) => {
        calls.push({ url, options })
        let data
        if (options.method === 'GET') data = { code: 0, data: { extra: JSON.stringify({ disable_greeting: greeting, other: 'PRIVATE-CONFIG' }) } }
        else if (url === 'https://xrobo.qiniuapi.com/v1/ota/') data = { activation: { code: '123456' } }
        else if (loseBind && url.includes('/device/bind/')) throw Object.assign(new Error('PRIVATE-NETWORK'), { code: 'ETIMEDOUT' })
        else data = { code: 0 }
        return { status: 200, ok: true, async json() { return data } }
      } })
    const stateText = await readFile(join(privateDir, 'state.json'), 'utf8')
    const state = JSON.parse(stateText)
    const report = await readFile(resultPath, 'utf8')
    assert.equal(report.includes('PRIVATE'), false)
    assert.equal(report.includes(targetAgent), false)
    assert.equal(/02:(?:[0-9a-f]{2}:){4}[0-9a-f]{2}/i.test(report), false)
    assert.equal(stateText.includes('PRIVATE-ORIGINAL-FIXED-TOKEN'), false)
    assert.equal(stateText.includes('PRIVATE-MANAGEMENT-KEY'), false)
    assert.equal((await stat(join(privateDir, 'state.json'))).mode & 0o777, 0o600)
    assert.ok(calls.every(c => c.options.method !== 'PUT' && c.options.method !== 'DELETE'))
    return { result, state, calls, sockets, targetAgent }
  } finally { await rm(dir, { recursive: true, force: true }) }
}

test('one new Device uses original fixed token; only read/OTA/bind/unbind are requested', async () => {
  const { result, state, calls, sockets, targetAgent } = await fixture()
  assert.equal(result.completed, true)
  assert.equal(calls.length, 4)
  assert.equal(calls.filter(c => c.url === 'https://xrobo.qiniuapi.com/v1/ota/').length, 1)
  assert.equal(sockets.length, 1)
  assert.equal(sockets[0].options.headers.Authorization, 'Bearer PRIVATE-ORIGINAL-FIXED-TOKEN')
  assert.equal(sockets[0].options.headers['X-Agent-ID'], targetAgent)
  assert.equal(sockets[0].url, 'wss://xrobo-io.qiniuapi.com/v1/ws/')
  assert.equal(sockets[0].sent.length, 1)
  assert.equal(state.targetAgentId, targetAgent)
  assert.equal(state.device.bound, false)
  assert.equal(state.cleanupComplete, true)
  assert.equal(result.cleanup.normalClose, true)
})

test('possible or unknown greeting stops after the single read without new Device or config mutation', async () => {
  for (const greeting of [false, null]) {
    const { result, state, calls, sockets } = await fixture({ greeting })
    assert.equal(result.completed, false)
    assert.equal(calls.length, 1)
    assert.equal(state.device, null)
    assert.equal(sockets.length, 0)
  }
})

test('unknown bind result is preserved without replacement Device, retry, or speculative unbind', async () => {
  const { result, state, calls, sockets } = await fixture({ loseBind: true })
  assert.equal(result.completed, false)
  assert.equal(calls.length, 3)
  assert.equal(result.operations[2].errorCode, 'ETIMEDOUT')
  assert.equal(sockets.length, 0)
  assert.equal(state.device.bindAttempted, true)
  assert.equal(state.device.uncertain, true)
  assert.equal(state.cleanupComplete, false)
  assert.equal(result.cleanup.ownedBindingCleared, false)
})

test('original token rejection records 401 without fetching a replacement token or retrying WS', async () => {
  const { result, state, calls, sockets } = await fixture({ rejectToken: true })
  assert.equal(result.completed, false)
  assert.equal(result.channel.unexpectedUpgradeStatus, 401)
  assert.equal(calls.length, 4)
  assert.equal(sockets.length, 1)
  assert.equal(state.device.bound, false)
  assert.equal(result.cleanup.ownedBindingCleared, true)
})

test('unexpected greeting and termination cannot be reported as a normal successful sample', async () => {
  const greeting = await fixture({ tts: true })
  assert.equal(greeting.result.completed, false)
  assert.equal(greeting.result.channel.receivedTtsMessages, 1)
  const terminated = await fixture({ failClose: true })
  assert.equal(terminated.result.completed, false)
  assert.equal(terminated.result.channel.terminated, true)
  assert.equal(terminated.result.cleanup.normalClose, false)
})
