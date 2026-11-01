import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

export const stateRoot = '/Users/nighca/Library/Application Support/LIE/voice-device-release/2026-11-01'
export const mainVars = '/Users/nighca/code/nighca/lie/apps/gateway/.dev.vars'
export const keyPath = '/Users/nighca/code/nighca/lie/.linx-api-key'
export const plistPath = '/Users/nighca/Library/LaunchAgents/dev.nighca.lie.main-preview.plist'
export const deadline = Date.parse('2026-11-01T07:44:30Z')
export function checkTime(now = Date.now()) { if (now >= deadline) throw Error('Approved maintenance deadline reached') }
export function patchVars(source, values) {
  let result = source
  for (const [key, value] of Object.entries(values)) {
    const parts = result.split(/(\r\n|\n|\r)/)
    let found = 0
    for (let i = 0; i < parts.length; i += 2) {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)[ \t]*=/.exec(parts[i])
      if (match?.[1] === key) { found++; parts[i] = `${key}=${JSON.stringify(value)}` }
    }
    if (found > 1) throw Error('Duplicate target configuration key')
    if (found === 1) result = parts.join('')
    else {
      const eol = /\r\n|\n|\r/.exec(result)?.[0] ?? '\n'
      result += `${result.length === 0 || /[\r\n]$/.test(result) ? '' : eol}${key}=${JSON.stringify(value)}${eol}`
    }
  }
  return result
}
async function safeRoot() {
  await mkdir(stateRoot, { recursive: true, mode: 0o700 })
  const stat = await lstat(stateRoot)
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid() || (stat.mode & 0o077)) throw Error('Unsafe private state root')
}
async function privateWrite(name, value) { await writeFile(`${stateRoot}/${name}`, value, { flag: 'wx', mode: 0o600 }) }
async function atomic(path, value, mode) {
  const temporary = `${path}.cookie-device-release-20261101`
  await writeFile(temporary, value, { flag: 'wx', mode })
  await rename(temporary, path)
}
export async function prepare() {
  checkTime(); await safeRoot()
  for (const path of [mainVars, keyPath, plistPath]) { const stat = await lstat(path); if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Private source is not a regular file') }
  await copyFile(mainVars, `${stateRoot}/main-dev-vars.before`, constants.COPYFILE_EXCL)
  await copyFile(plistPath, `${stateRoot}/main-job.before.plist`, constants.COPYFILE_EXCL)
  const { chmod } = await import('node:fs/promises')
  await chmod(`${stateRoot}/main-dev-vars.before`, 0o600); await chmod(`${stateRoot}/main-job.before.plist`, 0o600)
  const local = randomBytes(32).toString('base64url'), production = randomBytes(32).toString('base64url')
  await privateWrite('local-cookie-secret', local)
  await privateWrite('production-cookie-secret', production)
  const key = (await readFile(keyPath, 'utf8')).trim()
  if (!key || Buffer.byteLength(local) < 32 || Buffer.byteLength(production) < 32 || local === production) throw Error('Private configuration validation failed')
  await privateWrite('production-additions.json', JSON.stringify({ LINX_API_KEY: key, VOICE_DEVICE_COOKIE_SECRET: production }))
  await privateWrite('prepared.json', JSON.stringify({ version: 1, createdAt: new Date().toISOString(), distinctSecrets: true, secretBytesValid: true }))
  return { backups: true, distinctSecrets: true, secretBytesValid: true }
}
async function regular(path) {
  const stat = await lstat(path)
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Local configuration is not a regular file')
}
export async function configureLocal() {
  if (!process.argv.includes('--job-stopped')) throw Error('Original job must be stopped and verified before configuration')
  checkTime(); await safeRoot()
  for (const path of [mainVars, plistPath, keyPath]) await regular(path)
  const original = await readFile(`${stateRoot}/main-dev-vars.before`)
  const originalPlist = await readFile(`${stateRoot}/main-job.before.plist`)
  if (!Buffer.from(original.toString('utf8')).equals(original)) throw Error('Original configuration is not lossless UTF-8')
  if (!(await readFile(mainVars)).equals(original) || !(await readFile(plistPath)).equals(originalPlist)) throw Error('Local configuration changed after backup')
  const values = { LINX_API_KEY: (await readFile(keyPath, 'utf8')).trim(), VOICE_DEVICE_COOKIE_SECRET: await readFile(`${stateRoot}/local-cookie-secret`, 'utf8') }
  const desiredVars = Buffer.from(patchVars(original.toString('utf8'), values))
  const desiredPlist = execFileSync('python3', ['-c', `import plistlib,pathlib,sys
p=pathlib.Path(${JSON.stringify(stateRoot + '/main-job.before.plist')})
d=plistlib.loads(p.read_bytes());d.setdefault('EnvironmentVariables',{})['LIE_VOICE_ENVIRONMENT']='local-main'
sys.stdout.buffer.write(plistlib.dumps(d))`], { stdio: ['ignore', 'pipe', 'pipe'] })
  await privateWrite('main-dev-vars.expected', desiredVars)
  await privateWrite('main-job.expected.plist', desiredPlist)
  await atomic(mainVars, desiredVars, 0o600)
  await atomic(plistPath, desiredPlist, 0o600)
  return { localPatched: true, namespace: 'local-main' }
}
export async function restoreLocal() {
  if (!process.argv.includes('--job-stopped')) throw Error('Original job must be stopped and verified before restore')
  await safeRoot()
  for (const [path, name, suffix] of [[mainVars, 'main-dev-vars', ''], [plistPath, 'main-job', '.plist']]) {
    await regular(path)
    const before = await readFile(`${stateRoot}/${name}.before${suffix}`)
    let expected = null
    try { expected = await readFile(`${stateRoot}/${name}.expected${suffix}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
    const current = await readFile(path)
    if (!current.equals(before) && !(expected && current.equals(expected))) throw Error('Local configuration changed outside this execution')
  }
  await atomic(mainVars, await readFile(`${stateRoot}/main-dev-vars.before`), 0o600)
  await atomic(plistPath, await readFile(`${stateRoot}/main-job.before.plist`), 0o600)
  return { localRestored: true }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[3] !== '--approved-20261101') throw Error('Explicit approved execution flag required')
  const actions = { prepare, 'local-config': configureLocal, 'local-restore': restoreLocal }
  const action = actions[process.argv[2]]
  if (!action) throw Error('Unknown release action')
  action().then(result => console.log(JSON.stringify(result))).catch(() => { console.error('Release operation failed; private state preserved and details suppressed'); process.exitCode = 1 })
}
