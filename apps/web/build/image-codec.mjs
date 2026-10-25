import { crc32, inflateSync } from 'node:zlib'

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const allowedChunks = new Set(['IHDR', 'IDAT', 'IEND', 'caBX'])

/** Validates PNG structure; only the reviewed RGBA8/color semantics are eligible for conversion. */
export function pngPixels(bytes) {
  if (!bytes.subarray(0, 8).equals(signature)) throw Error('Invalid PNG signature/size')
  const chunks = []
  let offset = 8, phase = 'before'
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw Error('Truncated PNG chunk')
    const length = bytes.readUInt32BE(offset), end = offset + length + 12
    if (end > bytes.length) throw Error('Truncated PNG chunk payload')
    const type = bytes.toString('ascii', offset + 4, offset + 8), data = bytes.subarray(offset + 8, end - 4)
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== bytes.readUInt32BE(end - 4)) throw Error('Invalid PNG CRC')
    if (chunks.length === 0 && type !== 'IHDR' || chunks.length !== 0 && type === 'IHDR') throw Error('Invalid PNG IHDR order')
    if (type === 'IDAT') { if (phase === 'after') throw Error('Non-contiguous PNG IDAT'); phase = 'during' }
    else if (phase === 'during') phase = 'after'
    chunks.push({ type, data }); offset = end
    if (type === 'IEND') { if (length !== 0 || offset !== bytes.length) throw Error('Invalid PNG ending'); break }
  }
  if (chunks.at(-1)?.type !== 'IEND' || !chunks.some(chunk => chunk.type === 'IDAT') || chunks[0].data.length !== 13) throw Error('Incomplete PNG')
  const header = chunks[0].data, width = header.readUInt32BE(0), height = header.readUInt32BE(4)
  if (width === 0 || height === 0) throw Error('Invalid PNG dimensions')
  if (bytes.length > 16 * 1024 * 1024 || width > 8192 || height > 8192 || width * height > 32 * 1024 * 1024) return null
  if (!header.subarray(8).equals(Buffer.from([8, 6, 0, 0, 0])) || chunks.some(chunk => !allowedChunks.has(chunk.type))) return null
  const stride = width * 4, length = height * (stride + 1)
  if (length > 64 * 1024 * 1024) return null
  const filtered = inflateSync(Buffer.concat(chunks.filter(chunk => chunk.type === 'IDAT').map(chunk => chunk.data)), { maxOutputLength: length })
  if (filtered.length !== length) throw Error('PNG decoded length mismatch')
  const rgba = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1), row = y * stride, filter = filtered[start]
    if (filter > 4) throw Error('Invalid PNG filter')
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? rgba[row + x - 4] : 0, up = y > 0 ? rgba[row + x - stride] : 0, corner = x >= 4 && y > 0 ? rgba[row + x - stride - 4] : 0
      const p = left + up - corner, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - corner)
      const paeth = a <= b && a <= c ? left : b <= c ? up : corner
      const prediction = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : paeth
      rgba[row + x] = (filtered[start + x + 1] + prediction) & 255
    }
  }
  const alpha = Buffer.alloc(width * height)
  for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3]
  return { width, height, alpha }
}

/** dwebp PAM carries raw decoded samples, so alpha is checked independently of encoded headers. */
export function pamAlpha(bytes, width, height) {
  const end = bytes.indexOf('ENDHDR\n')
  if (end < 0 || end > 256) throw Error('Invalid decoded PAM header')
  const header = bytes.toString('ascii', 0, end + 7)
  const match = /^P7\nWIDTH (\d+)\nHEIGHT (\d+)\nDEPTH ([34])\nMAXVAL 255\nTUPLTYPE RGB(?:_ALPHA)?\nENDHDR\n$/.exec(header)
  if (match == null || Number(match[1]) !== width || Number(match[2]) !== height) throw Error('Encoded image dimensions changed')
  const depth = Number(match[3]), pixels = bytes.subarray(end + 7)
  if (pixels.length !== width * height * depth) throw Error('Decoded PAM length mismatch')
  const alpha = Buffer.alloc(width * height, 255)
  if (depth === 4) for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3]
  return alpha
}

export function webpSize(bytes) {
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP' || bytes.readUInt32LE(4) + 8 !== bytes.length) throw Error('Invalid WebP container')
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4), start = offset + 8
    if (start + length > bytes.length) throw Error('Truncated WebP chunk')
    if (type === 'VP8X' && length === 10) return { width: bytes.readUIntLE(start + 4, 3) + 1, height: bytes.readUIntLE(start + 7, 3) + 1 }
    if (type === 'VP8L' && length >= 5 && bytes[start] === 0x2f) {
      const packed = bytes.readUInt32LE(start + 1)
      return { width: (packed & 0x3fff) + 1, height: ((packed >>> 14) & 0x3fff) + 1 }
    }
    if (type === 'VP8 ' && length >= 10 && bytes.subarray(start + 3, start + 6).equals(Buffer.from([0x9d, 0x01, 0x2a]))) return { width: bytes.readUInt16LE(start + 6) & 0x3fff, height: bytes.readUInt16LE(start + 8) & 0x3fff }
    offset = start + length + (length & 1)
  }
  throw Error('WebP dimensions missing')
}
