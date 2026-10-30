// Offline proposal probe only: no sockets, timers, network, provider, or production import.
const fs = require('node:fs')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const source = fs.readFileSync('apps/gateway/src/index.ts', 'utf8')
const expression = source.match(/const size = (.*)\n/)[1]
assert.equal(expression, "typeof event.data === 'string' ? new TextEncoder().encode(event.data).byteLength : event.data.byteLength")
const originalSize = new Function('event', 'TextEncoder', 'return ' + expression)
const encoder = new TextEncoder()
let originalEncodes = 0, candidateEncodes = 0
class CountedEncoder { encode(value) { originalEncodes++; return encoder.encode(value) } }
function originalReject(data) { return originalSize({ data }, CountedEncoder) > 65536 }
function candidateReject(data) {
  if (typeof data !== 'string') return data.byteLength > 65536
  // UTF-8 is at most three bytes per UTF-16 code unit, including lone-surrogate replacement.
  if (data.length <= Math.floor(65536 / 3)) return false
  if (data.length > 65536) return true
  candidateEncodes++
  return encoder.encode(data).byteLength > 65536
}
const cases = ['', 'ASCII', '中文', '\ud800', '\udc00', '😀']
for (const unit of ['a', '中', '😀', '\ud800']) {
  for (const count of [21845, 21846, 32768, 32769, 65535, 65536, 65537]) cases.push(unit.repeat(count))
}
cases.push('😀'.repeat(16384), '😀'.repeat(16384) + 'a', '中'.repeat(21845) + 'a', '中'.repeat(21845) + 'ab')
let seed = 1234567
for (let n = 0; n < 4000; n++) {
  let value = ''
  for (let i = 0; i < n % 150; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; value += String.fromCharCode(seed & 65535) }
  cases.push(value)
}
for (const value of cases) assert.equal(candidateReject(value), originalReject(value))
for (const size of [0, 640, 65536, 65537]) assert.equal(candidateReject(new ArrayBuffer(size)), originalReject(new ArrayBuffer(size)))
originalEncodes = candidateEncodes = 0
const data = new ArrayBuffer(640)
for (let i = 0; i < 30000; i++) { assert.equal(originalReject(data), false); assert.equal(candidateReject(data), false) }
for (let i = 0; i < 600; i++) { assert.equal(originalReject('{"type":"tts","state":"stop"}'), false); assert.equal(candidateReject('{"type":"tts","state":"stop"}'), false) }
console.log(JSON.stringify({ sourceSha256: crypto.createHash('sha256').update(source).digest('hex'), equivalentCases: cases.length + 4, syntheticMix: { binary640ByteFrames: 30000, shortTextFrames: 600, originalTextEncodes: originalEncodes, candidateTextEncodes: candidateEncodes, frameGuardDispatchesBoth: 30600 }, implemented: false, limitation: 'Predicate feasibility and encode-call counts only; not Cloudflare CPU profiling, a native-proxy test, or evidence Free can sustain 180/600 seconds.' }, null, 2))
