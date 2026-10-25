import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const root = fileURLToPath(new URL('../../../', import.meta.url))
export const imageCacheDirectory = join(root, 'tmp/image-build')
export const toolReleases = {
  'darwin-arm64': {
    name: 'mac-arm64', archive: 'bc6bf84cc70f3f8574fba797d1e4a7dea4feebe9fa4be919f202413ea2b3b8f2',
    cwebp: '07ba910950253f18ca227d085848ff39be530f6ef22005e778cd48d4850734f2', dwebp: '7b341872a316596df8e517b6d5b1bcb9e2ca6b6489521d328f2db38d22881ca6'
  },
  'linux-x64': {
    name: 'linux-x86-64', archive: '1c5ffab71efecefa0e3c23516c3a3a1dccb45cc310ae1095c6f14ae268e38067',
    cwebp: '5ac7ece6bdda1587f3c169ce74ab2734994f9d14e07fc5358208443c1b29edec', dwebp: 'f4b035afc457f08d18124c822e554af5f8537c9e6c1e0e4a871297f90eda145b'
  }
}
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

/** Downloads only the pinned official release into the ignored build cache. */
export async function imageTools(cacheDirectory = imageCacheDirectory) {
  const platform = `${process.platform}-${process.arch}`, release = toolReleases[platform]
  if (release == null) throw Error(`Image build tools are not configured for ${platform}`)
  const directory = join(cacheDirectory, `libwebp-1.6.0-${release.name}`)
  const tools = { cwebp: join(directory, 'cwebp'), dwebp: join(directory, 'dwebp'), identity: `${platform}:${release.cwebp}:${release.dwebp}` }
  async function valid() {
    try { return (await Promise.all(['cwebp', 'dwebp'].map(async name => sha256(await readFile(tools[name])) === release[name]))).every(Boolean) }
    catch (error) { if (error.code !== 'ENOENT') throw error; return false }
  }
  if (!await valid()) {
    await mkdir(cacheDirectory, { recursive: true })
    const temporary = await mkdtemp(join(cacheDirectory, 'install-'))
    try {
      const archiveName = `libwebp-1.6.0-${release.name}`
      const response = await fetch(`https://storage.googleapis.com/downloads.webmproject.org/releases/webp/${archiveName}.tar.gz`, { signal: AbortSignal.timeout(60000) })
      if (!response.ok) throw Error(`Image tools download failed: HTTP ${response.status}`)
      const archive = Buffer.from(await response.arrayBuffer())
      if (archive.length > 16 * 1024 * 1024 || sha256(archive) !== release.archive) throw Error('Image tools archive checksum mismatch')
      const archivePath = join(temporary, 'release.tar.gz')
      await writeFile(archivePath, archive)
      await run('tar', ['-xzf', archivePath, '-C', temporary, '--strip-components=2', `${archiveName}/bin/cwebp`, `${archiveName}/bin/dwebp`], { timeout: 20000 })
      for (const name of ['cwebp', 'dwebp']) if (sha256(await readFile(join(temporary, name))) !== release[name]) throw Error(`Image tool checksum mismatch: ${name}`)
      await mkdir(directory, { recursive: true })
      for (const name of ['cwebp', 'dwebp']) await rename(join(temporary, name), tools[name])
    } finally { await rm(temporary, { recursive: true, force: true }) }
  }
  const { stdout } = await run(tools.cwebp, ['-version'], { timeout: 5000 })
  if (stdout.split('\n')[0].trim() !== '1.6.0') throw Error('Unexpected image encoder version')
  return tools
}
