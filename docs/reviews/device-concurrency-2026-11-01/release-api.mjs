import { readFile, writeFile, rename } from 'node:fs/promises'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'
import { stateRoot, keyPath, deadline } from './release-ops.mjs'

export class Budget {
  constructor(counters = {}) { this.c = { http: 0, logical: 0, upgrades: 0, socketMs: 0, ...counters } }
  http(n, cleanup = false) { if (this.c.http + n > (cleanup ? 24 : 20)) throw Error('HTTP budget exhausted'); this.c.http += n }
  ws() { if (this.c.logical >= 6 || this.c.upgrades + 2 > 12 || this.c.socketMs >= 90000) throw Error('WS budget exhausted'); this.c.logical++; this.c.upgrades += 2; this.http(1) }
}
const ledgerPath = `${stateRoot}/api-ledger.json`
let ledger, budget, key, signing, phaseStart, cleanupDeadline = Infinity, phaseUsed = 0, lastTick = Date.now(), queue = Promise.resolve()
const live = new Set(), allChannels = []
let priorChannels = []
export function validHello(m) { return m.transport === 'websocket' && typeof m.session_id === 'string' && m.session_id.length > 0 && m.audio_params?.format === 'pcm' && m.audio_params.sample_rate === 16000 && m.audio_params.channels === 1 && (m.audio_params.bits_per_sample ?? m.audio_params.bit_depth ?? 16) === 16 }
export function validCookieAttributes(value) { return /(?:^|;)\s*HttpOnly(?:;|$)/i.test(value) && /(?:^|;)\s*Secure(?:;|$)/i.test(value) && /(?:^|;)\s*SameSite=Lax(?:;|$)/i.test(value) && /(?:^|;)\s*Path=\/(?:;|$)/i.test(value) }
export function replacementProven(old, newer) { return old.closed && old.code === 1000 && !old.callerClose && !old.limitClose && !old.terminated && old.closedAt >= newer.startedAt }
function stopAll(reason) { for (const item of live) { item.limitClose = true; item.ws.close(1000,reason) } }
function check(cleanup = false) { if ((cleanup && Date.now() >= cleanupDeadline) || Date.now() >= deadline - (cleanup ? 0 : 60000) || (!cleanup && phaseUsed + Date.now() - phaseStart >= 240000)) throw Error('Approved phase deadline reached') }
async function save() { ledger.channels=[...priorChannels,...allChannels.map(i=>({startedAt:i.startedAt,closedAt:i.closedAt,closeCode:i.code,callerClose:i.callerClose,limitClose:i.limitClose,terminated:i.terminated}))]; ledger.counters = budget.c; const value = JSON.stringify(ledger); queue = queue.then(async () => { const temp = `${ledgerPath}.${process.pid}.tmp`; await writeFile(temp, value, { mode: 0o600 }); await rename(temp, ledgerPath) }); return queue }
export function advanceSocketCounter(counters, previous, now, count) { counters.socketMs += Math.max(0,now-previous)*count; return now }
function tick() { const now = Date.now(); lastTick = advanceSocketCounter(budget.c,lastTick,now,live.size); if (budget.c.socketMs >= 88000) stopAll('Approved aggregate close reserve') }
export function requestTimeout(requested, phaseRemaining, globalRemaining, cleanupRemaining = Infinity) {
  const result = Math.min(requested, phaseRemaining, globalRemaining, cleanupRemaining)
  if (result <= 0) throw Error('Request deadline exhausted')
  return result
}
export function canUnbind(jar) { return jar.preflightUnbound && jar.prepareAttempted && jar.bound && !jar.prepareUncertain && !jar.cleaned }
async function request(url, options = {}, cleanup = false, requested = 8000) {
  check(cleanup)
  const timeout = requestTimeout(requested, cleanup ? Infinity : 240000-phaseUsed-(Date.now()-phaseStart), deadline-Date.now()-(cleanup?0:60000), cleanup?cleanupDeadline-Date.now():Infinity)
  const response = await fetch(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(timeout) })
  check(cleanup)
  if (!response.ok) throw Error(`HTTP stage rejected (${response.status})`)
  return response
}
async function provider(url, options, cleanup = false) { check(cleanup); budget.http(1, cleanup); await save(); return (await request(url, options, cleanup)).json() }
function cookieDevice(cookie) {
  const value = cookie.slice(cookie.indexOf('=') + 1), [payload, signature, extra] = value.split('.')
  if (extra || !payload || !signature) throw Error('Invalid owned Cookie')
  const expected = createHmac('sha256', signing).update(payload).digest(), actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw Error('Cookie signing identity mismatch')
  const d = JSON.parse(Buffer.from(payload, 'base64url').toString())
  if (d.v !== 1 || d.environment !== 'production:https' || !/^[0-9a-f]{2}(?::[0-9a-f]{2}){5}$/.test(d.deviceId) || typeof d.clientId !== 'string') throw Error('Unexpected Cookie identity')
  return d
}
async function status(origin, jar = null) {
  const response = await request(origin + '/api/voice/status', { headers: { Origin: origin, ...(jar ? { Cookie: jar.cookie } : {}) } })
  if ((await response.json()).status !== 'ready') throw Error('Runtime configuration unavailable')
  const setCookie = response.headers.get('set-cookie')
  if (!setCookie || !validCookieAttributes(setCookie)) throw Error('Owned Cookie security attributes failed')
  const cookie = setCookie.split(';')[0]
  if (!cookie?.startsWith('__Host-lie-device=')) throw Error('Owned HttpOnly Cookie missing')
  const d = cookieDevice(cookie)
  if (jar && (d.deviceId !== jar.mac || d.clientId !== jar.client)) throw Error('Identity changed across approved origins')
  return { cookie, mac: d.deviceId, client: d.clientId, preflightUnbound: false, prepareAttempted: false, bound: false }
}
async function initialize(origin, label) {
  if (ledger.jars.length >= 2) throw Error('Device count limit reached')
  const jar = await status(origin); jar.label = label; ledger.jars.push(jar); await save()
  const ota = await provider('https://xrobo.qiniuapi.com/v1/ota/', { method: 'POST', headers: { 'Content-Type':'application/json','Activation-Version':'1','Device-Id':jar.mac,'Client-Id':jar.client,'User-Agent':'lie-browser/1' }, body:JSON.stringify({mac_address:jar.mac,uuid:jar.client,application:{version:'1',elf_sha256:'0'.repeat(64)},board:{type:'lie-browser',ssid:'web',rssi:0}}) })
  if (ota.websocket?.token || !/^\d{6}$/.test(ota.activation?.code ?? '')) throw Error('Candidate was bound or unknown before owned preparation; protected')
  jar.preflightUnbound = true; budget.http(4); jar.prepareAttempted = true; jar.prepareUncertain = true; await save()
  const response = await request(origin + '/api/voice/prepare', { method:'POST',headers:{Origin:origin,Cookie:jar.cookie} }, false, 20000)
  if (response.status !== 204 || response.headers.has('set-cookie')) throw Error('Preparation contract failed')
  jar.bound = true; jar.prepareUncertain = false; await save(); return jar
}
async function connect(origin, jar, replacementOf = null) {
  check(); tick(); budget.ws(); await save()
  if (replacementOf && (replacementOf.closed || replacementOf.ws.readyState !== WebSocket.OPEN)) throw Error('Old socket not open immediately before replacement dial')
  const startedAt = Date.now()
  const ws = new WebSocket(origin.replace(/^https:/,'wss:') + '/api/voice', { headers:{Origin:origin,Cookie:jar.cookie},handshakeTimeout:10000,followRedirects:false })
  const item = { ws, hello:false, tools:false, closed:false, code:null, closeExpected:false, terminated:false, callerClose:false, limitClose:false, startedAt, closedAt:null }
  tick(); budget.c.socketMs += Date.now()-startedAt; allChannels.push(item);live.add(item)
  item.closedPromise = new Promise(resolve=>ws.once('close',(code)=>{tick();live.delete(item);item.closed=true;item.code=code;item.closedAt=Date.now();if(code!==1000||item.terminated)ledger.normalClose=false;resolve();void save()}))
  item.timer=setTimeout(()=>{item.limitClose=true;ws.close(1000,'Approved per-socket close reserve')},14000)
  ws.once('close',()=>clearTimeout(item.timer))
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Hello/MCP deadline')),10000)
    const done=()=>{if(item.hello&&item.tools){clearTimeout(timer);resolve()}}
    ws.once('error',()=>{clearTimeout(timer);reject(Error('WebSocket transport rejected'))})
    ws.once('close',()=>{clearTimeout(timer);if(!item.hello||!item.tools)reject(Error('Closed before hello/MCP'))})
    ws.on('open',()=>ws.send(JSON.stringify({type:'hello',version:1,features:{mcp:true},transport:'websocket',audio_params:{format:'pcm',sample_rate:16000,channels:1}})))
    ws.on('message',(bytes,binary)=>{
      if(binary){ledger.unexpectedFrames=(ledger.unexpectedFrames??0)+1;stopAll('Unexpected generated binary');reject(Error('Unexpected binary'));return}
      let m;try{m=JSON.parse(String(bytes))}catch{return}
      if(m.type==='tts'){ledger.unexpectedFrames=(ledger.unexpectedFrames??0)+1;stopAll('Unexpected generated TTS');reject(Error('Unexpected TTS'));return}
      if(m.type==='hello'){if(!validHello(m)){ledger.unexpectedFrames=(ledger.unexpectedFrames??0)+1;stopAll('Invalid hello');reject(Error('Invalid hello'));return}item.hello=true;done()}
      if(m.type==='mcp'&&m.payload?.method){const p=m.payload;let result
        if(p.method==='initialize')result={protocolVersion:'2024-11-05',capabilities:{tools:{}},clientInfo:{name:'lie-owned-api-acceptance',version:'1'}}
        else if(p.method==='tools/list'){result={tools:[{name:'self.lie_character_context',description:'No inference in this acceptance',inputSchema:{type:'object',properties:{}}}]};item.tools=true}
        else {ledger.unexpectedFrames=(ledger.unexpectedFrames??0)+1;stopAll('Unauthorized MCP method');reject(Error('Unauthorized MCP method'));return}
        ws.send(JSON.stringify({type:'mcp',payload:{jsonrpc:'2.0',id:p.id,result}}));done()
      }
    })
  })
  return item
}
async function close(item) { if (!item.closed) {item.callerClose=true;item.ws.close(1000,'Owned acceptance complete')}; await Promise.race([item.closedPromise,new Promise(resolve=>setTimeout(resolve,1800))]); if(!item.closed){item.terminated=true;item.ws.terminate();await Promise.race([item.closedPromise,new Promise(resolve=>setTimeout(resolve,500))]);throw Error('Owned socket normal close unconfirmed')} if(item.code!==1000||item.terminated)throw Error('Owned socket closed abnormally') }
async function closeAll() { for(const item of [...live]) {try{await close(item)}catch{ledger.normalClose=false}};tick();await save() }
async function cleanup() {
  await closeAll()
  if(ledger.normalClose===false)throw Error('Normal socket close not confirmed before unbind')
  for (const jar of ledger.jars) {
    if (!canUnbind(jar)) continue
    const value = await provider('https://xrobo.qiniu.com/xiaozhi/device/unbind', { method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({deviceId:jar.mac}) }, true)
    if(value.code!==0)throw Error('Owned unbind unconfirmed')
    jar.cleaned=true;jar.bound=false;await save()
  }
  if(ledger.jars.some(j=>j.prepareUncertain)||!ledger.jars.every(j=>j.cleaned))throw Error('Uncertain or protected candidate retained; cleanup incomplete')
}
export async function run(mode, target) {
  if (!['candidate','smoke','cleanup'].includes(mode)) throw Error('Unknown API phase')
  const origin=mode==='cleanup'?null:new URL(target).origin
  if (mode==='candidate'&&!/^https:\/\/[a-f0-9]{8}-lie-game\.nighca\.workers\.dev$/.test(origin))throw Error('Unexpected candidate origin')
  if (mode==='smoke'&&origin!=='https://lie.agency')throw Error('Unexpected production origin')
  check(mode==='cleanup'); key=(await readFile(keyPath,'utf8')).trim();signing=await readFile(`${stateRoot}/production-cookie-secret`,'utf8')
  if(mode==='candidate') {ledger={version:1,startedAt:new Date().toISOString(),origin,jars:[],counters:{},normalClose:true,phaseUsed:0};await writeFile(ledgerPath,JSON.stringify(ledger),{flag:'wx',mode:0o600})}
  else ledger=JSON.parse(await readFile(ledgerPath,'utf8'))
  priorChannels=ledger.channels??[];budget=new Budget(ledger.counters);if(mode==='cleanup')cleanupDeadline=Date.now()+60000;phaseUsed=ledger.phaseUsed??0;phaseStart=Date.now()
  const clock=setInterval(()=>{tick();if(Date.now()>=deadline||phaseUsed+Date.now()-phaseStart>=240000)stopAll('Approved window ended');void save()},250)
  try {
    if(mode==='candidate') {
      const a=await initialize(origin,'A'),b=await initialize(origin,'B')
      const a1=await connect(origin,a),b1=await connect(origin,b),a2=await connect(origin,a,a1)
      await Promise.race([a1.closedPromise,new Promise(resolve=>setTimeout(resolve,1500))])
      if(!replacementProven(a1,a2)||b1.closed||a2.closed)throw Error('Provider identity replacement/isolation failed')
      check();
      await closeAll()
      if(ledger.normalClose===false||ledger.unexpectedFrames)throw Error('Silent normal-close acceptance failed')
      ledger.candidatePassed=true
    } else if(mode==='smoke') {
      const old=ledger.jars[0];if(!ledger.candidatePassed||old.cleaned)throw Error('Owned candidate identity unavailable')
      const jar=await status(origin,old);await close(await connect(origin,jar));ledger.productionPassed=true
    } else await cleanup()
    if(ledger.unexpectedFrames||ledger.normalClose===false)throw Error('Unexpected output or abnormal closure')
    ledger.phaseUsed=phaseUsed+Date.now()-phaseStart;await save()
    return {phase:mode,passed:true,deviceCount:ledger.jars.length,uncertainPreparations:ledger.jars.filter(j=>j.prepareUncertain).length,counters:budget.c,normalClose:ledger.normalClose,allOwnedBindingsRemoved:ledger.jars.every(j=>j.cleaned)}
  } finally { clearInterval(clock);await closeAll();ledger.phaseUsed=phaseUsed+Date.now()-phaseStart;await save();key=null;signing=null }
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  if(process.argv[4]!=='--approved-20261101')throw Error('Explicit approved API flag required')
  run(process.argv[2],process.argv[3]).then(v=>console.log(JSON.stringify(v))).catch(()=>{console.error('API acceptance stopped; private ledger preserved; cleanup/owner review required');process.exitCode=1})
}
