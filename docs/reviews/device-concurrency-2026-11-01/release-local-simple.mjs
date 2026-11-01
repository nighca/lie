import { lstat, readFile, writeFile, rename } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { stateRoot, mainVars, keyPath, plistPath, patchVars } from './release-ops.mjs'

async function safeRoot() { const s=await lstat(stateRoot);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==process.getuid()||(s.mode&0o077))throw Error('Unsafe existing private state root') }
async function privateWrite(name,value) { await writeFile(`${stateRoot}/${name}`,value,{flag:'wx',mode:0o600}) }
async function atomic(path,value,mode) { const temporary=`${path}.cookie-device-release-20261101`;await writeFile(temporary,value,{flag:'wx',mode});await rename(temporary,path) }
async function regular(path) {
  const stat = await lstat(path)
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Local configuration is not a regular file')
}
export async function configureLocal() {
  if (!process.argv.includes('--job-stopped')) throw Error('Original job must be stopped and verified before configuration')
  await safeRoot()
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
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  if(process.argv[3]!=='--approved-20261101')throw Error('Existing user-approved scope flag required')
  const actions={'local-config':configureLocal,'local-restore':restoreLocal}
  const action=actions[process.argv[2]];if(!action)throw Error('Unknown local action')
  action().then(v=>console.log(JSON.stringify(v))).catch(()=>{console.error('Local operation stopped; private backups preserved');process.exitCode=1})
}
