import { lstat, readFile, writeFile, rename, open } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFile, execFileSync, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { stateRoot, mainVars, keyPath, plistPath, patchVars } from './release-ops.mjs'
import { readWindow, windowFileArgument } from './release-window-v2.mjs'

const exec = promisify(execFile)
const cf = '/Users/nighca/.codex/worktrees/b1b9/lie/node_modules/.bin/cf'
const bridgeVersion = '3e83c77c-85f8-40b8-abe7-6ce0340513a7'
const candidateCwd = '/Users/nighca/.codex/worktrees/b1b9/lie/apps/gateway'
const env = { ...process.env, PATH: '/Users/nighca/Library/Application Support/LIE/runtime/node-v24.22.1-darwin-arm64/bin:' + process.env.PATH }
async function regular(path) { const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink())throw Error('Expected regular owned file') }
async function secureState() { const s=await lstat(stateRoot);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==process.getuid()||(s.mode&0o077))throw Error('Unsafe existing private state root') }
async function privateJson(path,value) { await writeFile(path,JSON.stringify(value),{flag:'wx',mode:0o600}) }
async function atomic(path,value) { const p=`${path}.release-v2-${process.pid}`;await writeFile(p,value,{flag:'wx',mode:0o600});await rename(p,path) }
export function allowedCurrent(current,before,expected) { return current.equals(before)||current.equals(expected) }
export function uploadTimeout(window) { const remaining=window.remaining()-300000-90000;const value=Math.min(300000,remaining);if(value<30000)throw Error('Insufficient window for upload and CI/API reserves');return value }
async function metadata(args,window,cleanup=false) { const r=await exec(cf,args,{env,timeout:window.timeout(30000,{cleanup}),maxBuffer:8*1024*1024});return JSON.parse(r.stdout) }
export function parseRows(value,key) { if(Array.isArray(value))return value;if(value&&typeof value==='object'&&Array.isArray(value[key]))return value[key];throw Error('Unrecognized Cloudflare list response') }
export function selectPreviousCandidate(value) { const versions=parseRows(value,'versions');if(!versions.every(v=>v&&typeof v.id==='string'&&v.annotations&&typeof v.annotations==='object'))throw Error('Malformed version metadata');const matches=versions.filter(v=>v.annotations['workers/tag']==='cookie-device-candidate-20261101');if(matches.length>1)throw Error('Ambiguous previous candidate tag');return {versions,previous:matches[0]??null} }
export function uploadDecision(state,windowId,attempted) { if(state.windowId!==windowId)throw Error('Reconciliation belongs to another window');if(state.previous)return 'reuse';if(attempted)throw Error('Upload already attempted; no automatic retry');return 'upload' }
async function serving(window,cleanup=false) {
  const list=parseRows(await metadata(['workers','deployments','list','--worker','lie-game','--per-page','1'],window,cleanup),'deployments')
  if(list[0]?.versions?.length!==1||list[0].versions[0].version_id!==bridgeVersion||list[0].versions[0].percentage!==100)throw Error('Active bridge baseline changed')
  return {deploymentId:list[0].id,versionId:bridgeVersion}
}
export function candidateProjection(d,id) {
  if(d?.id!==id||!Array.isArray(d.bindings)||!Array.isArray(d.urls)||!d.annotations||typeof d.annotations['workers/tag']!=='string')throw Error('Malformed candidate metadata')
  const names=d.bindings.filter(b=>b?.type==='secret_text').map(b=>b.name)
  if(!['LINX_API_KEY','LINX_WS_TOKEN','LINX_AGENT_ID','VOICE_DEVICE_COOKIE_SECRET'].every(n=>names.includes(n)))throw Error('Candidate secret names incomplete')
  const expected=`https://${id.slice(0,8)}-lie-game.nighca.workers.dev`
  const url=d.urls.find(u=>u===expected||u===expected+'/')
  if(!url)throw Error('Exact candidate version URL unavailable')
  return {versionId:id,url:new URL(url).origin,tag:d.annotations['workers/tag']}
}
async function candidateInfo(id,window) { return candidateProjection(await metadata(['workers','versions','get',id,'--worker-id','lie-game'],window),id) }
export async function reconcile(window) {
  window.assertActive();await secureState()
  const baseline=await serving(window)
  const selected=selectPreviousCandidate(await metadata(['workers','versions','list','--worker-id','lie-game','--per-page','100'],window))
  const versions=selected.versions
  const previous=selected.previous?await candidateInfo(selected.previous.id,window):null
  const value={windowId:window.id,baseline,previous,oldUploadStatus:previous?'reconciled':'unknown-no-match-in-bounded-list',checkedVersions:versions.length}
  await privateJson(`${stateRoot}/${window.id}-reconcile.json`,value)
  return value
}
async function loggedCli(args,path,timeout) {
  const log=await open(path,'wx',0o600)
  try {
    return await new Promise((resolve,reject)=>{
      const child=spawn(cf,args,{cwd:candidateCwd,env,stdio:['ignore',log.fd,log.fd]})
      let expired=false,killTimer=null
      const timer=setTimeout(()=>{expired=true;child.kill('SIGTERM');killTimer=setTimeout(()=>{if(child.exitCode==null&&child.signalCode==null)child.kill('SIGKILL')},1500)},timeout)
      child.once('error',()=>{clearTimeout(timer);if(killTimer)clearTimeout(killTimer);reject(Error('Owned CLI failed to start'))})
      child.once('close',code=>{clearTimeout(timer);if(killTimer)clearTimeout(killTimer);resolve({exitCode:code,timedOut:expired})})
    })
  } finally {await log.close()}
}
export async function uploadCandidate(window) {
  window.assertActive();await secureState()
  const file=`${stateRoot}/${window.id}-reconcile.json`;await regular(file)
  const state=JSON.parse(await readFile(file,'utf8'))
  let attempted=false
  try {await regular(`${stateRoot}/${window.id}-upload-attempt.json`);attempted=true}catch(error){if(error.code!=='ENOENT')throw error}
  const decision=uploadDecision(state,window.id,attempted)
  await serving(window)
  if(decision==='reuse')return {...state.previous,reusedPrevious:true}
  const config=await readFile(`${candidateCwd}/.cloudflare/output/v0/workers/default/worker.config.json`)
  if(createHash('sha256').update(config).digest('hex')!=='ec7b79444a257358fbe9b02936a0c99ee2f2b7dfb7d5a4456a9308bf57dc78fc')throw Error('Frozen c9d237 Worker configuration identity changed')
  const bundle=await readFile(`${candidateCwd}/.cloudflare/output/v0/workers/default/bundle/index.js`)
  if(createHash('sha256').update(bundle).digest('hex')!=='a66d427a5f0cb3a06af250b68fa05aa2b6bed80181a7b7549cfa57e87db54024')throw Error('Frozen c9d237 Worker build identity changed')
  const web=await readFile(`${candidateCwd}/../web/dist/assets/index-BZgfvAh0.js`)
  if(createHash('sha256').update(web).digest('hex')!=='145af4cc12419b75cb3ec890d7561818a130c0a62ff9eaf92a18b5c5cc1d354f')throw Error('Frozen c9d237 Web identity changed')
  const tag=`cookie-device-${window.id}`
  const args=['workers','versions','create','--prebuilt','--mode','production','--worker','lie-game','--tag',tag,'--message','Reviewed c9d237 Cookie Device candidate; explicit new window, no traffic activation']
  const dry=await loggedCli([...args,'--dry-run'],`${stateRoot}/${window.id}-candidate-dry-run.log`,window.timeout(60000))
  if(dry.exitCode!==0||dry.timedOut)throw Error('Candidate dry-run failed')
  window.assertActive();const timeout=uploadTimeout(window)
  await privateJson(`${stateRoot}/${window.id}-upload-attempt.json`,{windowId:window.id,tag,startedAt:new Date().toISOString(),timeout})
  const logPath=`${stateRoot}/${window.id}-candidate-upload.log`
  const result=await loggedCli(args,logPath,timeout)
  const text=await readFile(logPath,'utf8')
  const id=/Worker Version ID:\s*([0-9a-f-]{36})/.exec(text)?.[1]
  if(result.exitCode!==0||result.timedOut||!id){await privateJson(`${stateRoot}/${window.id}-upload-unknown.json`,{...result,tag,status:'uploadunknown'});throw Error('Candidate upload unknown; no automatic retry')}
  const info=await candidateInfo(id,window)
  if(info.tag!==tag)throw Error('Returned candidate tag mismatch')
  await serving(window)
  await privateJson(`${stateRoot}/${window.id}-candidate.json`,{...info,windowId:window.id})
  return {...info,...result,reusedPrevious:false}
}
export async function configureLocal(window,{jobStopped=false}={}) {
  window.assertActive();await secureState();if(!jobStopped)throw Error('Owner-confirmed stopped job required')
  for(const path of [mainVars,plistPath,keyPath])await regular(path)
  const before=await readFile(`${stateRoot}/main-dev-vars.before`),beforePlist=await readFile(`${stateRoot}/main-job.before.plist`)
  if(!Buffer.from(before.toString('utf8')).equals(before))throw Error('Original vars are not lossless UTF8')
  const key=(await readFile(keyPath,'utf8')).trim(),secret=await readFile(`${stateRoot}/local-cookie-secret`,'utf8')
  if(!key||Buffer.byteLength(secret)<32)throw Error('Existing approved local key/secret unavailable')
  const expected=Buffer.from(patchVars(before.toString('utf8'),{LINX_API_KEY:key,VOICE_DEVICE_COOKIE_SECRET:secret}))
  const expectedPlist=execFileSync('python3',['-c',`import plistlib,pathlib,sys\np=pathlib.Path(${JSON.stringify(stateRoot+'/main-job.before.plist')});d=plistlib.loads(p.read_bytes());d.setdefault('EnvironmentVariables',{})['LIE_VOICE_ENVIRONMENT']='local-main';sys.stdout.buffer.write(plistlib.dumps(d))`],{stdio:['ignore','pipe','pipe']})
  for(const [name,value] of [['main-dev-vars.expected',expected],['main-job.expected.plist',expectedPlist]]){
    try{await writeFile(`${stateRoot}/${name}`,value,{flag:'wx',mode:0o600})}catch(error){if(error.code!=='EEXIST'||!(await readFile(`${stateRoot}/${name}`)).equals(value))throw Error('Existing expected configuration conflict')}
  }
  if(!allowedCurrent(await readFile(mainVars),before,expected)||!allowedCurrent(await readFile(plistPath),beforePlist,expectedPlist))throw Error('External configuration change')
  window.assertActive();await atomic(mainVars,expected);window.assertActive();await atomic(plistPath,expectedPlist)
  return {localConfigured:true,namespace:'local-main',secretsRegenerated:false}
}
export async function restoreLocal(window,{jobStopped=false}={}) {
  window.assertActive(true);await secureState();if(!jobStopped)throw Error('Owner-confirmed stopped job required')
  const files=[[mainVars,'main-dev-vars',''],[plistPath,'main-job','.plist']]
  const originals=[]
  for(const [path,name,suffix] of files){
    await regular(path);const before=await readFile(`${stateRoot}/${name}.before${suffix}`)
    let expected=before;try{expected=await readFile(`${stateRoot}/${name}.expected${suffix}`)}catch(error){if(error.code!=='ENOENT')throw error}
    if(!allowedCurrent(await readFile(path),before,expected))throw Error('External configuration change prevents restore')
    originals.push([path,before])
  }
  for(const [path,before] of originals){window.assertActive(true);await atomic(path,before)}
  return {localRestored:true}
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  if(!process.argv.includes('--approved-20261101'))throw Error('User-approved scope flag required')
  const window=await readWindow(windowFileArgument(process.argv.slice(2)))
  const actions={reconcile,upload:uploadCandidate,'local-config':w=>configureLocal(w,{jobStopped:process.argv.includes('--job-stopped')}),'local-restore':w=>restoreLocal(w,{jobStopped:process.argv.includes('--job-stopped')})}
  const action=actions[process.argv[2]];if(!action)throw Error('Unknown release action')
  action(window).then(value=>console.log(JSON.stringify(value))).catch(()=>{console.error('Release v2 stopped; private state preserved, no automatic retry');process.exitCode=1})
}
