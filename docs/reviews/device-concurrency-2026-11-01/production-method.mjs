// Historical method for the user-authorized 2026-11-01 production experiment.
// Importing/running this file does not start a connection. A new run needs its own authorization.
// cdpA/cdpB must belong to two newly created IAB tabs already at https://lie.agency/.
export const probeInstaller = `(async () => {
 if (location.origin !== 'https://lie.agency') throw Error('Unexpected origin');
 if (window.__lieP0) throw Error('No repeat runs');
 const started = Date.now();
 const r = {startedAt:new Date(started).toISOString(),openedAtMs:null,helloAtMs:null,readyAtMs:null,closeAtMs:null,closeCode:null,closeWasClean:null,closeReasonEmpty:null,callerClose:false,toolsCalls:0,listenSent:0,audioSentBytes:0,audioReceivedBytes:0,protocolErrors:0};
 const ws = new WebSocket('wss://lie.agency/api/voice'); ws.binaryType='arraybuffer';
 let session=null, hello=false, tools=false, settled=false;
 let resolveReady; const ready=new Promise(resolve=>resolveReady=resolve);
 const p = window.__lieP0 = {r,ws,ready,snapshot:()=>({...r,readyState:ws.readyState,sessionPresent:!!session}),sessionDigest:async()=>session?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(session)))).map(n=>n.toString(16).padStart(2,'0')).join(''):null};
 const elapsed=()=>Date.now()-started;
 const send=v=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(v));};
 const finishReady=()=>{if(hello&&tools&&!settled){settled=true;r.readyAtMs=elapsed();resolveReady({ready:true});}};
 const hardTimer=setTimeout(()=>{r.callerClose=true;ws.close(1000,'P0 test deadline');},Math.max(0,DEADLINE-Date.now()));
 ws.onopen=()=>{r.openedAtMs=elapsed();send({type:'hello',version:1,transport:'websocket',features:{mcp:true},audio_params:{format:'pcm',sample_rate:16000,channels:1,bit_depth:16,endianness:'little',frame_duration:20,frame_size:320,sample_format:'signed_int16'}});};
 ws.onclose=e=>{r.closeAtMs=elapsed();r.closeCode=e.code;r.closeWasClean=e.wasClean;r.closeReasonEmpty=e.reason==='';clearTimeout(hardTimer);if(!settled){settled=true;resolveReady({ready:false,closed:true});}};
 ws.onerror=()=>{r.protocolErrors++;};
 ws.onmessage=e=>{if(typeof e.data!=='string'){r.audioReceivedBytes+=e.data.byteLength??0;return;} let m;try{m=JSON.parse(e.data);}catch{r.protocolErrors++;return;}
 if(m.type==='hello'){hello=true;r.helloAtMs=elapsed();session=typeof m.session_id==='string'?m.session_id:null;finishReady();}
 const q=m.type==='mcp'?m.payload:null;if(q?.id==null)return;
 if(q.method==='initialize')send({type:'mcp',payload:{jsonrpc:'2.0',id:q.id,result:{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'lie-p0-connection-only',version:'1'}}}});
 else if(q.method==='tools/list'){send({type:'mcp',payload:{jsonrpc:'2.0',id:q.id,result:{tools:[{name:'self.lie_character_context',description:'Connection-only synthetic test context. No conversation is requested.',inputSchema:{type:'object',properties:{},additionalProperties:false}}],nextCursor:null}}});tools=true;finishReady();}
 else {if(q.method==='tools/call')r.toolsCalls++;send({type:'mcp',payload:{jsonrpc:'2.0',id:q.id,error:{code:-32601,message:'No inference tool enabled in connection-only test'}}});}
 };
 const t=setTimeout(()=>{if(!settled){settled=true;resolveReady({ready:false,timeout:true});}},10000);
 const result=await ready;clearTimeout(t);return result;
})()`;

export async function runOnce(cdpA, cdpB) {
  const runStarted = Date.now();
  const deadline = runStarted + 30000;
  const runEvidence = { startedAt: new Date(runStarted).toISOString(), endpoint: 'wss://lie.agency/api/voice', method: 'two-IAB-pages-native-WebSocket', pageBuild: '98d71fb9ebc2f517010598c4796c8db3014a73c7', hardDeadlineMs: 30000, holdMs: 3000 };
  try {
    const aOpen = await cdpA.send('Runtime.evaluate', { expression: probeInstaller.replace('DEADLINE', String(deadline)), awaitPromise: true, returnByValue: true }, { timeoutMs: 14000 });
    runEvidence.aReadyResult = aOpen.result?.value ?? null;
    if (!aOpen.result?.value?.ready) throw Error('A did not become ready; no retry');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const aBefore = await cdpA.send('Runtime.evaluate', { expression: 'window.__lieP0.snapshot()', returnByValue: true });
    runEvidence.aBeforeB = aBefore.result?.value ?? null;
    runEvidence.bStartedAtMs = Date.now() - runStarted;
    const bOpen = await cdpB.send('Runtime.evaluate', { expression: probeInstaller.replace('DEADLINE', String(deadline)), awaitPromise: true, returnByValue: true }, { timeoutMs: 14000 });
    runEvidence.bReadyResult = bOpen.result?.value ?? null;
    if (!bOpen.result?.value?.ready) throw Error('B did not become ready; no retry');
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (e) {
    runEvidence.error = String(e?.message ?? e);
  } finally {
    const preResults = await Promise.all([cdpA, cdpB].map(c => c.send('Runtime.evaluate', { expression: 'window.__lieP0 ? window.__lieP0.snapshot() : null', returnByValue: true })));
    runEvidence.beforeCleanup = preResults.map(x => x.result?.value ?? null);
    let digestResults = await Promise.all([cdpA, cdpB].map(c => c.send('Runtime.evaluate', { expression: 'window.__lieP0 ? window.__lieP0.sessionDigest() : null', awaitPromise: true, returnByValue: true })));
    runEvidence.distinctHelloSessions = Boolean(digestResults[0].result?.value && digestResults[1].result?.value && digestResults[0].result.value !== digestResults[1].result.value);
    digestResults = null;
    const closeResults = await Promise.all([cdpA, cdpB].map(c => c.send('Runtime.evaluate', {
      expression: `(async()=>{const p=window.__lieP0;if(!p)return null;if(p.ws.readyState!==WebSocket.CLOSED){p.r.callerClose=true;p.ws.close(1000,'P0 test complete');await new Promise(resolve=>{const t=setTimeout(resolve,3000);p.ws.addEventListener('close',()=>{clearTimeout(t);resolve();},{once:true});});}return p.snapshot();})()`,
      awaitPromise: true, returnByValue: true
    }, { timeoutMs: 5000 })));
    runEvidence.afterCleanup = closeResults.map(x => x.result?.value ?? null);
    runEvidence.finishedAt = new Date().toISOString();
    runEvidence.elapsedMs = Date.now() - runStarted;
  }
  return runEvidence;
}
