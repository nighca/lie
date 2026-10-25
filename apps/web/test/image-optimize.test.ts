// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { crc32 } from 'node:zlib'

import { expect, it } from 'vitest'

import { pamAlpha, pngPixels, webpSize } from '../build/image-codec.mjs'
import { createImageOptimizer } from '../build/image-optimize.mjs'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAIElEQVR4nGP4z8Dwn+E/QwOIYogSkXP4////fwYGBgYAfS4JRQuL124AAAAASUVORK5CYII=', 'base64')
const alpha = Buffer.from([255, 128, 0, 64, 255, 0])
const tools = { cwebp: 'encoder', dwebp: 'decoder', identity: 'test-codec-v1' }
const webp = Buffer.alloc(30)
webp.write('RIFF', 0); webp.writeUInt32LE(22, 4); webp.write('WEBPVP8X', 8); webp.writeUInt32LE(10, 16); webp[20] = 16; webp.writeUIntLE(2, 24, 3); webp.writeUIntLE(1, 27, 3)
function pam(values = alpha) {
  const header = Buffer.from('P7\nWIDTH 3\nHEIGHT 2\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n'), pixels = Buffer.alloc(24)
  for (let i = 0; i < 6; i++) pixels[i * 4 + 3] = values[i]
  return Buffer.concat([header, pixels])
}

it('extracts exact source alpha including invisible pixels and rejects broken source CRC', () => {
  expect(pngPixels(png)).toEqual({ width: 3, height: 2, alpha })
  expect(pamAlpha(pam(), 3, 2)).toEqual(alpha)
  expect(webpSize(webp)).toEqual({ width: 3, height: 2 })
  const damaged = Buffer.from(png); damaged[45] ^= 1
  expect(() => pngPixels(damaged)).toThrow('CRC')
  expect(() => pamAlpha(pam(), 4, 2)).toThrow('dimensions')
  expect(() => webpSize(webp.subarray(0, -1))).toThrow('container')
})

it('caches verified alpha and codec identity, and re-encodes corrupted cache output', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-image-cache-'))
  let calls = 0
  const command = async (file: string, args: string[]) => {
    calls++
    if (file === tools.cwebp) { expect(args.slice(0, 9)).toEqual(['-quiet', '-q', '90', '-m', '6', '-alpha_q', '100', '-metadata', 'icc']); await writeFile(args.at(-1)!, webp); return { stdout: Buffer.alloc(0) } }
    return { stdout: pam() }
  }
  try {
    const first = await createImageOptimizer({ cacheDirectory: directory, tools, command })
    expect(await first.optimize(png)).toEqual({ bytes: webp, extension: '.webp' })
    expect(first.stats).toEqual({ encoded: 1, cached: 0, preserved: 0 })
    const warm = await createImageOptimizer({ cacheDirectory: directory, tools, command })
    expect(await warm.optimize(png)).toEqual({ bytes: webp, extension: '.webp' })
    expect(calls).toBe(2)
    expect(warm.stats.cached).toBe(1)
    const { readdir } = await import('node:fs/promises')
    const record = (await readdir(directory)).find(name => name.endsWith('.json'))!
    await writeFile(join(directory, record), 'null')
    expect((await warm.optimize(png)).bytes).toEqual(webp)
    expect(calls).toBe(4)
    const image = (await readdir(directory)).find(name => name.endsWith('.webp'))!
    await writeFile(join(directory, image), Buffer.from('broken'))
    expect((await warm.optimize(png)).bytes).toEqual(webp)
    expect(calls).toBe(6)
    const changed = await createImageOptimizer({ cacheDirectory: directory, tools: { ...tools, identity: 'test-codec-v2' }, command })
    await changed.optimize(png)
    expect(changed.stats.encoded).toBe(1)
    expect(calls).toBe(8)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

it('preserves original PNG with a warning on encoder failure or alpha mismatch', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-image-fallback-'))
  const warnings: string[] = []
  try {
    const mismatch = await createImageOptimizer({ cacheDirectory: directory, tools, warn: message => warnings.push(message), command: async (file, args) => {
      if (file === tools.cwebp) { expect(args.slice(0, 9)).toEqual(['-quiet', '-q', '90', '-m', '6', '-alpha_q', '100', '-metadata', 'icc']); await writeFile(args.at(-1)!, webp); return { stdout: Buffer.alloc(0) } }
      return { stdout: pam(Buffer.alloc(6, 255)) }
    } })
    expect(await mismatch.optimize(png)).toEqual({ bytes: png, extension: '.png' })
    expect(warnings[0]).toContain('alpha changed')
    const failed = await createImageOptimizer({ cacheDirectory: directory, tools, warn: message => warnings.push(message), command: async () => { throw Error('encoder timeout') } })
    expect(await failed.optimize(png)).toEqual({ bytes: png, extension: '.png' })
    expect(warnings[1]).toContain('encoder timeout')
  } finally { await rm(directory, { recursive: true, force: true }) }
})


it('preserves valid source PNGs outside the reviewed color/size eligibility instead of imposing art export rules', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lie-image-ineligible-'))
  const warnings: string[] = []
  const chunk = Buffer.alloc(16); chunk.writeUInt32BE(4); chunk.write('gAMA', 4); chunk.writeUInt32BE(45455, 8); chunk.writeUInt32BE(crc32(chunk.subarray(4, 12)), 12)
  const color = Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)])
  const large = Buffer.from(png); large.writeUInt32BE(8193, 16); large.writeUInt32BE(crc32(large.subarray(12, 29)), 29)
  try {
    const optimizer = await createImageOptimizer({ cacheDirectory: directory, tools, command: async () => { throw Error('ineligible image must not be encoded') }, warn: message => warnings.push(message) })
    expect(await optimizer.optimize(color)).toEqual({ bytes: color, extension: '.png' })
    expect(await optimizer.optimize(large)).toEqual({ bytes: large, extension: '.png' })
    expect(warnings).toHaveLength(2)
    expect(optimizer.stats.preserved).toBe(2)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
