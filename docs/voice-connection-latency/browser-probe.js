(async () => {
 const status = await (await fetch('/__lie/main-status', {cache:'no-store'})).json();
 const v = await import('/@fs/Users/nighca/code/nighca/lie/packages/voice/src/index.ts');
 const {createLiveVoicePort} = await import('/src/application/liveVoice.ts');
 const {createGameController} = await import('/src/application/controller.ts');
 const s = {source:status.sha, prepareRequests:0, events:[], attempts:[], contexts:[], tracks:[], sockets:[], finished:false};
 let controller, pendingOpen;
 const makeContext = () => {const c=new AudioContext();s.contexts.push(c);return c};
 const makeSocket = direct => {
  const url=direct?new URL(direct.url):new URL('/api/voice',location.href);
  if(direct){url.searchParams.set('device-id',direct.deviceId);url.searchParams.set('client-id',direct.clientId)}else url.protocol=location.protocol==='https:'?'wss:':'ws:';
  const n = new WebSocket(url);s.sockets.push(n);
  const w = {get binaryType(){return n.binaryType},set binaryType(x){n.binaryType=x},get readyState(){return n.readyState},onopen:null,onmessage:null,onerror:null,onclose:null,send(d){n.send(typeof d==='string'?d:d.slice().buffer)},close(c,r){n.close(c,r)}};
  n.onopen=()=>w.onopen?.(); n.onmessage=e=>w.onmessage?.({data:e.data}); n.onerror=()=>w.onerror?.();n.onclose=e=>w.onclose?.({code:e.code,reason:e.reason});return w;
 };
 const fixture={id:'latency-probe',title:'连接诊断',summary:'无问答诊断',background:'仅测试连接。',interrogationLimitSeconds:480,characters:[{id:'a',name:'甲',profile:'仅测试连接。'},{id:'b',name:'乙',profile:'仅测试连接。'}],ending:{culpritId:'a',reveal:'诊断'}};
 const port=createLiveVoicePort({createChannel:o=>v.createVoiceChannel({...o,createSocket:()=>makeSocket(o.directConnection)}),createPlayer:v.createPcmPlayer,createContext:makeContext,prepareDevice:signal=>{s.prepareRequests++;return fetch('/api/voice/prepare',{method:'POST',credentials:'same-origin',cache:'no-store',signal})},openMic:o=>v.openMicrophone({...o,createContext:makeContext,getUserMedia:async constraints=>{const stream=await navigator.mediaDevices.getUserMedia(constraints);s.tracks.push(...stream.getTracks());return stream},onFrame:()=>{}}),onStartup:e=>s.events.push(e)});
 const voice = {prepare:()=>port.prepare(),reset:()=>port.reset(),create(scope) {
  const a={outcome:'pending'};s.attempts.push(a);
  const c=port.create(scope);
  return {open() {const t=setTimeout(()=>controller.endConversation(),15000);pendingOpen=c.open().then(()=>{a.outcome=scope.isCurrent()?'ready':'cancelled'},()=>{a.outcome='failed'}).finally(()=>clearTimeout(t));return pendingOpen},close(){c.close()}};
 }};
 controller=createGameController({voice,readGame:async()=>fixture,newSessionId:()=>'local-probe',now:()=>Date.now()});
 await controller.load('latency-probe');controller.start();
 s.cleanup=()=>controller.dispose();
 s.run=async()=>{
  const watchdog=setTimeout(()=>controller.dispose(),90000);
  try {
   await controller.startConversation();if(s.attempts.at(-1)?.outcome!=='ready')throw Error();
   controller.endConversation();
   await controller.startConversation();if(s.attempts.at(-1)?.outcome!=='ready')throw Error();
   controller.selectCharacter('b');await pendingOpen;if(s.attempts.at(-1)?.outcome!=='ready')throw Error();
   s.outcome='complete';
  } catch {s.outcome='stopped-on-first-failure'}
  finally {
   clearTimeout(watchdog);controller.dispose();
   await Promise.allSettled(s.contexts.map(c=>c.state==='closed'?Promise.resolve():c.close()));
   for(const t of s.tracks)t.stop();
   await Promise.all(s.sockets.map(n=>n.readyState===3?Promise.resolve():new Promise(resolve=>{const t=setTimeout(resolve,2000);n.addEventListener('close',()=>{clearTimeout(t);resolve()},{once:true})})));
   s.finished=true;document.querySelector('#latency-run').textContent='诊断已结束，语音资源已释放';
  }
 };
 window.__latencyProbe=s;
 const b=document.createElement('button');b.id='latency-run';b.textContent='开始有界连接诊断';b.style='position:fixed;top:10px;right:10px;z-index:99999;padding:16px';b.onclick=()=>{b.disabled=true;void s.run()};document.body.append(b);
 return {source:s.source,readyToRun:true};
})()
