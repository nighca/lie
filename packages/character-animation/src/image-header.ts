type ImageDimensions = { width: number; height: number }

/** Reads encoded still-image dimensions before handing untrusted part bytes to the browser decoder. */
export function readImageDimensions(bytes: DataView): ImageDimensions {
  const invalid = () => { throw Error('Animation part must be valid PNG or still WebP') }
  if (bytes.byteLength >= 24 && bytes.getUint32(0) === 0x89504e47 && bytes.getUint32(4) === 0x0d0a1a0a && bytes.getUint32(8) === 13 && bytes.getUint32(12) === 0x49484452) {
    return { width: bytes.getUint32(16), height: bytes.getUint32(20) }
  }
  if (bytes.byteLength < 20 || bytes.getUint32(0) !== 0x52494646 || bytes.getUint32(8) !== 0x57454250 || bytes.getUint32(4, true) + 8 !== bytes.byteLength) return invalid()
  const uint24 = (offset: number) => bytes.getUint8(offset) + bytes.getUint8(offset + 1) * 256 + bytes.getUint8(offset + 2) * 65536
  let canvas: ImageDimensions | null = null, image: ImageDimensions | null = null
  for (let offset = 12; offset < bytes.byteLength;) {
    if (offset + 8 > bytes.byteLength) return invalid()
    const kind = bytes.getUint32(offset), length = bytes.getUint32(offset + 4, true), start = offset + 8
    const end = start + length, next = end + length % 2
    if (next > bytes.byteLength || (length % 2 !== 0 && bytes.getUint8(end) !== 0)) return invalid()
    if (offset === 12 && ![0x56503858, 0x5650384c, 0x56503820].includes(kind)) return invalid()
    if (kind === 0x56503858) {
      if (offset !== 12 || length !== 10 || (bytes.getUint8(start) & 0xc3) !== 0 || uint24(start + 1) !== 0) return invalid()
      canvas = { width: uint24(start + 4) + 1, height: uint24(start + 7) + 1 }
    } else if (kind === 0x5650384c) {
      if (image != null || length < 5 || bytes.getUint8(start) !== 0x2f) return invalid()
      const bits = bytes.getUint32(start + 1, true)
      if ((bits >>> 29) !== 0) return invalid()
      image = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
    } else if (kind === 0x56503820) {
      if (image != null || length < 10 || (bytes.getUint8(start) & 1) !== 0 || uint24(start + 3) !== 0x2a019d) return invalid()
      image = { width: bytes.getUint16(start + 6, true) & 0x3fff, height: bytes.getUint16(start + 8, true) & 0x3fff }
      if (image.width === 0 || image.height === 0) return invalid()
    } else if (kind === 0x414e494d || kind === 0x414e4d46) return invalid()
    offset = next
  }
  if (image == null || (canvas != null && (canvas.width !== image.width || canvas.height !== image.height))) return invalid()
  return image
}
