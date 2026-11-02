import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Executes the actual player with a fake audio clock. No sockets, device audio or microphone.
const root = new URL('../../../', import.meta.url)
const pcmSource = readFileSync(new URL('packages/voice/src/pcm.ts', root), 'utf8')
const playerSource = readFileSync(new URL('packages/voice/src/player.ts', root), 'utf8')
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const pcmUrl = moduleUrl(stripTypeScriptTypes(pcmSource))
const { createPcmPlayer } = await import(moduleUrl(stripTypeScriptTypes(playerSource).replace("'./pcm'", JSON.stringify(pcmUrl))))
const format = { format: 'pcm', sampleRate: 16000, channels: 1, bitsPerSample: 16, frameDuration: 20 }
const sampleCount = 32000
const pcm = new Uint8Array(sampleCount * 2)
for (let i = 0; i < sampleCount; i++) new DataView(pcm.buffer).setInt16(i * 2, Math.round(Math.sin(i * 2 * Math.PI * 220 / 16000) * 8192), true)
const packets = Array.from({ length: 100 }, (_, i) => pcm.slice(i * 640, (i + 1) * 640))
const round = n => Math.round(n * 1e6) / 1e6

function replay(name, arrival, blocked = null) {
  let now = 0
  let serial = 0
  const jobs = new Map()
  const events = []
  const sources = []
  const add = (at, fn) => { const id = ++serial; jobs.set(id, { at, fn }); return id }
  const unblock = at => blocked != null && at >= blocked[0] && at < blocked[1] ? blocked[1] : at
  const originalTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  const originalPerformance = Object.getOwnPropertyDescriptor(globalThis, 'performance')
  globalThis.setTimeout = (fn, delay) => add(now + delay, fn)
  globalThis.clearTimeout = id => jobs.delete(id)
  Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => now } })
  const context = {
    get currentTime() { return now / 1000 },
    sampleRate: 16000, state: 'running', destination: {},
    addEventListener() {}, removeEventListener() {},
    createBuffer(_channels, length, rate) {
      return { duration: length / rate, copyToChannel() {} }
    },
    createBufferSource() {
      const source = {
        buffer: null, onended: null, ended: false, job: null,
        connect() {}, disconnect() {},
        start(at) {
          assert.ok(at >= context.currentTime - 1e-9)
          source.job = add((at + source.buffer.duration) * 1000, () => {
            source.ended = true
            source.onended?.()
          })
        },
        stop() { jobs.delete(source.job); source.ended = true },
      }
      sources.push(source)
      return source
    },
  }
  try {
    const player = createPcmPlayer(context, () => {}, null, event => events.push({ ...event, callbackMs: now }))
    packets.forEach((packet, i) => add(arrival(i), () => player.enqueue(packet, format)))
    add(arrival(99), () => player.flush())
    while (jobs.size) {
      const [id, job] = [...jobs].sort((a, b) => unblock(a[1].at) - unblock(b[1].at) || a[0] - b[0])[0]
      jobs.delete(id)
      now = Math.max(now, unblock(job.at))
      assert.ok(now < 10000, 'Fixture must terminate')
      job.fn()
    }
    const scheduled = events.filter(e => e.type === 'schedule')
    assert.equal(scheduled.length, 100)
    assert.equal(scheduled.reduce((sum, e) => sum + e.sampleCount, 0), sampleCount)
    assert.ok(sources.every(source => source.ended))
    assert.ok(scheduled.every((e, i) => i === 0 || e.startTime >= scheduled[i - 1].endTime - 1e-9))
    const gaps = scheduled.filter(e => e.gap > 1e-9)
    const result = {
      name,
      firstCallbackMs: unblock(arrival(0)),
      firstScheduledStartMs: round(scheduled[0].startTime * 1000),
      gapCountWithinOneAnswer: gaps.length,
      totalScheduledGapMs: round(gaps.reduce((sum, e) => sum + e.gap * 1000, 0)),
      maxScheduledGapMs: round(Math.max(0, ...gaps.map(e => e.gap * 1000))),
      maxEnqueueCallbackIntervalMs: round(Math.max(0, ...scheduled.map(e => e.arrivalIntervalMs ?? 0))),
      peakQueueAheadMs: round(Math.max(...scheduled.map(e => e.queueAheadAfter * 1000))),
      scheduledSamples: sampleCount,
      remainingJobsAfterDrain: jobs.size,
    }
    player.stop()
    assert.equal(jobs.size, 0)
    return result
  } finally {
    globalThis.setTimeout = originalTimeout
    globalThis.clearTimeout = originalClearTimeout
    Object.defineProperty(globalThis, 'performance', originalPerformance)
  }
}

const cases = [
  replay('steady-20ms', i => i * 20),
  replay('constant-extra-500ms', i => i * 20 + 500),
  replay('100ms-batches-same-average-rate', i => Math.floor(i / 5) * 100),
  replay('delivery-hold-600-to-750ms-then-catch-up', i => i >= 30 && i < 38 ? 750 : i * 20),
  replay('delivery-hold-600-to-900ms-then-catch-up', i => i >= 30 && i < 45 ? 900 : i * 20),
  replay('delivery-hold-600-to-1100ms-then-catch-up', i => i >= 30 && i < 55 ? 1100 : i * 20),
  replay('source-pause-300ms-no-catch-up', i => i * 20 + (i >= 30 ? 300 : 0)),
  replay('steady-network-main-thread-blocked-600-to-900ms', i => i * 20, [600, 900]),
  replay('20ms-audio-every-25ms', i => i * 25),
]
assert.equal(cases[0].totalScheduledGapMs, 0)
assert.equal(cases[1].totalScheduledGapMs, 0)
assert.equal(cases[1].firstScheduledStartMs - cases[0].firstScheduledStartMs, 500)
assert.equal(cases[2].totalScheduledGapMs, 0)
assert.equal(cases[4].maxEnqueueCallbackIntervalMs, cases[7].maxEnqueueCallbackIntervalMs)
assert.equal(cases[4].totalScheduledGapMs, cases[7].totalScheduledGapMs)
assert.ok(cases[8].gapCountWithinOneAnswer > 1)
console.log(JSON.stringify({
  schema: 1,
  node: process.version,
  kind: 'deterministic fake scheduling; not network, browser or acoustic evidence',
  sourceSha256: Object.fromEntries([['player', playerSource], ['pcm', pcmSource]].map(([key, source]) => [key, createHash('sha256').update(source).digest('hex')])),
  fixture: { audioSeconds: 2, packetBytes: 640, packets: 100, sampleRate: 16000, graphRate: 16000, oneAnswer: true, contextAlwaysRunning: true, speechOrPrivateAudio: false },
  assertions: 'passed',
  cases,
}, null, 2))
