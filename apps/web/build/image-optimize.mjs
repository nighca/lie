import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { pamAlpha, pngPixels, webpSize } from './image-codec.mjs'
import { imageCacheDirectory, imageTools, sha256 } from './image-tools.mjs'

const run = promisify(execFile)
export const imagePolicy = 'q90-m6-alpha100-icc-v1'

/** Preserves source bytes; verifies dimensions and exact alpha before using a lossy derivative. */
export async function createImageOptimizer({ cacheDirectory = join(imageCacheDirectory, 'images'), tools = null, command = run, warn = console.warn } = {}) {
  tools ??= await imageTools()
  const stats = { encoded: 0, cached: 0, preserved: 0 }
  await mkdir(cacheDirectory, { recursive: true })
  async function optimize(bytes) {
    const png = pngPixels(bytes)
    if (png == null) { stats.preserved++; warn(`Image optimization preserved PNG ${sha256(bytes).slice(0, 12)}: unsupported format/color semantics or optimization budget`); return { bytes, extension: '.png' } }
    const sourceHash = sha256(bytes), alphaHash = sha256(png.alpha)
    const key = sha256(`${sourceHash}:${tools.identity}:${imagePolicy}`)
    const imagePath = join(cacheDirectory, `${key}.webp`), recordPath = join(cacheDirectory, `${key}.json`)
    try {
      const record = JSON.parse(await readFile(recordPath, 'utf8')), cached = await readFile(imagePath)
      const size = webpSize(cached)
      if (size.width === png.width && size.height === png.height && record?.sourceHash === sourceHash && record.alphaHash === alphaHash && record.width === png.width && record.height === png.height && record.outputHash === sha256(cached) && cached.length < bytes.length) {
        stats.cached++; return { bytes: cached, extension: '.webp' }
      }
    } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError) && !error.message.includes('WebP')) throw error }
    const temporary = await mkdtemp(join(cacheDirectory, 'encode-'))
    try {
      const input = join(temporary, 'source.png'), output = join(temporary, 'image.webp')
      await writeFile(input, bytes)
      await command(tools.cwebp, ['-quiet', '-q', '90', '-m', '6', '-alpha_q', '100', '-metadata', 'icc', input, '-o', output], { timeout: 90000, maxBuffer: 1024 * 1024 })
      const candidate = await readFile(output), size = webpSize(candidate)
      if (size.width !== png.width || size.height !== png.height) throw Error('Encoded image dimensions changed')
      const { stdout } = await command(tools.dwebp, ['-quiet', '-pam', output, '-o', '-'], { encoding: 'buffer', timeout: 30000, maxBuffer: 64 * 1024 * 1024 + 512 })
      if (!pamAlpha(stdout, png.width, png.height).equals(png.alpha)) throw Error('Encoded image alpha changed')
      stats.encoded++
      if (candidate.length >= bytes.length) { stats.preserved++; return { bytes, extension: '.png' } }
      const record = { sourceHash, alphaHash, width: png.width, height: png.height, outputHash: sha256(candidate) }
      await writeFile(join(temporary, 'record.json'), `${JSON.stringify(record)}\n`)
      await rename(output, imagePath)
      await rename(join(temporary, 'record.json'), recordPath)
      return { bytes: candidate, extension: '.webp' }
    } catch (error) {
      stats.preserved++; warn(`Image optimization preserved PNG ${sourceHash.slice(0, 12)}: ${error.message}`)
      return { bytes, extension: '.png' }
    } finally { await rm(temporary, { recursive: true, force: true }) }
  }
  return { optimize, stats }
}
