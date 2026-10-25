export function chunk(kind: string, payload: Uint8Array) {
  const bytes = new Uint8Array(8 + payload.length + payload.length % 2)
  bytes.set(new TextEncoder().encode(kind))
  new DataView(bytes.buffer).setUint32(4, payload.length, true)
  bytes.set(payload, 8)
  return bytes
}
export function webp(chunks: Uint8Array[]) {
  const bytes = new Uint8Array(12 + chunks.reduce((total, part) => total + part.length, 0))
  bytes.set(new TextEncoder().encode('RIFF')); bytes.set(new TextEncoder().encode('WEBP'), 8)
  new DataView(bytes.buffer).setUint32(4, bytes.length - 8, true)
  let offset = 12
  for (const part of chunks) { bytes.set(part, offset); offset += part.length }
  return bytes
}
// Header fixtures exercise boundary validation; browser decode is tested independently by the build owner.
export function webpImage(kind: 'VP8 ' | 'VP8L' | 'VP8X', width = 1, height = 1): Uint8Array<ArrayBuffer> {
  if (kind === 'VP8X') {
    const header = new Uint8Array(10), view = new DataView(header.buffer)
    header[0] = 16
    view.setUint32(4, width - 1, true)
    header[7] = (height - 1) & 255; header[8] = ((height - 1) >>> 8) & 255; header[9] = ((height - 1) >>> 16) & 255
    return webp([chunk('VP8X', header), chunk('ALPH', new Uint8Array([0, 255])), webpImage('VP8 ', width, height).slice(12)])
  }
  const header = new Uint8Array(kind === 'VP8L' ? 5 : 10), view = new DataView(header.buffer)
  if (kind === 'VP8L') { header[0] = 0x2f; view.setUint32(1, ((height - 1) << 14) | (width - 1), true) }
  else { header.set([0x9d, 0x01, 0x2a], 3); view.setUint16(6, width, true); view.setUint16(8, height, true) }
  return webp([chunk(kind, header)])
}
