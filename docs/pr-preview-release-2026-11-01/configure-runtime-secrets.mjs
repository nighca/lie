import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { chmod, lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

const fields = ['LINX_API_KEY', 'LINX_AGENT_ID', 'LINX_WS_TOKEN']
const requireThat = (condition, message) => { if (!condition) throw new Error(message) }

/** Use only after the resource owner has approved this exact local development source. */
export async function configureRuntimeSecrets(source, stateDirectory, run = execFileSync) {
  requireThat(isAbsolute(source) && isAbsolute(stateDirectory), 'Explicit approved absolute paths are required')
  const stat = await lstat(source)
  requireThat(stat.isFile() && (stat.mode & 0o077) === 0, 'Approved secret source must be a private regular file')
  const content = await readFile(source, 'utf8')
  requireThat(fields.every(field => content.split(/\r?\n/).filter(line => new RegExp(`^\\s*(?:export\\s+)?${field}\\s*=`).test(line)).length === 1), 'Approved development fields must each have exactly one assignment')
  const values = parseEnv(content)
  requireThat(fields.every(field => typeof values[field] === 'string' && values[field].length > 0 && !/[\s\u0000-\u001f\u007f]/.test(values[field])), 'Approved development fields contain an empty or invalid value')
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 })
  const directoryStat = await lstat(stateDirectory)
  requireThat(directoryStat.isDirectory(), 'Private state directory must not be a symlink')
  await chmod(stateDirectory, 0o700)
  const keyPath = join(stateDirectory, 'cookie-signing.key')
  let signingKey
  try {
    const keyStat = await lstat(keyPath)
    requireThat(keyStat.isFile() && (keyStat.mode & 0o077) === 0, 'Existing preview signing source is not private')
    signingKey = await readFile(keyPath, 'utf8')
    requireThat(Buffer.byteLength(signingKey) >= 32, 'Existing preview signing source is invalid')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    signingKey = randomBytes(48).toString('base64url')
    await writeFile(keyPath, signingKey, { mode: 0o600, flag: 'wx' })
  }
  const result = { repository: 'nighca/lie', environment: 'pr-preview', updatedAt: new Date().toISOString(), configured: [], unknownField: null }
  for (const [field, value] of [...fields.map(field => [field, values[field]]), ['VOICE_DEVICE_COOKIE_SECRET', signingKey]]) {
    const name = `PR_PREVIEW_${field}`
    result.unknownField = name
    await writeFile(join(stateDirectory, 'configuration-result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 })
    try {
      run('gh', ['secret', 'set', name, '--repo', 'nighca/lie', '--env', 'pr-preview'], {
        input: value, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000
      })
    } catch {
      await writeFile(join(stateDirectory, 'configuration-result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 })
      throw new Error(`Could not configure ${name}; previous successful fields are recorded privately`)
    }
    result.configured.push(name)
    result.unknownField = null
    await writeFile(join(stateDirectory, 'configuration-result.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 })
  }
  return result
}

if (process.argv[1] != null && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  configureRuntimeSecrets(process.argv[2], process.argv[3]).then(result => console.log(JSON.stringify(result))).catch(() => {
    console.error('Preview runtime configuration failed; no credential values are logged')
    process.exitCode = 1
  })
}
