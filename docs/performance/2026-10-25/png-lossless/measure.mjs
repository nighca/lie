import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync, inflateSync } from 'node:zlib'

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const digest = data => createHash('sha256').update(data).digest('hex')
const root = fileURLToPath(new URL('../../../../', import.meta.url))

/** Strict probe for the current noninterlaced RGBA8 asset corpus; never writes a PNG. */
export function parsePng(bytes) {
  assert.ok(bytes.length <= 16 * 1024 * 1024 && bytes.subarray(0, 8).equals(signature), 'PNG signature/size')
  const chunks = []
  let offset = 8, phase = 'before'
  while (offset < bytes.length) {
    assert.ok(offset + 12 <= bytes.length, 'truncated chunk')
    const length = bytes.readUInt32BE(offset), end = offset + length + 12
    assert.ok(end <= bytes.length, 'chunk boundary')
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    assert.match(type, /^[A-Za-z]{4}$/)
    const raw = bytes.subarray(offset, end), data = bytes.subarray(offset + 8, end - 4)
    assert.equal(crc32(bytes.subarray(offset + 4, end - 4)), bytes.readUInt32BE(end - 4), `${type} CRC`)
    assert.ok(chunks.length !== 0 || type === 'IHDR', 'IHDR first')
    assert.ok(type !== 'IHDR' || chunks.length === 0, 'single IHDR')
    if (type === 'IDAT') { assert.notEqual(phase, 'after', 'contiguous IDAT'); phase = 'during' }
    else if (phase === 'during') phase = 'after'
    chunks.push({ type, data, raw }); offset = end
    if (type === 'IEND') { assert.equal(length, 0); assert.equal(offset, bytes.length, 'no trailing data'); break }
  }
  assert.equal(chunks.at(-1)?.type, 'IEND'); assert.ok(chunks.some(c => c.type === 'IDAT'))
  const ihdr = chunks[0].data; assert.equal(ihdr.length, 13)
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4)
  assert.ok(width > 0 && height > 0)
  assert.deepEqual([...ihdr.subarray(8)], [8, 6, 0, 0, 0], 'current corpus must be RGBA8/noninterlaced')
  const length = height * (width * 4 + 1)
  assert.ok(length <= 64 * 1024 * 1024, 'filtered data budget')
  const filtered = inflateSync(Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data)), { maxOutputLength: length })
  assert.equal(filtered.length, length)
  return { chunks, filtered, width, height }
}

function paeth(a, b, c) {
  const p = a + b - c, x = Math.abs(p - a), y = Math.abs(p - b), z = Math.abs(p - c)
  return x <= y && x <= z ? a : y <= z ? b : c
}

export function pixels({ filtered, width, height }) {
  const stride = width * 4, output = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const input = y * (stride + 1), row = y * stride, filter = filtered[input]
    assert.ok(filter <= 4, 'PNG filter')
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? output[row + x - 4] : 0, up = y > 0 ? output[row + x - stride] : 0
      const upperLeft = x >= 4 && y > 0 ? output[row + x - stride - 4] : 0
      const prediction = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : paeth(left, up, upperLeft)
      output[row + x] = (filtered[input + x + 1] + prediction) & 255
    }
  }
  return output
}

export function recompressPng(bytes) {
  const before = parsePng(bytes), start = performance.now()
  const compressed = deflateSync(before.filtered, { level: 9 })
  const compressionMs = performance.now() - start
  const idat = Buffer.alloc(compressed.length + 12)
  idat.writeUInt32BE(compressed.length); idat.write('IDAT', 4); compressed.copy(idat, 8)
  idat.writeUInt32BE(crc32(idat.subarray(4, -4)), idat.length - 4)
  let inserted = false
  const output = Buffer.concat([signature, ...before.chunks.flatMap(c => {
    if (c.type !== 'IDAT') return [c.raw]
    if (inserted) return []
    inserted = true; return [idat]
  })])
  const after = parsePng(output)
  assert.deepEqual(after.filtered, before.filtered)
  assert.deepEqual(after.chunks.filter(c => c.type !== 'IDAT').map(c => c.raw), before.chunks.filter(c => c.type !== 'IDAT').map(c => c.raw))
  const originalPixels = pixels(before), newPixels = pixels(after)
  assert.deepEqual(newPixels, originalPixels)
  const alpha = Buffer.alloc(before.width * before.height)
  for (let i = 0; i < alpha.length; i++) alpha[i] = originalPixels[i * 4 + 3]
  return { output, compressionMs, width: before.width, height: before.height, filteredSHA256: digest(before.filtered), rgbaSHA256: digest(originalPixels), alphaSHA256: digest(alpha), nonIdatSHA256: digest(Buffer.concat(before.chunks.filter(c => c.type !== 'IDAT').map(c => c.raw))), chunks: before.chunks.map(c => c.type) }
}

async function pngFiles(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), 'no symlink sources')
    if (entry.isDirectory()) result.push(...await pngFiles(join(directory, entry.name)))
    else if (entry.name.endsWith('.png')) result.push(join(directory, entry.name))
  }
  return result.sort()
}

async function main() {
  assert.equal(process.versions.node, '24.22.1')
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926)
  const started = performance.now(), rows = [], manifest = JSON.parse(await readFile(join(root, 'design/character-presets/manifest.json')))
  const sources = []
  for (const preset of manifest) sources.push(...await pngFiles(join(root, 'design/character-presets/assets', preset.id)))
  assert.ok(sources.length <= 128, 'file count budget')
  let total = 0
  for (const path of sources) {
    assert.ok(performance.now() - started < 120_000, 'two-minute corpus budget')
    const before = await readFile(path); total += before.length; assert.ok(total <= 128 * 1024 * 1024, 'input byte budget')
    const start = performance.now(), result = recompressPng(before)
    assert.deepEqual(await readFile(path), before, 'source unchanged')
    rows.push({ path: path.slice(root.length), originalBytes: before.length, recompressedBytes: result.output.length, retainedBytes: Math.min(before.length, result.output.length), savingBytes: Math.max(0, before.length - result.output.length), compressionMs: result.compressionMs, verificationMs: performance.now() - start - result.compressionMs, width: result.width, height: result.height, originalSHA256: digest(before), recompressedSHA256: digest(result.output), filteredSHA256: result.filteredSHA256, rgbaSHA256: result.rgbaSHA256, alphaSHA256: result.alphaSHA256, nonIdatSHA256: result.nonIdatSHA256, chunkTypes: result.chunks })
  }
  const sum = key => rows.reduce((n, row) => n + row[key], 0)
  const summary = { node: process.version, zlib: process.versions.zlib, method: 'one default-strategy zlib level9 stream; one IDAT, smaller-only retention; no filter/pixel/metadata editing', count: rows.length, originalBytes: sum('originalBytes'), recompressedBytes: sum('recompressedBytes'), retainedBytes: sum('retainedBytes'), savingBytes: sum('savingBytes'), compressionMs: sum('compressionMs'), verificationMs: sum('verificationMs'), wallMs: performance.now() - started, rows }
  await writeFile(join(dirname(fileURLToPath(import.meta.url)), 'measurement.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify({ ...summary, rows: `${rows.length} detailed rows saved` }, null, 2))
}
if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
