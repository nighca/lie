import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readImageDimensions } from '../src/image-header'
import { chunk, webp, webpImage } from './webp-fixture'

function dimensions(bytes: Uint8Array) { return readImageDimensions(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)) }

describe('encoded WebP dimensions', () => {
  it.each(['alpha-vp8x', 'alpha-vp8l', 'opaque-vp8'])('reads real libwebp-encoded %s fixtures', name => {
    expect(dimensions(readFileSync(new URL(`./fixtures/${name}.webp`, import.meta.url)))).toEqual({ width: 2, height: 2 })
  })
  it.each(['VP8 ', 'VP8L', 'VP8X'] as const)('reads %s dimensions including alpha containers', kind => {
    expect(dimensions(webpImage(kind, 351, 219))).toEqual({ width: 351, height: 219 })
  })
  it.each([
    ['truncated RIFF', (b: Uint8Array) => b.slice(0, 19)],
    ['trailing bytes', (b: Uint8Array) => new Uint8Array([...b, 0, 0])],
    ['RIFF size mismatch', (b: Uint8Array) => { b[4]--; return b }],
    ['chunk outside blob', (b: Uint8Array) => { b[16] = 255; return b }],
    ['animated container', (b: Uint8Array) => { b[20] |= 2; return b }],
    ['reserved flags', (b: Uint8Array) => { b[20] |= 128; return b }],
    ['canvas differs from bitstream', (b: Uint8Array) => { b[24]++; return b }],
  ])('rejects %s', (_, mutate) => { expect(() => dimensions(mutate(webpImage('VP8X')))).toThrow('valid PNG or still WebP') })
  it('rejects missing, duplicate and truncated bitstreams', () => {
    const valid = webpImage('VP8L')
    const part = valid.slice(12)
    for (const bytes of [webp([]), webp([chunk('VP8L', new Uint8Array(4))]), webp([part, part]), webp([chunk('VP8 ', new Uint8Array(9))])]) {
      expect(() => dimensions(bytes)).toThrow()
    }
  })
  it('rejects invalid signatures, unsupported lossless versions, nonkey VP8 and bad padding', () => {
    const lossless = webpImage('VP8L'); lossless[20] = 0
    const version = webpImage('VP8L'); version[24] |= 32
    const vp8 = webpImage('VP8 '); vp8[20] |= 1
    const signature = webpImage('VP8 '); signature[23] = 0
    const padding = webpImage('VP8L'); padding[25] = 1
    for (const bytes of [lossless, version, vp8, signature, padding]) expect(() => dimensions(bytes)).toThrow()
  })
  it('checks chunk bounds after the image and rejects animation chunks', () => {
    const part = webpImage('VP8L').slice(12)
    expect(() => dimensions(webp([part, new Uint8Array([1, 2])]))).toThrow()
    expect(() => dimensions(webp([part, chunk('ANMF', new Uint8Array())]))).toThrow()
    expect(dimensions(webp([part, chunk('EXIF', new Uint8Array([1, 2]))]))).toEqual({ width: 1, height: 1 })
  })
})
