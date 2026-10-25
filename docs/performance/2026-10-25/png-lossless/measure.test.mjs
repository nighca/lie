import assert from 'node:assert/strict'
import { test } from 'node:test'
import { crc32, deflateSync } from 'node:zlib'

import { parsePng, pixels, recompressPng } from './measure.mjs'

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
function chunk(type, data = Buffer.alloc(0)) {
  const out = Buffer.alloc(data.length + 12)
  out.writeUInt32BE(data.length); out.write(type, 4); data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, -4)), out.length - 4)
  return out
}
function fixture() {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1); ihdr.writeUInt32BE(5, 4); ihdr[8] = 8; ihdr[9] = 6
  const compressed = deflateSync(Buffer.from([0,10,20,30,40,1,10,20,30,40,2,0,0,0,0,3,5,10,15,20,4,0,0,0,0]))
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('gAMA', Buffer.from([0,0,177,143])), chunk('tEXt', Buffer.from('note\0keep')), chunk('IDAT', compressed.subarray(0, 5)), chunk('IDAT', compressed.subarray(5)), chunk('IEND')])
}

test('checks the independent standard CRC vector', () => assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926))
test('decodes all five PNG row filters against known RGBA values', () => assert.deepEqual(pixels(parsePng(fixture())), Buffer.from(Array(5).fill([10,20,30,40]).flat())))
test('decodes Sub with a previous pixel rather than a previous channel', () => assert.deepEqual(pixels({width:2,height:1,filtered:Buffer.from([1,1,2,3,4,10,20,30,40])}),Buffer.from([1,2,3,4,11,22,33,44])))
test('actually constructs valid recompressed bytes and preserves metadata chunks and scanlines', () => {
  const before = parsePng(fixture()), result = recompressPng(fixture()), after = parsePng(result.output)
  assert.deepEqual(after.filtered,before.filtered)
  assert.deepEqual(after.chunks.filter(c=>c.type!=='IDAT').map(c=>c.raw),before.chunks.filter(c=>c.type!=='IDAT').map(c=>c.raw))
  assert.equal(after.chunks.filter(c=>c.type==='IDAT').length,1)
})
test('rejects corrupted source CRCs', () => { const input=fixture();input[input.indexOf('IDAT')+4]^=1;assert.throws(()=>parsePng(input),/CRC/) })
test('rejects truncated chunk boundaries and trailing bytes', () => {
  assert.throws(()=>parsePng(fixture().subarray(0,-3)),/truncated|boundary/)
  assert.throws(()=>parsePng(Buffer.concat([fixture(),Buffer.from([0])])),/trailing/)
})
test('rejects split noncontiguous IDAT chunks', () => {
  const {chunks}=parsePng(fixture())
  const input=Buffer.concat([signature,...chunks.flatMap(c=>c.type==='IDAT'?[c.raw,chunk('tEXt',Buffer.from('note\0split'))]:[c.raw])])
  assert.throws(()=>parsePng(input),/contiguous/)
})
test('rejects image formats outside the measured corpus instead of claiming equivalence', () => {
  const {chunks}=parsePng(fixture()), ihdr=Buffer.from(chunks[0].data);ihdr[12]=1
  assert.throws(()=>parsePng(Buffer.concat([signature,chunk('IHDR',ihdr),...chunks.slice(1).map(c=>c.raw)])),/RGBA8/)
})
