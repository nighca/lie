import { createPcmPlayer as baseline } from './sources/baseline.mjs'
import { createPcmPlayer as gap } from './sources/gap.mjs'
import { createPcmPlayer as current } from './sources/current.mjs'

const format = { format: 'pcm', sampleRate: 16000, channels: 1, bitsPerSample: 16, frameDuration: 20 }
const packetSamples = 320
const packetCount = 10
const epsilon = 1e-6
const players = { baseline, gap, current }
const modes = ['all-early', 'second-at-30ms', 'exhaustion', 'matched-onset']

function input(signal) {
  const bytes = new Uint8Array(packetCount * packetSamples * 2)
  const view = new DataView(bytes.buffer)
  const samples = new Float32Array(packetCount * packetSamples)
  for (let index = 0; index < samples.length; index++) {
    const t = index / 16000
    const value = signal === 'dc' ? .25 : signal === 'sine'
      ? .2 * Math.sin(2 * Math.PI * 233 * t + .37)
      : .18 * (.35 + .65 * Math.sin(2 * Math.PI * 3.3 * t) ** 2) * (Math.sin(2 * Math.PI * 147 * t + .2) + .3 * Math.sin(2 * Math.PI * 294 * t + .7) + .1 * Math.sin(2 * Math.PI * 588 * t + .5))
    const integer = Math.round(Math.max(-1, Math.min(32767 / 32768, value)) * 32768)
    view.setInt16(index * 2, integer, true)
    samples[index] = integer / 32768
  }
  return { bytes, samples }
}
function concatenate(chunks) {
  const result = new Float32Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length }
  return result
}
function difference(actual, reference, start = 0, end = actual.length) {
  let maxAbsError = 0, differentSamples = 0, squareError = 0, peakAbs = 0, maxJump = 0, referenceMaxJump = 0
  for (let index = Math.max(0, start); index < Math.min(actual.length, end); index++) {
    const delta = Math.abs(actual[index] - reference[index])
    maxAbsError = Math.max(maxAbsError, delta)
    peakAbs = Math.max(peakAbs, Math.abs(actual[index]))
    if (delta > epsilon) differentSamples++
    squareError += delta * delta
    if (index > start && index > 0) {
      maxJump = Math.max(maxJump, Math.abs(actual[index] - actual[index - 1]))
      referenceMaxJump = Math.max(referenceMaxJump, Math.abs(reference[index] - reference[index - 1]))
    }
  }
  return { maxAbsError, differentSamples, rmsError: Math.sqrt(squareError / Math.max(1, end - start)), peakAbs, maxJump, referenceMaxJump }
}
function host(rate) {
  const native = new OfflineAudioContext(1, Math.round(rate * .6), rate)
  const records = []
  let time = 0
  const context = {
    sampleRate: rate, get currentTime() { return time }, get state() { return native.state }, destination: native.destination,
    createBuffer: native.createBuffer.bind(native),
    createBufferSource() {
      const source = native.createBufferSource()
      const start = source.start.bind(source)
      source.start = when => {
        records.push({ start: when, enqueueClock: time, samples: source.buffer.getChannelData(0).slice() })
        start(when)
      }
      return source
    },
  }
  return { native, context, records, setTime(value) { time = value } }
}
async function reference(rate, windows) {
  const context = new OfflineAudioContext(1, Math.round(rate * .6), rate)
  for (const window of windows) {
    const buffer = context.createBuffer(1, window.samples.length, 16000)
    buffer.copyToChannel(window.samples, 0)
    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.start(window.start)
  }
  return (await context.startRendering()).getChannelData(0)
}
function runs(records) {
  const groups = []
  for (const record of records) {
    const previous = groups.at(-1)
    if (previous != null && Math.abs(record.start - previous.end) < 1e-9) {
      previous.chunks.push(record.samples)
      previous.end = record.start + record.samples.length / 16000
    } else groups.push({ start: record.start, end: record.start + record.samples.length / 16000, chunks: [record.samples] })
  }
  return groups.map(group => ({ start: group.start, samples: concatenate(group.chunks) }))
}
async function runCase(version, signal, rate, mode, pcm) {
  const f = host(rate)
  let idleCount = 0
  const player = players[version](f.context, () => { idleCount++ })
  const lead = version === 'current' ? 256 / rate : .02
  const epoch = mode === 'matched-onset' ? .1 - lead : 0
  try {
    for (let packet = 0; packet < packetCount; packet++) {
      const arrival = mode === 'second-at-30ms' && packet > 0 ? .03 : mode === 'exhaustion' && packet >= 5 ? .15 : 0
      f.setTime(epoch + arrival)
      player.enqueue(pcm.bytes.slice(packet * packetSamples * 2, (packet + 1) * packetSamples * 2), format)
    }
    player.flush?.()
    if (f.records.length !== packetCount) throw new Error('Every packet must be scheduled once')
    const rendered = (await f.native.startRendering()).getChannelData(0)
    const windows = runs(f.records)
    const runReference = await reference(rate, windows)
    const ideal = await reference(rate, [{ start: f.records[0].start, samples: pcm.samples }])
    const schedule = f.records.map((record, index) => ({
      start: record.start, end: record.start + record.samples.length / 16000, sampleCount: record.samples.length, enqueueClock: record.enqueueClock,
      gapBefore: index === 0 ? null : record.start - f.records[index - 1].start - f.records[index - 1].samples.length / 16000,
    }))
    const seams = schedule.slice(1).map((record, index) => {
      const at = Math.round(record.start * rate)
      return { afterPacket: index + 1, atSample: at, gapBefore: record.gapBefore, ...difference(rendered, runReference, at - 32, at + 33) }
    })
    const worst = seams.reduce((best, seam) => seam.maxAbsError > best.maxAbsError ? seam : best, seams[0])
    const window = { afterPacket: worst.afterPacket, offsets: [], actual: [], runReference: [] }
    for (let offset = -8; offset <= 8; offset++) {
      window.offsets.push(offset)
      window.actual.push(rendered[worst.atSample + offset])
      window.runReference.push(runReference[worst.atSample + offset])
    }
    return {
      result: { version, signal, rate, mode, onset: schedule[0].start, idleCount, closed: f.native.state === 'closed',
        totalGapMs: schedule.reduce((sum, item) => sum + Math.max(0, item.gapBefore ?? 0) * 1000, 0), runCount: windows.length,
        runReference: difference(rendered, runReference), continuousReference: difference(rendered, ideal), schedule, seams, representativeWindow: window },
      rendered,
    }
  } finally { player.stop() }
}
export async function runMatrix(progress = () => {}) {
  const cases = [], inputHashes = {}, aligned = new Map()
  const inputs = Object.fromEntries(['dc', 'sine', 'speech-envelope'].map(name => [name, input(name)]))
  for (const [name, pcm] of Object.entries(inputs)) inputHashes[name] = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', pcm.bytes))).map(byte => byte.toString(16).padStart(2, '0')).join('')
  for (const rate of [16000, 48000]) for (const signal of Object.keys(inputs)) for (const mode of modes) for (const version of Object.keys(players)) {
    progress(`${cases.length + 1}/72: ${rate} ${signal} ${mode} ${version}`)
    const { result, rendered } = await runCase(version, signal, rate, mode, inputs[signal])
    if (mode === 'matched-onset') {
      const key = `${rate}/${signal}`
      if (version === 'baseline') aligned.set(key, rendered)
      result.matchedOnsetVsBaseline = difference(rendered, aligned.get(key))
    }
    cases.push(result)
  }
  const summary = [16000, 48000].flatMap(rate => Object.keys(players).map(version => {
    const selected = cases.filter(item => item.rate === rate && item.version === version)
    return { rate, version, maxBoundaryError: Math.max(...selected.map(item => item.runReference.maxAbsError)),
      allEarlyDc: selected.find(item => item.signal === 'dc' && item.mode === 'all-early').runReference,
      matchedOnsetMaxDifference: Math.max(...selected.filter(item => item.mode === 'matched-onset').map(item => item.matchedOnsetVsBaseline.maxAbsError)) }
  }))
  return { kind: 'synthetic-offline-pcm-seams', browser: navigator.userAgent, sampleRate: 16000, packetSamples, packetCount,
    epsilon, transform: 'Actual Git player and PCM modules; native buffer/source methods, synthetic read-only enqueue clock', inputHashes, summary, cases }
}
