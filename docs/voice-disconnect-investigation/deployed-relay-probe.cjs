// Read the explicitly selected deployed module through cf; never opens a voice connection.
const { spawnSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const ts = require('typescript')
const version = '597aa83d-8b31-4564-a7f4-c16e2345d872'
const result = spawnSync(process.execPath, ['node_modules/cf/bin/cf', 'workers', 'versions', 'get', version, '--worker-id', 'lie-game', '--include', 'modules'], { encoding: 'utf8', env: { ...process.env, CF_SEND_TELEMETRY: 'false' } })
assert.equal(result.status, 0, 'cf read failed; raw stderr deliberately omitted')
const data = JSON.parse(result.stdout)
assert.equal(data.id, version)
const source = Buffer.from(data.modules.find(m => m.name === data.main_module).content_base64, 'base64').toString('utf8')
const recorded = require('./runtime-evidence.json').version.module
assert.equal(Buffer.byteLength(source), recorded.bytes, 'deployed module byte length changed')
assert.equal(createHash('sha256').update(source).digest('hex'), recorded.sha256, 'deployed module identity changed')
const ast = ts.createSourceFile('deployed.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
const functions = name => ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === name).getText(ast)
const parseLimit = vm.runInNewContext('(' + functions('voiceSessionLimitSeconds') + ')')
const cap = parseLimit(data.env.VOICE_MAX_SESSION_SECONDS.text)
assert.equal(cap, 600)
function fixture() {
  let now = 0, sequence = 0
  const timers = new Map()
  const relay = vm.runInNewContext('(' + functions('relaySockets') + ')', {
    TextEncoder,
    setTimeout(fn, ms) { const id = ++sequence; timers.set(id, { at: now + ms, fn }); return id },
    clearTimeout(id) { timers.delete(id) }
  })
  function socket() { const listeners = {}; return { closes: [], sends: [], accept() {}, addEventListener(type, fn) { listeners[type] = fn }, send(value) { this.sends.push(value) }, close(code, reason) { this.closes.push({ code, reason }) }, emit(type, value) { listeners[type]?.(value) } } }
  const browser = socket(), upstream = socket()
  function tick(target) { for (;;) { const next = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; now = next[1].at; timers.delete(next[0]); next[1].fn() } now = target }
  return { relay, browser, upstream, tick, timers }
}
const main = fixture()
main.relay(main.browser, main.upstream, cap)
for (const t of [179999, 180000, 599999]) { main.tick(t); main.browser.emit('message', { data: new Uint8Array(640).buffer }); assert.equal(main.browser.closes.length, 0) }
main.tick(600000)
assert.deepEqual(main.browser.closes, [{ code: 1000, reason: 'Conversation time limit' }])
assert.equal(main.upstream.closes.length, 1)
main.upstream.emit('close', { code: 1000, reason: 'Already closed' })
main.browser.emit('message', { data: 'late' })
assert.equal(main.browser.closes.length, 1)
assert.equal(main.upstream.sends.length, 3)
assert.equal(main.timers.size, 0)
const early = fixture()
early.relay(early.browser, early.upstream)
early.upstream.emit('close', { code: 1000, reason: 'Peer ended' })
assert.equal(early.timers.size, 0)
early.tick(600000)
assert.equal(early.browser.closes.length, 1)
const output = { version, moduleSha256: createHash('sha256').update(source).digest('hex'), configuredSeconds: cap, checkpointsMs: [179999, 180000, 599999, 600000], passed: ['no close at former 180s', '600s wall-clock close', 'messages do not renew cap', 'late messages ignored', 'close idempotent', 'early close clears timer'], limitation: 'Exact downloaded relay with fake clock/sockets only; no Workers CPU enforcement, network, provider, microphone or paid inference.' }
console.log(JSON.stringify(output, null, 2))
