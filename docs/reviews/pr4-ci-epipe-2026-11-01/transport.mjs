import { Miniflare } from 'miniflare'
const limit = 1024 * 1024
const source = `export default { async fetch(request) {
 const url = new URL(request.url)
 if (url.pathname === '/status') return Response.json({ requests, responses })
 requests++
 if (url.pathname === '/early') { responses++; return Response.json({error:'content_too_large'}, {status:413}) }
 const reader = request.body.getReader(); let size=0
 while (true) { const {done,value}=await reader.read(); if(done)break;size+=value.length; }
 responses++; return Response.json({error:'content_too_large',size}, {status:413})
}}; let requests=0,responses=0;`
const runtime = new Miniflare({ workers: [{ config: {
 name:'pr4-transport-toy', compatibilityDate:'2026-10-23',
 manifest: {mainModule:'index.js',modulesRoot:process.cwd(),modules:{'index.js':{type:'esm',contents:source}}}
} }] })
const result = { node:process.version,platform:process.platform,parentPID:process.pid,cases:[] }
try {
 result.listener = String(await runtime.ready)
 const body = new Uint8Array(limit+1)
 for (const route of ['early','read']) for(let i=0;i<3;i++) {
  try { const response=await runtime.dispatchFetch('https://toy.example/'+route,{method:'POST',body}); result.cases.push({route,transport:'dispatch-array',status:response.status,body:await response.json()}) }
  catch(error) { result.cases.push({route,transport:'dispatch-array',error:error.message,cause:error.cause?.code}) }
 }
 const direct = await runtime.getWorker()
 for(let i=0;i<2;i++) {
  try { const response=await direct.fetch('https://toy.example/early',{method:'POST',body}); result.cases.push({route:'early',transport:'binding',status:response.status,body:await response.json()}) }
  catch(error) { result.cases.push({route:'early',transport:'binding',error:error.message,cause:error.cause?.code}) }
 }
 result.workerCounts = await (await runtime.dispatchFetch('https://toy.example/status')).json()
} finally { await runtime.dispose();result.disposed=true }
console.log(JSON.stringify(result))
