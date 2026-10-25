export function installPhysicalStart() {
  const api=window.__lieAudioCapture;
  document.getElementById('lie-recording-audio-panel')?.remove();
  const originalCleanup=api.cleanup;
  let pending;
  function onClick(event) {
    const button=event.target.closest?.('.lie-voice__actions button');
    if(!button || button.textContent.trim()!=='开启对话')return;
    if(!event.isTrusted){api.mark('untrusted-click-ignored');return;}
    document.removeEventListener('click',onClick,true);
    clearTimeout(pending);
    api.mark('physical-start-click');
    void api.start().catch(()=>{});
  }
  api.cleanup=async reason=>{clearTimeout(pending);document.removeEventListener('click',onClick,true);return originalCleanup(reason);};
  document.addEventListener('click',onClick,true);
  pending=setTimeout(()=>{void api.cleanup('no-physical-click');},60000);
  return {waitingForPhysicalClick:true};
}

export function makePhysicalTrial(page,cap,recorder,root,io,initialArticles) {
  const result={phase:'waiting-user',questionSent:false,complete:false,initialArticles,errors:[]};
  let spoke=false,stableAt=null; Object.defineProperty(result,'cause',{value:null,writable:true,enumerable:false});
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const evaluate=async expression=>{const r=await cap.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;};
  const state=()=>evaluate(`(()=>{const api=window.__lieAudioCapture;const voice=document.querySelector('.lie-voice');return{clicked:api.events.some(e=>e.type==='phase'&&e.name==='physical-start-click'),closed:api.status().closed,active:voice?.dataset.conversation==='active',status:voice?.dataset.status,articles:document.querySelector('[role=log]')?.querySelectorAll('article').length??0}})()`);
  const save=()=>io.writeFile(root+'/outcome.json',JSON.stringify(result,null,2));
  async function cleanup(reason) {
    try {const controls=page.playwright.getByRole('region',{name:'语音对话控制',exact:true});for(const name of ['结束对话','取消连接']){const b=controls.getByRole('button',{name,exact:true});if(await b.count()===1)await b.click();}}catch(error){result.cause??=error;result.errors.push({stage:'ui-cleanup',category:'exception'});}
    try{await evaluate(`window.__lieAudioCapture.cleanup(${JSON.stringify(reason)})`);}catch(error){result.cause??=error;result.errors.push({stage:'audio-cleanup',category:'exception'});}
    await save();
  }
  async function observe(name) {
    try {
      await recorder.capture(name,async()=>{
        const until=Date.now()+42000;
        while(Date.now()<until){
          const s=await state();
          if(s.closed)throw new Error('Trial stopped by watchdog or capture error');
          if(s.clicked&&s.status==='error')throw new Error('Voice failed after physical click');
          if(s.clicked&&s.active&&!result.questionSent){await evaluate('window.__lieAudioCapture.question()');result.questionSent=true;result.questionAt=Date.now();result.phase='answer-pending';}
          if(result.questionSent){
            if(!s.active)throw new Error('Voice interrupted');
            if(s.status==='speaking')spoke=true;
            if(spoke&&s.status==='recording'&&s.articles>=initialArticles+2){stableAt??=Date.now();if(Date.now()-stableAt>=650){result.complete=true;result.phase='completed';result.transcript=await page.playwright.getByRole('log',{name:'语音转写',exact:true}).innerText();await pause(500);break;}}else stableAt=null;
          }else if(s.clicked)result.phase='connecting';
          await pause(150);
        }
      });
    }catch(error){result.cause??=error;const known=new Map([['Trial stopped by watchdog or capture error','capture-stopped'],['Voice failed after physical click','voice-error'],['Voice interrupted','voice-interrupted']]);result.errors.push({stage:'observe',category:known.get(error?.message)??'exception'});result.phase='failed';}
    if(result.complete||result.phase==='failed')await cleanup('physical-trial-ended');
    await save();return result;
  }
  async function exportAll(){const session=await evaluate('({events:window.__lieAudioCapture.events,status:window.__lieAudioCapture.status()})');await io.writeFile(root+'/session.json',JSON.stringify(session,null,2));for(const name of ['input','output','mix']){const track=await evaluate(`window.__lieAudioCapture.exportPcm(${JSON.stringify(name)})`);await io.writeFile(root+'/'+name+'.wav',Buffer.from(track.base64,'base64'));}await save();return result;}
  return {observe,cleanup,exportAll,result};
}
