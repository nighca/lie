import { afterEach, expect, it, vi } from 'vitest'
import { createGameController } from '../../apps/web/src/application/controller'
import { createLiveVoicePort } from '../../apps/web/src/application/liveVoice'
import { observeNavigationLifecycle } from '../../apps/web/src/application/navigationLifecycle'
import { createVoiceChannel } from '../../packages/voice/src/channel'
import { game } from '../../apps/web/test/helpers'
async function settle() { for(let i=0;i<30;i++) await Promise.resolve() }
afterEach(()=>vi.useRealTimers())
it('hidden cancels pending status; visible does not restart; old status arriving after explicit ready reconnect cannot create resources or interrupt it',async()=>{
 vi.useFakeTimers();vi.setSystemTime(0)
 const statuses:{resolve:(r:Response)=>void}[]=[];const sockets:any[]=[];const contexts:any[]=[];const mics:any[]=[]
 const port=createLiveVoicePort({fetchStatus:()=>new Promise<Response>(resolve=>statuses.push({resolve})),createChannel(options){return createVoiceChannel({...options,createSocket(){const s:any={readyState:0,binaryType:'arraybuffer',onopen:null,onmessage:null,onclose:null,onerror:null,send:vi.fn(),close:vi.fn()};sockets.push(s);return s}})},createContext(){const c:any={state:'running',resume:async()=>{},close:vi.fn(async()=>{c.state='closed'})};contexts.push(c);return c},createPlayer(){return{enqueue(){},stop(){}}},async openMic(){const m={stop:vi.fn(async()=>{})};mics.push(m);return m}})
 const controller=createGameController({voice:port,readGame:async()=>({...game,interrogationLimitSeconds:1}),newSessionId:()=> 'hidden-pending',now:()=>Date.now(),clock:{now:()=>Date.now(),setTimeout,clearTimeout}})
 let current:typeof controller|null=controller;const page=Object.assign(new EventTarget(),{hidden:false});const browser=new EventTarget();let discards=0,restores=0
 const lifecycle=observeNavigationLifecycle(()=>current,()=>{discards++;current?.dispose();current=null},()=>{restores++},page as unknown as Document,browser as unknown as Window)
 const unsub=controller.subscribe(lifecycle.sync)
 try{
  await controller.load('test');controller.start();const old=controller.startConversation();expect(statuses).toHaveLength(1)
  page.hidden=true;page.dispatchEvent(new Event('visibilitychange'));expect(controller.getView()).toMatchObject({busy:false,conversationActive:false,interrogationRemainingMs:1000});expect(sockets).toHaveLength(0)
  page.hidden=false;page.dispatchEvent(new Event('visibilitychange'));expect(statuses).toHaveLength(1)
  const next=controller.startConversation();expect(statuses).toHaveLength(2)
  statuses[1].resolve(Response.json({status:'ready'}));await settle();expect(sockets).toHaveLength(1);sockets[0].readyState=1;sockets[0].onopen();
  const message=(v:unknown)=>sockets[0].onmessage({data:JSON.stringify(v)})
  message({type:'hello',transport:'websocket',audio_params:{format:'pcm',channels:1,sample_rate:16000}});message({type:'mcp',payload:{id:1,method:'tools/list'}});await settle();await next
  expect(controller.getView()).toMatchObject({busy:false,conversationActive:true,voiceStatus:'recording',interrogationRemainingMs:1000})
  statuses[0].resolve(Response.json({status:'ready'}));await old;await settle();expect(contexts).toHaveLength(1);expect(mics).toHaveLength(1);expect(sockets).toHaveLength(1);expect(controller.getView().conversationActive).toBe(true)
  message({type:'stt',text:'new conversation only'});await vi.advanceTimersByTimeAsync(50)
  page.hidden=true;page.dispatchEvent(new Event('visibilitychange'));expect(controller.getView()).toMatchObject({conversationActive:false,interrogationRemainingMs:950,history:[{text:'new conversation only'}]});expect(contexts[0].close).toHaveBeenCalledOnce();expect(mics[0].stop).toHaveBeenCalledOnce();expect(sockets[0].close).toHaveBeenCalledOnce()
  browser.dispatchEvent(new Event('pagehide'));expect(discards).toBe(1);const shown=Object.assign(new Event('pageshow'),{persisted:true});browser.dispatchEvent(shown);expect(restores).toBe(1);expect(vi.getTimerCount()).toBe(0)
 }finally{unsub();lifecycle.dispose();controller.dispose()}
})
